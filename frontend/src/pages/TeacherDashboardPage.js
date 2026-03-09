import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
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
      
      // Fetch students who have completed assessments
      const sessionsResponse = await fetch('http://localhost:5000/api/assessment/sessions/all');
      const sessionsData = await sessionsResponse.json();
      
      if (sessionsData.sessions) {
        // Get unique students
        const uniqueStudents = [...new Set(sessionsData.sessions.map(s => s.student_name))];
        setStudents(uniqueStudents);
        
        // Get completed assessments
        const completed = sessionsData.sessions.filter(s => s.status === 'completed');
        setAssessmentResults(completed);
        
        // Calculate stats
        const totalStudents = uniqueStudents.length;
        const completedAssessments = completed.length;
        const averageScore = completed.length > 0 
          ? completed.reduce((sum, s) => sum + (s.total_score || 0), 0) / completed.length 
          : 0;
        
        setStats({
          totalStudents,
          completedAssessments,
          averageScore: Math.round(averageScore),
          activeGames: sessionsData.sessions.filter(s => s.status === 'in_progress').length
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
    return emojis[category] || '🎯';
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
          <p className="no-data">No students have taken assessments yet.</p>
        ) : (
          <div className="students-list">
            {students.map((studentName, index) => {
              const studentResults = assessmentResults.filter(r => r.student_name === studentName);
              const latestResult = studentResults[studentResults.length - 1];
              
              return (
                <div key={index} className="student-item">
                  <div className="student-info">
                    <div className="student-avatar">
                      {studentName.charAt(0).toUpperCase()}
                    </div>
                    <div className="student-details">
                      <h4>{studentName}</h4>
                      <p>{studentResults.length} assessment{studentResults.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="student-category">
                    {(latestResult?.primary_learning_style || latestResult?.learning_style) ? (
                      <>
                        <span className="category-emoji">
                          {getCategoryEmoji(latestResult.primary_learning_style || latestResult.learning_style)}
                        </span>
                        <span className="category-name">{latestResult.primary_learning_style || latestResult.learning_style}</span>
                      </>
                    ) : (
                      <span className="no-category">No category yet</span>
                    )}
                  </div>
                  <Link to={`/student-dashboard?name=${encodeURIComponent(studentName)}`} className="view-btn">
                    View Details →
                  </Link>
                </div>
              );
            })}
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
                  <th>Total Score</th>
                  <th>Completed</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {assessmentResults.slice(0, 10).map((result) => (
                  <tr key={result.id}>
                    <td>{result.student_name}</td>
                    <td>
                      <span className="category-badge">
                        {getCategoryEmoji(result.primary_learning_style || result.learning_style)} {result.primary_learning_style || result.learning_style}
                      </span>
                    </td>
                    <td className="score">{result.total_score || 0}</td>
                    <td>{new Date(result.completed_at).toLocaleDateString()}</td>
                    <td>
                      <Link 
                        to={`/student-dashboard?name=${encodeURIComponent(result.student_name)}`}
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
