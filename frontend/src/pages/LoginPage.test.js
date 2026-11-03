import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import LoginPage from './LoginPage';
import { AuthProvider } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

// Mock dependencies
jest.mock('react-toastify');
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock AuthContext
const mockLogin = jest.fn();
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    user: null,
  }),
  AuthProvider: ({ children }) => <div>{children}</div>,
}));

const renderLoginPage = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('LoginPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders login form', () => {
    renderLoginPage();
    
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('displays link to registration page', () => {
    renderLoginPage();
    
    const signUpLink = screen.getByText(/sign up/i);
    expect(signUpLink).toBeInTheDocument();
    expect(signUpLink.closest('a')).toHaveAttribute('href', '/register');
  });

  test('explains how to reset a forgotten password (no dead link)', () => {
    renderLoginPage();
    expect(screen.getByText(/ask your teacher or an admin/i)).toBeInTheDocument();
    expect(screen.queryByText(/google/i)).not.toBeInTheDocument();
  });

  test('toggles password visibility', () => {
    renderLoginPage();
    
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const toggleButton = screen.getByRole('button', { name: /👁️/ });
    
    // Initially password is hidden
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click to show password
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Click to hide password again
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('updates form fields on user input', () => {
    renderLoginPage();
    
    const usernameInput = screen.getByPlaceholderText(/username/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    expect(usernameInput).toHaveValue('testuser');
    expect(passwordInput).toHaveValue('password123');
  });

  test('submits form with valid credentials', async () => {
    mockLogin.mockResolvedValue({
      user: { id: 1, username: 'testuser', role: 'student' }
    });
    
    renderLoginPage();
    
    const usernameInput = screen.getByPlaceholderText(/username/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });
    
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123');
      expect(toast.success).toHaveBeenCalledWith('Login successful!');
    });
  });

  test('shows error message on failed login', async () => {
    mockLogin.mockRejectedValue({ message: 'Invalid credentials' });
    
    renderLoginPage();
    
    const usernameInput = screen.getByPlaceholderText(/username/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });
    
    fireEvent.change(usernameInput, { target: { value: 'wronguser' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
    });
  });

  test('disables submit button during login', async () => {
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    renderLoginPage();
    
    const usernameInput = screen.getByPlaceholderText(/username/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });
    
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/logging in/i)).toBeInTheDocument();
  });

  test('requires both username and password', () => {
    renderLoginPage();
    
    const usernameInput = screen.getByPlaceholderText(/username/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    
    expect(usernameInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });

  const loginAs = async (role, entry = '/login') => {
    mockLogin.mockResolvedValue({ user: { id: 1, username: 'someone', role } });
    render(
      <MemoryRouter initialEntries={[entry]}>
        <LoginPage />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: 'someone' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'pw' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
    return mockNavigate.mock.calls[0][0];
  };

  test.each([
    ['student', '/app/dashboard'],
    ['teacher', '/teacher/dashboard'],
    ['admin', '/admin/dashboard'],
  ])('a %s lands on their own home', async (role, home) => {
    expect(await loginAs(role)).toBe(home);
  });

  test('returns to the page that asked for a login when the role allows it', async () => {
    const entry = { pathname: '/login', state: { from: { pathname: '/teacher/support-plans', search: '?studentId=2' } } };
    expect(await loginAs('teacher', entry)).toBe('/teacher/support-plans?studentId=2');
  });

  test('ignores a "go back" page the role cannot open', async () => {
    const entry = { pathname: '/login', state: { from: { pathname: '/admin/users' } } };
    expect(await loginAs('student', entry)).toBe('/app/dashboard');
  });
});
