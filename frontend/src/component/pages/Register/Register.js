import React, { useState } from 'react';
import { Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUtensils } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Button from '../../Button/Button';
import Input from '../../Input/Input';
import './Register.css';

const Register = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [validated, setValidated] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        const form = e.currentTarget;
        e.preventDefault();

        if (form.checkValidity() === false) {
            e.stopPropagation();
            setValidated(true);
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            setLoading(true);
            console.log('Sending registration data:', { email, username, password });

            const response = await axios.post('http://localhost:8080/api/auth/register', {
                email,
                username,
                password
            });

            console.log('Registration response:', response);

            if (response.data) {
                // Registration successful
                navigate('/login');
            } else {
                setError('Invalid response from server');
            }
        } catch (err) {
            console.error('Registration failed - Error object:', err);

            let errorMessage = "Registration failed. Please try again.";

            if (err.response && err.response.data) {
                errorMessage = err.response.data.message || errorMessage;
            }

            setError(errorMessage);
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

                <Form noValidate validated={validated} onSubmit={handleSubmit}>
                    <Input
                        label="Username"
                        type="input"
                        placeholder="Enter your username"
                        value={username}
                        required
                        onChange={(e) => setUsername(e.target.value)}
                    />

                    <Input
                        label="Email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        required
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <Input
                        label="Password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        required
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <Input
                        label="Confirm Password"
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        required
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />

                    <div className="d-grid gap-2 mt-4">
                        <Button
                            type="submit"
                            fullWidth
                            disabled={loading}
                        >
                            {loading ? 'Registering...' : 'Register'}
                        </Button>
                    </div>

                    <div className="text-center mt-3">
                        <p className="mb-0">Already have an account? <Link to="/login" className="login-link">Login</Link></p>
                    </div>
                </Form>
            </div>
        </div>
    );
};

export default Register;