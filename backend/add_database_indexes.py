"""
Database Index Migration Script
Adds indexes to improve query performance

Run this script to add indexes to the database tables
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


def add_indexes():
    """Add performance indexes to database tables"""
    
    print("="*60)
    print("DATABASE INDEX MIGRATION")
    print("="*60)
    print()
    
    app = create_app()
    
    with app.app_context():
        print("Step 1: Checking database connection...")
        try:
            db.session.execute(text('SELECT 1'))
            print("✓ Database connection successful")
            print()
        except Exception as e:
            print(f"❌ Database connection failed: {e}")
            return
        
        print("Step 2: Adding indexes...")
        print()
        
        # List of indexes to create
        # Format: (table_name, index_name, columns, is_composite)
        indexes = [
            # Progress table indexes
            ('progress', 'idx_progress_user_id', ['user_id'], False),
            ('progress', 'idx_progress_lesson_id', ['lesson_id'], False),
            ('progress', 'idx_progress_status', ['status'], False),
            ('progress', 'idx_progress_user_lesson', ['user_id', 'lesson_id'], True),
            ('progress', 'idx_progress_user_status', ['user_id', 'status'], True),
            ('progress', 'idx_progress_completed_at', ['completed_at'], False),
            ('progress', 'idx_progress_last_accessed', ['last_accessed'], False),
            
            # QuizAttempt table indexes
            ('quiz_attempts', 'idx_quiz_attempts_user_id', ['user_id'], False),
            ('quiz_attempts', 'idx_quiz_attempts_quiz_id', ['quiz_id'], False),
            ('quiz_attempts', 'idx_quiz_attempts_user_quiz', ['user_id', 'quiz_id'], True),
            ('quiz_attempts', 'idx_quiz_attempts_completed_at', ['completed_at'], False),
            
            # Achievement table indexes
            ('achievements', 'idx_achievements_user_id', ['user_id'], False),
            ('achievements', 'idx_achievements_unlocked_at', ['unlocked_at'], False),
            
            # Leaderboard table indexes
            ('leaderboard', 'idx_leaderboard_user_id', ['user_id'], False),
            ('leaderboard', 'idx_leaderboard_timeframe', ['timeframe'], False),
            ('leaderboard', 'idx_leaderboard_rank', ['rank'], False),
            ('leaderboard', 'idx_leaderboard_timeframe_rank', ['timeframe', 'rank'], True),
            
            # GameSession table indexes
            ('game_sessions', 'idx_game_sessions_student_name', ['student_name'], False),
            ('game_sessions', 'idx_game_sessions_started_at', ['started_at'], False),
            ('game_sessions', 'idx_game_sessions_completed_at', ['completed_at'], False),
            
            # User table indexes (for login and role queries)
            ('users', 'idx_users_username', ['username'], False),
            ('users', 'idx_users_email', ['email'], False),
            ('users', 'idx_users_role', ['role'], False),
            ('users', 'idx_users_last_login', ['last_login'], False),
            
            # Lesson table indexes
            ('lessons', 'idx_lessons_category', ['category'], False),
            ('lessons', 'idx_lessons_difficulty', ['difficulty'], False),
            ('lessons', 'idx_lessons_order', ['order_index'], False),
        ]
        
        created_count = 0
        skipped_count = 0
        error_count = 0
        
        for table_name, index_name, columns, is_composite in indexes:
            try:
                # Check if index exists
                check_query = text(f"""
                    SELECT name FROM sqlite_master 
                    WHERE type='index' AND name=:index_name
                """)
                result = db.session.execute(check_query, {'index_name': index_name}).fetchone()
                
                if result:
                    print(f"  ⏭  {index_name:<45} (already exists)")
                    skipped_count += 1
                    continue
                
                # Create the index
                columns_str = ', '.join(columns)
                create_query = f"CREATE INDEX {index_name} ON {table_name}({columns_str})"
                db.session.execute(text(create_query))
                db.session.commit()
                
                index_type = "composite" if is_composite else "single"
                print(f"  ✓ {index_name:<45} ({index_type}: {columns_str})")
                created_count += 1
                
            except Exception as e:
                print(f"  ❌ {index_name:<45} (error: {str(e)[:40]})")
                error_count += 1
                db.session.rollback()
        
        print()
        print("="*60)
        print("INDEX CREATION SUMMARY")
        print("="*60)
        print(f"✓ Created:  {created_count} indexes")
        print(f"⏭ Skipped:  {skipped_count} indexes (already exist)")
        if error_count > 0:
            print(f"❌ Errors:   {error_count} indexes")
        print()
        
        if error_count == 0 and created_count > 0:
            print("✓ All indexes created successfully!")
        elif skipped_count > 0 and created_count == 0 and error_count == 0:
            print("✓ All indexes already exist - database is up to date!")
        elif error_count > 0:
            print("⚠ Some indexes could not be created. Check the errors above.")
        
        print("="*60)
        print()
        
        # Show index statistics
        print("Database Index Statistics:")
        print("-" * 60)
        try:
            stats_query = text("""
                SELECT 
                    tbl_name as table_name,
                    COUNT(*) as index_count
                FROM sqlite_master 
                WHERE type='index' AND sql IS NOT NULL
                GROUP BY tbl_name
                ORDER BY index_count DESC
            """)
            results = db.session.execute(stats_query).fetchall()
            
            for row in results:
                print(f"  {row.table_name:<30} {row.index_count} indexes")
            
        except Exception as e:
            print(f"  Could not retrieve statistics: {e}")
        
        print()


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Add database indexes for performance')
    parser.add_argument(
        '--confirm',
        action='store_true',
        help='Confirm that you want to add indexes (runs automatically if not specified)'
    )
    
    args = parser.parse_args()
    
    print()
    print("This script will add performance indexes to the database.")
    print("Indexes improve query performance for frequently accessed columns.")
    print()
    
    if not args.confirm:
        response = input("Continue? (yes/no): ").strip().lower()
        if response not in ['yes', 'y']:
            print("Aborted.")
            sys.exit(0)
    
    print()
    add_indexes()
