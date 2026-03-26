import React from 'react';
import { Navbar, Container, Nav, NavDropdown } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUtensils } from '@fortawesome/free-solid-svg-icons'; 
import { useNavigate, Link } from 'react-router-dom';
import './css/AdminHeader.css';
import { FaSignOutAlt, FaUserCircle } from 'react-icons/fa';

const WaiterHeader = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <Navbar expand="lg" className="custom-navbar" variant="dark">
            <Container>
                <Navbar.Brand as={Link} to="/waiter/tables" className="brand">
                    <FontAwesomeIcon icon={faUtensils} className="me-2" />
                    Khu vực Thu ngân
                </Navbar.Brand>

                <Navbar.Toggle aria-controls="waiter-navbar-nav" />
                <Navbar.Collapse id="waiter-navbar-nav">
                    <Nav className="ms-auto">
                        <Nav.Link as={Link} to="/waiter/tables" className="nav-link">Bàn ăn</Nav.Link>
                        <Nav.Link as={Link} to="/waiter/reservation" className="nav-link">Đặt bàn</Nav.Link>
                        <Nav.Link as={Link} to="/waiter/pre-order" className="nav-link">Đơn đặt trước</Nav.Link>
                        <Nav.Link as={Link} to="/waiter/orders" className="nav-link">Quản lý đơn</Nav.Link>


                        <NavDropdown
                            title={<span><FaUserCircle className="me-1" />Waiter</span>}
                            id="waiter-dropdown"
                            align="end"
                        >
                            <NavDropdown.Item as={Link} to="/waiter/profile">
                                <FaUserCircle className="me-1" />
                                Hồ sơ 
                            </NavDropdown.Item>
                            <NavDropdown.Divider />
                            <NavDropdown.Item onClick={handleLogout}>
                                <FaSignOutAlt className="me-1" />
                                Đăng xuất
                            </NavDropdown.Item>
                        </NavDropdown>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default WaiterHeader;
