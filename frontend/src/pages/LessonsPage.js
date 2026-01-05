import React from 'react';
import { Link } from 'react-router-dom';

const LessonsPage = () => {
  return (
    <div className="lessons-page">
      <div className="page-header">
        <h1 className="page-title">📚 My Lessons 🎓</h1>
        <p style={{fontSize: '18px', fontWeight: '600', color: '#666', textAlign: 'center'}}>
          Choose a lesson and start learning! ✨
        </p>
      </div>

      <div style={{padding: '20px', maxWidth: '1200px', margin: '0 auto'}}>
        {/* Course Progress */}
        <div className="stat-card" style={{marginBottom: '30px'}}>
          <h3 style={{fontSize: '24px', fontWeight: '900', marginBottom: '15px', color: '#1f2937'}}>
            🎯 Introduction to Algebra
          </h3>
          <div style={{fontSize: '18px', fontWeight: '700', color: '#8b5cf6', marginBottom: '12px'}}>
            75% Complete! 🚀
          </div>
          <div style={{background: 'linear-gradient(to right, #ddd6fe, #fef3c7)', height: '20px', borderRadius: '15px', overflow: 'hidden', border: '4px solid #8b5cf6'}}>
            <div style={{background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', height: '100%', width: '75%', borderRadius: '10px', boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)', transition: 'width 0.5s ease'}}></div>
          </div>
        </div>

        {/* Lessons Grid */}
        <h2 className="page-title" style={{fontSize: '32px', marginBottom: '25px'}}>🌟 All Lessons 🌟</h2>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px'}}>
          
          {/* Lesson 1 */}
          <div className="lesson-card">
            <div style={{fontSize: '70px', marginBottom: '20px'}}>🔢</div>
            <h3 style={{fontSize: '26px', fontWeight: '900', color: '#1f2937', marginBottom: '12px'}}>
              Lesson 1: Numbers
            </h3>
            <div style={{fontSize: '16px', fontWeight: '700', color: '#10b981', marginBottom: '10px', padding: '8px 16px', background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', borderRadius: '15px', display: 'inline-block', border: '3px solid #10b981'}}>
              ✓ COMPLETED
            </div>
            <p style={{fontSize: '16px', fontWeight: '600', color: '#6b7280', margin: '15px 0'}}>
              Learn about different types of numbers! 📊
            </p>
            <button className="btn-secondary" style={{marginTop: '15px'}}>
              📖 REVIEW LESSON
            </button>
          </div>

          {/* Lesson 2 */}
          <div className="lesson-card" style={{border: '5px solid #ec4899'}}>
            <div style={{fontSize: '70px', marginBottom: '20px'}}>➕</div>
            <h3 style={{fontSize: '26px', fontWeight: '900', color: '#1f2937', marginBottom: '12px'}}>
              Lesson 2: Addition
            </h3>
            <div style={{fontSize: '16px', fontWeight: '700', color: '#10b981', marginBottom: '10px', padding: '8px 16px', background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', borderRadius: '15px', display: 'inline-block', border: '3px solid #10b981'}}>
              ✓ COMPLETED
            </div>
            <p style={{fontSize: '16px', fontWeight: '600', color: '#6b7280', margin: '15px 0'}}>
              Master addition with fun examples! ➕
            </p>
            <button className="btn-secondary" style={{marginTop: '15px'}}>
              📖 REVIEW LESSON
            </button>
          </div>

          {/* Lesson 3 - Current */}
          <div className="lesson-card" style={{border: '5px solid #8b5cf6', background: 'linear-gradient(135deg, #fef3c7, #ddd6fe)', boxShadow: '0 15px 40px rgba(139, 92, 246, 0.5)'}}>
            <div style={{fontSize: '70px', marginBottom: '20px'}}>🎯</div>
            <h3 style={{fontSize: '26px', fontWeight: '900', color: '#1f2937', marginBottom: '12px'}}>
              Lesson 3: Variables
            </h3>
            <div style={{fontSize: '16px', fontWeight: '700', color: '#8b5cf6', marginBottom: '10px', padding: '8px 16px', background: 'white', borderRadius: '15px', display: 'inline-block', border: '3px solid #8b5cf6', animation: 'pulse 2s infinite'}}>
              🔥 IN PROGRESS
            </div>
            <p style={{fontSize: '16px', fontWeight: '600', color: '#6b7280', margin: '15px 0'}}>
              Understanding variables in equations! 📐
            </p>
            <Link to="/app/lessons/3">
              <button className="btn-primary" style={{marginTop: '15px'}}>
                🚀 CONTINUE LEARNING
              </button>
            </Link>
          </div>

          {/* Lesson 4 */}
          <div className="lesson-card">
            <div style={{fontSize: '70px', marginBottom: '20px', opacity: 0.6}}>🔍</div>
            <h3 style={{fontSize: '26px', fontWeight: '900', color: '#1f2937', marginBottom: '12px'}}>
              Lesson 4: Simple Equations
            </h3>
            <div style={{fontSize: '16px', fontWeight: '700', color: '#9ca3af', marginBottom: '10px', padding: '8px 16px', background: '#f3f4f6', borderRadius: '15px', display: 'inline-block', border: '3px dashed #9ca3af'}}>
              🔒 LOCKED
            </div>
            <p style={{fontSize: '16px', fontWeight: '600', color: '#6b7280', margin: '15px 0'}}>
              Solve basic equations step by step! 🧮
            </p>
            <button className="btn-secondary" style={{marginTop: '15px', opacity: 0.6}} disabled>
              🔒 COMPLETE LESSON 3 FIRST
            </button>
          </div>

          {/* Lesson 5 */}
          <div className="lesson-card">
            <div style={{fontSize: '70px', marginBottom: '20px', opacity: 0.6}}>⚖️</div>
            <h3 style={{fontSize: '26px', fontWeight: '900', color: '#1f2937', marginBottom: '12px'}}>
              Lesson 5: Balancing
            </h3>
            <div style={{fontSize: '16px', fontWeight: '700', color: '#9ca3af', marginBottom: '10px', padding: '8px 16px', background: '#f3f4f6', borderRadius: '15px', display: 'inline-block', border: '3px dashed #9ca3af'}}>
              🔒 LOCKED
            </div>
            <p style={{fontSize: '16px', fontWeight: '600', color: '#6b7280', margin: '15px 0'}}>
              Balance equations like a pro! ⚖️
            </p>
            <button className="btn-secondary" style={{marginTop: '15px', opacity: 0.6}} disabled>
              🔒 COMPLETE LESSON 4 FIRST
            </button>
          </div>

          {/* Lesson 6 */}
          <div className="lesson-card">
            <div style={{fontSize: '70px', marginBottom: '20px', opacity: 0.6}}>🎓</div>
            <h3 style={{fontSize: '26px', fontWeight: '900', color: '#1f2937', marginBottom: '12px'}}>
              Lesson 6: Practice Test
            </h3>
            <div style={{fontSize: '16px', fontWeight: '700', color: '#9ca3af', marginBottom: '10px', padding: '8px 16px', background: '#f3f4f6', borderRadius: '15px', display: 'inline-block', border: '3px dashed #9ca3af'}}>
              🔒 LOCKED
            </div>
            <p style={{fontSize: '16px', fontWeight: '600', color: '#6b7280', margin: '15px 0'}}>
              Test all your algebra skills! 📝
            </p>
            <button className="btn-secondary" style={{marginTop: '15px', opacity: 0.6}} disabled>
              🔒 COMPLETE LESSON 5 FIRST
            </button>
          </div>

        </div>

        {/* Quick Actions */}
        <div style={{marginTop: '40px', display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center'}}>
          <Link to="/app/dashboard">
            <button className="btn-secondary">
              🏠 BACK TO DASHBOARD
            </button>
          </Link>
          <Link to="/app/lessons/1/quiz">
            <button className="btn-primary">
              🎯 TAKE A QUIZ
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LessonsPage;
