# Admin Guide - LearnQuest Platform ⚙️

Welcome to the LearnQuest Admin Guide! This comprehensive manual covers platform configuration, user management, system maintenance, and troubleshooting.

## Table of Contents
1. [Admin Access](#admin-access)
2. [Admin Dashboard](#admin-dashboard)
3. [User Management](#user-management)
4. [Course Management](#course-management)
5. [Content Management](#content-management)
6. [System Configuration](#system-configuration)
7. [Database Management](#database-management)
8. [ML Model Management](#ml-model-management)
9. [Analytics and Reporting](#analytics-and-reporting)
10. [Security Management](#security-management)
11. [Backup and Recovery](#backup-and-recovery)
12. [Performance Optimization](#performance-optimization)
13. [Troubleshooting](#troubleshooting)
14. [Maintenance Tasks](#maintenance-tasks)

---

## Admin Access

### Creating Admin Account

**Command Line Method:**
```bash
cd backend
python create_admin.py
```

**Database Direct Method:**
```python
# In Python shell
from app import create_app, db
from app.models import User

app = create_app()
with app.app_context():
    admin = User(
        username='admin',
        email='admin@example.com',
        role='admin'
    )
    admin.set_password('secure_password')
    db.session.add(admin)
    db.session.commit()
```

### Admin Login

1. Navigate to `/admin/login`
2. Use admin credentials
3. Redirected to admin dashboard at `/admin/dashboard`

### Admin Privileges

Admin accounts have full access to:
- ✅ All student and teacher data
- ✅ Platform configuration
- ✅ User management (create, edit, delete)
- ✅ Content management (lessons, quizzes)
- ✅ System analytics and logs
- ✅ Database operations
- ✅ ML model training and deployment
- ✅ Security settings

---

## Admin Dashboard

### Dashboard Components

Access at `/admin/dashboard`:

#### 1. System Overview
- **Total Users:** Students, Teachers, Admins
- **Active Users:** Last 7 days, Last 30 days
- **Total Lessons:** Available in catalog
- **Total XP Distributed:** Platform-wide
- **Server Status:** CPU, Memory, Disk usage

#### 2. Recent Activity
- New user registrations
- Lesson completions
- Achievement unlocks
- System errors or warnings

#### 3. Platform Health Metrics
- Database connection status
- API response times
- ML model availability
- Email service status
- File upload storage

#### 4. Quick Actions
- Create new user
- Add lesson
- View system logs
- Export data
- Trigger ML model training

---

## User Management

### Accessing User Management

Navigate to `/admin/users`:

### User List View

**Display Columns:**
- ID
- Username
- Email
- Role (Student, Teacher, Admin)
- Level
- Total XP
- Join Date
- Last Active
- Status (Active/Inactive)
- Actions

### Creating Users

#### Manual Creation

1. Click "Create New User" button
2. Fill in required fields:
   - Username (unique, 3-20 characters)
   - Email (valid format)
   - Password (minimum 6 characters)
   - Role (Student, Teacher, Admin)
3. Optional fields:
   - Initial XP
   - Profile picture URL
4. Click "Create User"

#### Bulk User Creation

```python
# CSV Import Script
python backend/import_users.py --file users.csv

# CSV Format:
# username,email,password,role
# john_doe,john@example.com,pass123,student
# jane_smith,jane@example.com,pass456,teacher
```

### Editing Users

1. Click "Edit" button on user row
2. Modify fields:
   - Email
   - Role
   - XP (manual adjustment)
   - Level (recalculates from XP)
   - Streak (manual reset)
3. Save changes

### Deleting Users

**⚠️ Warning:** User deletion is permanent and removes:
- User account
- All progress data
- Achievements
- Lesson completions
- Quiz results

**Steps:**
1. Click "Delete" button
2. Confirm deletion (type username to verify)
3. Database cascade deletes related records

**Soft Delete Alternative:**
- Set user status to "Inactive"
- Preserves data for analytics
- User cannot log in

### User Roles and Permissions

| Role | Permissions |
|------|-------------|
| **Student** | View lessons, complete activities, earn XP, view own data |
| **Teacher** | All student permissions + assess students, view class analytics |
| **Admin** | Full platform access, user management, system configuration |

### Changing User Roles

1. Edit user
2. Select new role from dropdown
3. Save changes
4. User's permissions update immediately

### Password Reset

#### For Individual User

1. Navigate to user in admin panel
2. Click "Reset Password"
3. System generates temporary password
4. Send to user via email or manual notification

#### Force Reset on Next Login

```python
# In database
from app.models import User
user = User.query.filter_by(username='john_doe').first()
user.force_password_reset = True
db.session.commit()
```

---

## Course Management

### Accessing Course Management

Navigate to `/admin/courses`:

### Course Structure

**Hierarchy:**
- Categories (Programming, Math, Science, etc.)
  - Lessons (individual learning units)
    - Content (text, images, videos)
    - Quizzes (optional assessments)

### Managing Categories

#### Create Category

1. Click "Add Category"
2. Enter:
   - Name (unique)
   - Description
   - Icon/emoji
3. Save category

#### Edit Category

1. Select category
2. Modify name or description
3. Reorder lessons within category

#### Delete Category

**⚠️ Warning:** Deleting category removes all lessons within it

### Managing Lessons

#### Create New Lesson

1. Navigate to "Add Lesson"
2. Fill in details:
   ```
   Title: Introduction to Python
   Category: Programming
   Difficulty: Easy (1-3: Easy, 4-6: Medium, 7-10: Hard)
   Estimated Time: 30 (minutes)
   Prerequisites: None
   Content: [Rich text editor]
   ```
3. Add supplementary materials:
   - Videos (embed URL)
   - Images (upload)
   - Code snippets (syntax highlighted)
   - External links
4. Create associated quiz (optional)
5. Publish lesson

#### Edit Existing Lesson

1. Find lesson in course management
2. Click "Edit"
3. Modify content
4. Update version number
5. Save changes (notifies students who've started)

#### Lesson Status

- **Draft:** Visible only to admins
- **Published:** Available to all students
- **Archived:** Hidden from catalog but accessible via direct link

### Quiz Management

#### Creating Quizzes

```python
# Quiz structure
{
    "lesson_id": 1,
    "title": "Python Basics Quiz",
    "questions": [
        {
            "question": "What is Python?",
            "type": "multiple_choice",
            "options": ["A language", "A snake", "A tool", "All above"],
            "correct_answer": "A language",
            "points": 10
        }
    ],
    "pass_score": 70,
    "time_limit": 600  # seconds
}
```

#### Question Types

1. **Multiple Choice**
2. **True/False**
3. **Fill in the Blank**
4. **Code Completion**
5. **Short Answer** (manual grading)

---

## Content Management

### File Uploads

#### Profile Pictures

**Location:** `backend/uploads/profile_pictures/`

**Configuration:**
```python
# config/config.py
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
```

**Cleanup:**
```bash
# Remove orphaned files
python backend/cleanup_uploads.py --orphaned
```

#### Lesson Materials

**Location:** `backend/uploads/lesson_materials/`

**Supported Formats:**
- Images: PNG, JPG, GIF
- Documents: PDF
- Videos: MP4, WebM (or embed YouTube/Vimeo)

### Media Management

#### Storage Monitoring

```bash
# Check upload folder size
cd backend
python -c "import os; print(sum(os.path.getsize(os.path.join(dirpath,filename)) for dirpath, dirnames, filenames in os.walk('uploads') for filename in filenames) / (1024*1024), 'MB')"
```

#### Storage Limits

Set in configuration:
```python
# Maximum total storage
MAX_STORAGE_GB = 10

# Per-user storage
MAX_USER_STORAGE_MB = 50
```

---

## System Configuration

### Environment Variables

**File:** `backend/.env`

```bash
# Flask Configuration
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-here
FLASK_ENV=production

# Database
DATABASE_URL=sqlite:///learnquest.db
# Or PostgreSQL: postgresql://user:pass@localhost/dbname

# Email Configuration
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_DEFAULT_SENDER=noreply@learnquest.com

# ML Model
ML_MODEL_PATH=app/ml_models/saved_models/engagement_model.pkl

# File Uploads
UPLOAD_FOLDER=uploads
MAX_CONTENT_LENGTH=5242880  # 5MB in bytes

# CORS
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### Application Settings

**File:** `backend/config/config.py`

```python
class Config:
    # Security
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    # JWT
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # Pagination
    ITEMS_PER_PAGE = 20
    
    # XP System
    LESSON_COMPLETION_XP = 50
    ACHIEVEMENT_BASE_XP = 10
    
    # Levels
    # Level = floor(sqrt(total_xp / 100))
```

### Modifying XP Rewards

```python
# In config/config.py or admin panel
XP_REWARDS = {
    'lesson_completion': 50,
    'quiz_completion': 30,
    'perfect_quiz': 50,
    'daily_login': 5,
    'streak_bonus': 10,
    'achievement': {
        'common': 10,
        'rare': 25,
        'epic': 50,
        'legendary': 100
    }
}
```

---

## Database Management

### Database Schema

**Main Tables:**
- `user` - User accounts and profiles
- `lesson` - Lesson catalog
- `progress` - User lesson progress
- `achievement` - Achievement definitions
- `user_achievement` - Unlocked achievements
- `quiz` - Quiz definitions
- `quiz_result` - Quiz attempts and scores
- `game_session` - Interactive game records
- `leaderboard` - Cached leaderboard data

### Database Migrations

Using Flask-Migrate:

```bash
# Create migration
flask db migrate -m "Add new column"

# Apply migration
flask db upgrade

# Rollback migration
flask db downgrade

# View migration history
flask db history
```

### Database Backups

#### Automated Backup Script

```bash
# backup_db.sh
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups"
DB_FILE="instance/learnquest.db"

mkdir -p $BACKUP_DIR
cp $DB_FILE "$BACKUP_DIR/learnquest_$DATE.db"

# Keep only last 30 backups
ls -t $BACKUP_DIR/learnquest_*.db | tail -n +31 | xargs rm -f

echo "Backup completed: learnquest_$DATE.db"
```

**Schedule with cron:**
```bash
# Daily backup at 2 AM
0 2 * * * /path/to/backup_db.sh
```

#### Manual Backup

```bash
# SQLite
cp instance/learnquest.db instance/learnquest_backup_$(date +%Y%m%d).db

# PostgreSQL
pg_dump learnquest > learnquest_backup_$(date +%Y%m%d).sql
```

### Database Maintenance

#### Vacuum (SQLite)

```bash
sqlite3 instance/learnquest.db "VACUUM;"
```

#### Analyze (Update Statistics)

```bash
sqlite3 instance/learnquest.db "ANALYZE;"
```

#### Check Integrity

```bash
sqlite3 instance/learnquest.db "PRAGMA integrity_check;"
```

---

## ML Model Management

### Engagement Prediction Model

**Location:** `backend/app/ml_models/saved_models/engagement_model.pkl`

### Training the Model

```bash
cd backend
python train_engagement_model.py
```

**Training Process:**
1. Fetches user data from database
2. Extracts features (streak, lessons, time, etc.)
3. Trains Logistic Regression model
4. Evaluates on test set
5. Saves model if accuracy > 90%

### Model Features

```python
features = [
    'current_streak',        # Days
    'lessons_completed',     # Count
    'quizzes_taken',        # Count
    'total_time_spent',     # Minutes
    'days_since_last_activity'  # Days
]
```

### Retraining Schedule

**Recommended:** Retrain weekly to incorporate new data

```bash
# Cron job for Sunday 3 AM
0 3 * * 0 cd /path/to/backend && python train_engagement_model.py
```

### Model Monitoring

Check model performance:

```python
from app.ml_models import EngagementPredictor

predictor = EngagementPredictor()
metrics = predictor.evaluate()
print(f"Accuracy: {metrics['accuracy']}")
print(f"Precision: {metrics['precision']}")
print(f"Recall: {metrics['recall']}")
```

### Model Versioning

```bash
# Save with version
cp engagement_model.pkl engagement_model_v1.0_20260310.pkl

# Rollback if needed
cp engagement_model_v1.0_20260310.pkl engagement_model.pkl
```

---

## Analytics and Reporting

### Platform-Wide Analytics

Access at `/admin/analytics`:

#### User Analytics
- Total registrations by date
- Active users (DAU, WAU, MAU)
- User retention rates
- Churn analysis
- Role distribution

#### Content Analytics
- Most completed lessons
- Highest-rated content
- Average completion time per lesson
- Dropout rates by lesson

#### Engagement Analytics
- Average XP per user
- Streak distribution
- Login frequency
- Session duration

#### Performance Analytics
- API response times
- Database query performance
- Error rates
- Server resource usage

### Exporting Data

#### Export User Data

```python
# Export all users to CSV
python backend/export_data.py --table users --format csv

# Export with date range
python backend/export_data.py --table progress --start 2026-01-01 --end 2026-03-10
```

#### Export Analytics Reports

```bash
# Generate monthly report
python backend/generate_report.py --type monthly --month 2026-03

# Generate custom report
python backend/generate_report.py --config custom_report.json
```

---

## Security Management

### Authentication Security

#### Password Requirements

Enforce in configuration:
```python
PASSWORD_MIN_LENGTH = 8
PASSWORD_REQUIRE_UPPERCASE = True
PASSWORD_REQUIRE_NUMBER = True
PASSWORD_REQUIRE_SPECIAL = False
```

#### Failed Login Attempts

```python
# Lock account after failures
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_DURATION = 900  # 15 minutes
```

### JWT Token Management

**Token Invalidation:**
```python
# Revoke user's tokens
from app.utils.jwt_utils import revoke_user_tokens
revoke_user_tokens(user_id)
```

**Token Blacklist:**
```python
# Add token to blacklist
from app.models import TokenBlacklist
blacklist = TokenBlacklist(jti=token_jti, expired_at=expiry)
db.session.add(blacklist)
db.session.commit()
```

### CORS Configuration

```python
# config/config.py
CORS_ORIGINS = [
    'http://localhost:3000',
    'https://yourdomain.com'
]

# For production, never use '*'
```

### SQL Injection Prevention

✅ **Always use parameterized queries:**
```python
# GOOD
user = User.query.filter_by(username=username).first()

# BAD - Never do this
query = f"SELECT * FROM user WHERE username='{username}'"
```

### XSS Prevention

```python
# Input sanitization
from markupsafe import escape

safe_content = escape(user_input)
```

Frontend uses DOMPurify for HTML sanitization.

### File Upload Security

```python
# Validate file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Sanitize filenames
from werkzeug.utils import secure_filename
filename = secure_filename(file.filename)
```

---

## Backup and Recovery

### Backup Strategy

**3-2-1 Rule:**
- 3 copies of data
- 2 different media types
- 1 offsite backup

### Full System Backup

```bash
#!/bin/bash
# full_backup.sh

BACKUP_DIR="backups/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# Database
cp instance/learnquest.db $BACKUP_DIR/

# Uploads
tar -czf $BACKUP_DIR/uploads.tar.gz uploads/

# Configuration
cp backend/.env $BACKUP_DIR/
cp backend/config/config.py $BACKUP_DIR/

# ML Models
cp -r backend/app/ml_models/saved_models $BACKUP_DIR/

echo "Full backup completed: $BACKUP_DIR"
```

### Recovery Procedures

#### Database Recovery

```bash
# Stop application
# Replace database
cp backups/20260310/learnquest.db instance/learnquest.db
# Restart application
```

#### File Recovery

```bash
# Extract uploads backup
tar -xzf backups/20260310/uploads.tar.gz -C backend/
```

### Disaster Recovery Plan

1. **Immediate Actions:**
   - Stop application
   - Assess damage
   - Notify users if needed

2. **Recovery:**
   - Restore from latest backup
   - Verify data integrity
   - Test critical functions

3. **Post-Recovery:**
   - Investigate cause
   - Document incident
   - Improve backup procedures

---

## Performance Optimization

### Database Optimization

#### Index Management

```sql
-- Add indexes for common queries
CREATE INDEX idx_user_username ON user(username);
CREATE INDEX idx_progress_user_id ON progress(user_id);
CREATE INDEX idx_progress_lesson_id ON progress(lesson_id);
CREATE INDEX idx_achievement_user_id ON user_achievement(user_id);

-- Check existing indexes
SELECT * FROM sqlite_master WHERE type='index';
```

The project already has 23 indexes defined in the database initialization.

#### Query Optimization

```python
# Use select_related to reduce queries
from sqlalchemy.orm import joinedload

# Instead of:
user = User.query.get(user_id)
progress = user.progress  # Another query

# Do:
user = User.query.options(joinedload(User.progress)).get(user_id)
```

### Caching

#### Implement Redis Caching

```python
from flask_caching import Cache

cache = Cache(app, config={'CACHE_TYPE': 'redis'})

@cache.cached(timeout=300)
def get_leaderboard():
    return User.query.order_by(User.total_xp.desc()).limit(100).all()
```

#### Cache Invalidation

```python
# Clear specific cache
cache.delete('leaderboard')

# Clear all cache
cache.clear()
```

### API Rate Limiting

```python
from flask_limiter import Limiter

limiter = Limiter(
    app,
    key_func=lambda: request.headers.get('Authorization'),
    default_limits=["200 per day", "50 per hour"]
)

@app.route('/api/lessons')
@limiter.limit("10 per minute")
def get_lessons():
    # ...
```

### Static File Optimization

```bash
# Compress static files
gzip -9 -c frontend/build/static/js/main.js > frontend/build/static/js/main.js.gz

# Use CDN for static assets
# Configure in frontend/public/index.html
```

---

## Troubleshooting

### Common Issues

#### 1. Database Lock (SQLite)

**Symptom:** "database is locked" error

**Solution:**
```python
# Use WAL mode
import sqlite3
conn = sqlite3.connect('learnquest.db')
conn.execute('PRAGMA journal_mode=WAL')
conn.close()
```

#### 2. JWT Token Errors

**Symptom:** "Token has expired" or "Invalid token"

**Solutions:**
- Check system time sync
- Verify JWT_SECRET_KEY matches
- Clear blacklist table

#### 3. ML Model Not Found

**Symptom:** "Model file not found"

**Solution:**
```bash
# Retrain model
cd backend
python train_engagement_model.py
```

#### 4. File Upload Failures

**Symptom:** 413 Request Entity Too Large

**Solution:**
```python
# Increase max file size
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB
```

#### 5. CORS Errors

**Symptom:** "CORS policy: No 'Access-Control-Allow-Origin'"

**Solution:**
```python
# Add frontend URL to CORS_ORIGINS
CORS(app, origins=['http://localhost:3000', 'https://yourdomain.com'])
```

### Debug Mode

**Enable verbose logging:**

```python
# config/config.py
import logging

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s %(levelname)s: %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
```

### Health Check Endpoint

```python
@app.route('/health')
def health_check():
    checks = {
        'database': test_db_connection(),
        'ml_model': test_ml_model(),
        'email': test_email_service(),
        'storage': test_storage_space()
    }
    status = 'healthy' if all(checks.values()) else 'unhealthy'
    return jsonify({'status': status, 'checks': checks}), 200 if status == 'healthy' else 503
```

---

## Maintenance Tasks

### Daily Tasks
- ☐ Check error logs
- ☐ Monitor server resources
- ☐ Review new user registrations
- ☐ Check backup completion

### Weekly Tasks
- ☐ Review analytics reports
- ☐ Update content if needed
- ☐ Check for security updates
- ☐ Retrain ML model
- ☐ Clean up old files
- ☐ Test backup restoration

### Monthly Tasks
- ☐ Generate monthly reports
- ☐ Review user feedback
- ☐ Plan content updates
- ☐ System performance review
- ☐ Security audit
- ☐ Update documentation

### Quarterly Tasks
- ☐ Major system updates
- ☐ Database optimization
- ☐ Feature planning
- ☐ User survey
- ☐ Disaster recovery test

---

## Command Reference

### User Management
```bash
# Create admin user
python create_admin.py --username admin --email admin@example.com

# List all users
python manage_users.py --list

# Delete user
python manage_users.py --delete --user-id 123

# Reset password
python manage_users.py --reset-password --username john_doe
```

### Database Operations
```bash
# Initialize database
flask db init

# Create migration
flask db migrate -m "Description"

# Apply migrations
flask db upgrade

# Rollback
flask db downgrade

# Backup database
python backup_db.py

# Restore database
python restore_db.py --file backups/backup_20260310.db
```

### ML Model Operations
```bash
# Train engagement model
python train_engagement_model.py

# Evaluate model
python evaluate_model.py

# Make prediction
python predict_engagement.py --user-id 123
```

### Data Export
```bash
# Export users
python export_data.py --table users --format csv

# Export with filters
python export_data.py --table progress --status completed --format json

# Generate report
python generate_report.py --type weekly --output reports/
```

---

## API Documentation

### Swagger UI

Access interactive API documentation:
- **URL:** `http://localhost:5000/api/docs`
- **Features:** Test endpoints, view schemas, authentication

### API Endpoints Summary

| Category | Endpoint | Method | Description |
|----------|----------|--------|-------------|
| Auth | `/api/auth/register` | POST | Register user |
| Auth | `/api/auth/login` | POST | Login user |
| Lessons | `/api/lessons` | GET | Get all lessons |
| Progress | `/api/progress/start` | POST | Start lesson |
| Gamification | `/api/gamification/achievements` | GET | Get achievements |
| Analytics | `/api/analytics/dashboard` | GET | Dashboard data |
| ML | `/api/ml/predict-engagement` | GET | Engagement prediction |

---

## Getting Support

### Internal Resources
- README.md - Setup instructions
- API_USAGE_GUIDE.md - API details
- STUDENT_GUIDE.md - Student help
- TEACHER_GUIDE.md - Teacher help

### External Support
- GitHub Issues: Report bugs
- Email: support@learnquest.com
- Documentation: https://docs.learnquest.com

---

## Appendix

### Configuration Templates

#### Production .env
```bash
SECRET_KEY=use-strong-random-key-here
JWT_SECRET_KEY=use-different-strong-key
FLASK_ENV=production
DATABASE_URL=postgresql://user:pass@host/db
MAIL_SERVER=smtp.example.com
MAIL_PORT=587
CORS_ORIGINS=https://yourdomain.com
```

#### Development .env
```bash
SECRET_KEY=dev-key
JWT_SECRET_KEY=dev-jwt-key
FLASK_ENV=development
DATABASE_URL=sqlite:///learnquest.db
MAIL_SERVER=localhost
MAIL_PORT=1025
CORS_ORIGINS=http://localhost:3000
```

### Security Checklist

- ☐ Strong SECRET_KEY and JWT_SECRET_KEY in production
- ☐ HTTPS enabled (SSL certificate)
- ☐ Database credentials secured
- ☐ CORS properly configured (no wildcard *)
- ☐ File upload restrictions enforced
- ☐ SQL injection prevention (parameterized queries)
- ☐ XSS prevention (input sanitization)
- ☐ Rate limiting enabled
- ☐ Error messages don't expose sensitive info
- ☐ Backups encrypted
- ☐ Logs don't contain passwords
- ☐ Admin accounts use strong passwords
- ☐ Unused endpoints disabled
- ☐ Dependencies up to date

---

**Successful Administration! ⚙️🚀**

Remember: Great administration is invisible to users but essential for platform success. Stay proactive, monitor continuously, and always have a backup plan.

---

*Last Updated: March 10, 2026*  
*Version: 1.0*  
*For questions, contact: admin@learnquest.com*
