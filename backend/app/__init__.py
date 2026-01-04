"""
Flask Application Factory
"""
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config.config import config

db = SQLAlchemy()
jwt = JWTManager()


def create_app(config_name='development'):
    """Create and configure the Flask application"""
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    CORS(app)
    jwt.init_app(app)
    
    # Register blueprints
    from app.routes import auth, lessons, gamification, analytics, recommendations
    from app.routes.ml_analytics import ml_analytics_bp
    
    app.register_blueprint(auth.bp, url_prefix='/api/auth')
    app.register_blueprint(lessons.bp, url_prefix='/api/lessons')
    app.register_blueprint(gamification.bp, url_prefix='/api/gamification')
    app.register_blueprint(analytics.bp, url_prefix='/api/analytics')
    app.register_blueprint(recommendations.bp, url_prefix='/api/recommendations')
    app.register_blueprint(ml_analytics_bp)  # Already has url_prefix in blueprint
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    return app
