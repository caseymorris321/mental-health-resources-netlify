import React, { useState, useEffect, useRef } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { useAuth0 } from '@auth0/auth0-react';
import { fetchCities, fetchStates } from '../API/fetchLocationData';


const CreateResourceForm = ({ onSubmit, initialData, isCreate, category, subCategory }) => {
  const { getAccessTokenSilently } = useAuth0();
  const [resource, setResource] = useState({
    name: '',
    description: '',
    link: '',
    category: category || initialData?.category || '',
    subCategory: subCategory || initialData?.subCategory || '',
    contactInfo: '',
    address: '',
    availableHours: '',
    city: '',
    state: '',
    tags: ''
  });
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [selectedCityIndex, setSelectedCityIndex] = useState(0);
  const selectedItemRef = useRef(null);


  useEffect(() => {
    fetchStates().then(statesData => {
      setStates(statesData);
    });
  }, []);

  useEffect(() => {
    if (!initialData || resource.state !== initialData.state) {
      setResource(prevResource => ({ ...prevResource, city: '' }));
      setCities([]);
    } else if (initialData && resource.state === initialData.state) {
      fetchCities(resource.state).then(fetchedCities => {
        setCities(fetchedCities);
        if (initialData.city) {
          const cityIndex = fetchedCities.findIndex(city => city.name.toLowerCase() === initialData.city.toLowerCase());
          if (cityIndex !== -1) {
            setSelectedCityIndex(cityIndex);
          }
        }
      });
    }
  }, [resource.state, initialData]);


  useEffect(() => {
    if (initialData) {
      const updatedResource = {
        ...initialData,
        tags: initialData.tags ? initialData.tags.join(', ') : '',
      };
      setResource(updatedResource);

      if (initialData.state) {
        fetchCities(initialData.state).then(fetchedCities => {
          setCities(fetchedCities);
          if (initialData.city) {
            const cityIndex = fetchedCities.findIndex(city => city.name.toLowerCase() === initialData.city.toLowerCase());
            if (cityIndex !== -1) {
              setSelectedCityIndex(cityIndex);
            }
          }
        });
      }

      setTimeout(() => {
        document.querySelectorAll('textarea').forEach(adjustTextareaHeight);
      }, 0);
    }
  }, [initialData]);




  const isProduction = process.env.REACT_APP_ENV === 'production';
  const apiUrl = process.env.REACT_APP_API_URL || (isProduction ? '/.netlify/functions' : 'http://localhost:4000');

  const [message, setMessage] = useState(null);

  // Automatically adjust textarea height when typing
  const adjustTextareaHeight = (element) => {
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setResource({ ...resource, [name]: value });
    adjustTextareaHeight(e.target);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = await getAccessTokenSilently();
      const fetchUrl = initialData
        ? (isProduction ? `${apiUrl}/updateResource/${initialData._id}` : `${apiUrl}/api/resources/${initialData._id}`)
        : (isProduction ? `${apiUrl}/createResource` : `${apiUrl}/api/resources`);
      const method = initialData ? 'PUT' : 'POST';

      const response = await fetch(fetchUrl, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...resource,
          tags: resource.tags.split(',').map(tag => tag.trim()),
          link: resource.link ? resource.link.trim() : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(initialData ? 'Resource updated:' : 'Resource created:', data);
        setMessage({ type: 'success', text: initialData ? 'Resource updated successfully!' : 'Resource created successfully!' });
        onSubmit(data);
        if (!initialData) {
          setResource({
            name: '',
            description: '',
            link: '',
            category: resource.category,
            subCategory: resource.subCategory,
            contactInfo: '',
            address: '',
            availableHours: '',
            tags: '',
            state: '',
            city: '',
          });
        }
        setTimeout(() => setMessage(null), 5000);
      } else {
        const errorData = await response.json();
        if (errorData.message && errorData.message.includes('duplicate key error')) {
          throw new Error(`A resource with the name "${resource.name}" already exists in the "${resource.category}" category and "${resource.subCategory}" subcategory.`);
        } else {
          throw new Error(errorData.message || `Failed to ${initialData ? 'update' : 'create'} resource`);
        }
      }
    } catch (error) {
      setMessage({ type: 'danger', text: error.message || `Failed to ${initialData ? 'update' : 'create'} resource. Please try again.` });
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      {message && <Alert variant={message.type}>{message.text}</Alert>}
      <Form.Group>
        <Form.Label>Name</Form.Label>
        <textarea
          className="form-control"
          name="name"
          value={resource.name}
          onChange={handleChange}
          required
          autoFocus={isCreate}
          style={{ overflow: 'hidden', resize: 'none' }}
          ref={(el) => el && adjustTextareaHeight(el)}
        />
      </Form.Group>
      <Form.Group>
        <Form.Label>Description</Form.Label>
        <textarea
          className="form-control"
          name="description"
          value={resource.description}
          onChange={handleChange}
          required
          style={{ overflow: 'hidden', resize: 'none' }}
          ref={(el) => el && adjustTextareaHeight(el)}
        />
      </Form.Group>
      <Form.Group>
        <Form.Label>Link</Form.Label>
        <textarea
          className="form-control"
          name="link"
          value={resource.link}
          onChange={handleChange}
          placeholder="e.g., www.example.com or leave empty"
          style={{ overflow: 'hidden', resize: 'none' }}
          ref={(el) => el && adjustTextareaHeight(el)}
        />
      </Form.Group>
      <Form.Group>
        <Form.Label>Category</Form.Label>
        <Form.Control
          type="text"
          name="category"
          value={resource.category}
          readOnly
          disabled
        />
      </Form.Group>
      <Form.Group>
        <Form.Label>Sub-Category</Form.Label>
        <Form.Control
          type="text"
          name="subCategory"
          value={resource.subCategory}
          readOnly
          disabled
        />
      </Form.Group>
      <Form.Group>
        <Form.Label>Contact Info</Form.Label>
        <textarea
          className="form-control"
          name="contactInfo"
          value={resource.contactInfo}
          onChange={handleChange}
          style={{ overflow: 'hidden', resize: 'none' }}
          ref={(el) => el && adjustTextareaHeight(el)}
        />
      </Form.Group>
      <Form.Group>
        <Form.Label>Address</Form.Label>
        <textarea
          className="form-control"
          name="address"
          value={resource.address}
          onChange={handleChange}
          style={{ overflow: 'hidden', resize: 'none' }}
          ref={(el) => el && adjustTextareaHeight(el)}
        />
      </Form.Group>
      <Form.Group>
        <Form.Label>Available Hours</Form.Label>
        <textarea
          className="form-control"
          name="availableHours"
          value={resource.availableHours}
          onChange={handleChange}
          style={{ overflow: 'hidden', resize: 'none' }}
          ref={(el) => el && adjustTextareaHeight(el)}
        />
      </Form.Group>
      <Form.Group>
        <Form.Label>State</Form.Label>
        <Form.Control
          as="select"
          name="state"
          value={resource.state}
          onChange={handleChange}
        >
          <option value="">Select a state</option>
          {states.map((state) => (
            <option key={state.abbreviation} value={state.abbreviation}>
              {state.name}
            </option>
          ))}
        </Form.Control>
      </Form.Group>

      <Form.Group>
        <Form.Label>City</Form.Label>
        <div className="position-relative">
          <Form.Control
            type="text"
            name="city"
            value={resource.city}
            onChange={(e) => {
              const value = e.target.value;
              setResource({ ...resource, city: value });
              const filteredCities = cities.filter(city =>
                city.name.toLowerCase().startsWith(value.toLowerCase())
              );
              setCities(filteredCities);
              setShowCityDropdown(true);
              const currentIndex = filteredCities.findIndex(city => city.name.toLowerCase() === value.toLowerCase());
              setSelectedCityIndex(currentIndex !== -1 ? currentIndex : 0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown' && selectedCityIndex < cities.length - 1) {
                setSelectedCityIndex(prevIndex => prevIndex + 1);
                setResource({ ...resource, city: cities[selectedCityIndex + 1].name });
              } else if (e.key === 'ArrowUp' && selectedCityIndex > 0) {
                setSelectedCityIndex(prevIndex => prevIndex - 1);
                setResource({ ...resource, city: cities[selectedCityIndex - 1].name });
              } else if (e.key === 'Enter' && cities.length > 0) {
                e.preventDefault();
                setResource({ ...resource, city: cities[selectedCityIndex].name });
                setShowCityDropdown(false);
              }
            }}
            onFocus={() => {
              if (resource.state) {
                fetchCities(resource.state).then(fetchedCities => {
                  setCities(fetchedCities);
                  const selectedIndex = fetchedCities.findIndex(city => city.name.toLowerCase() === resource.city.toLowerCase());
                  setSelectedCityIndex(selectedIndex !== -1 ? selectedIndex : 0);
                  setShowCityDropdown(true);
                  setTimeout(() => {
                    if (selectedItemRef.current) {
                      selectedItemRef.current.scrollIntoView({ behavior: 'instant', block: 'start' });
                    }
                  }, 0);
                });
              }
            }}
            onBlur={() => {
              setTimeout(() => setShowCityDropdown(false), 200);
            }}

            disabled={!resource.state}
          />
          {showCityDropdown && cities.length > 0 && (
            <ul className="list-group position-absolute w-100" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
              {cities.map((city, index) => (
                <li
                  key={city.name}
                  ref={index === selectedCityIndex ? selectedItemRef : null}
                  className={`list-group-item ${index === selectedCityIndex ? 'active' : ''}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                  }}
                  onClick={() => {
                    setResource({ ...resource, city: city.name });
                    setShowCityDropdown(false);
                  }}
                  onMouseEnter={() => setSelectedCityIndex(index)}
                >
                  {city.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Form.Group>

      <Form.Group>
        <Form.Label>Tags (comma-separated)</Form.Label>
        <textarea
          className="form-control"
          name="tags"
          value={resource.tags}
          onChange={handleChange}
          style={{ overflow: 'hidden', resize: 'none' }}
          ref={(el) => el && adjustTextareaHeight(el)}
        />
      </Form.Group>
      <Button variant="primary" type="submit" className='mt-2'>
        {initialData ? 'Update Resource' : 'Create Resource'}
      </Button>
    </Form>
  );
};

export default CreateResourceForm;
