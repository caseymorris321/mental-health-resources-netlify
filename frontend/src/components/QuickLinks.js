import React, { useState } from 'react';

const QuickLinks = ({ categories, subCategories, onQuickLinkClick, onSubCategoryClick }) => {
  const [expandedCategories, setExpandedCategories] = useState({});

  const toggleCategory = (categoryId, event) => {
    event.stopPropagation();
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  return (
    <div className="quick-links">
      <h2 className="mb-3">Quick Links</h2>
      <div className="container-fluid p-0">
        {categories.map(category => (
          <div key={category._id} className="row mb-2">
            <div className="col-12">
              <div className="d-flex align-items-center" onClick={() => onQuickLinkClick(category._id)}>
                <span
                  className="me-2"
                  onClick={(e) => toggleCategory(category._id, e)}
                  style={{ cursor: 'pointer', width: '20px', display: 'inline-block', textAlign: 'center' }}
                >
                  {expandedCategories[category._id] ? '▼' : '▶'}
                </span>
                <span className="text-decoration-none btn btn-link text-start p-0">{category.name}</span>
              </div>
            </div>
            <div className={`col-12 ${expandedCategories[category._id] ? '' : 'd-none'}`}>
              <div className="ps-4">
                {subCategories
                  .filter(subCat => subCat.category === category.name)
                  .map(subCategory => (
                    <div key={subCategory._id} className="py-1">
                      <span className="me-2">-</span>
                      <button
                        onClick={() => onSubCategoryClick(category._id, subCategory.name)}
                        className="btn btn-link p-0 m-0 text-decoration-none text-start"
                      >
                        {subCategory.name}
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickLinks;
