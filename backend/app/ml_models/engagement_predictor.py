"""
Engagement Prediction Model
Predicts whether a learner is engaged or disengaged based on activity patterns.

Features:
- Multiple ML algorithms (Logistic Regression, SVM, Neural Network)
- Automatic model selection based on performance
- Feature engineering and scaling
- Confidence scoring for predictions
"""
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.metrics import (classification_report, accuracy_score, precision_score, recall_score,
                             f1_score, roc_auc_score, confusion_matrix)
import sklearn
import joblib
import os
import json
from datetime import datetime


FEATURE_NAMES = [
    'time_spent_today',        # minutes today in lessons, practice and learning games
    'avg_quiz_score',          # average lesson-quiz score (%)
    'login_streak',            # consecutive days logged in
    'lessons_completed_week',  # lessons finished in the last 7 days
    'days_inactive',           # days since the last login
    'practice_accuracy',       # % right first time in practice, lesson activities and games (14 days)
    'activities_week',         # practice rounds + learning-game runs in the last 7 days
]

# Valid range for each feature. Values outside are clipped so that unusual
# inputs (e.g. a student inactive for years) cannot produce extreme scores.
FEATURE_BOUNDS = {
    'time_spent_today': (0, 180),
    'avg_quiz_score': (0, 100),
    'login_streak': (0, 365),
    'lessons_completed_week': (0, 20),
    'days_inactive': (0, 60),
    'practice_accuracy': (0, 100),
    'activities_week': (0, 50),
}

# Used only when no trained scaler is available to impute missing values.
FEATURE_DEFAULTS = {
    'time_spent_today': 0.0,
    'avg_quiz_score': 60.0,
    'login_streak': 0.0,
    'lessons_completed_week': 0.0,
    'days_inactive': 0.0,
    'practice_accuracy': 60.0,
    'activities_week': 0.0,
}


def rule_based_engagement_label(features):
    """
    The single rule used to label real (database) students for training.

    A student counts as engaged (1) when they meet at least 4 of these 7
    criteria; a missing quiz score or practice accuracy counts as "not met".
    This is a heuristic, not a teacher judgement, so a model trained on these
    labels learns to reproduce the rule - its accuracy must not be reported
    as real-world accuracy.
    """
    quiz = features.get('avg_quiz_score')
    practice = features.get('practice_accuracy')
    criteria = [
        (features.get('time_spent_today') or 0) >= 15,
        quiz is not None and quiz >= 60,
        (features.get('login_streak') or 0) >= 2,
        (features.get('lessons_completed_week') or 0) >= 1,
        (features.get('days_inactive') if features.get('days_inactive') is not None else 999) <= 3,
        practice is not None and practice >= 60,
        (features.get('activities_week') or 0) >= 2,
    ]
    return 1 if sum(criteria) >= 4 else 0


class EngagementPredictor:
    def __init__(self, model_path='app/ml_models/saved_models/engagement_model.pkl', 
                 algorithm='auto'):
        """
        Initialize the engagement prediction model
        
        Args:
            model_path: Path to save/load the trained model
            algorithm: 'logistic', 'svm', 'neural', or 'auto' for best model selection
        """
        self.model = None
        self.scaler = StandardScaler()
        self.model_path = model_path
        # The algorithm the caller asked for. Loading a saved model below
        # overwrites self.algorithm with the saved one, so training must use
        # this value - otherwise the requested algorithm is silently ignored.
        self.requested_algorithm = algorithm
        self.algorithm = algorithm
        self.feature_names = list(FEATURE_NAMES)
        self.model_metrics = {}
        self._loaded_mtime = None
        
        # Load model if it exists
        if os.path.exists(model_path):
            self.load_model()
    
    def _create_model(self, algorithm='logistic'):
        """
        Create a machine learning model based on specified algorithm
        
        Args:
            algorithm: 'logistic', 'svm', or 'neural'
            
        Returns:
            Initialized model
        """
        if algorithm == 'logistic':
            return LogisticRegression(
                random_state=42,
                max_iter=1000,
                class_weight='balanced'
            )
        elif algorithm == 'svm':
            return SVC(
                kernel='rbf',
                probability=True,
                random_state=42,
                class_weight='balanced'
            )
        elif algorithm == 'neural':
            return MLPClassifier(
                hidden_layer_sizes=(64, 32, 16),
                activation='relu',
                solver='adam',
                max_iter=1000,
                random_state=42,
                early_stopping=True
            )
        else:
            raise ValueError(f"Unknown algorithm: {algorithm}")
    
    def _impute_value(self, index, name):
        """Value used for a missing feature: the training mean when known."""
        mean = getattr(self.scaler, 'mean_', None)
        if mean is not None and index < len(mean):
            return float(mean[index])
        return FEATURE_DEFAULTS.get(name, 0.0)

    def prepare_features(self, user_data):
        """
        Prepare features from user data for prediction.

        Missing values (e.g. no quiz taken yet -> avg_quiz_score None) are
        replaced by the training mean, so after scaling they are neutral
        instead of looking like a 0% score. Values are clipped to
        FEATURE_BOUNDS.

        Returns a one-row DataFrame with named columns so that the
        StandardScaler (fitted with feature names) does not emit warnings.
        """
        row = {}
        for index, name in enumerate(self.feature_names):
            value = user_data.get(name)
            try:
                value = float(value)
            except (TypeError, ValueError):
                value = None
            if value is None or np.isnan(value):
                value = self._impute_value(index, name)
            low, high = FEATURE_BOUNDS.get(name, (-np.inf, np.inf))
            row[name] = float(np.clip(value, low, high))
        return pd.DataFrame([row], columns=self.feature_names)

    def _refresh_if_updated(self):
        """Reload the saved model when the file on disk has changed (e.g. after a retrain)."""
        try:
            mtime = os.path.getmtime(self.model_path)
        except OSError:
            return
        if mtime != self._loaded_mtime:
            self.load_model()
    
    def predict_engagement(self, user_data):
        """
        Predict if user is engaged or disengaged
        
        Args:
            user_data: dict with user activity metrics
        
        Returns:
            dict with prediction result, confidence score, and recommendation
        """
        self._refresh_if_updated()
        if self.model is None:
            # Return default prediction if model not trained yet
            return {
                'engaged': True,
                'confidence': 0.5,
                'message': 'Model not trained yet',
                'recommendation': 'Train model with historical data first'
            }
        
        features = self.prepare_features(user_data)
        features_scaled = self.scaler.transform(features)
        
        prediction = self.model.predict(features_scaled)[0]
        probabilities = self.model.predict_proba(features_scaled)[0]
        confidence = probabilities.max()
        
        # Get probability for each class
        engaged_prob = probabilities[1] if len(probabilities) > 1 else probabilities[0]
        disengaged_prob = probabilities[0] if len(probabilities) > 1 else 1 - probabilities[0]
        
        result = {
            'engaged': bool(prediction),
            'confidence': float(confidence),
            'engaged_probability': float(engaged_prob),
            'disengaged_probability': float(disengaged_prob),
            'recommendation': self._get_recommendation(prediction, confidence, user_data),
            'risk_level': self._get_risk_level(prediction, confidence),
            'algorithm_used': self.algorithm
        }
        
        return result
    
    def _get_risk_level(self, engaged, confidence):
        """
        Calculate risk level based on engagement prediction
        
        Args:
            engaged: Boolean indicating if user is engaged
            confidence: Model confidence score
            
        Returns:
            Risk level string
        """
        if engaged and confidence > 0.8:
            return 'low'
        elif engaged and confidence > 0.6:
            return 'moderate-low'
        elif not engaged and confidence > 0.8:
            return 'critical'
        elif not engaged and confidence > 0.6:
            return 'high'
        else:
            return 'moderate'
    
    def _get_recommendation(self, engaged, confidence, user_data=None):
        """
        Get recommendation based on engagement prediction
        
        Args:
            engaged: Boolean indicating if user is engaged
            confidence: Model confidence score
            user_data: Optional user data for personalized recommendations
        """
        if not engaged and confidence > 0.8:
            recommendations = [
                'Send urgent motivational notification',
                'Offer bonus XP (50 XP) for next lesson completion',
                'Provide personalized encouragement message',
                'Suggest easier lessons to rebuild confidence'
            ]
            
            if user_data and user_data.get('days_inactive', 0) > 3:
                recommendations.append('Send "We miss you!" email')
                
            return self._activity_tips(user_data) + recommendations
            
        elif not engaged and confidence > 0.6:
            recommendations = [
                'Send encouraging notification',
                'Offer small XP bonus (25 XP)',
                'Highlight recent achievements',
                'Suggest interesting lessons based on history'
            ]
            return self._activity_tips(user_data) + recommendations
            
        elif not engaged:
            return self._activity_tips(user_data) + [
                'Monitor activity closely',
                'Send gentle reminder about learning goals'
            ]
        else:
            return [
                'Continue normal learning path',
                'Maintain current engagement strategies'
            ]
    
    @staticmethod
    def _activity_tips(user_data):
        """Suggestions based on the practice activities (only when the data exists)."""
        if not user_data:
            return []
        tips = []
        accuracy = user_data.get('practice_accuracy')
        if accuracy is not None and accuracy < 50:
            tips.append('Practice answers are often wrong first time - try easier rounds and use hints together')
        if (user_data.get('activities_week') or 0) == 0:
            tips.append('No practice or games this week - invite them to a 2-minute practice round')
        return tips

    def train_model(self, training_data, test_size=0.2, cv_folds=5, data_source=None):
        """
        Train the engagement prediction model.

        - The algorithm requested in the constructor is used ('auto' compares
          logistic regression, SVM and a neural network).
        - With 'auto', the algorithm is chosen by stratified k-fold
          cross-validation on the training split only.
        - The reported metrics come from a held-out test split that was not
          used for training or for choosing the algorithm.

        Args:
            training_data: pandas DataFrame with FEATURE_NAMES columns and an 'engaged' label
            test_size: proportion of rows kept aside for the final evaluation
            cv_folds: folds used to choose the algorithm when 'auto'
            data_source: optional description of where the data came from

        Returns:
            dict with training results and metrics
        """
        algorithm = self.requested_algorithm or 'auto'
        if algorithm not in ('auto', 'logistic', 'svm', 'neural'):
            raise ValueError(f"Unknown algorithm: {algorithm}")

        # Always train on the current inputs, even if an older model file with
        # fewer inputs was loaded from disk
        self.feature_names = list(FEATURE_NAMES)
        X = training_data[self.feature_names].astype(float)
        # Real students without a quiz have no score; fill with the column mean
        X = X.fillna(X.mean()).fillna(0.0)
        for name, (low, high) in FEATURE_BOUNDS.items():
            if name in X:
                X[name] = X[name].clip(low, high)
        y = training_data['engaged'].astype(int)

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, stratify=y
        )

        selection = {}
        if algorithm == 'auto':
            folds = StratifiedKFold(n_splits=cv_folds, shuffle=True, random_state=42)
            best_mean = -1.0
            chosen = None
            for algo in ('logistic', 'svm', 'neural'):  # simplest first: wins ties
                pipeline = make_pipeline(StandardScaler(), self._create_model(algo))
                scores = cross_val_score(pipeline, X_train, y_train, cv=folds, scoring='accuracy')
                selection[algo] = {
                    'cv_accuracy_mean': float(scores.mean()),
                    'cv_accuracy_std': float(scores.std()),
                }
                if scores.mean() > best_mean + 1e-9:
                    best_mean, chosen = scores.mean(), algo
            algorithm = chosen

        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        self.model = self._create_model(algorithm)
        self.model.fit(X_train_scaled, y_train)
        self.algorithm = algorithm

        y_pred = self.model.predict(X_test_scaled)
        y_prob = self.model.predict_proba(X_test_scaled)[:, 1]
        try:
            roc_auc = float(roc_auc_score(y_test, y_prob))
        except ValueError:  # only one class in the test split
            roc_auc = None

        self.model_metrics = {
            'algorithm': algorithm,
            'best_algorithm': algorithm,
            'accuracy': float(accuracy_score(y_test, y_pred)),
            'precision': float(precision_score(y_test, y_pred, average='weighted', zero_division=0)),
            'recall': float(recall_score(y_test, y_pred, average='weighted', zero_division=0)),
            'f1_score': float(f1_score(y_test, y_pred, average='weighted', zero_division=0)),
            'roc_auc': roc_auc,
            'confusion_matrix': confusion_matrix(y_test, y_pred, labels=[0, 1]).tolist(),
            'classification_report': classification_report(y_test, y_pred, zero_division=0),
            'evaluation': 'held-out test split, not used for training or model selection',
            'training_samples': int(len(X_train)),
            'test_samples': int(len(X_test)),
            'model_selection': selection or None,
            'data_source': data_source,
            'sklearn_version': sklearn.__version__,
        }

        if hasattr(self.model, 'coef_'):
            coefficients = dict(zip(self.feature_names, (float(c) for c in self.model.coef_[0])))
            self.model_metrics['coefficients'] = coefficients
            self.model_metrics['feature_importance'] = {k: abs(v) for k, v in coefficients.items()}

        self.save_model()

        return {
            'success': True,
            'metrics': self.model_metrics,
            'training_samples': len(X_train),
            'test_samples': len(X_test),
            'trained_at': datetime.utcnow().isoformat()
        }

    def save_model(self):
        """Save the trained model and scaler"""
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'algorithm': self.algorithm,
            'metrics': self.model_metrics,
            'feature_names': self.feature_names,
            'saved_at': datetime.utcnow().isoformat()
        }
        
        joblib.dump(model_data, self.model_path)
        self._loaded_mtime = os.path.getmtime(self.model_path)
        print(f"Model saved to {self.model_path}")
    
    def load_model(self):
        """Load the trained model and scaler"""
        try:
            model_data = joblib.load(self.model_path)
            self.model = model_data.get('model')
            self.scaler = model_data.get('scaler')
            self.algorithm = model_data.get('algorithm', 'logistic')
            self.model_metrics = model_data.get('metrics', {})
            self.feature_names = model_data.get('feature_names', self.feature_names)
            self._loaded_mtime = os.path.getmtime(self.model_path)
            print(f"Model loaded from {self.model_path} (algorithm: {self.algorithm})")
            return True
        except Exception as e:
            print(f"Error loading model: {str(e)}")
            return False
    
    def get_model_info(self):
        """Get information about the current model"""
        self._refresh_if_updated()
        if self.model is None:
            return {
                'trained': False,
                'message': 'Model not trained yet'
            }
        
        return {
            'trained': True,
            'algorithm': self.algorithm,
            'metrics': self.model_metrics,
            'feature_names': self.feature_names,
            'model_path': self.model_path
        }
    
    def save_prediction_to_json(self, user_data, prediction_result, output_path=None):
        """
        Save engagement prediction output to a JSON file
        
        Args:
            user_data: dict with user activity metrics used for prediction
            prediction_result: dict with prediction output from predict_engagement()
            output_path: optional path to save JSON (default: saved_models/engagement_predictions.json)
        
        Returns:
            str: path where JSON was saved
        """
        if output_path is None:
            output_path = 'app/ml_models/saved_models/engagement_predictions.json'
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Create output data structure
        output_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'model_info': {
                'algorithm': self.algorithm,
                'metrics': self.model_metrics
            },
            'input_features': user_data,
            'prediction': prediction_result
        }
        
        # Save to JSON file
        with open(output_path, 'w') as f:
            json.dump(output_data, f, indent=2)
        
        print(f"Engagement prediction saved to {output_path}")
        return output_path
    
    def save_batch_predictions_to_json(self, predictions_list, output_path=None):
        """
        Save multiple engagement predictions to a JSON file
        
        Args:
            predictions_list: list of dicts, each containing 'user_data' and 'prediction'
            output_path: optional path to save JSON (default: saved_models/engagement_predictions_batch.json)
        
        Returns:
            str: path where JSON was saved
        """
        if output_path is None:
            output_path = 'app/ml_models/saved_models/engagement_predictions_batch.json'
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Create output data structure
        output_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'model_info': {
                'algorithm': self.algorithm,
                'metrics': self.model_metrics
            },
            'predictions_count': len(predictions_list),
            'predictions': predictions_list
        }
        
        # Save to JSON file
        with open(output_path, 'w') as f:
            json.dump(output_data, f, indent=2)
        
        print(f"Batch engagement predictions ({len(predictions_list)} items) saved to {output_path}")
        return output_path


def generate_synthetic_training_data(n_samples=1000, random_state=42):
    """
    Generate synthetic training data with naturally overlapping class
    distributions.

    Strategy: derive all seven features from a shared latent engagement score
    (+ per-feature noise) so the class boundary is genuinely fuzzy.  About
    12 % of labels are flipped to model real-world annotation uncertainty.

    Time per day is scaled to this platform's activities (a lesson takes
    about 5-10 minutes, a practice round 2-3 and a games run about 5), so an
    engaged student spends around 30 minutes a day, not an hour.

    Because the labels come from this formula, accuracy on this data shows
    how well a model recovers the formula - not how well it predicts real
    students. About 12 % of labels are flipped, so no model can exceed
    roughly 88 % accuracy on it.

    Args:
        n_samples: Number of samples to generate
        random_state: Seed; pass a different value to get fresh, unseen data

    Returns:
        pandas DataFrame with synthetic user engagement data
    """
    rng = np.random.default_rng(random_state)

    # Latent engagement: values in [0, 1]; 0 = fully disengaged, 1 = fully engaged.
    # Use a bimodal-ish distribution with a broad overlap zone.
    latent = np.concatenate([
        rng.beta(2.5, 1.5, size=int(n_samples * 0.55)),   # skewed high (engaged-ish)
        rng.beta(1.5, 3.0, size=n_samples - int(n_samples * 0.55)),  # skewed low
    ])
    rng.shuffle(latent)

    time_spent        = np.clip(latent * 40 + rng.normal(0, 8, n_samples), 0, 120)
    avg_quiz_score    = np.clip(latent * 45 + 40 + rng.normal(0, 16, n_samples), 0, 100)
    login_streak_raw  = latent * 10 + rng.normal(0, 3.5, n_samples)
    lessons_raw       = latent * 5  + rng.normal(0, 1.8, n_samples)
    days_inactive_raw = (1 - latent) * 7 + rng.normal(0, 2.5, n_samples)
    practice_accuracy = np.clip(latent * 40 + 45 + rng.normal(0, 15, n_samples), 0, 100)
    activities_raw    = latent * 8 + rng.normal(0, 2.5, n_samples)

    login_streak  = np.clip(login_streak_raw,  0, 30).astype(int)
    lessons       = np.clip(lessons_raw,       0, 14).astype(int)
    days_inactive = np.clip(days_inactive_raw, 0, 14).astype(int)
    activities    = np.clip(activities_raw,    0, 30).astype(int)

    # Deterministic label from the latent score (threshold at 0.50)
    labels = (latent >= 0.50).astype(int)

    # Flip ~12 % of labels to model real-world noise / ambiguous students
    flip_mask = rng.random(n_samples) < 0.12
    labels[flip_mask] = 1 - labels[flip_mask]

    df = pd.DataFrame({
        'time_spent_today':       time_spent,
        'avg_quiz_score':         avg_quiz_score,
        'login_streak':           login_streak,
        'lessons_completed_week': lessons,
        'days_inactive':          days_inactive,
        'practice_accuracy':      practice_accuracy,
        'activities_week':        activities,
        'engaged':                labels,
    })
    return df


if __name__ == '__main__':
    # Example usage and testing
    print("=== Engagement Predictor Demo ===\n")
    
    # Generate synthetic data
    print("Generating synthetic training data...")
    training_data = generate_synthetic_training_data(n_samples=1000)
    print(f"Generated {len(training_data)} samples")
    print(f"Engaged users: {training_data['engaged'].sum()}")
    print(f"Disengaged users: {len(training_data) - training_data['engaged'].sum()}\n")
    
    # Train model with auto selection
    print("Training model with automatic algorithm selection...")
    predictor = EngagementPredictor(algorithm='auto')
    results = predictor.train_model(training_data)
    
    print("\n=== Training Results ===")
    print(f"Best Algorithm: {results['metrics'].get('best_algorithm', 'N/A')}")
    
    if 'logistic' in results['metrics']:
        print("\nAlgorithm Comparison:")
        for algo in ['logistic', 'svm', 'neural']:
            if algo in results['metrics']:
                print(f"\n{algo.upper()}:")
                print(f"  Accuracy: {results['metrics'][algo]['accuracy']:.4f}")
                print(f"  F1 Score: {results['metrics'][algo]['f1_score']:.4f}")
    
    # Test predictions
    print("\n\n=== Test Predictions ===")
    
    test_cases = [
        {
            'name': 'Highly Engaged User',
            'data': {
                'time_spent_today': 60,
                'avg_quiz_score': 85,
                'login_streak': 10,
                'lessons_completed_week': 5,
                'days_inactive': 0
            }
        },
        {
            'name': 'Disengaged User',
            'data': {
                'time_spent_today': 5,
                'avg_quiz_score': 45,
                'login_streak': 0,
                'lessons_completed_week': 1,
                'days_inactive': 5
            }
        },
        {
            'name': 'Moderately Active User',
            'data': {
                'time_spent_today': 25,
                'avg_quiz_score': 65,
                'login_streak': 3,
                'lessons_completed_week': 2,
                'days_inactive': 1
            }
        }
    ]
    
    for test_case in test_cases:
        print(f"\n{test_case['name']}:")
        prediction = predictor.predict_engagement(test_case['data'])
        print(f"  Engaged: {prediction['engaged']}")
        print(f"  Confidence: {prediction['confidence']:.2%}")
        print(f"  Risk Level: {prediction['risk_level']}")
        print(f"  Recommendations: {prediction['recommendation'][:2]}")
