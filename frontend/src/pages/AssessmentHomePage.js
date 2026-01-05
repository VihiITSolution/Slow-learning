import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AssessmentHome.css';

const AssessmentHomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="assessment-home-page">
      <div className="welcome-container">
        <div className="welcome-header">
          <div className="auth-buttons">
            <button onClick={() => navigate('/login')} className="auth-btn login-btn">
              🔐 Login to Main App
            </button>
            <button onClick={() => navigate('/register')} className="auth-btn register-btn">
              ✨ Sign Up
            </button>
          </div>
          <h1 className="animated-title">🌟 Welcome to Learning Helper! 🌟</h1>
          <p className="subtitle">A tool to help every student learn in their own special way</p>
        </div>
        
        <div className="role-selection">
          <h2>Who are you today?</h2>
          <div className="choices">
            <div 
              className="choice-card teacher-card"
              onClick={() => navigate('/learning-assessment')}
            >
              <div className="icon">👨‍🏫</div>
              <h3>I am a Teacher</h3>
              <p>Identify student learning needs and get personalized recommendations</p>
              <div className="button">Enter Teacher Mode</div>
            </div>
            
            <div 
              className="choice-card child-card"
              onClick={() => navigate('/interactive-games')}
            >
              <div className="icon">👧👦</div>
              <h3>I am a Student</h3>
              <p>Play fun games and activities to help you learn better!</p>
              <div className="button">Let's Play!</div>
            </div>
          </div>
        </div>
        
        <div className="info-section">
          <h3>About This Tool</h3>
          <div className="info-grid">
            <div className="info-card">
              <div className="info-icon">🎯</div>
              <h4>For Teachers</h4>
              <p>Quickly identify each student's learning style through simple observation</p>
            </div>
            <div className="info-card">
              <div className="info-icon">💡</div>
              <h4>Get Recommendations</h4>
              <p>Receive targeted activities and strategies for each learner type</p>
            </div>
            <div className="info-card">
              <div className="info-icon">🎮</div>
              <h4>For Students</h4>
              <p>Interactive games designed to make learning fun and engaging</p>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="assessment-footer">
        <p>💚 Built with care to help every child succeed 💚</p>
      </footer>
    </div>
  );
};

export default AssessmentHomePage;
