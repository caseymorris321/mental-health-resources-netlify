import React, { useState } from 'react';
import { Accordion } from 'react-bootstrap';

const TableOfContents = ({ categories, subCategories }) => {
  const [activeKey, setActiveKey] = useState('0');

  const handleToggle = (eventKey) => {
    setActiveKey(eventKey === activeKey ? '' : eventKey);
  };

  return (
    <Accordion activeKey={activeKey} onSelect={handleToggle}>
      <Accordion.Item eventKey="0">
        <Accordion.Header>Table of Contents</Accordion.Header>
        <Accordion.Body>
          <ul>
            {categories && categories.map(category => {
              const categorySubCategories = subCategories.filter(
                subCat => subCat.category.toLowerCase() === category.name.toLowerCase()
              );

              if (categorySubCategories.length === 0) return null;

              return (
                <li key={category._id}>
                  <a href={`#${category.name.toLowerCase().replace(/\s+/g, '-')}`}>{category.name}</a>
                  <ul>
                    {categorySubCategories.map(subCategory => (
                      <li key={subCategory._id}>
                        <a href={`#${category.name.toLowerCase().replace(/\s+/g, '-')}-${subCategory.name.toLowerCase().replace(/\s+/g, '-')}`}>
                          {subCategory.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
};

export default TableOfContents;