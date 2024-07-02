import React from 'react';

const QuickLinks = ({ categories, onQuickLinkClick }) => (
  <div className="quick-links">
    <h3>Quick Links</h3>
    <ul className="ps-4">
      {categories.slice(0, 5).map(category => (
        <li key={category._id} className="py-1">
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
);

export default QuickLinks;