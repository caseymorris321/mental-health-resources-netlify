import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import ResourceDetails from '../components/Resources/ResourceDetails';
import { Button, Modal } from 'react-bootstrap';
import CreateResourceForm from '../components/CreateResourceForm';

const ResourceDetailsPage = () => {
  const { id } = useParams();
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [resource, setResource] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [error, setError] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const navigate = useNavigate();

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';

  const fetchResource = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/api/resources/${id}`);
      if (response.ok) {
        const data = await response.json();
        setResource(data);
      } else {
        throw new Error('Failed to fetch resource');
      }
    } catch (error) {
      console.error('Error fetching resource:', error);
      setError(error.message);
    }
  }, [id]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await  fetch(`${apiUrl}/api/resources/categories`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  const fetchSubCategories = useCallback(async () => {
    try {
      const response = await  fetch(`${apiUrl}/api/resources/subcategories`);
      if (response.ok) {
        const data = await response.json();
        setSubCategories(data);
      }
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    }
  }, []);

  useEffect(() => {
    fetchResource();
    if (isAuthenticated) {
      fetchCategories();
      fetchSubCategories();
    }
  }, [fetchResource, fetchCategories, fetchSubCategories, isAuthenticated]);

  const handleGoBack = () => {
    navigate('/');
  };

  const handleUpdate = async (updatedResource) => {
    if (!isAuthenticated) return;
    try {
      const token = await getAccessTokenSilently();
      const response = await  fetch(`${apiUrl}/api/resources/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedResource),
      });
      if (response.ok) {
        const data = await response.json();
        setResource(data);
        setShowUpdateModal(false);
      } else {
        throw new Error('Failed to update resource');
      }
    } catch (error) {
      console.error('Error updating resource:', error);
      setError(error.message);
    }
  };

  const handleDelete = async () => {
    if (!isAuthenticated) return;
    if (window.confirm('Are you sure you want to delete this resource?')) {
      try {
        const token = await getAccessTokenSilently();
        const response = await  fetch(`${apiUrl}/api/resources/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          navigate('/');
        } else {
          throw new Error('Failed to delete resource');
        }
      } catch (error) {
        console.error('Error deleting resource:', error);
        setError(error.message);
      }
    }
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="container">
      <h2>Resource Details</h2>
      {resource ? (
        <>
          <ResourceDetails
            resource={resource}
            onUpdate={() => setShowUpdateModal(true)}
            onDelete={handleDelete}
            showAdminControls={isAuthenticated}
          />
          {isAuthenticated && (
            <Modal show={showUpdateModal} onHide={() => setShowUpdateModal(false)}>
              <Modal.Header closeButton>
                <Modal.Title>Update Resource</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <CreateResourceForm
                  initialData={resource}
                  categories={categories}
                  subCategories={subCategories}
                  isCreate={false}
                  onSubmit={handleUpdate}
                />
              </Modal.Body>
            </Modal>
          )}
        </>
      ) : (
        <p>Loading resource...</p>
      )}
      <Button variant="primary" onClick={handleGoBack} className="mb-3">
        Back to Resources
      </Button>
    </div>
  );
};

export default ResourceDetailsPage;