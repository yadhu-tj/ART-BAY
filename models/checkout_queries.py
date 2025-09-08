import logging
from mysql.connector import Error
from .database import get_db_connection

logger = logging.getLogger(__name__)

def add_shipping_info(email, name, address, city, zipcode, country, phone="N/A"):
    """Adds shipping information for a user and returns the new ID."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        query = """
            INSERT INTO shipping_info (email, name, phone, address, city, zipcode, country)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (email, name, phone, address, city, zipcode, country))
        conn.commit()
        return cursor.lastrowid
    except Error as e:
        get_db_connection().rollback()
        logger.error(f"DB error in add_shipping_info: {e}")
        return None

def create_order_and_get_id(email, total_price):
    """Creates an order record and returns the new order_id."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        query = "INSERT INTO orders (email, total_price, order_status) VALUES (%s, %s, 'pending')"
        cursor.execute(query, (email, total_price))
        conn.commit()
        return cursor.lastrowid
    except Error as e:
        get_db_connection().rollback()
        logger.error(f"DB error in create_order_and_get_id: {e}")
        return None

def add_order_items(order_id, cart_items):
    """Adds items from the cart to the order_items table."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        query = """
            INSERT INTO order_items (order_id, art_id, quantity, price_at_purchase)
            VALUES (%s, %s, %s, %s)
        """
        item_data = [
            (order_id, item['art_id'], item['quantity'], item['price'])
            for item in cart_items
        ]
        cursor.executemany(query, item_data)
        conn.commit()
        return True
    except Error as e:
        get_db_connection().rollback()
        logger.error(f"DB error in add_order_items: {e}")
        return False