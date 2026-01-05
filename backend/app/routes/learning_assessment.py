"""
Learning Assessment Routes
Integrated from children_category_identification_system
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
import random

bp = Blueprint('learning_assessment', __name__)

# ========================================================================================
# STUDENT CATEGORIES AND ASSESSMENT QUESTIONS
# ========================================================================================

student_categories = {
    "The Listener (Auditory Learner)": {
        "description": "This student struggles with processing spoken instructions and verbal information.",
        "questions": [
            "Does the student struggle to follow spoken instructions the first time?",
            "Does the student often say 'What?' or 'Huh?' after you've given a direction?",
            "Does the student seem distracted by background noise during a lesson?",
            "Does the student have difficulty remembering verbal instructions?",
            "Does the student tune out during oral presentations or stories?"
        ]
    },
    "The Reader (Visual Learner)": {
        "description": "This student ignores or struggles with written text and reading tasks.",
        "questions": [
            "Does the student ignore words on the board or in a book?",
            "Does the student try to avoid reading aloud?",
            "Does the student prefer pictures over text when given a choice?",
            "Does the student skip over written instructions?",
            "Does the student struggle to copy text from the board?"
        ]
    },
    "The Thinker (Conceptual Learner)": {
        "description": "This student is slow to grasp new concepts and needs more time to understand 'why' things work.",
        "questions": [
            "Does the student look confused even after a simple explanation?",
            "Does the student need concepts explained multiple times in different ways?",
            "Does the student struggle to apply a concept to a new situation?",
            "Does the student ask 'Why?' frequently but still seem confused?",
            "Does the student memorize steps without understanding the logic behind them?"
        ]
    },
    "The Mover (Kinesthetic Learner)": {
        "description": "This student learns best through physical movement, touch, and hands-on activities.",
        "questions": [
            "Is the student always fiddling with something or tapping their feet?",
            "Does the student want to get up and move around frequently?",
            "Does the student learn better when they can touch and manipulate objects?",
            "Does the student seem restless during sitting activities?",
            "Does the student remember things better when they act them out?"
        ]
    },
    "The Talker (Expressive Learner)": {
        "description": "This student understands concepts but struggles to express their knowledge in words or writing.",
        "questions": [
            "Does the student struggle to explain ideas in their own words?",
            "Does the student have difficulty writing down what they know?",
            "Does the student get frustrated when asked to describe something?",
            "Does the student show they understand through actions but not words?",
            "Does the student give very short answers even when they know more?"
        ]
    },
    "The Dreamer (Inattentive Learner)": {
        "description": "This student's attention wanders frequently and they seem disconnected from the lesson.",
        "questions": [
            "Does the student seem to be daydreaming or looking out the window often?",
            "Does the student miss important information because they weren't paying attention?",
            "Does the student need to be called on multiple times before responding?",
            "Does the student's mind seem to be somewhere else during lessons?",
            "Does the student have difficulty staying focused on any one task?"
        ]
    }
}

# Activity recommendations
activity_bank = {
    "The Listener (Auditory Learner)": {
        "description": "Activities to improve listening skills and auditory processing",
        "activities": [
            "🎧 Sound Scavenger Hunt: Close eyes and identify 5 different sounds in the room or outside",
            "🗣️ Simon Says: Practice careful listening with this classic game (10 minutes daily)",
            "👂 Whisper Chain: Start a message and whisper it around the class to see if it stays the same",
            "🎵 Rhyming Time: Find words that rhyme and create silly rhyming sentences",
            "📖 Audio Books: Let them listen to stories while following along in the book",
            "🔊 Sound Matching: Record familiar sounds and have them identify each one",
            "🎤 Repeat & Rephrase: Have them repeat instructions in their own words to check understanding"
        ]
    },
    "The Reader (Visual Learner)": {
        "description": "Activities to build reading skills through visual and engaging methods",
        "activities": [
            "🖼️ Picture-First Stories: Use wordless picture books and have them tell the story",
            "🔍 Word Hunt: Give a short fun sentence and have them circle specific words",
            "✏️ Label It!: Have them draw a toy or animal and help them label the parts",
            "🎨 Color-Code Reading: Use different colors for different types of words",
            "📝 Comic Strip Creation: Let them draw their own comic with simple captions",
            "🔤 Magnetic Letters: Build words using magnetic letters on a board",
            "📚 Choose Your Own Adventure: Let them pick books with lots of pictures and short text"
        ]
    },
    "The Thinker (Conceptual Learner)": {
        "description": "Activities to help understand concepts through concrete examples",
        "activities": [
            "🧱 Build It: Use LEGOs or blocks to explain math problems",
            "🎭 Role-Play: Act out stories, historical events, or science concepts",
            "✏️ Draw Your Understanding: Have them draw their understanding of a concept",
            "🔄 Real-Life Connections: Always connect new concepts to things they already know",
            "🧩 Break It Down: Split complex ideas into tiny, manageable steps",
            "🎯 Multiple Examples: Show the same concept in 3-4 different ways",
            "❓ Question Time: Encourage them to ask 'why' and 'how' questions"
        ]
    },
    "The Mover (Kinesthetic Learner)": {
        "description": "Activities that incorporate movement and hands-on learning",
        "activities": [
            "🎭 Act It Out: Have them act out vocabulary words",
            "🎨 Play-Doh Creations: Make models of letters, numbers, or shapes",
            "🦘 Math Hopscotch: Write numbers in chalk and have them hop to the answer",
            "✋ Hands-On Experiments: Science concepts through touchable experiments",
            "🧩 Puzzle Learning: Use physical puzzles to teach patterns",
            "🚶 Walking Spelling: Spell out words by walking the shape of each letter",
            "⚽ Ball Toss Learning: Toss a ball while practicing math facts"
        ]
    },
    "The Talker (Expressive Learner)": {
        "description": "Activities to help express knowledge through alternative methods",
        "activities": [
            "✏️ Draw Your Answer: Let them draw their response instead of writing",
            "🧸 Puppet Show: Use puppets to have conversations about the lesson",
            "👐 Show, Don't Tell: Ask them to demonstrate with blocks or toys",
            "🎨 Create a Poster: Let them make a visual poster to show what they learned",
            "🎭 Charades: Play charades to express vocabulary or concepts",
            "📹 Video Response: Let them record a short video explanation",
            "🗺️ Mind Maps: Help them organize thoughts visually with pictures"
        ]
    },
    "The Dreamer (Inattentive Learner)": {
        "description": "Activities to improve focus and maintain attention",
        "activities": [
            "⚡ Brain Breaks: Every 10 minutes, do 2-minute focus resets",
            "👀 The 'Look' Game: Short, focused observation tasks",
            "🔧 Fidget Tools: Provide quiet fidget toys during lessons",
            "⏰ Time Challenges: Create urgency and focus with timed tasks",
            "🎯 One Thing at a Time: Break tasks into single, clear steps",
            "🪑 Sitting Location: Seat them away from windows and near the teacher",
            "✅ Checklist System: Give them a visual checklist to mark off steps"
        ]
    }
}

# Game data
rhyming_words = {
    "cat": ["bat", "hat", "mat", "sat", "rat", "fat", "pat"],
    "sun": ["fun", "run", "bun", "one"],
    "dog": ["log", "fog", "hog", "jog"],
    "tree": ["bee", "see", "free", "knee", "me", "we"],
    "ball": ["call", "fall", "hall", "wall", "tall", "all"],
    "car": ["bar", "far", "jar", "star", "are"],
    "fish": ["dish", "wish"],
    "book": ["look", "cook", "took", "hook"],
    "day": ["say", "play", "way", "may", "bay", "hay"],
    "pen": ["hen", "ten", "men", "den"]
}

sound_categories = {
    "animals": [
        {"sound": "meow", "description": "A cat makes this sound", "emoji": "🐱"},
        {"sound": "woof", "description": "A dog makes this sound", "emoji": "🐶"},
        {"sound": "moo", "description": "A cow makes this sound", "emoji": "🐄"},
        {"sound": "oink", "description": "A pig makes this sound", "emoji": "🐷"},
        {"sound": "quack", "description": "A duck makes this sound", "emoji": "🦆"}
    ],
    "vehicles": [
        {"sound": "beep", "description": "A car horn makes this sound", "emoji": "🚗"},
        {"sound": "vroom", "description": "A car engine makes this sound", "emoji": "🏎️"},
        {"sound": "choo-choo", "description": "A train makes this sound", "emoji": "🚂"}
    ]
}

math_problems = [
    {"problem": "1 + 1 = ?", "answer": 2},
    {"problem": "2 + 1 = ?", "answer": 3},
    {"problem": "2 + 2 = ?", "answer": 4},
    {"problem": "3 + 2 = ?", "answer": 5},
    {"problem": "3 + 3 = ?", "answer": 6},
    {"problem": "4 + 3 = ?", "answer": 7},
    {"problem": "4 + 4 = ?", "answer": 8},
    {"problem": "5 + 4 = ?", "answer": 9},
    {"problem": "5 + 5 = ?", "answer": 10}
]

stories = [
    {
        "title": "A Day at the Park",
        "scenes": [
            {"id": 1, "order": 1, "bigEmoji": "🏠", "shortText": "Wake up at home"},
            {"id": 2, "order": 2, "bigEmoji": "🚗", "shortText": "Drive to park"},
            {"id": 3, "order": 3, "bigEmoji": "🎮", "shortText": "Play on swings"},
            {"id": 4, "order": 4, "bigEmoji": "🏠", "shortText": "Go back home"}
        ]
    },
    {
        "title": "Making a Sandwich",
        "scenes": [
            {"id": 1, "order": 1, "bigEmoji": "🍞", "shortText": "Get the bread"},
            {"id": 2, "order": 2, "bigEmoji": "🧈", "shortText": "Spread butter"},
            {"id": 3, "order": 3, "bigEmoji": "🥪", "shortText": "Add toppings"},
            {"id": 4, "order": 4, "bigEmoji": "😋", "shortText": "Eat it!"}
        ]
    },
    {
        "title": "Growing a Flower",
        "scenes": [
            {"id": 1, "order": 1, "bigEmoji": "🌱", "shortText": "Plant a seed"},
            {"id": 2, "order": 2, "bigEmoji": "💧", "shortText": "Water it"},
            {"id": 3, "order": 3, "bigEmoji": "☀️", "shortText": "Give it sun"},
            {"id": 4, "order": 4, "bigEmoji": "🌺", "shortText": "Flower blooms!"}
        ]
    }
]

# ========================================================================================
# API ROUTES
# ========================================================================================

@bp.route('/categories', methods=['GET'])
def get_categories():
    """Get all student learning categories"""
    return jsonify({
        'categories': student_categories
    }), 200


@bp.route('/submit-assessment', methods=['POST'])
@jwt_required()
def submit_assessment():
    """Process teacher's assessment and identify student's primary learning need"""
    user_id = get_jwt_identity()
    data = request.get_json()
    answers = data.get('answers', {})
    
    scores = {}
    
    # Calculate scores for each category
    for category, category_data in student_categories.items():
        score = 0
        questions = category_data['questions']
        for i in range(len(questions)):
            if answers.get(f'{category}_{i}') == 'yes':
                score += 1
        scores[category] = score
    
    # Find the category with the highest score
    identified_category = max(scores, key=scores.get)
    max_score = scores[identified_category]
    
    # Sort all categories by score
    sorted_categories = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    
    # Prepare detailed data for all categories
    all_needs = []
    for category, score in sorted_categories:
        if score > 0:
            category_data = activity_bank[category]
            all_needs.append({
                'category': category,
                'score': score,
                'description': category_data['description'],
                'activities': category_data['activities']
            })
    
    # Get primary category data
    primary_category_data = activity_bank[identified_category]
    
    return jsonify({
        'identified_category': identified_category,
        'description': primary_category_data['description'],
        'activities': primary_category_data['activities'],
        'scores': scores,
        'max_score': max_score,
        'total_questions': len(student_categories[identified_category]['questions']),
        'all_needs': all_needs
    }), 200


# Game API endpoints
@bp.route('/games/rhyme-word', methods=['GET'])
def get_rhyme_word():
    """Get a random word for the rhyming game"""
    word = random.choice(list(rhyming_words.keys()))
    return jsonify({'word': word, 'rhymes': rhyming_words[word]}), 200


@bp.route('/games/sound-categories', methods=['GET'])
def get_sound_categories():
    """Get all sound categories with details"""
    return jsonify(sound_categories), 200


@bp.route('/games/math-problem', methods=['GET'])
def get_math_problem():
    """Get a random math problem"""
    problem_data = random.choice(math_problems)
    return jsonify(problem_data), 200


@bp.route('/games/story', methods=['GET'])
def get_story():
    """Get a random story for sequencing game"""
    story = random.choice(stories)
    # Shuffle scenes for display but keep order data
    shuffled_scenes = story['scenes'].copy()
    random.shuffle(shuffled_scenes)
    return jsonify({
        'title': story['title'],
        'scenes': shuffled_scenes
    }), 200


@bp.route('/games/track-performance', methods=['POST'])
@jwt_required()
def track_performance():
    """Track student game performance"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    game = data.get('game')
    score = data.get('score', 0)
    completed = data.get('completed', False)
    
    # Here you could save to database if needed
    # For now, just return success
    
    return jsonify({
        'success': True,
        'game': game,
        'score': score
    }), 200
