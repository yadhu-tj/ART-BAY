#!/usr/bin/env python3
"""
Script to check if a user exists in the database
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models.user_queries import get_user_by_email

def check_user(email):
    """Check if a user exists in the database."""
    print(f"Checking if user exists: {email}")
    
    try:
        user = get_user_by_email(email)
        if user:
            print(f"✅ User found: {user['name']} ({user['email']}) - Role: {user['role']}")
        else:
            print(f"❌ User not found: {email}")
    except Exception as e:
        print(f"❌ Error checking user: {e}")

if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        # Test emails from the console output
        test_emails = [
            "darkstar80s0@gmail.com",
            "comsictraveller50@gmail.com",  # Note: this was misspelled in the console
            "cosmictraveller50@gmail.com"
        ]
        
        for email in test_emails:
            check_user(email)
            print() 