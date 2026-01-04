# Frontend - React Application

## Overview
React-based single-page application with React Router, React Query, and responsive design.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create a `.env` file in the frontend directory:
```
REACT_APP_API_URL=http://localhost:5000/api
```

### 3. Run Development Server
```bash
npm start
```

Application will open at `http://localhost:3000`

## Available Scripts

- `npm start` - Run development server
- `npm build` - Create production build
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

## Project Structure

```
src/
├── components/
│   ├── common/           # Reusable UI components
│   ├── gamification/     # XP, badges, streaks
│   ├── lessons/          # Lesson-related components
│   └── analytics/        # Charts and stats
├── pages/                # Page components
├── services/             # API integration
├── contexts/             # React Context providers
├── utils/                # Helper functions
└── styles/               # CSS files
```

## Key Features

### Authentication
- JWT-based auth with AuthContext
- Protected routes with PrivateRoute component
- Automatic token management

### State Management
- React Query for server state
- Context API for global state
- Local state with useState/useReducer

### Routing
```
/login              - Login page
/register           - Registration page
/dashboard          - Main dashboard
/lessons            - Lesson browser
/lessons/:id        - Lesson detail
/achievements       - User achievements
/leaderboard        - Rankings
/profile            - User profile
```

## Components

### Common
- `Layout` - Main app layout with sidebar
- `PrivateRoute` - Protected route wrapper

### Gamification
- `XPProgressBar` - XP and level display
- `StreakIndicator` - Daily streak tracker
- `AchievementBadge` - Achievement display
- `LeaderboardTable` - Rankings table

## API Integration

All API calls are centralized in `services/index.js`:
- `authService` - Authentication
- `lessonService` - Lesson management
- `gamificationService` - Gamification features
- `analyticsService` - Analytics data
- `recommendationService` - ML recommendations

## Styling

CSS files in `src/styles/`:
- `index.css` - Global styles
- `App.css` - Component styles

## Building for Production

```bash
npm run build
```

Optimized build will be in `build/` directory.

## Deployment

### Netlify
```bash
npm run build
netlify deploy --prod --dir=build
```

### Vercel
```bash
npm run build
vercel --prod
```

## Environment Variables

- `REACT_APP_API_URL` - Backend API URL

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
