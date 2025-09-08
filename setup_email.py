#!/usr/bin/env python3
"""
Email Setup Script for ART&BAY OTP Authentication

This script helps you configure your email settings for OTP authentication.
You'll need a Gmail account and an App Password.

Instructions:
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password for this application
3. Update the .env file with your credentials
"""

import os
import re

def validate_email(email):
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def setup_email_config():
    """Interactive setup for email configuration."""
    print("=" * 60)
    print("ART&BAY Email Configuration Setup")
    print("=" * 60)
    print()
    print("This setup will help you configure email authentication for OTP login.")
    print("You'll need a Gmail account with 2-Factor Authentication enabled.")
    print()
    
    # Get email
    while True:
        email = input("Enter your Gmail address: ").strip()
        if validate_email(email):
            if email.endswith('@gmail.com'):
                break
            else:
                print("Please enter a valid Gmail address.")
        else:
            print("Please enter a valid email address.")
    
    print()
    print("Next, you need to generate an App Password:")
    print("1. Go to your Google Account settings")
    print("2. Enable 2-Factor Authentication if not already enabled")
    print("3. Go to Security > App passwords")
    print("4. Generate a new app password for 'Mail'")
    print("5. Copy the 16-character password")
    print()
    
    # Get app password
    while True:
        app_password = input("Enter your Gmail App Password (16 characters): ").strip()
        if len(app_password) == 16 and app_password.isalnum():
            break
        else:
            print("App password should be exactly 16 alphanumeric characters.")
    
    # Update .env file
    env_file = 'dotenv.env'
    env_content = ""
    
    # Read existing .env file
    if os.path.exists(env_file):
        with open(env_file, 'r') as f:
            env_content = f.read()
    
    # Update or add email settings
    lines = env_content.split('\n')
    updated_lines = []
    email_updated = False
    password_updated = False
    
    for line in lines:
        if line.startswith('SENDER_EMAIL='):
            updated_lines.append(f'SENDER_EMAIL={email}')
            email_updated = True
        elif line.startswith('SENDER_PASSWORD='):
            updated_lines.append(f'SENDER_PASSWORD={app_password}')
            password_updated = True
        else:
            updated_lines.append(line)
    
    # Add if not found
    if not email_updated:
        updated_lines.append(f'SENDER_EMAIL={email}')
    if not password_updated:
        updated_lines.append(f'SENDER_PASSWORD={app_password}')
    
    # Write back to .env file
    with open(env_file, 'w') as f:
        f.write('\n'.join(updated_lines))
    
    print()
    print("=" * 60)
    print("Configuration Complete!")
    print("=" * 60)
    print(f"Email: {email}")
    print("App Password: " + "*" * 16)
    print()
    print("Your email configuration has been saved to dotenv.env")
    print("You can now use OTP authentication in your ART&BAY application.")
    print()
    print("To test the configuration:")
    print("1. Start your Flask application")
    print("2. Go to the login page")
    print("3. Choose 'Login with OTP'")
    print("4. Enter your email and check for the OTP email")
    print()

if __name__ == "__main__":
    setup_email_config() 