import React from 'react';
import { Navbar, Container, Nav, NavDropdown } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUtensils } from '@fortawesome/free-solid-svg-icons'; 
import { useNavigate, Link } from 'react-router-dom';
import './AdminHeader.css';
import { FaSignOutAlt, FaUserCircle } from 'react-icons/fa';

const CashierHeader = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <Navbar expand="lg" className="custom-navbar" variant="dark">
            <Container>
                <Navbar.Brand as={Link} to="/cashier/tables" className="brand">
                    <FontAwesomeIcon icon={faUtensils} className="me-2" />
                    Khu vực Thu ngân
                </Navbar.Brand>

                <Navbar.Toggle aria-controls="cashier-navbar-nav" />
                <Navbar.Collapse id="cashier-navbar-nav">
                    <Nav className="ms-auto">
                        <Nav.Link as={Link} to="/cashier/tables" className="nav-link">Bàn ăn</Nav.Link>
                        <Nav.Link as={Link} to="/cashier/reservation" className="nav-link">Đặt bàn</Nav.Link>
                        <Nav.Link as={Link} to="/cashier/pre-order" className="nav-link">Đơn đặt trước</Nav.Link>
                        <Nav.Link as={Link} to="/cashier/orders" className="nav-link">Quản lý đơn</Nav.Link>


                        <NavDropdown
                            title={<span><FaUserCircle className="me-1" />Cashier</span>}
                            id="cashier-dropdown"
                            align="end"
                        >
                            <NavDropdown.Item as={Link} to="/cashier/profile">
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

export default CashierHeader;
