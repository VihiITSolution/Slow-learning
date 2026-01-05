"""
Fix JWT identity to convert string to int
"""
import os
import re

# Files to update
files_to_update = [
    'app/routes/analytics.py',
    'app/routes/lessons.py',
    'app/routes/recommendations.py',
    'app/routes/ml_analytics.py',
    'app/routes/gamification.py',
    'app/routes/auth.py',
]

for file_path in files_to_update:
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            content = f.read()
        
        # Replace get_jwt_identity() with int(get_jwt_identity())
        # But only if it's not already wrapped in int()
        updated_content = re.sub(
            r'(\s+)(\w+)\s*=\s*get_jwt_identity\(\)',
            r'\1\2 = int(get_jwt_identity())',
            content
        )
        
        with open(file_path, 'w') as f:
            f.write(updated_content)
        
        print(f"Updated {file_path}")
    else:
        print(f"File not found: {file_path}")

print("\nDone!")
