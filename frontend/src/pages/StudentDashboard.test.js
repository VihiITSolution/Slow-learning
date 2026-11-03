import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom';
import StudentDashboard from './StudentDashboard';
import api from '../services/api';

jest.mock('../services/api', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn() } }));
let mockUser = null;
jest.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ user: mockUser }) }));

const sessions = [{ id: 1, started_at: '2026-11-01T10:00:00', games_completed: 5, total_stars: 4, total_time: 300, total_errors: 1, primary_learning_style: 'Visual Learner' }];
const renderAt = (path, user) => {
  mockUser = user;
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/teacher/dashboard" element={<div>teacher dashboard</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('StudentDashboard (learning games)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    api.get.mockResolvedValue({ data: { sessions } });
  });

  test('a teacher sees the chosen student\'s results, not the "What\'s your name?" screen', async () => {
    renderAt('/student-dashboard?id=3&name=amaya', { id: 2, username: 'ms_perera', role: 'teacher' });
    expect(await screen.findByText('📊 Game results for amaya')).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith('/assessment/sessions/student/amaya');
    expect(screen.queryByText(/what's your name/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/start playing/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to student list/i })).toBeInTheDocument();
    expect(await screen.findByText(/Learning style: Visual Learner/)).toBeInTheDocument();
  });

  test('a teacher without a chosen student is taken to the student list', () => {
    renderAt('/student-dashboard', { id: 2, username: 'ms_perera', role: 'teacher' });
    expect(screen.getByText('teacher dashboard')).toBeInTheDocument();
  });

  test('a logged-in student plays under their own name', async () => {
    renderAt('/student-dashboard', { id: 3, username: 'amaya', role: 'student' });
    expect(await screen.findByText('🌟 Welcome, amaya! 🌟')).toBeInTheDocument();
    expect(screen.queryByText(/what's your name/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/change name/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to my dashboard/i })).toBeInTheDocument();
  });

  test('a child without an account is asked for a name', async () => {
    renderAt('/student-dashboard', null);
    expect(await screen.findByText(/what's your name/i)).toBeInTheDocument();
    await waitFor(() => expect(api.get).not.toHaveBeenCalled());
  });
});
