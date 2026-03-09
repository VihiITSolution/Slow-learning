"""
Engagement Service
Handles engagement prediction, user data extraction, and action triggering
"""
from datetime import datetime, timedelta
from sqlalchemy import func
from app import db
from app.models.user import User
from app.models.progress import Progress
from app.models.quiz import QuizAttempt
from app.ml_models.engagement_predictor import EngagementPredictor
from app.services.notification_service import NotificationService


class EngagementService:
    def __init__(self):
        """Initialize engagement service with ML predictor"""
        self.predictor = EngagementPredictor(algorithm='auto')
    
    def extract_user_features(self, user_id):
        """
        Extract engagement features for a specific user
        
        Args:
            user_id: ID of the user to analyze
            
        Returns:
            dict with user engagement metrics
        """
        user = User.query.get(user_id)
        if not user:
            raise ValueError(f"User {user_id} not found")
        
        # Calculate time-based metrics
        today = datetime.utcnow().date()
        week_ago = datetime.utcnow() - timedelta(days=7)
        
        # Time spent today (from progress records)
        time_spent_today = db.session.query(
            func.sum(Progress.time_spent)
        ).filter(
            Progress.user_id == user_id,
            func.date(Progress.last_accessed) == today
        ).scalar() or 0
        
        # Convert seconds to minutes
        time_spent_today = time_spent_today / 60
        
        # Average quiz score
        avg_quiz_score = db.session.query(
            func.avg(QuizAttempt.score)
        ).filter(
            QuizAttempt.user_id == user_id,
            QuizAttempt.score.isnot(None)
        ).scalar() or 0
        
        # Login streak (from user model)
        login_streak = user.current_streak or 0
        
        # Lessons completed in the last week
        lessons_completed_week = db.session.query(
            func.count(Progress.id)
        ).filter(
            Progress.user_id == user_id,
            Progress.status == 'completed',
            Progress.completed_at >= week_ago
        ).scalar() or 0
        
        # Days inactive (days since last login)
        if user.last_login:
            days_inactive = (datetime.utcnow() - user.last_login).days
        else:
            days_inactive = 999  # Never logged in
        
        return {
            'user_id': user_id,
            'time_spent_today': float(time_spent_today),
            'avg_quiz_score': float(avg_quiz_score),
            'login_streak': int(login_streak),
            'lessons_completed_week': int(lessons_completed_week),
            'days_inactive': int(days_inactive),
            'username': user.username,
            'email': user.email,
            'total_xp': user.total_xp,
            'level': user.level
        }
    
    def predict_user_engagement(self, user_id):
        """
        Predict engagement level for a specific user
        
        Args:
            user_id: ID of the user to analyze
            
        Returns:
            dict with prediction results and user info
        """
        # Extract features
        user_features = self.extract_user_features(user_id)
        
        # Make prediction
        prediction = self.predictor.predict_engagement(user_features)
        
        # Combine results
        result = {
            **prediction,
            'user_info': {
                'user_id': user_features['user_id'],
                'username': user_features['username'],
                'level': user_features['level'],
                'total_xp': user_features['total_xp']
            },
            'features': {
                'time_spent_today': user_features['time_spent_today'],
                'avg_quiz_score': user_features['avg_quiz_score'],
                'login_streak': user_features['login_streak'],
                'lessons_completed_week': user_features['lessons_completed_week'],
                'days_inactive': user_features['days_inactive']
            },
            'timestamp': datetime.utcnow().isoformat()
        }
        
        return result
    
    def predict_all_users_engagement(self):
        """
        Predict engagement for all students (excludes teachers and admins)
        
        Returns:
            list of prediction results for all students
        """
        users = User.query.filter_by(role='student').all()
        results = []
        
        for user in users:
            try:
                prediction = self.predict_user_engagement(user.id)
                results.append(prediction)
            except Exception as e:
                results.append({
                    'user_id': user.id,
                    'username': user.username,
                    'error': str(e),
                    'engaged': None
                })
        
        return results
    
    def get_disengaged_users(self, confidence_threshold=0.6):
        """
        Get list of users predicted to be disengaged
        
        Args:
            confidence_threshold: Minimum confidence to consider prediction valid
            
        Returns:
            list of disengaged users with predictions
        """
        all_predictions = self.predict_all_users_engagement()
        
        disengaged_users = [
            pred for pred in all_predictions
            if pred.get('engaged') == False and 
            pred.get('confidence', 0) >= confidence_threshold
        ]
        
        # Sort by risk level and confidence
        risk_order = {'critical': 0, 'high': 1, 'moderate': 2, 'moderate-low': 3, 'low': 4}
        disengaged_users.sort(
            key=lambda x: (
                risk_order.get(x.get('risk_level', 'moderate'), 5),
                -x.get('confidence', 0)
            )
        )
        
        return disengaged_users
    
    def trigger_engagement_actions(self, user_id, prediction_result):
        """
        Trigger appropriate actions based on engagement prediction
        
        Args:
            user_id: ID of the user
            prediction_result: Result from predict_user_engagement
            
        Returns:
            dict with actions taken
        """
        actions_taken = []
        
        if not prediction_result.get('engaged'):
            risk_level = prediction_result.get('risk_level')
            confidence = prediction_result.get('confidence', 0)
            
            # Critical risk - immediate action
            if risk_level == 'critical' and confidence > 0.8:
                actions_taken.extend([
                    self._send_notification(user_id, 'urgent_motivation'),
                    self._award_bonus_xp(user_id, 50),
                    self._send_email(user_id, 'comeback_campaign')
                ])
            
            # High risk - strong intervention
            elif risk_level == 'high' and confidence > 0.6:
                actions_taken.extend([
                    self._send_notification(user_id, 'motivation'),
                    self._award_bonus_xp(user_id, 25)
                ])
            
            # Moderate risk - gentle nudge
            elif confidence > 0.5:
                actions_taken.append(
                    self._send_notification(user_id, 'gentle_reminder')
                )
        
        return {
            'user_id': user_id,
            'actions_taken': actions_taken,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def _send_notification(self, user_id, notification_type):
        """
        Send notification to user using NotificationService
        
        Args:
            user_id: User ID
            notification_type: Type of notification
            
        Returns:
            dict with action details
        """
        return NotificationService.send_engagement_notification(user_id, notification_type)
    
    def _award_bonus_xp(self, user_id, xp_amount):
        """
        Award bonus XP to user
        
        Args:
            user_id: User ID
            xp_amount: Amount of XP to award
            
        Returns:
            dict with action details
        """
        try:
            user = User.query.get(user_id)
            if user:
                user.add_xp(xp_amount)
                db.session.commit()
                
                return {
                    'action': 'bonus_xp_awarded',
                    'amount': xp_amount,
                    'new_total': user.total_xp,
                    'status': 'success'
                }
        except Exception as e:
            return {
                'action': 'bonus_xp_award_failed',
                'error': str(e),
                'status': 'failed'
            }
    
    def _send_email(self, user_id, email_type):
        """
        Send email to user (placeholder - implement with your email system)
        
        Args:
            user_id: User ID
            email_type: Type of email campaign
            
        Returns:
            dict with action details
        """
        # TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
        return {
            'action': 'email_sent',
            'type': email_type,
            'status': 'queued'
        }
    
    def get_engagement_statistics(self):
        """
        Get overall engagement statistics across all users
        
        Returns:
            dict with engagement stats
        """
        all_predictions = self.predict_all_users_engagement()
        
        total_users = len(all_predictions)
        engaged_users = sum(1 for p in all_predictions if p.get('engaged'))
        disengaged_users = total_users - engaged_users
        
        # Risk level breakdown
        risk_breakdown = {}
        for pred in all_predictions:
            risk = pred.get('risk_level', 'unknown')
            risk_breakdown[risk] = risk_breakdown.get(risk, 0) + 1
        
        # Average metrics
        avg_confidence = sum(p.get('confidence', 0) for p in all_predictions) / max(total_users, 1)
        
        return {
            'total_users': total_users,
            'engaged_users': engaged_users,
            'disengaged_users': disengaged_users,
            'engagement_rate': (engaged_users / max(total_users, 1)) * 100,
            'risk_breakdown': risk_breakdown,
            'average_confidence': avg_confidence,
            'timestamp': datetime.utcnow().isoformat()
        }

    def extract_training_data_from_db(self):
        """
        Extract labeled training data from real student interactions in the DB.
        Labels a user as engaged=1 if they have recent activity and decent quiz scores,
        disengaged=0 otherwise.

        Returns:
            pandas DataFrame with feature columns + 'engaged' label, or None if too few users.
        """
        import pandas as pd

        users = User.query.filter_by(role='student').all()
        rows = []

        for user in users:
            try:
                features = self.extract_user_features(user.id)
            except Exception:
                continue

            # Label heuristic: engaged if active recently with some learning activity
            lessons_ok = features['lessons_completed_week'] > 0
            quiz_ok = features['avg_quiz_score'] >= 50
            inactive_ok = features['days_inactive'] <= 2
            streak_ok = features['login_streak'] >= 1

            engaged = 1 if (lessons_ok or streak_ok) and (quiz_ok or inactive_ok) else 0

            rows.append({
                'time_spent_today': features['time_spent_today'],
                'avg_quiz_score': features['avg_quiz_score'],
                'login_streak': features['login_streak'],
                'lessons_completed_week': features['lessons_completed_week'],
                'days_inactive': features['days_inactive'],
                'engaged': engaged
            })

        if len(rows) < 1:
            return None

        return pd.DataFrame(rows)
