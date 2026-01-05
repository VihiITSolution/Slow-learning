import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import '../styles/LearningAssessment.css';

const LearningAssessmentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const studentInfo = location.state;
  
  const [categories, setCategories] = useState({});
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Redirect if no student selected
    if (!studentInfo || (!studentInfo.studentId && !studentInfo.studentName)) {
      toast.error('Please select a student first');
      navigate('/student-selection');
      return;
    }
    fetchCategories();
  }, [studentInfo, navigate]);

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
      // Submit assessment
      const response = await api.post('/assessment/submit-assessment', { answers });
      
      // Save results to user profile if student has an account
      if (studentInfo.studentId) {
        try {
          await api.post('/assessment/save-to-profile', {
            user_id: studentInfo.studentId,
            learning_style: response.data.identified_category,
            assessment_score: response.data.max_score,
            total_questions: response.data.total_questions,
            all_scores: response.data.scores
          });
          toast.success(`Assessment saved to ${studentInfo.studentName}'s profile!`);
        } catch (error) {
          console.error('Error saving to profile:', error);
          toast.warning('Assessment completed but not saved to profile');
        }
      } else {
        toast.success(`Assessment completed for ${studentInfo.studentName}!`);
      }
      
      setResults({
        ...response.data,
        studentName: studentInfo.studentName,
        studentId: studentInfo.studentId
      });
    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast.error('Failed to submit assessment. Please try again.');
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
        <button onClick={() => navigate('/student-selection')} className="back-to-home-btn">
          ← Assess Another Student
        </button>
        <div className="results-header">
          <h1>🎯 Assessment Results for {results.studentName}</h1>
          <button onClick={handleReset} className="btn-secondary">New Assessment</button>
        </div>

        <div className="primary-result">
          <h2>Primary Learning Style Identified:</h2>
          <h3>{results.identified_category}</h3>
          <p className="result-description">{results.description}</p>
          <div className="score-badge">
            Score: {results.max_score} / {results.total_questions}
          </div>
          {results.studentId && (
            <div className="saved-notice">
              ✅ Results saved to student profile
            </div>
          )}
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
      <button onClick={() => navigate('/student-selection')} className="back-to-home-btn">
        ← Back to Student Selection
      </button>
      <div className="assessment-header">
        <h1>🎓 Student Learning Style Assessment</h1>
        <div className="student-badge">
          Assessing: <strong>{studentInfo?.studentName}</strong>
        </div>
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
