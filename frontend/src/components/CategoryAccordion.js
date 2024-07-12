import React from 'react';
import ResourceTable from './Resources/ResourceTable';

const CategoryAccordion = ({ id, category, subCategories, resources, columns, isExpanded, onToggle }) => {
  return (
    <div id={id} className="card mb-3 shadow-sm">
      <div
        className="card-header"
        onClick={onToggle}
        style={{
          cursor: 'pointer',
          background: 'white', // Primary blue background
          border: '1px solid #0056b3' // Darker blue border
        }}
      >
        <h2 className='text-center mb-0' style={{ color: '#333333' }}>{category.name}</h2>
      </div>
      {isExpanded && (
        <div className="card-body" style={{ backgroundColor: '#F8F9FA' }}>
          {subCategories.map(subCategory => {
            const subCategoryResources = resources.filter(resource =>
              resource.subCategory.toLowerCase() === subCategory.name.toLowerCase()
            );

            if (subCategoryResources.length === 0) return null;

            const tableId = `${category.name}-${subCategory.name}`.replace(/\s+/g, '-').toLowerCase();

            return (
              <div key={subCategory._id} className="mb-4 p-3" id={`subcategory-${subCategory.name.replace(/\s+/g, '-').toLowerCase()}`} style={{ backgroundColor: '#FFFFFF', borderRadius: '0.25rem', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)' }}>
                <h3 className='text-center' style={{ color: '#7F98B2' }}>{subCategory.name}</h3>

                <ResourceTable
                  columns={columns}
                  data={subCategoryResources}
                  tableId={tableId}
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
