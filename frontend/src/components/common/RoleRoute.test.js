import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import '@testing-library/jest-dom';
import RoleRoute, { HomeRedirect, GuestOnly, homeFor, canOpen } from './RoleRoute';

let mockAuth = { user: null, isAuthenticated: false };
jest.mock('../../contexts/AuthContext', () => ({ useAuth: () => mockAuth }));

const as = (role) => { mockAuth = role ? { user: { id: 1, username: 'u', role }, isAuthenticated: true } : { user: null, isAuthenticated: false }; };

function Where() {
  const location = useLocation();
  return <div data-testid="where">{location.pathname}|{location.state?.from?.pathname || ''}</div>;
}

const renderAt = (path) => render(
  <MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<GuestOnly><div>login page</div></GuestOnly>} />
      <Route path="/teacher/support-plans" element={<RoleRoute roles={['teacher', 'admin']}><div>teacher page</div></RoleRoute>} />
      <Route path="/admin/users" element={<RoleRoute roles={['admin']}><div>admin page</div></RoleRoute>} />
      <Route path="*" element={<Where />} />
    </Routes>
  </MemoryRouter>
);

describe('role-based routing', () => {
  test('homeFor sends each role to its own area', () => {
    expect(homeFor({ role: 'student' })).toBe('/app/dashboard');
    expect(homeFor({ role: 'teacher' })).toBe('/teacher/dashboard');
    expect(homeFor({ role: 'admin' })).toBe('/admin/dashboard');
  });

  test('canOpen checks the area of a path', () => {
    expect(canOpen({ role: 'student' }, '/teacher/ml-reports')).toBe(false);
    expect(canOpen({ role: 'admin' }, '/teacher/ml-reports')).toBe(true);
    expect(canOpen({ role: 'teacher' }, '/admin/users')).toBe(false);
    expect(canOpen({ role: 'teacher' }, '/app/dashboard')).toBe(false);
    expect(canOpen({ role: 'student' }, '/app/lessons/3')).toBe(true);
    expect(canOpen({ role: 'student' }, '/student-dashboard')).toBe(true);
  });

  test('logged-out users are sent to login and remember where they were going', () => {
    as(null);
    renderAt('/teacher/support-plans');
    expect(screen.getByText('login page')).toBeInTheDocument();
  });

  test('a student cannot open teacher or admin pages', () => {
    as('student');
    renderAt('/teacher/support-plans');
    expect(screen.queryByText('teacher page')).not.toBeInTheDocument();
    expect(screen.getByTestId('where')).toHaveTextContent('/app/dashboard');
  });

  test('a teacher cannot open admin pages but can open teacher pages', () => {
    as('teacher');
    const { unmount } = renderAt('/admin/users');
    expect(screen.getByTestId('where')).toHaveTextContent('/teacher/dashboard');
    unmount();
    renderAt('/teacher/support-plans');
    expect(screen.getByText('teacher page')).toBeInTheDocument();
  });

  test('admins can open teacher pages', () => {
    as('admin');
    renderAt('/teacher/support-plans');
    expect(screen.getByText('teacher page')).toBeInTheDocument();
  });

  test('"/" goes home when logged in and to the start page otherwise', () => {
    as('teacher');
    const { unmount } = renderAt('/');
    expect(screen.getByTestId('where')).toHaveTextContent('/teacher/dashboard');
    unmount();
    as(null);
    renderAt('/');
    expect(screen.getByTestId('where')).toHaveTextContent('/learning-helper');
  });

  test('the login page sends logged-in users home', () => {
    as('admin');
    renderAt('/login');
    expect(screen.queryByText('login page')).not.toBeInTheDocument();
    expect(screen.getByTestId('where')).toHaveTextContent('/admin/dashboard');
  });
});
