import React, { useState } from 'react';
import axios from 'axios';
import { Modal, Button, Form, InputGroup } from 'react-bootstrap';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Input from '../../Input/Input';

const UserAddModal = ({ show, handleClose, onAddSuccess, onError }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'user',
        phone: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const resetForm = () => {
        setFormData({
            username: '',
            email: '',
            password: '',
            role: 'user',
            phone: ''
        });
        setShowPassword(false);
    };

    const handleAddUser = async () => {
        try {
            const token = localStorage.getItem('token');

            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                withCredentials: true
            };

            // Validate form data
            if (!formData.username || !formData.email || !formData.password) {
                onError('Please fill in all required fields.');
                return;
            }

            await axios.post('http://localhost:8080/api/user/createUser', formData, config);

            // Reset form and notify parent of success
            resetForm();
            onAddSuccess('User added successfully!');
        } catch (err) {
            onError('Failed to add user. ' + (err.response?.data?.message || err.message));
            console.error('Error adding user:', err);
        }
    };

    // Handle modal close properly
    const handleModalClose = () => {
        resetForm();
        handleClose();
    };

    return (
        <Modal show={show} onHide={handleModalClose}>
            <Modal.Header closeButton>
                <Modal.Title>Thêm người dùng mới</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Input
                        label="Tên đăng nhập"
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        placeholder="Nhập tên người dùng"
                        required
                    />

                    <Input
                        label="Email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Nhập email"
                        required
                    />

                    <Form.Group className="mb-3">
                        <Form.Label>Mật khẩu</Form.Label>
                        <InputGroup>
                            <Form.Control
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="Nhập mật khẩu"
                                required
                            />
                            <Button
                                variant="outline-secondary"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </Button>
                        </InputGroup>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Vai trò</Form.Label>
                        <Form.Select
                            name="role"
                            value={formData.role}
                            onChange={handleInputChange}
                        >
                            <option value="user">Người dùng</option>
                            <option value="admin">Quản trị viên</option>
                            <option value="staff">Nhân viên</option>
                            <option value="chef">Đầu bếp</option>
                            <option value="cashier">Thu ngân</option>
                        </Form.Select>
                    </Form.Group>

                    <Input
                        label="Số điện thoại"
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Nhập số điện thoại"
                    />
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleModalClose}>
                    Hủy
                </Button>
                <Button variant="primary" onClick={handleAddUser}>
                    Thêm người dùng
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default UserAddModal;
