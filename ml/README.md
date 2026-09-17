# GrievAI: Machine Learning & NLP Architecture

This directory contains the training pipeline, dataset, and documentation for the lightweight, explainable AI/NLP subsystems powering GrievAI.

---

## 1. Subsystems Overview

| Task | Architecture / Technique | Output | Explainability Mechanism |
|---|---|---|---|
| **Category Classification** | Sublinear TF-IDF (1-2 ngrams) + Balanced Logistic Regression | 8 Predefined Municipal Categories | Prediction probabilities + top n-gram feature weights |
| **Priority Prediction** | Hybrid urgency scoring (Hazard vocabulary + Temporal duration + Sentiment weighting + Severity penalty) | `High`, `Medium`, `Low` + Urgency Score (0-100) | Trigger keywords list & duration modifier clause |
| **Sentiment Analysis** | VADER Lexicon Analyzer | `Positive`, `Neutral`, `Negative` + Compound score | Polarity and intensity breakdown |
| **Department Routing** | Deterministic Category-to-Department Registry | Target Department ID & Contact | Direct civic jurisdiction lookup |
| **1-Line Summary** | Extractive Syntactic / Lexical Summarizer | Concise 1-sentence issue statement | Highlights core entity + impact clause |
| **Resolution Action** | Domain-specific action template matrix | Concrete inspection & dispatch action | Standardized municipal protocol |
| **Duplicate Detection** | Cosine Similarity of TF-IDF vectors + Haversine Spherical Distance Filter | Duplicate flag + Similarity % + Distance in meters | Matched grievance link and geo proximity |

---

## 2. Model Training

To retrain or fine-tune the category classifier:

```bash
# From repository root
python ml/train.py
```

The script will:
1. Load `ml/data/training_dataset.csv`
2. Fit the vectorizer and classifier
3. Export serialized models to `ml/models/` and `backend/app/ai/models/`
