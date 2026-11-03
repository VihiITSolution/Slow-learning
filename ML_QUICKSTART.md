# Engagement Prediction ML Model - Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### Step 1: Verify Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### Step 2: Train the Model
```bash
python train_engagement_model.py
```

Expected output (`python train_engagement_model.py --evaluate`, default 3,000 samples):
```
============================================================
ENGAGEMENT PREDICTION MODEL TRAINING
============================================================
Data: synthetic generator, 3000 samples, seed 42
Engaged: 1483 | Not engaged: 1517

Chosen algorithm: LOGISTIC
Model selection (5-fold cross-validation on the training split):
  logistic  0.785 ± 0.016
  svm       0.784 ± 0.016
  neural    0.776 ± 0.015

Held-out test split (600 rows, not used for training or selection):
  Accuracy:  0.783
  Precision: 0.784
  Recall:    0.783
  F1 score:  0.783
  ROC-AUC:   0.844
  Confusion matrix [[TN, FP], [FN, TP]]: [[245, 58], [72, 225]]

Fresh synthetic data (3 x 10000 unseen students):
  Accuracy:  0.783 (range 0.777-0.787)
  ROC-AUC:   0.841
  Note: about 12% of synthetic labels are flipped on purpose, so ~0.88 is the maximum possible.

Model saved to app/ml_models/saved_models/engagement_model.pkl
```

### Step 3: Start the Server
```bash
python run.py
```

### Step 4: Test the API

#### Check ML Service Health
```bash
curl http://localhost:5000/api/ml/health
```

Response:
```json
{
  "success": true,
  "status": "healthy",
  "model_loaded": true
}
```

#### Test Model Prediction
```bash
curl -X POST http://localhost:5000/api/ml/model/test \
  -H "Content-Type: application/json" \
  -d '{
    "time_spent_today": 5,
    "avg_quiz_score": 45,
    "login_streak": 0,
    "lessons_completed_week": 1,
    "days_inactive": 5
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "engaged": false,
    "confidence": 0.87,
    "risk_level": "critical",
    "recommendation": [
      "Send urgent motivational notification",
      "Offer bonus XP (50 XP) for next lesson completion",
      "Provide personalized encouragement message",
      "Suggest easier lessons to rebuild confidence"
    ]
  }
}
```

## 📊 Key API Endpoints

### For Users
```bash
# Get engagement prediction for current user
GET /api/ml/engagement/predict/<user_id>
Authorization: Bearer <JWT_TOKEN>
```

### For Admins
```bash
# Get all disengaged users
GET /api/ml/engagement/disengaged?threshold=0.6
Authorization: Bearer <JWT_TOKEN>

# Get engagement statistics
GET /api/ml/engagement/statistics
Authorization: Bearer <JWT_TOKEN>

# Trigger auto-intervention
POST /api/ml/engagement/auto-intervention
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "confidence_threshold": 0.6,
  "dry_run": false
}
```

## 🎯 Common Use Cases

### 1. Daily Engagement Check (Scheduled Task)

Create a scheduled task to run daily:

**File**: `backend/scheduled_tasks/daily_engagement_check.py`

```python
from app.services.engagement_service import EngagementService
from datetime import datetime

def run_daily_engagement_check():
    """Run daily engagement check and interventions"""
    service = EngagementService()
    
    # Get disengaged users
    disengaged = service.get_disengaged_users(confidence_threshold=0.7)
    
    print(f"[{datetime.utcnow()}] Found {len(disengaged)} disengaged users")
    
    # Trigger interventions
    for user_pred in disengaged:
        user_id = user_pred['user_info']['user_id']
        risk = user_pred['risk_level']
        
        actions = service.trigger_engagement_actions(user_id, user_pred)
        print(f"  User {user_id} ({risk} risk): {len(actions['actions_taken'])} actions taken")

if __name__ == '__main__':
    run_daily_engagement_check()
```

**Schedule with Cron** (Linux/Mac):
```bash
# Run every day at 9 AM
0 9 * * * cd /path/to/backend && python scheduled_tasks/daily_engagement_check.py
```

**Schedule with Task Scheduler** (Windows):
```powershell
# Create a scheduled task to run daily at 9 AM
schtasks /create /tn "Daily Engagement Check" /tr "python C:\path\to\backend\scheduled_tasks\daily_engagement_check.py" /sc daily /st 09:00
```

### 2. Real-time User Dashboard Alert

**Frontend Component** (React):

```javascript
// components/EngagementAlert.js
import React, { useEffect, useState } from 'react';
import api from '../services/api';

const EngagementAlert = ({ userId }) => {
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    const checkEngagement = async () => {
      try {
        const response = await api.get(`/ml/engagement/predict/${userId}`);
        const prediction = response.data.data;
        
        if (!prediction.engaged && prediction.confidence > 0.7) {
          setAlert({
            message: prediction.recommendation[0],
            riskLevel: prediction.risk_level
          });
        }
      } catch (error) {
        console.error('Error checking engagement:', error);
      }
    };

    checkEngagement();
    // Check every hour
    const interval = setInterval(checkEngagement, 3600000);
    
    return () => clearInterval(interval);
  }, [userId]);

  if (!alert) return null;

  return (
    <div className={`alert alert-${alert.riskLevel}`}>
      <h4>🌟 Stay Engaged!</h4>
      <p>{alert.message}</p>
      <button onClick={() => setAlert(null)}>Got it!</button>
    </div>
  );
};

export default EngagementAlert;
```

### 3. Admin Dashboard Widget

**Frontend Component** (React):

```javascript
// pages/AdminDashboardPage.js
import React, { useEffect, useState } from 'react';
import api from '../services/api';

const EngagementDashboard = () => {
  const [stats, setStats] = useState(null);
  const [disengaged, setDisengaged] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Get statistics
      const statsRes = await api.get('/ml/engagement/statistics');
      setStats(statsRes.data.data);
      
      // Get disengaged users
      const disengagedRes = await api.get('/ml/engagement/disengaged?threshold=0.6');
      setDisengaged(disengagedRes.data.data);
    } catch (error) {
      console.error('Error loading engagement data:', error);
    }
  };

  const handleAutoIntervention = async () => {
    try {
      const response = await api.post('/ml/engagement/auto-intervention', {
        confidence_threshold: 0.6,
        dry_run: false
      });
      
      alert(`Intervention triggered for ${response.data.total_interventions} users`);
      loadData(); // Reload data
    } catch (error) {
      console.error('Error triggering intervention:', error);
    }
  };

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="engagement-dashboard">
      <h2>Engagement Overview</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>{stats.total_users}</h3>
          <p>Total Users</p>
        </div>
        <div className="stat-card success">
          <h3>{stats.engaged_users}</h3>
          <p>Engaged Users</p>
        </div>
        <div className="stat-card warning">
          <h3>{stats.disengaged_users}</h3>
          <p>Disengaged Users</p>
        </div>
        <div className="stat-card">
          <h3>{stats.engagement_rate.toFixed(1)}%</h3>
          <p>Engagement Rate</p>
        </div>
      </div>

      <div className="risk-breakdown">
        <h3>Risk Breakdown</h3>
        {Object.entries(stats.risk_breakdown).map(([level, count]) => (
          <div key={level} className={`risk-item risk-${level}`}>
            <span>{level}</span>
            <span>{count} users</span>
          </div>
        ))}
      </div>

      <div className="disengaged-users">
        <div className="header">
          <h3>Disengaged Users ({disengaged.length})</h3>
          <button onClick={handleAutoIntervention}>
            Trigger Auto-Intervention
          </button>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Risk Level</th>
              <th>Confidence</th>
              <th>Days Inactive</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {disengaged.map(user => (
              <tr key={user.user_info.user_id}>
                <td>{user.user_info.username}</td>
                <td className={`risk-${user.risk_level}`}>
                  {user.risk_level}
                </td>
                <td>{(user.confidence * 100).toFixed(0)}%</td>
                <td>{user.features.days_inactive}</td>
                <td>
                  <button onClick={() => handleTriggerActions(user.user_info.user_id)}>
                    Send Notification
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```

## 🔧 Configuration Options

### Adjust Risk Thresholds

Edit `backend/app/services/engagement_service.py`:

```python
def trigger_engagement_actions(self, user_id, prediction_result):
    if not prediction_result.get('engaged'):
        risk_level = prediction_result.get('risk_level')
        confidence = prediction_result.get('confidence', 0)
        
        # CUSTOMIZE THESE THRESHOLDS
        if risk_level == 'critical' and confidence > 0.8:
            # Critical intervention
            actions_taken.extend([
                self._send_notification(user_id, 'urgent_motivation'),
                self._award_bonus_xp(user_id, 50),  # Change XP amount
                self._send_email(user_id, 'comeback_campaign')
            ])
        
        elif risk_level == 'high' and confidence > 0.6:
            # Moderate intervention
            actions_taken.extend([
                self._send_notification(user_id, 'motivation'),
                self._award_bonus_xp(user_id, 25)  # Change XP amount
            ])
```

### Customize Notification Messages

Edit `backend/app/services/notification_service.py`:

```python
notifications = {
    'urgent_motivation': {
        'title': '🌟 We Miss You!',  # CHANGE THIS
        'message': f"Hi {user.username}! ...",  # CHANGE THIS
        'priority': 'high',
        'action_text': 'Claim Bonus XP',  # CHANGE THIS
        'action_url': '/dashboard'
    },
    # Add more notification types...
}
```

### Change ML Algorithm

Retrain with specific algorithm:

```bash
# Use Logistic Regression
python train_engagement_model.py --algorithm logistic

# Use SVM
python train_engagement_model.py --algorithm svm

# Use Neural Network
python train_engagement_model.py --algorithm neural

# Auto-select best
python train_engagement_model.py --algorithm auto
```

## 📈 Monitoring & Maintenance

### Check Model Performance
```bash
curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/ml/model/info
```

### View Engagement Statistics
```bash
curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/ml/engagement/statistics
```

### Retrain Model (Monthly Recommended)
```bash
python train_engagement_model.py --samples 2000 --algorithm auto
```

## 🐛 Troubleshooting

### Model Not Loading
```bash
# Check if model exists
ls -la backend/app/ml_models/saved_models/

# If missing, train:
python train_engagement_model.py
```

### Import Errors
```bash
# Reinstall dependencies
pip install -r requirements.txt

# Verify installation
python -c "import sklearn; print('scikit-learn version:', sklearn.__version__)"
```

### Database Connection Issues
```bash
# Check database configuration
python -c "from app import create_app; app = create_app(); print('App created successfully')"
```

## 📚 Next Steps

1. **Integrate with Frontend**: Add engagement alerts to user dashboard
2. **Set Up Scheduled Tasks**: Automate daily engagement checks
3. **Monitor Performance**: Track intervention success rates
4. **Collect Feedback**: Survey users about notification effectiveness
5. **Retrain Model**: Use real user data for better predictions

## 📖 Full Documentation

See [ML_MODEL_DOCUMENTATION.md](ML_MODEL_DOCUMENTATION.md) for:
- Detailed API reference
- Architecture diagrams
- Advanced customization
- Best practices
- Troubleshooting guide

---

**Need Help?**
- Check model status: `/api/ml/health`
- View logs: `backend/logs/`
- Test predictions: `/api/ml/model/test`
