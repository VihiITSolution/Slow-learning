/**
 * Authentication Context
 * 
 * Provides global authentication state management using React Context API.
 * Handles user login, registration, logout, and session persistence.
 * 
 * Features:
 * - JWT token management in localStorage
 * - User session persistence across page reloads
 * - Synchronized auth state across all components
 * - Automatic token inclusion in API requests
 * 
 * Usage:
 * 1. Wrap app with <AuthProvider>
 * 2. Use useAuth() hook in any component to access auth state/methods
 * 
 * @module contexts/AuthContext
 */
import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';

// Create context with null default (enforces use within provider)
const AuthContext = createContext(null);

/**
 * Custom hook to access authentication context
 * 
 * Provides type-safe access to auth state and methods.
 * Throws error if used outside AuthProvider (prevents bugs).
 * 
 * @returns {Object} Auth context value
 * @returns {Object|null} user - Current user object or null if not authenticated
 * @returns {Function} login - Login function (username, password) => Promise
 * @returns {Function} register - Register function (username, email, password, role) => Promise
 * @returns {Function} logout - Logout function (clears session)
 * @returns {Function} updateUser - Update user data in state and localStorage
 * @returns {boolean} isAuthenticated - Convenience flag (true if user logged in)
 * 
 * @throws {Error} If used outside AuthProvider
 * 
 * @example
 * const { user, login, logout, isAuthenticated } = useAuth();
 * 
 * if (isAuthenticated) {
 *   console.log(`Logged in as ${user.username}`);
 * }
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Authentication Provider Component
 * 
 * Wraps application to provide auth state to all child components.
 * Manages user session, token storage, and authentication actions.
 * 
 * State Management:
 * - user: Current user object from API (null when logged out)
 * - loading: Initial load flag (prevents flash of unauthenticated content)
 * 
 * Storage Strategy:
 * - localStorage used for session persistence (survives page reloads)
 * - Stores: 'token' (JWT) and 'user' (JSON serialized user object)
 * - Auto-hydrates state on mount if valid session exists
 * 
 * @component
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to wrap
 * 
 * @example
 * // In App.js
 * <AuthProvider>
 *   <Router>
 *     <Routes>...</Routes>
 *   </Router>
 * </AuthProvider>
 */
export const AuthProvider = ({ children }) => {
  // User object from API (contains id, username, email, role, XP, level, etc.)
  const [user, setUser] = useState(null);
  
  // Loading flag prevents rendering protected routes before auth check completes
  const [loading, setLoading] = useState(true);

  // On mount: Check localStorage for existing session and hydrate state
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setLoading(false);
        return;
      }
      // Always fetch fresh data from API so XP/level are never stale
      import('../services/api').then(({ default: api }) => {
        api.get('/auth/profile')
          .then(res => {
            setUser(res.data);
            localStorage.setItem('user', JSON.stringify(res.data));
          })
          .catch(() => {}) // keep stale data if request fails (offline)
          .finally(() => setLoading(false));
      });
    } else {
      setLoading(false);
    }
  }, []);

  /**
   * Login user with credentials
   * 
   * Calls API, stores JWT token, updates global state.
   * Token automatically included in future API requests via axios interceptor.
   * 
   * @param {string} username - User's username
   * @param {string} password - User's password (sent over HTTPS)
   * @returns {Promise<Object>} Login response with user and token
   * @throws {Error} If credentials invalid or network error
   */
  const login = async (username, password) => {
    const response = await authService.login(username, password);
    
    // Update global state
    setUser(response.user);
    
    // Persist session to localStorage
    localStorage.setItem('token', response.access_token);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    return response;
  };

  /**
   * Register new user account
   * 
   * Creates account and automatically logs user in.
   * 
   * @param {string} username - Desired username (3-80 chars)
   * @param {string} email - Email address (must be valid format)
   * @param {string} password - Password (min 8 chars recommended)
   * @param {string} [role='student'] - User role (student or teacher)
   * @returns {Promise<Object>} Registration response with user and token
   * @throws {Error} If username/email taken or validation fails
   */
  const register = async (username, email, password, role = 'student') => {
    const response = await authService.register(username, email, password, role);
    
    // Update global state and persist session
    setUser(response.user);
    localStorage.setItem('token', response.access_token);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    return response;
  };

  /**
   * Logout current user
   * 
   * Clears user state and removes session data from localStorage.
   * Does not call API (JWT tokens are stateless - just delete client-side).
   */
  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  /**
   * Update user data in state and storage
   * 
   * Used when user profile changes (XP gained, level up, profile updates).
   * Keeps localStorage in sync with React state.
   * 
   * @param {Object} userData - Updated user object from API
   */
  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const refreshUser = async () => {
    try {
      const { default: api } = await import('../services/api');
      const response = await api.get('/auth/profile');
      updateUser(response.data);
    } catch (_) {}
  };

  // Context value provided to all consumers via useAuth()
  const value = {
    user,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
    isAuthenticated: !!user,  // Convenience boolean for conditional rendering
  };

  // Show loading spinner during initial auth check
  // Prevents flash of login screen if user is actually logged in
  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
