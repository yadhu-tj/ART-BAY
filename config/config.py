import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('dotenv.env')

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'fallback-secret-key')
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'static/uploads')  # For file uploads
    
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