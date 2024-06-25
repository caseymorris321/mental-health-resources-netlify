import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

const AccessDenied = () => {
  const { logout } = useAuth0();

  const handleTryAgain = () => {
    localStorage.setItem('redirectAfterLogout', '/login');
    
    logout({ returnTo: window.location.origin });
  };

  return (
    <div className='text-center'>
      <h1>Access Denied</h1>
      <p>You do not have permission to access this page.</p>
      <button onClick={handleTryAgain}>Try Again</button>
      <br />
      <Link to="/">Return to Home</Link>
    </div>
  );
};

export default AccessDenied;