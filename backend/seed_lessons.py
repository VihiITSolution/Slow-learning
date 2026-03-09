"""
Seed interactive lessons for primary students with ML data collection support.
Run standalone: python seed_lessons.py
Or called from app factory after db.create_all()
"""
import json
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))


LESSONS = [
    {
        "title": "Counting 1 to 10",
        "description": "Learn to count from 1 to 10 with fun activities!",
        "category": "math",
        "difficulty_level": "beginner",
        "xp_reward": 30,
        "order_index": 1,
        "content": {
            "type": "interactive",
            "emoji": "🔢",
            "steps": [
                {
                    "type": "learn",
                    "title": "Let's Count Together!",
                    "content": "<p>Numbers help us count things around us. Let's learn 1 to 10!</p><div style='font-size:1.5rem;text-align:center;line-height:2.5'>1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣<br>6️⃣ 7️⃣ 8️⃣ 9️⃣ 🔟</div><p>Point to each number and say it out loud!</p>"
                },
                {
                    "type": "activity",
                    "title": "Which number comes after 4?",
                    "question": "1️⃣ 2️⃣ 3️⃣ 4️⃣ ___ What number comes next?",
                    "options": ["3", "5", "6", "2"],
                    "correct": 1,
                    "explanation": "Great! After 4 comes 5. We count: 1, 2, 3, 4, 5!"
                },
                {
                    "type": "learn",
                    "title": "Counting Objects",
                    "content": "<p>We can count anything! Look at these apples:</p><div style='font-size:2rem;text-align:center'>🍎🍎🍎🍎🍎🍎🍎</div><p>Count them one by one: 1, 2, 3, 4, 5, 6, 7</p><p>There are <strong>7 apples</strong>!</p>"
                },
                {
                    "type": "activity",
                    "title": "How many stars?",
                    "question": "⭐⭐⭐⭐⭐⭐⭐⭐⭐ How many stars are there?",
                    "options": ["7", "8", "9", "10"],
                    "correct": 2,
                    "explanation": "Well done! There are 9 stars. Count them again: 1, 2, 3, 4, 5, 6, 7, 8, 9!"
                },
                {
                    "type": "activity",
                    "title": "What is the biggest number?",
                    "question": "Which of these is the BIGGEST number?",
                    "options": ["3", "7", "1", "10"],
                    "correct": 3,
                    "explanation": "10 is the biggest! It comes last when we count 1, 2, 3 ... all the way to 10."
                }
            ]
        },
        "quiz": {
            "title": "Counting 1 to 10 Quiz",
            "passing_score": 60,
            "xp_reward": 20,
            "questions": [
                {"q": "What number comes after 6?", "options": ["5", "7", "8", "6"], "correct": 1},
                {"q": "How many fingers do you have on one hand?", "options": ["4", "6", "5", "3"], "correct": 2},
                {"q": "Which number comes BEFORE 3?", "options": ["4", "1", "2", "5"], "correct": 2},
                {"q": "Count the balls: 🏀🏀🏀🏀🏀🏀🏀🏀 How many?", "options": ["6", "7", "8", "9"], "correct": 2},
                {"q": "What is 1 + 1?", "options": ["1", "2", "3", "4"], "correct": 1}
            ]
        }
    },
    {
        "title": "Addition Up to 10",
        "description": "Add small numbers together — easy and fun!",
        "category": "math",
        "difficulty_level": "beginner",
        "xp_reward": 40,
        "order_index": 2,
        "content": {
            "type": "interactive",
            "emoji": "➕",
            "steps": [
                {
                    "type": "learn",
                    "title": "What is Addition?",
                    "content": "<p>Addition means <strong>putting things together</strong>!</p><p>The <strong>+</strong> sign means 'add' or 'plus'.</p><div style='text-align:center;font-size:1.3rem;background:#f0f9ff;padding:1rem;border-radius:8px;margin:1rem 0'>🍕 + 🍕 = 2 pizzas<br><br>3 + 2 = 5</div><p>We start with 3, then count on 2 more: 4, 5!</p>"
                },
                {
                    "type": "activity",
                    "title": "Add the apples",
                    "question": "🍎🍎 + 🍎🍎🍎 = ?",
                    "options": ["4", "5", "6", "3"],
                    "correct": 1,
                    "explanation": "2 apples + 3 apples = 5 apples! Count them all: 1, 2, 3, 4, 5 🎉"
                },
                {
                    "type": "learn",
                    "title": "Adding with Numbers",
                    "content": "<p>Let's use numbers now. Try this trick:</p><ol><li>Start with the bigger number</li><li>Count up by the smaller number</li></ol><div style='text-align:center;font-size:1.3rem;background:#f0fdf4;padding:1rem;border-radius:8px;margin:1rem 0'>4 + 3 = ?<br>Start at 4 → count 3 more → <strong>5, 6, 7</strong><br>Answer: 7!</div>"
                },
                {
                    "type": "activity",
                    "title": "Solve 3 + 4",
                    "question": "What is 3 + 4?",
                    "options": ["6", "8", "7", "5"],
                    "correct": 2,
                    "explanation": "3 + 4 = 7! Start at 4, count on 3: 5, 6, 7. You got it!"
                },
                {
                    "type": "activity",
                    "title": "Word problem",
                    "question": "Tom has 5 toy cars 🚗 and gets 2 more 🚗🚗. How many cars does Tom have now?",
                    "options": ["6", "7", "8", "9"],
                    "correct": 1,
                    "explanation": "5 + 2 = 7 cars! Tom now has 7 toy cars. Great job solving the word problem!"
                }
            ]
        },
        "quiz": {
            "title": "Addition Quiz",
            "passing_score": 60,
            "xp_reward": 25,
            "questions": [
                {"q": "What is 2 + 3?", "options": ["4", "5", "6", "3"], "correct": 1},
                {"q": "What is 1 + 6?", "options": ["6", "8", "7", "5"], "correct": 2},
                {"q": "🌟🌟🌟 + 🌟🌟 = ?", "options": ["4", "6", "5", "7"], "correct": 2},
                {"q": "What is 4 + 4?", "options": ["7", "9", "8", "6"], "correct": 2},
                {"q": "Sara has 3 pencils ✏️ and finds 3 more. How many does she have?", "options": ["5", "7", "6", "8"], "correct": 2}
            ]
        }
    },
    {
        "title": "Vowels and Consonants",
        "description": "Discover the letters A, E, I, O, U and how they help us read!",
        "category": "english",
        "difficulty_level": "beginner",
        "xp_reward": 30,
        "order_index": 3,
        "content": {
            "type": "interactive",
            "emoji": "🔤",
            "steps": [
                {
                    "type": "learn",
                    "title": "The Alphabet",
                    "content": "<p>The English alphabet has <strong>26 letters</strong>.</p><p>Letters are split into two groups:</p><ul><li><strong>Vowels</strong> – A, E, I, O, U</li><li><strong>Consonants</strong> – all the other letters (B, C, D, F, G ... )</li></ul><div style='font-size:1.5rem;text-align:center;background:#fef3c7;padding:1rem;border-radius:8px;margin:1rem 0'>🌟 A  E  I  O  U 🌟<br><small style='font-size:0.8rem'>These are your 5 vowels!</small></div>"
                },
                {
                    "type": "activity",
                    "title": "Find the vowel!",
                    "question": "Which of these letters is a VOWEL?",
                    "options": ["B", "D", "O", "K"],
                    "correct": 2,
                    "explanation": "O is a vowel! Remember: A, E, I, O, U are the 5 vowels. B, D, K are consonants."
                },
                {
                    "type": "learn",
                    "title": "Vowels in Words",
                    "content": "<p>Every word has at least one vowel. Can you spot them?</p><div style='font-size:1.2rem;background:#f0f9ff;padding:1rem;border-radius:8px;margin:1rem 0'><p>c<span style='color:#e11d48;font-weight:bold'>a</span>t &nbsp;→ vowel: <strong>a</strong></p><p>b<span style='color:#e11d48;font-weight:bold'>i</span>g &nbsp;&nbsp;→ vowel: <strong>i</strong></p><p>d<span style='color:#e11d48;font-weight:bold'>o</span>g → vowel: <strong>o</strong></p></div>"
                },
                {
                    "type": "activity",
                    "title": "Find the vowel in the word",
                    "question": "Which letter in the word 'SUN' is a vowel?",
                    "options": ["S", "N", "U", "None"],
                    "correct": 2,
                    "explanation": "U is the vowel in SUN! S and N are consonants. The word SUN = S(consonant) + U(vowel) + N(consonant)."
                },
                {
                    "type": "activity",
                    "title": "Count the vowels",
                    "question": "How many vowels are in the word 'APPLE'? (A, P, P, L, E)",
                    "options": ["1", "3", "2", "4"],
                    "correct": 2,
                    "explanation": "APPLE has 2 vowels: A and E! A-P-P-L-E → the vowels are the first letter (A) and the last letter (E)."
                }
            ]
        },
        "quiz": {
            "title": "Vowels & Consonants Quiz",
            "passing_score": 60,
            "xp_reward": 20,
            "questions": [
                {"q": "How many vowels are in the English alphabet?", "options": ["3", "4", "5", "6"], "correct": 2},
                {"q": "Which is NOT a vowel?", "options": ["A", "I", "F", "E"], "correct": 2},
                {"q": "What is the vowel in the word 'PIG'?", "options": ["P", "G", "I", "None"], "correct": 2},
                {"q": "Which word has TWO vowels?", "options": ["CAT", "BIG", "BOAT", "RUN"], "correct": 2},
                {"q": "Is the letter 'M' a vowel or consonant?", "options": ["Vowel", "Consonant", "Both", "Neither"], "correct": 1}
            ]
        }
    },
    {
        "title": "CVC Words",
        "description": "Sound out and build simple 3-letter words like cat, dog, and sun!",
        "category": "english",
        "difficulty_level": "beginner",
        "xp_reward": 40,
        "order_index": 4,
        "content": {
            "type": "interactive",
            "emoji": "📖",
            "steps": [
                {
                    "type": "learn",
                    "title": "What is a CVC Word?",
                    "content": "<p>CVC stands for <strong>Consonant – Vowel – Consonant</strong>.</p><p>These are simple 3-letter words that are easy to read!</p><div style='font-size:1.2rem;background:#fef9c3;padding:1rem;border-radius:8px;margin:1rem 0'><p>🐈 <strong>C</strong>-<strong>A</strong>-<strong>T</strong> → cat</p><p>🐕 <strong>D</strong>-<strong>O</strong>-<strong>G</strong> → dog</p><p>☀️ <strong>S</strong>-<strong>U</strong>-<strong>N</strong> → sun</p></div><p>Say each sound out loud, then blend them together!</p>"
                },
                {
                    "type": "activity",
                    "title": "Which is a CVC word?",
                    "question": "Which of these is a CVC word (3 letters, middle is a vowel)?",
                    "options": ["PLAY", "AN", "HIM", "ST"],
                    "correct": 2,
                    "explanation": "HIM is a CVC word! H (consonant) + I (vowel) + M (consonant). PLAY has 4 letters, AN only has 2."
                },
                {
                    "type": "learn",
                    "title": "Blending Sounds",
                    "content": "<p>To read a CVC word, say each sound slowly, then blend:</p><div style='font-size:1.2rem;background:#ecfdf5;padding:1rem;border-radius:8px;margin:1rem 0'><p>🐷 P + I + G = pig</p><p>Say it slow: <em>/p/ ... /ĭ/ ... /g/</em></p><p>Now fast: <strong>pig!</strong> 🐷</p></div><p>Try it with: <strong>TOP</strong>, <strong>NET</strong>, <strong>BUS</strong></p>"
                },
                {
                    "type": "activity",
                    "title": "What word is this?",
                    "question": "🔊 These sounds blend together to make a word: /h/ + /a/ + /t/. What word is it?",
                    "options": ["hit", "hot", "hat", "hut"],
                    "correct": 2,
                    "explanation": "/h/ + /a/ + /t/ = hat 🎩! The middle vowel is 'a', so the word is HAT. Great blending!"
                },
                {
                    "type": "activity",
                    "title": "Complete the word",
                    "question": "🐝 B-E-_ : What letter completes this CVC word?",
                    "options": ["A", "N", "S", "D"],
                    "correct": 1,
                    "explanation": "BEN! B + E + N = BEN. The word is 'ben' (a mountain peak), but more common CVC words with 'E' are: BED, HEN, NET, PET!"
                }
            ]
        },
        "quiz": {
            "title": "CVC Words Quiz",
            "passing_score": 60,
            "xp_reward": 25,
            "questions": [
                {"q": "What does CVC stand for?", "options": ["Cat-Vowel-Cat", "Consonant-Vowel-Consonant", "City-Village-Country", "Color-Voice-Count"], "correct": 1},
                {"q": "Which is a CVC word?", "options": ["FROG", "MAP", "THE", "BLUE"], "correct": 1},
                {"q": "What is the vowel in the word LOG?", "options": ["L", "G", "O", "None"], "correct": 2},
                {"q": "Blend these sounds: /s/ + /i/ + /t/. What word do you get?", "options": ["sat", "set", "sot", "sit"], "correct": 3},
                {"q": "Which word rhymes with CAT?", "options": ["cup", "mat", "tip", "fog"], "correct": 1}
            ]
        }
    },
    {
        "title": "Animals and Their Homes",
        "description": "Explore where different animals live and what makes them special!",
        "category": "science",
        "difficulty_level": "beginner",
        "xp_reward": 35,
        "order_index": 5,
        "content": {
            "type": "interactive",
            "emoji": "🐾",
            "steps": [
                {
                    "type": "learn",
                    "title": "Animals Live in Different Places",
                    "content": "<p>Animals live all over the world in different <strong>habitats</strong>.</p><p>A habitat is the place where an animal lives and finds food!</p><div style='font-size:1.1rem;background:#fef3c7;padding:1rem;border-radius:8px;margin:1rem 0'><p>🦁 Lion → lives in the <strong>grasslands</strong> (savanna)</p><p>🐟 Fish → lives in the <strong>ocean or river</strong></p><p>🐻 Bear → lives in the <strong>forest</strong></p><p>🐪 Camel → lives in the <strong>desert</strong></p></div>"
                },
                {
                    "type": "activity",
                    "title": "Where does a fish live?",
                    "question": "🐟 A fish needs water to survive. Where does it live?",
                    "options": ["Desert 🏜️", "Forest 🌲", "Water / Ocean 🌊", "Sky ☁️"],
                    "correct": 2,
                    "explanation": "Fish live in water! They breathe through gills and need to stay wet. They can live in oceans, rivers, and lakes."
                },
                {
                    "type": "learn",
                    "title": "Animal Homes Have Special Names",
                    "content": "<p>Different animals have special names for their homes:</p><div style='font-size:1.1rem;background:#ecfdf5;padding:1rem;border-radius:8px;margin:1rem 0'><p>🐦 Bird → lives in a <strong>nest</strong></p><p>🐝 Bee → lives in a <strong>hive</strong></p><p>🐠 Fish → lives in a <strong>tank / sea / pond</strong></p><p>🐕 Dog → lives in a <strong>kennel</strong></p><p>🐄 Cow → lives in a <strong>barn</strong></p></div>"
                },
                {
                    "type": "activity",
                    "title": "Where does a bird live?",
                    "question": "🐦 A bird builds a home in a tree to lay its eggs. What is this home called?",
                    "options": ["Den", "Nest", "Burrow", "Hive"],
                    "correct": 1,
                    "explanation": "Birds live in a NEST! They build nests from twigs and leaves in trees to keep their eggs safe and warm."
                },
                {
                    "type": "activity",
                    "title": "Match the animal to its home",
                    "question": "🐝 Bees make honey and live together in a group. What is their home called?",
                    "options": ["Nest", "Den", "Hive", "Burrow"],
                    "correct": 2,
                    "explanation": "Bees live in a HIVE! Thousands of bees work together in a hive. They make honey and wax inside it."
                }
            ]
        },
        "quiz": {
            "title": "Animals and Homes Quiz",
            "passing_score": 60,
            "xp_reward": 20,
            "questions": [
                {"q": "What is the home of a bee called?", "options": ["Nest", "Kennel", "Hive", "Den"], "correct": 2},
                {"q": "Where does a fish live?", "options": ["In a tree", "In the desert", "In water", "On the moon"], "correct": 2},
                {"q": "Which animal lives in a nest?", "options": ["Dog", "Cow", "Bird", "Fish"], "correct": 2},
                {"q": "A lion lives in the...", "options": ["Ocean", "Grasslands/Savanna", "Arctic ice", "Rainforest"], "correct": 1},
                {"q": "What is a habitat?", "options": ["A type of food", "A place where an animal lives", "A kind of animal", "A body part"], "correct": 1}
            ]
        }
    },
    {
        "title": "Colors All Around Us",
        "description": "Learn about colors and discover them in nature and everyday life!",
        "category": "science",
        "difficulty_level": "beginner",
        "xp_reward": 25,
        "order_index": 6,
        "content": {
            "type": "interactive",
            "emoji": "🎨",
            "steps": [
                {
                    "type": "learn",
                    "title": "The Rainbow of Colors",
                    "content": "<p>Colors make the world beautiful! The <strong>rainbow</strong> shows us 7 colors:</p><div style='font-size:1.2rem;text-align:center;background:linear-gradient(180deg,#fee2e2,#fef3c7,#fefce8,#dcfce7,#e0f2fe,#eff6ff,#faf5ff);padding:1rem;border-radius:8px;margin:1rem 0;line-height:2.2'>🔴 Red &nbsp; 🟠 Orange &nbsp; 🟡 Yellow<br>🟢 Green &nbsp; 🔵 Blue &nbsp; 💜 Indigo &nbsp; 🟣 Violet</div><p>You can remember them with <strong>ROY G BIV</strong>!</p>"
                },
                {
                    "type": "activity",
                    "title": "What color is the sky?",
                    "question": "☀️ On a beautiful sunny day, what color is the sky?",
                    "options": ["Red 🔴", "Green 🟢", "Blue 🔵", "Yellow 🟡"],
                    "correct": 2,
                    "explanation": "The sky is BLUE! Sunlight scatters off tiny air particles and makes the sky appear blue. Isn't science amazing?"
                },
                {
                    "type": "learn",
                    "title": "Primary Colors",
                    "content": "<p>There are 3 <strong>primary colors</strong> — they cannot be made by mixing other colors:</p><div style='font-size:1.2rem;text-align:center;background:#fff7ed;padding:1rem;border-radius:8px;margin:1rem 0'><strong>🔴 Red + 🔵 Blue + 🟡 Yellow</strong></div><p>When you mix two primary colors together, you get a <strong>secondary color</strong>:</p><p>🔴 Red + 🟡 Yellow = 🟠 Orange</p><p>🔵 Blue + 🟡 Yellow = 🟢 Green</p><p>🔴 Red + 🔵 Blue = 💜 Purple</p>"
                },
                {
                    "type": "activity",
                    "title": "Mix the colors!",
                    "question": "🎨 What color do you get when you mix RED and YELLOW together?",
                    "options": ["Purple 💜", "Green 🟢", "Orange 🟠", "Blue 🔵"],
                    "correct": 2,
                    "explanation": "Red + Yellow = ORANGE 🟠! Think of a beautiful orange sunset or a juicy orange fruit!"
                },
                {
                    "type": "activity",
                    "title": "What are primary colors?",
                    "question": "Which of these is NOT a primary color?",
                    "options": ["Red 🔴", "Orange 🟠", "Blue 🔵", "Yellow 🟡"],
                    "correct": 1,
                    "explanation": "Orange is NOT a primary color — it's a secondary color made by mixing Red + Yellow! The 3 primary colors are Red, Blue, and Yellow."
                }
            ]
        },
        "quiz": {
            "title": "Colors Quiz",
            "passing_score": 60,
            "xp_reward": 15,
            "questions": [
                {"q": "What are the 3 PRIMARY colors?", "options": ["Red, Green, Blue", "Red, Yellow, Blue", "Orange, Purple, Green", "Pink, Brown, White"], "correct": 1},
                {"q": "What color do you get mixing Blue + Yellow?", "options": ["Orange", "Purple", "Green", "Brown"], "correct": 2},
                {"q": "How many colors are in a rainbow?", "options": ["5", "6", "7", "8"], "correct": 2},
                {"q": "What color is a ripe banana? 🍌", "options": ["Red", "Blue", "Yellow", "Green"], "correct": 2},
                {"q": "Red + Blue = ?", "options": ["Orange", "Green", "Purple", "Brown"], "correct": 2}
            ]
        }
    }
]


def seed(app=None):
    """Seed lessons into the database. Safe to call multiple times — skips if data exists."""
    from app.models.lesson import Lesson
    from app.models.quiz import Quiz

    def _do_seed():
        if Lesson.query.count() > 0:
            return  # Already seeded

        print("[seed] Seeding interactive primary lessons...")
        for data in LESSONS:
            quiz_data = data.pop("quiz")
            content_json = json.dumps(data.pop("content"))

            lesson = Lesson(
                title=data["title"],
                description=data["description"],
                category=data["category"],
                difficulty_level=data["difficulty_level"],
                xp_reward=data["xp_reward"],
                order_index=data["order_index"],
                content=content_json,
                is_active=True
            )
            from app import db
            db.session.add(lesson)
            db.session.flush()  # get lesson.id

            quiz = Quiz(
                lesson_id=lesson.id,
                title=quiz_data["title"],
                questions=quiz_data["questions"],
                passing_score=quiz_data["passing_score"],
                xp_reward=quiz_data["xp_reward"],
                is_active=True
            )
            db.session.add(quiz)

        from app import db
        db.session.commit()
        print(f"[seed] Done — {len(LESSONS)} lessons seeded.")

    if app:
        with app.app_context():
            _do_seed()
    else:
        _do_seed()


if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    from app import create_app
    flask_app = create_app()
    seed(flask_app)
