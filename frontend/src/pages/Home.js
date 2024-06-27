import React, { useState, useEffect, useMemo, useRef, useLayoutEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';
import TableOfContents from '../components/TableOfContents';
import ResourceTable from '../components/Resources/ResourceTable';
import { Link as RouterLink } from 'react-router-dom';

// Welcome Screen Component
const WelcomeScreen = ({ onClose }) => (
  <div className="welcome-screen">
    <h2>Welcome to Mental Health Resources</h2>
    <p>This site provides a comprehensive list of mental health resources. Use the search bar to find specific resources, or browse through our categories.</p>
    <button className="btn btn-primary" onClick={onClose}>Get Started</button>
  </div>
);

// Quick Links Component
const QuickLinks = ({ categories }) => (
  <div className="quick-links">
    <h3>Quick Links</h3>
    <ul>
      {categories.slice(0, 5).map(category => (
        <li key={category._id}>
          <a href={`#${category.name.toLowerCase().replace(/\s+/g, '-')}`}>{category.name}</a>
        </li>
      ))}
    </ul>
  </div>
);

// Category Accordion Component
const CategoryAccordion = ({ category, subCategories, resources, columns, searchTerm }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (searchTerm) {
      const hasMatch = resources.some(resource => 
        Object.values(resource).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      setIsExpanded(hasMatch);
    } else {
      setIsExpanded(false);
    }
  }, [searchTerm, resources]);

  return (
    <div className="card mb-3">
      <div 
        className="card-header" 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ cursor: 'pointer' }}
      >
        <h2>{category.name}</h2>
      </div>
      {isExpanded && (
        <div className="card-body">
          {subCategories.map(subCategory => {
            const subCategoryResources = resources.filter(resource =>
              resource.subCategory.toLowerCase() === subCategory.name.toLowerCase()
            );

            if (subCategoryResources.length === 0) return null;

            return (
              <div key={subCategory._id} className="mb-4">
                <h3>{subCategory.name}</h3>
                <ResourceTable
                  columns={columns}
                  data={subCategoryResources}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Main Home Component
const Home = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [subCategories, setSubCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const dataFetchedRef = useRef(false);

  const isProduction = process.env.REACT_APP_ENV === 'production';
  const apiUrl = process.env.REACT_APP_API_URL || (isProduction ? '/.netlify/functions' : 'http://localhost:4000');

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const searchTermFromQuery = searchParams.get('search') || '';
    setSearchTerm(searchTermFromQuery);
    setDebouncedSearchTerm(searchTermFromQuery);
  }, [location.search]);

  useEffect(() => {
    const fetchAllData = async () => {
      if (location.pathname === '/' && !dataFetchedRef.current) {
        setIsLoading(true);
        try {
          const fetchUrl = (endpoint) =>
            isProduction ? `${apiUrl}/${endpoint}` : `${apiUrl}/api/resources/${endpoint}`;

          const [categoriesRes, subCategoriesRes, resourcesRes] = await Promise.all([
            fetch(fetchUrl(isProduction ? 'getCategories' : 'categories')),
            fetch(fetchUrl(isProduction ? 'getSubCategories' : 'subcategories')),
            fetch(fetchUrl(isProduction ? 'getResources' : ''))
          ]);

          if (categoriesRes.ok && subCategoriesRes.ok && resourcesRes.ok) {
            const [categoriesData, subCategoriesData, resourcesData] = await Promise.all([
              categoriesRes.json(),
              subCategoriesRes.json(),
              resourcesRes.json()
            ]);

            setCategories(categoriesData);
            setSubCategories(subCategoriesData);
            setResources(Array.isArray(resourcesData) ? resourcesData : []);
            dataFetchedRef.current = true;
          } else {
            throw new Error('One or more requests failed');
          }
        } catch (error) {
          console.error('Error fetching data:', error);
          setError('Failed to load data');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchAllData();
  }, [location, isProduction, apiUrl]);

  const updateSearchParams = useCallback((searchTerm) => {
    const searchParams = new URLSearchParams({ search: searchTerm });
    navigate(`?${searchParams.toString()}`);
  }, [navigate]);

  const debouncedUpdateSearchParams = useMemo(
    () => debounce(updateSearchParams, 1000),
    [updateSearchParams]
  );

  const handleSearch = (event) => {
    const searchTerm = event.target.value;
    setSearchTerm(searchTerm);
    debouncedUpdateSearchParams(searchTerm);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    updateSearchParams('');
  };

  const columns = useMemo(
    () => [
      {
        Header: 'Name',
        accessor: 'name',
        Cell: ({ row }) => (
          <RouterLink
            to={`/resources/${row.original._id}`}
            state={{ category: row.original.category, subCategory: row.original.subCategory }}
            className="text-decoration-none"
          >
            {row.original.name}
          </RouterLink>
        ),
      },
      {
        Header: 'Description',
        accessor: 'description',
      },
      {
        Header: 'Contact',
        accessor: 'contactInfo',
        Cell: ({ value }) => (value ? value : 'N/A'),
      },
      {
        Header: 'Link',
        accessor: 'link',
        Cell: ({ cell: { value } }) => {
          if (!value) return 'N/A';
          let url;
          try {
            if (!/^https?:\/\//i.test(value)) {
              value = 'https://' + value;
            }
            url = new URL(value);
          } catch (error) {
            return value;
          }
          return (
            <a href={url.href} target="_blank" rel="noopener noreferrer">
              {url.hostname}
            </a>
          );
        }
      }
    ],
    []
  );

  const filterResource = (resource, term) => {
    const searchFields = [
      resource.name,
      resource.description,
      resource.link,
      resource.category,
      resource.subCategory,
      resource.contactInfo,
      resource.address,
      resource.availableHours,
      ...(resource.tags || [])
    ];

    return term === '' || searchFields.some(field =>
      field && field.toString().toLowerCase().includes(term.toLowerCase())
    );
  };

  const filteredResources = useMemo(() => {
    return Array.isArray(resources)
      ? resources.filter(resource => filterResource(resource, debouncedSearchTerm))
      : [];
  }, [resources, debouncedSearchTerm]);

  const categoriesWithResources = useMemo(() => {
    if (!categories || !filteredResources) return [];
    return categories.filter(category =>
      filteredResources.some(resource => resource.category.toLowerCase() === category.name.toLowerCase())
    );
  }, [categories, filteredResources]);

  const subCategoriesWithResources = useMemo(() => {
    if (!subCategories || !filteredResources) return [];
    return subCategories.filter(subCategory =>
      filteredResources.some(resource =>
        resource.subCategory.toLowerCase() === subCategory.name.toLowerCase() &&
        resource.category.toLowerCase() === subCategory.category.toLowerCase()
      )
    );
  }, [subCategories, filteredResources]);

  return (
    <div className="container">
      {showWelcome && (
        <WelcomeScreen onClose={() => setShowWelcome(false)} />
      )}

      <h1 className="mt-4 mb-4 text-center display-4 fw-bold">Mental Health Resources</h1>

      <div className="input-group mb-4">
        <input
          type="text"
          className="form-control form-control-lg"
          placeholder="Search all resources..."
          value={searchTerm}
          onChange={handleSearch}
        />
        {searchTerm && (
          <button className="btn btn-outline-secondary" type="button" onClick={clearSearch}>
            Clear
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {isLoading ? (
        <p>Loading resources...</p>
      ) : filteredResources.length === 0 ? (
        <p className="text-center">No resources found.</p>
      ) : (
        <div className="row">
          <div className="col-md-3">
            <QuickLinks categories={categoriesWithResources} />
          </div>
          <div className="col-md-9">
            {categoriesWithResources.map(category => (
              <CategoryAccordion
                key={category._id}
                category={category}
                subCategories={subCategoriesWithResources.filter(
                  subCat => subCat.category.toLowerCase() === category.name.toLowerCase()
                )}
                resources={filteredResources.filter(
                  resource => resource.category.toLowerCase() === category.name.toLowerCase()
                )}
                columns={columns}
                searchTerm={debouncedSearchTerm}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;