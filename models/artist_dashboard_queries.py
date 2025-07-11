import logging
from mysql.connector import Error
from flask import current_app

logger = logging.getLogger(__name__)

def get_db_connection():
    """Get database connection from the pool"""
    if not hasattr(current_app, 'db_pool'):
        raise RuntimeError("Database pool not initialized")
    try:
        return current_app.db_pool.get_connection()
    except Error as e:
        logger.error(f"Error getting connection from pool: {str(e)}")
        raise

def get_dashboard_artworks(email, art_id=None):
    """Fetch artworks for an artist's dashboard, optionally by art_id."""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        if art_id:
            query = "SELECT * FROM art WHERE email = %s AND art_id = %s"
            cursor.execute(query, (email, art_id))
        else:
            query = "SELECT * FROM art WHERE email = %s"
            cursor.execute(query, (email,))
        result = cursor.fetchall()
        return result
    except Error as e:
        logger.error(f"Error fetching dashboard artworks: {str(e)}")
        raise
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()

def add_dashboard_artwork(email, title, description, price, category, image_path):
    """Add a new artwork to the dashboard."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        query = """
            INSERT INTO art (email, title, description, price, category, image_path)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (email, title, description, price, category, image_path))
        conn.commit()
    except Error as e:
        logger.error(f"Error adding dashboard artwork: {str(e)}")
        conn.rollback()
        raise
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()

def delete_dashboard_artwork(art_id):
    """Delete an artwork from the dashboard by its ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        query = "DELETE FROM art WHERE art_id = %s"
        cursor.execute(query, (art_id,))
        if cursor.rowcount == 0:
            logger.warning(f"No artwork found with art_id {art_id} to delete")
        conn.commit()
    except Error as e:
        logger.error(f"Error deleting artwork ID {art_id}: {str(e)}")
        conn.rollback()
        raise
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()

def update_dashboard_art_price(art_id, price):
    """Update the price of an artwork in the dashboard."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        query = "UPDATE art SET price = %s WHERE art_id = %s"
        cursor.execute(query, (price, art_id))
        if cursor.rowcount == 0:
            logger.warning(f"No artwork found with art_id {art_id} to update price")
        conn.commit()
    except Error as e:
        logger.error(f"Error updating price for art_id {art_id} to {price}: {str(e)}")
        conn.rollback()
        raise
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()