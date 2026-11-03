import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import '@testing-library/jest-dom';
import LessonDetailPage from './LessonDetailPage';
import api from '../services/api';

jest.mock('../services/api');
const mockRefreshUser = jest.fn();
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ refreshUser: mockRefreshUser }),
}));

const lesson = {
  id: 1, title: 'Counting to 10', description: 'Count things', category: 'math',
  xp_reward: 50, content: JSON.stringify({
    type: 'interactive', emoji: '🔢',
    steps: [{ type: 'learn', title: 'Let us count', content: '<p>1, 2, 3</p>' }],
  }),
};

const quiz = {
  id: 7, lesson_id: 1, title: 'Counting quiz', passing_score: 70, xp_reward: 20,
  questions: [
    { q: 'What comes after 1?', options: ['2', '5'] },
    { q: 'What is 1 + 1?', options: ['1', '2'] },
  ],
};

function mockLesson({ withQuiz = true } = {}) {
  api.get.mockImplementation((url) => {
    if (url === '/lessons/1') return Promise.resolve({ data: lesson });
    if (url === '/lessons/1/quiz') {
      return withQuiz ? Promise.resolve({ data: quiz }) : Promise.reject({ response: { status: 404 } });
    }
    return Promise.resolve({ data: {} });
  });
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/app/lessons/1']}>
      <Routes><Route path="/app/lessons/:id" element={<LessonDetailPage />} /></Routes>
    </MemoryRouter>
  );
}

async function goToQuiz() {
  await userEvent.click(await screen.findByRole('button', { name: /start learning/i }));
  await userEvent.click(await screen.findByRole('button', { name: /go to quiz/i }));
}

describe('LessonDetailPage quiz', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  test('shows the stored quiz, records the attempt and reviews mistakes', async () => {
    mockLesson();
    api.post.mockImplementation((url) => {
      if (url === '/lessons/1/start') return Promise.resolve({ data: {} });
      if (url === '/lessons/1/quiz') {
        return Promise.resolve({ data: {
          score: 50, passed: false, correct: 1, total: 2, xp_earned: 0,
          review: [
            { your_answer: 0, correct_answer: 0, is_correct: true },
            { your_answer: 0, correct_answer: 1, is_correct: false },
          ],
        } });
      }
      if (url === '/lessons/1/complete') return Promise.resolve({ data: { xp_earned: 50, already_completed: false } });
      return Promise.resolve({ data: {} });
    });

    renderPage();
    await goToQuiz();

    expect(screen.getByText('1. What comes after 1?')).toBeInTheDocument();
    expect(screen.getByText(/you need 70% to pass/i)).toBeInTheDocument();

    // Submitting with a gap shows an inline message, not a browser alert
    await userEvent.click(screen.getAllByRole('radio')[0]);
    await userEvent.click(screen.getByRole('button', { name: /submit answers/i }));
    expect(screen.getByRole('alert')).toHaveTextContent('1 left');
    expect(api.post).not.toHaveBeenCalledWith('/lessons/1/quiz', expect.anything());

    await userEvent.click(screen.getAllByRole('radio')[2]);
    await userEvent.click(screen.getByRole('button', { name: /submit answers/i }));

    await waitFor(() => expect(screen.getByText('+50 XP earned!', { exact: false })).toBeInTheDocument());
    expect(api.post).toHaveBeenCalledWith('/lessons/1/quiz', expect.objectContaining({ answers: [0, 0] }));
    expect(api.post).toHaveBeenCalledWith('/lessons/1/complete', expect.objectContaining({ time_spent: expect.any(Number) }));
    expect(screen.getByText(/not passed \(need 70%\)/i)).toBeInTheDocument();
    expect(screen.getByText('2. What is 1 + 1?')).toBeInTheDocument();
    expect(screen.getByText('Right answer: 2')).toBeInTheDocument();
    expect(mockRefreshUser).toHaveBeenCalled();
  });

  test('saves the first answer to each activity step in the lesson', async () => {
    const withActivities = {
      ...lesson,
      content: JSON.stringify({
        type: 'interactive',
        steps: [
          { type: 'activity', title: 'Try it', question: '1 + 1?', options: ['1', '2'], correct: 1 },
          { type: 'learn', title: 'Well done', content: '<p>Good</p>' },
          { type: 'activity', title: 'Again', question: '2 + 1?', options: ['3', '4'], correct: 0 },
        ],
      }),
    };
    api.get.mockImplementation((url) => {
      if (url === '/lessons/1') return Promise.resolve({ data: withActivities });
      if (url === '/lessons/1/quiz') return Promise.resolve({ data: quiz });
      return Promise.resolve({ data: {} });
    });
    api.post.mockResolvedValue({ data: {} });

    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: /start learning/i }));
    await userEvent.click(await screen.findByRole('button', { name: 'A. 1' }));   // wrong first
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    await userEvent.click(screen.getByRole('button', { name: 'A. 3' }));          // right
    await userEvent.click(screen.getByRole('button', { name: /go to quiz/i }));

    expect(api.post).toHaveBeenCalledWith('/activities/lesson-steps', expect.objectContaining({ lesson_id: 1, answers: [0, 0] }));
    expect(await screen.findByText('1. What comes after 1?')).toBeInTheDocument();
  });

  test('a lesson without a quiz can still be completed', async () => {
    mockLesson({ withQuiz: false });
    api.post.mockImplementation((url) => {
      if (url === '/lessons/1/complete') return Promise.resolve({ data: { xp_earned: 0, already_completed: true } });
      return Promise.resolve({ data: {} });
    });

    renderPage();
    await goToQuiz();
    await userEvent.click(screen.getByRole('button', { name: /complete lesson/i }));

    expect(await screen.findByText(/lesson reviewed/i)).toBeInTheDocument();
  });
});
