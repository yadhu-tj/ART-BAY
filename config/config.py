import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'fallback-secret-key')
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'static/uploads')  # For file uploads
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB file size limit

    # Database configuration as a dictionary
    DB_CONFIG = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'user': os.getenv('DB_USER', 'root'),
        'password': os.getenv('DB_PASSWORD', ''),
        'database': os.getenv('DB_NAME', 'online_art_gallery_database_final')
    }