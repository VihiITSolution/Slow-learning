import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Layout from './Layout';

const mockLogout = jest.fn();
let mockUser = { id: 1, username: 'amaya', role: 'student', level: 2, total_xp: 300 };
jest.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: mockUser, logout: mockLogout }) }));
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ ...jest.requireActual('react-router-dom'), useNavigate: () => mockNavigate }));

const renderAt = (path, user) => {
  mockUser = user;
  return render(<MemoryRouter initialEntries={[path]}><Layout /></MemoryRouter>);
};
const navLabels = () => screen.getAllByRole('link').map((a) => a.textContent.trim());

describe('role-based navigation', () => {
  beforeEach(() => jest.clearAllMocks());

  test('students see learning pages only (no ML Insights) and their XP', () => {
    renderAt('/app/dashboard', { id: 1, username: 'amaya', role: 'student', level: 2, total_xp: 300 });
    expect(navLabels()).toEqual(['Dashboard', 'Lessons', 'Practice', 'Learning Games', 'Achievements', 'Gamification', 'Leaderboard', 'My Progress', 'Profile']);
    expect(screen.getByText('Level 2 • 300 XP')).toBeInTheDocument();
  });

  test('teachers get ML Insights and a working Student Results link, and no XP', () => {
    renderAt('/teacher/dashboard', { id: 2, username: 'ms_perera', role: 'teacher' });
    expect(navLabels()).toContain('ML Insights');
    expect(screen.getByText('Student Results').closest('a')).toHaveAttribute('href', '/teacher/dashboard?section=students');
    expect(screen.getByText('My Profile').closest('a')).toHaveAttribute('href', '/teacher/profile');
    expect(screen.getByText('Teacher')).toBeInTheDocument();
    expect(screen.queryByText(/XP/)).not.toBeInTheDocument();
  });

  test('only the current page is highlighted', () => {
    renderAt('/teacher/dashboard?section=students', { id: 2, username: 'ms_perera', role: 'teacher' });
    expect(screen.getByText('Student Results').closest('a')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('Dashboard').closest('a')).not.toHaveAttribute('aria-current');
  });

  test('admins get admin tools, no "Switch to User View", and a way back from teacher pages', () => {
    const { unmount } = renderAt('/admin/dashboard', { id: 3, username: 'admin1', role: 'admin' });
    expect(navLabels()).toEqual(['Dashboard', 'User Management', 'Course Management', 'Analytics', 'ML Class Report', 'Support Plans', 'My Profile']);
    expect(screen.queryByText(/switch to user view/i)).not.toBeInTheDocument();
    unmount();
    renderAt('/teacher/support-plans', { id: 3, username: 'admin1', role: 'admin' });
    expect(screen.getByText('Admin Panel').closest('a')).toHaveAttribute('href', '/admin/dashboard');
  });

  test('avatar falls back to an initial instead of a broken image', () => {
    renderAt('/app/dashboard', { id: 1, username: 'amaya', role: 'student', avatar_url: 'default_avatar.png' });
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByLabelText("amaya's avatar")).toHaveTextContent('A');
  });

  test('logout returns to the login page', () => {
    renderAt('/app/dashboard', { id: 1, username: 'amaya', role: 'student' });
    fireEvent.click(screen.getByRole('button', { name: /logout/i }));
    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
  });
});
