import mysql.connector
from models.user_queries import get_db_connection

def add_to_cart(user_email, art_id):
    """Adds an artwork to the user's cart, updates quantity if already exists."""
    connection = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # Check if item already exists
        query_check = "SELECT cart_id, quantity FROM cart WHERE email = %s AND art_id = %s"
        cursor.execute(query_check, (user_email, art_id))
        existing = cursor.fetchone()

        if existing:
            cart_id, quantity = existing
            query_update = "UPDATE cart SET quantity = %s WHERE cart_id = %s"
            cursor.execute(query_update, (quantity + 1, cart_id))
        else:
            query_insert = "INSERT INTO cart (email, art_id) VALUES (%s, %s)"
            cursor.execute(query_insert, (user_email, art_id))

        connection.commit()
        return {"message": "Artwork added to cart successfully"}
    except mysql.connector.Error as e:
        if connection:
            connection.rollback()
        return {"error": str(e)}
    except Exception as e:
        if connection:
            connection.rollback()
        return {"error": str(e)}
    finally:
        if connection:
            connection.close()

def get_cart_items(user_email):
    """Fetches all artworks in the user's cart."""
    connection = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        query = """
            SELECT c.cart_id, a.art_id, a.title, a.image_path, a.price, c.quantity 
            FROM cart c 
            JOIN art a ON c.art_id = a.art_id
            WHERE c.email = %s
        """
        cursor.execute(query, (user_email,))
        items = cursor.fetchall()

        return items
    except mysql.connector.Error as e:
        return {"error": str(e)}
    except Exception as e:
        return {"error": str(e)}
    finally:
        if connection:
            connection.close()

def remove_from_cart(cart_id):
    """Removes an item from the cart."""
    connection = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        query = "DELETE FROM cart WHERE cart_id = %s"
        cursor.execute(query, (cart_id,))
        connection.commit()

        return {"status": "success", "message": "Artwork removed from cart successfully"}
    except mysql.connector.Error as e:
        if connection:
            connection.rollback()
        return {"error": str(e)}
    except Exception as e:
        if connection:
            connection.rollback()
        return {"error": str(e)}
    finally:
        if connection:
            connection.close()