import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLocation, useNavigate, Link as RouterLink } from 'react-router-dom';
import { debounce } from 'lodash';
import WelcomeScreen from '../components/WelcomeScreen';
import QuickLinks from '../components/QuickLinks';
import CategoryAccordion from '../components/CategoryAccordion';
import '../loading.css';

const Home = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [lastSearchTerm, setLastSearchTerm] = useState('');
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
  const [highlightedResourceIds, setHighlightedResourceIds] = useState([]);


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

            if (categoriesData.length > 0) {
              setExpandedCategoryId(categoriesData[0]._id);
              setExpandedCategoryIds([categoriesData[0]._id]);
            }

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
    setLastSearchTerm(searchTerm);
    debouncedUpdateSearchParams(searchTerm);
  };


  const clearSearch = () => {
    setSearchTerm('');
    updateSearchParams('');
    setExpandedCategoryIds(expandedCategoryIds);
    setExpandedCategoryId(expandedCategoryId);
    
    const matchedResourceIds = filteredResources
      .filter(resource => resource.matchedLastSearch)
      .map(resource => resource._id);
    
    setHighlightedResourceIds(matchedResourceIds);
  
    setTimeout(() => {
      setHighlightedResourceIds([]);
    }, 5000);
  };
  


  // useEffect(() => {
  //   if (!searchTerm && categories.length > 0 && expandedCategoryIds.length === 0) {
  //     // If there's no search term and no expanded categories, open the first one
  //     setExpandedCategoryIds([categories[0]._id]);
  //     setExpandedCategoryId(categories[0]._id);
  //   }
  // }, [searchTerm, categories, expandedCategoryIds]);

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
      },
      {
        Header: 'City',
        accessor: 'city',
        Cell: ({ value }) => (value ? value : 'N/A'),
      },
      {
        Header: 'State',
        accessor: 'state',
        Cell: ({ value }) => (value ? value : 'N/A'),
      },
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
      resource.city,
      resource.state,
      ...(resource.tags || [])
    ];

    return term === '' || searchFields.some(field =>
      field && field.toString().toLowerCase().includes(term.toLowerCase())
    );
  };

  const filteredResources = useMemo(() => {
    return Array.isArray(resources)
      ? resources.filter(resource =>
        filterResource(resource, debouncedSearchTerm) ||
        filterResource(resource, lastSearchTerm)
      ).map(resource => ({
        ...resource,
        matchedLastSearch: filterResource(resource, lastSearchTerm)
      }))
      : [];
  }, [resources, debouncedSearchTerm, lastSearchTerm]);



  const categoriesWithResources = useMemo(() => {
    if (!categories || !filteredResources) return [];
    return categories.filter(category =>
      filteredResources.some(resource =>
        resource.category.toLowerCase() === category.name.toLowerCase()
      )
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
    setExpandedCategoryId(categoryId);
    setExpandedCategoryIds([categoryId]);
    setTimeout(() => {
      const element = document.getElementById(`category-${categoryId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
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
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  useEffect(() => {
    const { category, resourceId } = location.state || {};
    if (category && categories.length > 0 && resourceId) {
      const categoryObj = categories.find(
        cat => cat.name.toLowerCase() === category.toLowerCase()
      );
      if (categoryObj) {
        setExpandedCategoryId(categoryObj._id);
        setExpandedCategoryIds([categoryObj._id]);
        setTimeout(() => {
          const resourceRow = document.querySelector(`tr[data-resource-id="${resourceId}"]`);
          if (resourceRow) {
            resourceRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            resourceRow.classList.add('table-warning');
            setTimeout(() => resourceRow.classList.remove('table-warning'), 3000);
          }
        }, 100);
      }
    }
  }, [location.state, categories]);

  useEffect(() => {
    if (debouncedSearchTerm) {
      const matchingCategoryIds = categoriesWithResources
        .filter(category =>
          filteredResources.some(resource =>
            resource.category.toLowerCase() === category.name.toLowerCase()
          )
        )
        .map(category => category._id);

      if (matchingCategoryIds.length > 0) {
        setExpandedCategoryIds(matchingCategoryIds);
        setExpandedCategoryId(matchingCategoryIds[0]);
      } else {
        // If no matches, keep the last opened accordions
        setExpandedCategoryIds(expandedCategoryIds);
        setExpandedCategoryId(expandedCategoryId);
      }
    }
  }, [debouncedSearchTerm, categoriesWithResources, filteredResources, expandedCategoryIds, expandedCategoryId]);

  const handleSubCategoryClick = (categoryId, subCategoryName) => {
    setExpandedCategoryId(categoryId);
    setExpandedCategoryIds([categoryId]);
    setTimeout(() => {
      const element = document.getElementById(`subcategory-${subCategoryName.replace(/\s+/g, '-').toLowerCase()}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div className="container">
      {showWelcome && (
        <WelcomeScreen onClose={() => setShowWelcome(false)} />
      )}

      <h1 className="mt-4 mb-4 text-center display-4 fw-bold text-primary">Mental Health Resources</h1>

      <div className="input-group mb-4 shadow-sm">
        <input
          type="text"
          className="form-control form-control-lg border-secondary"
          placeholder="Search all resources..."
          value={searchTerm}
          onChange={handleSearch}
        />
        {searchTerm && (
          <button className="btn btn-outline-primary" type="button" onClick={clearSearch}>
            Clear
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {isLoading ? (
        <p className='loading-text'>Loading resources...</p>
      ) : filteredResources.length === 0 ? (
        <p className="text-center">No resources found.</p>
      ) : (
        <div className="row">
          <div className="col-md-3">
            <QuickLinks
              categories={categoriesWithResources}
              subCategories={subCategoriesWithResources}
              onQuickLinkClick={handleQuickLinkClick}
              onSubCategoryClick={handleSubCategoryClick}

            />
          </div>
          <div className="col-md-9">
            {categoriesWithResources.map((category, index) => {
              const categoryResources = filteredResources.filter(
                resource => resource.category.toLowerCase() === category.name.toLowerCase()
              );

              if (categoryResources.length === 0) return null;

              const subCategoriesWithResourcesForCategory = subCategoriesWithResources.filter(
                subCat => subCat.category.toLowerCase() === category.name.toLowerCase() &&
                  categoryResources.some(resource => resource.subCategory.toLowerCase() === subCat.name.toLowerCase())
              );

              if (subCategoriesWithResourcesForCategory.length === 0) return null;

              return (
                <CategoryAccordion
                  key={category._id}
                  id={`category-${category._id}`}
                  category={category}
                  subCategories={subCategoriesWithResourcesForCategory}
                  resources={categoryResources}
                  columns={columns}
                  isExpanded={expandedCategoryId === category._id || expandedCategoryIds.includes(category._id)}
                  onToggle={() => handleAccordionToggle(category._id)}
                  highlightedResourceIds={highlightedResourceIds}
                  />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
