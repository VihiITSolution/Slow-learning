import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import TeacherMLReportsPage, { ActivitySummary, describeTraining, formatQuizScore } from './TeacherMLReportsPage';
import api from '../services/api';

jest.mock('../services/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

const classReport = {
  students: [{
    engaged: false, risk_level: 'moderate', confidence: 0.55,
    user_info: { user_id: 5, username: 'kasun', level: 1, total_xp: 40 },
    features: { time_spent_today: 0, avg_quiz_score: null, login_streak: 1, lessons_completed_week: 0, days_inactive: 0 },
    recommendations: [],
  }],
  stats: { total_users: 1, engaged_users: 0, disengaged_users: 1 },
};

describe('TeacherMLReportsPage model reporting', () => {
  beforeEach(() => jest.clearAllMocks());

  test('describes a retrain with flat metrics (accuracy no longer shows 0.0%)', () => {
    const text = describeTraining({
      data: { metrics: { algorithm: 'logistic', accuracy: 0.781, test_samples: 600 } },
      data_source: 'synthetic (3000 samples)',
      labels: 'synthetic labels from the data generator',
    });
    expect(text).toContain('logistic');
    expect(text).toContain('78.1%');
    expect(text).toContain('600 test rows');
    expect(text).toContain('synthetic labels');
  });

  test('still understands metrics nested under the algorithm name', () => {
    const text = describeTraining({ data: { metrics: { best_algorithm: 'svm', svm: { accuracy: 0.8 } } } });
    expect(text).toContain('80.0%');
  });

  test('a student with no quizzes shows "No quiz yet" instead of 0%', async () => {
    expect(formatQuizScore(null)).toBe('No quiz yet');
    expect(formatQuizScore(72.4)).toBe('72%');

    api.get.mockResolvedValue({ data: { data: classReport } });
    render(<MemoryRouter><TeacherMLReportsPage /></MemoryRouter>);
    expect(await screen.findByText('kasun')).toBeInTheDocument();
    expect(screen.getByText('No quiz yet')).toBeInTheDocument();
  });

  test('shows the retrain result returned by the API', async () => {
    api.get.mockResolvedValue({ data: { data: classReport } });
    api.post.mockResolvedValue({ data: {
      data: { metrics: { algorithm: 'logistic', accuracy: 0.78, test_samples: 600 } },
      data_source: 'synthetic (1000 samples)', labels: 'synthetic labels from the data generator',
    } });
    const user = userEvent.setup();
    render(<MemoryRouter><TeacherMLReportsPage /></MemoryRouter>);
    await user.click(await screen.findByRole('button', { name: /retrain model/i }));
    expect(await screen.findByText(/held-out accuracy 78.0%/)).toBeInTheDocument();
  });

  test('new students get their own state and no intervention button', async () => {
    const report = {
      students: [
        { ...classReport.students[0], engaged: false, risk_level: 'critical', confidence: 0.9 },
        { engaged: null, risk_level: 'new', insufficient_data: true, confidence: 0.83,
          user_info: { user_id: 6, username: 'dilini', level: 1, total_xp: 0 },
          features: {}, recommendation: ['New student - not enough activity yet to judge engagement'], recommendations: [] },
      ],
      stats: { total_users: 2, engaged_users: 0, disengaged_users: 1, new_students: 1 },
    };
    api.get.mockResolvedValue({ data: { data: report } });
    const user = userEvent.setup();
    render(<MemoryRouter><TeacherMLReportsPage /></MemoryRouter>);

    expect(await screen.findByText('🆕 New – not enough data yet')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /send encouragement/i })).toHaveLength(1);
    expect(screen.getByRole('button', { name: /🆕 New \(1\)/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /At Risk Only \(1\)/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /🆕 New \(1\)/ }));
    expect(screen.queryByText('kasun')).not.toBeInTheDocument();
    expect(screen.getByText('dilini')).toBeInTheDocument();
  });
});

describe('ActivitySummary', () => {
  test('shows practice, games, accuracy by area and the check-in', () => {
    render(<ActivitySummary activity={{
      practice_rounds_week: 3, games_week: 1, lesson_activity_accuracy: 50, hints_per_question: 0.4,
      accuracy_by_area: { math: 80, words: null, world: 66.7 },
      latest_check_in: { mood: 'unsure', emoji: '😕', label: 'Not sure' }, checked_in_today: true,
    }} />);
    expect(screen.getByText(/3 practice rounds · 1 game run · lesson activities 50% · hints on 40% of questions/)).toBeInTheDocument();
    expect(screen.getByText(/Number Fun 80%, My World 67%/)).toBeInTheDocument();
    expect(screen.getByText(/😕 Not sure today/)).toBeInTheDocument();
  });

  test('renders nothing without activity data', () => {
    const { container } = render(<ActivitySummary activity={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });
});
