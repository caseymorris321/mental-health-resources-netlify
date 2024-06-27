import React, { useState, useEffect, useCallback } from 'react';
import { Container, Button, Modal, Form, ListGroup, Alert } from 'react-bootstrap';
import { useAuth0 } from '@auth0/auth0-react';
import CreateResourceForm from '../components/CreateResourceForm';
import { Navigate, useLocation, Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { user, getAccessTokenSilently, isAuthenticated, isLoading: authLoading } = useAuth0();
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [showUpdateResourceModal, setShowUpdateResourceModal] = useState(false);
  const [showUpdateCategoryModal, setShowUpdateCategoryModal] = useState(false);
  const [showUpdateSubCategoryModal, setShowUpdateSubCategoryModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [resources, setResources] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [newSubCategory, setNewSubCategory] = useState({ name: '', category: '' });
  const [selectedResource, setSelectedResource] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(() => ({ _id: '', name: '', oldName: '' }));
  const [selectedSubCategory, setSelectedSubCategory] = useState(() => ({ _id: '', name: '', oldName: '', category: '' }));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryError, setCategoryError] = useState(null);
  const [subCategoryError, setSubCategoryError] = useState(null);
  const location = useLocation();

  const isProduction = process.env.REACT_APP_ENV === 'production';
  const apiUrl = process.env.REACT_APP_API_URL || (isProduction ? '/.netlify/functions' : 'http://localhost:4000');

  const fetchUrl = useCallback((endpoint) =>
    isProduction ? `${apiUrl}/${endpoint}` : `${apiUrl}/api/resources/${endpoint}`,
    [isProduction, apiUrl]);

  const fetchCategories = useCallback(async () => {
    try {

      const token = await getAccessTokenSilently();
      const response = await fetch(fetchUrl(isProduction ? 'getCategories' : 'categories'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data.sort((a, b) => a.order - b.order));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, [getAccessTokenSilently, fetchUrl, isProduction]);

  const fetchSubCategories = useCallback(async () => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(fetchUrl(isProduction ? 'getSubCategories' : 'subcategories'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const sortedData = data.sort((a, b) => {
          if (a.category !== b.category) {
            return a.category.localeCompare(b.category);
          }
          return a.order - b.order;
        });
        setSubCategories(sortedData);
      }
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    }
  }, [getAccessTokenSilently, fetchUrl, isProduction]);

  const fetchResources = useCallback(async () => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(fetchUrl(isProduction ? 'getResources' : ''), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const sortedData = data.sort((a, b) => {
          if (a.category !== b.category) {
            return a.category.localeCompare(b.category);
          }
          if (a.subCategory !== b.subCategory) {
            return a.subCategory.localeCompare(b.subCategory);
          }
          return a.order - b.order;
        });
        setResources(sortedData);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    }
  }, [getAccessTokenSilently, fetchUrl, isProduction]);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getAccessTokenSilently();
      const [categoriesRes, subCategoriesRes, resourcesRes] = await Promise.all([
        fetch(fetchUrl(isProduction ? 'getCategories' : 'categories'), {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(fetchUrl(isProduction ? 'getSubCategories' : 'subcategories'), {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(fetchUrl(isProduction ? 'getResources' : ''), {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      if (categoriesRes.ok && subCategoriesRes.ok && resourcesRes.ok) {
        const [categoriesData, subCategoriesData, resourcesData] = await Promise.all([
          categoriesRes.json(),
          subCategoriesRes.json(),
          resourcesRes.json()
        ]);

        setCategories(categoriesData.sort((a, b) => a.order - b.order));
        setSubCategories(subCategoriesData.sort((a, b) => {
          if (a.category !== b.category) {
            return a.category.localeCompare(b.category);
          }
          return a.order - b.order;
        }));
        setResources(resourcesData.sort((a, b) => {
          if (a.category !== b.category) {
            return a.category.localeCompare(b.category);
          }
          if (a.subCategory !== b.subCategory) {
            return a.subCategory.localeCompare(b.subCategory);
          }
          return a.order - b.order;
        }));
      } else {
        throw new Error('One or more requests failed');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [getAccessTokenSilently, fetchUrl, isProduction]);

  useEffect(() => {
    if (isAuthenticated && location.pathname === '/admin') {
      fetchAllData();
    }
  }, [isAuthenticated, fetchAllData, location]);

  if (authLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return <div>Loading resources...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleDeleteResource = async (id, name) => {
    const isConfirmed = window.confirm(`Are you sure you want to delete the resource "${name}"?`);
    if (!isConfirmed) return;
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(fetchUrl(isProduction ? `deleteResource/${id}` : `${id}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        fetchResources();
      } else {
        console.error('Failed to delete resource');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleUpdateResource = async (updatedResource) => {
    if (!updatedResource._id) {
      console.error('Resource _id is undefined');
      return;
    }
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(fetchUrl(isProduction ? `updateResource/${updatedResource._id}` : `${updatedResource._id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: updatedResource.name,
          description: updatedResource.description,
          link: updatedResource.link,
          category: updatedResource.category,
          subCategory: updatedResource.subCategory,
          contactInfo: updatedResource.contactInfo,
          address: updatedResource.address,
          availableHours: updatedResource.availableHours,
          tags: updatedResource.tags.split(',').map(tag => tag.trim()),
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setResources(prevResources => prevResources.map(resource => resource._id === data._id ? data : resource));
        setShowUpdateResourceModal(false);
      } else {
        const errorData = await response.json();
        let errorMessage = 'An unexpected error occurred. Please try again.';
        if (errorData.message.includes('duplicate key error')) {
          errorMessage = 'A resource with this name already exists in this subcategory.';
        }
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Error:', error);
      setError('A resource with this name already exists in this subcategory.');
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    setCategoryError(null); // Clear any previous errors
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(fetchUrl(isProduction ? 'createCategory' : 'categories'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newCategory }),
      });
      if (response.ok) {
        setShowCategoryModal(false);
        fetchCategories();
        setNewCategory('');
      } else {
        let errorMessage = 'Failed to create category';
        if (isProduction) {
          const { error } = await response.json();
          errorMessage = error.message || errorMessage;
        } else {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        }
        if (errorMessage.includes('duplicate key error')) {
          setCategoryError('A category with this name already exists.');
        } else {
          setCategoryError(errorMessage);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setCategoryError('A category with this name already exists.');
    }
  };

  const handleUpdateCategory = async (updatedCategory) => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(fetchUrl(isProduction ? `updateCategory/${updatedCategory._id}` : `categories/${updatedCategory._id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: updatedCategory.name, oldName: updatedCategory.oldName }),
      });
      if (response.ok) {
        const { category, subCategories, resources } = await response.json();
        setCategories(prevCategories => prevCategories.map(cat => cat._id === category._id ? category : cat));
        setSubCategories(prevSubCategories => {
          const filteredSubCats = prevSubCategories.filter(subCat => subCat.category !== updatedCategory.oldName);
          return [...filteredSubCats, ...subCategories];
        });
        setResources(prevResources => {
          const filteredResources = prevResources.filter(resource => resource.category !== updatedCategory.oldName);
          return [...filteredResources, ...resources];
        });
        setShowUpdateCategoryModal(false);
      } else {
        const errorData = await response.json();
        let errorMessage = 'A category with this name already exists.';
        if (errorData.message.includes('duplicate key error')) {
          errorMessage = 'A category with this name already exists.';
        }
        setCategoryError(errorMessage);
      }
    } catch (error) {
      console.error('Error:', error);
      setCategoryError('A category with this name already exists.');
    }
  };

  const handleDeleteCategory = async (id, name) => {
    const isConfirmed = window.confirm(`Are you sure you want to delete the category "${name}"? This will also delete all associated subcategories and resources.`);
    if (!isConfirmed) return;
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(fetchUrl(isProduction ? `deleteCategory/${id}` : `categories/${id}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        fetchCategories();
        fetchSubCategories();
        fetchResources();
      } else {
        console.error('Failed to delete category');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleAddSubCategory = async (e) => {
    e.preventDefault();
    setSubCategoryError(null); // Clear any previous errors
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(fetchUrl(isProduction ? 'createSubCategory' : 'subcategories'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newSubCategory),
      });
      if (response.ok) {
        setShowSubCategoryModal(false);
        fetchSubCategories();
        setNewSubCategory({ name: '', category: '' });
      } else {
        let errorMessage = 'Failed to create subcategory';
        if (isProduction) {
          const { error } = await response.json();
          errorMessage = error.message || errorMessage;
        } else {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        }
        if (errorMessage.includes('duplicate key error')) {
          setSubCategoryError('A subcategory with this name already exists in this category.');
        } else {
          setSubCategoryError(errorMessage);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setSubCategoryError('A subcategory with this name already exists in this category.');
    }
  };

  const handleUpdateSubCategory = async (updatedSubCategory) => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(fetchUrl(isProduction ? `updateSubCategory/${updatedSubCategory._id}` : `subcategories/${updatedSubCategory._id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: updatedSubCategory.name,
          oldName: updatedSubCategory.oldName,
          category: updatedSubCategory.category
        }),
      });
      if (response.ok) {
        const { subCategory, resources } = await response.json();
        setSubCategories(prevSubCategories => prevSubCategories.map(subCat => subCat._id === subCategory._id ? subCategory : subCat));
        setResources(prevResources => {
          const filteredResources = prevResources.filter(resource => !(resource.category === updatedSubCategory.category && resource.subCategory === updatedSubCategory.oldName));
          return [...filteredResources, ...resources];
        });
        setShowUpdateSubCategoryModal(false);
      } else {
        const errorData = await response.json();
        let errorMessage = 'A subcategory with this name already exists in this category.';
        if (errorData.message.includes('duplicate key error')) {
          errorMessage = 'A subcategory with this name already exists in this category.';
        }
        setSubCategoryError(errorMessage);
      }
    } catch (error) {
      console.error('Error:', error);
      setSubCategoryError('A subcategory with this name already exists in this category.');
    }
  };

  const handleDeleteSubCategory = async (id, name) => {
    const isConfirmed = window.confirm(`Are you sure you want to delete the subcategory "${name}"? This will also delete all associated resources.`);
    if (!isConfirmed) return;
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(fetchUrl(isProduction ? `deleteSubCategory/${id}` : `subcategories/${id}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        fetchSubCategories();
        fetchResources();
      } else {
        console.error('Failed to delete subcategory');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleMoveCategory = async (categoryId, direction) => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(fetchUrl(isProduction ? `moveCategory/${categoryId}/${direction}` : `categories/${categoryId}/move/${direction}`), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const updatedCategories = await response.json();
        // console.log('Updated categories:', updatedCategories);
        setCategories(updatedCategories);
      } else {
        console.error('Failed to move category');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleMoveSubCategory = async (subCategoryId, direction) => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(fetchUrl(isProduction ? `moveSubCategory/${subCategoryId}/${direction}` : `subcategories/${subCategoryId}/move/${direction}`), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const updatedSubCategories = await response.json();
        // console.log('Updated subcategories:', updatedSubCategories);
        setSubCategories(updatedSubCategories);
      } else {
        console.error('Failed to move subcategory');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleMoveResource = async (resourceId, direction) => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(fetchUrl(isProduction ? `moveResource/${resourceId}/${direction}` : `${resourceId}/move/${direction}`), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const updatedResources = await response.json();
        // console.log('Updated resources:', updatedResources);
        setResources(updatedResources);
      } else {
        console.error('Failed to move resource');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <Container className="mt-5">
      <h1 className='text-center'>Admin Dashboard</h1>
      <div className='text-center'>{user && <p>Welcome, {user.name}</p>}</div>
      <div className='text-center'>
        <div className="row g-2 justify-content-center">
          <div className="col-12 col-sm-auto">
            <Button
              variant="success"
              onClick={() => setShowCategoryModal(true)}
              className="w-100"
            >
              <i className="fas fa-plus me-1"></i>
              <span>Create Category</span>
            </Button>
          </div>
        </div>
      </div>

      <h2 className="mt-5 text-center">Resource Management</h2>
      <div className="mt-4">
        {categories.map((category) => (
          <div key={category._id} className="card mb-4">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center flex-wrap">
                  <h3 className="mb-0 me-2">Category: {category.name}</h3>
                  <Button
                    variant="success"
                    size="sm"
                    className="mt-2 mt-md-0"
                    onClick={() => {
                      setNewSubCategory({ name: '', category: category.name });
                      setShowSubCategoryModal(true);
                    }}
                  >
                    <i className="fas fa-plus me-1"></i>
                    <span className="d-none d-md-inline">New Subcategory</span>
                  </Button>
                </div>
                <div className="mt-2 mt-md-0">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="me-2"
                    onClick={() => handleMoveCategory(category._id, 'up')}
                  >
                    <i className="fas fa-arrow-up"></i>
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="me-2"
                    onClick={() => handleMoveCategory(category._id, 'down')}
                  >
                    <i className="fas fa-arrow-down"></i>
                  </Button>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-2"
                    onClick={() => {
                      setSelectedCategory({ ...category, oldName: category.name });
                      setShowUpdateCategoryModal(true);
                    }}
                  >
                    <i className="fas fa-edit"></i>
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDeleteCategory(category._id, category.name)}
                  >
                    <i className="fas fa-trash-alt"></i>
                  </Button>
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              <ListGroup variant="flush">
                {subCategories
                  .filter(subCat => subCat.category === category.name)
                  .map(subCategory => (
                    <ListGroup.Item key={subCategory._id} className="border-0">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="d-flex align-items-center flex-wrap">
                          <h4 className="mb-0 me-2">Subcategory: {subCategory.name}</h4>
                          <Button
                            variant="success"
                            size="sm"
                            className="mt-2 mt-md-0"
                            onClick={() => {
                              setSelectedResource({
                                name: '',
                                description: '',
                                link: '',
                                category: category.name,
                                subCategory: subCategory.name,
                                contactInfo: '',
                                address: '',
                                availableHours: '',
                                tags: []
                              });
                              setShowResourceModal(true);
                            }}
                          >
                            <i className="fas fa-plus me-1"></i>
                            <span className="d-none d-md-inline">New Resource</span>
                          </Button>
                        </div>
                        <div className="mt-2 mt-md-0">
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleMoveSubCategory(subCategory._id, 'up')}
                          >
                            <i className="fas fa-arrow-up"></i>
                          </Button>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleMoveSubCategory(subCategory._id, 'down')}
                          >
                            <i className="fas fa-arrow-down"></i>
                          </Button>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => {
                              setSelectedSubCategory({
                                _id: subCategory._id,
                                name: subCategory.name,
                                oldName: subCategory.name,
                                category: subCategory.category
                              });
                              setShowUpdateSubCategoryModal(true);
                            }}
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteSubCategory(subCategory._id, subCategory.name)}
                          >
                            <i className="fas fa-trash-alt"></i>
                          </Button>
                        </div>
                      </div>
                      <h5 className="mt-3 mb-2">Resources:</h5>
                      <ListGroup>
                        {resources
                          .filter(resource => resource.category === category.name && resource.subCategory === subCategory.name)
                          .map(resource => (
                            <ListGroup.Item key={resource._id} className="d-flex justify-content-between align-items-center">
                              <Link to={`/resources/${resource._id}`} className='text-decoration-none'>{resource.name}</Link>
                              <div>
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  className="me-2"
                                  onClick={() => handleMoveResource(resource._id, 'up')}
                                >
                                  <i className="fas fa-arrow-up"></i>
                                </Button>
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  className="me-2"
                                  onClick={() => handleMoveResource(resource._id, 'down')}
                                >
                                  <i className="fas fa-arrow-down"></i>
                                </Button>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  className="me-2"
                                  onClick={() => {
                                    if (resource._id) {
                                      setSelectedResource(resource);
                                      setShowUpdateResourceModal(true);
                                    } else {
                                      console.error('Resource _id is missing');
                                    }
                                  }}
                                >
                                  <i className="fas fa-edit"></i>
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDeleteResource(resource._id, resource.name)}
                                >
                                  <i className="fas fa-trash-alt"></i>
                                </Button>
                              </div>
                            </ListGroup.Item>
                          ))
                        }
                      </ListGroup>
                    </ListGroup.Item>
                  ))
                }
              </ListGroup>
            </div>
          </div>
        ))}
      </div>

      <Modal show={showResourceModal} onHide={() => setShowResourceModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Resource</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <CreateResourceForm
            category={selectedResource?.category}
            subCategory={selectedResource?.subCategory}
            isCreate={true}
            onSubmit={(resourceData) => {
              // console.log('Resource created:', resourceData);
              setShowResourceModal(false);
              fetchResources();
            }}
          />
        </Modal.Body>
      </Modal>

      <Modal show={showUpdateResourceModal} onHide={() => setShowUpdateResourceModal(false)}>
        <Modal.Header closeButton >
          <Modal.Title>Update Resource</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedResource && (
            <CreateResourceForm
              initialData={selectedResource}
              categories={categories}
              subCategories={subCategories}
              isCreate={false}
              onSubmit={(updatedData) => {
                handleUpdateResource({ ...selectedResource, ...updatedData });
              }}
            />
          )}
        </Modal.Body>
      </Modal>

      <Modal show={showCategoryModal} onHide={() => {
        setShowCategoryModal(false);
        setCategoryError(null); // Clear error when closing modal
      }}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Category</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {categoryError && <Alert variant="danger">{categoryError}</Alert>}
          <Form onSubmit={handleAddCategory}>
            <Form.Group>
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter category name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                autoFocus
                required
              />
            </Form.Group>
            <Button type="submit" className='mt-2'>Create Category</Button>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showUpdateCategoryModal} onHide={() => {
        setShowUpdateCategoryModal(false);
        setCategoryError(null);
      }}>
        <Modal.Header closeButton>
          <Modal.Title>Update Category</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {categoryError && <Alert variant="danger">{categoryError}</Alert>}
          {selectedCategory && (
            <Form onSubmit={(e) => {
              e.preventDefault();
              handleUpdateCategory(selectedCategory);
            }}>
              <Form.Group>
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter new category name"
                  value={selectedCategory.name}
                  onChange={(e) => setSelectedCategory({ ...selectedCategory, name: e.target.value })}
                  autoFocus
                  required
                />
              </Form.Group>
              <Button type="submit" className='mt-2'>Update Category</Button>
            </Form>
          )}
        </Modal.Body>
      </Modal>

      <Modal show={showSubCategoryModal} onHide={() => {
        setShowSubCategoryModal(false);
        setSubCategoryError(null); // Clear error when closing modal
      }}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Subcategory for {newSubCategory.category}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {subCategoryError && <Alert variant="danger">{subCategoryError}</Alert>}
          <Form onSubmit={handleAddSubCategory}>
            <Form.Group>
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter subcategory name"
                value={newSubCategory.name}
                onChange={(e) => setNewSubCategory({ ...newSubCategory, name: e.target.value })}
                autoFocus
                required
              />
            </Form.Group>
            <Button type="submit" className='mt-2'>Create Subcategory</Button>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showUpdateSubCategoryModal} onHide={() => {
        setShowUpdateSubCategoryModal(false);
        setSubCategoryError(null);
      }}>
        <Modal.Header closeButton>
          <Modal.Title>Update Subcategory</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {subCategoryError && <Alert variant="danger">{subCategoryError}</Alert>}
          {selectedSubCategory && (
            <Form onSubmit={(e) => {
              e.preventDefault();
              handleUpdateSubCategory(selectedSubCategory);
            }}>
              <Form.Group>
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter new subcategory name"
                  value={selectedSubCategory.name}
                  onChange={(e) => setSelectedSubCategory({ ...selectedSubCategory, name: e.target.value })}
                  autoFocus
                  required
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Category</Form.Label>
                <Form.Control
                  as="select"
                  value={selectedSubCategory.category}
                  onChange={(e) => setSelectedSubCategory({ ...selectedSubCategory, category: e.target.value })}
                  required
                >
                  {categories.map(cat => (
                    <option key={cat._id} value={cat.name}>{cat.name}</option>
                  ))}
                </Form.Control>
              </Form.Group>
              <Button type="submit" className='mt-2'>Update Subcategory</Button>
            </Form>
          )}
        </Modal.Body>
      </Modal>
    </Container >
  );
};

export default AdminDashboard;