"""
Recommendation Routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.lesson import Lesson
from app.models.progress import Progress
from app.models.quiz import QuizAttempt
from app.ml_models.learning_recommender import LearningRecommender
from sqlalchemy import func
import pandas as pd

bp = Blueprint('recommendations', __name__)

recommender = LearningRecommender()


@bp.route('/', methods=['GET'])
@jwt_required()
def get_recommendations():
    """Get personalized lesson recommendations"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    n_recommendations = request.args.get('limit', 5, type=int)
    
    # Get user's completed lessons
    completed_lessons = [
        p.lesson_id for p in Progress.query.filter_by(
            user_id=user_id,
            status='completed'
        ).all()
    ]
    
    # Get average quiz score
    avg_quiz_score = db.session.query(func.avg(QuizAttempt.score)).filter_by(
        user_id=user_id
    ).scalar() or 70
    
    # Get all lessons as DataFrame
    lessons = Lesson.query.filter_by(is_active=True).all()
    lessons_df = pd.DataFrame([
        {
            'id': l.id,
            'title': l.title,
            'description': l.description,
            'category': l.category,
            'difficulty_level': l.difficulty_level,
            'order_index': l.order_index
        }
        for l in lessons
    ])
    
    # Prepare user data
    user_data = {
        'completed_lessons': completed_lessons,
        'avg_quiz_score': avg_quiz_score
    }
    
    # Get recommendations
    try:
        recommendations = recommender.get_adaptive_recommendations(
            user_data,
            lessons_df,
            n_recommendations
        )
        
        # Enrich recommendations with lesson details
        enriched_recommendations = []
        for rec in recommendations:
            lesson = Lesson.query.get(rec['lesson_id'])
            if lesson:
                enriched_recommendations.append({
                    'lesson': lesson.to_dict(),
                    'score': rec['score'],
                    'reason': rec['reason']
                })
        
        return jsonify({
            'recommendations': enriched_recommendations
        }), 200
    
    except Exception as e:
        # Fallback to basic recommendations
        fallback_lessons = Lesson.query.filter(
            ~Lesson.id.in_(completed_lessons),
            Lesson.is_active == True
        ).order_by(Lesson.order_index).limit(n_recommendations).all()
        
        return jsonify({
            'recommendations': [
                {
                    'lesson': l.to_dict(),
                    'score': 1.0,
                    'reason': 'Recommended for you'
                }
                for l in fallback_lessons
            ]
        }), 200


@bp.route('/next-lesson', methods=['GET'])
@jwt_required()
def get_next_lesson():
    """Get the next recommended lesson"""
    user_id = int(get_jwt_identity())
    
    # Get user's completed lessons
    completed_lessons = [
        p.lesson_id for p in Progress.query.filter_by(
            user_id=user_id,
            status='completed'
        ).all()
    ]
    
    # Get next sequential lesson
    next_lesson = Lesson.query.filter(
        ~Lesson.id.in_(completed_lessons),
        Lesson.is_active == True
    ).order_by(Lesson.order_index).first()
    
    if not next_lesson:
        return jsonify({'message': 'No more lessons available'}), 404
    
    return jsonify({
        'next_lesson': next_lesson.to_dict()
    }), 200
