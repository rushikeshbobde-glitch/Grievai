import pytest
from app.ai.pipeline import ai_pipeline, haversine_distance


def test_ai_water_complaint_pipeline():
    title = "No water supply in our area"
    description = "There has been no water supply in our area for three days and elderly people are facing problems."

    result = ai_pipeline.analyze(title=title, description=description)

    assert result["category"] == "Water Supply"
    assert result["priority"] in ["High", "Medium"]
    assert result["sentiment"] == "Negative"
    assert "Water" in result["recommended_department_name"]
    assert len(result["summary"]) > 5
    assert len(result["recommended_action"]) > 10
    assert len(result["priority_reason"]) > 10


def test_ai_pothole_complaint_pipeline():
    title = "Dangerous deep pothole on Grand Trunk Road"
    description = "Huge crater on Grand Trunk Road near metro pillar causing two-wheeler bike accidents. Needs immediate road asphalt repair."

    result = ai_pipeline.analyze(title=title, description=description)

    assert result["category"] == "Roads/Potholes"
    assert result["priority"] in ["High", "Medium"]
    assert result["sentiment"] == "Negative"
    assert "Roads" in result["recommended_department_name"]


def test_haversine_distance():
    # Delhi Connaught Place to India Gate ~ 2.2 km (2200 meters)
    lat1, lon1 = 28.6328, 77.2197
    lat2, lon2 = 28.6129, 77.2295
    dist = haversine_distance(lat1, lon1, lat2, lon2)
    assert 2000 < dist < 2600
