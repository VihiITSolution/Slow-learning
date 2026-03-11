"""
Add profile_picture column to users table
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Load environment variables
from pathlib import Path
from dotenv import load_dotenv

env_file = Path(__file__).parent / '.env'
if env_file.exists():
    load_dotenv(env_file)

from app import create_app, db
from sqlalchemy import text


def add_profile_picture_column():
    """Add profile_picture column to users table if it doesn't exist"""
    
    print("="*60)
    print("DATABASE MIGRATION: Add profile_picture column")
    print("="*60)
    print()
    
    app = create_app()
    
    with app.app_context():
        try:
            # Check if column exists
            check_query = text("""
                SELECT COUNT(*) as count
                FROM pragma_table_info('users')
                WHERE name='profile_picture'
            """)
            result = db.session.execute(check_query).fetchone()
            
            if result.count > 0:
                print("✓ Column 'profile_picture' already exists in users table")
                print()
                return
            
            # Add column
            print("Adding 'profile_picture' column to users table...")
            alter_query = text("""
                ALTER TABLE users 
                ADD COLUMN profile_picture VARCHAR(255)
            """)
            db.session.execute(alter_query)
            db.session.commit()
            
            print("✓ Column added successfully!")
            print()
            
        except Exception as e:
            print(f"❌ Error: {e}")
            db.session.rollback()


if __name__ == '__main__':
    add_profile_picture_column()
