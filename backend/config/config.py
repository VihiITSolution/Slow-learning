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


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
