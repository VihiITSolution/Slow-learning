import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/App.css';

function LessonDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLessonDetails();
  }, [id]);

  const fetchLessonDetails = async () => {
    try {
      const response = await api.get(`/lessons/${id}`);
      setLesson(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load lesson details');
      setLoading(false);
    }
  };

  const handleStartLesson = () => {
    navigate(`/quiz/${id}`);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading lesson details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">{error}</div>
        <button onClick={() => navigate('/lessons')}>Back to Lessons</button>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="container">
        <div className="error">Lesson not found</div>
        <button onClick={() => navigate('/lessons')}>Back to Lessons</button>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="lesson-detail-page">
        <button onClick={() => navigate('/lessons')} className="back-button">
          ← Back to Lessons
        </button>

        <div className="lesson-header">
          <h1>{lesson.title}</h1>
          <div className="lesson-meta">
            <span className="lesson-difficulty">Difficulty: {lesson.difficulty || 'Medium'}</span>
            <span className="lesson-duration">Duration: {lesson.duration || '30'} min</span>
            <span className="lesson-xp">XP: {lesson.xp_reward || '100'}</span>
          </div>
        </div>

        <div className="lesson-content">
          <h2>Description</h2>
          <p>{lesson.description || 'No description available.'}</p>

          {lesson.objectives && (
            <div className="lesson-objectives">
              <h3>Learning Objectives</h3>
              <ul>
                {lesson.objectives.split(',').map((obj, index) => (
                  <li key={index}>{obj.trim()}</li>
                ))}
              </ul>
            </div>
          )}

          {lesson.content && (
            <div className="lesson-materials">
              <h3>Lesson Content</h3>
              <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
            </div>
          )}

          <div className="lesson-actions">
            <button onClick={handleStartLesson} className="primary-button">
              Start Lesson
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LessonDetailPage;
