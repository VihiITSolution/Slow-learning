"""
Learning Recommendation System
Recommends next best lessons based on user performance and preferences.
"""
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
import joblib
import os
import json
from datetime import datetime


# Lessons in this app use beginner / intermediate / advanced, while older code
# and the admin UI use easy / medium / hard. Both map to the same levels.
DIFFICULTY_RANK = {
    'easy': 1, 'beginner': 1,
    'medium': 2, 'intermediate': 2,
    'hard': 3, 'advanced': 3,
}
RANK_LABEL = {1: 'beginner', 2: 'intermediate', 3: 'advanced'}


def difficulty_rank(level):
    """1 = beginner/easy, 2 = intermediate/medium, 3 = advanced/hard (unknown -> 1)."""
    return DIFFICULTY_RANK.get(str(level or '').strip().lower(), 1)


class LearningRecommender:
    def __init__(self, model_path='app/ml_models/saved_models/recommender_model.pkl'):
        """Initialize the learning recommendation system"""
        self.model_path = model_path
        self.lesson_features = None
        self.tfidf_vectorizer = TfidfVectorizer(max_features=100)
        self._signature = None

    @staticmethod
    def _lessons_signature(lessons_df):
        """Fingerprint of the lesson catalogue, so cached features are rebuilt when it changes."""
        columns = [c for c in ('id', 'title', 'description', 'category', 'difficulty_level') if c in lessons_df]
        return tuple(tuple(str(v) for v in row) for row in lessons_df[columns].itertuples(index=False))

    def build_lesson_features(self, lessons_df):
        """
        Build the TF-IDF feature matrix for lessons (title + description + category).

        Args:
            lessons_df: DataFrame with lesson data (id, title, description, category, difficulty_level)
        """
        if lessons_df is None or lessons_df.empty:
            self.lesson_features, self._signature = None, None
            return
        text = (
            lessons_df['title'].fillna('').astype(str) + ' ' +
            lessons_df['description'].fillna('').astype(str) + ' ' +
            lessons_df['category'].fillna('').astype(str)
        )
        self.tfidf_vectorizer = TfidfVectorizer(max_features=100)
        try:
            tfidf_matrix = self.tfidf_vectorizer.fit_transform(text)
        except ValueError:  # no usable words at all
            self.lesson_features, self._signature = None, None
            return
        self.lesson_features = {
            'tfidf_matrix': tfidf_matrix,
            'difficulty': lessons_df['difficulty_level'].map(difficulty_rank).values,
            'lesson_ids': lessons_df['id'].astype(int).values,
        }
        self._signature = self._lessons_signature(lessons_df)

    def _ensure_features(self, all_lessons):
        if self.lesson_features is None or self._signature != self._lessons_signature(all_lessons):
            self.build_lesson_features(all_lessons)

    @staticmethod
    def _sort_key_columns(lessons_df):
        df = lessons_df.copy()
        df['_rank'] = df['difficulty_level'].map(difficulty_rank) if 'difficulty_level' in df else 1
        df['_order'] = df['order_index'].fillna(0) if 'order_index' in df else 0
        return df

    def get_content_based_recommendations(self, user_history, all_lessons, n_recommendations=5,
                                          candidate_ids=None):
        """
        Recommend lessons similar to the ones the student has completed.

        Similarity is computed against the FULL catalogue (so completed lessons
        are found), then only candidate lessons are ranked: not completed, and
        within candidate_ids when given.

        Args:
            user_history: list of lesson IDs the user has completed
            all_lessons: DataFrame of all available lessons
            n_recommendations: number of recommendations to return
            candidate_ids: optional set of lesson IDs allowed in the result

        Returns:
            list of {'lesson_id', 'score', 'reason'} dicts
        """
        if all_lessons is None or all_lessons.empty:
            return []
        history = {int(x) for x in (user_history or [])}
        candidates = all_lessons[~all_lessons['id'].astype(int).isin(history)]
        if candidate_ids is not None:
            allowed = {int(x) for x in candidate_ids}
            candidates = candidates[candidates['id'].astype(int).isin(allowed)]
        if candidates.empty:
            return []

        self._ensure_features(all_lessons)
        if not history or self.lesson_features is None:
            return self._get_beginner_recommendations(candidates, n_recommendations)

        ids = list(self.lesson_features['lesson_ids'])
        completed_indices = [i for i, lesson_id in enumerate(ids) if lesson_id in history]
        if not completed_indices:
            return self._get_beginner_recommendations(candidates, n_recommendations)

        matrix = self.lesson_features['tfidf_matrix']
        # Use np.asarray to avoid deprecated np.matrix (sparse .mean returns np.matrix in older scipy)
        user_profile = np.asarray(matrix[completed_indices].mean(axis=0))
        similarities = cosine_similarity(user_profile, matrix).flatten()
        similarity_by_id = dict(zip(ids, similarities))

        ranked = self._sort_key_columns(candidates)
        ranked['_score'] = ranked['id'].astype(int).map(similarity_by_id).fillna(0.0)
        # Most similar first; ties go to the easier, earlier lesson
        ranked = ranked.sort_values(['_score', '_rank', '_order', 'id'], ascending=[False, True, True, True])

        return [
            {
                'lesson_id': int(row['id']),
                'score': float(row['_score']),
                'reason': 'Similar to lessons you completed' if row['_score'] > 0 else 'Next lesson to try',
            }
            for _, row in ranked.head(n_recommendations).iterrows()
        ]

    def get_adaptive_recommendations(self, user_data, all_lessons, n_recommendations=5):
        """
        Recommend lessons at a difficulty that suits the student's quiz performance.

        Args:
            user_data: dict with:
                - completed_lessons: list of completed lesson IDs
                - avg_quiz_score: average quiz score (None/missing -> 70)
            all_lessons: DataFrame of all available lessons
            n_recommendations: number of recommendations to return

        Returns:
            list of {'lesson_id', 'score', 'reason'} dicts
        """
        if all_lessons is None or all_lessons.empty:
            return []
        completed_lessons = user_data.get('completed_lessons', []) or []
        avg_score = user_data.get('avg_quiz_score')
        avg_score = 70 if avg_score is None else avg_score

        if avg_score >= 80:
            target_ranks = {2, 3}
        elif avg_score >= 60:
            target_ranks = {1, 2}
        else:
            target_ranks = {1}

        remaining = all_lessons[~all_lessons['id'].astype(int).isin({int(x) for x in completed_lessons})]
        at_level = remaining[remaining['difficulty_level'].map(difficulty_rank).isin(target_ranks)]
        # If nothing is left at the target level, fall back to any remaining lesson
        candidate_ids = set((at_level if not at_level.empty else remaining)['id'].astype(int))

        recommendations = self.get_content_based_recommendations(
            completed_lessons, all_lessons, n_recommendations, candidate_ids=candidate_ids
        )
        level = RANK_LABEL[min(target_ranks)]
        for rec in recommendations:
            rec['reason'] = f"{rec['reason']} (suits your level: {level})"
        return recommendations

    def _get_beginner_recommendations(self, all_lessons, n=5):
        """Easiest lessons first (then by course order) for students with no history."""
        if all_lessons is None or all_lessons.empty:
            return []
        ranked = self._sort_key_columns(all_lessons).sort_values(['_rank', '_order', 'id'])
        return [
            {
                'lesson_id': int(row['id']),
                'score': 1.0,
                'reason': 'Good lesson to start with'
            }
            for _, row in ranked.head(n).iterrows()
        ]

    def save_model(self):
        """Save the recommendation model (call explicitly; recommendations no longer write to disk)"""
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
            self._signature = None  # unknown catalogue: rebuilt on next use
    
    def save_recommendations_to_json(self, user_data, recommendations, output_path=None, recommendation_type='content_based'):
        """
        Save learning recommendations output to a JSON file
        
        Args:
            user_data: dict with user information (completed_lessons, avg_quiz_score, etc.)
            recommendations: list of recommendation dicts from get_content_based_recommendations() or get_adaptive_recommendations()
            output_path: optional path to save JSON (default: saved_models/learning_recommendations.json)
            recommendation_type: type of recommendation algorithm used ('content_based' or 'adaptive')
        
        Returns:
            str: path where JSON was saved
        """
        if output_path is None:
            output_path = 'app/ml_models/saved_models/learning_recommendations.json'
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Create output data structure
        output_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'recommendation_type': recommendation_type,
            'user_info': {
                'completed_lessons_count': len(user_data.get('completed_lessons', [])),
                'avg_quiz_score': user_data.get('avg_quiz_score'),
                'difficulty_preference': user_data.get('difficulty_preference')
            },
            'recommendations': recommendations,
            'recommendations_count': len(recommendations)
        }
        
        # Save to JSON file
        with open(output_path, 'w') as f:
            json.dump(output_data, f, indent=2)
        
        print(f"Learning recommendations saved to {output_path}")
        return output_path
    
    def save_batch_recommendations_to_json(self, recommendations_list, output_path=None):
        """
        Save multiple user recommendations to a JSON file
        
        Args:
            recommendations_list: list of dicts, each containing 'user_id', 'user_data', and 'recommendations'
            output_path: optional path to save JSON (default: saved_models/learning_recommendations_batch.json)
        
        Returns:
            str: path where JSON was saved
        """
        if output_path is None:
            output_path = 'app/ml_models/saved_models/learning_recommendations_batch.json'
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Create output data structure
        output_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'total_users': len(recommendations_list),
            'user_recommendations': recommendations_list
        }
        
        # Save to JSON file
        with open(output_path, 'w') as f:
            json.dump(output_data, f, indent=2)
        
        print(f"Batch learning recommendations ({len(recommendations_list)} users) saved to {output_path}")
        return output_path
