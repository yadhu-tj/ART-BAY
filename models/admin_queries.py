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
        
        # Get pending artists (users with role 'artist' but not approved)
        cursor.execute("""
            SELECT COUNT(*) AS count 
            FROM users 
            WHERE role = 'artist' AND email NOT IN (
                SELECT email FROM artists WHERE approved = 1
            )
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
        
        query = """
            SELECT o.order_id, o.email, o.total_amount as total_price, 
                   o.order_date, o.status as order_status
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
        
        # Get order information
        cursor.execute("""
            SELECT order_id, email, total_amount, order_date, status
            FROM orders 
            WHERE order_id = %s
        """, (order_id,))
        order = cursor.fetchone()
        
        if not order:
            return {'error': 'Order not found'}
        
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
    
def get_settings():
    """Fetches admin settings."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Check if settings table exists
        cursor.execute("SHOW TABLES LIKE 'settings'")
        if not cursor.fetchone():
            # Return default settings if table doesn't exist
            return {'artist_approval_required': True}
        
        cursor.execute("SELECT setting_key, setting_value FROM settings")
        settings = {}
        for row in cursor.fetchall():
            settings[row['setting_key']] = row['setting_value']
        
        # Set defaults if not found
        if 'artist_approval_required' not in settings:
            settings['artist_approval_required'] = True
            
        return settings
    except Error as e:
        logger.error(f"DB error fetching settings: {e}")
        return {'artist_approval_required': True}

def update_settings(settings_data):
    """Updates admin settings."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Create settings table if it doesn't exist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                setting_key VARCHAR(50) PRIMARY KEY,
                setting_value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        """)
        
        # Update settings
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
        # The ON DELETE CASCADE in your database will handle related records.
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
        
        # Get users with role 'artist' who are not in the approved artists list
        query = """
            SELECT u.name, u.email, u.role
            FROM users u
            WHERE u.role = 'artist' 
            AND u.email NOT IN (
                SELECT email FROM artists WHERE approved = 1
            )
        """
        cursor.execute(query)
        pending_artists = cursor.fetchall()
        
        # Add bio field (empty for now since it's not in users table)
        for artist in pending_artists:
            artist['bio'] = 'Artist application pending approval'
            
        return pending_artists
    except Error as e:
        logger.error(f"DB error in get_pending_artists: {e}")
        return {'error': str(e)}

def approve_artist(email):
    """Approves an artist by updating their role and adding them to artists table."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # First, ensure the artists table exists
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS artists (
                email VARCHAR(100) PRIMARY KEY,
                bio TEXT,
                profile_pic VARCHAR(255),
                approved TINYINT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Add artist to artists table with approved status
        cursor.execute("""
            INSERT INTO artists (email, approved) 
            VALUES (%s, 1) 
            ON DUPLICATE KEY UPDATE approved = 1
        """, (email,))
        
        conn.commit()
        return {'status': 'success', 'message': 'Artist approved successfully.'}
    except Error as e:
        conn.rollback()
        logger.error(f"DB error approving artist: {e}")
        return {'status': 'error', 'message': str(e)}