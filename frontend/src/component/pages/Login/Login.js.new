import React, { useState } from 'react';
import { Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUtensils } from '@fortawesome/free-solid-svg-icons';

import './Login.css';
import Button from '../../Button/Button';
import Input from '../../Input/Input';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [validated, setValidated] = useState(false);

  const handleSubmit = (e) => {
    const form = e.currentTarget;
    e.preventDefault();

    if (form.checkValidity() === false) {
      e.stopPropagation();
    } else {
      // Add login logic here
      console.log("Login attempt with:", username);
      // Redirect to home on success
      // history.push('/home');
    }

    setValidated(true);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="text-center mb-4">
          <FontAwesomeIcon icon={faUtensils} className="restaurant-icon" />
          <h2 className="login-title">Restaurant Booking</h2>
        </div>

        <Form noValidate validated={validated} onSubmit={handleSubmit}>
          <Input
            label="Username"
            type="text"
            placeholder="Enter your username"
            value={username}
            required
            onChange={(e) => setUsername(e.target.value)}
          />

          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="d-grid gap-2 mt-4">
            <Button type="submit" fullWidth>
              Login
            </Button>
          </div>

          <div className="text-center mt-3">
            <p className="mb-0">Don't have an account? <a href="#register" className="register-link">Register</a></p>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Login;
