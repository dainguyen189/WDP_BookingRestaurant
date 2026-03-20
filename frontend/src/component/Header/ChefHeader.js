import React, { useState, useEffect } from 'react';
import { Navbar, Container, Nav, NavDropdown, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faUtensils, 
    faHatCowboy, 
    faSignOutAlt, 
    faClock,
    faFire,
    faCheckCircle,
    faRefresh,
    faCog
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import './ChefHeader.css';

const ChefHeader = () => {
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [stats, setStats] = useState({
        pendingOrders: 0,
        preparingOrders: 0,
        completedToday: 0
    });

    // Update current time every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    // Fetch chef stats
    useEffect(() => {
        fetchChefStats();
        // Refresh stats every 30 seconds
        const statsTimer = setInterval(fetchChefStats, 30000);
        return () => clearInterval(statsTimer);
    }, []);

    const fetchChefStats = async () => {
        try {
            const response = await fetch('/api/chef/dashboard-stats');
            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error('Error fetching chef stats:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleRefresh = () => {
        fetchChefStats();
        window.location.reload();
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('vi-VN', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
    };

    return (
        <Navbar expand="lg" className="chef-navbar" variant="dark">
            <Container>
                <Navbar.Brand href="/chef/dashboard" className="chef-brand">
                    <FontAwesomeIcon icon={faUtensils} className="me-2" />
                    Bếp
                </Navbar.Brand>

                <div className="chef-time">
                    <FontAwesomeIcon icon={faClock} className="me-1" />
                    {formatTime(currentTime)}
                </div>

                <Navbar.Toggle aria-controls="chef-navbar-nav" />
                <Navbar.Collapse id="chef-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link href="/chef/orders" className="chef-nav-link">
                            Đơn hàng
                        </Nav.Link>
                        <Nav.Link href="/chef/dashboard" className="chef-nav-link">
                            Dashboard
                        </Nav.Link>
                        <Nav.Link href="/chef/item" className="chef-nav-link">
                           Menu
                        </Nav.Link>
                    </Nav>

                    {/* Quick Stats */}
          {/* 
                    <Nav className="chef-stats">
                        <div className="stat-item pending">
                            <FontAwesomeIcon icon={faClock} className="me-1" />
                            <span>Chờ</span>
                            <Badge bg="warning" className="ms-1">
                                {stats.pendingOrders}
                            </Badge>
                        </div>
                        
                        <div className="stat-item preparing">
                            <FontAwesomeIcon icon={faFire} className="me-1" />
                            <span>Đang nấu</span>
                            <Badge bg="danger" className="ms-1">
                                {stats.preparingOrders}
                            </Badge>
                        </div>
                        
                        <div className="stat-item completed">
                            <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
                            <span>Hoàn thành</span>
                            <Badge bg="success" className="ms-1">
                                {stats.completedToday}
                            </Badge>
                        </div>
                    </Nav>
          */}

                    {/* Actions */}
                    <Nav className="ms-auto">
                        {/* <Nav.Link onClick={handleRefresh} className="action-btn" title="Refresh">
                            <FontAwesomeIcon icon={faRefresh} />
                        </Nav.Link> */}

                        <NavDropdown
                            title={
                                <span>
                                    <FontAwesomeIcon icon={faUtensils} className="me-1" />
                                    Chef
                                </span>
                            }
                            id="chef-nav-dropdown"
                            align="end"
                        >
                            <NavDropdown.Item href="/chef/profile">
                                <FontAwesomeIcon icon={faCog} className="me-1" />
                                Hồ sơ của tôi
                            </NavDropdown.Item>
                            <NavDropdown.Divider />
                            <NavDropdown.Item onClick={handleLogout}>
                                <FontAwesomeIcon icon={faSignOutAlt} className="me-1" />
                                Đăng xuất
                            </NavDropdown.Item>
                        </NavDropdown>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default ChefHeader;
