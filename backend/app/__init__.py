"""
Flask Application Factory
"""
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from flasgger import Swagger
from config.config import config
from config.swagger_config import swagger_config, swagger_template
import os

db = SQLAlchemy()
jwt = JWTManager()
mail = Mail()
swagger = Swagger()


def create_app(config_name='development'):
    """Create and configure the Flask application"""
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    
    # Configure CORS with specific origins
    cors_origins = os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(',')
    CORS(app, resources={r"/api/*": {"origins": cors_origins}})
    
    jwt.init_app(app)
    mail.init_app(app)
    
    # Initialize Swagger - pass config during Swagger() instantiation
    Swagger(app, config=swagger_config, template=swagger_template)
    
    # Create upload folders if they don't exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(app.config['PROFILE_PICTURE_FOLDER'], exist_ok=True)
    os.makedirs(app.config['ASSIGNMENT_FOLDER'], exist_ok=True)
    
    # Register blueprints
    from app.routes import auth, lessons, gamification, analytics, recommendations, learning_assessment, uploads
    from app.routes.ml_analytics import ml_analytics_bp
    
    app.register_blueprint(auth.bp, url_prefix='/api/auth')
    app.register_blueprint(lessons.bp, url_prefix='/api/lessons')
    app.register_blueprint(gamification.bp, url_prefix='/api/gamification')
    app.register_blueprint(analytics.bp, url_prefix='/api/analytics')
    app.register_blueprint(recommendations.bp, url_prefix='/api/recommendations')
    app.register_blueprint(learning_assessment.bp, url_prefix='/api/assessment')
    app.register_blueprint(uploads.bp)  # Already has url_prefix in blueprint
    app.register_blueprint(ml_analytics_bp)  # Already has url_prefix in blueprint
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    return app
