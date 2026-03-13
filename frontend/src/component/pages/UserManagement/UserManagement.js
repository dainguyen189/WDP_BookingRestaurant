import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Alert, Spinner, Row, Col, Button } from 'react-bootstrap';
import { FaUserPlus } from 'react-icons/fa';


import './UserManagement.css';
import UserList from './UserList';
import UserAddModal from './UserAddModal';
import UserEditModal from './UserEditModal';
import UserDeleteModal from './UserDeleteModal';
import UserFilters from './UserFilters';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // Modals state
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    // Search and filter
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (users.length > 0) {
            applyFilters();
        }
    }, [users, searchTerm, filterRole]); const fetchUsers = async () => {
        try {
            setLoading(true);

            // Lấy token trực tiếp từ localStorage (đã được lưu từ Login.js)
            const token = localStorage.getItem('token');

            const config = {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                withCredentials: true // Quan trọng để gửi cookies
            };

            console.log('Fetching users with token:', token ? `${token.substring(0, 15)}...` : 'No token');
            const response = await axios.get('http://localhost:8080/api/user', config);
            setUsers(response.data);
            setError(null);
        } catch (err) {
            console.error('Full error object:', err);
            const errorMessage = err.response?.data?.message || err.message;
            setError('Failed to load users: ' + errorMessage);
            console.error('Error fetching users:', errorMessage);

            // Kiểm tra lỗi xác thực
            if (err.response?.status === 401 || err.response?.status === 403) {
                alert('Authentication failed. You may need to login again.');
                // Có thể chuyển hướng đến trang login ở đây
                // navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let result = [...users];

        // Apply search term
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            result = result.filter(
                user =>
                    user.username.toLowerCase().includes(searchLower) ||
                    user.email.toLowerCase().includes(searchLower) ||
                    (user.phone && user.phone.includes(searchTerm))
            );
        }

        // Apply role filter
        if (filterRole !== 'all') {
            result = result.filter(user => user.role === filterRole);
        }

        setFilteredUsers(result);
    };

    const handleAddSuccess = (message) => {
        setSuccessMessage(message || 'User added successfully!');
        setShowAddModal(false);
        fetchUsers();

        // Clear success message after 3 seconds
        setTimeout(() => {
            setSuccessMessage(null);
        }, 3000);
    };

    const handleEditSuccess = (message) => {
        setSuccessMessage(message || 'User updated successfully!');
        setShowEditModal(false);
        setCurrentUser(null);
        fetchUsers();

        // Clear success message after 3 seconds
        setTimeout(() => {
            setSuccessMessage(null);
        }, 3000);
    };

    const handleDeleteSuccess = (message) => {
        setSuccessMessage(message || 'User deleted successfully!');
        setShowDeleteModal(false);
        setCurrentUser(null);
        fetchUsers();

        // Clear success message after 3 seconds
        setTimeout(() => {
            setSuccessMessage(null);
        }, 3000);
    };

    const openEditModal = (user) => {
        setCurrentUser(user);
        setShowEditModal(true);
    };

    const openDeleteModal = (user) => {
        setCurrentUser(user);
        setShowDeleteModal(true);
    };

    return (
        <Container className="mt-4 user-management-container">
            <Row className="mb-4">
                <Col>
                    <h2>Quản lý người dùng</h2>
                </Col>
                <Col xs="auto">
                    <Button
                        variant="primary"
                        onClick={() => setShowAddModal(true)}
                        className="add-user-btn"
                    >
                        <FaUserPlus className="me-2" /> Thêm người dùng
                    </Button>
                </Col>
            </Row>

            {error && <Alert variant="danger">{error}</Alert>}
            {successMessage && (
                <Alert variant="success" className="success-message">
                    {successMessage}
                </Alert>
            )}

            <UserFilters
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filterRole={filterRole}
                setFilterRole={setFilterRole}
            />

            {loading ? (
                <div className="text-center my-5">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                </div>
            ) : (
                <UserList
                    users={filteredUsers}
                    onEdit={openEditModal}
                    onDelete={openDeleteModal}
                />
            )}

            <UserAddModal
                show={showAddModal}
                handleClose={() => setShowAddModal(false)}
                onAddSuccess={handleAddSuccess}
                onError={setError}
            />

            {currentUser && (
                <>
                    <UserEditModal
                        show={showEditModal}
                        handleClose={() => setShowEditModal(false)}
                        user={currentUser}
                        onEditSuccess={handleEditSuccess}
                        onError={setError}
                    />

                    <UserDeleteModal
                        show={showDeleteModal}
                        handleClose={() => setShowDeleteModal(false)}
                        user={currentUser}
                        onDeleteSuccess={handleDeleteSuccess}
                        onError={setError}
                    />
                </>
            )}
        </Container>
    );
};

export default UserManagement;