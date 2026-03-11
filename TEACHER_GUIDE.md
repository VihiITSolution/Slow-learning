# Teacher Guide - LearnQuest Platform 👨‍🏫

Welcome to the LearnQuest Teacher Portal! This guide will help you effectively conduct assessments, monitor student progress, and leverage ML-powered analytics to enhance your teaching.

## Table of Contents
1. [Getting Started](#getting-started)
2. [Teacher Dashboard](#teacher-dashboard)
3. [Conducting Assessments](#conducting-assessments)
4. [Student Selection](#student-selection)
5. [Viewing Student Progress](#viewing-student-progress)
6. [Analytics and Reports](#analytics-and-reports)
7. [ML-Powered Engagement Predictions](#ml-powered-engagement-predictions)
8. [Managing Lessons](#managing-lessons)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Creating Your Teacher Account

1. **Registration:**
   - Visit `/register`
   - Fill in your details
   - **Important:** Select role: **Teacher** (not Student)
   - Complete registration

2. **Account Verification:**
   - Teacher accounts may require admin approval
   - Contact admin if access is delayed
   - You'll receive confirmation email when approved

3. **First Login:**
   - Navigate to `/login`
   - Use your credentials
   - You'll be redirected to Teacher Dashboard at `/teacher/dashboard`

### Teacher Account Features

Teacher accounts have access to:
- ✅ Teacher Dashboard (analytics overview)
- ✅ Student selection and assessment tools
- ✅ ML-powered engagement predictions
- ✅ Detailed progress reports
- ✅ All student views (for content preview)
- ❌ Limited lesson management (request admin for full control)

---

## Teacher Dashboard

### Accessing Dashboard

Navigate to `/teacher/dashboard` to see your overview:

### Dashboard Components

1. **Student Overview Card** 📊
   - Total students in your classes
   - Active students (logged in within 7 days)
   - Average class performance
   - Quick link to student list

2. **Recent Activity Feed** 📋
   - Latest student lesson completions
   - Recent achievement unlocks
   - Streak milestones
   - Real-time updates

3. **Performance Metrics** 📈
   - Average XP per student
   - Lesson completion rates
   - Average time per lesson
   - Engagement trends

4. **At-Risk Students Alert** ⚠️
   - Students with low engagement predictions
   - Broken streaks
   - No recent activity
   - Recommendations for intervention

5. **Quick Actions**
   - Start new assessment
   - View all students
   - Access analytics
   - Export reports

---

## Conducting Assessments

### What is the Learning Assessment Tool?

The assessment tool allows you to:
- Evaluate individual student engagement
- Get ML-powered predictions
- Identify students needing support
- Track learning patterns

### Starting an Assessment

1. **Navigate to Assessment Tool:**
   - Click "Start Assessment" on dashboard
   - Or visit `/student-selection`

2. **Select a Student:**
   - View list of all students
   - Search by username or filter
   - Click student card to select

3. **Assessment Page:**
   - Automatically redirects to `/learning-assessment/:studentId`
   - Displays comprehensive student data

### Assessment Components

#### 1. Student Profile Section
- Name and email
- Current level and total XP
- Profile picture
- Member since date
- Current streak information

#### 2. Learning Statistics
- **Lessons Completed:** Total count
- **Quizzes Taken:** Number of assessments
- **Average Score:** Percentage across quizzes
- **Total Study Time:** Cumulative minutes
- **Last Active:** Most recent login

#### 3. Engagement Prediction (ML-Powered)
- **Engagement Score:** 0-100%
  - 🟢 High (70-100%): Student is highly engaged
  - 🟡 Medium (40-69%): Moderate engagement, monitor
  - 🔴 Low (0-39%): At-risk, intervention needed

- **Factors Influencing Score:**
  - Current streak length
  - Lessons completed
  - Time spent learning
  - Quiz performance
  - Recent activity patterns

- **Confidence Level:**
  - Shows ML model's certainty
  - Higher confidence = more reliable prediction

#### 4. Detailed Progress Breakdown
- Lessons by status (completed, in-progress, not started)
- Category-wise completion rates
- Difficulty level distribution
- Time investment per category

#### 5. Achievement Tracking
- Achievements unlocked
- Achievements in progress
- Achievement completion percentage

#### 6. Recommendations for Teacher
Based on ML analysis:
- Suggested intervention strategies
- Recommended lesson assignments
- Personalized learning path suggestions
- Engagement improvement tactics

---

## Student Selection

### Accessing Student List

Navigate to `/student-selection` to view all students:

### Student Cards Display

Each student card shows:
- Profile picture
- Username
- Current level
- Total XP
- Current streak
- "Assess Student" button

### Filtering and Searching

1. **Search Bar:**
   - Type username to filter
   - Real-time search results
   - Case-insensitive

2. **Sorting Options:**
   - By XP (highest first)
   - By level (highest first)
   - By streak (longest first)
   - By name (alphabetical)

3. **Quick Filters:**
   - Show only at-risk students
   - Filter by level range
   - Filter by activity (active/inactive)

### Bulk Actions

- Export student list to CSV
- View class-wide statistics
- Compare student performance

---

## Viewing Student Progress

### Individual Student View

After selecting a student on assessment page:

#### Progress Metrics
1. **Completion Rate:**
   - Percentage of available lessons completed
   - Visual progress bar
   - Comparison to class average

2. **Learning Velocity:**
   - Average lessons per week
   - Trend over time (increasing/decreasing)
   - Optimal pace recommendations

3. **Time Investment:**
   - Total hours spent learning
   - Average time per lesson
   - Study session patterns

4. **Category Breakdown:**
   - Performance by subject area
   - Identify strengths and weaknesses
   - Suggest focus areas

#### Recent Activity Timeline
- Chronological view of student actions
- Lesson completions with timestamps
- Achievement unlocks
- Streak milestones
- Login history

---

## Analytics and Reports

### Accessing Analytics

Navigate to `/teacher/dashboard` or `/analytics`:

### Available Reports

#### 1. Class Overview Report
- Total students
- Average XP per student
- Class completion rate
- Engagement distribution (high/medium/low)
- Top performers
- Students needing attention

#### 2. Engagement Report
- ML engagement predictions for all students
- Risk levels color-coded
- Intervention priorities
- Trend analysis (improving/declining)

#### 3. Lesson Performance Report
- Most completed lessons
- Highest-rated lessons (by completion time)
- Lessons with high dropout rates
- Category popularity

#### 4. Achievement Report
- Most unlocked achievements
- Achievement unlock rates
- Students close to achievements
- Achievement-based XP distribution

#### 5. Time Analysis Report
- Peak learning hours for class
- Average session duration
- Total class study time
- Time investment trends

### Exporting Reports

1. Click "Export" button on any report
2. Choose format: CSV, PDF, or Excel
3. Select date range
4. Download file for offline analysis

### Scheduling Reports

- Set up daily/weekly email reports
- Subscribe to specific metrics
- Custom report builder for admins

---

## ML-Powered Engagement Predictions

### Understanding the ML Model

Our engagement prediction model:
- **Type:** Logistic Regression (97% accuracy)
- **Training Data:** Historical student behavior
- **Update Frequency:** Real-time predictions
- **Features Used:**
  - Current streak
  - Lessons completed
  - Quizzes taken
  - Time spent learning
  - Recent activity patterns
  - Achievement unlocks

### How to Use Predictions

#### For Individual Students

1. **High Engagement (70-100%):**
   - ✅ Student is on track
   - ✅ Consider advanced challenges
   - ✅ Recommend as peer mentor
   - ✅ Encourage continued progress

2. **Medium Engagement (40-69%):**
   - ⚠️ Monitor closely
   - ⚠️ Provide encouragement
   - ⚠️ Offer additional support
   - ⚠️ Check for obstacles

3. **Low Engagement (0-39%):**
   - 🚨 Immediate intervention needed
   - 🚨 Schedule one-on-one meeting
   - 🚨 Identify blockers
   - 🚨 Create recovery plan

#### Class-Wide Patterns

- Identify common engagement dips
- Adjust teaching strategies
- Modify lesson difficulty
- Improve content based on feedback

### Intervention Strategies

#### For Low-Engagement Students

1. **Personal Outreach:**
   - Send encouraging message
   - Schedule video call
   - Offer flexible deadlines

2. **Content Adjustment:**
   - Assign easier lessons first
   - Break lessons into smaller chunks
   - Provide alternative formats

3. **Motivation Boosters:**
   - Highlight progress made
   - Set achievable short-term goals
   - Connect to student interests

4. **Technical Support:**
   - Check for technical issues
   - Verify account access
   - Ensure platform understanding

#### For Medium-Engagement Students

1. **Regular Check-ins:**
   - Weekly progress reviews
   - Celebrate small wins
   - Address concerns proactively

2. **Challenge Appropriately:**
   - Avoid too-easy or too-hard lessons
   - Mix difficulty levels
   - Ensure variety

3. **Peer Support:**
   - Pair with high-engagement student
   - Study group recommendations
   - Collaborative activities

---

## Managing Lessons

### Lesson Creation (Admin Required)

Teachers can request new lessons:
1. Submit lesson proposal to admin
2. Include: title, category, difficulty, content
3. Admin reviews and creates lesson

### Lesson Recommendations

As a teacher, you can:
- Assign specific lessons to students
- Create custom learning paths
- Set completion deadlines
- Track assignment progress

### Assigning Lessons

1. Navigate to student profile
2. Click "Assign Lesson"
3. Select lesson(s) from catalog
4. Set due date (optional)
5. Add notes or instructions
6. Send notification to student

### Monitoring Assignments

- View assignment status (pending, in-progress, completed)
- Track completion rates
- Send reminder notifications
- Extend deadlines if needed

---

## Best Practices

### 🎯 Effective Teaching Strategies

1. **Regular Monitoring:**
   - Check dashboard daily
   - Review ML predictions weekly
   - Identify trends early

2. **Proactive Intervention:**
   - Act on low engagement predictions
   - Don't wait for students to fail
   - Reach out before problems escalate

3. **Personalized Support:**
   - Tailor advice to individual needs
   - Reference specific student data
   - Acknowledge unique challenges

4. **Data-Driven Decisions:**
   - Use analytics to guide teaching
   - Trust ML predictions
   - Adjust strategies based on outcomes

5. **Encourage Consistency:**
   - Emphasize daily streaks
   - Celebrate consistency wins
   - Make learning habitual

### 📊 Using Analytics Effectively

1. **Weekly Review Routine:**
   - Monday: Check weekend activity
   - Wednesday: Mid-week engagement check
   - Friday: Review week's progress

2. **Focus Areas:**
   - Students with broken streaks
   - Declining engagement trends
   - Lessons with low completion
   - Achievement near-misses

3. **Action Items:**
   - Create list of students to contact
   - Plan intervention strategies
   - Document what works
   - Share insights with admin

### 💡 Engagement Tips

1. **Motivation Techniques:**
   - Public recognition for achievements
   - Personal messages of encouragement
   - Share success stories
   - Connect lessons to real-world applications

2. **Content Optimization:**
   - Vary lesson difficulties
   - Mix categories to maintain interest
   - Use interactive games
   - Incorporate multimedia

3. **Community Building:**
   - Foster friendly competition (leaderboard)
   - Encourage peer learning
   - Create collaborative challenges
   - Recognize top performers

### ⚠️ Red Flags to Watch For

1. **Student Disengagement:**
   - Sudden drop in activity
   - Multiple incomplete lessons
   - Broken streak > 3 days
   - No quiz attempts
   - Login without lesson completion

2. **Technical Issues:**
   - Student reports errors
   - XP not updating
   - Lessons not loading
   - Profile issues

3. **Content Problems:**
   - Specific lessons with high dropout
   - Consistently low quiz scores
   - Excessive time on lessons
   - Frequent "too hard" feedback

---

## Troubleshooting

### Cannot Access Student Data

**Possible Causes:**
- Not logged in as teacher
- Student account privacy settings
- Database connection issue

**Solutions:**
- Verify teacher role in profile
- Contact admin to check permissions
- Refresh page and retry

### ML Predictions Seem Incorrect

**Possible Causes:**
- Insufficient student data (< 5 lessons)
- Recent behavior change
- Model needs retraining

**Solutions:**
- Wait for more student activity
- Use predictions as guidance, not absolute
- Report persistent issues to admin

### Analytics Not Loading

**Possible Causes:**
- Slow network connection
- Large dataset processing
- Server issues

**Solutions:**
- Wait 10-15 seconds for load
- Refresh browser
- Try during off-peak hours
- Contact admin if persistent

### Student Reports XP Not Updating

**Troubleshooting Steps:**
1. Ask student to refresh page
2. Check lesson completion status (must be green)
3. Verify time spent is valid (1-1440 minutes)
4. Review backend logs (admin access)
5. Manual XP adjustment if needed (admin)

---

## Communication Guidelines

### Contacting Students

**Best Practices:**
- Use platform messaging (if available)
- Professional but encouraging tone
- Reference specific data/achievements
- Offer concrete next steps

**Message Templates:**

**For Low Engagement:**
```
Hi [Student Name],

I noticed you haven't been active on LearnQuest in a few days. 
Is everything okay? I'm here to help if you're facing any 
challenges with the platform or the lessons.

Your progress so far has been great - you've completed [X] lessons 
and earned [Y] XP! Let's keep that momentum going.

What can I do to support your learning?

Best,
[Your Name]
```

**For Achievement Near-Miss:**
```
Hi [Student Name],

Great work on your learning journey! I noticed you're very close 
to unlocking the "[Achievement Name]" achievement. You only need 
[X more actions] to earn it!

Keep up the excellent work!

[Your Name]
```

**For Strong Performance:**
```
Hi [Student Name],

I wanted to take a moment to recognize your outstanding effort 
on LearnQuest. Your [X]-day streak and [Y] level are impressive!

You're setting a great example for other students. Keep it up!

[Your Name]
```

---

## Keyboard Shortcuts (Teacher Portal)

| Shortcut | Action |
|----------|--------|
| `D` | Go to Dashboard |
| `S` | View Student List |
| `A` | View Analytics |
| `N` | Next Student (in assessment) |
| `P` | Previous Student (in assessment) |
| `E` | Export Current Report |
| `?` | Show Help Menu |

---

## Glossary

- **Engagement Score:** ML prediction of student's continued participation
- **At-Risk Student:** Student with low engagement score requiring intervention
- **Learning Velocity:** Rate of lesson completion over time
- **Completion Rate:** Percentage of available lessons completed
- **Streak:** Consecutive days of platform activity
- **Assessment:** Teacher review of individual student progress

---

## Getting Support

### For Technical Issues
- Contact platform admin
- Email: admin@learnquest.example.com
- Check status page for known issues

### For Pedagogical Guidance
- Refer to teaching resources
- Consult with fellow teachers
- Request admin training session

### For Feature Requests
- Submit via feedback form
- Describe use case clearly
- Include examples if applicable

---

## Appendix: ML Model Details

### Engagement Prediction Model

**Model Type:** Logistic Regression  
**Accuracy:** 97% on test data  
**Features Used:**
1. current_streak (days)
2. lessons_completed (count)
3. quizzes_taken (count)
4. total_time_spent (minutes)
5. days_since_last_activity (days)

**Prediction Interpretation:**
- Probability > 0.7: High engagement
- Probability 0.4-0.7: Medium engagement
- Probability < 0.4: Low engagement

**Model Limitations:**
- Requires minimum 3 lessons for reliable prediction
- May not capture external factors (exams, holidays)
- Should be combined with teacher judgment

---

**Effective Teaching! 👨‍🏫✨**

Remember: Technology enhances teaching but doesn't replace the human connection. Use these tools to identify opportunities for personal interaction and support.

---

*Last Updated: March 10, 2026*  
*Version: 1.0*  
*For platform administration, refer to: ADMIN_GUIDE.md*
