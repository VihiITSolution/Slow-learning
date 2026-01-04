import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/App.css';

function MLInsightsPage() {
  const navigate = useNavigate();
  const [modelInfo, setModelInfo] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [disengagedUsers, setDisengagedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  
  // Test data form
  const [testData, setTestData] = useState({
    time_spent_today: 30,
    avg_quiz_score: 70,
    login_streak: 3,
    lessons_completed_week: 2,
    days_inactive: 0
  });

  useEffect(() => {
    fetchModelInfo();
    fetchDisengagedUsers();
  }, []);

  const fetchModelInfo = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/ml/model/info');
      setModelInfo(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch model info:', error);
      setLoading(false);
    }
  };

  const fetchDisengagedUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await axios.get('http://localhost:5000/api/ml/engagement/disengaged', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDisengagedUsers(response.data.data.disengaged_users || []);
    } catch (error) {
      console.error('Failed to fetch disengaged users:', error);
    }
  };

  const handleTestPrediction = async () => {
    setPredicting(true);
    try {
      const response = await axios.post('http://localhost:5000/api/ml/model/test', testData);
      setPrediction(response.data.data);
    } catch (error) {
      console.error('Prediction failed:', error);
      alert('Prediction failed. Please check the values and try again.');
    } finally {
      setPredicting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setTestData(prev => ({ ...prev, [field]: parseFloat(value) }));
  };

  const loadPreset = (type) => {
    if (type === 'engaged') {
      setTestData({
        time_spent_today: 60,
        avg_quiz_score: 85,
        login_streak: 10,
        lessons_completed_week: 5,
        days_inactive: 0
      });
    } else {
      setTestData({
        time_spent_today: 10,
        avg_quiz_score: 45,
        login_streak: 0,
        lessons_completed_week: 1,
        days_inactive: 5
      });
    }
    setPrediction(null);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading ML Model Information...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="ml-insights-page">
        <div className="page-header">
          <h1>🤖 Machine Learning Insights</h1>
          <p>Engagement Prediction Model Analytics</p>
        </div>

        {/* Model Performance Metrics */}
        {modelInfo && (
          <div className="metrics-section">
            <h2>📊 Model Performance</h2>
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-icon">✓</div>
                <div className="metric-value">
                  {(modelInfo.metrics[modelInfo.algorithm]?.accuracy * 100).toFixed(1)}%
                </div>
                <div className="metric-label">Accuracy</div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">🎯</div>
                <div className="metric-value">
                  {(modelInfo.metrics[modelInfo.algorithm]?.precision * 100).toFixed(1)}%
                </div>
                <div className="metric-label">Precision</div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">📈</div>
                <div className="metric-value">
                  {(modelInfo.metrics[modelInfo.algorithm]?.recall * 100).toFixed(1)}%
                </div>
                <div className="metric-label">Recall</div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">⚡</div>
                <div className="metric-value">
                  {(modelInfo.metrics[modelInfo.algorithm]?.f1_score * 100).toFixed(1)}%
                </div>
                <div className="metric-label">F1 Score</div>
              </div>
            </div>
            <div className="model-details">
              <p><strong>Algorithm:</strong> {modelInfo.algorithm.toUpperCase()}</p>
              <p><strong>Features:</strong> {modelInfo.feature_names.join(', ')}</p>
            </div>
          </div>
        )}

        {/* Live Prediction Testing */}
        <div className="prediction-section">
          <h2>🔮 Test Prediction</h2>
          <div className="preset-buttons">
            <button onClick={() => loadPreset('engaged')} className="preset-btn engaged">
              Load Engaged User
            </button>
            <button onClick={() => loadPreset('disengaged')} className="preset-btn disengaged">
              Load Disengaged User
            </button>
          </div>
          
          <div className="input-grid">
            <div className="input-group">
              <label>Time Spent Today (minutes)</label>
              <input
                type="number"
                value={testData.time_spent_today}
                onChange={(e) => handleInputChange('time_spent_today', e.target.value)}
                min="0"
                max="180"
              />
            </div>
            <div className="input-group">
              <label>Average Quiz Score (%)</label>
              <input
                type="number"
                value={testData.avg_quiz_score}
                onChange={(e) => handleInputChange('avg_quiz_score', e.target.value)}
                min="0"
                max="100"
              />
            </div>
            <div className="input-group">
              <label>Login Streak (days)</label>
              <input
                type="number"
                value={testData.login_streak}
                onChange={(e) => handleInputChange('login_streak', e.target.value)}
                min="0"
                max="365"
              />
            </div>
            <div className="input-group">
              <label>Lessons Completed (this week)</label>
              <input
                type="number"
                value={testData.lessons_completed_week}
                onChange={(e) => handleInputChange('lessons_completed_week', e.target.value)}
                min="0"
                max="50"
              />
            </div>
            <div className="input-group">
              <label>Days Inactive</label>
              <input
                type="number"
                value={testData.days_inactive}
                onChange={(e) => handleInputChange('days_inactive', e.target.value)}
                min="0"
                max="365"
              />
            </div>
          </div>

          <button 
            onClick={handleTestPrediction} 
            disabled={predicting}
            className="predict-button"
          >
            {predicting ? 'Predicting...' : '🚀 Run Prediction'}
          </button>

          {prediction && (
            <div className={`prediction-result ${prediction.engaged ? 'engaged' : 'disengaged'}`}>
              <h3>Prediction Result</h3>
              <div className="result-main">
                <div className="result-status">
                  {prediction.engaged ? '✅ Engaged' : '⚠️ Disengaged'}
                </div>
                <div className="result-confidence">
                  Confidence: {(prediction.confidence * 100).toFixed(2)}%
                </div>
                <div className="result-risk">
                  Risk Level: <span className={`risk-${prediction.risk_level}`}>
                    {prediction.risk_level.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div className="recommendations">
                <h4>💡 Recommendations:</h4>
                <ul>
                  {prediction.recommendation.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>

              {prediction.probabilities && (
                <div className="probabilities">
                  <div className="prob-bar">
                    <div className="prob-label">Engaged Probability:</div>
                    <div className="prob-value">{(prediction.probabilities[1] * 100).toFixed(1)}%</div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill engaged" 
                        style={{ width: `${prediction.probabilities[1] * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="prob-bar">
                    <div className="prob-label">Disengaged Probability:</div>
                    <div className="prob-value">{(prediction.probabilities[0] * 100).toFixed(1)}%</div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill disengaged" 
                        style={{ width: `${prediction.probabilities[0] * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* At-Risk Users */}
        {disengagedUsers.length > 0 && (
          <div className="at-risk-section">
            <h2>⚠️ At-Risk Users</h2>
            <div className="users-list">
              {disengagedUsers.slice(0, 10).map((user, idx) => (
                <div key={idx} className="user-card">
                  <div className="user-header">
                    <strong>{user.user_info?.username || 'User'}</strong>
                    <span className={`badge risk-${user.prediction?.risk_level}`}>
                      {user.prediction?.risk_level}
                    </span>
                  </div>
                  <div className="user-stats">
                    <span>Confidence: {(user.prediction?.confidence * 100).toFixed(1)}%</span>
                    <span>Time: {user.features?.time_spent_today}min</span>
                    <span>Score: {user.features?.avg_quiz_score}%</span>
                    <span>Streak: {user.features?.login_streak} days</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="actions">
          <button onClick={() => navigate('/dashboard')} className="secondary-button">
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default MLInsightsPage;
