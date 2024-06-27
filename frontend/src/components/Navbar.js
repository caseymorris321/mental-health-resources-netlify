import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar, Container, Nav } from 'react-bootstrap';
import LogoutButton from './LogoutButton';
import Profile from './Profile';

const CustomNavbar = () => {
  return (
    <Navbar bg="light" expand="lg">
      <Container>
        <div className="d-flex justify-content-between align-items-center w-100">
          <Link to="/" className="text-decoration-none">
            <div className="d-flex align-items-center">
              <img 
                src="https://via.placeholder.com/50" 
                className="rounded-circle me-3" 
                alt="logo" 
                width="50" 
                height="50"
              />
              <span className="navbar-brand mb-0 d-none d-lg-inline">Resource Manager</span>
            </div>
          </Link>
          <Navbar.Toggle aria-controls="navbar-nav" className="d-lg-none" />
          <Navbar.Collapse id="navbar-nav" className="justify-content-end">
            <div className="d-flex align-items-center">
              <Link to="/admin" className='text-decoration-none me-3'>
                <Profile />
              </Link>
              <LogoutButton />
            </div>
          </Navbar.Collapse>
        </div>
      </Container>
    </Navbar>
  );
};

export default CustomNavbar;