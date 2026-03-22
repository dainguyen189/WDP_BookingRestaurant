import React, { useState } from "react";
import { Navbar, Container, Nav, NavDropdown } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUtensils, faUser, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate } from 'react-router-dom';
import { useOrder } from "../../context/OrderContext";
import CartDrawer from "../pages/Order/CartDrawer";
import { useLocation } from 'react-router-dom';


import './Header.css';

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const sessionId = searchParams.get("sessionId");


    const user = JSON.parse(localStorage.getItem("user"));
    const { cartItems } = useOrder();
    const [isDrawerOpen, setDrawerOpen] = useState(false);


    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };
    return (
        <>
            <Navbar expand="lg" className="custom-navbar" variant="dark">
                <Container>
                    <Navbar.Brand href="/home" className="brand">
                        <FontAwesomeIcon icon={faUtensils} className="me-2" />
                        Restaurant Booking
                    </Navbar.Brand>

                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="ms-auto">
                            <Nav.Link href="/home" className="nav-link">Home</Nav.Link>
                            <Nav.Link as={Link} to="/booking" className="nav-link">Đặt bàn</Nav.Link>
                            <Nav.Link href="/aboutus" className="nav-link">About Us</Nav.Link>
                            <Nav.Link as={Link} to="/view-menu" className="nav-link">Menu</Nav.Link>

                            {sessionId && (
                                <>

                                    <Nav.Link
                                        onClick={() => navigate(`/menu?sessionId=${sessionId}`)}
                                        className="nav-link"
                                    >
                                        Menu
                                    </Nav.Link>
                                    <Nav.Link
                                        onClick={() => navigate(`/checkout?sessionId=${sessionId}`)}
                                        className="nav-link"
                                    >
                                        View Bill
                                    </Nav.Link>


                                    <Nav.Link
                                        onClick={() => setDrawerOpen(true)}
                                        className="nav-link"
                                        style={{
                                            border: "1px solid white",
                                            borderRadius: "4px",
                                            padding: "0.3rem 0.7rem",
                                            marginLeft: "10px",
                                        }}
                                    >
                                        🧾 Your Order ({cartItems.length})
                                    </Nav.Link>
                                </>
                            )}
                            <NavDropdown
                                title={
                                    <span>
                                        <FontAwesomeIcon icon={faUser} className="me-1" />
                                        {user ? user.username : "Profile"}
                                    </span>
                                }
                                id="basic-nav-dropdown"
                                align="end"
                            >
                                {user && (
                                    <>
                                        <NavDropdown.Item as={Link} to="/profile">Settings</NavDropdown.Item>
                                        <NavDropdown.Divider />
                                        <NavDropdown.Item onClick={handleLogout}>
                                            <FontAwesomeIcon icon={faSignOutAlt} className="me-1" />
                                            Logout
                                        </NavDropdown.Item>
                                    </>
                                )}
                                {!user && (
                                    <NavDropdown.Item as={Link} to="/login">
                                        Login
                                    </NavDropdown.Item>
                                )}

                            </NavDropdown>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            {/* ✅ Drawer */}
            <CartDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} />
        </>

    );
};

export default Header;