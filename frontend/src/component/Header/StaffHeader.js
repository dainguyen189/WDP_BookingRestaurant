import React from 'react';
import { Navbar, Container, Nav, NavDropdown } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUtensils, faUserShield, faSignOutAlt, faUsers } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, Link } from 'react-router-dom';
import './StaffHeader.css';
import { FaSignOutAlt, FaUserCircle } from 'react-icons/fa';

const StaffHeader = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <Navbar expand="lg" className="custom-navbar" variant="dark">
      <Container>
        <Navbar.Brand href="/staff/dashboard" className="brand">
          <FontAwesomeIcon icon={faUtensils} className="me-2" />
          Staff Panel
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="admin-navbar-nav" />
        <Navbar.Collapse id="admin-navbar-nav">                    <Nav className="ms-auto">
          <Nav.Link as={Link} to="/staff/reservation" className="nav-link">Bookings</Nav.Link>
          <Nav.Link as={Link} to="/staff/order" className="nav-link">Order</Nav.Link>
          <NavDropdown
            title={<span><FaUserCircle className="me-1" />Staff</span>}
            id="staff-dropdown"
            align="end"
          >
            <NavDropdown.Item as={Link} to="/staff/profile">
              <FaUserCircle className="me-1" />
              My Profile
            </NavDropdown.Item>
            <NavDropdown.Divider />
            <NavDropdown.Item onClick={handleLogout}>
              <FaSignOutAlt className="me-1" />
              Logout
            </NavDropdown.Item>
          </NavDropdown>
        </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default StaffHeader;
