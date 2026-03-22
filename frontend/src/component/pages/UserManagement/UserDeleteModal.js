// filepath: e:\WDP_SU25\BookingRestaurant\client\src\components\admin\users\UserDeleteModal.js
import React from 'react';
import axios from 'axios';
import { Modal, Button } from 'react-bootstrap';

const UserDeleteModal = ({ show, handleClose, user, onDeleteSuccess, onError }) => {
    const handleDeleteUser = async () => {
        try {
            const token = localStorage.getItem('token');

            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };

            await axios.delete(`http://localhost:8080/api/user/deleteUser/${user._id}`, config);

            // Notify parent of success
            onDeleteSuccess();
        } catch (err) {
            onError('Failed to delete user. ' + (err.response?.data?.message || err.message));
            console.error('Error deleting user:', err);
        }
    };

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Xác nhận xóa</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                Bạn có chắc chắn muốn xóa người dùng <strong>{user?.username}</strong>? Hành động này không thể hoàn tác.
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Hủy
                </Button>
                <Button variant="danger" onClick={handleDeleteUser}>
                    Xóa
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default UserDeleteModal;