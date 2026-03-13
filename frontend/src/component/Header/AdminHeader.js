import React from 'react';
import { Navbar, Container, Nav, NavDropdown } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUtensils, faUserShield, faSignOutAlt, faUsers } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, Link } from 'react-router-dom';
import './AdminHeader.css';
import { FaGift, FaSignOutAlt, FaUserCircle } from 'react-icons/fa';

const AdminHeader = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <Navbar expand="lg" className="custom-navbar" variant="dark">
            <Container>
                <Navbar.Brand href="/admin" className="brand">
                    <FontAwesomeIcon icon={faUtensils} className="me-2" />
                    Trang Admin
                </Navbar.Brand>

                <Navbar.Toggle aria-controls="admin-navbar-nav" />
                <Navbar.Collapse id="admin-navbar-nav">                    <Nav className="ms-auto">
                    <Nav.Link as={Link} to="/admin" className="nav-link">Tổng quan </Nav.Link>
                    <Nav.Link as={Link} to="/admin/tables" className="nav-link">Bàn</Nav.Link>
                    <Nav.Link as={Link} to="/admin/reservation" className="nav-link">Đặt bàn</Nav.Link>
                    <Nav.Link as={Link} to="/admin/orders" className="nav-link">Đơn hàng</Nav.Link>

                    <Nav.Link as={Link} to="/admin/users" className="nav-link">
                        
                        Người dùng
                    </Nav.Link>
                    <Nav.Link href="/admin/promotions">
                        
                        Khuyến mãi
                    </Nav.Link>
                    <Nav.Link as={Link} to="/admin/category" className="nav-link">Danh mục</Nav.Link>
                    <Nav.Link as={Link} to="/admin/item" className="nav-link">Thực đơn</Nav.Link>
                    <NavDropdown
                        title={<span><FaUserCircle className="me-1" />Admin</span>}
                        id="admin-dropdown"
                        align="end"
                    >
                        <NavDropdown.Item as={Link} to="/admin/profile">
                            <FaUserCircle className="me-1" />
                            Hồ sơ của tôi
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

export default AdminHeader;
