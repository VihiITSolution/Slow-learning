"""
Migration script to add assessment fields to users table
Run this script once to update the database schema
"""
from app import create_app, db
from sqlalchemy import text

def add_assessment_columns():
    app = create_app()
    
    with app.app_context():
        try:
            # Check if columns already exist
            inspector = db.inspect(db.engine)
            columns = [col['name'] for col in inspector.get_columns('users')]
            
            columns_to_add = {
                'learning_style': 'VARCHAR(100)',
                'assessment_score': 'INTEGER',
                'assessment_date': 'DATETIME',
                'assessment_data': 'TEXT'  # SQLite doesn't have JSON type, uses TEXT
            }
            
            added = []
            already_exist = []
            
            with db.engine.connect() as conn:
                for column_name, column_type in columns_to_add.items():
                    if column_name in columns:
                        already_exist.append(column_name)
                    else:
                        conn.execute(text(f"ALTER TABLE users ADD COLUMN {column_name} {column_type}"))
                        added.append(column_name)
                
                if added:
                    conn.commit()
            
            if added:
                print("✅ Added assessment columns:")
                for col in added:
                    print(f"   - {col}")
            
            if already_exist:
                print("ℹ️  Already existing columns:")
                for col in already_exist:
                    print(f"   - {col}")
            
            if not added:
                print("✅ All assessment columns already exist!")
            
        except Exception as e:
            print(f"❌ Error adding assessment columns: {e}")

if __name__ == '__main__':
    add_assessment_columns()
