import pytest


def get_token(client, email, password):
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()["access_token"]


def test_complete_end_to_end_hackathon_workflow(client):
    # Setup initial departments & users if not already present
    admin_token = get_token(client, "admin@grievai.gov", "Admin@123")
    officer_token = get_token(client, "officer.water@grievai.gov", "Officer@123")
    citizen_token = get_token(client, "citizen@grievai.gov", "Citizen@123")

    # Step 1: Citizen submits grievance
    citizen_headers = {"Authorization": f"Bearer {citizen_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    officer_headers = {"Authorization": f"Bearer {officer_token}"}

    submit_payload = {
        "title": "Severe water cut in Ward 4",
        "description": "There has been no water supply in our area for three days and elderly people are facing problems.",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "address": "Ward 4, Near Community Center"
    }

    sub_res = client.post("/api/grievances", json=submit_payload, headers=citizen_headers)
    assert sub_res.status_code == 201, sub_res.text
    grievance = sub_res.json()
    grievance_id = grievance["id"]

    # Step 2: Verify AI Predictions
    assert grievance["category"] == "Water Supply"
    assert grievance["priority"] == "High"
    assert grievance["sentiment"] == "Negative"
    assert grievance["status"] == "Submitted"
    assert grievance["ai_summary"] is not None
    assert grievance["ai_recommendation"] is not None

    # Step 3: Admin reviews grievance & assigns to Water Department Officer
    depts_res = client.get("/api/departments", headers=admin_headers)
    assert depts_res.status_code == 200
    depts = depts_res.json()
    water_dept = next(d for d in depts if "Water" in d["name"])

    officers_res = client.get("/api/departments/officers", headers=admin_headers)
    assert officers_res.status_code == 200
    officers = officers_res.json()
    water_officer = next(o for o in officers if o["department_id"] == water_dept["id"])

    assign_res = client.patch(
        f"/api/grievances/{grievance_id}/assign",
        json={
            "department_id": water_dept["id"],
            "officer_id": water_officer["id"],
            "remarks": "Assigned to Water Department field team for immediate valve inspection."
        },
        headers=admin_headers
    )
    assert assign_res.status_code == 200
    assert assign_res.json()["status"] == "Assigned"

    # Step 4: Officer logs in, views assigned grievance and changes status to 'In Progress'
    officer_assigned_res = client.get("/api/grievances/assigned", headers=officer_headers)
    assert officer_assigned_res.status_code == 200
    assigned_list = officer_assigned_res.json()
    assert any(g["id"] == grievance_id for g in assigned_list)

    progress_res = client.patch(
        f"/api/grievances/{grievance_id}/status",
        json={"status": "In Progress", "remarks": "Excavation team arrived at site to locate pipeline rupture."},
        headers=officer_headers
    )
    assert progress_res.status_code == 200
    assert progress_res.json()["status"] == "In Progress"

    # Step 5: Officer uploads resolution evidence and marks 'Resolved'
    evidence_res = client.post(
        f"/api/grievances/{grievance_id}/evidence",
        json={
            "remarks": "Pipeline fracture replaced with reinforced ductile iron collar. Water pressure fully restored.",
            "file_url": "/uploads/evidence/water_pipe_fixed.jpg",
            "file_name": "water_pipe_fixed.jpg"
        },
        headers=officer_headers
    )
    assert evidence_res.status_code == 200
    assert evidence_res.json()["remarks"] is not None

    # Verify status changed to Resolved
    detail_res = client.get(f"/api/grievances/{grievance_id}", headers=citizen_headers)
    assert detail_res.status_code == 200
    detail_data = detail_res.json()
    assert detail_data["status"] == "Resolved"
    assert detail_data["resolution_evidence"] is not None
    assert len(detail_data["status_history"]) >= 4

    # Step 6: Citizen submits rating and feedback
    feedback_res = client.post(
        f"/api/grievances/{grievance_id}/feedback",
        json={
            "rating": 5,
            "comment": "Outstanding response time! Water supply is back with high pressure."
        },
        headers=citizen_headers
    )
    assert feedback_res.status_code == 200
    assert feedback_res.json()["rating"] == 5

    # Step 7: Duplicate detection test - Citizen submits a second similar complaint nearby
    duplicate_payload = {
        "title": "No water in Ward 4 residential area",
        "description": "Drinking water supply is cut off since 3 days in Ward 4.",
        "latitude": 28.6140,
        "longitude": 77.2091,
        "address": "Ward 4 Lane 2"
    }
    dup_res = client.post("/api/grievances", json=duplicate_payload, headers=citizen_headers)
    assert dup_res.status_code == 201
    dup_grievance = dup_res.json()
    assert dup_grievance["is_duplicate"] is True

    # Step 8: Admin analytics summary reflect real data
    analytics_res = client.get("/api/analytics/summary", headers=admin_headers)
    assert analytics_res.status_code == 200
    analytics_data = analytics_res.json()
    assert analytics_data["total_grievances"] >= 2
    assert analytics_data["resolved_grievances"] >= 1
    assert len(analytics_data["categories_breakdown"]) > 0

    # Step 9: CSV export
    csv_res = client.get("/api/analytics/export-csv", headers=admin_headers)
    assert csv_res.status_code == 200
    assert "Grievance ID" in csv_res.text
    assert "Severe water cut in Ward 4" in csv_res.text
