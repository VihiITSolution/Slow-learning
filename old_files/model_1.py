import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
import seaborn as sns
import matplotlib.pyplot as plt

# -----------------------------------------
# GENERATE SYNTHETIC DATA FOR DIFFICULTY PREDICTION
# -----------------------------------------
np.random.seed(42)
num_learners = 700

data = {
    'avg_quiz_last_5': np.random.uniform(20, 100, num_learners),
    'time_per_lesson_mins': np.random.uniform(5, 50, num_learners),
    'accuracy_rate': np.random.uniform(0.2, 1.0, num_learners),
    'hints_used': np.random.randint(0, 10, num_learners),
    'rewatches': np.random.randint(0, 5, num_learners),
    'mistakes_per_lesson': np.random.randint(0, 15, num_learners),
    'mastery_score': np.random.uniform(0.1, 1.0, num_learners),
    'reading_speed_wpm': np.random.uniform(80, 300, num_learners),
    'modules_completed': np.random.randint(1, 50, num_learners)
}

df = pd.DataFrame(data)

# -----------------------------------------
# CREATE REALISTIC TARGET: DIFFICULTY LEVEL
# -----------------------------------------
# Easy = high mastery, high accuracy, fast reading
# Hard = low accuracy, slow reading, many mistakes

conditions = []

for idx, row in df.iterrows():
    if row['accuracy_rate'] > 0.8 and row['mastery_score'] > 0.7:
        conditions.append(0)  # Easy
    elif row['accuracy_rate'] < 0.45 or row['mistakes_per_lesson'] > 10:
        conditions.append(2)  # Hard
    else:
        conditions.append(1)  # Medium

df['difficulty_level'] = conditions

# -----------------------------------------
# TRAIN TEST SPLIT
# -----------------------------------------
X = df.drop('difficulty_level', axis=1)
y = df['difficulty_level']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# -----------------------------------------
# RANDOM FOREST CLASSIFIER
# -----------------------------------------
model = RandomForestClassifier(
    n_estimators=200,
    max_depth=8,
    random_state=42
)

model.fit(X_train, y_train)

# -----------------------------------------
# EVALUATION
# -----------------------------------------
y_pred = model.predict(X_test)

print("\nAccuracy:", accuracy_score(y_test, y_pred))
print("\nClassification Report:\n", classification_report(y_test, y_pred))

cm = confusion_matrix(y_test, y_pred)
sns.heatmap(cm, annot=True, cmap='Blues', xticklabels=['Easy','Medium','Hard'], yticklabels=['Easy','Medium','Hard'])
plt.title("Difficulty Level Prediction Confusion Matrix")
plt.xlabel("Predicted")
plt.ylabel("Actual")
plt.show()

# -----------------------------------------
# Predict for a new learner
# -----------------------------------------

new_learner = pd.DataFrame([{
    'avg_quiz_last_5': 65,
    'time_per_lesson_mins': 30,
    'accuracy_rate': 0.55,
    'hints_used': 2,
    'rewatches': 1,
    'mistakes_per_lesson': 5,
    'mastery_score': 0.45,
    'reading_speed_wpm': 150,
    'modules_completed': 12
}])

prediction = model.predict(new_learner)[0]

difficulty_map = {0: "Easy", 1: "Medium", 2: "Hard"}

print("\nPredicted Difficulty for New Lesson:", difficulty_map[prediction])
