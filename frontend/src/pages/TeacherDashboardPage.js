import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import api from '../services/api';
import '../styles/TeacherDashboard.css';

const TeacherDashboardPage = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [assessmentResults, setAssessmentResults] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    completedAssessments: 0,
    averageScore: 0,
    activeGames: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const fetchTeacherData = async () => {
    try {
      setLoading(true);

      // Fetch all students (users with role='student') including their learning_style
      const studentsResponse = await api.get('/auth/students');
      const studentsData = studentsResponse.data;

      if (studentsData.students) {
        const allStudents = studentsData.students;
        setStudents(allStudents);

        // Assessed students are those with a learning_style saved
        const assessed = allStudents.filter(s => s.learning_style);
        setAssessmentResults(assessed);

        // Calculate stats
        const totalStudents = allStudents.length;
        const completedAssessments = assessed.length;
        const averageScore = assessed.length > 0
          ? assessed.reduce((sum, s) => sum + (s.assessment_score || 0), 0) / assessed.length
          : 0;

        setStats({
          totalStudents,
          completedAssessments,
          averageScore: Math.round(averageScore),
          activeGames: 0
        });
      }
    } catch (error) {
      console.error('Error fetching teacher data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryEmoji = (category) => {
    const emojis = {
      'Listener': '👂',
      'Reader': '📚',
      'Thinker': '🧠',
      'Mover': '🏃',
      'Talker': '💬',
      'Dreamer': '💭'
    };
    const key = Object.keys(emojis).find(k => category && category.includes(k));
    return key ? emojis[key] : '🎯';
  };

  if (loading) {
    return (
      <div className="teacher-dashboard">
        <div className="loading">Loading teacher dashboard...</div>
      </div>
    );
  }

  return (
    <div className="teacher-dashboard">
      <div className="teacher-header">
        <div className="teacher-welcome">
          <h1>👨‍🏫 Teacher Dashboard</h1>
          <p>Welcome back, {user?.username}!</p>
        </div>
        <Link to="/student-selection" className="btn-primary">
          Start New Assessment
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>{stats.totalStudents}</h3>
            <p>Total Students</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>{stats.completedAssessments}</h3>
            <p>Completed Assessments</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-info">
            <h3>{stats.averageScore}</h3>
            <p>Average Score</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎮</div>
          <div className="stat-info">
            <h3>{stats.activeGames}</h3>
            <p>Active Games</p>
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="section-card">
        <h2>📋 Student List</h2>
        {students.length === 0 ? (
          <p className="no-data">No students registered yet.</p>
        ) : (
          <div className="students-list">
            {students.map((student, index) => (
              <div key={student.id || index} className="student-item">
                <div className="student-info">
                  <div className="student-avatar">
                    {student.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="student-details">
                    <h4>{student.username}</h4>
                    <p>{student.learning_style ? '1 assessment' : '0 assessments'}</p>
                  </div>
                </div>
                <div className="student-category">
                  {student.learning_style ? (
                    <>
                      <span className="category-emoji">
                        {getCategoryEmoji(student.learning_style)}
                      </span>
                      <span className="category-name">{student.learning_style}</span>
                    </>
                  ) : (
                    <span className="no-category">No category yet</span>
                  )}
                </div>
                <Link to={`/student-dashboard?id=${student.id}&name=${encodeURIComponent(student.username)}`} className="view-btn">
                  View Details →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Assessments */}
      <div className="section-card">
        <h2>📊 Recent Assessments</h2>
        {assessmentResults.length === 0 ? (
          <p className="no-data">No completed assessments yet.</p>
        ) : (
          <div className="assessments-table">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Learning Style</th>
                  <th>Score</th>
                  <th>Assessed On</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {assessmentResults.slice(0, 10).map((student) => (
                  <tr key={student.id}>
                    <td>{student.username}</td>
                    <td>
                      <span className="category-badge">
                        {getCategoryEmoji(student.learning_style)} {student.learning_style}
                      </span>
                    </td>
                    <td className="score">{student.assessment_score || 0}</td>
                    <td>{student.assessment_date ? new Date(student.assessment_date).toLocaleDateString() : '—'}</td>
                    <td>
                      <Link
                        to={`/student-dashboard?id=${student.id}&name=${encodeURIComponent(student.username)}`}
                        className="table-link"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="section-card">
        <h2>⚡ Quick Actions</h2>
        <div className="quick-actions">
          <Link to="/student-selection" className="action-card">
            <div className="action-icon">🎯</div>
            <h3>Start Assessment</h3>
            <p>Select student and begin assessment</p>
          </Link>
          <Link to="/interactive-games" className="action-card">
            <div className="action-icon">🎮</div>
            <h3>View Games</h3>
            <p>See all interactive learning games</p>
          </Link>
          <Link to="/teacher/ml-reports" className="action-card" style={{background:'linear-gradient(135deg,#eef2ff,#f5f3ff)',borderColor:'#c7d2fe'}}>
            <div className="action-icon">🧠</div>
            <h3>ML Class Report</h3>
            <p>AI engagement analysis for all students</p>
          </Link>
          <button className="action-card" onClick={fetchTeacherData}>
            <div className="action-icon">🔄</div>
            <h3>Refresh Data</h3>
            <p>Update student information</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboardPage;
