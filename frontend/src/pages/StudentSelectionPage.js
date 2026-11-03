import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import '../styles/StudentSelection.css';

const StudentSelectionPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [newStudentName, setNewStudentName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewStudent, setShowNewStudent] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await api.get('/auth/students');
      setStudents(response.data?.students || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartAssessment = () => {
    if (selectedStudent) {
      // Navigate to assessment with student info
      navigate('/learning-assessment', { 
        state: { 
          studentId: selectedStudent.id,
          studentName: selectedStudent.username,
          studentEmail: selectedStudent.email
        } 
      });
    }
  };

  const handleNewStudent = () => {
    if (newStudentName.trim()) {
      // Navigate to assessment with new student name
      navigate('/learning-assessment', { 
        state: { 
          studentName: newStudentName.trim(),
          isNewStudent: true
        } 
      });
    }
  };

  if (loading) {
    return (
      <div className="student-selection-page">
        <div className="loading">Loading students...</div>
      </div>
    );
  }

  return (
    <div className="student-selection-page">
      <div className="selection-container">
        <div className="selection-header">
          <button onClick={() => navigate('/teacher/dashboard')} className="back-btn">
            ← Back to Dashboard
          </button>
          <h1>👨‍🏫 Select Student for Assessment</h1>
          <p>Choose a student to begin the learning style assessment</p>
        </div>

        <div className="selection-content">
          {/* Existing Students */}
          <div className="students-section">
            <h2>Registered Students</h2>
            {students.length === 0 ? (
              <p className="no-students">No registered students found. Use "New Student" option below.</p>
            ) : (
              <div className="students-grid">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className={`student-card ${selectedStudent?.id === student.id ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedStudent(student);
                      setShowNewStudent(false);
                    }}
                  >
                    <div className="student-avatar">
                      {student.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="student-info">
                      <h3>{student.username}</h3>
                      <p>{student.email}</p>
                      <span className="student-level">Level {student.level}</span>
                    </div>
                    {selectedStudent?.id === student.id && (
                      <div className="selected-badge">✓</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="divider">
            <span>OR</span>
          </div>

          {/* New Student */}
          <div className="new-student-section">
            <h2>Assess New Student</h2>
            <p className="help-text">Enter student name if they don't have an account yet</p>
            
            <div className="new-student-form">
              <input
                type="text"
                placeholder="Enter student name..."
                value={newStudentName}
                onChange={(e) => {
                  setNewStudentName(e.target.value);
                  setSelectedStudent(null);
                }}
                onFocus={() => setShowNewStudent(true)}
              />
              {newStudentName && (
                <button onClick={handleNewStudent} className="btn-start">
                  Start Assessment with {newStudentName}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        {selectedStudent && (
          <div className="action-section">
            <button onClick={handleStartAssessment} className="btn-primary-large">
              Start Assessment for {selectedStudent.username} →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentSelectionPage;
