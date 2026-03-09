"""
ML Analytics Routes
Endpoints for engagement prediction and ML model management
"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.engagement_service import EngagementService
from app.ml_models.engagement_predictor import EngagementPredictor, generate_synthetic_training_data
from app.models.user import User
import pandas as pd

ml_analytics_bp = Blueprint('ml_analytics', __name__, url_prefix='/api/ml')

# Initialize service
engagement_service = EngagementService()


def require_admin_or_teacher():
    """Helper function to check if current user is admin or teacher"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user or user.role not in ['admin', 'teacher']:
        return jsonify({
            'success': False,
            'error': 'Access denied. Admin or teacher role required'
        }), 403
    
    return None


@ml_analytics_bp.route('/engagement/predict/<int:user_id>', methods=['GET'])
@jwt_required()
def predict_user_engagement(user_id):
    """
    Predict engagement level for a specific user
    ---
    tags:
      - ML Analytics
    security:
      - Bearer: []
    parameters:
      - in: path
        name: user_id
        type: integer
        required: true
        description: User ID to predict engagement for
        example: 1
    responses:
      200:
        description: Engagement prediction successful
        schema:
          type: object
          properties:
            success:
              type: boolean
            data:
              type: object
              properties:
                user_id:
                  type: integer
                engagement_level:
                  type: string
                  enum: [high, medium, low]
                confidence:
                  type: number
                  format: float
                recommendations:
                  type: array
                  items:
                    type: string
      401:
        description: Unauthorized - invalid or missing token
        schema:
          $ref: '#/definitions/Error'
      404:
        description: User not found
        schema:
          type: object
          properties:
            success:
              type: boolean
            error:
              type: string
      500:
        description: Prediction failed
        schema:
          type: object
          properties:
            success:
              type: boolean
            error:
              type: string
    """
    try:
        # Check if current user has permission (admin or self)
        current_user_id = int(get_jwt_identity())
        # TODO: Add admin check if needed
        
        result = engagement_service.predict_user_engagement(user_id)
        
        return jsonify({
            'success': True,
            'data': result
        }), 200
        
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 404
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Prediction failed: {str(e)}'
        }), 500


@ml_analytics_bp.route('/engagement/predict-all', methods=['GET'])
@jwt_required()
def predict_all_engagement():
    """
    Predict engagement for all users (Admin/Teacher only)
    ---
    tags:
      - ML Analytics
    security:
      - Bearer: []
    responses:
      200:
        description: Predictions for all users
        schema:
          type: object
          properties:
            success:
              type: boolean
            data:
              type: array
              items:
                type: object
                properties:
                  user_id:
                    type: integer
                  username:
                    type: string
                  engagement_level:
                    type: string
                  confidence:
                    type: number
      401:
        description: Unauthorized - invalid or missing token
        schema:
          $ref: '#/definitions/Error'
      403:
        description: Access denied - admin or teacher role required
        schema:
          type: object
          properties:
            success:
              type: boolean
            error:
              type: string
      500:
        description: Prediction failed
        schema:
          type: object
          properties:
            success:
              type: boolean
            error:
              type: string
    """
    try:
        # Check admin/teacher role
        auth_error = require_admin_or_teacher()
        if auth_error:
            return auth_error
        
        results = engagement_service.predict_all_users_engagement()
        
        return jsonify({
            'success': True,
            'data': results,
            'total_users': len(results)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Batch prediction failed: {str(e)}'
        }), 500


@ml_analytics_bp.route('/engagement/disengaged', methods=['GET'])
@jwt_required()
def get_disengaged_users():
    """
    Get list of disengaged users (Admin/Teacher only)
    
    GET /api/ml/engagement/disengaged?threshold=0.6
    
    Query Parameters:
        threshold: Minimum confidence threshold (default: 0.6)
    
    Returns:
        JSON with list of disengaged users
    """
    try:
        # Check admin/teacher role
        auth_error = require_admin_or_teacher()
        if auth_error:
            return auth_error
        
        threshold = float(request.args.get('threshold', 0.6))
        
        disengaged_users = engagement_service.get_disengaged_users(
            confidence_threshold=threshold
        )
        
        return jsonify({
            'success': True,
            'data': disengaged_users,
            'count': len(disengaged_users),
            'threshold': threshold
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to get disengaged users: {str(e)}'
        }), 500


@ml_analytics_bp.route('/engagement/statistics', methods=['GET'])
@jwt_required()
def get_engagement_statistics():
    """
    Get overall engagement statistics (Admin/Teacher only)
    
    GET /api/ml/engagement/statistics
    
    Returns:
        JSON with engagement statistics
    """
    try:
        # Check admin/teacher role
        auth_error = require_admin_or_teacher()
        if auth_error:
            return auth_error
        
        stats = engagement_service.get_engagement_statistics()
        
        return jsonify({
            'success': True,
            'data': stats
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to get statistics: {str(e)}'
        }), 500


@ml_analytics_bp.route('/engagement/trigger-actions/<int:user_id>', methods=['POST'])
@jwt_required()
def trigger_engagement_actions(user_id):
    """
    Manually trigger engagement actions for a user (Admin/Teacher only)
    
    POST /api/ml/engagement/trigger-actions/<user_id>
    
    Returns:
        JSON with actions taken
    """
    try:
        # Check admin/teacher role
        auth_error = require_admin_or_teacher()
        if auth_error:
            return auth_error
        
        # First, predict engagement
        prediction = engagement_service.predict_user_engagement(user_id)
        
        # Trigger actions based on prediction
        actions = engagement_service.trigger_engagement_actions(user_id, prediction)
        
        return jsonify({
            'success': True,
            'data': actions,
            'prediction': prediction
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to trigger actions: {str(e)}'
        }), 500


@ml_analytics_bp.route('/engagement/auto-intervention', methods=['POST'])
@jwt_required()
def auto_intervention():
    """
    Automatically intervene with all disengaged users (Admin/Teacher only)
    
    POST /api/ml/engagement/auto-intervention
    
    Body (optional):
        {
            "confidence_threshold": 0.6,
            "dry_run": false
        }
    
    Returns:
        JSON with intervention results
    """
    try:
        # Check admin/teacher role
        auth_error = require_admin_or_teacher()
        if auth_error:
            return auth_error
        
        data = request.get_json() or {}
        threshold = data.get('confidence_threshold', 0.6)
        dry_run = data.get('dry_run', False)
        
        # Get disengaged users
        disengaged_users = engagement_service.get_disengaged_users(threshold)
        
        results = []
        
        for user_pred in disengaged_users:
            user_id = user_pred['user_info']['user_id']
            
            if not dry_run:
                actions = engagement_service.trigger_engagement_actions(user_id, user_pred)
                results.append(actions)
            else:
                results.append({
                    'user_id': user_id,
                    'actions_taken': ['DRY RUN - No actions taken'],
                    'would_trigger': user_pred['recommendation']
                })
        
        return jsonify({
            'success': True,
            'data': results,
            'total_interventions': len(results),
            'dry_run': dry_run
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Auto-intervention failed: {str(e)}'
        }), 500


# ========== Model Management Endpoints ==========

@ml_analytics_bp.route('/model/info', methods=['GET'])
def get_model_info():
    """
    Get information about the current ML model (Public endpoint)
    
    GET /api/ml/model/info
    
    Returns:
        JSON with model information
    """
    try:
        predictor = EngagementPredictor()
        info = predictor.get_model_info()
        
        return jsonify({
            'success': True,
            'data': info
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to get model info: {str(e)}'
        }), 500


@ml_analytics_bp.route('/model/train', methods=['POST'])
@jwt_required()
def train_model():
    """
    Train the engagement prediction model (Admin only)
    
    POST /api/ml/model/train
    
    Body:
        {
            "algorithm": "auto",  // or "logistic", "svm", "neural"
            "use_synthetic_data": true,
            "n_samples": 1000
        }
    
    Returns:
        JSON with training results
    """
    try:
        # Check admin/teacher role
        auth_error = require_admin_or_teacher()
        if auth_error:
            return auth_error
        
        data = request.get_json() or {}
        algorithm = data.get('algorithm', 'auto')
        use_synthetic = data.get('use_synthetic_data', True)
        n_samples = data.get('n_samples', 1000)

        if not use_synthetic:
            # Try to extract real data from the database
            real_data = engagement_service.extract_training_data_from_db()
            if real_data is not None and len(real_data) >= 10:
                # Supplement with synthetic data to ensure enough samples for training
                synthetic_data = generate_synthetic_training_data(max(n_samples - len(real_data), 200))
                import pandas as pd
                training_data = pd.concat([real_data, synthetic_data], ignore_index=True)
                data_source = f'real ({len(real_data)} samples) + synthetic ({len(synthetic_data)} samples)'
            elif real_data is not None:
                # Too few real users — mix in more synthetic
                synthetic_data = generate_synthetic_training_data(n_samples)
                import pandas as pd
                training_data = pd.concat([real_data, synthetic_data], ignore_index=True)
                data_source = f'real ({len(real_data)} samples) + synthetic ({len(synthetic_data)} samples)'
            else:
                training_data = generate_synthetic_training_data(n_samples)
                data_source = f'synthetic only ({n_samples} samples) — no real data yet'
        else:
            training_data = generate_synthetic_training_data(n_samples)
            data_source = f'synthetic ({n_samples} samples)'
        
        # Train model
        predictor = EngagementPredictor(algorithm=algorithm)
        results = predictor.train_model(training_data)
        
        return jsonify({
            'success': True,
            'data': results,
            'message': 'Model trained successfully',
            'data_source': data_source
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Training failed: {str(e)}'
        }), 500


@ml_analytics_bp.route('/model/test', methods=['POST'])
def test_model():
    """
    Test the model with custom input (Public endpoint for testing)
    
    POST /api/ml/model/test
    
    Body:
        {
            "time_spent_today": 30,
            "avg_quiz_score": 75,
            "login_streak": 5,
            "lessons_completed_week": 3,
            "days_inactive": 0
        }
    
    Returns:
        JSON with prediction result
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Request body required'
            }), 400
        
        predictor = EngagementPredictor()
        prediction = predictor.predict_engagement(data)
        
        return jsonify({
            'success': True,
            'data': prediction
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Prediction failed: {str(e)}'
        }), 500


@ml_analytics_bp.route('/engagement/my-report', methods=['GET'])
@jwt_required()
def my_engagement_report():
    """Get the logged-in student's own engagement summary (visible to all authenticated users)"""
    try:
        user_id = int(get_jwt_identity())
        result = engagement_service.predict_user_engagement(user_id)

        # Fetch personalized lesson recommendations
        from app.ml_models.learning_recommender import LearningRecommender
        from app.models.lesson import Lesson
        from app.models.progress import Progress
        recommender = LearningRecommender()
        lessons = Lesson.query.filter_by(is_active=True).all()
        completed_ids = [
            p.lesson_id for p in Progress.query.filter_by(user_id=user_id, status='completed').all()
        ]
        lessons_df = pd.DataFrame([l.to_dict() for l in lessons])
        recs = recommender.get_content_based_recommendations(completed_ids, lessons_df, n_recommendations=5) if not lessons_df.empty else []

        result['recommendations'] = recs
        return jsonify({'success': True, 'data': result}), 200
    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': f'Failed to get report: {str(e)}'}), 500


@ml_analytics_bp.route('/engagement/class-report', methods=['GET'])
@jwt_required()
def class_report():
    """Full class report for teachers — every student's engagement, metrics and recommendations"""
    try:
        auth_error = require_admin_or_teacher()
        if auth_error:
            return auth_error

        from app.ml_models.learning_recommender import LearningRecommender
        from app.models.lesson import Lesson
        from app.models.progress import Progress
        recommender = LearningRecommender()
        lessons = Lesson.query.filter_by(is_active=True).all()
        lessons_df = pd.DataFrame([l.to_dict() for l in lessons])

        all_predictions = engagement_service.predict_all_users_engagement()
        stats = engagement_service.get_engagement_statistics()

        students = []
        for pred in all_predictions:
            uid = pred.get('user_info', {}).get('user_id') or pred.get('user_id')
            if not uid:
                continue
            completed_ids = [
                p.lesson_id for p in Progress.query.filter_by(user_id=uid, status='completed').all()
            ]
            recs = recommender.get_content_based_recommendations(completed_ids, lessons_df, n_recommendations=3) if not lessons_df.empty else []
            students.append({**pred, 'recommendations': recs})

        # Sort: disengaged critical first, then by confidence descending
        risk_order = {'critical': 0, 'high': 1, 'moderate': 2, 'moderate-low': 3, 'low': 4}
        students.sort(key=lambda x: (
            0 if not x.get('engaged') else 1,
            risk_order.get(x.get('risk_level', 'low'), 5),
            -x.get('confidence', 0)
        ))

        return jsonify({'success': True, 'data': {'students': students, 'stats': stats}}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': f'Class report failed: {str(e)}'}), 500


@ml_analytics_bp.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint for ML service
    
    GET /api/ml/health
    """
    try:
        predictor = EngagementPredictor()
        model_loaded = predictor.model is not None
        
        return jsonify({
            'success': True,
            'status': 'healthy',
            'model_loaded': model_loaded
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'status': 'unhealthy',
            'error': str(e)
        }), 500
