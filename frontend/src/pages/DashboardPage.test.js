import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import DashboardPage from './DashboardPage';
import api from '../services/api';

// Mock dependencies
jest.mock('../services/api');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

// Mock AuthContext
const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  role: 'student',
  total_xp: 1250,
  level: 3,
  current_streak: 5,
};

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}));

const renderDashboardPage = () => {
  return render(
    <BrowserRouter>
      <DashboardPage />
    </BrowserRouter>
  );
};

describe('DashboardPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('displays loading state initially', () => {
    api.get.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    renderDashboardPage();
    
    expect(screen.getByText(/loading your dashboard/i)).toBeInTheDocument();
  });

  test('displays welcome message with username', async () => {
    api.get.mockResolvedValue({ data: { recommendations: [], leaderboard: [] } });
    
    renderDashboardPage();
    
    await waitFor(() => {
      expect(screen.getByText(/welcome back, testuser/i)).toBeInTheDocument();
    });
  });

  test('displays user stats correctly', async () => {
    // Shape returned by GET /api/analytics/dashboard
    const mockAnalytics = {
      user_stats: { completion_percentage: 65, lessons_completed: 13, total_lessons: 20 },
    };

    api.get.mockImplementation((url) => {
      if (url === '/analytics/dashboard') {
        return Promise.resolve({ data: mockAnalytics });
      }
      return Promise.resolve({ data: { recommendations: [], leaderboard: [] } });
    });
    
    renderDashboardPage();
    
    await waitFor(() => {
      expect(screen.getByText('1250')).toBeInTheDocument(); // XP
      expect(screen.getByText('Level 3')).toBeInTheDocument(); // Level
      expect(screen.getByText('5 Days')).toBeInTheDocument(); // Streak
      expect(screen.getByText('65%')).toBeInTheDocument(); // Progress
    });
  });

  test('shows how many lessons are completed', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/analytics/dashboard') {
        return Promise.resolve({ data: { user_stats: { completion_percentage: 50, lessons_completed: 3, total_lessons: 6 } } });
      }
      return Promise.resolve({ data: { recommendations: [], leaderboard: [] } });
    });
    
    renderDashboardPage();
    
    await waitFor(() => {
      expect(screen.getByText(/3 of 6 lessons/i)).toBeInTheDocument();
    });
  });

  test('recommendation links use the lesson id from the API', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/recommendations/personalized') {
        return Promise.resolve({ data: { recommendations: [{ lesson: { id: 7, title: 'Addition Up to 10', category: 'math' }, score: 0.8 }] } });
      }
      return Promise.resolve({ data: { leaderboard: [] } });
    });

    renderDashboardPage();

    await waitFor(() => expect(screen.getByText('Addition Up to 10')).toBeInTheDocument());
    expect(document.querySelector('a[href="/app/lessons/7"]')).not.toBeNull();
    expect(document.querySelector('a[href="/app/lessons/undefined"]')).toBeNull();
  });

  test('displays personalized recommendations', async () => {
    const mockRecommendations = {
      // Shape returned by GET /api/recommendations/personalized
      recommendations: [
        { lesson: { id: 1, title: 'Introduction to Python' }, score: 0.9, reason: 'Based on your progress' },
        { lesson: { id: 2, title: 'JavaScript Basics' }, score: 0.7, reason: 'Popular choice' },
      ]
    };

    api.get.mockImplementation((url) => {
      if (url === '/recommendations/personalized') {
        return Promise.resolve({ data: mockRecommendations });
      }
      if (url === '/analytics/dashboard') {
        return Promise.resolve({ data: { completion_percentage: 50 } });
      }
      return Promise.resolve({ data: { leaderboard: [] } });
    });
    
    renderDashboardPage();
    
    await waitFor(() => {
      expect(screen.getByText('Introduction to Python')).toBeInTheDocument();
      expect(screen.getByText('JavaScript Basics')).toBeInTheDocument();
    });
  });

  test('displays leaderboard', async () => {
    const mockLeaderboard = {
      leaderboard: [
        { rank: 1, username: 'topuser', total_xp: 5000 },
        { rank: 2, username: 'seconduser', total_xp: 4500 },
        { rank: 3, username: 'thirduser', total_xp: 4000 },
      ]
    };

    api.get.mockImplementation((url) => {
      if (url === '/gamification/leaderboard?limit=5') {
        return Promise.resolve({ data: mockLeaderboard });
      }
      if (url === '/analytics/dashboard') {
        return Promise.resolve({ data: { completion_percentage: 50 } });
      }
      return Promise.resolve({ data: { recommendations: [] } });
    });
    
    renderDashboardPage();
    
    await waitFor(() => {
      expect(screen.getByText('topuser')).toBeInTheDocument();
      expect(screen.getByText('seconduser')).toBeInTheDocument();
      expect(screen.getByText('thirduser')).toBeInTheDocument();
    });
  });

  test("today's challenges come from real activity", async () => {
    api.get.mockImplementation((url) => {
      if (url === '/activities/today') {
        return Promise.resolve({ data: { done: 1, total: 2, challenges: [
          { id: 'lesson', label: 'Finish one lesson', done: true, link: '/app/lessons' },
          { id: 'practice', label: 'Do a practice round', done: false, link: '/app/practice' },
        ] } });
      }
      return Promise.resolve({ data: { recommendations: [], leaderboard: [] } });
    });

    renderDashboardPage();

    expect(await screen.findByText('Do a practice round')).toBeInTheDocument();
    expect(screen.getByText(/1 of 2 done/i)).toBeInTheDocument();
    expect(screen.getByText('Done!')).toBeInTheDocument();
    expect(document.querySelector('a[href="/app/practice"]')).not.toBeNull();
    expect(screen.queryByText(/flashcard frenzy/i)).toBeNull();
    expect(document.querySelector('a[href="/app/ml-insights"]')).toBeNull();
  });

  test('handles API errors gracefully', async () => {
    api.get.mockRejectedValue(new Error('API Error'));
    
    renderDashboardPage();
    
    await waitFor(() => {
      expect(screen.getByText(/failed to load dashboard/i)).toBeInTheDocument();
    });
  });

  test('displays streak motivation message', async () => {
    api.get.mockResolvedValue({ data: { recommendations: [], leaderboard: [] } });
    
    renderDashboardPage();
    
    await waitFor(() => {
      // User has 5 day streak, should show "Keep it up!"
      expect(screen.getByText(/keep it up/i)).toBeInTheDocument();
    });
  });

  test('fetches dashboard data on mount', async () => {
    api.get.mockResolvedValue({ data: { recommendations: [], leaderboard: [], completion_percentage: 0 } });
    
    renderDashboardPage();
    
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/analytics/dashboard');
      expect(api.get).toHaveBeenCalledWith('/recommendations/personalized');
      expect(api.get).toHaveBeenCalledWith('/gamification/leaderboard?limit=5');
    });
  });

  test('handles partial API failures', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/analytics/dashboard') {
        return Promise.reject(new Error('Analytics failed'));
      }
      return Promise.resolve({ data: { recommendations: [], leaderboard: [] } });
    });
    
    renderDashboardPage();
    
    await waitFor(() => {
      // Dashboard should still render with available data
      expect(screen.getByText(/welcome back, testuser/i)).toBeInTheDocument();
    });
  });
});
