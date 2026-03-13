import React, { useState } from 'react';
import { Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUtensils } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


import './Login.css';
import Button from '../../Button/Button';
import Input from '../../Input/Input';

const Login = () => {
  // const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validated, setValidated] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    //   if (form.checkValidity() === false) {
    //     e.stopPropagation();
    //   } else {
    //     // Add login logic here
    //     console.log("Login attempt with:", username);
    //     // Redirect to home on success
    //     // history.push('/home');
    //   }

    //   setValidated(true);
    // };
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    try {
      // const response = await axios.post('/api/login', {
      //   username,
      //   password,
      // });
      const response = await axios.post(
        'http://localhost:8080/api/auth/login',
        {
          email,
          password,
        },
        { withCredentials: true }
      ); if (response.status === 200) {
        const userData = response.data;

        // Lưu thông tin người dùng và token vào localStorage
        localStorage.setItem('user', JSON.stringify(userData));

        // Nếu token được trả về trong response, lưu vào localStorage
        if (userData.token) {
          // Lưu token vào localStorage để dễ truy cập
          localStorage.setItem('token', userData.token);

          document.cookie = `access_token=${userData.token}; path=/; max-age=${24 * 60 * 60}; SameSite=Lax`;
        }

        const role = response.data.role;
        // hoặc lấy mảng roles

        if (role === 'admin') {
          navigate('/admin');
        } else if (role === 'chef') {
          navigate('/chef');
          } else if (role === 'cashier') {
          navigate('/cashier');
          } else if (role === 'staff') {
          navigate('/staff');
        } else {
          navigate('/home');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid username or password.');
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

        {/* <Form noValidate validated={validated} onSubmit={handleSubmit}>
          <Input
            label="Username"
            type="text"
            placeholder="Enter your username"
            value={username}
            required
            onChange={(e) => setUsername(e.target.value)}
          /> */}

        <Form noValidate validated={validated} onSubmit={handleSubmit}>
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
          {error && <p className="text-danger text-center">{error}</p>}

          <div className="d-grid gap-2 mt-4">
            <Button type="submit" fullWidth>
              Login
            </Button>
          </div>

          <div className="text-center mt-3">
            <p className="mb-0">Don't have an account? <a href="/register" className="register-link">Register</a></p>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Login;
