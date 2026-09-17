import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.api import auth, grievances, departments, analytics, notifications, ai
from app.models.all_models import User, Department, Officer, Grievance, GrievanceStatusHistory, ResolutionEvidence, Feedback, Notification
from app.core.security import get_password_hash
from datetime import datetime, timedelta, timezone


def seed_initial_data_if_empty():
    """Populates initial departments, demo users, officers, and sample grievances if DB is clean."""
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        if user_count == 0:
            print("[*] Empty database detected. Seeding initial demo data...")
            
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
                db.add(d)
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
                db.add(u)
            db.commit()

            # 3. Officers
            officers = [
                Officer(id="o1111111-1111-1111-1111-111111111111", user_id="u2222222-2222-2222-2222-222222222222", department_id="d1111111-1111-1111-1111-111111111111", badge_number="WTR-409", designation="Senior Hydraulic Engineer", is_available=True),
                Officer(id="o2222222-2222-2222-2222-222222222222", user_id="u3333333-3333-3333-3333-333333333333", department_id="d2222222-2222-2222-2222-222222222222", badge_number="PWD-812", designation="Public Works Inspector", is_available=True),
                Officer(id="o3333333-3333-3333-3333-333333333333", user_id="u4444444-4444-4444-4444-444444444444", department_id="d3333333-3333-3333-3333-333333333333", badge_number="ELE-305", designation="Grid Maintenance Supervisor", is_available=True),
                Officer(id="o4444444-4444-4444-4444-444444444444", user_id="u5555555-5555-5555-5555-555555555555", department_id="d4444444-4444-4444-4444-444444444444", badge_number="SNT-650", designation="Sanitation Zone Lead", is_available=True),
            ]
            for o in officers:
                db.add(o)
            db.commit()

            # 4. Sample Grievances across statuses
            now = datetime.now(timezone.utc)
            sample_grievances = [
                Grievance(
                    id="g1111111-1111-1111-1111-111111111111",
                    citizen_id="u6666666-6666-6666-6666-666666666666",
                    title="Main water supply pipeline leaking heavily near civic center",
                    description="A main underground water pipe has burst and high pressure water is flooding the street for over 18 hours. Traffic is slowed and water is wasted.",
                    category="Water Supply",
                    ai_category="Water Supply",
                    priority="High",
                    ai_priority="High",
                    priority_reason="Classified as High Priority due to: safety hazard keywords (burst, flooding); prolonged disruption ('18 hours'); high citizen distress tone.",
                    sentiment="Negative",
                    sentiment_score=-0.65,
                    department_id="d1111111-1111-1111-1111-111111111111",
                    ai_department_id="d1111111-1111-1111-1111-111111111111",
                    ai_summary="Main underground water pipe burst near civic center flooding the road.",
                    ai_recommendation="Isolate sector water valve immediately, dispatch rapid de-watering pump, and replace fractured pipe section.",
                    ai_confidence=0.94,
                    ai_keywords=["pipe", "burst", "flooding", "water wasted", "high pressure"],
                    status="Submitted",
                    latitude=28.6139,
                    longitude=77.2090,
                    address="Sector 4, Central Avenue, Near Metro Gate 2",
                    is_duplicate=False,
                    created_at=now - timedelta(hours=2)
                ),
                Grievance(
                    id="g2222222-2222-2222-2222-222222222222",
                    citizen_id="u6666666-6666-6666-6666-666666666666",
                    title="Dangerous deep pothole causing two-wheeler accidents",
                    description="Deep crater-like pothole right after the curve on Grand Trunk Road. Two motorcyclists skidded yesterday evening. Needs urgent asphalt patching.",
                    category="Roads/Potholes",
                    ai_category="Roads/Potholes",
                    priority="High",
                    ai_priority="High",
                    priority_reason="Classified as High Priority due to: safety hazard keywords (accident, crater, danger); high citizen distress tone.",
                    sentiment="Negative",
                    sentiment_score=-0.78,
                    department_id="d2222222-2222-2222-2222-222222222222",
                    ai_department_id="d2222222-2222-2222-2222-222222222222",
                    assigned_officer_id="o2222222-2222-2222-2222-222222222222",
                    ai_summary="Dangerous deep pothole causing two-wheeler accidents on Grand Trunk Road.",
                    ai_recommendation="Dispatch road maintenance squad with cold-mix asphalt, install safety barricades around hazard, and resurface damaged section.",
                    ai_confidence=0.92,
                    ai_keywords=["pothole", "accident", "crater", "danger", "skidded"],
                    status="Assigned",
                    latitude=28.6250,
                    longitude=77.2150,
                    address="Grand Trunk Road, Pillar No. 142",
                    is_duplicate=False,
                    created_at=now - timedelta(days=1)
                ),
                Grievance(
                    id="g3333333-3333-3333-3333-333333333333",
                    citizen_id="u6666666-6666-6666-6666-666666666666",
                    title="Streetlights non-functional on 5th Cross Road for 2 weeks",
                    description="All five sodium street lamps on 5th cross are out. The street is pitch dark and unsafe for pedestrians and women walking back from the station at night.",
                    category="Electricity/Street Lights",
                    ai_category="Electricity/Street Lights",
                    priority="Medium",
                    ai_priority="Medium",
                    priority_reason="Classified as Medium Priority due to: prolonged disruption ('2 weeks'); safety concern in dark lane.",
                    sentiment="Negative",
                    sentiment_score=-0.45,
                    department_id="d3333333-3333-3333-3333-333333333333",
                    ai_department_id="d3333333-3333-3333-3333-333333333333",
                    assigned_officer_id="o3333333-3333-3333-3333-333333333333",
                    ai_summary="Streetlights non-functional on 5th Cross Road for 2 weeks.",
                    ai_recommendation="Inspect localized feeder pillar, test circuit breakers/transformers, replace faulty luminaires/LEDs, and secure live cables.",
                    ai_confidence=0.96,
                    ai_keywords=["streetlights", "dark", "unsafe", "lamps", "power"],
                    status="In Progress",
                    latitude=28.6320,
                    longitude=77.2200,
                    address="5th Cross Road, Green Park Colony",
                    is_duplicate=False,
                    created_at=now - timedelta(days=3)
                ),
                Grievance(
                    id="g4444444-4444-4444-4444-444444444444",
                    citizen_id="u6666666-6666-6666-6666-666666666666",
                    title="Overflowing community garbage dump near primary school",
                    description="Commercial waste and plastic have piled up outside the bin for 4 days creating foul smell and stray dog menace right beside the primary school gate.",
                    category="Sanitation/Waste",
                    ai_category="Sanitation/Waste",
                    priority="High",
                    ai_priority="High",
                    priority_reason="Classified as High Priority due to: safety hazard keywords (children, primary school); prolonged disruption ('4 days').",
                    sentiment="Negative",
                    sentiment_score=-0.72,
                    department_id="d4444444-4444-4444-4444-444444444444",
                    ai_department_id="d4444444-4444-4444-4444-444444444444",
                    assigned_officer_id="o4444444-4444-4444-4444-444444444444",
                    ai_summary="Overflowing community garbage dump near primary school gate.",
                    ai_recommendation="Deploy automated hydraulic compactor truck to clear waste accumulation, sanitize surrounding ground, and apply disinfectant powder.",
                    ai_confidence=0.98,
                    ai_keywords=["garbage", "overflowing", "school", "foul smell", "waste"],
                    status="Resolved",
                    latitude=28.6080,
                    longitude=77.2020,
                    address="Opposite City Primary School, Ward 12",
                    is_duplicate=False,
                    created_at=now - timedelta(days=5),
                    updated_at=now - timedelta(days=2)
                )
            ]
            for g in sample_grievances:
                db.add(g)
            db.commit()

            # 5. Status histories
            histories = [
                GrievanceStatusHistory(id="h1111111-1111-1111-1111-111111111111", grievance_id="g1111111-1111-1111-1111-111111111111", previous_status=None, new_status="Submitted", changed_by="u6666666-6666-6666-6666-666666666666", remarks="Grievance submitted via portal with AI auto-triage.", created_at=now - timedelta(hours=2)),
                GrievanceStatusHistory(id="h2222222-2222-2222-2222-222222222222", grievance_id="g2222222-2222-2222-2222-222222222222", previous_status=None, new_status="Submitted", changed_by="u6666666-6666-6666-6666-666666666666", remarks="Grievance submitted.", created_at=now - timedelta(days=1)),
                GrievanceStatusHistory(id="h2222222-2222-2222-2222-222222222223", grievance_id="g2222222-2222-2222-2222-222222222222", previous_status="Submitted", new_status="Assigned", changed_by="u1111111-1111-1111-1111-111111111111", remarks="Assigned to Public Works officer Sarah Lin.", created_at=now - timedelta(hours=20)),
                GrievanceStatusHistory(id="h3333333-3333-3333-3333-333333333331", grievance_id="g3333333-3333-3333-3333-333333333333", previous_status=None, new_status="Submitted", changed_by="u6666666-6666-6666-6666-666666666666", remarks="Grievance submitted.", created_at=now - timedelta(days=3)),
                GrievanceStatusHistory(id="h3333333-3333-3333-3333-333333333332", grievance_id="g3333333-3333-3333-3333-333333333333", previous_status="Submitted", new_status="Assigned", changed_by="u1111111-1111-1111-1111-111111111111", remarks="Assigned to Electricity Officer David Kim.", created_at=now - timedelta(days=2)),
                GrievanceStatusHistory(id="h3333333-3333-3333-3333-333333333333", grievance_id="g3333333-3333-3333-3333-333333333333", previous_status="Assigned", new_status="In Progress", changed_by="u4444444-4444-4444-4444-444444444444", remarks="Field inspection conducted; replacement luminaires dispatched.", created_at=now - timedelta(days=1)),
                GrievanceStatusHistory(id="h4444444-4444-4444-4444-444444444441", grievance_id="g4444444-4444-4444-4444-444444444444", previous_status=None, new_status="Submitted", changed_by="u6666666-6666-6666-6666-666666666666", remarks="Grievance submitted.", created_at=now - timedelta(days=5)),
                GrievanceStatusHistory(id="h4444444-4444-4444-4444-444444444442", grievance_id="g4444444-4444-4444-4444-444444444444", previous_status="Submitted", new_status="Assigned", changed_by="u1111111-1111-1111-1111-111111111111", remarks="Assigned to Sanitation Officer Elena Gomez.", created_at=now - timedelta(days=4)),
                GrievanceStatusHistory(id="h4444444-4444-4444-4444-444444444443", grievance_id="g4444444-4444-4444-4444-444444444444", previous_status="Assigned", new_status="In Progress", changed_by="u5555555-5555-5555-5555-555555555555", remarks="Compactor truck en route.", created_at=now - timedelta(days=3)),
                GrievanceStatusHistory(id="h4444444-4444-4444-4444-444444444444", grievance_id="g4444444-4444-4444-4444-444444444444", previous_status="In Progress", new_status="Resolved", changed_by="u5555555-5555-5555-5555-555555555555", remarks="Waste cleared completely and site disinfected with lime powder.", created_at=now - timedelta(days=2)),
            ]
            for h in histories:
                db.add(h)
            db.commit()

            # 6. Resolution Evidence & Feedback
            evidence = ResolutionEvidence(
                id="e4444444-4444-4444-4444-444444444444",
                grievance_id="g4444444-4444-4444-4444-444444444444",
                officer_id="u5555555-5555-5555-5555-555555555555",
                file_url="/uploads/evidence/school_sanitation_resolved.jpg",
                file_name="school_sanitation_resolved.jpg",
                remarks="All accumulated solid waste lifted via hydraulic compactor truck. Performed chemical disinfection around school perimeter.",
                created_at=now - timedelta(days=2)
            )
            db.add(evidence)

            feedback = Feedback(
                id="f4444444-4444-4444-4444-444444444444",
                grievance_id="g4444444-4444-4444-4444-444444444444",
                citizen_id="u6666666-6666-6666-6666-666666666666",
                rating=5,
                comment="Fast response! The area was cleared within 24 hours of assigning. Very grateful.",
                created_at=now - timedelta(days=1)
            )
            db.add(feedback)

            # 7. Initial notifications
            notifs = [
                Notification(id="n1111111-1111-1111-1111-111111111111", user_id="u6666666-6666-6666-6666-666666666666", title="Grievance Submitted", message='Your grievance "Main water supply pipeline leaking heavily" was submitted.', link="/citizen/grievances/g1111111-1111-1111-1111-111111111111", is_read=True, created_at=now - timedelta(hours=2)),
                Notification(id="n2222222-2222-2222-2222-222222222222", user_id="u6666666-6666-6666-6666-666666666666", title="Grievance Assigned", message='Your grievance regarding pothole on Grand Trunk Road has been assigned to Public Works.', link="/citizen/grievances/g2222222-2222-2222-2222-222222222222", is_read=False, created_at=now - timedelta(hours=20)),
                Notification(id="n3333333-3333-3333-3333-333333333333", user_id="u6666666-6666-6666-6666-666666666666", title="Grievance Resolved!", message='Your complaint regarding waste near primary school has been marked Resolved. Please rate the service.', link="/citizen/grievances/g4444444-4444-4444-4444-444444444444", is_read=True, created_at=now - timedelta(days=2)),
            ]
            for n in notifs:
                db.add(n)
            db.commit()

            print("[✓] Initial demo data seeded successfully!")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create DB schema
    Base.metadata.create_all(bind=engine)
    seed_initial_data_if_empty()
    yield


app = FastAPI(
    title="GrievAI API",
    description="AI-Powered Public Grievance Analysis & Resolution Recommendation Platform REST API",
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory for static media access
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(grievances.router, prefix=settings.API_V1_STR)
app.include_router(departments.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(ai.router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "platform": "GrievAI",
        "version": settings.VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
