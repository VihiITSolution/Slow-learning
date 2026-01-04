"""
Learning Recommendation System
Recommends next best lessons based on user performance and preferences.
"""
import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
import joblib
import os


class LearningRecommender:
    def __init__(self, model_path='app/ml_models/saved_models/recommender_model.pkl'):
        """Initialize the learning recommendation system"""
        self.model_path = model_path
        self.lesson_features = None
        self.tfidf_vectorizer = TfidfVectorizer(max_features=100)
        
    def build_lesson_features(self, lessons_df):
        """
        Build feature matrix for lessons
        
        Args:
            lessons_df: DataFrame with lesson data (id, title, description, category, difficulty)
        """
        # Combine text features
        lessons_df['combined_features'] = (
            lessons_df['title'].fillna('') + ' ' + 
            lessons_df['description'].fillna('') + ' ' + 
            lessons_df['category'].fillna('')
        )
        
        # Create TF-IDF features
        tfidf_matrix = self.tfidf_vectorizer.fit_transform(lessons_df['combined_features'])
        
        # Add difficulty encoding
        difficulty_encoding = pd.get_dummies(lessons_df['difficulty_level'], prefix='diff')
        
        self.lesson_features = {
            'tfidf_matrix': tfidf_matrix,
            'difficulty': difficulty_encoding.values,
            'lesson_ids': lessons_df['id'].values
        }
        
        self.save_model()
    
    def get_content_based_recommendations(self, user_history, all_lessons, n_recommendations=5):
        """
        Get lesson recommendations based on user's learning history
        
        Args:
            user_history: list of lesson IDs the user has completed
            all_lessons: DataFrame of all available lessons
            n_recommendations: number of recommendations to return
        
        Returns:
            list of recommended lesson IDs with scores
        """
        if not user_history:
            # Return beginner-friendly lessons for new users
            return self._get_beginner_recommendations(all_lessons, n_recommendations)
        
        # Build lesson features if not already done
        if self.lesson_features is None:
            self.build_lesson_features(all_lessons)
        
        # Get features of completed lessons
        completed_indices = [
            i for i, lesson_id in enumerate(self.lesson_features['lesson_ids']) 
            if lesson_id in user_history
        ]
        
        if not completed_indices:
            return self._get_beginner_recommendations(all_lessons, n_recommendations)
        
        # Calculate user preference vector (average of completed lessons)
        completed_features = self.lesson_features['tfidf_matrix'][completed_indices]
        user_profile = completed_features.mean(axis=0)
        
        # Calculate similarity with all lessons
        similarities = cosine_similarity(user_profile, self.lesson_features['tfidf_matrix']).flatten()
        
        # Filter out already completed lessons
        available_indices = [
            i for i, lesson_id in enumerate(self.lesson_features['lesson_ids'])
            if lesson_id not in user_history
        ]
        
        # Get top recommendations
        available_similarities = [(i, similarities[i]) for i in available_indices]
        available_similarities.sort(key=lambda x: x[1], reverse=True)
        
        # Return top N recommendations
        recommendations = []
        for idx, score in available_similarities[:n_recommendations]:
            lesson_id = self.lesson_features['lesson_ids'][idx]
            recommendations.append({
                'lesson_id': int(lesson_id),
                'score': float(score),
                'reason': 'Based on your learning history'
            })
        
        return recommendations
    
    def get_adaptive_recommendations(self, user_data, all_lessons, n_recommendations=5):
        """
        Get adaptive recommendations based on user performance
        
        Args:
            user_data: dict with:
                - completed_lessons: list of completed lesson IDs
                - avg_quiz_score: average quiz score
                - difficulty_preference: preferred difficulty level
            all_lessons: DataFrame of all available lessons
            n_recommendations: number of recommendations to return
        
        Returns:
            list of recommended lesson IDs
        """
        completed_lessons = user_data.get('completed_lessons', [])
        avg_score = user_data.get('avg_quiz_score', 70)
        
        # Determine appropriate difficulty
        if avg_score >= 80:
            target_difficulty = ['medium', 'hard']
        elif avg_score >= 60:
            target_difficulty = ['easy', 'medium']
        else:
            target_difficulty = ['easy']
        
        # Filter lessons by difficulty
        filtered_lessons = all_lessons[
            (all_lessons['difficulty_level'].isin(target_difficulty)) &
            (~all_lessons['id'].isin(completed_lessons))
        ]
        
        # Get content-based recommendations from filtered set
        recommendations = self.get_content_based_recommendations(
            completed_lessons, 
            filtered_lessons, 
            n_recommendations
        )
        
        # Add difficulty-based reasoning
        for rec in recommendations:
            rec['reason'] = f"Matched to your performance level ({target_difficulty[0]})"
        
        return recommendations
    
    def _get_beginner_recommendations(self, all_lessons, n=5):
        """Get beginner-friendly recommendations for new users"""
        beginner_lessons = all_lessons[
            all_lessons['difficulty_level'] == 'easy'
        ].sort_values('order_index').head(n)
        
        return [
            {
                'lesson_id': int(row['id']),
                'score': 1.0,
                'reason': 'Recommended for beginners'
            }
            for _, row in beginner_lessons.iterrows()
        ]
    
    def save_model(self):
        """Save the recommendation model"""
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        
        model_data = {
            'lesson_features': self.lesson_features,
            'tfidf_vectorizer': self.tfidf_vectorizer
        }
        
        joblib.dump(model_data, self.model_path)
    
    def load_model(self):
        """Load the recommendation model"""
        if os.path.exists(self.model_path):
            model_data = joblib.load(self.model_path)
            self.lesson_features = model_data['lesson_features']
            self.tfidf_vectorizer = model_data['tfidf_vectorizer']
