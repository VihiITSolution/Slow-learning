"""
Check and update existing users' roles
"""
from app import create_app, db
from app.models.user import User

def check_users():
    app = create_app()
    
    with app.app_context():
        users = User.query.all()
        
        print(f"\n📋 Total Users: {len(users)}\n")
        print("-" * 60)
        
        for user in users:
            print(f"👤 {user.username}")
            print(f"   Email: {user.email}")
            print(f"   Role: {user.role}")
            print(f"   Level: {user.level} | XP: {user.total_xp}")
            print("-" * 60)

if __name__ == '__main__':
    check_users()
