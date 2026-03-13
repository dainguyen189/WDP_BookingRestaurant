import React from 'react';
import { Card, Nav } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUsers,
    faUtensils,
    faCalendarAlt,
    faClipboardList,
    faCog,
    faTachometerAlt,
    faUserShield
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import './AdminSidebar.css';

const AdminSidebar = ({ activeTab }) => {
    return (
        <Card className="admin-sidebar">
            <Card.Header>
                <h5 className="mb-0">
                    <FontAwesomeIcon icon={faUserShield} className="me-2" />
                    Admin Panel
                </h5>
            </Card.Header>
            <Card.Body className="p-0">
                <Nav className="flex-column admin-nav">
                    <Nav.Link
                        as={Link}
                        to="/admin"
                        className={activeTab === 'dashboard' ? 'active' : ''}
                    >
                        <FontAwesomeIcon icon={faTachometerAlt} className="me-2" />
                        Dashboard
                    </Nav.Link>

                    <Nav.Link
                        as={Link}
                        to="/admin/bookings"
                        className={activeTab === 'bookings' ? 'active' : ''}
                    >
                        <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                        Manage Bookings
                    </Nav.Link>

                    <Nav.Link
                        as={Link}
                        to="/admin/users"
                        className={activeTab === 'users' ? 'active' : ''}
                    >
                        <FontAwesomeIcon icon={faUsers} className="me-2" />
                        Manage Users
                    </Nav.Link>

                    <Nav.Link
                        as={Link}
                        to="/admin/menu"
                        className={activeTab === 'menu' ? 'active' : ''}
                    >
                        <FontAwesomeIcon icon={faClipboardList} className="me-2" />
                        Manage Menu
                    </Nav.Link>

                    <Nav.Link
                        as={Link}
                        to="/admin/restaurant"
                        className={activeTab === 'restaurant' ? 'active' : ''}
                    >
                        <FontAwesomeIcon icon={faUtensils} className="me-2" />
                        Restaurant Settings
                    </Nav.Link>

                    <Nav.Link
                        as={Link}
                        to="/admin/settings"
                        className={activeTab === 'settings' ? 'active' : ''}
                    >
                        <FontAwesomeIcon icon={faCog} className="me-2" />
                        System Settings
                    </Nav.Link>
                </Nav>
            </Card.Body>
        </Card>
    );
};

export default AdminSidebar;