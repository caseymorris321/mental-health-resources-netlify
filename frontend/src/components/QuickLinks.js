import React from 'react';

const QuickLinks = ({ categories }) => (
  <div className="quick-links">
    <h3>Quick Links</h3>
    <ul>
      {categories.slice(0, 5).map(category => (
        <li key={category._id}>
          <a href={`#${category.name.toLowerCase().replace(/\s+/g, '-')}`}>{category.name}</a>
        </li>
      ))}
    </ul>
  </div>
);

export default QuickLinks;