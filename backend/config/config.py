"""
Configuration settings for the application
"""
import os
from datetime import timedelta


class Config:
    """Base configuration"""
    SECRET_KEY = os.environ.get('SECRET_KEY')
    if not SECRET_KEY:
        raise ValueError('SECRET_KEY environment variable must be set')
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT Configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    if not JWT_SECRET_KEY:
        raise ValueError('JWT_SECRET_KEY environment variable must be set')
    
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=2)
    
    # CORS Configuration
    CORS_HEADERS = 'Content-Type'
    
    # Mail Configuration
    MAIL_SERVER = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.environ.get('MAIL_PORT', 587))
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'True').lower() == 'true'
    MAIL_USE_SSL = os.environ.get('MAIL_USE_SSL', 'False').lower() == 'true'
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER', 'noreply@slowlearning.edu')
    MAIL_MAX_EMAILS = int(os.environ.get('MAIL_MAX_EMAILS', 50))
    
    # File Upload Configuration
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', 'uploads')
    MAX_CONTENT_LENGTH = int(os.environ.get('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))  # 16MB default
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf', 'doc', 'docx', 'txt'}
    PROFILE_PICTURE_FOLDER = os.path.join(UPLOAD_FOLDER, 'profiles')
    ASSIGNMENT_FOLDER = os.path.join(UPLOAD_FOLDER, 'assignments')

    # AI assistant (Google Gemini). Optional: without a key the AI buttons
    # use simple built-in suggestions instead.
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY') or None
    GEMINI_MODEL = os.environ.get('GEMINI_MODEL', 'gemini-3.5-flash-lite')
    # Used if Google retires the main model name
    GEMINI_FALLBACK_MODEL = os.environ.get('GEMINI_FALLBACK_MODEL', 'gemini-flash-latest')
    GEMINI_API_BASE = os.environ.get('GEMINI_API_BASE', 'https://generativelanguage.googleapis.com/v1beta')
    GEMINI_TIMEOUT = int(os.environ.get('GEMINI_TIMEOUT', 20))


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('DEV_DATABASE_URL') or \
        'sqlite:///dev_database.db'


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///production_database.db'


class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///test_database.db'
    # Tests never call Google; they switch the key on and mock the reply
    GEMINI_API_KEY = None


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
