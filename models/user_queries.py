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

def update_user_profile(email, name=None, phone=None):
    """Updates user's name and/or phone."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        updates = []
        params = []
        
        if name:
            updates.append("name = %s")
            params.append(name)
        
        # Note: 'phone' column must exist in users table. 
        # If it doesn't, this part might fail if phone is provided. 
        # We assume checking was done or it exists.
        if phone:
            updates.append("phone = %s")
            params.append(phone)
            
        if not updates:
            return {"status": "success", "message": "No changes made."}
            
        sql = f"UPDATE users SET {', '.join(updates)} WHERE email = %s"
        params.append(email)
        
        cursor.execute(sql, tuple(params))
        conn.commit()
        
        return {"status": "success", "message": "Profile updated successfully."}
    except Error as e:
        get_db_connection().rollback()
        logger.error(f"DB error in update_user_profile: {e}")
        return {"status": "error", "message": str(e)}

def update_profile_pic(email, image_path):
    """Updates the user's profile picture."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        query = "UPDATE users SET profile_pic = %s WHERE email = %s"
        cursor.execute(query, (image_path, email))
        conn.commit()
        return {"status": "success", "message": "Profile picture updated!"}
    except Error as e:
        get_db_connection().rollback()
        logger.error(f"DB error in update_profile_pic: {e}")
        return {"status": "error", "message": str(e)}

def update_user_password(email, new_password_hash):
    """Updates the user's password."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        query = "UPDATE users SET password = %s WHERE email = %s"
        cursor.execute(query, (new_password_hash, email))
        conn.commit()
        return {"status": "success", "message": "Password updated successfully!"}
    except Error as e:
        get_db_connection().rollback()
        logger.error(f"DB error in update_user_password: {e}")
        return {"status": "error", "message": str(e)}

def get_user_orders_with_items(email):
    """Fetches user orders along with their artwork items."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        # Assuming 'created_at' exists in orders. If not, remove ORDER BY.
        # We need to left join just in case art was deleted, but usually inner join is fine if integrity maintained.
        sql = """
            SELECT o.order_id, o.total_price, o.order_status, o.order_date,
                   oi.art_id, oi.price_at_purchase,
                   a.title, a.image_path
            FROM orders o
            LEFT JOIN order_items oi ON o.order_id = oi.order_id
            LEFT JOIN art a ON oi.art_id = a.art_id
            WHERE o.email = %s
            ORDER BY o.order_id DESC
        """
        cursor.execute(sql, (email,))
        rows = cursor.fetchall()
        
        # Group by order_id
        orders = {}
        for row in rows:
            oid = row['order_id']
            if oid not in orders:
                orders[oid] = {
                    'order_id': oid,
                    'total_price': row['total_price'],
                    'status': row['order_status'],
                    'date': row.get('order_date'), # Fixed column name
                    'order_items': []
                }
            
            if row['art_id']: # If order has items
                orders[oid]['order_items'].append({
                    'title': row['title'],
                    'image': row['image_path'],
                    'price': row['price_at_purchase']
                })
                
        return list(orders.values())
    except Error as e:
        logger.error(f"DB error in get_user_orders_with_items: {e}")
        return []

def get_user_addresses(email):
    """Fetches saved shipping addresses for the user."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        sql = "SELECT * FROM shipping_info WHERE email = %s ORDER BY shipping_id DESC"
        cursor.execute(sql, (email,))
        return cursor.fetchall()
    except Error as e:
        logger.error(f"DB error in get_user_addresses: {e}")
        return []