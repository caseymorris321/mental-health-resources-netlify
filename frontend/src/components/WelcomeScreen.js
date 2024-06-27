import React from 'react';

const WelcomeScreen = ({ onClose }) => (
  <div className="welcome-screen">
    <h2>Welcome to Mental Health Resources</h2>
    <p>This site provides a comprehensive list of mental health resources. Use the search bar to find specific resources, or browse through our categories.</p>
    <button className="btn btn-primary" onClick={onClose}>Get Started</button>
  </div>
);

export default WelcomeScreen;