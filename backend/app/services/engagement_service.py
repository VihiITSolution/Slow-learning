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
from app.ml_models.engagement_predictor import EngagementPredictor, FEATURE_NAMES, rule_based_engagement_label
from app.services.activity_service import activity_features, activity_summary
from app.services.notification_service import NotificationService


# A student this new with no lessons or quizzes has no activity history yet,
# so the model would only see zeros and call them "critical". They are
# reported as "new" (engaged=None) instead and get no automatic interventions.
NEW_STUDENT_DAYS = 7


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
        
        # Practice rounds and learning games played today count as learning
        # time too (seconds), then convert to minutes
        activity = activity_features(user_id)
        time_spent_today = (time_spent_today + activity['seconds_today']) / 60
        
        # Average quiz score. None when the student has not taken a quiz yet:
        # the predictor treats it as missing (training mean) instead of 0%.
        avg_quiz_score = db.session.query(
            func.avg(QuizAttempt.score)
        ).filter(
            QuizAttempt.user_id == user_id,
            QuizAttempt.score.isnot(None)
        ).scalar()
        avg_quiz_score = float(avg_quiz_score) if avg_quiz_score is not None else None
        
        # Login streak. current_streak is only recalculated when the student
        # logs in, so a student who stopped coming would keep their old
        # streak. It only counts if the last login was today or yesterday.
        last_login_date = user.last_login.date() if user.last_login else None
        if last_login_date and (today - last_login_date).days <= 1:
            login_streak = user.current_streak or 0
        else:
            login_streak = 0
        
        # Lessons completed in the last week
        lessons_completed_week = db.session.query(
            func.count(Progress.id)
        ).filter(
            Progress.user_id == user_id,
            Progress.status == 'completed',
            Progress.completed_at >= week_ago
        ).scalar() or 0
        
        # Days inactive (days since last login), capped at 60 like the model's
        # training range
        if user.last_login:
            days_inactive = min((datetime.utcnow() - user.last_login).days, 60)
        else:
            days_inactive = 60  # Never logged in
        
        lessons_completed_total = Progress.query.filter_by(user_id=user_id, status='completed').count()
        quiz_attempts = QuizAttempt.query.filter_by(user_id=user_id).count()
        account_age_days = (datetime.utcnow() - user.created_at).days if user.created_at else None
        
        return {
            'user_id': user_id,
            'lessons_completed_total': lessons_completed_total,
            'quiz_attempts': quiz_attempts,
            'account_age_days': account_age_days,
            'time_spent_today': float(time_spent_today),
            'avg_quiz_score': avg_quiz_score,
            'login_streak': int(login_streak),
            'lessons_completed_week': int(lessons_completed_week),
            'days_inactive': int(days_inactive),
            'practice_accuracy': activity['practice_accuracy'],
            'activities_week': activity['activities_week'],
            'activities_total': activity['scored_total'],
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
            'features': {name: user_features[name] for name in FEATURE_NAMES},
            'activity': activity_summary(user_id),
            'timestamp': datetime.utcnow().isoformat()
        }
        
        age = user_features.get('account_age_days')
        is_new = (
            user_features.get('lessons_completed_total', 0) == 0
            and user_features.get('quiz_attempts', 0) == 0
            and user_features.get('activities_total', 0) == 0
            and age is not None and age < NEW_STUDENT_DAYS
        )
        result['insufficient_data'] = is_new
        if is_new:
            result['model_prediction'] = {
                'engaged': prediction.get('engaged'),
                'risk_level': prediction.get('risk_level'),
            }
            result['engaged'] = None
            result['risk_level'] = 'new'
            result['recommendation'] = [
                'New student - not enough activity yet to judge engagement',
                'Help them start their first lesson or a practice round',
                'Check again after a few lessons or practice rounds',
            ]
        
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
        
        if prediction_result.get('insufficient_data'):
            return {
                'user_id': user_id,
                'actions_taken': actions_taken,
                'skipped': 'New student - not enough activity yet for an intervention',
                'timestamp': datetime.utcnow().isoformat()
            }
        
        if prediction_result.get('engaged') is False:
            risk_level = prediction_result.get('risk_level')
            confidence = prediction_result.get('confidence', 0)
            
            # Critical risk - immediate action
            if risk_level == 'critical' and confidence > 0.8:
                actions_taken.extend([
                    self._send_notification(user_id, 'urgent_motivation'),
                    self._award_bonus_xp(user_id, 50)
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
    
    def get_engagement_statistics(self):
        """
        Get overall engagement statistics across all users
        
        Returns:
            dict with engagement stats
        """
        all_predictions = self.predict_all_users_engagement()
        
        total_users = len(all_predictions)
        engaged_users = sum(1 for p in all_predictions if p.get('engaged') is True)
        disengaged_users = sum(1 for p in all_predictions if p.get('engaged') is False)
        new_students = sum(1 for p in all_predictions if p.get('insufficient_data'))
        assessed = [p for p in all_predictions if p.get('engaged') is not None]
        
        # Risk level breakdown
        risk_breakdown = {}
        for pred in all_predictions:
            risk = pred.get('risk_level', 'unknown')
            risk_breakdown[risk] = risk_breakdown.get(risk, 0) + 1
        
        # Average metrics (only students the model could actually assess)
        avg_confidence = sum(p.get('confidence', 0) for p in assessed) / max(len(assessed), 1)
        
        return {
            'total_users': total_users,
            'engaged_users': engaged_users,
            'disengaged_users': disengaged_users,
            'new_students': new_students,
            'engagement_rate': (engaged_users / max(len(assessed), 1)) * 100,
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

            # Same rule as train_engagement_model.py (a heuristic, not a
            # teacher judgement - see rule_based_engagement_label)
            engaged = rule_based_engagement_label(features)

            rows.append({**{name: features[name] for name in FEATURE_NAMES}, 'engaged': engaged})

        if len(rows) < 1:
            return None

        return pd.DataFrame(rows)
