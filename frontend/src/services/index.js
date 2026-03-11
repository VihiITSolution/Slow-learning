import api from './api';

export const authService = {
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },

  register: async (username, email, password) => {
    const response = await api.post('/auth/register', { username, email, password });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },
};

export const lessonService = {
  getLessons: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/lessons?${params}`);
    return response.data;
  },

  getLesson: async (id) => {
    const response = await api.get(`/lessons/${id}`);
    return response.data;
  },

  startLesson: async (id) => {
    const response = await api.post(`/lessons/${id}/start`);
    return response.data;
  },

  completeLesson: async (id, data) => {
    const response = await api.post(`/lessons/${id}/complete`, data);
    return response.data;
  },

  updateProgress: async (id, data) => {
    const response = await api.put(`/lessons/${id}/progress`, data);
    return response.data;
  },
};

export const gamificationService = {
  getAchievements: async () => {
    const response = await api.get('/gamification/achievements');
    return response.data;
  },

  unlockAchievement: async (data) => {
    const response = await api.post('/gamification/achievements/unlock', data);
    return response.data;
  },

  getLeaderboard: async (period = 'all_time', limit = 10) => {
    const response = await api.get(`/gamification/leaderboard?period=${period}&limit=${limit}`);
    return response.data;
  },

  getStreak: async () => {
    const response = await api.get('/gamification/streak');
    return response.data;
  },

  addXP: async (xp_amount) => {
    const response = await api.post('/gamification/xp/add', { xp_amount });
    return response.data;
  },
};

export const analyticsService = {
  getDashboard: async () => {
    const response = await api.get('/analytics/dashboard');
    return response.data;
  },

  checkEngagement: async () => {
    const response = await api.get('/analytics/engagement');
    return response.data;
  },

  getProgressOverTime: async (days = 30) => {
    const response = await api.get(`/analytics/progress-over-time?days=${days}`);
    return response.data;
  },
};

export const recommendationService = {
  getRecommendations: async (limit = 5) => {
    const response = await api.get(`/recommendations/?limit=${limit}`);
    return response.data;
  },

  getNextLesson: async () => {
    const response = await api.get('/recommendations/next-lesson/');
    return response.data;
  },
};
