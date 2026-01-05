import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/LearningAssessment.css';

const LearningAssessmentPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState({});
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/assessment/categories');
      setCategories(response.data.categories);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setLoading(false);
    }
  };

  const handleAnswerChange = (category, questionIndex, value) => {
    setAnswers({
      ...answers,
      [`${category}_${questionIndex}`]: value ? 'yes' : 'no'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await api.post('/assessment/submit-assessment', { answers });
      setResults(response.data);
    } catch (error) {
      console.error('Error submitting assessment:', error);
      alert('Failed to submit assessment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setResults(null);
  };

  if (loading) {
    return <div className="loading-container">Loading assessment...</div>;
  }

  if (results) {
    return (
      <div className="assessment-results">
        <button onClick={() => navigate('/learning-helper')} className="back-to-home-btn">
          ← Back to Home
        </button>
        <div className="results-header">
          <h1>🎯 Assessment Results</h1>
          <button onClick={handleReset} className="btn-secondary">New Assessment</button>
        </div>

        <div className="primary-result">
          <h2>Primary Learning Style Identified:</h2>
          <h3>{results.identified_category}</h3>
          <p className="result-description">{results.description}</p>
          <div className="score-badge">
            Score: {results.max_score} / {results.total_questions}
          </div>
        </div>

        <div className="recommended-activities">
          <h2>📚 Recommended Activities</h2>
          <div className="activities-grid">
            {results.activities.map((activity, index) => (
              <div key={index} className="activity-card">
                <p>{activity}</p>
              </div>
            ))}
          </div>
        </div>

        {results.all_needs && results.all_needs.length > 1 && (
          <div className="all-needs-section">
            <h2>📊 All Identified Needs</h2>
            {results.all_needs.map((need, index) => (
              <div key={index} className="need-card">
                <h4>{need.category}</h4>
                <div className="need-score">Score: {need.score}</div>
                <p className="need-description">{need.description}</p>
                <div className="need-activities">
                  <h5>Activities:</h5>
                  <ul>
                    {need.activities.slice(0, 3).map((activity, actIndex) => (
                      <li key={actIndex}>{activity}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="learning-assessment-page">
      <button onClick={() => navigate('/learning-helper')} className="back-to-home-btn">
        ← Back to Home
      </button>
      <div className="assessment-header">
        <h1>🎓 Student Learning Style Assessment</h1>
        <p className="subtitle">
          Answer the following questions based on your observations of the student
        </p>
      </div>

      <form onSubmit={handleSubmit} className="assessment-form">
        {Object.entries(categories).map(([category, data]) => (
          <div key={category} className="category-section">
            <h2>{category}</h2>
            <p className="category-description">{data.description}</p>
            
            <div className="questions-list">
              {data.questions.map((question, index) => (
                <div key={index} className="question-item">
                  <label className="question-label">
                    <input
                      type="checkbox"
                      checked={answers[`${category}_${index}`] === 'yes'}
                      onChange={(e) => handleAnswerChange(category, index, e.target.checked)}
                    />
                    <span>{question}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="form-actions">
          <button 
            type="submit" 
            className="btn-primary"
            disabled={submitting || Object.keys(answers).length === 0}
          >
            {submitting ? 'Analyzing...' : 'Submit Assessment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LearningAssessmentPage;
