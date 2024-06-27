import React, { useState, useEffect, useCallback } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { useAuth0 } from '@auth0/auth0-react';

const CreateResourceForm = ({ onSubmit, initialData, isCreate, category, subCategory }) => {
  const { getAccessTokenSilently } = useAuth0();
  const [error, setError] = useState(null);
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

  const handleChange = useCallback((e) => {
    setResource((prevResource) => ({
      ...prevResource,
      [e.target.name]: e.target.value,
    }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); // Clear any previous errors
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
          name: resource.name,
          description: resource.description,
          link: resource.link,
          category: resource.category,
          subCategory: resource.subCategory,
          contactInfo: resource.contactInfo,
          address: resource.address,
          availableHours: resource.availableHours,
          tags: resource.tags.split(',').map(tag => tag.trim())
        }),
      });

      if (response.ok) {
        const data = await response.json();
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
      } else {
        const errorData = await response.json();
        if (response.status === 409 || errorData.message.includes('duplicate key error')) {
          setError('A resource with this name already exists in this subcategory.');
        } else {
          setError(errorData.message || `Failed to ${initialData ? 'update' : 'create'} resource`);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setError(`Failed to ${initialData ? 'update' : 'create'} resource. Please try again.`);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      {error && <Alert variant="danger">{error}</Alert>}
      {message && <Alert variant={message.type}>{message.text}</Alert>}
      <Form.Group>
        <Form.Label>Name</Form.Label>
        <Form.Control
          type="text"
          name="name"
          value={resource.name}
          onChange={handleChange}
          required
          autoFocus={isCreate}
        />
      </Form.Group>
      <Form.Group>
        <Form.Label>Description</Form.Label>
        <Form.Control as="textarea" name="description" value={resource.description} onChange={handleChange} required />
      </Form.Group>
      <Form.Group>
        <Form.Label>Link</Form.Label>
        <Form.Control type="text" name="link" value={resource.link} onChange={handleChange} placeholder="e.g., www.example.com or leave empty" />
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
        <Form.Control type="text" name="contactInfo" value={resource.contactInfo} onChange={handleChange} />
      </Form.Group>
      <Form.Group>
        <Form.Label>Address</Form.Label>
        <Form.Control type="text" name="address" value={resource.address} onChange={handleChange} />
      </Form.Group>
      <Form.Group>
        <Form.Label>Available Hours</Form.Label>
        <Form.Control type="text" name="availableHours" value={resource.availableHours} onChange={handleChange} />
      </Form.Group>
      <Form.Group>
        <Form.Label>Tags (comma-separated)</Form.Label>
        <Form.Control type="text" name="tags" value={resource.tags} onChange={handleChange} />
      </Form.Group>
      <Button variant="primary" type="submit" className='mt-2'>
        {initialData ? 'Update Resource' : 'Create Resource'}
      </Button>
    </Form>
  );
};

export default CreateResourceForm;