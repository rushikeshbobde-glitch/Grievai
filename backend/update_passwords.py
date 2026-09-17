from app.core.database import SessionLocal
from app.models.all_models import User
from app.core.security import get_password_hash, verify_password

def update_passwords():
    db = SessionLocal()
    try:
        pw_admin = get_password_hash('Admin@123')
        pw_officer = get_password_hash('Officer@123')
        pw_citizen = get_password_hash('Citizen@123')

        u_admin = db.query(User).filter(User.role == 'admin').first()
        if u_admin:
            u_admin.password_hash = pw_admin

        for u_off in db.query(User).filter(User.role == 'officer').all():
            u_off.password_hash = pw_officer

        u_cit = db.query(User).filter(User.role == 'citizen').first()
        if u_cit:
            u_cit.password_hash = pw_citizen

        db.commit()
        print("[OK] Passwords updated successfully in database!")
        print("Admin verify:", verify_password("Admin@123", u_admin.password_hash))
        print("Officer verify:", verify_password("Officer@123", pw_officer))
        print("Citizen verify:", verify_password("Citizen@123", pw_citizen))
    finally:
        db.close()

if __name__ == "__main__":
    update_passwords()
