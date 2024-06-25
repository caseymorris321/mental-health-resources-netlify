import React, { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
  const { loginWithRedirect, error, isAuthenticated } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (error) {
      navigate('/access-denied');
    } else if (isAuthenticated) {
      navigate('/admin');
    }
  }, [error, isAuthenticated, navigate]);

  const handleLogin = () => {
    loginWithRedirect({
      appState: { returnTo: '/admin' }
    });
  };

  return (
    <div className='text-center'>
      <h1>Admin Login</h1>
      <button onClick={handleLogin} className='btn btn-primary btn-lg'>Sign In</button>
    </div>
  );
};

export default AdminLogin;