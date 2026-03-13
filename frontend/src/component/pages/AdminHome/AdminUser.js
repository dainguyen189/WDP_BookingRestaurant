import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Form, Modal, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faUserPlus, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Header from '../../Header/Header';

import './AdminUser.css';
import AdminSidebar from './AdminSidebar';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:8080/api/admin/users', {
                withCredentials: true
            });
            setUsers(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching users:', err);
            setLoading(false);
        }
    };

    const handleAddUser = () => {
        setSelectedUser(null);
        setShowUserModal(true);
    };

    const handleEditUser = (user) => {
        setSelectedUser(user);
        setShowUserModal(true);
    };

    const handleDeleteClick = (user) => {
        setSelectedUser(user);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            await axios.delete(`http://localhost:8080/api/admin/users/${selectedUser._id}`, {
                withCredentials: true
            });
            setUsers(users.filter(user => user._id !== selectedUser._id));
            setShowDeleteModal(false);
            setSelectedUser(null);
        } catch (err) {
            console.error('Error deleting user:', err);
        }
    };

    const handleSaveUser = async (formData) => {
        try {
            if (selectedUser) {
                // Update existing user
                await axios.put(`http://localhost:8080/api/admin/users/${selectedUser._id}`, formData, {
                    withCredentials: true
                });

                setUsers(users.map(u =>
                    u._id === selectedUser._id ? { ...u, ...formData } : u
                ));
            } else {
                // Create new user
                const response = await axios.post('http://localhost:8080/api/admin/users', formData, {
                    withCredentials: true
                });
                setUsers([...users, response.data]);
            }
            setShowUserModal(false);
        } catch (err) {
            console.error('Error saving user:', err);
        }
    };

    const filteredUsers = users.filter(user => {
        return (
            user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
    });

    return (
        <div className="admin-page">
            <Header />

            <Container fluid className="mt-4">
                <Row>
                    {/* Admin Sidebar */}
                    <Col md={3} lg={2} className="mb-4">
                        <AdminSidebar activeTab="users" />
                    </Col>

                    {/* Main Content */}
                    <Col md={9} lg={10}>
                        <Card className="admin-content-card">
                            <Card.Header className="d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">
                                    <FontAwesomeIcon icon={faUsers} className="me-2" />
                                    User Management
                                </h5>
                                <Button
                                    variant="warning"
                                    onClick={handleAddUser}
                                >
                                    <FontAwesomeIcon icon={faUserPlus} className="me-1" /> Add User
                                </Button>
                            </Card.Header>

                            <Card.Body>
                                {/* Search Bar */}
                                <Form className="mb-4">
                                    <Form.Group>
                                        <Form.Control
                                            type="text"
                                            placeholder="Search users by name or email..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="search-input"
                                        />
                                    </Form.Group>
                                </Form>

                                {loading ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-warning" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <p className="mt-3">Loading users...</p>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <Table hover>
                                            <thead>
                                                <tr>
                                                    <th>Username</th>
                                                    <th>Email</th>
                                                    <th>Role</th>
                                                    <th>Registered</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredUsers.map(user => (
                                                    <tr key={user._id}>
                                                        <td>{user.username}</td>
                                                        <td>{user.email}</td>
                                                        <td>
                                                            <Badge bg={user.role === 'admin' ? 'danger' : 'info'}>
                                                                {user.role}
                                                            </Badge>
                                                        </td>
                                                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                                        <td>
                                                            <Button
                                                                variant="outline-warning"
                                                                size="sm"
                                                                className="me-2"
                                                                onClick={() => handleEditUser(user)}
                                                            >
                                                                <FontAwesomeIcon icon={faEdit} />
                                                            </Button>
                                                            <Button
                                                                variant="outline-danger"
                                                                size="sm"
                                                                onClick={() => handleDeleteClick(user)}
                                                            >
                                                                <FontAwesomeIcon icon={faTrash} />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {filteredUsers.length === 0 && (
                                                    <tr>
                                                        <td colSpan="5" className="text-center py-4">
                                                            No users found
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </Table>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>

            {/* User Edit/Add Modal */}
            <Modal show={showUserModal} onHide={() => setShowUserModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {selectedUser ? 'Edit User' : 'Add New User'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <UserForm
                        user={selectedUser}
                        onSave={handleSaveUser}
                        onCancel={() => setShowUserModal(false)}
                    />
                </Modal.Body>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Deletion</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Are you sure you want to delete the user: <strong>{selectedUser?.username}</strong>?</p>
                    <p>This action cannot be undone.</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={handleDeleteConfirm}>
                        Delete
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

// User Form Component
const UserForm = ({ user, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'user'
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username || '',
                email: user.email || '',
                password: '', // Don't populate password for security
                role: user.role || 'user'
            });
        } else {
            setFormData({
                username: '',
                email: '',
                password: '',
                role: 'user'
            });
        }
    }, [user]);

    const validateForm = () => {
        let valid = true;
        const newErrors = {};

        if (!formData.username.trim()) {
            newErrors.username = 'Username is required';
            valid = false;
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
            valid = false;
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
            valid = false;
        }

        if (!user && !formData.password.trim()) {
            newErrors.password = 'Password is required for new users';
            valid = false;
        } else if (!user && formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
            valid = false;
        }

        setErrors(newErrors);
        return valid;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            const dataToSend = { ...formData };

            // Don't send empty password when updating
            if (user && !dataToSend.password) {
                delete dataToSend.password;
            }

            onSave(dataToSend);
        }
    };

    return (
        <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
                <Form.Label>Username</Form.Label>
                <Form.Control
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    isInvalid={!!errors.username}
                />
                <Form.Control.Feedback type="invalid">
                    {errors.username}
                </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    isInvalid={!!errors.email}
                />
                <Form.Control.Feedback type="invalid">
                    {errors.email}
                </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label>{user ? 'Password (leave blank to keep current)' : 'Password'}</Form.Label>
                <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    isInvalid={!!errors.password}
                />
                <Form.Control.Feedback type="invalid">
                    {errors.password}
                </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label>Role</Form.Label>
                <Form.Select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                </Form.Select>
            </Form.Group>

            <div className="d-flex justify-content-end">
                <Button variant="secondary" className="me-2" onClick={onCancel}>
                    Cancel
                </Button>
                <Button variant="warning" type="submit">
                    {user ? 'Update User' : 'Add User'}
                </Button>
            </div>
        </Form>
    );
};

export default AdminUsers;