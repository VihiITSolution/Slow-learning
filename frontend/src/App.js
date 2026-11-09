import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
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
import PracticePage from './pages/PracticePage';
import ProfilePage from './pages/ProfilePage';
import LeaderboardPage from './pages/LeaderboardPage';
import AchievementsPage from './pages/AchievementsPage';
import MLInsightsPage from './pages/MLInsightsPage';
import LearningAssessmentPage from './pages/LearningAssessmentPage';
import InteractiveGamesPage from './pages/InteractiveGamesPage';
import AssessmentHomePage from './pages/AssessmentHomePage';
import StudentDashboard from './pages/StudentDashboard';
import GamificationPage from './pages/GamificationPage';
import TeacherDashboardPage from './pages/TeacherDashboardPage';
import StudentSelectionPage from './pages/StudentSelectionPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import UserManagementPage from './pages/UserManagementPage';
import CourseManagementPage from './pages/CourseManagementPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import TeacherMLReportsPage from './pages/TeacherMLReportsPage';
import StudentProgressSummaryPage from './pages/StudentProgressSummaryPage';
import SupportPlansPage from './pages/SupportPlansPage';

import NotFoundPage from './pages/NotFoundPage';

// Components
import RoleRoute, { HomeRedirect, GuestOnly } from './components/common/RoleRoute';
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

const STAFF = ['teacher', 'admin'];

// The quiz is part of each lesson page, so the old quiz URL opens the lesson
function LessonQuizRedirect() {
  const { id } = useParams();
  return <Navigate to={`/app/lessons/${id}`} replace />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            {/* Start page: logged-in users go to their own home */}
            <Route path="/" element={<HomeRedirect />} />

            {/* Learning Helper - games for children work without an account */}
            <Route path="/learning-helper" element={<AssessmentHomePage />} />
            <Route path="/student-dashboard" element={<StudentDashboard />} />
            <Route path="/interactive-games" element={<InteractiveGamesPage />} />
            {/* Assessing a student is a teacher task */}
            <Route path="/student-selection" element={<RoleRoute roles={STAFF}><StudentSelectionPage /></RoleRoute>} />
            <Route path="/learning-assessment" element={<RoleRoute roles={STAFF}><LearningAssessmentPage /></RoleRoute>} />

            {/* Authentication Routes */}
            <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
            <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />
            <Route path="/admin/login" element={<GuestOnly><AdminLoginPage /></GuestOnly>} />

            {/* Teacher Routes (admins can use them too) */}
            <Route
              path="/teacher"
              element={
                <RoleRoute roles={STAFF}>
                  <Layout />
                </RoleRoute>
              }
            >
              <Route index element={<Navigate to="/teacher/dashboard" replace />} />
              <Route path="dashboard" element={<TeacherDashboardPage />} />
              <Route path="ml-reports" element={<TeacherMLReportsPage />} />
              <Route path="support-plans" element={<SupportPlansPage />} />
              <Route path="ml-insights" element={<MLInsightsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Student app */}
            <Route
              path="/app"
              element={
                <RoleRoute roles={['student']}>
                  <Layout />
                </RoleRoute>
              }
            >
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="lessons" element={<LessonsPage />} />
              <Route path="lessons/:id" element={<LessonDetailPage />} />
              <Route path="lessons/:id/quiz" element={<LessonQuizRedirect />} />
              <Route path="practice" element={<PracticePage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="leaderboard" element={<LeaderboardPage />} />
              <Route path="achievements" element={<AchievementsPage />} />
              <Route path="gamification" element={<GamificationPage />} />
              <Route path="progress-summary" element={<StudentProgressSummaryPage />} />
              {/* ML Insights is a teacher tool now */}
              <Route path="ml-insights" element={<Navigate to="/teacher/ml-insights" replace />} />
            </Route>

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <RoleRoute roles={['admin']}>
                  <Layout />
                </RoleRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="users" element={<UserManagementPage />} />
              <Route path="courses" element={<CourseManagementPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
        <ToastContainer position="top-right" autoClose={3000} />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
