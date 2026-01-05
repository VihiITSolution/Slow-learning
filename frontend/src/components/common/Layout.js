import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiHome, FiBook, FiAward, FiTrendingUp, FiUser, FiLogOut } from 'react-icons/fi';
import { FaBrain, FaGraduationCap } from 'react-icons/fa';

const Layout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="app-title">🎓 LearnQuest</h1>
        </div>

        <nav className="sidebar-nav">
          <Link to="/app/dashboard" className="nav-link">
            <FiHome /> Dashboard
          </Link>
          <Link to="/app/lessons" className="nav-link">
            <FiBook /> Lessons
          </Link>
          <Link to="/learning-helper" className="nav-link">
            <FaGraduationCap /> Learning Helper
          </Link>
          <Link to="/app/achievements" className="nav-link">
            <FiAward /> Achievements
          </Link>
          <Link to="/app/leaderboard" className="nav-link">
            <FiTrendingUp /> Leaderboard
          </Link>
          <Link to="/app/ml-insights" className="nav-link">
            <FaBrain /> ML Insights
          </Link>
          <Link to="/app/profile" className="nav-link">
            <FiUser /> Profile
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button onClick={logout} className="logout-btn">
            <FiLogOut /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Top Bar */}
        <header className="top-bar">
          <div className="user-info">
            <img src={user?.avatar_url || '/default-avatar.png'} alt="Avatar" className="avatar-small" />
            <div>
              <p className="user-name">{user?.username}</p>
              <p className="user-level">Level {user?.level} • {user?.total_xp} XP</p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
