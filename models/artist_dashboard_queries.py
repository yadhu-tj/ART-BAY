import logging
from mysql.connector import Error
from .database import get_db_connection

logger = logging.getLogger(__name__)

def get_artworks_by_artist(artist_email):
    """Fetches all artworks for a specific artist."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM art WHERE email = %s ORDER BY created_at DESC", (artist_email,))
        return cursor.fetchall()
    except Error as e:
        logger.error(f"DB error in get_artworks_by_artist: {e}")
        return {"error": str(e)}

def add_artwork(email, title, description, price, category, filename):
    """Adds a new piece of art for an artist."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        query = """
            INSERT INTO art (email, title, description, price, category, image_path)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (email, title, description, price, category, filename))
        conn.commit()
        return {"message": "Artwork added."}
    except Error as e:
        get_db_connection().rollback()
        logger.error(f"DB error in add_artwork: {e}")
        return {"error": str(e)}

def delete_artwork_for_artist(art_id, artist_email):
    """Deletes an artwork, ensuring ownership."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        query = "DELETE FROM art WHERE art_id = %s AND email = %s"
        cursor.execute(query, (art_id, artist_email))
        conn.commit()
        return cursor.rowcount > 0  # True if deleted
    except Error as e:
        get_db_connection().rollback()
        logger.error(f"DB error in delete_artwork_for_artist: {e}")
        return False

def update_artwork_price(art_id, artist_email, new_price):
    """Updates an artwork's price, ensuring ownership."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        query = "UPDATE art SET price = %s WHERE art_id = %s AND email = %s"
        cursor.execute(query, (new_price, art_id, artist_email))
        conn.commit()
        return cursor.rowcount > 0 # True if updated
    except Error as e:
        get_db_connection().rollback()
        logger.error(f"DB error in update_artwork_price: {e}")
        return False