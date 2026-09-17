"""
GrievAI: Machine Learning Training Pipeline
Trains a TF-IDF + Logistic Regression classifier on civic grievance text to predict grievance categories.
Exports serialized models and vectorizers for the backend inference pipeline.
"""

import os
import pickle
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score
from sklearn.model_selection import train_test_split


def train_category_model():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(current_dir, "data", "training_dataset.csv")
    models_dir = os.path.join(current_dir, "models")
    backend_models_dir = os.path.join(current_dir, "..", "backend", "app", "ai", "models")
    
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(backend_models_dir, exist_ok=True)

    print(f"[*] Loading training dataset from: {data_path}")
    df = pd.read_csv(data_path)
    print(f"[*] Total dataset samples: {len(df)}")
    print(f"[*] Class distribution:\n{df['category'].value_counts()}\n")

    X = df['text']
    y = df['category']

    # Vectorizer with unigrams & bigrams, sublinear tf scaling
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        max_features=3000,
        sublinear_tf=True,
        strip_accents='unicode',
        lowercase=True
    )

    X_tfidf = vectorizer.fit_transform(X)

    # Logistic Regression with balanced weights
    classifier = LogisticRegression(
        C=1.5,
        max_iter=1000,
        class_weight='balanced',
        random_state=42
    )

    classifier.fit(X_tfidf, y)
    y_pred = classifier.predict(X_tfidf)
    acc = accuracy_score(y, y_pred)
    print(f"[+] Model fitted with training accuracy: {acc * 100:.2f}%")
    print("\nClassification Report:\n", classification_report(y, y_pred))

    # Save artifacts to ml/models/ and backend/app/ai/models/
    vec_path = os.path.join(models_dir, "tfidf_vectorizer.pkl")
    model_path = os.path.join(models_dir, "category_model.pkl")

    backend_vec_path = os.path.join(backend_models_dir, "tfidf_vectorizer.pkl")
    backend_model_path = os.path.join(backend_models_dir, "category_model.pkl")

    with open(vec_path, "wb") as f:
        pickle.dump(vectorizer, f)
    with open(model_path, "wb") as f:
        pickle.dump(classifier, f)

    with open(backend_vec_path, "wb") as f:
        pickle.dump(vectorizer, f)
    with open(backend_model_path, "wb") as f:
        pickle.dump(classifier, f)

    print(f"[SUCCESS] Artifacts saved to:\n  - {vec_path}\n  - {model_path}\n  - {backend_vec_path}\n  - {backend_model_path}")


if __name__ == "__main__":
    train_category_model()
