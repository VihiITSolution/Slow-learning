"""
Migration script to add role column to users table
Run this script once to update the database schema
"""
from app import create_app, db
from sqlalchemy import text

def add_role_column():
    app = create_app()
    
    with app.app_context():
        try:
            # Check if column already exists
            inspector = db.inspect(db.engine)
            columns = [col['name'] for col in inspector.get_columns('users')]
            
            if 'role' in columns:
                print("✅ Role column already exists!")
                return
            
            # Add role column with default value 'student'
            with db.engine.connect() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'student'"))
                conn.commit()
            
            print("✅ Role column added successfully!")
            print("📝 All existing users have been set to 'student' role by default")
            
        except Exception as e:
            print(f"❌ Error adding role column: {e}")

if __name__ == '__main__':
    add_role_column()
