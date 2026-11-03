import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { homeFor } from '../components/common/RoleRoute';
import '../styles/Auth.css';

export default function NotFoundPage() {
  const { user, isAuthenticated } = useAuth();
  const home = isAuthenticated ? homeFor(user) : '/learning-helper';
  return (
    <div className="login-page">
      <div className="login-card" style={{ textAlign: 'center' }}>
        <div className="login-header">
          <h1>🧭 Page not found</h1>
          <p>We couldn't find that page. It may have moved.</p>
        </div>
        <Link to={home} className="submit-btn" style={{ display: 'inline-block', textDecoration: 'none', padding: '12px 28px' }}>
          {isAuthenticated ? 'Go to my dashboard' : 'Go to the start page'}
        </Link>
      </div>
    </div>
  );
}
