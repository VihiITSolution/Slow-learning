import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context
import { AuthProvider } from './contexts/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import LessonsPage from './pages/LessonsPage';
import LessonDetailPage from './pages/LessonDetailPage';
import ProfilePage from './pages/ProfilePage';
import LeaderboardPage from './pages/LeaderboardPage';
import AchievementsPage from './pages/AchievementsPage';
import MLInsightsPage from './pages/MLInsightsPage';
import LearningAssessmentPage from './pages/LearningAssessmentPage';
import InteractiveGamesPage from './pages/InteractiveGamesPage';
import AssessmentHomePage from './pages/AssessmentHomePage';
import StudentDashboard from './pages/StudentDashboard';
import QuizPage from './pages/QuizPage';
import GamificationPage from './pages/GamificationPage';
import TeacherDashboardPage from './pages/TeacherDashboardPage';
import StudentSelectionPage from './pages/StudentSelectionPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import UserManagementPage from './pages/UserManagementPage';
import CourseManagementPage from './pages/CourseManagementPage';
import MaterialsLibraryPage from './pages/MaterialsLibraryPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import TeacherMLReportsPage from './pages/TeacherMLReportsPage';
import StudentProgressSummaryPage from './pages/StudentProgressSummaryPage';

// Components
import PrivateRoute from './components/common/PrivateRoute';
import Layout from './components/common/Layout';

// Styles
import './styles/App.css';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes - Learning Helper System */}
            <Route path="/" element={<Navigate to="/learning-helper" replace />} />
            <Route path="/learning-helper" element={<AssessmentHomePage />} />
            <Route path="/student-selection" element={<StudentSelectionPage />} />
            <Route path="/learning-assessment" element={<LearningAssessmentPage />} />
            <Route path="/student-dashboard" element={<StudentDashboard />} />
            <Route path="/interactive-games" element={<InteractiveGamesPage />} />
            
            {/* Authentication Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Teacher Routes */}
            <Route
              path="/teacher"
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route index element={<Navigate to="/teacher/dashboard" replace />} />
              <Route path="dashboard" element={<TeacherDashboardPage />} />
              <Route path="ml-reports" element={<TeacherMLReportsPage />} />
            </Route>

            {/* Private Routes - Main App */}
            <Route
              path="/app"
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="lessons" element={<LessonsPage />} />
              <Route path="lessons/:id" element={<LessonDetailPage />} />
              <Route path="lessons/:id/quiz" element={<QuizPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="leaderboard" element={<LeaderboardPage />} />
              <Route path="achievements" element={<AchievementsPage />} />
              <Route path="gamification" element={<GamificationPage />} />
              <Route path="ml-insights" element={<MLInsightsPage />} />
              <Route path="materials" element={<MaterialsLibraryPage />} />
              <Route path="progress-summary" element={<StudentProgressSummaryPage />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route
              path="/admin"
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="users" element={<UserManagementPage />} />
              <Route path="courses" element={<CourseManagementPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/learning-helper" replace />} />
          </Routes>
        </Router>
        <ToastContainer position="top-right" autoClose={3000} />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
