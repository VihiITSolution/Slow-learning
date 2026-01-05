"""
Create a test teacher account
"""
from app import create_app, db
from app.models.user import User

def create_teacher():
    app = create_app()
    
    with app.app_context():
        # Check if teacher already exists
        existing_teacher = User.query.filter_by(username='teacher').first()
        
        if existing_teacher:
            print("✅ Teacher account already exists!")
            print(f"   Username: teacher")
            print(f"   Role: {existing_teacher.role}")
            return
        
        # Create new teacher
        teacher = User(
            username='teacher',
            email='teacher@example.com',
            role='teacher'
        )
        teacher.set_password('password123')
        
        db.session.add(teacher)
        db.session.commit()
        
        print("✅ Teacher account created successfully!")
        print("   Username: teacher")
        print("   Password: password123")
        print("   Email: teacher@example.com")
        print("   Role: teacher")

if __name__ == '__main__':
    create_teacher()
