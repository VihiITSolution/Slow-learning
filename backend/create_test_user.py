"""
Create a test user in the database
"""
from app import create_app, db
from app.models.user import User

app = create_app()

with app.app_context():
    # Check if test user already exists
    existing_user = User.query.filter_by(username='testuser').first()
    
    if existing_user:
        print("✅ Test user already exists!")
        print(f"   Username: testuser")
        print(f"   Email: test@example.com")
        print(f"   Password: password123")
    else:
        # Create test user
        test_user = User(
            username='testuser',
            email='test@example.com'
        )
        test_user.set_password('password123')
        
        db.session.add(test_user)
        db.session.commit()
        
        print("✅ Test user created successfully!")
        print(f"   Username: testuser")
        print(f"   Email: test@example.com")
        print(f"   Password: password123")
        print("\n🔐 You can now login with these credentials at http://localhost:3000/login")
