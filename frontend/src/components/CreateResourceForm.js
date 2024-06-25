import React, { useState, useEffect } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { useAuth0 } from '@auth0/auth0-react';

const CreateResourceForm = ({ onSubmit, initialData, categories, subCategories, isCreate }) => {
  const { getAccessTokenSilently } = useAuth0();
  const [resource, setResource] = useState({
    name: '',
    description: '',
    link: '',
    category: '',
    subCategory: '',
    contactInfo: '',
    address: '',
    availableHours: '',
    tags: ''
  });

  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (initialData) {
      setResource({
        ...initialData,
        tags: initialData.tags.join(', ')
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    setResource({ ...resource, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = await getAccessTokenSilently();
      const url = initialData
        ? `http://localhost:4000/api/resources/${initialData._id}`
        : 'http://localhost:4000/api/resources';
      const method = initialData ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...resource,
          tags: resource.tags.split(',').map(tag => tag.trim()),
          link: resource.link ? resource.link.trim() : undefined
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
            category: '',
            subCategory: '',
            contactInfo: '',
            address: '',
            availableHours: '',
            tags: ''
          });
        }
        setTimeout(() => setMessage(null), 5000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${initialData ? 'update' : 'create'} resource`);
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
        <Form.Control as="select" name="category" value={resource.category} onChange={handleChange} required>
          <option value="">Select a category</option>
          {categories.map(cat => (
            <option key={cat._id} value={cat.name}>{cat.name}</option>
          ))}
        </Form.Control>
      </Form.Group>
      <Form.Group>
        <Form.Label>Sub-Category</Form.Label>
        <Form.Control as="select" name="subCategory" value={resource.subCategory} onChange={handleChange} required>
          <option value="">Select a sub-category</option>
          {subCategories
            .filter(subCat => subCat.category === resource.category)
            .map(subCat => (
              <option key={subCat._id} value={subCat.name}>{subCat.name}</option>
            ))}
        </Form.Control>
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