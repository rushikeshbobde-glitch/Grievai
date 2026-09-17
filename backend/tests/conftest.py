import os
import pytest
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db
from app.main import app
from app.models.all_models import User, Department, Officer, Grievance, GrievanceStatusHistory, ResolutionEvidence, Feedback, Notification
from app.core.security import get_password_hash

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_grievai.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def seed_test_data(db):
    """Populates standard demo accounts and departments for tests."""
    # 1. Departments
    depts = [
        Department(id="d1111111-1111-1111-1111-111111111111", name="Water Supply & Sewerage", code="WATER", description="Municipal water distribution, pipeline maintenance, and leaks.", contact_email="water.dept@grievai.gov", contact_phone="+1-800-555-0101"),
        Department(id="d2222222-2222-2222-2222-222222222222", name="Roads & Public Works", code="ROADS", description="Road construction, pothole repairs, bridges, footpaths.", contact_email="roads.pwd@grievai.gov", contact_phone="+1-800-555-0102"),
        Department(id="d3333333-3333-3333-3333-333333333333", name="Electricity & Public Lighting", code="ELECTRICITY", description="Power grid maintenance, street lighting, faulty transformers.", contact_email="electricity.dept@grievai.gov", contact_phone="+1-800-555-0103"),
        Department(id="d4444444-4444-4444-4444-444444444444", name="Sanitation & Solid Waste Management", code="SANITATION", description="Garbage collection, public bins, street sweeping, dumping cleanup.", contact_email="sanitation.dept@grievai.gov", contact_phone="+1-800-555-0104"),
        Department(id="d5555555-5555-5555-5555-555555555555", name="Traffic & Transport Authority", code="TRAFFIC", description="Traffic signal repairs, road markings, transit congestion.", contact_email="traffic.dept@grievai.gov", contact_phone="+1-800-555-0105"),
        Department(id="d6666666-6666-6666-6666-666666666666", name="Public Health & Sanitation", code="HEALTH", description="Public health clinics, mosquito fogging, disease vector control.", contact_email="health.dept@grievai.gov", contact_phone="+1-800-555-0106"),
        Department(id="d7777777-7777-7777-7777-777777777777", name="Education & Public Schools", code="EDUCATION", description="Civic school infrastructure, amenities, cleanliness.", contact_email="education.dept@grievai.gov", contact_phone="+1-800-555-0107"),
        Department(id="d8888888-8888-8888-8888-888888888888", name="General Civic Administration", code="OTHER", description="General civic issues, public parks, noise pollution.", contact_email="civic.admin@grievai.gov", contact_phone="+1-800-555-0108"),
    ]
    for d in depts:
        db.merge(d)
    db.commit()

    # 2. Users (Admin@123, Officer@123, Citizen@123)
    pw_admin = get_password_hash("Admin@123")
    pw_officer = get_password_hash("Officer@123")
    pw_citizen = get_password_hash("Citizen@123")

    users = [
        User(id="u1111111-1111-1111-1111-111111111111", name="Chief Admin Officer", email="admin@grievai.gov", password_hash=pw_admin, role="admin", phone="+1-800-555-ADMIN"),
        User(id="u2222222-2222-2222-2222-222222222222", name="Robert Jenkins (Water Officer)", email="officer.water@grievai.gov", password_hash=pw_officer, role="officer", phone="+1-800-555-0201"),
        User(id="u3333333-3333-3333-3333-333333333333", name="Sarah Lin (Roads Officer)", email="officer.roads@grievai.gov", password_hash=pw_officer, role="officer", phone="+1-800-555-0202"),
        User(id="u4444444-4444-4444-4444-444444444444", name="David Kim (Electricity Officer)", email="officer.electricity@grievai.gov", password_hash=pw_officer, role="officer", phone="+1-800-555-0203"),
        User(id="u5555555-5555-5555-5555-555555555555", name="Elena Gomez (Sanitation Officer)", email="officer.sanitation@grievai.gov", password_hash=pw_officer, role="officer", phone="+1-800-555-0204"),
        User(id="u6666666-6666-6666-6666-666666666666", name="John Doe (Citizen)", email="citizen@grievai.gov", password_hash=pw_citizen, role="citizen", phone="+1-800-555-CITIZ"),
    ]
    for u in users:
        db.merge(u)
    db.commit()

    # 3. Officers
    officers = [
        Officer(id="o1111111-1111-1111-1111-111111111111", user_id="u2222222-2222-2222-2222-222222222222", department_id="d1111111-1111-1111-1111-111111111111", badge_number="WTR-409", designation="Senior Hydraulic Engineer", is_available=True),
        Officer(id="o2222222-2222-2222-2222-222222222222", user_id="u3333333-3333-3333-3333-333333333333", department_id="d2222222-2222-2222-2222-222222222222", badge_number="PWD-812", designation="Public Works Inspector", is_available=True),
        Officer(id="o3333333-3333-3333-3333-333333333333", user_id="u4444444-4444-4444-4444-444444444444", department_id="d3333333-3333-3333-3333-333333333333", badge_number="ELE-305", designation="Grid Maintenance Supervisor", is_available=True),
        Officer(id="o4444444-4444-4444-4444-444444444444", user_id="u5555555-5555-5555-5555-555555555555", department_id="d4444444-4444-4444-4444-444444444444", badge_number="SNT-650", designation="Sanitation Zone Lead", is_available=True),
    ]
    for o in officers:
        db.merge(o)
    db.commit()


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    seed_test_data(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("./test_grievai.db"):
        try:
            os.remove("./test_grievai.db")
        except Exception:
            pass


@pytest.fixture()
def db_session():
    session = TestingSessionLocal()
    yield session
    session.close()


@pytest.fixture()
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
            
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
