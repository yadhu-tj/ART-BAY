import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('dotenv.env')

# Get the absolute path of the directory the config.py file is in
basedir = os.path.abspath(os.path.dirname(__file__))
# Go up one level to find the project's root directory
project_root = os.path.dirname(basedir)

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'fallback-secret-key')

    # --- THIS IS THE KEY CHANGE ---
    # This now creates a full, absolute path to your uploads folder
    UPLOAD_FOLDER = os.path.join(project_root, 'static', 'uploads')

    # Database configuration as a dictionary
    DB_CONFIG = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'user': os.getenv('DB_USER', 'root'),
        'password': os.getenv('DB_PASSWORD', ''),
        'database': os.getenv('DB_NAME', 'online_art_gallery_database_final')
    }

    # Email configuration
    SENDER_EMAIL = os.getenv('SENDER_EMAIL', 'your-email@gmail.com')
    SENDER_PASSWORD = os.getenv('SENDER_PASSWORD', 'your-app-password')