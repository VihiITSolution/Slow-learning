# 📡 API Usage Guide

Complete guide for integrating with the Slow-Learning Platform API.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
  - [Authentication Endpoints](#authentication-endpoints)
  - [Lesson Endpoints](#lesson-endpoints)
  - [Gamification Endpoints](#gamification-endpoints)
  - [ML Analytics Endpoints](#ml-analytics-endpoints)
  - [Recommendation Endpoints](#recommendation-endpoints)
  - [File Upload Endpoints](#file-upload-endpoints)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Code Examples](#code-examples)

---

## Quick Start

### Base URL

```
Development: http://localhost:5000
Production: https://your-domain.com
```

### Interactive Documentation

Visit the Swagger UI for interactive API testing:

```
http://localhost:5000/api/docs
```

### Authentication Headers

All protected endpoints require a JWT token:

```http
Authorization: Bearer <your-jwt-token>
```

---

## Authentication

### 1. Register a New User

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "johndoe@example.com",
  "password": "SecurePass123!",
  "role": "student"
}
```

**Response (201 Created):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "johndoe@example.com",
    "role": "student",
    "total_xp": 0,
    "level": 1,
    "current_streak": 0,
    "avatar_url": null
  },
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Validation Rules:**
- `username`: Required, must be unique
- `email`: Required, must be valid email format, must be unique
- `password`: Required, minimum 6 characters
- `role`: Optional, must be "student" or "teacher" (default: "student")

**Error Responses:**
```json
// 400 Bad Request - Missing fields
{
  "error": "Missing required fields"
}

// 409 Conflict - Username exists
{
  "error": "Username already exists"
}

// 409 Conflict - Email exists
{
  "error": "Email already exists"
}
```

---

### 2. Login

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "johndoe@example.com",
    "role": "student",
    "total_xp": 150,
    "level": 3,
    "current_streak": 5,
    "longest_streak": 10,
    "last_login": "2024-01-15T10:30:00"
  },
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Notes:**
- Login automatically updates the user's `current_streak`
- Consecutive daily logins increment the streak
- Missing a day resets the streak to 1
- JWT tokens expire after 2 hours

**Error Responses:**
```json
// 400 Bad Request
{
  "error": "Missing username or password"
}

// 401 Unauthorized
{
  "error": "Invalid credentials"
}
```

---

### 3. Get Current User Profile

**Endpoint:** `GET /api/auth/profile`

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "johndoe@example.com",
  "role": "student",
  "total_xp": 150,
  "level": 3,
  "current_streak": 5,
  "longest_streak": 10,
  "lessons_completed": 8,
  "quizzes_completed": 12,
  "last_login": "2024-01-15T10:30:00",
  "profile_picture": "/uploads/profiles/abc123.jpg",
  "avatar_url": null,
  "avatar_items": null
}
```

---

### 4. Get All Students (Teacher/Admin Only)

**Endpoint:** `GET /api/auth/students`

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Required Role:** `teacher` or `admin`

**Response (200 OK):**
```json
{
  "students": [
    {
      "id": 1,
      "username": "student1",
      "email": "student1@example.com",
      "total_xp": 150,
      "level": 3,
      "lessons_completed": 8
    },
    {
      "id": 2,
      "username": "student2",
      "email": "student2@example.com",
      "total_xp": 320,
      "level": 5,
      "lessons_completed": 15
    }
  ],
  "total": 2
}
```

**Error Responses:**
```json
// 403 Forbidden
{
  "error": "Access denied. Teacher or admin role required"
}
```

---

## API Endpoints

### Lesson Endpoints

#### 1. Get All Lessons

**Endpoint:** `GET /api/lessons`

**Query Parameters:**
- `category` (optional): Filter by category (e.g., "math", "reading")
- `difficulty` (optional): Filter by difficulty ("beginner", "intermediate", "advanced")

**Example Requests:**
```http
GET /api/lessons
GET /api/lessons?category=math
GET /api/lessons?difficulty=beginner
GET /api/lessons?category=reading&difficulty=intermediate
```

**Response (200 OK):**
```json
{
  "lessons": [
    {
      "id": 1,
      "title": "Introduction to Addition",
      "description": "Learn basic addition with numbers 1-10",
      "category": "math",
      "difficulty_level": "beginner",
      "xp_reward": 50,
      "estimated_duration": 15,
      "order_index": 1,
      "is_active": true,
      "content": {
        "instructions": "Add the numbers together...",
        "examples": ["1 + 1 = 2", "2 + 3 = 5"]
      }
    }
  ]
}
```

---

#### 2. Get Specific Lesson

**Endpoint:** `GET /api/lessons/<lesson_id>`

**Response (200 OK):**
```json
{
  "id": 1,
  "title": "Introduction to Addition",
  "description": "Learn basic addition with numbers 1-10",
  "category": "math",
  "difficulty_level": "beginner",
  "xp_reward": 50,
  "estimated_duration": 15,
  "order_index": 1,
  "is_active": true,
  "content": {
    "instructions": "Add the numbers together...",
    "examples": ["1 + 1 = 2", "2 + 3 = 5"],
    "quiz": [
      {
        "question": "What is 2 + 2?",
        "options": ["3", "4", "5", "6"],
        "correct_answer": 1
      }
    ]
  }
}
```

**Error Responses:**
```json
// 404 Not Found
{
  "error": "Lesson not found"
}
```

---

#### 3. Start a Lesson

**Endpoint:** `POST /api/lessons/<lesson_id>/start`

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**
```json
{
  "message": "Lesson started",
  "progress": {
    "id": 1,
    "user_id": 1,
    "lesson_id": 1,
    "status": "in_progress",
    "completion_percentage": 0,
    "attempts": 1,
    "started_at": "2024-01-15T10:30:00",
    "last_accessed": "2024-01-15T10:30:00"
  }
}
```

**Notes:**
- Creates a new progress record if none exists
- Updates `last_accessed` and increments `attempts` if progress exists
- Sets status to `in_progress`

---

#### 4. Complete a Lesson

**Endpoint:** `POST /api/lessons/<lesson_id>/complete`

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Request Body (Optional):**
```json
{
  "time_spent": 900
}
```

**Parameters:**
- `time_spent`: Time spent in seconds (0-86400, i.e., 24 hours max)

**Response (200 OK):**
```json
{
  "message": "Lesson completed",
  "progress": {
    "id": 1,
    "status": "completed",
    "completion_percentage": 100,
    "completed_at": "2024-01-15T11:00:00",
    "time_spent": 900
  },
  "xp_earned": 50,
  "total_xp": 200,
  "level": 3,
  "leveled_up": true,
  "new_level": 3
}
```

**Notes:**
- Awards XP defined by the lesson's `xp_reward`
- Updates user's total XP and level
- Increments `lessons_completed` counter
- `leveled_up` only appears when user levels up

**Error Responses:**
```json
// 400 Bad Request - Invalid time_spent
{
  "error": "Invalid time_spent. Must be between 0 and 86400 seconds (24 hours)"
}
```

---

### Gamification Endpoints

#### 1. Get User Achievements

**Endpoint:** `GET /api/gamification/achievements`

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**
```json
{
  "achievements": [
    {
      "id": 1,
      "achievement_type": "first_lesson",
      "title": "First Steps",
      "description": "Complete your first lesson",
      "badge_icon": "🎓",
      "xp_bonus": 10,
      "earned_at": "2024-01-15T10:30:00"
    },
    {
      "id": 2,
      "achievement_type": "streak_7",
      "title": "Week Warrior",
      "description": "Login for 7 consecutive days",
      "badge_icon": "🔥",
      "xp_bonus": 50,
      "earned_at": "2024-01-20T09:15:00"
    }
  ]
}
```

---

#### 2. Get Leaderboard

**Endpoint:** `GET /api/gamification/leaderboard`

**Query Parameters:**
- `period` (optional): "daily", "weekly", "monthly", or "all_time" (default: "all_time")
- `limit` (optional): Maximum entries to return (default: 10)

**Example Requests:**
```http
GET /api/gamification/leaderboard
GET /api/gamification/leaderboard?period=weekly
GET /api/gamification/leaderboard?period=monthly&limit=20
```

**Response (200 OK):**
```json
{
  "period": "weekly",
  "leaderboard": [
    {
      "rank": 1,
      "user_id": 5,
      "username": "topstudent",
      "score": 450,
      "level": 7,
      "avatar_url": null
    },
    {
      "rank": 2,
      "user_id": 3,
      "username": "learner123",
      "score": 380,
      "level": 6,
      "avatar_url": null
    }
  ]
}
```

---

#### 3. Get Login Streak

**Endpoint:** `GET /api/gamification/streak`

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**
```json
{
  "current_streak": 5,
  "longest_streak": 12,
  "last_login": "2024-01-15T10:30:00"
}
```

---

### ML Analytics Endpoints

**Note:** Most ML endpoints require `teacher` or `admin` role.

#### 1. Predict User Engagement

**Endpoint:** `GET /api/ml/engagement/predict/<user_id>`

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user_id": 1,
    "username": "student1",
    "engagement_level": "low",
    "confidence": 0.85,
    "risk_level": "high",
    "features": {
      "time_spent_today": 5,
      "avg_quiz_score": 45.2,
      "login_streak": 0,
      "lessons_completed_week": 1,
      "days_inactive": 3
    },
    "recommendations": [
      "Schedule one-on-one tutoring session",
      "Send motivational email",
      "Assign easier difficulty lessons",
      "Check for external issues affecting learning"
    ]
  }
}
```

**Engagement Levels:**
- `high`: Student is actively engaged
- `medium`: Moderate engagement, monitor closely
- `low`: At risk of disengagement, intervention needed

**Risk Levels:**
- `critical`: Immediate attention required
- `high`: Intervention recommended within 24-48 hours
- `moderate`: Monitor and encourage
- `low`: Student is doing well

---

#### 2. Predict All Users' Engagement

**Endpoint:** `GET /api/ml/engagement/predict-all`

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Required Role:** `teacher` or `admin`

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "user_id": 1,
      "username": "student1",
      "engagement_level": "high",
      "confidence": 0.92,
      "risk_level": "low"
    },
    {
      "user_id": 2,
      "username": "student2",
      "engagement_level": "low",
      "confidence": 0.87,
      "risk_level": "high"
    }
  ]
}
```

---

#### 3. Get At-Risk Students

**Endpoint:** `GET /api/ml/disengaged`

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Required Role:** `teacher` or `admin`

**Response (200 OK):**
```json
{
  "success": true,
  "total": 3,
  "students": [
    {
      "user_id": 2,
      "username": "student2",
      "email": "student2@example.com",
      "engagement_level": "low",
      "risk_level": "critical",
      "days_inactive": 7,
      "last_login": "2024-01-08T14:20:00"
    }
  ]
}
```

---

### Recommendation Endpoints

#### Get Personalized Recommendations

**Endpoint:** `GET /api/recommendations/personalized`

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `limit` (optional): Number of recommendations (default: 5)

**Response (200 OK):**
```json
{
  "recommendations": [
    {
      "lesson_id": 5,
      "title": "Subtraction Basics",
      "category": "math",
      "difficulty_level": "beginner",
      "xp_reward": 50,
      "similarity_score": 0.92,
      "reason": "Based on your progress in addition"
    },
    {
      "lesson_id": 8,
      "title": "Number Patterns",
      "category": "math",
      "difficulty_level": "intermediate",
      "xp_reward": 75,
      "similarity_score": 0.85,
      "reason": "Next step after mastering basics"
    }
  ]
}
```

---

### File Upload Endpoints

#### 1. Upload Profile Picture

**Endpoint:** `POST /api/uploads/profile-picture`

**Headers:**
```http
Authorization: Bearer <jwt-token>
Content-Type: multipart/form-data
```

**Request Body:**
```
FormData:
  file: [image file]
```

**Supported Formats:** PNG, JPG, JPEG, GIF

**Max Size:** 16MB

**Response (200 OK):**
```json
{
  "message": "Profile picture uploaded successfully",
  "file_path": "/uploads/profiles/abc123-def456.jpg"
}
```

**Notes:**
- Images are automatically resized to 400x400 pixels
- Old profile picture is deleted automatically
- Filename is UUID-based for security

---

#### 2. Delete Profile Picture

**Endpoint:** `DELETE /api/uploads/profile-picture`

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**
```json
{
  "message": "Profile picture deleted successfully"
}
```

---

#### 3. Upload Assignment

**Endpoint:** `POST /api/uploads/assignment`

**Headers:**
```http
Authorization: Bearer <jwt-token>
Content-Type: multipart/form-data
```

**Request Body:**
```
FormData:
  file: [document file]
  lesson_id: 1
```

**Supported Formats:** PDF, DOC, DOCX, PNG, JPG, JPEG

**Max Size:** 16MB

**Response (200 OK):**
```json
{
  "message": "Assignment uploaded successfully",
  "file_path": "/uploads/assignments/xyz789-abc123.pdf",
  "lesson_id": 1
}
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "error": "Error message describing what went wrong"
}
```

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input or missing parameters |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Insufficient permissions (role check failed) |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists (duplicate) |
| 500 | Server Error | Internal server error |

### Common Error Examples

#### Authentication Errors

```json
// Missing token
{
  "error": "Unauthorized - invalid or missing token"
}

// Invalid credentials
{
  "error": "Invalid credentials"
}

// Role permission denied
{
  "error": "Access denied. Admin or teacher role required"
}
```

#### Validation Errors

```json
// Missing required fields
{
  "error": "Missing required fields"
}

// Invalid data type
{
  "error": "Invalid time_spent. Must be between 0 and 86400 seconds (24 hours)"
}

// Invalid file type
{
  "error": "Invalid file extension. Allowed: png, jpg, jpeg, gif"
}
```

---

## Rate Limiting

**Current Status:** No rate limiting implemented in development.

**Production Recommendations:**
- Implement rate limiting with Flask-Limiter
- Suggested limits:
  - Authentication: 5 requests/minute
  - ML predictions: 30 requests/minute
  - File uploads: 10 requests/minute
  - General API: 60 requests/minute

---

## Code Examples

### JavaScript/React (with Axios)

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Login
async function login(username, password) {
  try {
    const response = await api.post('/api/auth/login', {
      username,
      password,
    });
    
    // Store token
    localStorage.setItem('token', response.data.access_token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    
    return response.data;
  } catch (error) {
    console.error('Login failed:', error.response?.data?.error);
    throw error;
  }
}

// Get lessons
async function getLessons(category = null, difficulty = null) {
  try {
    const params = {};
    if (category) params.category = category;
    if (difficulty) params.difficulty = difficulty;
    
    const response = await api.get('/api/lessons', { params });
    return response.data.lessons;
  } catch (error) {
    console.error('Failed to fetch lessons:', error);
    throw error;
  }
}

// Complete lesson
async function completeLesson(lessonId, timeSpent = 0) {
  try {
    const response = await api.post(`/api/lessons/${lessonId}/complete`, {
      time_spent: timeSpent,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to complete lesson:', error);
    throw error;
  }
}

// Upload profile picture
async function uploadProfilePicture(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/api/uploads/profile-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to upload profile picture:', error);
    throw error;
  }
}
```

### Python (with requests)

```python
import requests

API_BASE_URL = 'http://localhost:5000'

class SlowLearningAPI:
    def __init__(self):
        self.base_url = API_BASE_URL
        self.token = None
    
    def login(self, username, password):
        """Login and store JWT token"""
        response = requests.post(
            f'{self.base_url}/api/auth/login',
            json={'username': username, 'password': password}
        )
        
        if response.status_code == 200:
            data = response.json()
            self.token = data['access_token']
            return data['user']
        else:
            raise Exception(f"Login failed: {response.json()}")
    
    def get_headers(self):
        """Get headers with authentication"""
        return {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }
    
    def get_lessons(self, category=None, difficulty=None):
        """Get all lessons with optional filters"""
        params = {}
        if category:
            params['category'] = category
        if difficulty:
            params['difficulty'] = difficulty
        
        response = requests.get(
            f'{self.base_url}/api/lessons',
            headers=self.get_headers(),
            params=params
        )
        
        return response.json()['lessons']
    
    def complete_lesson(self, lesson_id, time_spent=0):
        """Complete a lesson"""
        response = requests.post(
            f'{self.base_url}/api/lessons/{lesson_id}/complete',
            headers=self.get_headers(),
            json={'time_spent': time_spent}
        )
        
        return response.json()
    
    def predict_engagement(self, user_id):
        """Predict user engagement (teacher/admin only)"""
        response = requests.get(
            f'{self.base_url}/api/ml/engagement/predict/{user_id}',
            headers=self.get_headers()
        )
        
        return response.json()

# Usage example
api = SlowLearningAPI()

# Login
user = api.login('teacher1', 'password123')
print(f"Logged in as: {user['username']}")

# Get math lessons
lessons = api.get_lessons(category='math')
print(f"Found {len(lessons)} math lessons")

# Predict student engagement
prediction = api.predict_engagement(user_id=5)
print(f"Engagement level: {prediction['data']['engagement_level']}")
```

### cURL Examples

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"student1","password":"password123"}'

# Get lessons (authenticated)
curl -X GET http://localhost:5000/api/lessons \
  -H "Authorization: Bearer <your-jwt-token>"

# Complete lesson
curl -X POST http://localhost:5000/api/lessons/1/complete \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"time_spent":900}'

# Get leaderboard
curl -X GET "http://localhost:5000/api/gamification/leaderboard?period=weekly&limit=10"

# Upload profile picture
curl -X POST http://localhost:5000/api/uploads/profile-picture \
  -H "Authorization: Bearer <your-jwt-token>" \
  -F "file=@/path/to/image.jpg"
```

---

## Best Practices

### 1. Token Management

- Store JWT tokens securely (localStorage or httpOnly cookies)
- Implement token refresh before expiration (2 hours)
- Clear tokens on logout
- Handle 401 responses by redirecting to login

### 2. Error Handling

```javascript
try {
  const response = await api.get('/api/lessons');
  return response.data;
} catch (error) {
  if (error.response) {
    // Server responded with error status
    console.error('Error:', error.response.data.error);
    console.error('Status:', error.response.status);
  } else if (error.request) {
    // Request made but no response
    console.error('Network error - no response from server');
  } else {
    // Other errors
    console.error('Error:', error.message);
  }
  throw error;
}
```

### 3. Loading States

Always implement loading states for asynchronous API calls:

```javascript
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

async function fetchLessons() {
  setLoading(true);
  setError(null);
  try {
    const lessons = await api.get('/api/lessons');
    return lessons;
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
}
```

### 4. File Upload Validation

```javascript
function validateFile(file) {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
  const maxSize = 16 * 1024 * 1024; // 16MB
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only PNG, JPG, JPEG, GIF allowed.');
  }
  
  if (file.size > maxSize) {
    throw new Error('File too large. Maximum size is 16MB.');
  }
}
```

---

## Support

- **Swagger UI:** http://localhost:5000/api/docs
- **GitHub Issues:** https://github.com/yourusername/slow-learning/issues
- **Email:** support@yourapp.com

---

<p align="center">
  <i>Last Updated: January 2024 | API Version: 1.0</i>
</p>
