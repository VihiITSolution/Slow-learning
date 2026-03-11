"""
User Model

Represents a user in the gamified learning platform. Users can be students, teachers, or admins.
Each user has gamification features (XP, levels, streaks), learning progress tracking,
and engagement metrics for ML-powered insights.

Attributes:
    id (int): Primary key, unique user identifier
    username (str): Unique username (3-80 chars)
    email (str): Unique email address
    password_hash (str): Hashed password (never store plaintext!)
    role (str): User role - 'student', 'teacher', or 'admin'
    
    Gamification Fields:
        total_xp (int): Total experience points earned
        level (int): Current level (calculated from XP)
        current_streak (int): Consecutive days of activity
        longest_streak (int): Best streak achieved
        last_login (datetime): Last login timestamp
        
    Profile Fields:
        avatar_url (str): Avatar image URL
        avatar_items (JSON): Unlocked avatar customizations
        profile_picture (str): Uploaded profile picture filename
        
    Engagement Metrics (for ML):
        total_time_spent (int): Total minutes spent learning
        lessons_completed (int): Count of completed lessons
        quizzes_taken (int): Count of quiz attempts
        
    Learning Assessment:
        learning_style (str): Primary learning style (visual/auditory/kinesthetic)
        assessment_score (int): Last assessment result
        assessment_date (datetime): When assessed
        assessment_data (JSON): Detailed assessment results
        
    Timestamps:
        created_at (datetime): Account creation date
        updated_at (datetime): Last modification date
        
    Relationships:
        progress: One-to-many with Progress (lesson progress records)
        achievements: One-to-many with Achievement (earned achievements)
        quiz_attempts: One-to-many with QuizAttempt (quiz history)
"""
from app import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash


class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='student')  # 'student' or 'teacher'
    
    # Gamification fields
    total_xp = db.Column(db.Integer, default=0)
    level = db.Column(db.Integer, default=1)
    current_streak = db.Column(db.Integer, default=0)
    longest_streak = db.Column(db.Integer, default=0)
    last_login = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Avatar customization
    avatar_url = db.Column(db.String(255), default='default_avatar.png')
    avatar_items = db.Column(db.JSON, default=[])
    profile_picture = db.Column(db.String(255))  # Uploaded profile picture filename
    
    # Engagement metrics
    total_time_spent = db.Column(db.Integer, default=0)  # in minutes
    lessons_completed = db.Column(db.Integer, default=0)
    quizzes_taken = db.Column(db.Integer, default=0)
    
    # Learning Assessment Results
    learning_style = db.Column(db.String(100))  # Primary learning style
    assessment_score = db.Column(db.Integer)  # Last assessment score
    assessment_date = db.Column(db.DateTime)  # When assessed
    assessment_data = db.Column(db.JSON)  # Detailed assessment results
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    progress = db.relationship('Progress', backref='user', lazy='dynamic')
    achievements = db.relationship('Achievement', backref='user', lazy='dynamic')
    quiz_attempts = db.relationship('QuizAttempt', backref='user', lazy='dynamic')
    
    def set_password(self, password):
        """
        Hash and securely store user password.
        
        Uses Werkzeug's generate_password_hash with pbkdf2:sha256 algorithm.
        Never stores plaintext passwords for security.
        
        Args:
            password (str): Plaintext password to hash
            
        Security Note:
            - Uses salt for protection against rainbow tables
            - PBKDF2 with SHA256 provides strong key derivation
            - Hash includes method and salt automatically
        """
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """
        Verify password against stored hash.
        
        Args:
            password (str): Plaintext password to verify
            
        Returns:
            bool: True if password matches, False otherwise
            
        Security Note:
            Uses constant-time comparison to prevent timing attacks
        """
        return check_password_hash(self.password_hash, password)
    
    def add_xp(self, xp_amount):
        """
        Add experience points to user and handle level-up logic.
        
        The level system uses square root scaling to provide:
        - Quick early progression (motivating beginners)
        - Gradually increasing requirements (sustained engagement)
        - Predictable, fair advancement
        
        Level Formula:
            level = floor(sqrt(total_xp / 100)) + 1
            
        Example progression:
            Level 1: 0-99 XP
            Level 2: 100-399 XP  
            Level 3: 400-899 XP
            Level 4: 900-1599 XP
            Level 5: 1600-2499 XP
            Level 10: 10,000 XP
            
        Args:
            xp_amount (int): XP points to add (typically 10-100)
            
        Returns:
            bool: True if user leveled up, False if no level change
            
        Side Effects:
            - Updates self.total_xp
            - Updates self.level if threshold crossed
            - Triggers achievement checks (handled by caller)
        """
        self.total_xp += xp_amount
        
        # Calculate new level using square root formula
        # Provides diminishing returns - each level requires more XP
        new_level = int((self.total_xp / 100) ** 0.5) + 1
        
        if new_level > self.level:
            self.level = new_level
            return True  # Level up occurred - caller should notify user
        return False
    
    def to_dict(self):
        """
        Serialize user object to dictionary for JSON responses.
        
        Excludes sensitive data like password_hash for security.
        Formats datetime objects as ISO 8601 strings for frontend compatibility.
        
        Returns:
            dict: User data safe for API responses
            
        Note:
            - Never include password_hash in responses
            - All dates converted to ISO format for JavaScript
            - Includes only public profile information
        """
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'total_xp': self.total_xp,
            'level': self.level,
            'current_streak': self.current_streak,
            'longest_streak': self.longest_streak,
            'avatar_url': self.avatar_url,
            'lessons_completed': self.lessons_completed,
            'quizzes_taken': self.quizzes_taken,
            'learning_style': self.learning_style,
            'assessment_score': self.assessment_score,
            'assessment_date': self.assessment_date.isoformat() if self.assessment_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
