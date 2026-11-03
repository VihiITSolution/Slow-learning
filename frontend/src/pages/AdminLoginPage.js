import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { homeFor } from '../components/common/RoleRoute';
import '../styles/Auth.css';

/**
 * Staff sign-in. Uses the same session as the main login, so after signing
 * in the admin (or teacher) is really logged in everywhere in the app.
 */
export default function AdminLoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, logout } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await login(identifier.trim(), password);
      if (response.user?.role === 'student') {
        logout();
        setError('This sign-in is for admins and teachers. Students, please use the main login.');
        return;
      }
      navigate(homeFor(response.user), { replace: true });
    } catch (err) {
      setError(err.error || err.message || 'Invalid username/email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1>⚙️ LearnQuest Admin</h1>
          <p>Sign in to manage users, lessons and reports</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div role="alert" style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', color: '#991b1b', borderRadius: 10, padding: '10px 14px', fontWeight: 600, fontSize: 14 }}>
              {error}
            </div>
          )}

          <div className="form-field">
            <label htmlFor="admin-identifier">Username or email</label>
            <div className="input-wrapper">
              <span className="icon">👤</span>
              <input
                id="admin-identifier"
                type="text"
                placeholder="admin or admin@school.lk"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="admin-password">Password</label>
            <div className="input-wrapper">
              <span className="icon">🔒</span>
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="toggle-password"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? '⏳ Signing in...' : 'Sign in'}
          </button>

          <div className="signup-link">
            Not an admin? <Link to="/login">Go to the main login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
