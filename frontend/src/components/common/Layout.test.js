import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Layout from './Layout';

// Mock AuthContext
const mockLogout = jest.fn();
const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  role: 'student'
};

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    logout: mockLogout,
  }),
}));

const renderLayout = (initialRoute = '/app/dashboard') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Layout />
    </MemoryRouter>
  );
};

describe('Layout Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders app title for student view', () => {
    renderLayout('/app/dashboard');
    expect(screen.getByText(/LearnQuest/i)).toBeInTheDocument();
  });

  test('renders admin panel title in admin view', () => {
    renderLayout('/admin/dashboard');
    expect(screen.getByText(/Admin Panel/i)).toBeInTheDocument();
  });

  test('renders teacher portal title in teacher view', () => {
    renderLayout('/teacher/dashboard');
    expect(screen.getByText(/Teacher Portal/i)).toBeInTheDocument();
  });

  test('displays student navigation links', () => {
    renderLayout('/app/dashboard');
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Lessons')).toBeInTheDocument();
    expect(screen.getByText('Achievements')).toBeInTheDocument();
  });

  test('displays admin navigation links', () => {
    renderLayout('/admin/dashboard');
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText(/User Management/i)).toBeInTheDocument();
    expect(screen.getByText(/Course Management/i)).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  test('displays teacher navigation links', () => {
    renderLayout('/teacher/dashboard');
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText(/Start Assessment/i)).toBeInTheDocument();
  });

  test('renders sidebar with navigation', () => {
    renderLayout('/app/dashboard');
    
    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('sidebar');
  });

  test('navigation links have correct href attributes', () => {
    renderLayout('/app/dashboard');
    
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveAttribute('href', '/app/dashboard');
  });
});
