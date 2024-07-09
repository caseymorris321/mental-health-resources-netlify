import React, { useState, useEffect } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { useAuth0 } from '@auth0/auth0-react';

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
    tags: ''
  });

  const isProduction = process.env.REACT_APP_ENV === 'production';
  const apiUrl = process.env.REACT_APP_API_URL || (isProduction ? '/.netlify/functions' : 'http://localhost:4000');

  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (initialData) {
      setResource({
        ...initialData,
        tags: initialData.tags ? initialData.tags.join(', ') : '',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setResource({ ...resource, [name]: value });
    
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
    }
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
            tags: ''
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
          rows="1"
          name="name"
          value={resource.name}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          required
          autoFocus={isCreate}
        />
      </Form.Group>
      <Form.Group>
        <Form.Label>Description</Form.Label>
        <textarea
          className="form-control"
          name="description"
          value={resource.description}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          required
        />
      </Form.Group>
      <Form.Group>
        <Form.Label>Link</Form.Label>
        <textarea
          className="form-control"
          rows="1"
          name="link"
          value={resource.link}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="e.g., www.example.com or leave empty"
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
          rows="1"
          name="contactInfo"
          value={resource.contactInfo}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
      </Form.Group>
      <Form.Group>
        <Form.Label>Address</Form.Label>
        <textarea
          className="form-control"
          rows="1"
          name="address"
          value={resource.address}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
      </Form.Group>
      <Form.Group>
        <Form.Label>Available Hours</Form.Label>
        <textarea
          className="form-control"
          rows="1"
          name="availableHours"
          value={resource.availableHours}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
      </Form.Group>
      <Form.Group>
        <Form.Label>Tags (comma-separated)</Form.Label>
        <textarea
          className="form-control"
          rows="1"
          name="tags"
          value={resource.tags}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
      </Form.Group>
      <Button variant="primary" type="submit" className='mt-2'>
        {initialData ? 'Update Resource' : 'Create Resource'}
      </Button>
    </Form>
  );
};

export default CreateResourceForm;
