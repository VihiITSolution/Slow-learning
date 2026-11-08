"""
Practice question generator for the student Practice page.

A practice round is 5 short questions in one area:
    math  - counting, adding, taking away, bigger number, what comes next
    words - first letter, rhymes, vowels, missing letter, picture words
    world - colours, animal sounds, animal homes, living things, our senses

Questions are made from a random seed. The seed is sent to the browser with
the questions and comes back with the answers, so the server can build the
same questions again and check every answer itself instead of trusting a
score sent by the browser.
"""
import random

CATEGORIES = {
    'math': {'title': 'Number Fun', 'emoji': '🔢'},
    'words': {'title': 'Word Play', 'emoji': '🔤'},
    'world': {'title': 'My World', 'emoji': '🌍'},
}

QUESTIONS_PER_ROUND = 5

COUNT_ITEMS = ['🍎', '⭐', '🐟', '🎈', '🌸', '🚗', '🐤', '🍪']

PICTURE_WORDS = [
    ('🐱', 'cat'), ('🐶', 'dog'), ('☀️', 'sun'), ('🐟', 'fish'), ('🚌', 'bus'),
    ('🎩', 'hat'), ('🐷', 'pig'), ('🛏️', 'bed'), ('🥚', 'egg'), ('🦊', 'fox'),
    ('🐝', 'bee'), ('🍎', 'apple'), ('🦆', 'duck'), ('🐸', 'frog'), ('🌙', 'moon'),
]

# Short words for "fill in the missing letter" (the middle letter is a vowel)
CVC_WORDS = [('🐱', 'cat'), ('🐶', 'dog'), ('☀️', 'sun'), ('🐷', 'pig'), ('🛏️', 'bed'),
             ('🎩', 'hat'), ('🚌', 'bus'), ('🦊', 'fox'), ('🐛', 'bug'), ('🥅', 'net')]

RHYME_FAMILIES = [
    ['cat', 'hat', 'bat', 'mat'], ['dog', 'log', 'frog', 'fog'], ['sun', 'run', 'fun', 'bun'],
    ['bee', 'tree', 'see', 'three'], ['cake', 'lake', 'make', 'bake'], ['ring', 'king', 'sing', 'wing'],
]

COLOURS = [
    ('🍌', 'banana', 'Yellow'), ('🍓', 'strawberry', 'Red'), ('🥕', 'carrot', 'Orange'),
    ('🐸', 'frog', 'Green'), ('🍆', 'eggplant', 'Purple'), ('🐘', 'elephant', 'Grey'),
    ('🌊', 'sea', 'Blue'), ('🍫', 'chocolate', 'Brown'),
]
COLOUR_NAMES = ['Yellow', 'Red', 'Orange', 'Green', 'Purple', 'Grey', 'Blue', 'Brown']

ANIMAL_SOUNDS = [('🐶', 'dog', 'Woof'), ('🐱', 'cat', 'Meow'), ('🐮', 'cow', 'Moo'),
                 ('🦆', 'duck', 'Quack'), ('🐑', 'sheep', 'Baa'), ('🐷', 'pig', 'Oink')]

ANIMAL_HOMES = [('🐟', 'fish', 'Water'), ('🐦', 'bird', 'Nest'), ('🐝', 'bee', 'Hive'),
                ('🐄', 'cow', 'Farm'), ('🐻', 'bear', 'Cave'), ('🕷️', 'spider', 'Web')]

LIVING = ['🌳 Tree', '🐶 Dog', '🌻 Flower', '🐟 Fish', '🐦 Bird']
NON_LIVING = ['🪨 Rock', '🚗 Car', '🧸 Teddy', '⚽ Ball', '🪑 Chair', '📱 Phone']

SENSES = [('👂', 'hear sounds', 'Ears'), ('👀', 'see colours', 'Eyes'),
          ('👃', 'smell flowers', 'Nose'), ('👅', 'taste food', 'Tongue'), ('✋', 'feel things', 'Hands')]


def _choices(rng, answer, wrong_pool, n=4):
    """The answer plus (n-1) different wrong options, shuffled. Returns (options, answer_index)."""
    wrong = [w for w in dict.fromkeys(wrong_pool) if w != answer]
    rng.shuffle(wrong)
    options = [answer] + wrong[:n - 1]
    rng.shuffle(options)
    return options, options.index(answer)


def _number_options(rng, answer, low=0, high=20):
    pool = [v for v in range(max(low, answer - 4), min(high, answer + 4) + 1) if v != answer]
    options, index = _choices(rng, answer, pool)
    return [str(o) for o in options], index


# ----------------------------------------------------------------------------- math
def _count(rng):
    item = rng.choice(COUNT_ITEMS)
    n = rng.randint(3, 9)
    options, index = _number_options(rng, n, 1, 12)
    return {'type': 'count', 'prompt': 'How many can you count?', 'visual': item * n,
            'options': options, 'answer': index,
            'hint': 'Touch each one with your finger and count out loud.'}


def _add(rng):
    a, b = rng.randint(1, 5), rng.randint(1, 5)
    item = rng.choice(COUNT_ITEMS)
    options, index = _number_options(rng, a + b, 0, 12)
    return {'type': 'add', 'prompt': f'What is {a} + {b}?', 'visual': f'{item * a}  +  {item * b}',
            'options': options, 'answer': index,
            'hint': f'Start at {a} and count on {b} more.'}


def _subtract(rng):
    a = rng.randint(3, 10)
    b = rng.randint(1, a - 1)
    options, index = _number_options(rng, a - b, 0, 10)
    return {'type': 'subtract', 'prompt': f'What is {a} − {b}?', 'visual': '🍪' * a,
            'options': options, 'answer': index,
            'hint': f'Start with {a} and count back {b}.'}


def _bigger(rng):
    numbers = rng.sample(range(1, 20), 4)
    answer = max(numbers)
    options = [str(n) for n in numbers]
    return {'type': 'bigger', 'prompt': 'Which number is the biggest?', 'visual': '⬆️',
            'options': options, 'answer': options.index(str(answer)),
            'hint': 'The biggest number comes last when you count up.'}


def _next_number(rng):
    start = rng.randint(1, 15)
    options, index = _number_options(rng, start + 1, 0, 20)
    return {'type': 'next', 'prompt': f'What number comes after {start}?', 'visual': f'{start}, ❓',
            'options': options, 'answer': index,
            'hint': f'Count up: {start - 1}, {start}, ...' if start > 1 else 'Count up: 1, ...'}


# ---------------------------------------------------------------------------- words
def _first_letter(rng):
    emoji, word = rng.choice(PICTURE_WORDS)
    letters = list('abcdefghijklmnoprstw')
    options, index = _choices(rng, word[0], letters)
    return {'type': 'first_letter', 'prompt': f'What sound does "{word}" start with?', 'visual': emoji,
            'options': options, 'answer': index,
            'hint': f'Say "{word}" slowly. Listen to the very first sound.'}


def _rhyme(rng):
    family = rng.choice(RHYME_FAMILIES)
    word, answer = rng.sample(family, 2)
    others = [w for f in RHYME_FAMILIES if f is not family for w in f]
    options, index = _choices(rng, answer, others)
    return {'type': 'rhyme', 'prompt': f'Which word rhymes with "{word}"?', 'visual': '🎵',
            'options': options, 'answer': index,
            'hint': f'Rhyming words sound the same at the end, like "{word}" and ...'}


def _vowel(rng):
    vowel = rng.choice('aeiou')
    options, index = _choices(rng, vowel, list('bcdfghklmnprst'))
    return {'type': 'vowel', 'prompt': 'Which letter is a vowel?', 'visual': '🅰️',
            'options': options, 'answer': index,
            'hint': 'The vowels are a, e, i, o, u.'}


def _missing_letter(rng):
    emoji, word = rng.choice(CVC_WORDS)
    options, index = _choices(rng, word[1], list('aeiou'))
    return {'type': 'missing_letter', 'prompt': f'Fill the gap: {word[0]} _ {word[2]}', 'visual': emoji,
            'options': options, 'answer': index,
            'hint': f'Say the word for the picture slowly: {word[0]}... ?... {word[2]}.'}


def _picture_word(rng):
    emoji, word = rng.choice(PICTURE_WORDS)
    options, index = _choices(rng, word, [w for _, w in PICTURE_WORDS])
    return {'type': 'picture_word', 'prompt': 'Which word matches the picture?', 'visual': emoji,
            'options': options, 'answer': index,
            'hint': 'Say what you see, then find the word that starts with that sound.'}


# ---------------------------------------------------------------------------- world
def _colour(rng):
    emoji, name, colour = rng.choice(COLOURS)
    options, index = _choices(rng, colour, COLOUR_NAMES)
    return {'type': 'colour', 'prompt': f'What colour is a {name}?', 'visual': emoji,
            'options': options, 'answer': index,
            'hint': 'Look at the picture carefully.'}


def _animal_sound(rng):
    emoji, animal, sound = rng.choice(ANIMAL_SOUNDS)
    options, index = _choices(rng, sound, [s for _, _, s in ANIMAL_SOUNDS])
    return {'type': 'animal_sound', 'prompt': f'What sound does a {animal} make?', 'visual': emoji,
            'options': options, 'answer': index,
            'hint': f'Think of a {animal} you have seen or heard.'}


def _animal_home(rng):
    emoji, animal, home = rng.choice(ANIMAL_HOMES)
    options, index = _choices(rng, home, [h for _, _, h in ANIMAL_HOMES])
    return {'type': 'animal_home', 'prompt': f'Where does a {animal} live?', 'visual': emoji,
            'options': options, 'answer': index,
            'hint': f'Where would a {animal} be safe and happy?'}


def _living(rng):
    answer = rng.choice(LIVING)
    options, index = _choices(rng, answer, NON_LIVING)
    return {'type': 'living', 'prompt': 'Which one is a living thing?', 'visual': '🌱',
            'options': options, 'answer': index,
            'hint': 'Living things grow, eat and breathe.'}


def _sense(rng):
    emoji, action, part = rng.choice(SENSES)
    options, index = _choices(rng, part, [p for _, _, p in SENSES])
    return {'type': 'sense', 'prompt': f'What do we use to {action}?', 'visual': emoji,
            'options': options, 'answer': index,
            'hint': 'Look at the picture - it is a clue!'}


GENERATORS = {
    'math': [_count, _add, _subtract, _bigger, _next_number],
    'words': [_first_letter, _rhyme, _vowel, _missing_letter, _picture_word],
    'world': [_colour, _animal_sound, _animal_home, _living, _sense],
}


def new_seed():
    return random.SystemRandom().randint(1, 2 ** 31 - 1)


def build_round(category, seed):
    """The same (category, seed) always gives exactly the same questions."""
    if category not in GENERATORS:
        raise ValueError(f'Unknown practice area: {category}')
    rng = random.Random(f'{category}:{seed}')
    makers = list(GENERATORS[category])
    rng.shuffle(makers)
    questions = []
    for i, make in enumerate(makers[:QUESTIONS_PER_ROUND]):
        question = make(rng)
        question['id'] = i
        questions.append(question)
    return questions
