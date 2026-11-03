"""
Train the Engagement Prediction Model from the command line.

Uses exactly the same code as the app (app.ml_models.engagement_predictor),
so the synthetic data, the labelling rule, the algorithm selection and the
saved model file are identical to what the teacher "Retrain" button produces.

Run from the backend folder:

    python train_engagement_model.py                          # synthetic data, best algorithm by CV
    python train_engagement_model.py --samples 3000 --algorithm logistic
    python train_engagement_model.py --evaluate               # also test on fresh, unseen synthetic data
    python train_engagement_model.py --real-data              # students in the database (rule-labelled)

Important for reporting results: synthetic labels come from a formula and
real-data labels come from a rule (rule_based_engagement_label). Neither is a
teacher's judgement, so the accuracy printed here is NOT real-world accuracy.
"""
import argparse
import os
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))
os.chdir(BACKEND_DIR)  # the model path is relative to the backend folder

env_file = BACKEND_DIR / '.env'
if env_file.exists():
    from dotenv import load_dotenv
    load_dotenv(env_file)

# Importing the app package reads the config, which requires these keys. The
# synthetic-data path never starts the app, so placeholders are enough there.
os.environ.setdefault('SECRET_KEY', 'train-engagement-model')
os.environ.setdefault('JWT_SECRET_KEY', 'train-engagement-model')


def print_metrics(metrics):
    print(f"\nChosen algorithm: {metrics['algorithm'].upper()}")
    selection = metrics.get('model_selection') or {}
    if selection:
        print("Model selection (5-fold cross-validation on the training split):")
        for algo, result in selection.items():
            print(f"  {algo:<9} {result['cv_accuracy_mean']:.3f} ± {result['cv_accuracy_std']:.3f}")
    print(f"\nHeld-out test split ({metrics['test_samples']} rows, not used for training or selection):")
    print(f"  Accuracy:  {metrics['accuracy']:.3f}")
    print(f"  Precision: {metrics['precision']:.3f}")
    print(f"  Recall:    {metrics['recall']:.3f}")
    print(f"  F1 score:  {metrics['f1_score']:.3f}")
    if metrics.get('roc_auc') is not None:
        print(f"  ROC-AUC:   {metrics['roc_auc']:.3f}")
    print(f"  Confusion matrix [[TN, FP], [FN, TP]]: {metrics['confusion_matrix']}")


def evaluate_on_fresh_data(predictor, generate, n_samples=10000, seeds=(101, 202, 303)):
    """Accuracy/ROC-AUC on synthetic students the model has never seen."""
    import numpy as np
    from sklearn.metrics import accuracy_score, roc_auc_score

    accuracies, aucs = [], []
    for seed in seeds:
        data = generate(n_samples, random_state=seed)
        X = predictor.scaler.transform(data[predictor.feature_names])
        accuracies.append(accuracy_score(data['engaged'], predictor.model.predict(X)))
        aucs.append(roc_auc_score(data['engaged'], predictor.model.predict_proba(X)[:, 1]))
    print(f"\nFresh synthetic data ({len(seeds)} x {n_samples} unseen students):")
    print(f"  Accuracy:  {np.mean(accuracies):.3f} (range {min(accuracies):.3f}-{max(accuracies):.3f})")
    print(f"  ROC-AUC:   {np.mean(aucs):.3f}")
    print("  Note: about 12% of synthetic labels are flipped on purpose, so ~0.88 is the maximum possible.")


def main():
    parser = argparse.ArgumentParser(description='Train Engagement Prediction Model')
    parser.add_argument('--samples', type=int, default=3000,
                        help='Number of synthetic samples to generate (default: 3000)')
    parser.add_argument('--algorithm', default='auto', choices=['auto', 'logistic', 'svm', 'neural'],
                        help='ML algorithm (default: auto = best by cross-validation)')
    parser.add_argument('--seed', type=int, default=42, help='Random seed for synthetic data (default: 42)')
    parser.add_argument('--real-data', action='store_true',
                        help='Train on students in the database (labelled by rule, not by teachers)')
    parser.add_argument('--evaluate', action='store_true',
                        help='Also evaluate on fresh, unseen synthetic data')
    args = parser.parse_args()

    from app.ml_models.engagement_predictor import EngagementPredictor, generate_synthetic_training_data

    if args.real_data:
        from app import create_app
        from app.services.engagement_service import EngagementService
        app = create_app(os.environ.get('FLASK_ENV', 'development'))
        with app.app_context():
            data = EngagementService().extract_training_data_from_db()
        if data is None or len(data) < 20 or data['engaged'].nunique() < 2:
            print('Not enough real student data to train (need at least 20 students with both labels).')
            return 1
        source = f'{len(data)} database students labelled by rule (3 of 5 activity criteria)'
    else:
        data = generate_synthetic_training_data(args.samples, random_state=args.seed)
        source = f'synthetic generator, {len(data)} samples, seed {args.seed}'

    print('=' * 60)
    print('ENGAGEMENT PREDICTION MODEL TRAINING')
    print('=' * 60)
    print(f'Data: {source}')
    print(f"Engaged: {int(data['engaged'].sum())} | Not engaged: {int((1 - data['engaged']).sum())}")

    predictor = EngagementPredictor(algorithm=args.algorithm)
    results = predictor.train_model(data, data_source=source)
    print_metrics(results['metrics'])

    if args.evaluate and not args.real_data:
        evaluate_on_fresh_data(predictor, generate_synthetic_training_data)

    print(f'\nModel saved to {predictor.model_path}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
