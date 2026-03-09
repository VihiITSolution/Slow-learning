"""
File Upload Routes
Handles profile pictures and assignment submissions
"""
from flask import Blueprint, request, jsonify, send_from_directory, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from app import db
from app.models.user import User
import os
from PIL import Image
import uuid

bp = Blueprint('uploads', __name__, url_prefix='/api/uploads')


def allowed_file(filename, allowed_extensions=None):
    """Check if file extension is allowed"""
    if allowed_extensions is None:
        allowed_extensions = current_app.config['ALLOWED_EXTENSIONS']
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in allowed_extensions


def resize_image(image_path, max_size=(400, 400)):
    """Resize image to max dimensions while maintaining aspect ratio"""
    try:
        img = Image.open(image_path)
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
        img.save(image_path, optimize=True, quality=85)
        return True
    except Exception as e:
        print(f"Error resizing image: {e}")
        return False


@bp.route('/profile-picture', methods=['POST'])
@jwt_required()
def upload_profile_picture():
    """
    Upload or update user's profile picture
    
    Expected: multipart/form-data with 'file' field
    Returns: {success, message, file_url}
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Check if file is in request
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    # Check if file was actually selected
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    # Check file type
    image_extensions = {'png', 'jpg', 'jpeg', 'gif'}
    if not allowed_file(file.filename, image_extensions):
        return jsonify({
            'error': 'Invalid file type. Allowed: png, jpg, jpeg, gif'
        }), 400
    
    try:
        # Generate unique filename
        file_ext = file.filename.rsplit('.', 1)[1].lower()
        filename = f"user_{user_id}_{uuid.uuid4().hex[:8]}.{file_ext}"
        
        # Save file
        filepath = os.path.join(
            current_app.config['PROFILE_PICTURE_FOLDER'],
            filename
        )
        file.save(filepath)
        
        # Resize image
        if not resize_image(filepath):
            # If resize fails, still keep the original
            pass
        
        # Delete old profile picture if exists
        if user.profile_picture and user.profile_picture != filename:
            old_file = os.path.join(
                current_app.config['PROFILE_PICTURE_FOLDER'],
                user.profile_picture
            )
            if os.path.exists(old_file):
                os.remove(old_file)
        
        # Update user profile
        user.profile_picture = filename
        db.session.commit()
        
        file_url = f"/api/uploads/profile-pictures/{filename}"
        
        return jsonify({
            'success': True,
            'message': 'Profile picture updated successfully',
            'file_url': file_url,
            'filename': filename
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': 'Failed to upload profile picture',
            'details': str(e)
        }), 500


@bp.route('/profile-pictures/<filename>')
def get_profile_picture(filename):
    """Serve profile picture file"""
    try:
        return send_from_directory(
            current_app.config['PROFILE_PICTURE_FOLDER'],
            filename
        )
    except FileNotFoundError:
        return jsonify({'error': 'File not found'}), 404


@bp.route('/assignment', methods=['POST'])
@jwt_required()
def upload_assignment():
    """
    Upload assignment submission
    
    Expected: multipart/form-data with 'file' and 'lesson_id' fields
    Returns: {success, message, file_url}
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Check if file is in request
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    lesson_id = request.form.get('lesson_id')
    
    # Validate
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not lesson_id:
        return jsonify({'error': 'Lesson ID is required'}), 400
    
    # Check file type
    if not allowed_file(file.filename):
        return jsonify({
            'error': 'Invalid file type. Allowed: pdf, doc, docx, txt, png, jpg, jpeg'
        }), 400
    
    try:
        # Generate unique filename
        file_ext = file.filename.rsplit('.', 1)[1].lower()
        original_name = secure_filename(file.filename.rsplit('.', 1)[0])
        filename = f"user_{user_id}_lesson_{lesson_id}_{uuid.uuid4().hex[:8]}_{original_name}.{file_ext}"
        
        # Create lesson-specific folder
        lesson_folder = os.path.join(
            current_app.config['ASSIGNMENT_FOLDER'],
            f"lesson_{lesson_id}"
        )
        os.makedirs(lesson_folder, exist_ok=True)
        
        # Save file
        filepath = os.path.join(lesson_folder, filename)
        file.save(filepath)
        
        file_url = f"/api/uploads/assignments/lesson_{lesson_id}/{filename}"
        
        # TODO: Create AssignmentSubmission model and store in database
        # submission = AssignmentSubmission(
        #     user_id=user_id,
        #     lesson_id=lesson_id,
        #     filename=filename,
        #     file_path=filepath,
        #     submitted_at=datetime.utcnow()
        # )
        # db.session.add(submission)
        # db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Assignment submitted successfully',
            'file_url': file_url,
            'filename': filename
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to upload assignment',
            'details': str(e)
        }), 500


@bp.route('/assignments/lesson_<int:lesson_id>/<filename>')
@jwt_required()
def get_assignment(lesson_id, filename):
    """Serve assignment file (students can only access their own)"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        # Teachers and admins can access all assignments
        # Students can only access their own
        if user.role == 'student' and f"user_{user_id}" not in filename:
            return jsonify({'error': 'Unauthorized'}), 403
        
        lesson_folder = os.path.join(
            current_app.config['ASSIGNMENT_FOLDER'],
            f"lesson_{lesson_id}"
        )
        
        return send_from_directory(lesson_folder, filename)
        
    except FileNotFoundError:
        return jsonify({'error': 'File not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/profile-picture', methods=['DELETE'])
@jwt_required()
def delete_profile_picture():
    """Delete user's profile picture"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if not user.profile_picture:
        return jsonify({'message': 'No profile picture to delete'}), 200
    
    try:
        # Delete file
        filepath = os.path.join(
            current_app.config['PROFILE_PICTURE_FOLDER'],
            user.profile_picture
        )
        
        if os.path.exists(filepath):
            os.remove(filepath)
        
        # Update user
        user.profile_picture = None
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Profile picture deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': 'Failed to delete profile picture',
            'details': str(e)
        }), 500
