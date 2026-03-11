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
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.metrics import classification_report, accuracy_score, precision_score, recall_score, f1_score
import joblib
import os
import json
from datetime import datetime


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
        self.algorithm = algorithm
        self.feature_names = [
            'time_spent_today',
            'avg_quiz_score', 
            'login_streak',
            'lessons_completed_week',
            'days_inactive'
        ]
        self.model_metrics = {}
        
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
    
    def prepare_features(self, user_data):
        """
        Prepare features from user data for prediction
        
        Args:
            user_data: dict with keys:
                - time_spent_today: minutes spent today
                - avg_quiz_score: average quiz score (0-100)
                - login_streak: current login streak
                - lessons_completed_week: lessons completed this week
                - days_inactive: days since last activity
        
        Returns:
            numpy array of features
        """
        features = []
        for feature_name in self.feature_names:
            features.append(user_data.get(feature_name, 0))
        
        return np.array(features).reshape(1, -1)
    
    def engineer_features(self, df):
        """
        Add engineered features to improve model performance
        
        Args:
            df: DataFrame with base features
            
        Returns:
            DataFrame with additional engineered features
        """
        # Interaction features
        df['engagement_score'] = (
            df['time_spent_today'] * 0.3 + 
            df['avg_quiz_score'] * 0.3 + 
            df['login_streak'] * 10 +
            df['lessons_completed_week'] * 20 - 
            df['days_inactive'] * 15
        )
        
        # Activity consistency
        df['activity_ratio'] = df['lessons_completed_week'] / (df['days_inactive'] + 1)
        
        # Performance indicator
        df['performance_indicator'] = (df['avg_quiz_score'] / 100) * df['login_streak']
        
        return df
    
    def predict_engagement(self, user_data):
        """
        Predict if user is engaged or disengaged
        
        Args:
            user_data: dict with user activity metrics
        
        Returns:
            dict with prediction result, confidence score, and recommendation
        """
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
                
            return recommendations
            
        elif not engaged and confidence > 0.6:
            return [
                'Send encouraging notification',
                'Offer small XP bonus (25 XP)',
                'Highlight recent achievements',
                'Suggest interesting lessons based on history'
            ]
            
        elif not engaged:
            return [
                'Monitor activity closely',
                'Send gentle reminder about learning goals'
            ]
        else:
            return [
                'Continue normal learning path',
                'Maintain current engagement strategies'
            ]
    
    def train_model(self, training_data, test_size=0.2):
        """
        Train the engagement prediction model with algorithm comparison
        
        Args:
            training_data: pandas DataFrame with features and labels
            test_size: Proportion of data to use for testing
        
        Returns:
            dict with training results and metrics
        """
        # Prepare data
        X = training_data[self.feature_names]
        y = training_data['engaged']
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, stratify=y
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train and compare models if 'auto' is selected
        if self.algorithm == 'auto':
            best_model, best_score, all_results = self._compare_models(
                X_train_scaled, y_train, X_test_scaled, y_test
            )
            self.model = best_model
            self.model_metrics = all_results
        else:
            # Train single specified model
            self.model = self._create_model(self.algorithm)
            self.model.fit(X_train_scaled, y_train)
            
            # Evaluate
            y_pred = self.model.predict(X_test_scaled)
            self.model_metrics = {
                'algorithm': self.algorithm,
                'accuracy': accuracy_score(y_test, y_pred),
                'precision': precision_score(y_test, y_pred, average='weighted'),
                'recall': recall_score(y_test, y_pred, average='weighted'),
                'f1_score': f1_score(y_test, y_pred, average='weighted'),
                'classification_report': classification_report(y_test, y_pred)
            }
        
        # Feature importance (for logistic regression)
        if hasattr(self.model, 'coef_'):
            feature_importance = dict(zip(
                self.feature_names,
                abs(self.model.coef_[0])
            ))
            self.model_metrics['feature_importance'] = feature_importance
        
        # Save model
        self.save_model()
        
        return {
            'success': True,
            'metrics': self.model_metrics,
            'training_samples': len(X_train),
            'test_samples': len(X_test),
            'trained_at': datetime.utcnow().isoformat()
        }
    
    def _compare_models(self, X_train, y_train, X_test, y_test):
        """
        Compare different algorithms and select the best one
        
        Returns:
            best_model, best_score, all_results dict
        """
        algorithms = ['logistic', 'svm', 'neural']
        results = {}
        best_model = None
        best_score = 0
        
        for algo in algorithms:
            print(f"Training {algo} model...")
            model = self._create_model(algo)
            model.fit(X_train, y_train)
            
            # Evaluate
            y_pred = model.predict(X_test)
            accuracy = accuracy_score(y_test, y_pred)
            f1 = f1_score(y_test, y_pred, average='weighted')
            
            # Combined score (accuracy + f1) / 2
            combined_score = (accuracy + f1) / 2
            
            results[algo] = {
                'accuracy': accuracy,
                'precision': precision_score(y_test, y_pred, average='weighted'),
                'recall': recall_score(y_test, y_pred, average='weighted'),
                'f1_score': f1,
                'combined_score': combined_score
            }
            
            if combined_score > best_score:
                best_score = combined_score
                best_model = model
                self.algorithm = algo
        
        results['best_algorithm'] = self.algorithm
        results['comparison_completed'] = True
        
        return best_model, best_score, results
    
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
            print(f"Model loaded from {self.model_path} (algorithm: {self.algorithm})")
            return True
        except Exception as e:
            print(f"Error loading model: {str(e)}")
            return False
    
    def get_model_info(self):
        """Get information about the current model"""
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


def generate_synthetic_training_data(n_samples=1000):
    """
    Generate synthetic training data for model development and testing
    
    Args:
        n_samples: Number of samples to generate
        
    Returns:
        pandas DataFrame with synthetic user engagement data
    """
    np.random.seed(42)
    
    data = []
    
    for _ in range(n_samples):
        # Generate realistic patterns
        
        # Engaged users (60% of data)
        if np.random.random() < 0.6:
            time_spent = np.random.normal(45, 15)  # Average 45 min
            quiz_score = np.random.normal(75, 10)  # Good scores
            streak = np.random.poisson(7) + 1  # Active streaks
            lessons_completed = np.random.poisson(4) + 1
            days_inactive = np.random.poisson(0.5)
            engaged = 1
        else:
            # Disengaged users (40% of data)
            time_spent = np.random.normal(10, 8)  # Low activity
            quiz_score = np.random.normal(55, 15)  # Lower scores
            streak = np.random.poisson(1)  # Low or no streak
            lessons_completed = np.random.poisson(1)
            days_inactive = np.random.poisson(3) + 1
            engaged = 0
        
        # Ensure values are realistic
        data.append({
            'time_spent_today': max(0, time_spent),
            'avg_quiz_score': np.clip(quiz_score, 0, 100),
            'login_streak': max(0, int(streak)),
            'lessons_completed_week': max(0, int(lessons_completed)),
            'days_inactive': max(0, int(days_inactive)),
            'engaged': engaged
        })
    
    return pd.DataFrame(data)


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
