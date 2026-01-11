#!/usr/bin/env python3
"""
Script to create necessary upload directories
"""
import os

# Get the directory where this script is located
script_dir = os.path.dirname(os.path.abspath(__file__))

# Define directories to create
directories = [
    os.path.join(script_dir, 'static'),
    os.path.join(script_dir, 'static', 'profile_pictures'),
    os.path.join(script_dir, 'static', 'id_cards'),
    os.path.join(script_dir, 'static', 'id_cards', 'front'),
    os.path.join(script_dir, 'static', 'id_cards', 'back'),
    os.path.join(script_dir, 'static', 'fayda_documents'),
]

print("Creating upload directories...")
for directory in directories:
    os.makedirs(directory, exist_ok=True)
    print(f"✓ Created: {directory}")

print("\nAll directories created successfully!")
print("\nDirectory structure:")
print("BackEnd/")
print("└── static/")
print("    ├── profile_pictures/")
print("    ├── fayda_documents/")
print("    └── id_cards/")
print("        ├── front/")
print("        └── back/")
