import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar, Container } from 'react-bootstrap';
import LogoutButton from './LogoutButton';
import Profile from './Profile';
import { useAuth0 } from '@auth0/auth0-react';

const CustomNavbar = () => {
  const { isAuthenticated } = useAuth0();

  return (
    <Navbar bg="lotus" variant="dark" expand="lg">
      <Container>
        <div className="d-flex justify-content-between align-items-center w-100">
          <Link to="/" className="text-decoration-none">
            <div className="d-flex align-items-center">
              <img 
                src="/logo192.png" 
                className="rounded-circle me-3" 
                alt="logo" 
                width="50" 
                height="50"
              />
              <span className="navbar-brand mb-0">Lotus Resource Manager</span>
            </div>
          </Link>
          {isAuthenticated && (
            <Navbar.Toggle aria-controls="navbar-nav" className="d-lg-none" />
          )}
          <div className="d-none d-lg-flex align-items-center">
            {isAuthenticated && (
              <>
                <Link to="/admin" className='text-decoration-none me-3'>
                  <Profile />
                </Link>
                <LogoutButton />
              </>
            )}
          </div>
        </div>
        {isAuthenticated && (
          <Navbar.Collapse id="navbar-nav" className="justify-content-end">
            <div className="d-flex flex-column align-items-end d-lg-none">
              <Link to="/admin" className='text-decoration-none mb-2'>
                <Profile />
              </Link>
              <LogoutButton />
            </div>
          </Navbar.Collapse>
        )}
      </Container>
    </Navbar>
  );
};

export default CustomNavbar;