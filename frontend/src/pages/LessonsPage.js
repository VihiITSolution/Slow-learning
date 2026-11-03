import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const LessonsPage = () => {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    try {
      const response = await api.get('/lessons');
      setLessons(response.data.lessons || response.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch lessons:', err);
      setError('Failed to load lessons');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="lessons-page">
        <div className="loading">Loading lessons...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lessons-page">
        <div className="error">{error}</div>
      </div>
    );
  }
  // Each lesson ends with its own quiz, so the next step is the first
  // lesson the student has not finished yet
  const nextLesson = lessons.find(l => l.status === 'in_progress') || lessons.find(l => l.status !== 'completed');

  return (
    <div className="lessons-page">
      <div className="page-header">
        <h1 className="page-title">📚 My Lessons 🎓</h1>
        <p style={{fontSize: '18px', fontWeight: '600', color: '#666', textAlign: 'center'}}>
          Choose a lesson and start learning! ✨
        </p>
      </div>

      <div style={{padding: '20px', maxWidth: '1200px', margin: '0 auto'}}>
        {/* Lessons Grid */}
        <h2 className="page-title" style={{fontSize: '32px', marginBottom: '25px'}}>🌟 All Lessons 🌟</h2>
        
        {loading ? (
          <div className="lesson-card" style={{textAlign: 'center'}}>
            <div style={{fontSize: '48px', marginBottom: '20px'}}>⏳</div>
            <p style={{fontSize: '18px', fontWeight: '600', color: '#666'}}>Loading lessons...</p>
          </div>
        ) : error ? (
          <div className="lesson-card" style={{borderColor: '#ef4444'}}>
            <div style={{fontSize: '48px', marginBottom: '20px'}}>⚠️</div>
            <p style={{fontSize: '18px', fontWeight: '600', color: '#ef4444'}}>{error}</p>
          </div>
        ) : lessons.length > 0 ? (
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px'}}>
            {lessons.map((lesson) => (
              <div 
                key={lesson.id} 
                className="lesson-card"
                style={lesson.status === 'in_progress' ? {border: '5px solid #8b5cf6', background: 'linear-gradient(135deg, #fef3c7, #ddd6fe)', boxShadow: '0 15px 40px rgba(139, 92, 246, 0.5)'} : {}}
              >
                <div style={{fontSize: '70px', marginBottom: '20px', opacity: lesson.is_active ? 1 : 0.6}}>
                  {lesson.category === 'math' ? '🔢' : lesson.category === 'reading' ? '📖' : '📚'}
                </div>
                <h3 style={{fontSize: '26px', fontWeight: '900', color: '#1f2937', marginBottom: '12px'}}>
                  {lesson.title}
                </h3>
                {lesson.status === 'completed' && (
                  <div style={{fontSize: '16px', fontWeight: '700', color: '#10b981', marginBottom: '10px', padding: '8px 16px', background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', borderRadius: '15px', display: 'inline-block', border: '3px solid #10b981'}}>
                    ✓ COMPLETED
                  </div>
                )}
                {lesson.status === 'in_progress' && (
                  <div style={{fontSize: '16px', fontWeight: '700', color: '#8b5cf6', marginBottom: '10px', padding: '8px 16px', background: 'white', borderRadius: '15px', display: 'inline-block', border: '3px solid #8b5cf6'}}>
                    🔥 IN PROGRESS
                  </div>
                )}
                {!lesson.status && lesson.is_active && (
                  <div style={{fontSize: '16px', fontWeight: '700', color: '#3b82f6', marginBottom: '10px', padding: '8px 16px', background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)', borderRadius: '15px', display: 'inline-block', border: '3px solid #3b82f6'}}>
                    📚 NEW
                  </div>
                )}
                {!lesson.is_active && (
                  <div style={{fontSize: '16px', fontWeight: '700', color: '#9ca3af', marginBottom: '10px', padding: '8px 16px', background: '#f3f4f6', borderRadius: '15px', display: 'inline-block', border: '3px dashed #9ca3af'}}>
                    🔒 LOCKED
                  </div>
                )}
                <p style={{fontSize: '16px', fontWeight: '600', color: '#6b7280', margin: '15px 0'}}>
                  {lesson.description || 'Learn something new!'}
                </p>
                {lesson.is_active ? (
                  <Link to={`/app/lessons/${lesson.id}`}>
                    <button className={lesson.status === 'completed' ? 'btn-secondary' : 'btn-primary'} style={{marginTop: '15px'}}>
                      {lesson.status === 'completed' ? '📖 REVIEW LESSON' : lesson.status === 'in_progress' ? '🚀 CONTINUE LEARNING' : '🎯 START LESSON'}
                    </button>
                  </Link>
                ) : (
                  <button className="btn-secondary" style={{marginTop: '15px', opacity: 0.6}} disabled>
                    🔒 COMPLETE PREVIOUS LESSONS FIRST
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="lesson-card">
            <p style={{fontSize: '18px', textAlign: 'center', color: '#666'}}>
              No lessons available yet. Check back soon! 📚
            </p>
          </div>
        )}

        {/* Quick Actions */}
        <div style={{marginTop: '40px', display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center'}}>
          <Link to="/app/dashboard">
            <button className="btn-secondary">
              🏠 BACK TO DASHBOARD
            </button>
          </Link>
          {nextLesson ? (
            <Link to={`/app/lessons/${nextLesson.id}`}>
              <button className="btn-primary">
                {nextLesson.status === 'in_progress' ? '🚀 CONTINUE' : '▶ NEXT LESSON'}: {nextLesson.title}
              </button>
            </Link>
          ) : lessons.length > 0 ? (
            <button className="btn-primary" disabled>🎉 ALL LESSONS COMPLETED</button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default LessonsPage;
