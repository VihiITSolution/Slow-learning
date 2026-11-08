import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import api from '../../services/api';
import SupportPlansPage from '../../pages/SupportPlansPage';
import { AIClassSummary, EncouragementComposer, ReviewSummary, TeacherMessageCard, resetAIStatusCache } from './AIAssist';

jest.mock('../../services/api');
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 9, username: 'teacher', role: 'teacher' } }),
}));

const geminiReply = (suggestion, extra = {}) => ({
  data: { data: { suggestion_id: 11, source: 'gemini', model: 'gemini-3.5-flash-lite', note: null,
    privacy_note: 'Only anonymous numbers are sent to Google Gemini - no names, IDs or notes.', suggestion, ...extra } },
});

beforeEach(() => {
  jest.clearAllMocks();
  resetAIStatusCache();
});

describe('Support plan AI suggestion', () => {
  function mockPage() {
    api.get.mockImplementation((url) => {
      if (url === '/support-plans') return Promise.resolve({ data: { data: [] } });
      if (url === '/auth/students') return Promise.resolve({ data: { students: [{ id: 2, username: 'sam' }] } });
      if (url === '/ai/status') return Promise.resolve({ data: { data: { enabled: true, model: 'gemini-3.5-flash-lite' } } });
      return Promise.resolve({ data: {} });
    });
    api.post.mockImplementation((url) => {
      if (url === '/ai/support-plan/suggest') {
        return Promise.resolve(geminiReply({
          intervention_type: 'extra_practice', custom_intervention: null,
          goal: 'Raise practice accuracy from 30% to 50%.',
          strategies: ['Daily practice round with hints', 'Celebrate every star'],
          review_in_days: 14, why: 'Practice answers are often wrong first time.',
        }));
      }
      return Promise.resolve({ data: { success: true } });
    });
  }

  test('fills the form from the suggestion and links it to the new plan', async () => {
    mockPage();
    render(<MemoryRouter initialEntries={['/teacher/support-plans?studentId=2']}><SupportPlansPage /></MemoryRouter>);
    await waitFor(() => expect(screen.getByLabelText('Student')).toHaveValue('2'));

    fireEvent.click(screen.getByRole('button', { name: /suggest a plan with ai/i }));
    expect(await screen.findByText('Raise practice accuracy from 30% to 50%.')).toBeInTheDocument();
    expect(screen.getByText(/written by google gemini/i)).toBeInTheDocument();
    expect(screen.getByText(/no names, ids or notes/i)).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledWith('/ai/support-plan/suggest', { student_id: 2 });

    fireEvent.click(screen.getByRole('button', { name: /use this suggestion/i }));
    expect(screen.getByLabelText('Support strategy')).toHaveValue('extra_practice');
    expect(screen.getByLabelText('Learning goal')).toHaveValue('Raise practice accuracy from 30% to 50%.');
    expect(screen.getByLabelText(/teacher notes/i).value).toContain('- Daily practice round with hints');
    expect(screen.getByText(/filled from the ai suggestion/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Learning goal'), { target: { value: 'Raise accuracy to 45%.' } });
    fireEvent.click(screen.getByRole('button', { name: /create plan & capture baseline/i }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/support-plans', expect.objectContaining({
      student_id: 2, goal: 'Raise accuracy to 45%.', intervention_type: 'extra_practice', ai_suggestion_id: 11,
    })));
  });
});

test('review summary shows the suggested outcome without choosing it', () => {
  const onAdd = jest.fn();
  render(<ReviewSummary
    result={{ source: 'rules', model: null, note: 'AI is not switched on (no Gemini API key), so this is a basic built-in suggestion.',
      suggestion: { summary: 'Practice went up.', improved: ['Practice accuracy: 30% -> 55%'], watch: [],
        suggested_outcome: 'improved', next_step: 'Set a harder goal.' } }}
    outcomeLabel={() => 'Improved'} onAddToNotes={onAdd} added={false} />);
  expect(screen.getByText('⚙️ Basic built-in suggestion')).toBeInTheDocument();
  expect(screen.getByText(/no gemini api key/i)).toBeInTheDocument();
  expect(screen.getByText(/you choose the outcome below/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /add to review notes/i }));
  expect(onAdd).toHaveBeenCalled();
});

test('class summary lists who to help first with a plan link', async () => {
  api.get.mockResolvedValue({ data: { data: { enabled: false } } });
  api.post.mockResolvedValue(geminiReply({
    overview: '2 of 3 students are at risk.',
    priorities: [{ ref: 'S1', student_id: 5, username: 'nimal', reason: 'Practice accuracy is 22%', action: 'Try easier rounds' }],
    patterns: ['Word Play is the hardest area'], celebrate: [{ ref: 'S3', student_id: 7, username: 'kasun', reason: 'Engaged' }],
    students_included: 3,
  }));
  render(<MemoryRouter><AIClassSummary /></MemoryRouter>);
  expect(await screen.findByText(/ai key not set/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /summarise my class/i }));
  expect(await screen.findByText('2 of 3 students are at risk.')).toBeInTheDocument();
  expect(screen.getByText('nimal')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Create plan' })).toHaveAttribute('href', '/teacher/support-plans?studentId=5');
  expect(screen.getByText('Word Play is the hardest area')).toBeInTheDocument();
  expect(screen.getByText('kasun')).toBeInTheDocument();
});

test('encouragement draft can be edited and sent', async () => {
  const onSent = jest.fn();
  api.post.mockImplementation((url) => {
    if (url === '/ai/encouragement/draft') return Promise.resolve(geminiReply({ message: 'Nimal, great practice today! ⭐' }));
    return Promise.resolve({ data: { success: true } });
  });
  render(<EncouragementComposer student={{ user_id: 5, username: 'nimal' }} onClose={jest.fn()} onSent={onSent} />);
  const box = await screen.findByLabelText('Message text');
  expect(box).toHaveValue('Nimal, great practice today! ⭐');
  await userEvent.type(box, ' See you tomorrow!');
  fireEvent.click(screen.getByRole('button', { name: /send to student/i }));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/ai/messages', {
    student_id: 5, body: 'Nimal, great practice today! ⭐ See you tomorrow!', ai_suggestion_id: 11,
  }));
  expect(onSent).toHaveBeenCalled();
});

test('student sees the teacher message and can mark it read', async () => {
  const message = { id: 3, body: 'Nimal, we miss you! 🌟', teacher_name: 'ms_silva', read: false };
  api.get.mockResolvedValue({ data: { data: { messages: [message], unread: 1 } } });
  api.post.mockResolvedValue({ data: { data: { ...message, read: true } } });
  render(<TeacherMessageCard />);
  expect(await screen.findByText('Nimal, we miss you! 🌟')).toBeInTheDocument();
  expect(screen.getByText(/from ms_silva/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /got it/i }));
  await waitFor(() => expect(screen.queryByRole('button', { name: /got it/i })).toBeNull());
  expect(api.post).toHaveBeenCalledWith('/ai/messages/3/read');
});

test('no message card when there are no messages', async () => {
  api.get.mockResolvedValue({ data: { data: { messages: [], unread: 0 } } });
  const { container } = render(<TeacherMessageCard />);
  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/ai/messages/mine'));
  expect(container).toBeEmptyDOMElement();
});
