import React from 'react';
import { Form, InputGroup, Button } from 'react-bootstrap';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Input from '../../Input/Input';

const UserForm = ({ formData, handleInputChange, showPassword, setShowPassword, isEditMode = false }) => {
    return (
        <Form>
            <Input
                label="Tên đăng nhập*"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                placeholder="Enter username"
            />

            <Input
                label="Email*"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="Enter email"
            />

            <Form.Group className="mb-3">
                <Form.Label>{isEditMode ? "Password (leave blank to keep unchanged)" : "Password*"}</Form.Label>
                <InputGroup>
                    <Form.Control
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required={!isEditMode}
                        placeholder={isEditMode ? "Enter new password" : "Enter password"}
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
                <Form.Label>Role</Form.Label>
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
                label="Phone"
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter phone number"
            />
        </Form>
    );
};

export default UserForm;
