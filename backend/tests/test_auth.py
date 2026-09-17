import pytest


def test_register_and_login_citizen(client):
    # 1. Register Citizen
    reg_res = client.post(
        "/api/auth/register",
        json={
            "name": "Test Unique Citizen",
            "email": "unique.citizen@example.com",
            "password": "Password@123",
            "role": "citizen",
            "phone": "+1-555-0199"
        }
    )
    assert reg_res.status_code == 201, reg_res.text
    data = reg_res.json()
    assert data["email"] == "unique.citizen@example.com"
    assert data["role"] == "citizen"

    # 2. Login
    login_res = client.post(
        "/api/auth/login",
        json={
            "email": "unique.citizen@example.com",
            "password": "Password@123"
        }
    )
    assert login_res.status_code == 200, login_res.text
    token_data = login_res.json()
    assert "access_token" in token_data
    assert token_data["user"]["email"] == "unique.citizen@example.com"

    # 3. Fetch Profile via /me
    token = token_data["access_token"]
    me_res = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_res.status_code == 200
    assert me_res.json()["name"] == "Test Unique Citizen"


def test_login_invalid_password(client):
    res = client.post(
        "/api/auth/login",
        json={
            "email": "admin@grievai.gov",
            "password": "WrongPassword!"
        }
    )
    assert res.status_code == 401


def test_duplicate_registration_fails(client):
    # First registration
    client.post(
        "/api/auth/register",
        json={
            "name": "First User",
            "email": "duplicate.test@example.com",
            "password": "Password@123",
            "role": "citizen"
        }
    )
    
    # Second registration with same email should fail with 400
    res = client.post(
        "/api/auth/register",
        json={
            "name": "Second User",
            "email": "duplicate.test@example.com",
            "password": "Password@123",
            "role": "citizen"
        }
    )
    assert res.status_code == 400
