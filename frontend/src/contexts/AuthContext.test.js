import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from './AuthContext';
import api from '../services/api';

// Mock the api module
jest.mock('../services/api');

describe('AuthContext', () => {
  const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('provides initial null user when not authenticated', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  test('login function authenticates user successfully', async () => {
    const mockResponse = {
      data: {
        access_token: 'mock-token',
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          role: 'student'
        }
      }
    };
    api.post.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      const response = await result.current.login('testuser', 'password123');
      expect(response.user.username).toBe('testuser');
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockResponse.data.user);
      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'mock-token');
    });
  });

  test('login function throws error on failed authentication', async () => {
    const mockError = {
      response: {
        data: {
          error: 'Invalid credentials'
        }
      }
    };
    api.post.mockRejectedValue(mockError);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await expect(
      act(async () => {
        await result.current.login('wronguser', 'wrongpass');
      })
    ).rejects.toThrow();
  });

  test('logout function clears user and token', async () => {
    // First login
    const mockResponse = {
      data: {
        access_token: 'mock-token',
        user: {
          id: 1,
          username: 'testuser',
          role: 'student'
        }
      }
    };
    api.post.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('testuser', 'password123');
    });

    // Then logout
    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(localStorage.removeItem).toHaveBeenCalledWith('token');
  });

  test('register function creates new user', async () => {
    const mockResponse = {
      data: {
        access_token: 'mock-token',
        user: {
          id: 1,
          username: 'newuser',
          email: 'new@example.com',
          role: 'student'
        }
      }
    };
    api.post.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.register({
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123'
      });
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockResponse.data.user);
      expect(api.post).toHaveBeenCalledWith('/auth/register', expect.any(Object));
    });
  });

  test('updateProfile function updates user information', async () => {
    // First login
    const loginResponse = {
      data: {
        access_token: 'mock-token',
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          role: 'student'
        }
      }
    };
    api.post.mockResolvedValue(loginResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('testuser', 'password123');
    });

    // Update profile
    const updateResponse = {
      data: {
        user: {
          id: 1,
          username: 'testuser',
          email: 'newemail@example.com',
          role: 'student'
        }
      }
    };
    api.put.mockResolvedValue(updateResponse);

    await act(async () => {
      await result.current.updateProfile({ email: 'newemail@example.com' });
    });

    await waitFor(() => {
      expect(result.current.user.email).toBe('newemail@example.com');
    });
  });

  test('initializes user from stored token on mount', async () => {
    const mockToken = 'stored-token';
    const mockUser = {
      id: 1,
      username: 'testuser',
      role: 'student'
    };

    localStorage.getItem.mockReturnValue(mockToken);
    api.get.mockResolvedValue({ data: mockUser });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(api.get).toHaveBeenCalledWith('/auth/profile');
    });
  });

  test('handles invalid stored token gracefully', async () => {
    localStorage.getItem.mockReturnValue('invalid-token');
    api.get.mockRejectedValue({ response: { status: 401 } });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
    });
  });
});
