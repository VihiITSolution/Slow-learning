import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiHome, FiBook, FiAward, FiTrendingUp, FiUser, FiLogOut, FiSettings, FiUsers, FiBarChart2, FiPackage } from 'react-icons/fi';
import { FaBrain, FaGraduationCap, FaGamepad } from 'react-icons/fa';

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const isTeacher = location.pathname.startsWith('/teacher');

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="app-title">
            {isAdmin ? '⚙️ Admin Panel' : isTeacher ? '👨‍🏫 Teacher Portal' : '🎓 LearnQuest'}
          </h1>
        </div>

        <nav className="sidebar-nav">
          {isAdmin ? (
            // Admin Navigation
            <>
              <Link to="/admin/dashboard" className="nav-link">
                <FiHome /> Dashboard
              </Link>
              <Link to="/admin/users" className="nav-link">
                <FiUsers /> User Management
              </Link>
              <Link to="/admin/courses" className="nav-link">
                <FiBook /> Course Management
              </Link>
              <Link to="/admin/analytics" className="nav-link">
                <FiBarChart2 /> Analytics
              </Link>
              <Link to="/app/dashboard" className="nav-link">
                <FiUser /> Switch to User View
              </Link>
            </>
          ) : isTeacher ? (
            // Teacher Navigation
            <>
              <Link to="/teacher/dashboard" className="nav-link">
                <FiHome /> Dashboard
              </Link>
              <Link to="/teacher/ml-reports" className="nav-link">
                <FaBrain /> ML Class Report
              </Link>
              <Link to="/student-selection" className="nav-link">
                <FaGraduationCap /> Start Assessment
              </Link>
              <Link to="/interactive-games" className="nav-link">
                <FaGamepad /> Interactive Games
              </Link>
              <Link to="/student-dashboard" className="nav-link">
                <FiUsers /> Student Results
              </Link>
              <Link to="/app/profile" className="nav-link">
                <FiUser /> My Profile
              </Link>
            </>
          ) : (
            // User Navigation
            <>
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
              <Link to="/app/gamification" className="nav-link">
                <FaGamepad /> Gamification
              </Link>
              <Link to="/app/leaderboard" className="nav-link">
                <FiTrendingUp /> Leaderboard
              </Link>
              <Link to="/app/progress-summary" className="nav-link">
                <FiTrendingUp /> My Progress
              </Link>
              <Link to="/app/ml-insights" className="nav-link">
                <FaBrain /> ML Insights
              </Link>
              <Link to="/app/profile" className="nav-link">
                <FiUser /> Profile
              </Link>
            </>
          )}
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
