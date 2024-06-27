import React, { useEffect } from 'react';
import ResourceTable from './Resources/ResourceTable';

const CategoryAccordion = ({ id, category, subCategories, resources, columns, searchTerm, isExpanded, onToggle }) => {
  useEffect(() => {
    if (searchTerm) {
      const hasMatch = resources.some(resource => 
        Object.values(resource).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      if (hasMatch && !isExpanded) {
        onToggle();
      }
    }
  }, [searchTerm, resources, isExpanded, onToggle]);

  return (
    <div id={id} className="card mb-3">
      <div 
        className="card-header" 
        onClick={onToggle}
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

export default CategoryAccordion;