"""
Swagger/OpenAPI Configuration
API Documentation for Slow Learning Platform
"""

swagger_config = {
    "headers": [],
    "specs": [
        {
            "endpoint": 'apispec',
            "route": '/apispec.json',
            "rule_filter": lambda rule: True,
            "model_filter": lambda tag: True,
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/api/docs"
}

swagger_template = {
    "swagger": "2.0",
    "info": {
        "title": "Slow Learning Platform API",
        "description": "RESTful API for the Slow Learning educational platform with ML-powered engagement prediction",
        "version": "1.0.0",
        "contact": {
            "name": "API Support",
            "email": "support@slowlearning.edu"
        }
    },
    "basePath": "/api",
    "schemes": [
        "http",
        "https"
    ],
    "securityDefinitions": {
        "Bearer": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header",
            "description": "JWT Authorization header using the Bearer scheme. Example: 'Bearer {token}'"
        }
    },
    "tags": [
        {
            "name": "Authentication",
            "description": "User authentication and profile management"
        },
        {
            "name": "Lessons",
            "description": "Lesson content and progress tracking"
        },
        {
            "name": "Gamification",
            "description": "XP, achievements, leaderboards, and streaks"
        },
        {
            "name": "Analytics",
            "description": "Learning analytics and engagement metrics"
        },
        {
            "name": "ML Analytics",
            "description": "Machine learning engagement predictions"
        },
        {
            "name": "Recommendations",
            "description": "Personalized learning recommendations"
        },
        {
            "name": "Assessment",
            "description": "Learning style assessments"
        },
        {
            "name": "Uploads",
            "description": "File uploads (profile pictures, assignments)"
        }
    ],
    "definitions": {
        "User": {
            "type": "object",
            "properties": {
                "id": {"type": "integer"},
                "username": {"type": "string"},
                "email": {"type": "string"},
                "role": {"type": "string", "enum": ["student", "teacher", "admin"]},
                "total_xp": {"type": "integer"},
                "level": {"type": "integer"},
                "current_streak": {"type": "integer"},
                "avatar_url": {"type": "string"}
            }
        },
        "Lesson": {
            "type": "object",
            "properties": {
                "id": {"type": "integer"},
                "title": {"type": "string"},
                "description": {"type": "string"},
                "category": {"type": "string"},
                "difficulty": {"type": "string"},
                "is_active": {"type": "boolean"}
            }
        },
        "Error": {
            "type": "object",
            "properties": {
                "error": {"type": "string"},
                "details": {"type": "string"}
            }
        }
    }
}
