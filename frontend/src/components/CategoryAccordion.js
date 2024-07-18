import React from 'react';
import ResourceTable from './Resources/ResourceTable';

const CategoryAccordion = ({ id, category, subCategories, resources, columns, isExpanded, onToggle, highlightMatched }) => {
  const sortResourcesByStateAndCity = (resources) => {
    return resources.sort((a, b) => {
      if (a.state !== b.state) {
        return a.state.localeCompare(b.state);
      }
      return a.city.localeCompare(b.city);
    });
  };

  return (
    <div id={id} className="card mb-3 shadow-sm" style={{ borderRadius: '15px', overflow: 'hidden' }}>
      <div
        className="card-header"
        onClick={onToggle}
        style={{
          cursor: 'pointer',
          background: 'white',
          border: '1px solid #0056b3',
          borderRadius: '15px',
          padding: '15px',
          transition: 'background-color 0.3s ease'

        }}
      >
        <h2 className='text-center mb-0' style={{ color: '#333333' }}>{category.name}</h2>
      </div>
      {isExpanded && (
        <div className="card-body" style={{ backgroundColor: '#F8F9FA' }}>
          {subCategories.map(subCategory => {
            let subCategoryResources = resources.filter(resource =>
              resource.subCategory.toLowerCase() === subCategory.name.toLowerCase()
            );

            if (subCategoryResources.length === 0) return null;

            subCategoryResources = sortResourcesByStateAndCity(subCategoryResources);

            const tableId = `${category.name}-${subCategory.name}`.replace(/\s+/g, '-').toLowerCase();

            return (
              <div key={subCategory._id} className="mb-4 p-3" id={`subcategory-${subCategory.name.replace(/\s+/g, '-').toLowerCase()}`} style={{ backgroundColor: '#FFFFFF', borderRadius: '0.25rem', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)' }}>
                <h3 className='text-center' style={{ color: '#4A5D70' }}>{subCategory.name}</h3>

                <ResourceTable
                  columns={columns}
                  data={subCategoryResources}
                  tableId={tableId}
                  highlightMatched={highlightMatched}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CategoryAccordion;
