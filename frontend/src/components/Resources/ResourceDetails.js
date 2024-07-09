import React, { useState } from 'react';
import { Button, Card } from 'react-bootstrap';
import CreateResourceForm from '../CreateResourceForm';
import '../../loading.css';

const ResourceDetails = ({ resource, onUpdate, onDelete, showAdminControls }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  if (!resource) {
    return <div className="loading-text">Loading...</div>;
  }

  const handleUpdate = (updatedResource) => {
    onUpdate(updatedResource);
    setIsUpdating(false);
  };

  const formatLink = (link) => {
    if (!link) return '';
    if (link.startsWith('http://') || link.startsWith('https://')) {
      return link;
    } else if (link.startsWith('www.')) {
      return `https://${link}`;
    } else {
      return `https://www.${link}`;
    }
  };

  return (
    <Card className="mt-4 mb-1">
      <Card.Body>
        {showAdminControls && (
          <div className="d-flex justify-content-end mb-2">
            <Button variant="outline-primary" onClick={onUpdate} className="me-2">
              Update
            </Button>
            <Button variant="outline-danger" onClick={onDelete}>
              Delete
            </Button>
          </div>
        )}
        {isUpdating ? (
          <CreateResourceForm
            initialData={resource}
            onSubmit={handleUpdate}
            onCancel={() => setIsUpdating(false)}
          />
        ) : (
          <>
            <Card.Title>{resource.name}</Card.Title>
            <Card.Text>
              <strong>Description:</strong><br />
              {resource.description.split('\n').map((line, index) => (
                <React.Fragment key={index}>
                  {line}
                  <br />
                </React.Fragment>
              ))}
            </Card.Text>
            <Card.Text>
              <strong>Link:</strong>{' '}
              <a href={formatLink(resource.link)} target="_blank" rel="noopener noreferrer">
                {resource.link}
              </a>
            </Card.Text>
            <Card.Text>
              <strong>Contact Info:</strong><br />
              {resource.contactInfo.split('\n').map((line, index) => (
                <React.Fragment key={index}>
                  {line}
                  <br />
                </React.Fragment>
              ))}
            </Card.Text>
            <Card.Text>
              <strong>Address:</strong><br />
              {resource.address.split('\n').map((line, index) => (
                <React.Fragment key={index}>
                  {line}
                  <br />
                </React.Fragment>
              ))}
            </Card.Text>
            <Card.Text>
              <strong>Available Hours:</strong><br />
              {resource.availableHours.split('\n').map((line, index) => (
                <React.Fragment key={index}>
                  {line}
                  <br />
                </React.Fragment>
              ))}
            </Card.Text>
            <Card.Text><strong>Tags:</strong> {resource.tags.join(', ')}</Card.Text>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default ResourceDetails;