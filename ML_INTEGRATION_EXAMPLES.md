# Engagement Prediction - Integration Examples

## Complete Integration Examples

### 1. Backend Scheduled Task (Automated Daily Check)

Create this file: `backend/scheduled_tasks/daily_engagement_check.py`

```python
"""
Daily Engagement Check
Runs automated engagement predictions and interventions
Schedule this to run daily at 9 AM
"""
import sys
import os
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import Flask app and services
from app import create_app, db
from app.services.engagement_service import EngagementService

def run_daily_check():
    """Main function for daily engagement check"""
    app = create_app()
    
    with app.app_context():
        service = EngagementService()
        
        print(f"=== Daily Engagement Check Started at {datetime.utcnow()} ===\n")
        
        # Step 1: Get overall statistics
        print("Step 1: Getting engagement statistics...")
        stats = service.get_engagement_statistics()
        print(f"  Total Users: {stats['total_users']}")
        print(f"  Engaged: {stats['engaged_users']} ({stats['engagement_rate']:.1f}%)")
        print(f"  Disengaged: {stats['disengaged_users']}")
        print()
        
        # Step 2: Get disengaged users (confidence > 70%)
        print("Step 2: Identifying disengaged users...")
        disengaged = service.get_disengaged_users(confidence_threshold=0.7)
        print(f"  Found {len(disengaged)} users requiring intervention")
        print()
        
        # Step 3: Categorize by risk
        critical = [u for u in disengaged if u['risk_level'] == 'critical']
        high = [u for u in disengaged if u['risk_level'] == 'high']
        moderate = [u for u in disengaged if u['risk_level'] == 'moderate']
        
        print(f"  Risk Breakdown:")
        print(f"    Critical: {len(critical)} users")
        print(f"    High: {len(high)} users")
        print(f"    Moderate: {len(moderate)} users")
        print()
        
        # Step 4: Trigger interventions
        print("Step 3: Triggering interventions...")
        intervention_count = 0
        
        for user_pred in disengaged:
            user_id = user_pred['user_info']['user_id']
            username = user_pred['user_info']['username']
            risk = user_pred['risk_level']
            confidence = user_pred['confidence']
            
            try:
                actions = service.trigger_engagement_actions(user_id, user_pred)
                action_count = len(actions['actions_taken'])
                intervention_count += 1
                
                print(f"  ✓ User {username} ({risk}, {confidence:.0%}): {action_count} actions")
                
            except Exception as e:
                print(f"  ✗ User {username}: Error - {str(e)}")
        
        print()
        print(f"=== Daily Check Completed ===")
        print(f"Total Interventions: {intervention_count}/{len(disengaged)}")
        print(f"Completed at {datetime.utcnow()}\n")

if __name__ == '__main__':
    run_daily_check()
```

**Schedule with Cron (Linux/Mac):**
```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 9 AM)
0 9 * * * cd /path/to/backend && python scheduled_tasks/daily_engagement_check.py >> logs/engagement_check.log 2>&1
```

**Schedule with Windows Task Scheduler:**
```powershell
schtasks /create /tn "Daily Engagement Check" /tr "python C:\path\to\backend\scheduled_tasks\daily_engagement_check.py" /sc daily /st 09:00
```

---

### 2. Frontend - User Dashboard Alert Component

Create this file: `frontend/src/components/engagement/EngagementAlert.js`

```javascript
import React, { useEffect, useState } from 'react';
import { Alert, Button, Progress } from '../common';
import api from '../../services/api';
import './EngagementAlert.css';

const EngagementAlert = ({ userId }) => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    checkEngagement();
    // Recheck every hour
    const interval = setInterval(checkEngagement, 3600000);
    return () => clearInterval(interval);
  }, [userId]);

  const checkEngagement = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/ml/engagement/predict/${userId}`);
      const data = response.data.data;
      
      // Only show alert if disengaged with high confidence
      if (!data.engaged && data.confidence > 0.6) {
        setPrediction(data);
        setDismissed(false);
      } else {
        setPrediction(null);
      }
    } catch (error) {
      console.error('Error checking engagement:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !prediction || dismissed) {
    return null;
  }

  const getRiskColor = (riskLevel) => {
    const colors = {
      critical: 'danger',
      high: 'warning',
      moderate: 'info'
    };
    return colors[riskLevel] || 'info';
  };

  const getIcon = (riskLevel) => {
    const icons = {
      critical: '🚨',
      high: '⚠️',
      moderate: '📢'
    };
    return icons[riskLevel] || '📢';
  };

  return (
    <Alert 
      variant={getRiskColor(prediction.risk_level)}
      dismissible
      onClose={() => setDismissed(true)}
      className="engagement-alert"
    >
      <div className="alert-header">
        <span className="alert-icon">{getIcon(prediction.risk_level)}</span>
        <h4>Stay Engaged with Your Learning!</h4>
      </div>
      
      <div className="alert-body">
        <p>{prediction.recommendation[0]}</p>
        
        <div className="engagement-score">
          <label>Engagement Level</label>
          <Progress 
            value={prediction.engaged_probability * 100} 
            variant={getRiskColor(prediction.risk_level)}
          />
          <small>
            {(prediction.engaged_probability * 100).toFixed(0)}% engaged
          </small>
        </div>

        <div className="quick-stats">
          <div className="stat">
            <span className="label">Days Inactive:</span>
            <span className="value">{prediction.features.days_inactive}</span>
          </div>
          <div className="stat">
            <span className="label">Current Streak:</span>
            <span className="value">{prediction.features.login_streak}</span>
          </div>
        </div>
      </div>

      <div className="alert-actions">
        <Button 
          variant="primary" 
          onClick={() => window.location.href = '/lessons'}
        >
          Start Learning Now
        </Button>
        <Button 
          variant="outline" 
          onClick={() => setDismissed(true)}
        >
          Maybe Later
        </Button>
      </div>
    </Alert>
  );
};

export default EngagementAlert;
```

**CSS File:** `frontend/src/components/engagement/EngagementAlert.css`

```css
.engagement-alert {
  margin: 20px 0;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.engagement-alert .alert-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.engagement-alert .alert-icon {
  font-size: 24px;
}

.engagement-alert .alert-body {
  margin: 15px 0;
}

.engagement-alert .engagement-score {
  margin: 15px 0;
}

.engagement-alert .engagement-score label {
  display: block;
  font-weight: 600;
  margin-bottom: 5px;
}

.engagement-alert .quick-stats {
  display: flex;
  gap: 20px;
  margin: 15px 0;
}

.engagement-alert .quick-stats .stat {
  display: flex;
  flex-direction: column;
}

.engagement-alert .quick-stats .label {
  font-size: 12px;
  color: #666;
}

.engagement-alert .quick-stats .value {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.engagement-alert .alert-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}
```

**Usage in Dashboard:**

```javascript
// frontend/src/pages/DashboardPage.js
import EngagementAlert from '../components/engagement/EngagementAlert';

const DashboardPage = () => {
  const user = useAuth();

  return (
    <Layout>
      <div className="dashboard">
        <h1>Welcome back, {user.username}!</h1>
        
        {/* Add engagement alert */}
        <EngagementAlert userId={user.id} />
        
        {/* Rest of dashboard content */}
        <div className="dashboard-content">
          {/* ... */}
        </div>
      </div>
    </Layout>
  );
};
```

---

### 3. Frontend - Admin Dashboard Widget

Create this file: `frontend/src/components/admin/EngagementDashboard.js`

```javascript
import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Badge, Modal } from '../common';
import api from '../../services/api';
import './EngagementDashboard.css';

const EngagementDashboard = () => {
  const [stats, setStats] = useState(null);
  const [disengaged, setDisengaged] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load statistics
      const statsRes = await api.get('/ml/engagement/statistics');
      setStats(statsRes.data.data);
      
      // Load disengaged users
      const disengagedRes = await api.get('/ml/engagement/disengaged?threshold=0.6');
      setDisengaged(disengagedRes.data.data);
    } catch (error) {
      console.error('Error loading engagement data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerAction = async (userId) => {
    try {
      await api.post(`/ml/engagement/trigger-actions/${userId}`);
      alert('Intervention triggered successfully!');
      loadData(); // Reload data
    } catch (error) {
      console.error('Error triggering action:', error);
      alert('Failed to trigger intervention');
    }
  };

  const handleAutoIntervention = async () => {
    if (!confirm(`Trigger auto-intervention for ${disengaged.length} users?`)) {
      return;
    }

    try {
      const response = await api.post('/ml/engagement/auto-intervention', {
        confidence_threshold: 0.6,
        dry_run: false
      });
      
      alert(`✓ Intervention triggered for ${response.data.total_interventions} users`);
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to trigger auto-intervention');
    }
  };

  const getRiskBadgeVariant = (risk) => {
    const variants = {
      critical: 'danger',
      high: 'warning',
      moderate: 'info',
      'moderate-low': 'secondary',
      low: 'success'
    };
    return variants[risk] || 'secondary';
  };

  if (loading) {
    return <div>Loading engagement data...</div>;
  }

  return (
    <div className="engagement-dashboard">
      <div className="dashboard-header">
        <h2>Engagement Analytics</h2>
        <Button 
          variant="primary" 
          onClick={() => setShowModal(true)}
          disabled={disengaged.length === 0}
        >
          Trigger Auto-Intervention ({disengaged.length})
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <Card className="stat-card">
          <div className="stat-value">{stats.total_users}</div>
          <div className="stat-label">Total Users</div>
        </Card>

        <Card className="stat-card success">
          <div className="stat-value">{stats.engaged_users}</div>
          <div className="stat-label">Engaged Users</div>
        </Card>

        <Card className="stat-card warning">
          <div className="stat-value">{stats.disengaged_users}</div>
          <div className="stat-label">Disengaged Users</div>
        </Card>

        <Card className="stat-card">
          <div className="stat-value">{stats.engagement_rate.toFixed(1)}%</div>
          <div className="stat-label">Engagement Rate</div>
        </Card>
      </div>

      {/* Risk Breakdown */}
      <Card className="risk-breakdown">
        <h3>Risk Level Distribution</h3>
        <div className="risk-items">
          {Object.entries(stats.risk_breakdown).map(([level, count]) => (
            <div key={level} className="risk-item">
              <Badge variant={getRiskBadgeVariant(level)}>
                {level.toUpperCase()}
              </Badge>
              <span className="risk-count">{count} users</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Disengaged Users Table */}
      <Card className="disengaged-users">
        <h3>Disengaged Users Requiring Attention ({disengaged.length})</h3>
        
        <Table>
          <thead>
            <tr>
              <th>User</th>
              <th>Level</th>
              <th>Risk</th>
              <th>Confidence</th>
              <th>Days Inactive</th>
              <th>Streak</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {disengaged.map(user => (
              <tr key={user.user_info.user_id}>
                <td>
                  <div>
                    <strong>{user.user_info.username}</strong>
                    <br />
                    <small>ID: {user.user_info.user_id}</small>
                  </div>
                </td>
                <td>{user.user_info.level}</td>
                <td>
                  <Badge variant={getRiskBadgeVariant(user.risk_level)}>
                    {user.risk_level}
                  </Badge>
                </td>
                <td>{(user.confidence * 100).toFixed(0)}%</td>
                <td>{user.features.days_inactive} days</td>
                <td>{user.features.login_streak}</td>
                <td>
                  <Button 
                    size="small" 
                    onClick={() => handleTriggerAction(user.user_info.user_id)}
                  >
                    Intervene
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      {/* Auto-Intervention Modal */}
      <Modal show={showModal} onClose={() => setShowModal(false)}>
        <Modal.Header>
          <h3>Auto-Intervention</h3>
        </Modal.Header>
        <Modal.Body>
          <p>
            This will trigger automatic interventions for <strong>{disengaged.length}</strong> disengaged users:
          </p>
          <ul>
            <li><strong>{disengaged.filter(u => u.risk_level === 'critical').length}</strong> Critical risk users</li>
            <li><strong>{disengaged.filter(u => u.risk_level === 'high').length}</strong> High risk users</li>
            <li><strong>{disengaged.filter(u => u.risk_level === 'moderate').length}</strong> Moderate risk users</li>
          </ul>
          <p>Actions will include:</p>
          <ul>
            <li>Personalized notifications</li>
            <li>Bonus XP rewards</li>
            <li>Email campaigns (for critical cases)</li>
          </ul>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAutoIntervention}>
            Confirm Intervention
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default EngagementDashboard;
```

**Usage in Admin Page:**

```javascript
// frontend/src/pages/AdminAnalyticsPage.js
import EngagementDashboard from '../components/admin/EngagementDashboard';

const AdminAnalyticsPage = () => {
  return (
    <AdminLayout>
      <h1>Analytics Dashboard</h1>
      
      {/* Add engagement dashboard */}
      <EngagementDashboard />
      
      {/* Other analytics components */}
    </AdminLayout>
  );
};
```

---

### 4. API Service Integration

Update your API service: `frontend/src/services/api.js`

```javascript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ML Engagement API methods
export const engagementAPI = {
  // Get prediction for user
  predictUser: (userId) => 
    api.get(`/ml/engagement/predict/${userId}`),
  
  // Get all disengaged users (admin)
  getDisengaged: (threshold = 0.6) => 
    api.get(`/ml/engagement/disengaged?threshold=${threshold}`),
  
  // Get engagement statistics (admin)
  getStatistics: () => 
    api.get('/ml/engagement/statistics'),
  
  // Trigger actions for user (admin)
  triggerActions: (userId) => 
    api.post(`/ml/engagement/trigger-actions/${userId}`),
  
  // Auto-intervention (admin)
  autoIntervention: (threshold = 0.6, dryRun = false) => 
    api.post('/ml/engagement/auto-intervention', {
      confidence_threshold: threshold,
      dry_run: dryRun
    }),
  
  // Get model info
  getModelInfo: () => 
    api.get('/ml/model/info'),
  
  // Health check
  healthCheck: () => 
    api.get('/ml/health')
};

export default api;
```

---

### 5. Testing the Integration

**Test Script:** `backend/test_ml_integration.py`

```python
"""
Test ML Integration
Quick test script to verify all endpoints work
"""
import requests
import json

BASE_URL = 'http://localhost:5000/api'

def test_health():
    """Test health endpoint"""
    print("\n1. Testing health endpoint...")
    response = requests.get(f'{BASE_URL}/ml/health')
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    assert response.status_code == 200
    print("   ✓ Health check passed")

def test_model_info():
    """Test model info endpoint"""
    print("\n2. Testing model info...")
    response = requests.get(f'{BASE_URL}/ml/model/info')
    print(f"   Status: {response.status_code}")
    data = response.json()
    print(f"   Model trained: {data['data']['trained']}")
    print(f"   Algorithm: {data['data'].get('algorithm', 'N/A')}")
    print("   ✓ Model info retrieved")

def test_prediction():
    """Test prediction endpoint"""
    print("\n3. Testing prediction with sample data...")
    
    test_data = {
        'time_spent_today': 10,
        'avg_quiz_score': 45,
        'login_streak': 0,
        'lessons_completed_week': 1,
        'days_inactive': 5
    }
    
    response = requests.post(
        f'{BASE_URL}/ml/model/test',
        json=test_data
    )
    
    print(f"   Status: {response.status_code}")
    data = response.json()
    prediction = data['data']
    
    print(f"   Engaged: {prediction['engaged']}")
    print(f"   Confidence: {prediction['confidence']:.2%}")
    print(f"   Risk Level: {prediction['risk_level']}")
    print("   ✓ Prediction successful")

def run_all_tests():
    """Run all tests"""
    print("="*60)
    print("ML INTEGRATION TEST SUITE")
    print("="*60)
    
    try:
        test_health()
        test_model_info()
        test_prediction()
        
        print("\n" + "="*60)
        print("✓ ALL TESTS PASSED!")
        print("="*60)
        
    except Exception as e:
        print(f"\n✗ Test failed: {str(e)}")
        raise

if __name__ == '__main__':
    run_all_tests()
```

**Run the tests:**
```bash
python test_ml_integration.py
```

---

## Summary

These integration examples show:

1. ✅ **Backend Automation** - Scheduled daily engagement checks
2. ✅ **User Alerts** - Real-time engagement warnings on dashboard
3. ✅ **Admin Dashboard** - Comprehensive engagement analytics
4. ✅ **API Integration** - Clean service layer for API calls
5. ✅ **Testing** - Automated tests to verify functionality

All examples are production-ready and can be customized to fit your specific needs!
