import React from 'react';
import { Form, InputGroup, Button } from 'react-bootstrap';
import { FaEye, FaEyeSlash, FaKey } from 'react-icons/fa';
import Input from '../../Input/Input';

const ProfileForm = ({
    formData,
    handleInputChange,
    showPasswordFields,
    setShowPasswordFields,
    showPassword,
    setShowPassword
}) => {
    return (
        <>
            <Input
                label="Username*"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                placeholder="Enter username"
            />

            <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-light"
                />
                <Form.Text className="text-muted">
                    Email cannot be changed
                </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label>Role</Form.Label>
                <Form.Control
                    type="text"
                    value={formData.role}
                    disabled
                    className="bg-light"
                />
                <Form.Text className="text-muted">
                    Role cannot be changed
                </Form.Text>
            </Form.Group>

            <Input
                label="Phone"
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter phone number"
            />

            {!showPasswordFields ? (
                <Button
                    variant="outline-secondary"
                    type="button"
                    onClick={() => setShowPasswordFields(true)}
                    className="mb-3"
                >
                    <FaKey className="me-1" /> Change Password
                </Button>
            ) : (
                <div className="password-change-section border p-3 rounded mb-3">
                    <h5>Change Password</h5>

                    <Form.Group className="mb-3">
                        <Form.Label>Current Password</Form.Label>
                        <InputGroup>
                            <Form.Control
                                type={showPassword ? "text" : "password"}
                                name="currentPassword"
                                value={formData.currentPassword}
                                onChange={handleInputChange}
                                required
                                placeholder="Enter current password"
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
                        <Form.Label>New Password</Form.Label>
                        <Form.Control
                            type={showPassword ? "text" : "password"}
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleInputChange}
                            required
                            placeholder="Enter new password"
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Confirm New Password</Form.Label>
                        <Form.Control
                            type={showPassword ? "text" : "password"}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            required
                            placeholder="Confirm new password"
                        />
                    </Form.Group>

                    <Button
                        variant="link"
                        onClick={() => {
                            setShowPasswordFields(false);
                            // Reset password fields
                            handleInputChange({
                                target: { name: 'currentPassword', value: '' }
                            });
                            handleInputChange({
                                target: { name: 'newPassword', value: '' }
                            });
                            handleInputChange({
                                target: { name: 'confirmPassword', value: '' }
                            });
                        }}
                        type="button"
                    >
                        Cancel Password Change
                    </Button>
                </div>
            )}
        </>
    );
};

export default ProfileForm;