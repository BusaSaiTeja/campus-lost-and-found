import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api';
import './Auth.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await API.post('/api/login', { username, password });
      localStorage.setItem('token', res.data.token);
      sessionStorage.setItem("user_id", res.data.user_id);
      navigate('/');
      console.log("Login success:", res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      console.error("Login failed:", err.response?.data || err.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Login</h2>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required autoFocus
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Log In</button>
        </form>
        <p>
          Don’t have an account?{' '}
          <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}
