import logging
from mysql.connector import Error
from .database import get_db_connection

logger = logging.getLogger(__name__)

def add_artist_profile(email, bio, profile_pic_filename):
    """Adds an artist's profile information."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        query = "INSERT INTO artists (email, bio, profile_pic) VALUES (%s, %s, %s)"
        cursor.execute(query, (email, bio, profile_pic_filename))
        conn.commit()
        return {"message": "Artist profile created."}
    except Error as e:
        get_db_connection().rollback()
        logger.error(f"DB error in add_artist_profile: {e}")
        return {"error": str(e)}

def get_artist_by_email(email):
    """Checks if an artist profile exists."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM artists WHERE email = %s", (email,))
        return cursor.fetchone()
    except Error as e:
        logger.error(f"DB error in get_artist_by_email: {e}")
        return None