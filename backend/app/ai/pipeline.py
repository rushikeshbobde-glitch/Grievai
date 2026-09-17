import os
import math
import pickle
import re
from typing import Dict, Any, List, Optional, Tuple
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer


class GrievanceAIPipeline:
    def __init__(self):
        self.analyzer = SentimentIntensityAnalyzer()
        # Enhance VADER lexicon with civic complaint distress vocabulary
        civic_lexicon_updates = {
            "pothole": -2.0, "potholes": -2.0, "crater": -2.2, "leak": -1.8, "leaking": -2.0,
            "burst": -2.8, "outage": -2.2, "accident": -2.6, "accidents": -2.6, "broken": -2.0,
            "dark": -1.5, "unsafe": -2.5, "filthy": -2.6, "dump": -1.8, "overflowing": -2.2,
            "jammed": -1.8, "danger": -2.8, "dangerous": -2.8, "problem": -1.5, "problems": -1.8,
            "stagnant": -2.0, "stench": -2.5, "mosquitoes": -2.0, "dengue": -3.0, "hazard": -2.5
        }
        self.analyzer.lexicon.update(civic_lexicon_updates)
        self.vectorizer = None
        self.classifier = None
        self._load_models()

        # Deterministic Category to Department Mapping
        self.category_dept_map = {
            "Water Supply": "Water Supply & Sewerage",
            "Roads/Potholes": "Roads & Public Works",
            "Electricity/Street Lights": "Electricity & Public Lighting",
            "Sanitation/Waste": "Sanitation & Solid Waste Management",
            "Traffic": "Traffic & Transport Authority",
            "Healthcare": "Public Health & Sanitation",
            "Education": "Education & Public Schools",
            "Other": "General Civic Administration"
        }

        # Resolution Action Templates
        self.resolution_templates = {
            "Water Supply": "Inspect water supply pipeline valves, check for main line pressure drop/leaks, and deploy emergency pipeline repair team.",
            "Roads/Potholes": "Dispatch road maintenance squad with cold-mix asphalt, install safety barricades around hazard, and resurface damaged section.",
            "Electricity/Street Lights": "Inspect localized feeder pillar, test circuit breakers/transformers, replace faulty luminaires/LEDs, and secure live cables.",
            "Sanitation/Waste": "Deploy automated hydraulic compactor truck to clear waste accumulation, sanitize surrounding ground, and apply disinfectant powder.",
            "Traffic": "Check traffic signal controller, dispatch traffic marshals to clear bottleneck, and refresh road lane markings.",
            "Healthcare": "Inspect public health facility conditions, deploy vector-borne disease fogging team, and replenish emergency medicines.",
            "Education": "Conduct structural and civil inspection of school facility, repair damaged fixtures, and ensure functional drinking water.",
            "Other": "Assign municipal field officer to conduct on-site verification and coordinate appropriate civic redressal."
        }

        # Urgency & Danger Keywords
        self.high_danger_keywords = [
            "burst", "flooding", "flood", "sparking", "fire", "live wire", "danger", "dangerous",
            "hazard", "accident", "injured", "death", "casualty", "open manhole", "crater", "caved in",
            "collapse", "toxic", "contaminated", "poison", "hospital", "ambulance", "blocked",
            "children", "school children", "elderly", "emergency", "urgent", "explosion"
        ]

        self.duration_keywords = {
            "month": 25,
            "months": 30,
            "week": 20,
            "weeks": 25,
            "3 days": 22,
            "three days": 22,
            "4 days": 24,
            "four days": 24,
            "5 days": 26,
            "five days": 26,
            "days": 15,
            "hours": 10,
            "constantly": 18,
            "frequently": 15,
            "daily": 15
        }

    def _load_models(self):
        """Loads trained scikit-learn TF-IDF and Classifier if present."""
        current_dir = os.path.dirname(os.path.abspath(__file__))
        models_dir = os.path.join(current_dir, "models")
        vec_path = os.path.join(models_dir, "tfidf_vectorizer.pkl")
        model_path = os.path.join(models_dir, "category_model.pkl")

        if os.path.exists(vec_path) and os.path.exists(model_path):
            try:
                with open(vec_path, "rb") as f:
                    self.vectorizer = pickle.load(f)
                with open(model_path, "rb") as f:
                    self.classifier = pickle.load(f)
            except Exception as e:
                print(f"[!] Warning: Could not load pickled models: {e}")

    def predict_category(self, text: str) -> Tuple[str, float, List[str]]:
        """Predicts category with confidence score and extracted top keywords."""
        text_lower = text.lower()
        
        # If ML model is loaded, use it
        if self.vectorizer is not None and self.classifier is not None:
            try:
                vec = self.vectorizer.transform([text])
                probs = self.classifier.predict_proba(vec)[0]
                classes = self.classifier.classes_
                max_idx = probs.argmax()
                predicted_class = classes[max_idx]
                confidence = float(probs[max_idx])
                
                # Extract top matching tokens
                feature_names = self.vectorizer.get_feature_names_out()
                nonzero_indices = vec.nonzero()[1]
                matched_words = [feature_names[i] for i in nonzero_indices]
                
                # Sort keywords by TF-IDF weight
                tfidf_scores = [vec[0, i] for i in nonzero_indices]
                sorted_keywords = [w for _, w in sorted(zip(tfidf_scores, matched_words), reverse=True)][:6]
                
                return predicted_class, round(confidence, 2), sorted_keywords
            except Exception:
                pass

        # Robust Heuristic Fallback
        category_scores = {
            "Water Supply": ["water", "pipe", "leak", "tap", "pipeline", "drinking", "sewage", "supply", "tanker", "drainage"],
            "Roads/Potholes": ["pothole", "road", "asphalt", "crater", "manhole", "footpath", "divider", "pavement", "curb"],
            "Electricity/Street Lights": ["electricity", "power", "light", "street light", "wire", "cable", "transformer", "spark", "dark", "pole", "outage"],
            "Sanitation/Waste": ["garbage", "trash", "waste", "dump", "bin", "smell", "filthy", "drain", "clean", "sweeping", "odor"],
            "Traffic": ["traffic", "signal", "jam", "parking", "congestion", "vehicle", "crossing", "speed", "roundabout"],
            "Healthcare": ["health", "hospital", "doctor", "clinic", "dispensary", "medicine", "dengue", "mosquito", "dog", "vaccine"],
            "Education": ["school", "classroom", "student", "teacher", "bench", "desk", "playground", "education", "books"]
        }

        best_cat = "Other"
        best_count = 0
        matched_tokens = []

        for cat, keywords in category_scores.items():
            matches = [k for k in keywords if k in text_lower]
            if len(matches) > best_count:
                best_count = len(matches)
                best_cat = cat
                matched_tokens = matches

        confidence = min(0.95, 0.50 + (best_count * 0.15)) if best_count > 0 else 0.40
        return best_cat, round(confidence, 2), matched_tokens

    def analyze_sentiment(self, text: str) -> Tuple[str, float]:
        """Analyzes sentiment tone and polarity."""
        scores = self.analyzer.polarity_scores(text)
        compound = scores["compound"]
        
        if compound <= -0.15:
            sentiment = "Negative"
        elif compound >= 0.15:
            sentiment = "Positive"
        else:
            sentiment = "Neutral"

        return sentiment, round(compound, 2)

    def predict_priority(self, text: str, category: str, sentiment: str, sentiment_score: float) -> Tuple[str, int, str]:
        """
        Explainable hybrid urgency and priority scoring:
        - Danger keywords (weight: up to 40 pts)
        - Duration cues (weight: up to 30 pts)
        - Sentiment distress (weight: up to 20 pts)
        - Category severity baseline (weight: up to 10 pts)
        """
        text_lower = text.lower()
        score = 25  # Base score
        trigger_reasons = []

        # 1. Danger & Hazard Keywords
        found_hazards = [w for w in self.high_danger_keywords if w in text_lower]
        if found_hazards:
            hazard_pts = min(40, len(found_hazards) * 15)
            score += hazard_pts
            trigger_reasons.append(f"safety hazard keywords ({', '.join(found_hazards[:3])})")

        # 2. Duration Cues
        for dur, pts in self.duration_keywords.items():
            if dur in text_lower:
                score += pts
                trigger_reasons.append(f"prolonged disruption ('{dur}')")
                break

        # 3. Sentiment Distress
        if sentiment == "Negative" or sentiment_score < -0.3:
            distress_pts = int(abs(sentiment_score) * 20)
            score += distress_pts
            trigger_reasons.append("high citizen distress tone")

        # 4. Critical Category Weight
        if category in ["Water Supply", "Electricity/Street Lights", "Roads/Potholes", "Healthcare"]:
            score += 10

        # Cap score between 0 and 100
        score = max(5, min(98, score))

        if score >= 65:
            priority = "High"
        elif score >= 40:
            priority = "Medium"
        else:
            priority = "Low"

        if not trigger_reasons:
            trigger_reasons.append("standard civic inquiry / moderate urgency indicators")

        reason = f"Classified as {priority} Priority ({score}/100) due to: {'; '.join(trigger_reasons)}."
        return priority, score, reason

    def generate_summary(self, title: str, description: str) -> str:
        """Lightweight extractive summarization generating a 1-line clean issue summary."""
        combined = f"{title.strip()}. {description.strip()}"
        
        # Clean redundant whitespaces
        cleaned = re.sub(r'\s+', ' ', combined)
        
        # Extract main problem statement
        sentences = [s.strip() for s in re.split(r'[.!?]+', cleaned) if len(s.strip()) > 8]
        if not sentences:
            return title[:120]
        
        first_sentence = sentences[0]
        if len(first_sentence) > 130:
            return first_sentence[:127] + "..."
        return first_sentence

    def get_resolution_recommendation(self, category: str, text: str) -> str:
        """Returns contextual municipal standard operating procedure action recommendation."""
        base_template = self.resolution_templates.get(category, self.resolution_templates["Other"])
        
        text_lower = text.lower()
        if "flood" in text_lower or "burst" in text_lower:
            return "Isolate sector water valve immediately, dispatch rapid de-watering pump, and replace fractured pipe section."
        elif "spark" in text_lower or "live wire" in text_lower:
            return "De-energize circuit line remotely, deploy emergency electrical safety squad, and replace faulty line components."
        elif "open manhole" in text_lower or "crater" in text_lower:
            return "Place reflective danger barrier immediately, install heavy-duty ductile iron manhole cover, and restore road level."
        
        return base_template

    def analyze(self, title: str, description: str, explicit_category: Optional[str] = None) -> Dict[str, Any]:
        """Runs the complete end-to-end AI analysis pipeline."""
        full_text = f"{title} {description}"
        
        # 1. Category Classification
        if explicit_category and explicit_category != "Other":
            category = explicit_category
            confidence = 0.99
            keywords = [w for w in title.lower().split() if len(w) > 3][:5]
        else:
            category, confidence, keywords = self.predict_category(full_text)

        # 2. Sentiment Analysis
        sentiment, sentiment_score = self.analyze_sentiment(full_text)

        # 3. Priority Prediction with Explainability
        priority, priority_score, priority_reason = self.predict_priority(full_text, category, sentiment, sentiment_score)

        # 4. Department Mapping
        dept_name = self.category_dept_map.get(category, "General Civic Administration")

        # 5. Summary Generation
        summary = self.generate_summary(title, description)

        # 6. Resolution Action Recommendation
        recommendation = self.get_resolution_recommendation(category, full_text)

        return {
            "category": category,
            "confidence": confidence,
            "priority": priority,
            "priority_score": priority_score,
            "priority_reason": priority_reason,
            "sentiment": sentiment,
            "sentiment_score": sentiment_score,
            "recommended_department_name": dept_name,
            "summary": summary,
            "recommended_action": recommendation,
            "keywords": keywords
        }


# Haversine distance calculator between two GPS coordinates (meters)
def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000  # Radius of Earth in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


# Global AI Pipeline Instance
ai_pipeline = GrievanceAIPipeline()
