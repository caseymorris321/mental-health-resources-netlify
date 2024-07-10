import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import ResourceDetails from '../components/Resources/ResourceDetails';
import { Button, Alert } from 'react-bootstrap';
import '../loading.css';

const ResourceDetailsPage = () => {
  const { id } = useParams();
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [resource, setResource] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [error, setError] = useState(null);
  const [isDeleted, setIsDeleted] = useState(false);
  const navigate = useNavigate();

  const isProduction = process.env.REACT_APP_ENV === 'production';
  const apiUrl = process.env.REACT_APP_API_URL || (isProduction ? '/.netlify/functions' : 'http://localhost:4000');

  const fetchResource = useCallback(async () => {
    try {
      const fetchUrl = isProduction ? `${apiUrl}/getResource/${id}` : `${apiUrl}/api/resources/${id}`;
      const response = await fetch(fetchUrl);
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
  }, [id, isProduction, apiUrl]);

  const fetchCategories = useCallback(async () => {
    try {
      const fetchUrl = isProduction ? `${apiUrl}/getCategories` : `${apiUrl}/api/resources/categories`;
      const response = await fetch(fetchUrl);
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, [isProduction, apiUrl]);

  const fetchSubCategories = useCallback(async () => {
    try {
      const fetchUrl = isProduction ? `${apiUrl}/getSubCategories` : `${apiUrl}/api/resources/subcategories`;
      const response = await fetch(fetchUrl);
      if (response.ok) {
        const data = await response.json();
        setSubCategories(data);
      }
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    }
  }, [isProduction, apiUrl]);

  useEffect(() => {
    fetchResource();
    if (isAuthenticated) {
      fetchCategories();
      fetchSubCategories();
    }
  }, [fetchResource, fetchCategories, fetchSubCategories, isAuthenticated]);

  const handleGoBack = () => {
    navigate('/', {
      state: {
        category: resource.category,
        subCategory: resource.subCategory,
        scrollToSubCategory: true
      }
    });
  };

  const handleUpdate = async (updatedResource) => {
    if (!isAuthenticated) return;
    try {
      const token = await getAccessTokenSilently();
      const fetchUrl = isProduction ? `${apiUrl}/updateResource/${id}` : `${apiUrl}/api/resources/${id}`;
      const response = await fetch(fetchUrl, {
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
        const fetchUrl = isProduction ? `${apiUrl}/deleteResource/${id}` : `${apiUrl}/api/resources/${id}`;
        const response = await fetch(fetchUrl, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          setIsDeleted(true);
          setTimeout(() => {
            navigate('/');
          }, 15000);
        } else {
          throw new Error('Failed to delete resource');
        }
      } catch (error) {
        console.error('Error deleting resource:', error);
        setError(error.message);
      }
    }
  };

  const handleUndoDelete = async () => {
    try {
      const token = await getAccessTokenSilently();
      const fetchUrl = isProduction ? `${apiUrl}/undoDeleteResource/${id}` : `${apiUrl}/api/resources/undoDelete/${id}`;
      const response = await fetch(fetchUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
      });
      if (response.ok) {
        const restoredResource = await response.json();
        setResource(restoredResource);
        setIsDeleted(false);
      } else {
        throw new Error('Failed to undo delete');
      }
    } catch (error) {
      console.error('Error undoing delete:', error);
      setError(error.message);
    }
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="container">
      <h2>Resource Details</h2>
      {isDeleted ? (
        <Alert variant="warning">
          Resource has been deleted.
          <Button variant="link" onClick={handleUndoDelete}>Undo</Button>
        </Alert>
      ) : resource ? (
        <>
          <ResourceDetails
            resource={resource}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            showAdminControls={isAuthenticated}
          />
          {resource.updatedAt && (
            <p className="text-muted small">
              This page was last edited on {formatDate(resource.updatedAt)}
            </p>
          )}
        </>
      ) : (
        <p className="loading-text">Loading resource...</p>
      )}
      <Button variant="primary" onClick={handleGoBack} className="mb-3">
        Back to Resources
      </Button>
    </div>
  );
};

export default ResourceDetailsPage;
