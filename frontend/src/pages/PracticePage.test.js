import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import PracticePage from './PracticePage';
import api from '../services/api';

jest.mock('../services/api');
const mockRefreshUser = jest.fn();
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ refreshUser: mockRefreshUser }),
}));

const areas = [
  { id: 'math', title: 'Number Fun', emoji: '🔢', accuracy_week: 80 },
  { id: 'words', title: 'Word Play', emoji: '🔤', accuracy_week: null },
  { id: 'world', title: 'My World', emoji: '🌍', accuracy_week: null },
];

const question = (i, answer) => ({
  id: i, type: 'add', prompt: `Question ${i + 1}?`, visual: '🍎', options: ['1', '2', '3', '4'], answer, hint: `Hint ${i + 1}`,
});
const round = { category: 'math', title: 'Number Fun', emoji: '🔢', seed: 77, questions: [0, 1, 2, 3, 4].map((i) => question(i, 1)) };

const today = (checkIn = null) => ({
  check_in: checkIn, done: checkIn ? 1 : 0, total: 4,
  challenges: [{ id: 'check_in', label: 'Tell us how you feel today', done: Boolean(checkIn), link: '/app/practice' }],
});

function mockApi({ checkIn = null } = {}) {
  api.get.mockImplementation((url) => {
    if (url === '/activities/practice/areas') return Promise.resolve({ data: { areas } });
    if (url === '/activities/today') return Promise.resolve({ data: today(checkIn) });
    if (url === '/activities/practice/math') return Promise.resolve({ data: round });
    return Promise.resolve({ data: {} });
  });
  api.post.mockImplementation((url, body) => {
    if (url === '/activities/check-in') {
      return Promise.resolve({ data: { check_in: { mood: body.mood, emoji: '😕', label: 'Not sure' }, message: "That's okay. Let's start with something easy." } });
    }
    if (url === '/activities/practice') {
      return Promise.resolve({ data: { score: 80, correct: 4, total: 5, stars: 3, xp_earned: 5,
        review: [{ prompt: 'Question 1?', is_correct: false, your_answer: '1', correct_answer: '2' }] } });
    }
    return Promise.resolve({ data: {} });
  });
}

const renderPage = () => render(<MemoryRouter><PracticePage /></MemoryRouter>);

describe('PracticePage', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  test('shows the check-in, the practice areas and this week\'s accuracy', async () => {
    mockApi();
    renderPage();
    expect(await screen.findByText(/how do you feel about learning today/i)).toBeInTheDocument();
    expect(screen.getByText('Number Fun')).toBeInTheDocument();
    expect(screen.getByText(/this week: 80% right first time/i)).toBeInTheDocument();
    expect(screen.getAllByText(/not tried this week/i)).toHaveLength(2);
    expect(screen.getByText(/today's challenges: 0 of 4 done/i)).toBeInTheDocument();
  });

  test('saves the daily check-in', async () => {
    mockApi();
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: /not sure/i }));
    expect(api.post).toHaveBeenCalledWith('/activities/check-in', { mood: 'unsure' });
    expect(await screen.findByText(/today you feel: not sure/i)).toBeInTheDocument();
    expect(screen.getByText(/start with something easy/i)).toBeInTheDocument();
  });

  test('a round records first answers, tries and hints, then shows stars', async () => {
    mockApi({ checkIn: { mood: 'great', emoji: '😄', label: 'Great' } });
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: /start number fun/i }));
    expect(await screen.findByText('Question 1?')).toBeInTheDocument();

    // Q1: wrong first, then right
    await userEvent.click(screen.getByRole('button', { name: '1' }));
    expect(screen.getByText(/try again/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '2' }));
    expect(screen.getByText(/yes! well done/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /next/i }));

    // Q2: hint takes one wrong answer away, then right
    await userEvent.click(screen.getByRole('button', { name: /hint/i }));
    expect(screen.getByText('💡 Hint 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /taken away by the hint/i })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: '2' }));
    await userEvent.click(screen.getByRole('button', { name: /next/i }));

    // Q3-Q5: right first time
    for (let i = 2; i < 5; i += 1) {
      await userEvent.click(screen.getByRole('button', { name: '2' }));
      await userEvent.click(screen.getByRole('button', { name: i === 4 ? /see my stars/i : /next/i }));
    }

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/activities/practice', expect.anything()));
    const sent = api.post.mock.calls.find(([url]) => url === '/activities/practice')[1];
    expect(sent.category).toBe('math');
    expect(sent.seed).toBe(77);
    expect(sent.answers[0]).toMatchObject({ choice: 0, tries: 2, hint_used: false });
    expect(sent.answers[1]).toMatchObject({ choice: 1, tries: 1, hint_used: true });
    expect(sent.answers[4]).toMatchObject({ choice: 1, tries: 1, hint_used: false });

    expect(await screen.findByText(/4 of 5 right first time/i)).toBeInTheDocument();
    expect(screen.getByText(/\+5 XP earned/i)).toBeInTheDocument();
    const remember = screen.getByText(/let's remember these/i).parentElement;
    expect(within(remember).getByText(/→ 2/)).toBeInTheDocument();
    expect(mockRefreshUser).toHaveBeenCalled();
  });
});
