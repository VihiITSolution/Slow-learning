"""
Authentication Routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from datetime import datetime, timedelta

bp = Blueprint('auth', __name__)


@bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user
    ---
    tags:
      - Authentication
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - username
            - email
            - password
          properties:
            username:
              type: string
              example: johndoe
            email:
              type: string
              example: johndoe@example.com
            password:
              type: string
              example: SecurePass123!
            role:
              type: string
              enum: [student, teacher]
              default: student
              example: student
    responses:
      201:
        description: User registered successfully
        schema:
          type: object
          properties:
            message:
              type: string
            user:
              $ref: '#/definitions/User'
            access_token:
              type: string
      400:
        description: Missing required fields or invalid role
        schema:
          $ref: '#/definitions/Error'
      409:
        description: Username or email already exists
        schema:
          $ref: '#/definitions/Error'
    """
    data = request.get_json()
    
    # Validate required fields
    if not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Check if user already exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 409
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 409
    
    # Validate role (only allow student or teacher via registration)
    role = data.get('role', 'student')
    if role not in ['student', 'teacher']:
        return jsonify({'error': 'Invalid role. Only student or teacher allowed'}), 400
    
    # Create new user. Signing up logs the user in, so it is their first
    # login: start the daily streak (otherwise it stays 0 until they log in
    # again, and the engagement model sees no streak on day one)
    now = datetime.utcnow()
    user = User(
        username=data['username'],
        email=data['email'],
        role=role,
        last_login=now,
        current_streak=1,
        longest_streak=1
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    # Generate access token
    access_token = create_access_token(identity=str(user.id))
    
    return jsonify({
        'message': 'User registered successfully',
        'user': user.to_dict(),
        'access_token': access_token
    }), 201


@bp.route('/login', methods=['POST'])
def login():
    """
    Login user and update streak
    ---
    tags:
      - Authentication
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - username
            - password
          properties:
            username:
              type: string
              example: johndoe
            password:
              type: string
              example: SecurePass123!
    responses:
      200:
        description: Login successful
        schema:
          type: object
          properties:
            message:
              type: string
            user:
              $ref: '#/definitions/User'
            access_token:
              type: string
      400:
        description: Missing username or password
        schema:
          $ref: '#/definitions/Error'
      401:
        description: Invalid credentials
        schema:
          $ref: '#/definitions/Error'
    """
    data = request.get_json(silent=True) or {}
    
    # Validate required fields
    if not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Missing username or password'}), 400
    
    # Find user by username, or by email (the admin login asks for an email)
    identifier = data['username'].strip()
    user = User.query.filter_by(username=identifier).first()
    if not user and '@' in identifier:
        user = User.query.filter(db.func.lower(User.email) == identifier.lower()).first()
    
    # Verify credentials with constant-time comparison (prevents timing attacks)
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # === Streak Calculation Logic ===
    # Daily streaks motivate consistent learning by rewarding consecutive logins
    # Algorithm: Compare current date with last login to determine streak behavior
    
    today = datetime.utcnow().date()
    last_login_date = user.last_login.date() if user.last_login else None
    
    if last_login_date:
        # Calculate days elapsed since last login
        days_diff = (today - last_login_date).days
        
        if days_diff == 1:
            # Case 1: Consecutive day login (yesterday -> today)
            # Increment streak and check if it's a new personal record
            user.current_streak += 1
            if user.current_streak > user.longest_streak:
                user.longest_streak = user.current_streak  # Update best streak
        elif days_diff > 1:
            # Case 2: Gap in logins (streak broken)
            # Reset streak to 1 (today counts as new streak start)
            user.current_streak = 1
        # Case 3: days_diff == 0 (same day login)
        # No action needed - streak unchanged
    else:
        # First ever login - start streak at 1
        user.current_streak = 1
    
    # Update last login timestamp for future streak calculations
    user.last_login = datetime.utcnow()
    db.session.commit()
    
    # Generate JWT access token (expires in 24 hours by default)
    # Identity stored as string to match get_jwt_identity() return type
    access_token = create_access_token(identity=str(user.id))
    
    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict(),
        'access_token': access_token
    }), 200


@bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """
    Get current user profile
    ---
    tags:
      - Authentication
    security:
      - Bearer: []
    responses:
      200:
        description: User profile
        schema:
          $ref: '#/definitions/User'
      401:
        description: Unauthorized - invalid or missing token
        schema:
          $ref: '#/definitions/Error'
      404:
        description: User not found
        schema:
          $ref: '#/definitions/Error'
    """
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify(user.to_dict()), 200

@bp.route('/students', methods=['GET'])
@jwt_required()
def get_students():
    """
    Get all students (teacher/admin only)
    """
    # Only the teacher/admin pages use this list (they are role-protected in the UI)
    current_user = User.query.get(int(get_jwt_identity()))
    if not current_user or current_user.role not in ['teacher', 'admin']:
        return jsonify({'error': 'Access denied. Teacher or admin role required'}), 403

    students = User.query.filter_by(role='student').all()

    return jsonify({
        'students': [user.to_dict() for user in students],
        'total': len(students)
    }), 200

@bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    # Update allowed fields
    if 'avatar_url' in data:
        user.avatar_url = data['avatar_url']
    if 'avatar_items' in data:
        user.avatar_items = data['avatar_items']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Profile updated successfully',
        'user': user.to_dict()
    }), 200
