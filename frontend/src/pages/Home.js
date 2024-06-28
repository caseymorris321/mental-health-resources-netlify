import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLocation, useNavigate, Link as RouterLink } from 'react-router-dom';
import { debounce } from 'lodash';
import WelcomeScreen from '../components/WelcomeScreen';
import QuickLinks from '../components/QuickLinks';
import CategoryAccordion from '../components/CategoryAccordion';

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
  const [expandedCategoryId, setExpandedCategoryId] = useState(null);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState([]);

  const isProduction = process.env.REACT_APP_ENV === 'production';
  const apiUrl = process.env.REACT_APP_API_URL || (isProduction ? '/.netlify/functions' : 'http://localhost:4000');

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

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const searchTermFromQuery = searchParams.get('search') || '';
    setSearchTerm(searchTermFromQuery);
    setDebouncedSearchTerm(searchTermFromQuery);
  }, [location.search]);

  useEffect(() => {
    const clearSearchOnRefresh = () => {
      setSearchTerm('');
      setDebouncedSearchTerm('');
      updateSearchParams('');
    };
  
    clearSearchOnRefresh();
  }, [updateSearchParams]);

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

   const handleQuickLinkClick = (categoryId) => {
    setExpandedCategoryIds(prev => [...prev, categoryId]);
    setTimeout(() => {
      const element = document.getElementById(`category-${categoryId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'instant' });
      }
    }, 100);
  };

  const handleAccordionToggle = (categoryId) => {
    setExpandedCategoryId(prevId => prevId === categoryId ? null : categoryId);
    setExpandedCategoryIds(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [categoryId];
      }
    });
    setTimeout(() => {
      const element = document.getElementById(`category-${categoryId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'instant' });
      }
    }, 100);
  };

  useEffect(() => {
    const { category, subCategory } = location.state || {};
    if (category && subCategory) {
      const categoryId = categories.find(
        cat => cat.name.toLowerCase() === category.toLowerCase()
      )?._id;
      if (categoryId) {
        setExpandedCategoryId(categoryId);
        setTimeout(() => {
          const element = document.getElementById(`category-${categoryId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'instant' });
          }
        }, 100);
      }
    } else if (categories.length > 0) {
      setExpandedCategoryId(categories[0]._id);
    }
  }, [location.state, categories]);

  useEffect(() => {
    if (categoriesWithResources.length > 0 && !searchTerm) {
      setExpandedCategoryIds([categoriesWithResources[0]._id]);
    }
  }, [categoriesWithResources, searchTerm]);

  useEffect(() => {
    if (searchTerm) {
      const matchingCategoryIds = categoriesWithResources
        .filter(category =>
          filteredResources.some(resource =>
            resource.category.toLowerCase() === category.name.toLowerCase() &&
            Object.values(resource).some(value =>
              value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
            )
          )
        )
        .map(category => category._id);
      setExpandedCategoryIds(prevExpandedCategoryIds => [
        ...prevExpandedCategoryIds,
        ...matchingCategoryIds.filter(id => !prevExpandedCategoryIds.includes(id))
      ]);
    }
  }, [searchTerm, categoriesWithResources, filteredResources]);

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
            <QuickLinks
              categories={categoriesWithResources}
              onQuickLinkClick={handleQuickLinkClick}
            />
          </div>
          <div className="col-md-9">
            {categoriesWithResources.map((category, index) => (
              <CategoryAccordion
                key={category._id}
                id={`category-${category._id}`}
                category={category}
                subCategories={subCategoriesWithResources.filter(
                  subCat => subCat.category.toLowerCase() === category.name.toLowerCase()
                )}
                resources={filteredResources.filter(
                  resource => resource.category.toLowerCase() === category.name.toLowerCase()
                )}
                columns={columns}
                isExpanded={expandedCategoryId === category._id || expandedCategoryIds.includes(category._id)}
                onToggle={() => handleAccordionToggle(category._id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
