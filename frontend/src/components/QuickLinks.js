import React from 'react';

const QuickLinks = ({ categories, onQuickLinkClick }) => (
  <div className="quick-links d-flex justify-content-center">
    <div>
      <h3 className="text-center">Quick Links</h3>
      <ul className="list-unstyled ps-3">
        {categories.slice(0, 5).map(category => (
          <li key={category._id} className="d-flex align-items-center py-1">
            <span className="me-2">•</span>
            <button
              onClick={() => onQuickLinkClick(category._id)}
              className="btn btn-link p-0 m-0 text-decoration-none text-start"
            >
              {category.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

export default QuickLinks;