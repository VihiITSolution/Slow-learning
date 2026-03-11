"""
Example script demonstrating how to save ML model outputs to JSON files

This script shows how to use the JSON saving functionality for both:
1. Engagement Predictor - saves engagement predictions
2. Learning Recommender - saves lesson recommendations
"""

from app.ml_models.engagement_predictor import EngagementPredictor, generate_synthetic_training_data
from app.ml_models.learning_recommender import LearningRecommender
import pandas as pd

def example_save_engagement_predictions():
    """Example: Save engagement prediction to JSON"""
    print("=== Engagement Prediction JSON Export ===\n")
    
    # Initialize the engagement predictor
    predictor = EngagementPredictor()
    
    # Train the model if not already trained
    print("Training engagement model...")
    training_data = generate_synthetic_training_data(500)
    predictor.train_model(training_data)
    
    # Example user data
    user_data = {
        'time_spent_today': 35,
        'avg_quiz_score': 78,
        'login_streak': 5,
        'lessons_completed_week': 3,
        'days_inactive': 1
    }
    
    # Make prediction
    print("\nMaking prediction for user...")
    prediction = predictor.predict_engagement(user_data)
    
    # Save single prediction to JSON
    output_path = predictor.save_prediction_to_json(
        user_data=user_data,
        prediction_result=prediction,
        output_path='app/ml_models/saved_models/engagement_predictions.json'
    )
    print(f"✓ Single prediction saved to: {output_path}")
    
    # Example: Save batch predictions
    print("\n--- Batch Predictions ---")
    batch_predictions = []
    
    test_users = [
        {'time_spent_today': 50, 'avg_quiz_score': 85, 'login_streak': 10, 'lessons_completed_week': 5, 'days_inactive': 0},
        {'time_spent_today': 15, 'avg_quiz_score': 55, 'login_streak': 2, 'lessons_completed_week': 1, 'days_inactive': 3},
        {'time_spent_today': 40, 'avg_quiz_score': 72, 'login_streak': 7, 'lessons_completed_week': 4, 'days_inactive': 1},
    ]
    
    for i, user in enumerate(test_users, 1):
        pred = predictor.predict_engagement(user)
        batch_predictions.append({
            'user_id': f'user_{i}',
            'user_data': user,
            'prediction': pred
        })
    
    batch_path = predictor.save_batch_predictions_to_json(
        predictions_list=batch_predictions,
        output_path='app/ml_models/saved_models/engagement_predictions_batch.json'
    )
    print(f"✓ Batch predictions saved to: {batch_path}")
    
    return output_path, batch_path


def example_save_learning_recommendations():
    """Example: Save learning recommendations to JSON"""
    print("\n\n=== Learning Recommendations JSON Export ===\n")
    
    # Initialize the recommender
    recommender = LearningRecommender()
    
    # Create sample lessons data
    lessons_data = pd.DataFrame([
        {'id': 1, 'title': 'Python Basics', 'description': 'Introduction to Python programming', 
         'category': 'Programming', 'difficulty_level': 'easy', 'order_index': 1},
        {'id': 2, 'title': 'Data Structures', 'description': 'Lists, dictionaries, and sets in Python', 
         'category': 'Programming', 'difficulty_level': 'medium', 'order_index': 2},
        {'id': 3, 'title': 'Loops and Functions', 'description': 'Control flow and function definitions', 
         'category': 'Programming', 'difficulty_level': 'easy', 'order_index': 3},
        {'id': 4, 'title': 'Object-Oriented Programming', 'description': 'Classes and objects in Python', 
         'category': 'Programming', 'difficulty_level': 'medium', 'order_index': 4},
        {'id': 5, 'title': 'Advanced Python', 'description': 'Decorators, generators, and async', 
         'category': 'Programming', 'difficulty_level': 'hard', 'order_index': 5},
    ])
    
    # Build lesson features
    print("Building lesson features...")
    recommender.build_lesson_features(lessons_data)
    
    # Example user data
    user_data = {
        'completed_lessons': [1, 3],
        'avg_quiz_score': 75,
        'difficulty_preference': 'medium'
    }
    
    # Get recommendations
    print("Generating recommendations...")
    recommendations = recommender.get_adaptive_recommendations(
        user_data=user_data,
        all_lessons=lessons_data,
        n_recommendations=3
    )
    
    # Save single user recommendations to JSON
    output_path = recommender.save_recommendations_to_json(
        user_data=user_data,
        recommendations=recommendations,
        output_path='app/ml_models/saved_models/learning_recommendations.json',
        recommendation_type='adaptive'
    )
    print(f"✓ Single user recommendations saved to: {output_path}")
    
    # Example: Save batch recommendations for multiple users
    print("\n--- Batch Recommendations ---")
    batch_recommendations = []
    
    test_users = [
        {'user_id': 'student_1', 'completed_lessons': [1], 'avg_quiz_score': 85},
        {'user_id': 'student_2', 'completed_lessons': [1, 2, 3], 'avg_quiz_score': 70},
        {'user_id': 'student_3', 'completed_lessons': [], 'avg_quiz_score': 60},
    ]
    
    for user in test_users:
        recs = recommender.get_adaptive_recommendations(
            user_data=user,
            all_lessons=lessons_data,
            n_recommendations=3
        )
        batch_recommendations.append({
            'user_id': user['user_id'],
            'user_data': user,
            'recommendations': recs
        })
    
    batch_path = recommender.save_batch_recommendations_to_json(
        recommendations_list=batch_recommendations,
        output_path='app/ml_models/saved_models/learning_recommendations_batch.json'
    )
    print(f"✓ Batch recommendations saved to: {batch_path}")
    
    return output_path, batch_path


def main():
    """Run all examples"""
    print("=" * 60)
    print("ML Model JSON Output Examples")
    print("=" * 60)
    
    # Example 1: Engagement Predictions
    engagement_paths = example_save_engagement_predictions()
    
    # Example 2: Learning Recommendations
    recommendation_paths = example_save_learning_recommendations()
    
    print("\n" + "=" * 60)
    print("Summary - JSON Files Created:")
    print("=" * 60)
    print("\nEngagement Predictor:")
    print(f"  - Single: {engagement_paths[0]}")
    print(f"  - Batch:  {engagement_paths[1]}")
    print("\nLearning Recommender:")
    print(f"  - Single: {recommendation_paths[0]}")
    print(f"  - Batch:  {recommendation_paths[1]}")
    print("\n✓ All JSON files successfully saved!")


if __name__ == '__main__':
    main()
