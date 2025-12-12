import logging
from mysql.connector import Error
from werkzeug.security import generate_password_hash
from .database import get_db_connection

logger = logging.getLogger(__name__)

def add_user(name, email, password):
    """Adds a new user to the database, relying on DB constraints for uniqueness."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        hashed_password = generate_password_hash(password)
        query = "INSERT INTO users (name, email, password, role) VALUES (%s, %s, %s, 'user')"
        cursor.execute(query, (name, email, hashed_password))
        conn.commit()
        return {"message": "User added successfully"}
    except Error as e:
        get_db_connection().rollback()
        # Specifically check for the duplicate entry error code
        if e.errno == 1062:
            logger.warning(f"Attempted to add duplicate user: {email}")
            return {"error": "This email is already registered."}
        else:
            logger.error(f"DB error in add_user: {e}")
            return {"error": str(e)}

def get_user_by_email(email):
    """Retrieves a user by email."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        return cursor.fetchone()
    except Error as e:
        logger.error(f"DB error in get_user_by_email: {e}")
        return None

def upgrade_to_artist(email):
    """Updates a user's role to 'artist'."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        query = "UPDATE users SET role = 'artist' WHERE email = %s"
        cursor.execute(query, (email,))
        conn.commit()
        return {"message": "You are now an artist!"}
    except Error as e:
        get_db_connection().rollback()
        logger.error(f"DB error in upgrade_to_artist: {e}")
        return {"error": str(e)}