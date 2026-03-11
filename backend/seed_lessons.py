"""
Seed database with sample lessons
"""
from app import create_app, db
from app.models.lesson import Lesson

app = create_app()

sample_lessons = [
    {
        'title': 'Introduction to Numbers',
        'description': 'Learn about different types of numbers and basic counting',
        'content': '<h2>Welcome to Numbers!</h2><p>In this lesson, you will learn about natural numbers, integers, and how to count.</p>',
        'category': 'Mathematics',
        'difficulty_level': 'easy',
        'order_index': 1,
        'is_active': True
    },
    {
        'title': 'Basic Addition',
        'description': 'Master the art of adding numbers together',
        'content': '<h2>Addition Basics</h2><p>Addition is combining two or more numbers to get a sum.</p>',
        'category': 'Mathematics',
        'difficulty_level': 'easy',
        'order_index': 2,
        'is_active': True
    },
    {
        'title': 'Introduction to Subtraction',
        'description': 'Learn how to subtract and find differences between numbers',
        'content': '<h2>Subtraction Made Easy</h2><p>Subtraction is finding the difference between numbers.</p>',
        'category': 'Mathematics',
        'difficulty_level': 'easy',
        'order_index': 3,
        'is_active': True
    },
    {
        'title': 'Multiplication Basics',
        'description': 'Understand multiplication as repeated addition',
        'content': '<h2>Multiply Your Knowledge</h2><p>Multiplication is adding a number to itself multiple times.</p>',
        'category': 'Mathematics',
        'difficulty_level': 'medium',
        'order_index': 4,
        'is_active': True
    },
    {
        'title': 'Division Fundamentals',
        'description': 'Learn how to divide numbers and share equally',
        'content': '<h2>Division Basics</h2><p>Division is splitting a number into equal parts.</p>',
        'category': 'Mathematics',
        'difficulty_level': 'medium',
        'order_index': 5,
        'is_active': True
    },
    {
        'title': 'Introduction to Fractions',
        'description': 'Understand parts of a whole with fractions',
        'content': '<h2>Fractions Explained</h2><p>Fractions represent parts of a whole number.</p>',
        'category': 'Mathematics',
        'difficulty_level': 'medium',
        'order_index': 6,
        'is_active': True
    },
    {
        'title': 'Decimal Numbers',
        'description': 'Learn about decimal points and decimal arithmetic',
        'content': '<h2>Decimals</h2><p>Decimals are another way to represent fractions.</p>',
        'category': 'Mathematics',
        'difficulty_level': 'medium',
        'order_index': 7,
        'is_active': True
    },
    {
        'title': 'Basic Algebra',
        'description': 'Introduction to variables and simple equations',
        'content': '<h2>Algebra Basics</h2><p>Algebra uses letters to represent unknown numbers.</p>',
        'category': 'Mathematics',
        'difficulty_level': 'hard',
        'order_index': 8,
        'is_active': True
    },
    {
        'title': 'Reading Comprehension',
        'description': 'Improve your reading and understanding skills',
        'content': '<h2>Reading Skills</h2><p>Learn strategies to understand what you read.</p>',
        'category': 'English',
        'difficulty_level': 'easy',
        'order_index': 9,
        'is_active': True
    },
    {
        'title': 'Grammar Basics',
        'description': 'Learn the rules of English grammar',
        'content': '<h2>English Grammar</h2><p>Understanding grammar helps you communicate better.</p>',
        'category': 'English',
        'difficulty_level': 'medium',
        'order_index': 10,
        'is_active': True
    },
    {
        'title': 'Creative Writing',
        'description': 'Express yourself through creative storytelling',
        'content': '<h2>Creative Writing</h2><p>Learn to write engaging stories and essays.</p>',
        'category': 'English',
        'difficulty_level': 'medium',
        'order_index': 11,
        'is_active': True
    },
    {
        'title': 'Introduction to Science',
        'description': 'Explore the basics of scientific thinking',
        'content': '<h2>Science Basics</h2><p>Science helps us understand the world around us.</p>',
        'category': 'Science',
        'difficulty_level': 'easy',
        'order_index': 12,
        'is_active': True
    },
]

with app.app_context():
    # Check if lessons already exist
    existing_count = Lesson.query.count()
    
    if existing_count > 0:
        print(f"⚠️  Database already has {existing_count} lessons!")
        print("   Skipping seed to avoid duplicates.")
        print("   Delete existing lessons first if you want to reseed.")
    else:
        # Create all sample lessons
        for lesson_data in sample_lessons:
            lesson = Lesson(**lesson_data)
            db.session.add(lesson)
        
        db.session.commit()
        
        print("✅ Database seeded successfully!")
        print(f"   Added {len(sample_lessons)} sample lessons")
        print("\n📚 Sample lessons include:")
        print("   - Mathematics (8 lessons): Numbers, Addition, Subtraction, Multiplication, Division, Fractions, Decimals, Algebra")
        print("   - English (3 lessons): Reading, Grammar, Creative Writing")
        print("   - Science (1 lesson): Introduction to Science")
        print("\n🚀 The ML recommendation system can now provide personalized suggestions!")
