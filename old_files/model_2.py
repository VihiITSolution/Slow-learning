"""
Learning Recommendation System (Hybrid Content-Based + Collaborative)
Single-file runnable Flask API for prototyping a "Recommended for You" section.

Features:
- Synthetic dataset generation (learners, lessons, interactions)
- Content-based using TF-IDF on lesson text + cosine similarity
- Collaborative using TruncatedSVD on user-item interaction matrix
- Hybrid scoring that combines both signals
- Flask endpoints: /recommend/<user_id>?k=5, /train

Run: python learning_recommender.py

Dependencies: pandas, numpy, scikit-learn, scipy, flask
Install: pip install pandas numpy scikit-learn scipy flask

Note: This is a prototype for demonstration and local testing. For production, add persistent storage, authentication,
model versioning, batch updates, and a proper retrieval/candidate-stage system.
"""

import random
import string
from flask import Flask, jsonify, request
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.decomposition import TruncatedSVD
from scipy.sparse import csr_matrix

app = Flask(__name__)

# -------------------------
# Synthetic Data Generator
# -------------------------
def random_topic():
    topics = ['algebra', 'calculus', 'probability', 'statistics', 'linear algebra',
              'python', 'data structures', 'algorithms', 'databases', 'ml basics']
    return random.choice(topics)


def make_lesson_content(topic, difficulty):
    # Simple content generator; in practice use real text/meta tags
    templates = {
        'easy': [f"Introduction to {topic}", f"Basics of {topic}", f"{topic} fundamentals"],
        'medium': [f"Intermediate {topic} concepts", f"Working with {topic}", f"Practice problems in {topic}"],
        'hard': [f"Advanced {topic} techniques", f"In-depth {topic} theory", f"Challenging {topic} problems"]
    }
    key = 'easy' if difficulty < 0.4 else ('medium' if difficulty < 0.7 else 'hard')
    return random.choice(templates[key]) + " " + " ".join(random.choices(string.ascii_lowercase, k=30))


def generate_synthetic_data(num_users=500, num_lessons=200, seed=42):
    np.random.seed(seed)
    random.seed(seed)

    # Lessons dataframe
    lessons = []
    for lid in range(num_lessons):
        topic = random_topic()
        difficulty = np.random.beta(2, 5)  # skew towards easier content
        text = make_lesson_content(topic, difficulty)
        lessons.append({'lesson_id': lid, 'topic': topic, 'difficulty': float(difficulty), 'content': text})
    df_lessons = pd.DataFrame(lessons)

    # Users
    users = [{'user_id': uid, 'preferred_topics': random.sample(df_lessons['topic'].unique().tolist(), k=2)} for uid in range(num_users)]
    df_users = pd.DataFrame(users)

    # Interactions (implicit feedback: view/completed -> 1, otherwise 0)
    interactions = []
    for uid in df_users['user_id']:
        # Each user interacts with between 5 and 40 lessons
        n = np.random.randint(5, 40)
        # Prefer their preferred topics
        preferred = df_users.loc[df_users['user_id'] == uid, 'preferred_topics'].iloc[0]
        candidate_lesson_ids = df_lessons.index.tolist()
        chosen = np.random.choice(candidate_lesson_ids, size=n, replace=False)
        for lid in chosen:
            # score likelihood influenced by topic match and difficulty vs user ability
            lesson = df_lessons.loc[lid]
            base = 0.2
            if lesson['topic'] in preferred:
                base += 0.5
            # users have latent ability - model with random
            ability = np.random.beta(2, 2)
            prob_complete = base + (ability * (1 - lesson['difficulty']))  # easier lessons more likely
            prob_complete = min(max(prob_complete, 0), 1)
            completed = np.random.rand() < prob_complete
            interactions.append({'user_id': uid, 'lesson_id': lid, 'completed': int(completed)})

    df_interactions = pd.DataFrame(interactions)

    return df_users, df_lessons, df_interactions


# -------------------------
# Recommendation Engine
# -------------------------
class HybridRecommender:
    def __init__(self, alpha=0.6, n_factors=50):
        """
        alpha: weight for collaborative signal (0..1). hybrid_score = alpha * coll + (1-alpha) * content
        n_factors: number of SVD latent factors for collaborative filtering
        """
        self.alpha = alpha
        self.n_factors = n_factors
        self.tfidf = None
        self.lesson_vecs = None
        self.user_factors = None
        self.item_factors = None
        self.user_id_map = None
        self.item_id_map = None
        self.interaction_matrix = None

    def fit(self, df_users, df_lessons, df_interactions):
        # Content-based (TF-IDF on content + topic + difficulty)
        corpus = (df_lessons['content'] + ' ' + df_lessons['topic'] + ' ' + df_lessons['difficulty'].astype(str)).tolist()
        self.tfidf = TfidfVectorizer(max_features=5000, ngram_range=(1,2))
        self.lesson_vecs = self.tfidf.fit_transform(corpus)

        # Create user-item interaction matrix (implicit)
        users = df_users['user_id'].unique().tolist()
        items = df_lessons['lesson_id'].unique().tolist()
        self.user_id_map = {u: i for i, u in enumerate(users)}
        self.item_id_map = {it: j for j, it in enumerate(items)}

        row = df_interactions['user_id'].map(self.user_id_map).to_numpy()
        col = df_interactions['lesson_id'].map(self.item_id_map).to_numpy()
        data = df_interactions['completed'].to_numpy().astype(float)

        # In case users or items missing in interactions, create empty matrix shape accordingly
        n_users = len(users)
        n_items = len(items)
        self.interaction_matrix = csr_matrix((data, (row, col)), shape=(n_users, n_items))

        # Collaborative: TruncatedSVD (matrix factorization approximation)
        n_factors = min(self.n_factors, min(self.interaction_matrix.shape)-1)
        if n_factors <= 0:
            n_factors = 1
        svd = TruncatedSVD(n_components=n_factors, random_state=42)
        item_factors = svd.fit_transform(self.interaction_matrix.T)  # items x factors
        user_factors = svd.transform(self.interaction_matrix)  # users x factors

        self.user_factors = user_factors
        self.item_factors = item_factors

    def recommend_for_user(self, user_id, k=10, exclude_seen=True):
        if user_id not in self.user_id_map:
            return []
        uidx = self.user_id_map[user_id]

        # Collaborative score: dot product between user and all item factors
        coll_scores = np.dot(self.user_factors[uidx], self.item_factors.T)

        # Content-based score: compute similarity between candidate lessons and user's consumed lessons
        # Find lessons the user completed
        user_row = self.interaction_matrix.getrow(uidx).toarray().flatten()
        seen_idxs = np.where(user_row > 0)[0]
        if len(seen_idxs) == 0:
            # fallback: use average lesson popularity as content score
            content_scores = np.asarray(self.lesson_vecs.sum(axis=1)).ravel()
            content_scores = (content_scores - content_scores.min()) / (content_scores.ptp() + 1e-9)
        else:
            # compute mean vector of seen lessons
            seen_vecs = self.lesson_vecs[seen_idxs]
            user_profile = seen_vecs.mean(axis=0)
            content_scores = cosine_similarity(self.lesson_vecs, user_profile).ravel()

        # Hybrid score
        coll_norm = (coll_scores - coll_scores.min()) / (coll_scores.ptp() + 1e-9)
        content_norm = (content_scores - content_scores.min()) / (content_scores.ptp() + 1e-9)

        hybrid = self.alpha * coll_norm + (1 - self.alpha) * content_norm

        # Optionally exclude seen
        candidate_idxs = np.arange(self.interaction_matrix.shape[1])
        if exclude_seen:
            candidate_mask = user_row == 0
            candidate_idxs = candidate_idxs[candidate_mask]
            scores = hybrid[candidate_mask]
        else:
            scores = hybrid

        top_indices = np.argsort(scores)[-k:][::-1]
        # Map back to lesson IDs (we stored item_id_map as lesson_id -> idx)
        inv_item_map = {v: k for k, v in self.item_id_map.items()}
        recommendations = [{'lesson_id': int(inv_item_map[int(idx)]), 'score': float(scores[np.where(candidate_idxs==idx)[0][0]]) if idx in candidate_idxs else float(hybrid[idx])} for idx in top_indices]
        return recommendations


# -------------------------
# App Globals and training
# -------------------------
RECOMMENDER = HybridRecommender(alpha=0.6, n_factors=50)
DF_USERS, DF_LESSONS, DF_INTERACTIONS = generate_synthetic_data(num_users=500, num_lessons=200)
RECOMMENDER.fit(DF_USERS, DF_LESSONS, DF_INTERACTIONS)


# -------------------------
# Flask Endpoints
# -------------------------
@app.route('/recommend/<int:user_id>', methods=['GET'])
def api_recommend(user_id):
    k = int(request.args.get('k', 10))
    recs = RECOMMENDER.recommend_for_user(user_id, k=k)
    # enrich with lesson metadata
    enriched = []
    for r in recs:
        lid = r['lesson_id']
        lesson = DF_LESSONS.loc[DF_LESSONS['lesson_id'] == lid].to_dict('records')
        if len(lesson) > 0:
            item = lesson[0].copy()
            item['score'] = r['score']
            enriched.append(item)
    return jsonify({'user_id': user_id, 'recommendations': enriched})


@app.route('/train', methods=['POST'])
def api_train():
    # Optionally accept new interactions to re-fit. For simplicity, re-generate synthetic data if requested.
    global DF_USERS, DF_LESSONS, DF_INTERACTIONS, RECOMMENDER
    payload = request.get_json(silent=True) or {}
    if payload.get('regenerate_data'):
        DF_USERS, DF_LESSONS, DF_INTERACTIONS = generate_synthetic_data(num_users=payload.get('num_users', 500), num_lessons=payload.get('num_lessons', 200))
    RECOMMENDER = HybridRecommender(alpha=payload.get('alpha', 0.6), n_factors=payload.get('n_factors', 50))
    RECOMMENDER.fit(DF_USERS, DF_LESSONS, DF_INTERACTIONS)
    return jsonify({'status': 'trained', 'num_users': len(DF_USERS), 'num_lessons': len(DF_LESSONS)})


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    print("Starting Learning Recommender API on http://127.0.0.1:5000")
    app.run(debug=True)
