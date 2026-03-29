import React, { useState } from 'react';
import { Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUtensils } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Button from '../../Button/Button';
import Input from '../../Input/Input';
import './css/Register.css';

const emailRegex   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;

const Register = () => {
    const navigate = useNavigate();
    const [email, setEmail]                   = useState('');
    const [username, setUsername]             = useState('');
    const [password, setPassword]             = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError]                   = useState('');
    const [fieldErrors, setFieldErrors]       = useState({});
    const [loading, setLoading]               = useState(false);

    // ── inline validators ────────────────────────────────────────────────────
    const validateEmail = (val) => {
        if (!val) return 'Email là bắt buộc';
        if (!emailRegex.test(val)) return 'Email không hợp lệ';
        return '';
    };

    const validateUsername = (val) => {
        if (!val.trim()) return 'Tên người dùng là bắt buộc';
        return '';
    };

    const validatePassword = (val) => {
        if (!val) return 'Mật khẩu là bắt buộc';
        if (val.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự';
        if (!/[A-Z]/.test(val)) return 'Mật khẩu phải có ít nhất 1 chữ hoa';
        if (!/[^A-Za-z0-9]/.test(val)) return 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt';
        return '';
    };

    const validateConfirmPassword = (val) => {
        if (!val) return 'Vui lòng xác nhận mật khẩu';
        if (val !== password) return 'Mật khẩu không khớp';
        return '';
    };

    // ── field-level onChange handlers ────────────────────────────────────────
    const handleEmailChange = (e) => {
        const val = e.target.value;
        setEmail(val);
        setFieldErrors((prev) => ({ ...prev, email: validateEmail(val) }));
    };

    const handleUsernameChange = (e) => {
        const val = e.target.value;
        setUsername(val);
        setFieldErrors((prev) => ({ ...prev, username: validateUsername(val) }));
    };

    const handlePasswordChange = (e) => {
        const val = e.target.value;
        setPassword(val);
        setFieldErrors((prev) => ({
            ...prev,
            password: validatePassword(val),
            // re-check confirm whenever password changes
            confirmPassword: confirmPassword ? validateConfirmPassword(confirmPassword) : prev.confirmPassword,
        }));
    };

    const handleConfirmPasswordChange = (e) => {
        const val = e.target.value;
        setConfirmPassword(val);
        setFieldErrors((prev) => ({ ...prev, confirmPassword: validateConfirmPassword(val) }));
    };

    // ── submit ───────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // run all validators at once on submit
        const errs = {
            username:        validateUsername(username),
            email:           validateEmail(email),
            password:        validatePassword(password),
            confirmPassword: validateConfirmPassword(confirmPassword),
        };
        setFieldErrors(errs);

        if (Object.values(errs).some(Boolean)) return;

        try {
            setLoading(true);
            const response = await axios.post('http://localhost:8080/api/auth/register', {
                email,
                username,
                password,
            });

            if (response.data) {
                navigate('/login');
            } else {
                setError('Invalid response from server');
            }
        } catch (err) {
            let feedbackMsg = 'Registration failed. Please try again.';
            if (err.response?.data) {
                feedbackMsg = err.response.data.message || feedbackMsg;
            }
            setError(feedbackMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-page">
            <div className="register-card">
                <div className="text-center mb-4">
                    <FontAwesomeIcon icon={faUtensils} className="restaurant-icon" />
                    <h2 className="register-title">Create Account</h2>
                </div>

                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}

                <Form noValidate onSubmit={handleSubmit}>
                    <Input
                        label="Username"
                        type="input"
                        placeholder="Enter your username"
                        value={username}
                        onChange={handleUsernameChange}
                        isInvalid={!!fieldErrors.username}
                        feedbackMsg={fieldErrors.username}
                    />

                    <Input
                        label="Email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={handleEmailChange}
                        isInvalid={!!fieldErrors.email}
                        feedbackMsg={fieldErrors.email}
                    />

                    <Input
                        label="Password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={handlePasswordChange}
                        isInvalid={!!fieldErrors.password}
                        feedbackMsg={fieldErrors.password}
                    />

                    <Input
                        label="Confirm Password"
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        isInvalid={!!fieldErrors.confirmPassword}
                        feedbackMsg={fieldErrors.confirmPassword}
                    />

                    <div className="d-grid gap-2 mt-4">
                        <Button type="submit" fullWidth disabled={loading}>
                            {loading ? 'Registering...' : 'Register'}
                        </Button>
                    </div>

                    <div className="text-center mt-3">
                        <p className="mb-0">
                            Already have an account?{' '}
                            <Link to="/login" className="login-link">Login</Link>
                        </p>
                    </div>
                </Form>
            </div>
        </div>
    );
};

export default Register;