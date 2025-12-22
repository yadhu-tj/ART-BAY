#
import logging
from mysql.connector import Error
from .database import get_db_connection

logger = logging.getLogger(__name__)

def get_dashboard_metrics():
    """Fetches dashboard metrics."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        metrics = {'total_users': 0, 'total_artworks': 0, 'pending_artists': 0}
        
        # Get total users
        cursor.execute("SELECT COUNT(*) AS count FROM users")
        metrics['total_users'] = cursor.fetchone()['count']
        
        # Get total artworks
        cursor.execute("SELECT COUNT(*) AS count FROM art")
        metrics['total_artworks'] = cursor.fetchone()['count']
        
        # Ensure artists table exists to prevent crash
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS artists (
                email VARCHAR(100) PRIMARY KEY,
                bio TEXT,
                profile_pic VARCHAR(255),
                approved TINYINT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Get pending artists
        cursor.execute("""
            SELECT COUNT(*) AS count 
            FROM artists 
            WHERE approved = 0
        """)
        metrics['pending_artists'] = cursor.fetchone()['count']
        
        return metrics
    except Error as e:
        logger.error(f"DB error fetching metrics: {e}")
        return {'error': str(e)}

def get_users(search=''):
    """Fetches users with optional search."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        query = "SELECT email, name, role FROM users WHERE email LIKE %s OR name LIKE %s"
        cursor.execute(query, (f'%{search}%', f'%{search}%'))
        return cursor.fetchall()
    except Error as e:
        logger.error(f"DB error fetching users: {e}")
        return {'error': str(e)}

def update_user(email, name, role):
    """Updates a user's details."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        query = "UPDATE users SET name = %s, role = %s WHERE email = %s"
        cursor.execute(query, (name, role, email))
        conn.commit()
        return {'status': 'success'}
    except Error as e:
        conn.rollback()
        logger.error(f"DB error updating user: {e}")
        return {'error': str(e)}

def get_artworks(search=''):
    """Fetches artworks with optional search."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT a.art_id, a.title, a.price, u.name AS artist_name
            FROM art a LEFT JOIN users u ON a.email = u.email
            WHERE a.title LIKE %s OR u.name LIKE %s
        """
        cursor.execute(query, (f'%{search}%', f'%{search}%'))
        return cursor.fetchall()
    except Error as e:
        logger.error(f"DB error fetching artworks: {e}")
        return {'error': str(e)}
        
def update_artwork(art_id, title, price):
    """Updates artwork details."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE art SET title = %s, price = %s WHERE art_id = %s", (title, price, art_id))
        conn.commit()
        return {'status': 'success'}
    except Error as e:
        conn.rollback()
        logger.error(f"DB error updating artwork: {e}")
        return {'error': str(e)}

def delete_artwork(art_id):
    """Deletes an artwork."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM art WHERE art_id = %s", (art_id,))
        conn.commit()
        return {'status': 'success'}
    except Error as e:
        conn.rollback()
        logger.error(f"DB error deleting artwork: {e}")
        return {'error': str(e)}

def get_orders(search=''):
    """Fetches orders with optional search."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Check if orders table exists
        cursor.execute("SHOW TABLES LIKE 'orders'")
        if not cursor.fetchone():
            logger.warning("Orders table does not exist")
            return []
        
        # FIX: Changed 'total_amount' to 'total_price' and 'status' to 'order_status'
        query = """
            SELECT o.order_id, o.email, o.total_price, 
                   o.order_date, o.order_status
            FROM orders o 
            WHERE o.email LIKE %s
            ORDER BY o.order_date DESC
        """
        cursor.execute(query, (f'%{search}%',))
        return cursor.fetchall()
    except Error as e:
        logger.error(f"DB error fetching orders: {e}")
        return {'error': str(e)}

def get_order_details(order_id):
    """Fetches details for a single order."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # FIX: Changed 'total_amount' to 'total_price' and 'status' to 'order_status'
        cursor.execute("""
            SELECT order_id, email, total_price, order_date, order_status
            FROM orders 
            WHERE order_id = %s
        """, (order_id,))
        order = cursor.fetchone()
        
        if not order:
            return {'error': 'Order not found'}
        
        # Remap for frontend consistency if needed, or update frontend to use DB column names
        # For now, let's keep the keys consistent with what the frontend expects
        if 'total_price' in order:
            order['total_amount'] = order['total_price'] # Backwards compatibility for template
        if 'order_status' in order:
            order['status'] = order['order_status'] # Backwards compatibility for template

        # Get order items
        cursor.execute("""
            SELECT oi.quantity, oi.price_at_purchase, a.title 
            FROM order_items oi 
            JOIN art a ON oi.art_id = a.art_id 
            WHERE oi.order_id = %s
        """, (order_id,))
        order['items'] = cursor.fetchall()
        
        return order
    except Error as e:
        logger.error(f"DB error fetching order details: {e}")
        return {'error': str(e)}
    
#

def get_settings():
    """Fetches admin settings with defaults."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Ensure table exists first
        cursor.execute("SHOW TABLES LIKE 'settings'")
        if not cursor.fetchone():
            return {
                'artist_approval': '1',
                'platform_commission': '10',
                'base_shipping': '150',
                'maintenance_mode': '0'
            }
        
        cursor.execute("SELECT setting_key, setting_value FROM settings")
        settings = {}
        for row in cursor.fetchall():
            settings[row['setting_key']] = row['setting_value']
        
        # Merge with defaults to prevent crashes
        defaults = {
            'artist_approval': '1',
            'platform_commission': '10',
            'base_shipping': '150',
            'maintenance_mode': '0'
        }
        return {**defaults, **settings}
    except Error as e:
        logger.error(f"DB error fetching settings: {e}")
        return {}

def update_settings(settings_data):
    """Updates multiple admin settings at once."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Auto-create table if missing
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                setting_key VARCHAR(50) PRIMARY KEY,
                setting_value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        """)
        
        for key, value in settings_data.items():
            query = """
                INSERT INTO settings (setting_key, setting_value) 
                VALUES (%s, %s) 
                ON DUPLICATE KEY UPDATE setting_value = %s
            """
            cursor.execute(query, (key, str(value), str(value)))
        
        conn.commit()
        return {'status': 'success'}
    except Error as e:
        conn.rollback()
        logger.error(f"DB error updating settings: {e}")
        return {'error': str(e)}
    
def delete_user(email):
    """Deletes a user from the database by email."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM users WHERE email = %s", (email,))
        conn.commit()
        return {'status': 'success', 'message': 'User deleted successfully.'}
    except Error as e:
        conn.rollback()
        logger.error(f"DB error deleting user: {e}")
        return {'status': 'error', 'message': str(e)}

def get_pending_artists():
    """Fetches all users with role 'artist' who haven't been approved yet."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        query = """
            SELECT u.name, u.email, u.role, a.bio, a.created_at
            FROM users u
            JOIN artists a ON u.email = a.email
            WHERE a.approved = 0
        """
        cursor.execute(query)
        pending_artists = cursor.fetchall()
        
        # for artist in pending_artists:
        #     artist['bio'] = 'Artist application pending approval'
            
        return pending_artists
    except Error as e:
        logger.error(f"DB error in get_pending_artists: {e}")
        return {'error': str(e)}

def approve_artist(email):
    """Approves an artist by updating their role and adding them to artists table."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS artists (
                email VARCHAR(100) PRIMARY KEY,
                bio TEXT,
                profile_pic VARCHAR(255),
                approved TINYINT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        cursor.execute("""
            INSERT INTO artists (email, approved) 
            VALUES (%s, 1) 
            ON DUPLICATE KEY UPDATE approved = 1
        """, (email,))

        # ALSO update the user role to 'artist'
        cursor.execute("UPDATE users SET role = 'artist' WHERE email = %s", (email,))
        
        conn.commit()
        return {'status': 'success', 'message': 'Artist approved successfully.'}
    except Error as e:
        conn.rollback()
        logger.error(f"DB error approving artist: {e}")
        return {'status': 'error', 'message': str(e)}