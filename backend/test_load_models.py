import warnings
import sys

# Catch warnings as errors or just print them clearly
warnings.filterwarnings('always')

print("Loading models...")
try:
    from app.ml_models.engagement_predictor import EngagementPredictor
    from app.ml_models.learning_recommender import LearningRecommender

    print("Instantiating EngagementPredictor...")
    engagement_predictor = EngagementPredictor()
    engagement_result = engagement_predictor.predict_engagement({
        "time_spent_today": 30,
        "avg_quiz_score": 80,
        "login_streak": 3,
        "lessons_completed_week": 2,
        "days_inactive": 1
    })
    print("Engagement prediction result:", engagement_result)

    print("\nInstantiating LearningRecommender...")
    recommender = LearningRecommender()
    recommender.load_model()
    print("Models loaded without exceptions.")
    
except Exception as e:
    print("Error during loading or predicting:", str(e))
    sys.exit(1)
