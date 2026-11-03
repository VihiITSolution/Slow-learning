import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import AdminDashboardPage from './AdminDashboardPage';
import UserManagementPage from './UserManagementPage';
import CourseManagementPage from './CourseManagementPage';
import AdminAnalyticsPage from './AdminAnalyticsPage';
import AdminLoginPage from './AdminLoginPage';
import api from '../services/api';

jest.mock('../services/api', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn() } }));
const mockLogin = jest.fn();
const mockLogout = jest.fn();
jest.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ login: mockLogin, logout: mockLogout }) }));
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ ...jest.requireActual('react-router-dom'), useNavigate: () => mockNavigate }));

const overview = {
  users: { total: 5, by_role: { student: 3, teacher: 1, admin: 1 }, students_active_today: 1, students_active_week: 2, new_this_week: 1 },
  learning: { active_lessons: 6, lessons_completed: 4, quiz_attempts: 1, avg_quiz_score: 85 },
  support_plans: { active: 2, reviewed: 1, outcomes: { improved: 1, unchanged: 0, needs_support: 0 } },
  lessons: [
    { id: 1, title: 'Counting 1 to 10', category: 'math', difficulty_level: 'beginner', xp_reward: 30, is_active: true, completions: 2, in_progress: 0, quiz_attempts: 1, avg_quiz_score: 85 },
    { id: 2, title: 'Addition Up to 10', category: 'math', difficulty_level: 'beginner', xp_reward: 30, is_active: true, completions: 1, in_progress: 1, quiz_attempts: 0, avg_quiz_score: null },
  ],
  recent_users: [{ id: 5, username: 'kavi', role: 'student', created_at: new Date().toISOString() }],
};
const engagement = { engaged_users: 1, disengaged_users: 1, new_students: 1, engagement_rate: 50, risk_breakdown: { critical: 1, low: 1, new: 1 } };
const users = [
  { id: 1, username: 'admin1', email: 'admin1@school.lk', role: 'admin', level: 1, total_xp: 0, lessons_completed: 0, quiz_attempts: 0 },
  { id: 2, username: 'ms_perera', email: 'ms@school.lk', role: 'teacher', level: 1, total_xp: 0, lessons_completed: 0, quiz_attempts: 0 },
  { id: 3, username: 'amaya', email: 'amaya@school.lk', role: 'student', level: 2, total_xp: 300, lessons_completed: 3, quiz_attempts: 1 },
  { id: 4, username: 'nimal', email: 'nimal@school.lk', role: 'student', level: 1, total_xp: 90, lessons_completed: 1, quiz_attempts: 0 },
];

const mockApi = () => api.get.mockImplementation((url) => {
  if (url === '/admin/overview') return Promise.resolve({ data: { success: true, data: overview } });
  if (url === '/admin/users') return Promise.resolve({ data: { success: true, data: users, count: users.length } });
  if (url === '/ml/engagement/statistics') return Promise.resolve({ data: { success: true, data: engagement } });
  return Promise.reject(new Error(url));
});
const renderPage = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('Admin pages use real data', () => {
  beforeEach(() => jest.clearAllMocks());

  test('dashboard shows real counts and engagement, no invented numbers', async () => {
    mockApi();
    renderPage(<AdminDashboardPage />);
    expect(await screen.findByText('3 students · 1 teachers · 1 admins')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('2 active · 1 reviewed')).toBeInTheDocument();
    expect(screen.getByText('kavi')).toBeInTheDocument();
    expect(screen.queryByText(/1,245/)).not.toBeInTheDocument();
  });

  test('dashboard shows an error with retry when loading fails', async () => {
    api.get.mockRejectedValue({ response: { data: { error: 'Admin role required' } } });
    renderPage(<AdminDashboardPage />);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Admin role required');
    expect(within(alert).getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  test('user management filters by role and search', async () => {
    mockApi();
    const user = userEvent.setup();
    renderPage(<UserManagementPage />);
    const table = await screen.findByRole('table', { name: 'Users' });
    expect(within(table).getAllByRole('row')).toHaveLength(5); // header + 4

    await user.click(screen.getByRole('tab', { name: /students \(2\)/i }));
    expect(within(table).getAllByRole('row')).toHaveLength(3);
    expect(within(table).queryByText('ms_perera')).not.toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /game results/i })[0]).toHaveAttribute('href', '/student-dashboard?name=amaya');

    await user.type(screen.getByRole('searchbox', { name: /search users/i }), 'nim');
    expect(within(table).getAllByRole('row')).toHaveLength(2);
    expect(within(table).getByText('nimal')).toBeInTheDocument();
  });

  test('course management lists lessons with usage', async () => {
    mockApi();
    renderPage(<CourseManagementPage />);
    const table = await screen.findByRole('table', { name: 'Lessons' });
    expect(within(table).getByText(/Counting 1 to 10/)).toBeInTheDocument();
    expect(within(table).getAllByText('Active')).toHaveLength(2);
  });

  test('analytics shows risk levels and support plan outcomes', async () => {
    mockApi();
    renderPage(<AdminAnalyticsPage />);
    expect(await screen.findByText('Students by ML risk level', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('New (no data yet)')).toBeInTheDocument();
    expect(screen.getByText('Improved')).toBeInTheDocument();
    expect(screen.getByText('2 active plan(s) waiting for review.')).toBeInTheDocument();
  });
});

describe('AdminLoginPage', () => {
  beforeEach(() => jest.clearAllMocks());

  const signIn = async (role) => {
    mockLogin.mockResolvedValue({ user: { id: 1, username: 'x', role } });
    const user = userEvent.setup();
    renderPage(<AdminLoginPage />);
    await user.type(screen.getByLabelText(/username or email/i), 'admin1@school.lk');
    await user.type(screen.getByLabelText(/^password$/i), 'pw');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
  };

  test('admins sign in with their email and land on the admin dashboard', async () => {
    await signIn('admin');
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard', { replace: true }));
    expect(mockLogin).toHaveBeenCalledWith('admin1@school.lk', 'pw');
  });

  test('students are turned away and signed out again', async () => {
    await signIn('student');
    expect(await screen.findByRole('alert')).toHaveTextContent(/for admins and teachers/i);
    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
