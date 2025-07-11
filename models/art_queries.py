import mysql.connector
from mysql.connector import Error
from flask import url_for

def get_db_connection():
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="",
            database="online_art_gallery_database_final"
        )
        return conn
    except Error as e:
        print(f"Database connection error: {e}")
        return None

def get_all_artworks():
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor(dictionary=True)
            sql = """
                SELECT 
                    art.art_id,  -- Changed from 'AS id' to just 'art_id'
                    art.title,
                    art.description,
                    art.price,
                    art.category,
                    art.image_path,
                    art.created_at AS date_added,
                    users.name AS artist
                FROM art
                JOIN artists ON art.email = artists.email
                JOIN users ON artists.email = users.email
                ORDER BY art.created_at DESC
            """
            cursor.execute(sql)
            artworks = cursor.fetchall()

            for artwork in artworks:
                if artwork["image_path"]:
                    artwork["image_path"] = url_for("static", filename=f"uploads/{artwork['image_path']}", _external=True)

            return artworks
        except Error as e:
            return []
        finally:
            cursor.close()
            conn.close()
    return []

# Other functions unchanged
def add_art(email, title, description, price, category, image_path):
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            sql = """INSERT INTO art (email, title, description, price, category, image_path)
                     VALUES (%s, %s, %s, %s, %s, %s)"""
            cursor.execute(sql, (email, title, description, price, category, image_path))
            conn.commit()
            return {"status": "success", "message": "Artwork added successfully!"}
        except Error as e:
            return {"status": "error", "message": str(e)}
        finally:
            cursor.close()
            conn.close()
    return {"status": "error", "message": "Database connection failed"}

def get_art_by_id(art_id):
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT * FROM art WHERE art_id = %s", (art_id,))
            artwork = cursor.fetchone()
            if artwork and artwork["image_path"]:
                artwork["image_path"] = url_for("static", filename=f"uploads/{artwork['image_path']}", _external=True)
            return artwork if artwork else {"status": "error", "message": "Artwork not found"}
        except Error as e:
            return {"status": "error", "message": str(e)}
        finally:
            cursor.close()
            conn.close()
    return {"status": "error", "message": "Database connection failed"}

def delete_artwork(art_id):
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM art WHERE art_id = %s", (art_id,))
            conn.commit()
            return {"status": "success", "message": "Artwork deleted successfully"}
        except Error as e:
            return {"status": "error", "message": str(e)}
        finally:
            cursor.close()
            conn.close()
    return {"status": "error", "message": "Database connection failed"}