import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button } from 'react-bootstrap';
import UserForm from './UserForm';

const UserEditModal = ({ show, handleClose, user, onEditSuccess, onError }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: '',
        phone: ''
    });

    // Set initial form data when user prop changes
    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username || '',
                email: user.email || '',
                password: '',
                role: user.role || 'user',
                phone: user.phone || ''
            });
        }
    }, [user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleEditUser = async () => {
        try {
            const token = localStorage.getItem('token');

            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };

            // Prepare data - remove password if empty
            const updateData = { ...formData };
            if (!updateData.password) {
                delete updateData.password;
            }

            // Validate required fields
            if (!updateData.username || !updateData.email) {
                onError('Username and email are required.');
                return;
            }

            await axios.put(`http://localhost:8080/api/user/updateUser/${user._id}`, updateData, config);

            // Notify parent of success
            onEditSuccess();
        } catch (err) {
            onError('Failed to update user. ' + (err.response?.data?.message || err.message));
            console.error('Error updating user:', err);
        }
    };

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Chỉnh sửa người dùng</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <UserForm
                    formData={formData}
                    handleInputChange={handleInputChange}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    isEditMode={true}
                />
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Hủy
                </Button>
                <Button variant="primary" onClick={handleEditUser}>
                    Lưu thay đổi
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default UserEditModal;
