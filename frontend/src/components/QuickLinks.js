import React from 'react';

const QuickLinks = ({ categories, onQuickLinkClick }) => (
  <div className="quick-links">
    <h3>Quick Links</h3>
    <ul className="list-unstyled">
      {categories.slice(0, 5).map(category => (
        <li key={category._id}>
          <button
            onClick={() => onQuickLinkClick(category._id)}
            className="quick-link-button btn btn-link text-decoration-none"
          >
            {category.name}
          </button>
        </li>
      ))}
    </ul>
  </div>
);

export default QuickLinks;