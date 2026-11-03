import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import SupportPlansPage, { defaultReviewDate } from './SupportPlansPage';
import api from '../services/api';

jest.mock('../services/api');
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 9, username: 'teacher', role: 'teacher' } }),
}));

const reviewedPlan = {
  id: 1, student_id: 2, student_name: 'sam', teacher_id: 9, teacher_name: 'teacher',
  intervention_type: 'visual_support', goal: 'Read two short pages.', review_date: '2026-10-25T00:00:00',
  status: 'reviewed', outcome: 'improved', baseline_snapshot: {}, review_snapshot: {},
  metric_comparison: {
    total_xp: { baseline: 5, review: 20, change: 15 }, lessons_completed: { baseline: 1, review: 2, change: 1 },
    quizzes_taken: { baseline: 0, review: 1, change: 1 }, total_time_spent: { baseline: 4, review: 15, change: 11 },
    current_streak: { baseline: 1, review: 2, change: 1 }, engagement: { baseline: false, review: true },
    risk_level: { baseline: 'high', review: 'low' },
  },
};

function mockPageData(plans = []) {
  api.get.mockImplementation((url) => {
    if (url === '/support-plans') return Promise.resolve({ data: { data: plans } });
    if (url === '/auth/students') return Promise.resolve({ data: { students: [{ id: 2, username: 'sam' }] } });
    return Promise.resolve({ data: {} });
  });
}

function renderPage(path = '/teacher/support-plans') {
  return render(<MemoryRouter initialEntries={[path]}><SupportPlansPage /></MemoryRouter>);
}

describe('SupportPlansPage', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  test('opens a preselected student form and creates a support plan', async () => {
    mockPageData();
    api.post.mockResolvedValue({ data: { success: true } });
    renderPage('/teacher/support-plans?studentId=2');

    await waitFor(() => expect(screen.getByLabelText('Student')).toHaveValue('2'));
    fireEvent.change(screen.getByLabelText('Support strategy'), { target: { value: 'visual_support' } });
    fireEvent.change(screen.getByLabelText('Learning goal'), { target: { value: 'Read two short pages.' } });
    fireEvent.click(screen.getByRole('button', { name: /create plan & capture baseline/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/support-plans', expect.objectContaining({ student_id: 2, goal: 'Read two short pages.' }));
      expect(screen.getByText(/baseline metrics captured/i)).toBeInTheDocument();
    });
  });

  test('shows reviewed comparison data and outcome', async () => {
    mockPageData([reviewedPlan]);
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Reviewed' }));

    await waitFor(() => expect(screen.getByText('Baseline vs review')).toBeInTheDocument());
    expect(screen.getByText('Improved')).toBeInTheDocument();
    expect(screen.getByText('5 → 20')).toBeInTheDocument();
    expect(screen.getByText(/At risk → Engaged/i)).toBeInTheDocument();
  });

  test('shows API errors to the teacher', async () => {
    api.get.mockRejectedValue({ response: { data: { error: 'Access denied' } } });
    renderPage();
    await waitFor(() => expect(screen.getByText('Access denied')).toBeInTheDocument());
  });

  test('default review date is seven days ahead in local time', () => {
    expect(defaultReviewDate(new Date(2026, 10, 28, 1, 30))).toBe('2026-12-05');
    expect(defaultReviewDate(new Date(2026, 11, 30))).toBe('2027-01-06');
  });

  test('records a review outcome and refreshes the list', async () => {
    const activePlan = { ...reviewedPlan, id: 3, status: 'active', outcome: null, metric_comparison: null };
    mockPageData([activePlan]);
    api.post.mockResolvedValue({ data: { success: true } });
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /review outcome/i }));
    expect(screen.getByLabelText('Outcome')).toHaveValue('');
    fireEvent.click(screen.getByRole('button', { name: /record outcome/i }));
    expect(await screen.findByText(/choose an outcome/i)).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Outcome'), { target: { value: 'needs_support' } });
    fireEvent.change(screen.getByLabelText('Outcome notes'), { target: { value: 'Still guessing words' } });
    fireEvent.click(screen.getByRole('button', { name: /record outcome/i }));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/support-plans/3/review', {
      outcome: 'needs_support', outcome_notes: 'Still guessing words',
    }));
    expect(await screen.findByText(/outcome recorded/i)).toBeInTheDocument();
  });

  test('shows Unknown when the ML engagement state was not available', async () => {
    const unknownPlan = {
      ...reviewedPlan,
      metric_comparison: { ...reviewedPlan.metric_comparison, engagement: { baseline: null, review: true } },
    };
    mockPageData([unknownPlan]);
    renderPage();
    expect(await screen.findByText(/Unknown → Engaged/i)).toBeInTheDocument();
  });

  test('requires an explicit support strategy before creating', async () => {
    mockPageData();
    renderPage('/teacher/support-plans?studentId=2');
    await waitFor(() => expect(screen.getByLabelText('Student')).toHaveValue('2'));
    expect(screen.getByLabelText('Support strategy')).toHaveValue('');

    fireEvent.change(screen.getByLabelText('Learning goal'), { target: { value: 'Read two short pages.' } });
    fireEvent.click(screen.getByRole('button', { name: /create plan & capture baseline/i }));

    expect(await screen.findByText(/choose a support strategy/i)).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  test('author can edit an active plan without changing the student', async () => {
    const activePlan = {
      ...reviewedPlan, id: 4, status: 'active', outcome: null, metric_comparison: null,
      review_date: `${defaultReviewDate()}T00:00:00`, notes: 'Use picture cards.',
    };
    mockPageData([activePlan]);
    api.put.mockResolvedValue({ data: { success: true } });
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /edit plan for sam/i }));
    expect(screen.getByText(/edit support plan for sam/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Student')).toBeDisabled();
    expect(screen.getByLabelText('Support strategy')).toHaveValue('visual_support');
    expect(screen.getByLabelText('Review date')).toHaveValue(defaultReviewDate());

    fireEvent.change(screen.getByLabelText('Learning goal'), { target: { value: 'Read three short pages.' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(api.put).toHaveBeenCalledWith('/support-plans/4', {
      intervention_type: 'visual_support',
      custom_intervention: '',
      goal: 'Read three short pages.',
      notes: 'Use picture cards.',
      review_date: defaultReviewDate(),
    }));
    expect(await screen.findByText('Support plan updated.')).toBeInTheDocument();
  });

  test('shows the baseline and flags an overdue review on active plans', async () => {
    const overduePlan = {
      ...reviewedPlan, id: 5, status: 'active', outcome: null, metric_comparison: null,
      review_date: '2020-01-01T00:00:00',
      baseline_snapshot: { total_xp: 70, lessons_completed: 3, quizzes_taken: 1, total_time_spent: 30, current_streak: 2, engaged: false, risk_level: 'moderate' },
    };
    mockPageData([overduePlan]);
    renderPage();

    expect(await screen.findByText('Review overdue')).toBeInTheDocument();
    expect(screen.getByText(/70 XP/)).toBeInTheDocument();
    expect(screen.getByText(/At risk \(moderate risk\)/)).toBeInTheDocument();
  });

  test('still lists plans when the student list fails to load', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/support-plans') return Promise.resolve({ data: { data: [reviewedPlan] } });
      return Promise.reject({ response: { status: 500 } });
    });
    renderPage();
    expect(await screen.findByText('Read two short pages.')).toBeInTheDocument();
  });
});
