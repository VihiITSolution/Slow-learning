# Student Guide - LearnQuest Platform 🎓

Welcome to LearnQuest! This guide will help you make the most of your learning journey on our gamified learning platform.

## Table of Contents
1. [Getting Started](#getting-started)
2. [Your Dashboard](#your-dashboard)
3. [Learning Lessons](#learning-lessons)
4. [Earning XP and Leveling Up](#earning-xp-and-leveling-up)
5. [Achievements](#achievements)
6. [Leaderboard](#leaderboard)
7. [Daily Streaks](#daily-streaks)
8. [Profile Management](#profile-management)
9. [Interactive Games](#interactive-games)
10. [ML-Powered Insights](#ml-powered-insights)
11. [Tips for Success](#tips-for-success)

---

## Getting Started

### Creating Your Account

1. **Visit the registration page** at `/register`
2. **Fill in your details:**
   - Username (3-20 characters, alphanumeric and underscores only)
   - Email address (valid email format required)
   - Password (minimum 6 characters)
   - Confirm password
   - Select role: **Student** (default)
3. **Click "Sign Up"** to create your account
4. You'll be automatically logged in and redirected to your dashboard

### Logging In

1. Visit the login page at `/login`
2. Enter your username and password
3. Click "Login" to access your dashboard
4. 💡 **Tip:** Click the eye icon to toggle password visibility

### First Time Setup

After creating your account, you should:
- ✅ Upload a profile picture (optional but recommended)
- ✅ Complete your first lesson to earn your initial XP
- ✅ Explore the dashboard to familiarize yourself with features

---

## Your Dashboard

Your dashboard is your home base on LearnQuest. Here's what you'll see:

### Stats Overview (4 Cards)

1. **Your XP** ⭐
   - Shows your total experience points
   - Displays XP earned today
   - Updates in real-time as you complete activities

2. **Current Level** 🏆
   - Your current level (calculated from total XP)
   - Level formula: `Level = floor(sqrt(total_xp / 100))`
   - Motivation message based on progress

3. **Daily Streak** 🔥
   - Number of consecutive days you've been active
   - Streaks reset if you miss a day
   - Keep your streak alive by logging in daily!

4. **Progress** 📚
   - Overall completion percentage
   - Based on lessons completed vs. available lessons

### Quick Actions

From your dashboard, you can quickly:
- View all available lessons
- Check your achievements
- Access ML-powered insights
- See the top 5 leaderboard players

### Personalized Recommendations

The dashboard displays lesson recommendations tailored to:
- Your learning history
- Your current skill level
- Popular lessons among similar learners
- Your engagement patterns (ML-powered)

---

## Learning Lessons

### Browsing Lessons

1. **Navigate to Lessons** page at `/app/lessons`
2. **Browse available lessons:**
   - Programming (Python, JavaScript, HTML/CSS, etc.)
   - Mathematics (Algebra, Geometry, Calculus)
   - Science (Physics, Chemistry, Biology)
   - Languages (English, Spanish, French)
   - And more!

### Filtering Lessons

Use filters to find the right lessons:
- **By Category:** Select from dropdown (Programming, Math, Science, etc.)
- **By Difficulty:** Choose Easy, Medium, or Hard
- **Combined Filters:** Use both category and difficulty together

### Starting a Lesson

1. Click on a lesson card to view details
2. Read the lesson description and prerequisites
3. Click **"Start Lesson"** button
4. Study the lesson content carefully
5. Take notes if needed (external notepad recommended)

### Completing a Lesson

1. After studying the lesson, click **"Mark as Complete"**
2. Enter the time you spent (in minutes)
   - Be honest! This helps the ML model understand your learning patterns
   - Valid range: 1-1440 minutes (24 hours)
3. **Rewards for completion:**
   - ✨ **50 XP** for completing a lesson
   - 📈 Progress tracking updated
   - 🎯 Potential level up!
   - 🏆 Possible achievement unlocks

### Lesson Status Indicators

- **Not Started:** Gray - You haven't begun this lesson yet
- **In Progress:** Yellow - You've started but not completed
- **Completed:** Green - You've finished this lesson

---

## Earning XP and Leveling Up

### How to Earn XP

| Activity | XP Reward |
|----------|-----------|
| Complete a lesson | 50 XP |
| Unlock an achievement | 10-100 XP (varies) |
| Daily login streak | Bonus multiplier |
| Complete interactive games | 20-50 XP |

### Level System

- **Starting Level:** 1 (0 XP)
- **Level Calculation:** `Level = floor(sqrt(total_xp / 100))`
- **Example Progression:**
  - Level 1: 0-99 XP
  - Level 2: 100-399 XP
  - Level 3: 400-899 XP
  - Level 4: 900-1599 XP
  - Level 5: 1600-2499 XP
  - Level 10: 10,000 XP

### Level Benefits

Higher levels show:
- 🌟 Your commitment to learning
- 📊 Your position on the leaderboard
- 🎖️ Unlock special achievement tiers
- 💪 Demonstrate expertise to peers

---

## Achievements

### Types of Achievements

Access achievements at `/app/achievements`:

1. **First Steps** 🎯
   - Complete your first lesson
   - Reward: 10 XP

2. **Lesson Streak** 🔥
   - Complete 5 lessons in a row
   - Reward: 25 XP

3. **Rising Star** ⭐
   - Reach Level 5
   - Reward: 50 XP

4. **Quiz Master** 🧠
   - Score 90%+ on 5 quizzes
   - Reward: 75 XP

5. **Dedicated Learner** 💪
   - Maintain a 7-day streak
   - Reward: 100 XP

6. **Category Expert** 🏆
   - Complete all lessons in one category
   - Reward: 100 XP

### Unlocking Achievements

- Achievements unlock automatically when you meet criteria
- You'll receive a notification when you earn an achievement
- XP is automatically added to your total
- Track locked achievements to see what you can earn next

### Viewing Your Achievements

- **Unlocked:** Green checkmark, shows unlock date
- **Locked:** Gray, shows requirements to unlock
- **Progress Indicators:** Some show percentage complete

---

## Leaderboard

### Accessing the Leaderboard

Visit `/app/leaderboard` to see how you rank:

### Leaderboard Features

1. **Rankings:**
   - See your position among all students
   - View top performers' usernames and XP
   - 🥇 Gold, 🥈 Silver, 🥉 Bronze medals for top 3

2. **Filtering Options:**
   - **All Time:** Total XP since account creation
   - **This Month:** XP earned in current month
   - **This Week:** XP earned in current week

3. **Your Position:**
   - Your rank is highlighted in color
   - Shows your username, level, and total XP
   - Updates in real-time

### Climbing the Leaderboard

To improve your ranking:
- ✅ Complete more lessons
- ✅ Maintain your daily streak
- ✅ Unlock achievements
- ✅ Participate in interactive games
- ✅ Be consistent with learning

---

## Daily Streaks

### What are Streaks?

A streak is the number of consecutive days you've been active on the platform.

### How Streaks Work

- **Maintaining:** Log in and complete at least one activity daily
- **Breaking:** Miss a day = streak resets to 0
- **Tracking:** View current and longest streak on dashboard

### Streak Benefits

- 🔥 **Motivation:** Visual reminder of consistency
- 🎯 **Achievements:** Unlock streak-based achievements
- 📈 **ML Insights:** Better engagement predictions
- 🏆 **Leaderboard Boost:** Consistent learners rank higher

### Tips for Maintaining Streaks

1. Set a daily reminder to log in
2. Complete at least one quick lesson daily
3. Use mobile access if traveling
4. Check progress before day ends
5. Make learning a daily habit

---

## Profile Management

### Accessing Your Profile

Click on your username or visit `/app/profile`

### Profile Features

1. **Profile Picture** 📷
   - Click "Upload Photo" to add/change picture
   - Supported formats: PNG, JPEG, JPG, GIF
   - Maximum size: 5MB
   - Click "Delete" to remove current picture

2. **Profile Information**
   - Username (display only)
   - Email address
   - Role (Student)
   - Member since date

3. **Statistics Display**
   - Total XP earned
   - Current level
   - Lessons completed
   - Achievements unlocked
   - Current streak

### Updating Your Profile

1. Navigate to profile page
2. Upload new profile picture if desired
3. Contact admin for email/username changes

---

## Interactive Games

### Accessing Games

Visit `/app/interactive-games` for learning through gamification:

### Available Game Types

1. **Quiz Challenges** 🧠
   - Multiple-choice questions
   - Timed challenges
   - Score-based XP rewards

2. **Coding Challenges** 💻
   - Write code to solve problems
   - Test your programming skills
   - Earn bonus XP for efficiency

3. **Puzzle Games** 🧩
   - Logic and problem-solving
   - Pattern recognition
   - Critical thinking exercises

### Game Features

- **XP Rewards:** Earn 20-50 XP per game
- **Leaderboards:** Daily/weekly game rankings
- **Difficulty Levels:** Easy, Medium, Hard
- **Categories:** Match to lesson categories

---

## ML-Powered Insights

### What are ML Insights?

Our Machine Learning model analyzes your learning patterns to provide personalized recommendations.

### Accessing ML Insights

Visit `/app/ml-insights` to see:

1. **Engagement Prediction** 📊
   - Likelihood you'll stay engaged with current lessons
   - Factors affecting your engagement
   - Suggestions to improve

2. **Personalized Recommendations** 🎯
   - Lessons matched to your learning style
   - Topics you're likely to enjoy
   - Optimal difficulty level for you

3. **Learning Pattern Analysis** 📈
   - Best times of day for your learning
   - Average lesson completion time
   - Subject preferences

4. **Performance Insights** 💪
   - Strengths and improvement areas
   - Comparison to similar learners
   - Progress trajectory

### How ML Helps You

- **Smarter Study Plans:** Focus on high-impact lessons
- **Better Time Management:** Learn when you're most effective
- **Reduced Frustration:** Get appropriately challenging content
- **Faster Progress:** Optimized learning path

---

## Tips for Success

### 🎯 Learning Best Practices

1. **Set Daily Goals**
   - Aim for at least 1-2 lessons per day
   - Consistency beats intensity

2. **Use Active Learning**
   - Take notes while studying
   - Practice concepts immediately
   - Explain topics to others

3. **Track Your Progress**
   - Review dashboard regularly
   - Celebrate small wins
   - Adjust strategies based on ML insights

4. **Engage with Content**
   - Complete all lesson sections
   - Try interactive games
   - Challenge yourself with harder difficulties

5. **Maintain Balance**
   - Don't burn out - take breaks
   - Mix easy and hard lessons
   - Explore diverse categories

### 🚀 XP Maximization Strategies

1. **Daily Routine:**
   - Log in daily (maintain streak)
   - Complete 2-3 lessons minimum
   - Play 1-2 interactive games

2. **Achievement Hunting:**
   - Check locked achievements
   - Work toward achievement criteria
   - Focus on high-XP achievements

3. **Efficient Learning:**
   - Start with recommended lessons
   - Complete lessons you've started
   - Use filters to find appropriate difficulty

4. **Streak Power:**
   - Never miss a day
   - Streaks multiply effectiveness
   - Set reminders if needed

### 🏆 Leaderboard Competition

1. **Consistent Activity:**
   - Daily participation > sporadic bursts
   - Quality AND quantity matter

2. **Complete Everything:**
   - Don't leave lessons in progress
   - Finish achievement chains
   - Maximize XP opportunities

3. **Time Management:**
   - Use ML insights for optimal study times
   - Focus during peak learning hours
   - Complete multiple lessons in sessions

### ⚠️ Common Mistakes to Avoid

1. ❌ Rushing through lessons without understanding
2. ❌ Breaking your daily streak
3. ❌ Ignoring ML recommendations
4. ❌ Only doing easy lessons (challenge yourself!)
5. ❌ Not tracking your progress
6. ❌ Skipping interactive games
7. ❌ Giving up after setbacks

---

## Troubleshooting

### Can't Log In?

- Check username/password spelling
- Use "Forgot Password" link if needed
- Clear browser cache and cookies
- Contact admin if issues persist

### XP Not Updating?

- Refresh the page
- Check if lesson is marked "Completed" (green)
- Verify time spent is within valid range (1-1440 minutes)
- Log out and log back in

### Streak Reset Unexpectedly?

- Streaks require activity within 24 hours
- Check timezone on your device
- Activity must include lesson completion or game play
- Contact support if error occurred

### Lessons Not Loading?

- Check internet connection
- Refresh the browser
- Clear cache
- Try different browser
- Report to admin if persistent

---

## Getting Help

### Support Channels

1. **Contact Administrator:**
   - Use contact form on platform
   - Email: support@learnquest.example.com

2. **Teacher Support:**
   - Ask your assigned teacher
   - Request assessment help

3. **Peer Learning:**
   - Check leaderboard for top performers
   - Study groups (external)

### Feedback

We welcome your feedback!
- Suggest new features
- Report bugs
- Request new lesson categories
- Share success stories

---

## Glossary

- **XP (Experience Points):** Points earned for completing activities
- **Level:** Your overall progress rank (calculated from XP)
- **Streak:** Consecutive days of platform activity
- **Achievement:** Special rewards for reaching milestones
- **Leaderboard:** Rankings of all students by XP
- **ML (Machine Learning):** AI that personalizes your experience
- **Engagement:** Your likelihood to continue learning

---

**Happy Learning! 🎓✨**

Remember: Learning is a journey, not a race. Focus on understanding, stay consistent, and celebrate your progress every day!

---

*Last Updated: March 10, 2026*  
*Version: 1.0*  
*For technical issues, refer to: README.md*
