import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiHome, FiBook, FiAward, FiTrendingUp, FiUser, FiLogOut, FiUsers, FiBarChart2, FiClipboard, FiSettings } from 'react-icons/fi';
import { FaBrain, FaGraduationCap, FaGamepad, FaChartLine } from 'react-icons/fa';
import Avatar from './Avatar';

// Each area of the app has its own menu. The areas are role-protected in
// App.js, so the menu always matches what the user is allowed to open.
const NAV = {
  admin: [
    { to: '/admin/dashboard', icon: FiHome, label: 'Dashboard' },
    { to: '/admin/users', icon: FiUsers, label: 'User Management' },
    { to: '/admin/courses', icon: FiBook, label: 'Course Management' },
    { to: '/admin/analytics', icon: FiBarChart2, label: 'Analytics' },
    { to: '/teacher/ml-reports', icon: FaBrain, label: 'ML Class Report' },
    { to: '/teacher/support-plans', icon: FiClipboard, label: 'Support Plans' },
    { to: '/admin/profile', icon: FiUser, label: 'My Profile' },
  ],
  teacher: [
    { to: '/teacher/dashboard', icon: FiHome, label: 'Dashboard' },
    { to: '/teacher/ml-reports', icon: FaBrain, label: 'ML Class Report' },
    { to: '/teacher/support-plans', icon: FiClipboard, label: 'Support Plans' },
    { to: '/teacher/ml-insights', icon: FaChartLine, label: 'ML Insights' },
    { to: '/student-selection', icon: FaGraduationCap, label: 'Start Assessment' },
    { to: '/teacher/dashboard?section=students', icon: FiUsers, label: 'Student Results' },
    { to: '/interactive-games', icon: FaGamepad, label: 'Interactive Games' },
    { to: '/teacher/profile', icon: FiUser, label: 'My Profile' },
  ],
  student: [
    { to: '/app/dashboard', icon: FiHome, label: 'Dashboard' },
    { to: '/app/lessons', icon: FiBook, label: 'Lessons' },
    { to: '/student-dashboard', icon: FaGraduationCap, label: 'Learning Games' },
    { to: '/app/achievements', icon: FiAward, label: 'Achievements' },
    { to: '/app/gamification', icon: FaGamepad, label: 'Gamification' },
    { to: '/app/leaderboard', icon: FiTrendingUp, label: 'Leaderboard' },
    { to: '/app/progress-summary', icon: FiTrendingUp, label: 'My Progress' },
    { to: '/app/profile', icon: FiUser, label: 'Profile' },
  ],
};

const TITLES = { admin: '⚙️ Admin Panel', teacher: '👨‍🏫 Teacher Portal', student: '🎓 LearnQuest' };
const ROLE_LABEL = { admin: 'Administrator', teacher: 'Teacher', student: 'Student' };

export const areaFor = (pathname) => (
  pathname.startsWith('/admin') ? 'admin' : pathname.startsWith('/teacher') ? 'teacher' : 'student'
);

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const area = areaFor(location.pathname);
  const items = [...NAV[area]];
  // Admins can open the teacher pages; give them a way back
  if (area === 'teacher' && user?.role === 'admin') {
    items.unshift({ to: '/admin/dashboard', icon: FiSettings, label: 'Admin Panel' });
  }

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // "Student Results" is the dashboard with ?section=students, so the query
  // string decides which of the two links is active
  const isActive = (item) => {
    const [path, query = ''] = item.to.split('?');
    if (location.pathname !== path) return false;
    return query ? location.search === `?${query}` : !(path === '/teacher/dashboard' && location.search);
  };

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="app-title">{TITLES[area]}</h1>
        </div>

        <nav className="sidebar-nav" aria-label="Main">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`nav-link${active ? ' active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon /> {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <FiLogOut /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Top Bar */}
        <header className="top-bar">
          <div className="user-info">
            <Avatar user={user} size={44} className="avatar-small" />
            <div>
              <p className="user-name">{user?.username}</p>
              <p className="user-level">
                {user?.role === 'student' || !user?.role
                  ? `Level ${user?.level ?? 1} • ${user?.total_xp ?? 0} XP`
                  : ROLE_LABEL[user.role] || user.role}
              </p>
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
