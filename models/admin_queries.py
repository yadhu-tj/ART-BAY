from flask import current_app
from mysql.connector import pooling, Error

def get_db_connection():
    """Get a database connection from the pool."""
    try:
        return current_app.db_pool.get_connection()
    except Error as e:
        current_app.logger.error(f"Failed to get DB connection: {str(e)}")
        raise

def table_exists(cursor, table_name):
    """Check if a table exists in the database."""
    try:
        cursor.execute("SHOW TABLES LIKE %s", (table_name,))
        return cursor.fetchone() is not None
    except Error as e:
        current_app.logger.error(f"Error checking table {table_name}: {str(e)}")
        return False

def column_exists(cursor, table_name, column_name):
    """Check if a column exists in a table."""
    try:
        cursor.execute("SHOW COLUMNS FROM `%s` LIKE %s", (table_name, column_name))
        return cursor.fetchone() is not None
    except Error as e:
        current_app.logger.error(f"Error checking column {column_name} in {table_name}: {str(e)}")
        return False

def get_dashboard_metrics():
    """Fetch dashboard metrics (users, artworks, pending artists)."""
    connection = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        metrics = {
            'total_users': 0,
            'total_artworks': 0,
            'pending_artists': 0
        }
        
        # Check table existence
        if not table_exists(cursor, 'users'):
            return {'error': 'Users table not found'}
        if not table_exists(cursor, 'art'):
            return {'error': 'Art table not found'}
        if not table_exists(cursor, 'artists'):
            return {'error': 'Artists table not found'}
        
        # Total users
        cursor.execute("SELECT COUNT(*) AS count FROM users")
        metrics['total_users'] = cursor.fetchone()['count']
        
        # Total artworks
        cursor.execute("SELECT COUNT(*) AS count FROM art")
        metrics['total_artworks'] = cursor.fetchone()['count']
        
        # Pending artists
        if column_exists(cursor, 'artists', 'approved'):
            cursor.execute("SELECT COUNT(*) AS count FROM artists WHERE approved = 0")
            metrics['pending_artists'] = cursor.fetchone()['count']
        else:
            current_app.logger.warning("No 'approved' column in artists table, setting pending_artists to 0")
            metrics['pending_artists'] = 0
        
        return metrics
    except Error as e:
        current_app.logger.error(f"Error fetching dashboard metrics: {str(e)}")
        return {'error': str(e)}
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

def get_users(search=''):
    """Fetch users with optional search by email or name."""
    connection = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        if not table_exists(cursor, 'users'):
            return {'error': 'Users table not found'}
        
        query = """
            SELECT email, name, role 
            FROM users 
            WHERE email LIKE %s OR name LIKE %s
        """
        search_term = f'%{search}%'
        cursor.execute(query, (search_term, search_term))
        users = cursor.fetchall()
        return users if users else []
    except Error as e:
        current_app.logger.error(f"Error fetching users: {str(e)}")
        return {'error': str(e)}
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

def update_user(email, name, role):
    """Update user information."""
    connection = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Check if user exists
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        if not user:
            return {'error': 'User not found'}
        
        # Update the user
        query = "UPDATE users SET name = %s, role = %s WHERE email = %s"
        cursor.execute(query, (name, role, email))
        connection.commit()
        
        return {'status': 'success', 'message': 'User updated successfully'}
    except Error as e:
        current_app.logger.error(f"Error updating user: {str(e)}")
        if connection:
            connection.rollback()
        return {'error': str(e)}
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

def get_artworks(search=''):
    """Fetch artworks with optional search by title or artist name."""
    connection = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        if not table_exists(cursor, 'art') or not table_exists(cursor, 'users'):
            return {'error': 'Art or users table not found'}
        
        query = """
            SELECT a.art_id, a.title, a.price, u.name AS artist
            FROM art a
            LEFT JOIN users u ON a.email = u.email
            WHERE a.title LIKE %s OR u.name LIKE %s
        """
        search_term = f'%{search}%'
        cursor.execute(query, (search_term, search_term))
        artworks = cursor.fetchall()
        return artworks if artworks else []
    except Error as e:
        current_app.logger.error(f"Error fetching artworks: {str(e)}")
        return {'error': str(e)}
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

def update_artwork(art_id, title, price):
    """Update artwork title and price."""
    connection = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        if not table_exists(cursor, 'art'):
            return {'error': 'Art table not found'}
        
        query = "UPDATE art SET title = %s, price = %s WHERE art_id = %s"
        cursor.execute(query, (title, price, art_id))
        connection.commit()
        
        if cursor.rowcount == 0:
            return {'error': 'Artwork not found'}
        
        current_app.logger.info(f"Updated artwork: art_id={art_id}, title={title}, price={price}")
        return {'message': 'Artwork updated successfully'}
    except Error as e:
        current_app.logger.error(f"Error updating artwork: {str(e)}")
        if connection:
            connection.rollback()
        return {'error': str(e)}
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

def delete_artwork(art_id):
    """Delete an artwork."""
    connection = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        if not table_exists(cursor, 'art'):
            return {'error': 'Art table not found'}
        
        query = "DELETE FROM art WHERE art_id = %s"
        cursor.execute(query, (art_id,))
        connection.commit()
        
        if cursor.rowcount == 0:
            return {'error': 'Artwork not found'}
        
        current_app.logger.info(f"Deleted artwork: art_id={art_id}")
        return {'message': 'Artwork deleted successfully'}
    except Error as e:
        current_app.logger.error(f"Error deleting artwork: {str(e)}")
        if connection:
            connection.rollback()
        return {'error': str(e)}
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

def get_orders(search=''):
    """Fetch orders with optional search by email."""
    connection = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        if not table_exists(cursor, 'orders'):
            return {'error': 'Orders table not found'}
        
        query = """
            SELECT order_id, email, total_price, order_status
            FROM orders
            WHERE email LIKE %s
        """
        search_term = f'%{search}%'
        cursor.execute(query, (search_term,))
        orders = cursor.fetchall()
        return orders if orders else []
    except Error as e:
        current_app.logger.error(f"Error fetching orders: {str(e)}")
        return {'error': str(e)}
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

def get_order_details(order_id):
    """Fetch details for a specific order."""
    connection = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        if not table_exists(cursor, 'orders'):
            return {'error': 'Orders table not found'}
        
        # Fetch order info
        query = """
            SELECT order_id, email, total_price, order_status
            FROM orders
            WHERE order_id = %s
        """
        cursor.execute(query, (order_id,))
        order = cursor.fetchone()
        
        if not order:
            return {'error': 'Order not found'}
        
        # Fetch order items (assuming order_items table exists)
        items_query = """
            SELECT a.title, a.price
            FROM order_items oi
            JOIN art a ON oi.art_id = a.art_id
            WHERE oi.order_id = %s
        """
        cursor.execute(items_query, (order_id,))
        order['items'] = cursor.fetchall()
        
        return order
    except Error as e:
        current_app.logger.error(f"Error fetching order details: {str(e)}")
        return {'error': str(e)}
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

def get_settings():
    """Fetch admin settings."""
    connection = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        if not table_exists(cursor, 'settings'):
            current_app.logger.warning("Settings table not found, returning default settings")
            return {'artist_approval': '1'}
        
        cursor.execute("SELECT setting_key, setting_value FROM settings WHERE setting_key = %s", ('artist_approval',))
        result = cursor.fetchone()
        return {'artist_approval': result['setting_value'] if result else '1'}
    except Error as e:
        current_app.logger.error(f"Error fetching settings: {str(e)}")
        return {'error': str(e)}
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

def update_settings(settings):
    """Update admin settings."""
    connection = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        if not table_exists(cursor, 'settings'):
            cursor.execute("""
                CREATE TABLE settings (
                    setting_key VARCHAR(50) PRIMARY KEY,
                    setting_value VARCHAR(255) NOT NULL
                )
            """)
            connection.commit()
        
        query = """
            INSERT INTO settings (setting_key, setting_value)
            VALUES (%s, %s)
            ON DUPLICATE KEY UPDATE setting_value = %s
        """
        cursor.execute(query, ('artist_approval', settings['artist_approval'], settings['artist_approval']))
        connection.commit()
        
        current_app.logger.info(f"Updated settings: {settings}")
        return {'message': 'Settings updated successfully'}
    except Error as e:
        current_app.logger.error(f"Error updating settings: {str(e)}")
        if connection:
            connection.rollback()
        return {'error': str(e)}
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()


def delete_user(email):
    """Delete a user by email"""
    connection = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Check if user exists
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        if not user:
            return {'error': 'User not found'}
        
        # Delete the user
        cursor.execute("DELETE FROM users WHERE email = %s", (email,))
        connection.commit()
        
        return {'status': 'success', 'message': 'User deleted successfully'}
    except Error as e:
        current_app.logger.error(f"Error deleting user: {str(e)}")
        if connection:
            connection.rollback()
        return {'error': str(e)}
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()