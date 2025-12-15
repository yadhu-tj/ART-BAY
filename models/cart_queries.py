import logging
from mysql.connector import Error
from .database import get_db_connection

logger = logging.getLogger(__name__)

def add_to_cart(user_email, art_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT cart_id, quantity FROM cart WHERE email = %s AND art_id = %s", (user_email, art_id))
        existing = cursor.fetchone()
        if existing:
            cart_id, quantity = existing
            cursor.execute("UPDATE cart SET quantity = %s WHERE cart_id = %s", (quantity + 1, cart_id))
        else:
            cursor.execute("INSERT INTO cart (email, art_id, quantity) VALUES (%s, %s, 1)", (user_email, art_id))
        conn.commit()
        return {"message": "Item added to cart."}
    except Error as e:
        get_db_connection().rollback()
        logger.error(f"DB error in add_to_cart: {e}")
        return {"error": str(e)}

def get_cart_items(user_email):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT c.cart_id, a.art_id, a.title, a.image_path, a.price, c.quantity
            FROM cart c JOIN art a ON c.art_id = a.art_id
            WHERE c.email = %s
        """
        cursor.execute(query, (user_email,))
        return cursor.fetchall()
    except Error as e:
        logger.error(f"DB error in get_cart_items: {e}")
        return {"error": str(e)}

def remove_from_cart(cart_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM cart WHERE cart_id = %s", (cart_id,))
        conn.commit()
        return {"message": "Item removed from cart."}
    except Error as e:
        get_db_connection().rollback()
        logger.error(f"DB error in remove_from_cart: {e}")
        return {"error": str(e)}

def clear_cart(user_email):
    """Removes all items from a user's cart."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM cart WHERE email = %s", (user_email,))
        conn.commit()
        return {"message": "Cart cleared."}
    except Error as e:
        get_db_connection().rollback()
        logger.error(f"DB error in clear_cart: {e}")
        return {"error": str(e)}
    
    #

def update_cart_quantity(cart_id, new_quantity):
    """
    Updates the quantity of a cart item. 
    If quantity drops to 0 or less, it removes the item automatically.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Smart Logic: If quantity is 0, delete it. Otherwise, update it.
        if new_quantity <= 0:
            cursor.execute("DELETE FROM cart WHERE cart_id = %s", (cart_id,))
            message = "Item removed from cart."
        else:
            cursor.execute("UPDATE cart SET quantity = %s WHERE cart_id = %s", (new_quantity, cart_id))
            message = "Quantity updated."
            
        conn.commit()
        return {"status": "success", "message": message}
    except Error as e:
        get_db_connection().rollback()
        logger.error(f"DB error in update_cart_quantity: {e}")
        return {"status": "error", "message": str(e)}