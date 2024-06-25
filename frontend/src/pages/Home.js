import React, { useState, useEffect, useMemo, useRef } from 'react';
import TableOfContents from '../components/TableOfContents';
import ResourceTable from '../components/Resources/ResourceTable';
import { Link as RouterLink, useLocation } from 'react-router-dom';

const Home = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [subCategories, setSubCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const dataFetchedRef = useRef(false);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';

  useEffect(() => {
    const fetchAllData = async () => {
      if (location.pathname === '/' && !dataFetchedRef.current) {
        setIsLoading(true);
        try {
          const [categoriesRes, subCategoriesRes, resourcesRes] = await Promise.all([
            fetch(`${apiUrl}/api/resources/categories`),
            fetch(`${apiUrl}/api/resources/subcategories`),
            fetch(`${apiUrl}/api/resources`)
          ]);

          if (categoriesRes.ok && subCategoriesRes.ok && resourcesRes.ok) {
            const [categoriesData, subCategoriesData, resourcesData] = await Promise.all([
              categoriesRes.json(),
              subCategoriesRes.json(),
              resourcesRes.json()
            ]);

            console.log('Fetched resources:', resourcesData);
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
  }, [location, apiUrl]);


  useEffect(() => {
    if (location.pathname === '/') {
      console.log('Location state:', location.state);
      if (location.state?.category && location.state?.subCategory) {
        const tableId = `${location.state.category}-${location.state.subCategory}`
          .toLowerCase()
          .replace(/\s+/g, '-');
        console.log('Table ID:', tableId);

        const scrollToTable = () => {
          const tableElement = document.getElementById(tableId);
          console.log('Table element:', tableElement);
          if (tableElement) {
            tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            console.log('Element not found:', tableId);
          }
        };

        setTimeout(scrollToTable, 500);
      }
    }
  }, [location]);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
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
        Header: 'Contact Info',
        accessor: 'contactInfo',
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
      ? resources.filter(resource => filterResource(resource, searchTerm))
      : [];
  }, [resources, searchTerm]);

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
      {categoriesWithResources.length > 0 && subCategoriesWithResources.length > 0 && (
        <TableOfContents
          categories={categoriesWithResources}
          subCategories={subCategoriesWithResources}
        />
      )}
      <h1 className="mt-4 mb-4 text-center display-4 fw-bold">Mental Health Resources</h1>

      <div className="mb-4">
        <input
          type="text"
          className="form-control"
          placeholder="Search all resources..."
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {isLoading ? (
        <p>Loading resources...</p>
      ) : filteredResources.length === 0 ? (
        <p className="text-center">No resources found.</p>) :
        (
          categoriesWithResources.map(category => {
            const categoryResources = filteredResources.filter(resource =>
              resource.category.toLowerCase() === category.name.toLowerCase()
            );

            if (categoryResources.length === 0) return null;

            const categorySubCategories = subCategoriesWithResources
              .filter(subCat => subCat.category.toLowerCase() === category.name.toLowerCase());

            if (categorySubCategories.length === 0) return null;



            return (
              <section key={category._id} id={category.name.toLowerCase().replace(/\s+/g, '-')}>
                <h2 className="mt-5 mb-3 text-center display-4 fw-bold">{category.name}</h2>
                {categorySubCategories.map(subCategory => {
                  const subCategoryResources = categoryResources.filter(resource =>
                    resource.subCategory.toLowerCase() === subCategory.name.toLowerCase()
                  );

                  if (subCategoryResources.length === 0) return null;

                  const tableId = `${category.name}-${subCategory.name}`
                    .toLowerCase()
                    .replace(/\s+/g, '-');

                  return (
                    <div id={tableId} key={subCategory._id} className="mb-4">
                      <ResourceTable
                        title={subCategory.name}
                        columns={columns}
                        data={subCategoryResources}
                      />
                    </div>
                  );
                })}
              </section>
            );
          })
        )}
    </div>
  );
};

export default Home;
