import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar, Container, Nav } from 'react-bootstrap';
import LogoutButton from './LogoutButton';
import Profile from './Profile';

const CustomNavbar = () => {
  return (
    <Navbar bg="light" expand="md" className="mb-3">
      <Container fluid>
        <Link to="/" className="navbar-brand d-flex align-items-center text-decoration-none">
          <img
            src="https://via.placeholder.com/50"
            className="rounded-circle me-2"
            alt="logo"
            width="40"
            height="40"
          />
          <span className="d-none d-sm-inline">Resource Manager</span>
        </Link>
        <Navbar.Toggle aria-controls="navbar-nav" />
        <Navbar.Collapse id="navbar-nav" className="justify-content-end">
          <Nav>
            <Link to="/admin" className="nav-link">
              <Profile />
            </Link>
            <Nav.Item>
              <LogoutButton />
            </Nav.Item>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default CustomNavbar;