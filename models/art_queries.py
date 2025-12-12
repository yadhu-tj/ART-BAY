import logging
from mysql.connector import Error
from .database import get_db_connection

logger = logging.getLogger(__name__)

def add_art(email, title, description, price, category, image_path):
    """Adds a new artwork to the database."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        sql = """INSERT INTO art (email, title, description, price, category, image_path)
                 VALUES (%s, %s, %s, %s, %s, %s)"""
        cursor.execute(sql, (email, title, description, price, category, image_path))
        conn.commit()
        return {"status": "success", "message": "Artwork added successfully!"}
    except Error as e:
        get_db_connection().rollback()
        logger.error(f"DB Error in add_art: {e}")
        return {"status": "error", "message": str(e)}

def delete_artwork(art_id):
    """Deletes an artwork by its ID."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM art WHERE art_id = %s", (art_id,))
        conn.commit()
        return {"status": "success", "message": "Artwork deleted successfully"}
    except Error as e:
        get_db_connection().rollback()
        logger.error(f"DB Error in delete_artwork: {e}")
        return {"status": "error", "message": str(e)}

def get_all_artworks():
    """Fetches all artworks with artist names."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT a.*, u.name as artist_name FROM art a
            JOIN users u ON a.email = u.email ORDER BY a.created_at DESC
        """
        cursor.execute(query)
        return cursor.fetchall()
    except Error as e:
        logger.error(f"DB error in get_all_artworks: {e}")
        return {"error": str(e)}

def get_art_by_id(art_id):
    """Fetches a single artwork by its ID."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM art WHERE art_id = %s", (art_id,))
        return cursor.fetchone()
    except Error as e:
        logger.error(f"DB error in get_art_by_id: {e}")
        return {"error": str(e)}

def get_filtered_artworks(filters):
    """Fetches artworks with dynamic search, filter, and sort options."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        sql = "SELECT a.*, u.name AS artist_name FROM art a JOIN users u ON a.email = u.email WHERE 1=1"
        params = []

        if filters.get('search'):
            sql += " AND (a.title LIKE %s OR a.description LIKE %s)"
            like_term = f"%{filters['search']}%"
            params.extend([like_term, like_term])
        
        # Add other filters for category, price etc. here if needed

        sql += " ORDER BY a.created_at " + ("ASC" if filters.get('sort') == 'oldest' else "DESC")

        cursor.execute(sql, params)
        return {"artworks": cursor.fetchall()}
    except Error as e:
        logger.error(f"DB error in get_filtered_artworks: {e}")
        return {"error": str(e)}