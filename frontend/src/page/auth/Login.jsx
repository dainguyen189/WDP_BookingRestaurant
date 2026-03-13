import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await axios.post('/auth/login', { email, password });
      const userData = res.data;

      localStorage.setItem('user', JSON.stringify(userData));
      if (userData.token) {
        localStorage.setItem('token', userData.token);
      }

      login(userData);

      if (userData.role === 'admin') {
        navigate('/'); // sau này thay bằng /admin/users
      } else {
        navigate('/');
      }
    } catch (err) {
      setError('Email hoặc mật khẩu không đúng');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '4rem auto', textAlign: 'center' }}>
      <h2>Login</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ textAlign: 'left' }}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>

        <div style={{ textAlign: 'left' }}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>

        <button type="submit">Login</button>
      </form>

      <p style={{ marginTop: '1rem' }}>
        Chưa có tài khoản? <Link to="/register">Register</Link>
      </p>
    </div>
  );
};

export default Login;

