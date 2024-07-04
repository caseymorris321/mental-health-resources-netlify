import React from 'react';
import ResourceTable from './Resources/ResourceTable';

const CategoryAccordion = ({ id, category, subCategories, resources, columns, isExpanded, onToggle, initialTableState }) => {
  return (
    <div id={id} className="card mb-3">
      <div
        className="card-header"
        onClick={onToggle}
        style={{ cursor: 'pointer' }}
      >
        <h2 className='text-center'>{category.name}</h2>
      </div>
      {isExpanded && (
        <div className="card-body">
          {subCategories.map(subCategory => {
            const subCategoryResources = resources.filter(resource =>
              resource.subCategory.toLowerCase() === subCategory.name.toLowerCase()
            );

            if (subCategoryResources.length === 0) return null;

            const tableStateKey = `${category.name}-${subCategory.name}`;

            return (
              <div key={subCategory._id} className="mb-4" id={`subcategory-${subCategory.name.replace(/\s+/g, '-').toLowerCase()}`}>
                <h3 className='text-center'>{subCategory.name}</h3>
                <ResourceTable
                  columns={columns}
                  data={subCategoryResources}
                  initialTableState={initialTableState && initialTableState[tableStateKey]}
                  tableStateKey={tableStateKey}
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