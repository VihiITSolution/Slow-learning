"""
Train Engagement Prediction Model
Script to train the ML model with historical or synthetic data

Note: This script can be run independently without Flask app context
"""
import sys
import os

# Add parent directory to path to allow imports
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Load environment variables from .env file if it exists
from pathlib import Path
env_file = Path(__file__).parent / '.env'
if env_file.exists():
    from dotenv import load_dotenv
    load_dotenv(env_file)

# Import only the ML model components (no Flask dependencies)
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import joblib


def generate_synthetic_training_data(n_samples=1000):
    """
    Generate realistic synthetic training data with overlapping distributions
    and edge cases to better simulate real-world user behavior patterns.
    
    Args:
        n_samples: Number of samples to generate
        
    Returns:
        pandas DataFrame with synthetic user engagement data
    """
    np.random.seed(42)
    
    data = []
    
    for i in range(n_samples):
        # Use different random seed for each sample for more variety
        rand = np.random.random()
        
        # Create more realistic overlapping distributions
        # 55% engaged, 45% disengaged (more balanced)
        if rand < 0.55:
            # ENGAGED USERS - but with more variance and edge cases
            
            # 70% highly engaged
            if np.random.random() < 0.7:
                time_spent = np.random.normal(50, 20)  # More variance
                quiz_score = np.random.normal(78, 12)
                streak = np.random.poisson(8) + 1
                lessons_completed = np.random.poisson(4) + 1
                days_inactive = np.random.poisson(0.3)
            # 20% moderately engaged (edge cases)
            elif np.random.random() < 0.67:
                time_spent = np.random.normal(30, 15)  # Lower but still engaged
                quiz_score = np.random.normal(68, 15)  # Okay scores
                streak = np.random.poisson(4) + 1
                lessons_completed = np.random.poisson(2) + 1
                days_inactive = np.random.poisson(1)
            # 10% struggling but engaged (hard cases)
            else:
                time_spent = np.random.normal(35, 12)
                quiz_score = np.random.normal(62, 18)  # Lower scores but trying
                streak = np.random.poisson(3)
                lessons_completed = np.random.poisson(2)
                days_inactive = np.random.poisson(1.5)
            
            engaged = 1
        else:
            # DISENGAGED USERS - with more variance
            
            # 60% clearly disengaged
            if np.random.random() < 0.6:
                time_spent = np.random.normal(8, 6)
                quiz_score = np.random.normal(52, 18)
                streak = np.random.poisson(0.5)
                lessons_completed = np.random.poisson(0.5)
                days_inactive = np.random.poisson(4) + 1
            # 25% borderline disengaged (edge cases)
            elif np.random.random() < 0.625:
                time_spent = np.random.normal(20, 12)  # Some activity
                quiz_score = np.random.normal(60, 16)  # Passing but low
                streak = np.random.poisson(1)
                lessons_completed = np.random.poisson(1)
                days_inactive = np.random.poisson(2.5)
            # 15% recently disengaged (used to be active)
            else:
                time_spent = np.random.normal(15, 10)
                quiz_score = np.random.normal(65, 15)  # History of good scores
                streak = np.random.poisson(0.8)
                lessons_completed = np.random.poisson(1)
                days_inactive = np.random.poisson(3) + 2  # Key indicator
            
            engaged = 0
        
        # Add noise to make it more realistic (5% of samples get random noise)
        if np.random.random() < 0.05:
            time_spent += np.random.normal(0, 10)
            quiz_score += np.random.normal(0, 8)
        
        # Ensure values are realistic and within bounds
        data.append({
            'time_spent_today': max(0, min(180, time_spent)),  # Cap at 3 hours
            'avg_quiz_score': np.clip(quiz_score, 0, 100),
            'login_streak': max(0, min(365, int(streak))),  # Cap at 1 year
            'lessons_completed_week': max(0, min(20, int(lessons_completed))),
            'days_inactive': max(0, min(60, int(days_inactive))),  # Cap at 2 months
            'engaged': engaged
        })
    
    return pd.DataFrame(data)


def create_model(algorithm='logistic'):
    """Create ML model based on algorithm type"""
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


def compare_models(X_train, y_train, X_test, y_test):
    """Compare different algorithms and select the best one"""
    algorithms = ['logistic', 'svm', 'neural']
    results = {}
    best_model = None
    best_score = 0
    best_algo = None
    
    for algo in algorithms:
        print(f"Training {algo} model...")
        model = create_model(algo)
        model.fit(X_train, y_train)
        
        # Evaluate
        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred, average='weighted')
        
        # Combined score
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
            best_algo = algo
    
    results['best_algorithm'] = best_algo
    return best_model, best_algo, results


def train_with_synthetic_data(n_samples=1000, algorithm='auto'):
    """
    Train model with synthetic data
    
    Args:
        n_samples: Number of synthetic samples to generate
        algorithm: ML algorithm to use ('auto', 'logistic', 'svm', 'neural')
    """
    print("="*60)
    print("ENGAGEMENT PREDICTION MODEL TRAINING")
    print("="*60)
    print()
    
    # Generate synthetic data
    print(f"Step 1: Generating {n_samples} synthetic training samples...")
    training_data = generate_synthetic_training_data(n_samples)
    
    print(f"✓ Generated {len(training_data)} samples")
    print(f"  - Engaged users: {training_data['engaged'].sum()}")
    print(f"  - Disengaged users: {len(training_data) - training_data['engaged'].sum()}")
    print()
    
    # Show data statistics
    print("Data Statistics:")
    print(training_data.describe())
    print()
    
    # Prepare data
    feature_names = [
        'time_spent_today',
        'avg_quiz_score', 
        'login_streak',
        'lessons_completed_week',
        'days_inactive'
    ]
    
    X = training_data[feature_names]
    y = training_data['engaged']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train model
    print(f"Step 2: Training model (algorithm: {algorithm})...")
    
    if algorithm == 'auto':
        model, best_algo, metrics = compare_models(
            X_train_scaled, y_train, X_test_scaled, y_test
        )
        algorithm = best_algo
    else:
        print(f"Training {algorithm} model...")
        model = create_model(algorithm)
        model.fit(X_train_scaled, y_train)
        
        # Evaluate
        y_pred = model.predict(X_test_scaled)
        metrics = {
            'algorithm': algorithm,
            'accuracy': accuracy_score(y_test, y_pred),
            'precision': precision_score(y_test, y_pred, average='weighted'),
            'recall': recall_score(y_test, y_pred, average='weighted'),
            'f1_score': f1_score(y_test, y_pred, average='weighted')
        }
    
    print("\n✓ Training completed!")
    print()
    
    # Save model
    model_dir = 'app/ml_models/saved_models'
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, 'engagement_model.pkl')
    
    model_data = {
        'model': model,
        'scaler': scaler,
        'algorithm': algorithm,
        'metrics': metrics,
        'feature_names': feature_names
    }
    
    joblib.dump(model_data, model_path)
    print(f"Model saved to: {model_path}")
    print()
    
    # Display results
    print("="*60)
    print("TRAINING RESULTS")
    print("="*60)
    
    if 'best_algorithm' in metrics:
        print(f"\nBest Algorithm Selected: {metrics['best_algorithm'].upper()}")
        print()
        
        print("Algorithm Comparison:")
        print("-" * 60)
        for algo in ['logistic', 'svm', 'neural']:
            if algo in metrics:
                m = metrics[algo]
                print(f"\n{algo.upper()}:")
                print(f"  Accuracy:  {m['accuracy']:.4f}")
                print(f"  Precision: {m['precision']:.4f}")
                print(f"  Recall:    {m['recall']:.4f}")
                print(f"  F1 Score:  {m['f1_score']:.4f}")
    else:
        print(f"\nAlgorithm: {metrics.get('algorithm', algorithm).upper()}")
        print(f"Accuracy:  {metrics.get('accuracy', 0):.4f}")
        print(f"Precision: {metrics.get('precision', 0):.4f}")
        print(f"Recall:    {metrics.get('recall', 0):.4f}")
        print(f"F1 Score:  {metrics.get('f1_score', 0):.4f}")
    
    print()
    print(f"Training Samples: {len(X_train)}")
    print(f"Test Samples: {len(X_test)}")
    print()
    
    # Test predictions
    print("="*60)
    print("SAMPLE PREDICTIONS")
    print("="*60)
    
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
            'name': 'Disengaged User (Critical)',
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
        },
        {
            'name': 'At-Risk User',
            'data': {
                'time_spent_today': 10,
                'avg_quiz_score': 50,
                'login_streak': 1,
                'lessons_completed_week': 1,
                'days_inactive': 3
            }
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{i}. {test_case['name']}")
        print("-" * 40)
        
        # Show input features
        for key, value in test_case['data'].items():
            print(f"   {key}: {value}")
        
        # Make prediction
        features = np.array([[
            test_case['data']['time_spent_today'],
            test_case['data']['avg_quiz_score'],
            test_case['data']['login_streak'],
            test_case['data']['lessons_completed_week'],
            test_case['data']['days_inactive']
        ]])
        features_scaled = scaler.transform(features)
        
        prediction = model.predict(features_scaled)[0]
        probabilities = model.predict_proba(features_scaled)[0]
        confidence = probabilities.max()
        
        print()
        status = "✓ ENGAGED" if prediction else "⚠ DISENGAGED"
        print(f"   Prediction: {status}")
        print(f"   Confidence: {confidence:.2%}")
    
    print()
    print("="*60)
    print("✓ Model training and testing completed successfully!")
    print(f"Model saved to: {model_path}")
    print("="*60)


def train_with_database_data(algorithm='auto'):
    """
    Train model with real data from database
    Extracts user activity metrics and engagement patterns
    
    Args:
        algorithm: ML algorithm to use ('auto', 'logistic', 'svm', 'neural')
    """
    print("="*60)
    print("TRAINING WITH REAL DATABASE DATA")
    print("="*60)
    print()
    
    try:
        # Import Flask dependencies
        from app import create_app, db
        from app.models.user import User
        from app.models.progress import Progress
        from app.models.quiz import QuizAttempt
        from sqlalchemy import func
        from datetime import datetime, timedelta
        
        # Create Flask app context
        app = create_app()
        
        with app.app_context():
            print("Step 1: Extracting user data from database...")
            
            # Get all users
            users = User.query.all()
            
            if len(users) < 10:
                print(f"⚠ Warning: Only {len(users)} users found in database.")
                print("For better model performance, consider using synthetic data or adding more users.")
                print()
            
            training_data = []
            current_time = datetime.now()
            
            for user in users:
                # Skip admin/teacher accounts
                if user.role in ['admin', 'teacher']:
                    continue
                
                # Calculate engagement metrics
                
                # 1. Time spent today (approximate from recent progress entries)
                today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
                today_progress = Progress.query.filter(
                    Progress.user_id == user.id,
                    Progress.last_accessed >= today_start
                ).all()
                time_spent_today = sum([p.time_spent or 0 for p in today_progress]) / 60  # Convert to minutes
                
                # 2. Average quiz score
                quiz_attempts = QuizAttempt.query.filter_by(user_id=user.id).all()
                if quiz_attempts:
                    avg_quiz_score = sum([q.score for q in quiz_attempts]) / len(quiz_attempts)
                else:
                    avg_quiz_score = 0
                
                # 3. Login streak (use current_streak from user)
                login_streak = user.current_streak or 0
                
                # 4. Lessons completed this week
                week_start = current_time - timedelta(days=7)
                lessons_completed_week = Progress.query.filter(
                    Progress.user_id == user.id,
                    Progress.status == 'completed',
                    Progress.completed_at >= week_start
                ).count()
                
                # 5. Days inactive
                if user.last_login:
                    days_inactive = (current_time - user.last_login).days
                else:
                    days_inactive = 365  # No login recorded = very inactive
                
                # Determine engagement label based on multiple criteria
                # A user is engaged if they meet at least 3 of these 5 criteria:
                engagement_criteria = [
                    time_spent_today >= 15,           # At least 15 min today
                    avg_quiz_score >= 60,             # Average score >= 60%
                    login_streak >= 2,                # Streak of 2+ days
                    lessons_completed_week >= 1,      # At least 1 lesson/week
                    days_inactive <= 3                # Active in last 3 days
                ]
                
                criteria_met = sum(engagement_criteria)
                engaged = 1 if criteria_met >= 3 else 0
                
                training_data.append({
                    'user_id': user.id,
                    'username': user.username,
                    'time_spent_today': time_spent_today,
                    'avg_quiz_score': avg_quiz_score,
                    'login_streak': login_streak,
                    'lessons_completed_week': lessons_completed_week,
                    'days_inactive': days_inactive,
                    'engaged': engaged
                })
            
            if not training_data:
                print("❌ No student users found in database!")
                print("Please add some student users or use synthetic data.")
                return
            
            # Convert to DataFrame
            df = pd.DataFrame(training_data)
            
            print(f"✓ Extracted data for {len(df)} users")
            print(f"  - Engaged users: {df['engaged'].sum()}")
            print(f"  - Disengaged users: {len(df) - df['engaged'].sum()}")
            print()
            
            # Check if we have enough data and both classes
            if len(df) < 5:
                print("⚠ Warning: Too few users for reliable training (< 5)")
                print("Consider using synthetic data or adding more users.")
                return
            
            if df['engaged'].sum() == 0 or df['engaged'].sum() == len(df):
                print("⚠ Warning: All users have the same engagement status!")
                print("Model needs both engaged and disengaged users to train properly.")
                print("Consider using synthetic data or waiting for more varied user activity.")
                return
            
            # Show data statistics
            print("Data Statistics:")
            print(df[['time_spent_today', 'avg_quiz_score', 'login_streak', 
                      'lessons_completed_week', 'days_inactive', 'engaged']].describe())
            print()
            
            # Prepare features
            feature_names = [
                'time_spent_today',
                'avg_quiz_score',
                'login_streak',
                'lessons_completed_week',
                'days_inactive'
            ]
            
            X = df[feature_names]
            y = df['engaged']
            
            # Split data (with minimum 20% test or at least 1 sample)
            test_size = max(0.2, min(2 / len(df), 0.4))  # Adaptive test size
            
            try:
                X_train, X_test, y_train, y_test = train_test_split(
                    X, y, test_size=test_size, random_state=42, stratify=y
                )
            except ValueError:
                # If stratify fails (too few samples), split without stratify
                X_train, X_test, y_train, y_test = train_test_split(
                    X, y, test_size=test_size, random_state=42
                )
            
            # Scale features
            scaler = StandardScaler()
            X_train_scaled = scaler.fit_transform(X_train)
            X_test_scaled = scaler.transform(X_test)
            
            # Train model
            print(f"Step 2: Training model (algorithm: {algorithm})...")
            
            if algorithm == 'auto':
                model, best_algo, metrics = compare_models(
                    X_train_scaled, y_train, X_test_scaled, y_test
                )
                algorithm = best_algo
            else:
                print(f"Training {algorithm} model...")
                model = create_model(algorithm)
                model.fit(X_train_scaled, y_train)
                
                # Evaluate
                y_pred = model.predict(X_test_scaled)
                metrics = {
                    'algorithm': algorithm,
                    'accuracy': accuracy_score(y_test, y_pred),
                    'precision': precision_score(y_test, y_pred, average='weighted', zero_division=0),
                    'recall': recall_score(y_test, y_pred, average='weighted', zero_division=0),
                    'f1_score': f1_score(y_test, y_pred, average='weighted', zero_division=0)
                }
            
            print("\n✓ Training completed!")
            print()
            
            # Save model
            model_dir = 'app/ml_models/saved_models'
            os.makedirs(model_dir, exist_ok=True)
            model_path = os.path.join(model_dir, 'engagement_model.pkl')
            
            model_data = {
                'model': model,
                'scaler': scaler,
                'algorithm': algorithm,
                'metrics': metrics,
                'feature_names': feature_names,
                'trained_with': 'real_data',
                'training_date': datetime.now().isoformat(),
                'num_samples': len(df)
            }
            
            joblib.dump(model_data, model_path)
            print(f"Model saved to: {model_path}")
            print()
            
            # Display results
            print("="*60)
            print("TRAINING RESULTS")
            print("="*60)
            
            if 'best_algorithm' in metrics:
                print(f"\nBest Algorithm Selected: {metrics['best_algorithm'].upper()}")
                print()
                
                print("Algorithm Comparison:")
                print("-" * 60)
                for algo in ['logistic', 'svm', 'neural']:
                    if algo in metrics:
                        m = metrics[algo]
                        print(f"\n{algo.upper()}:")
                        print(f"  Accuracy:  {m['accuracy']:.4f}")
                        print(f"  Precision: {m['precision']:.4f}")
                        print(f"  Recall:    {m['recall']:.4f}")
                        print(f"  F1 Score:  {m['f1_score']:.4f}")
            else:
                print(f"\nAlgorithm: {metrics.get('algorithm', algorithm).upper()}")
                print(f"Accuracy:  {metrics.get('accuracy', 0):.4f}")
                print(f"Precision: {metrics.get('precision', 0):.4f}")
                print(f"Recall:    {metrics.get('recall', 0):.4f}")
                print(f"F1 Score:  {metrics.get('f1_score', 0):.4f}")
            
            print()
            print(f"Training Samples: {len(X_train)}")
            print(f"Test Samples: {len(X_test)}")
            print()
            print("="*60)
            print("✓ Model training completed successfully with real data!")
            print(f"Model saved to: {model_path}")
            print("="*60)
            
    except ImportError as e:
        print(f"❌ Error importing Flask dependencies: {e}")
        print("Please ensure Flask app is properly configured.")
    except Exception as e:
        print(f"❌ Error during training: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Train Engagement Prediction Model')
    parser.add_argument(
        '--samples',
        type=int,
        default=1000,
        help='Number of synthetic samples to generate (default: 1000)'
    )
    parser.add_argument(
        '--algorithm',
        type=str,
        default='auto',
        choices=['auto', 'logistic', 'svm', 'neural'],
        help='ML algorithm to use (default: auto)'
    )
    parser.add_argument(
        '--real-data',
        action='store_true',
        help='Use real database data instead of synthetic (requires populated DB)'
    )
    
    args = parser.parse_args()
    
    if args.real_data:
        train_with_database_data(args.algorithm)
    else:
        train_with_synthetic_data(args.samples, args.algorithm)
