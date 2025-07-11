# models/artist_queries.py
from flask import current_app
import mysql.connector

def get_db_connection():
    """Get a connection from the app's database pool."""
    try:
        if not hasattr(current_app, 'db_pool') or current_app.db_pool is None:
            current_app.logger.critical("❌ Database pool not initialized")
            return None
        conn = current_app.db_pool.get_connection()
        current_app.logger.info("✅ Retrieved connection from pool")
        return conn
    except mysql.connector.Error as e:
        current_app.logger.critical(f"❌ Failed to get connection from pool: {str(e)}")
        return None

def add_artist(email, bio, profile_pic=None):
    """Add artist to the 'artists' table."""
    conn = get_db_connection()
    if not conn:
        current_app.logger.error("❌ ERROR: Database connection is None")
        return {'error': 'Database connection failed'}

    cursor = conn.cursor()
    try:
        current_app.logger.info(f"📌 Adding artist with email {email} to 'artists' table...")
        query = "INSERT INTO artists (email, bio, profile_pic) VALUES (%s, %s, %s)"
        cursor.execute(query, (email, bio, profile_pic))
        conn.commit()
        current_app.logger.info("✅ Artist added successfully!")
        return {'message': 'Artist created successfully'}
    except mysql.connector.Error as e:
        current_app.logger.error(f"🔥 ERROR while inserting artist: {str(e)}")
        return {'error': str(e)}
    finally:
        cursor.close()
        conn.close()  # Return connection to pool

def get_artist_by_email(email):
    """Retrieve artist details by email from the 'artists' table."""
    conn = get_db_connection()
    if not conn:
        current_app.logger.error("❌ ERROR: Database connection is None")
        return None

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM artists WHERE email = %s", (email,))
        artist = cursor.fetchone()
        if artist:
            current_app.logger.info(f"✅ Artist found for email {email}")
        return artist
    except mysql.connector.Error as e:
        current_app.logger.error(f"🔥 ERROR while fetching artist: {str(e)}")
        return None
    finally:
        cursor.close()
        conn.close()  # Return connection to pool

def get_all_artists():
    """Fetch all artists from the 'artists' table."""
    conn = get_db_connection()
    if not conn:
        current_app.logger.error("❌ ERROR: Database connection is None")
        return {'error': 'Database connection failed'}

    cursor = conn.cursor(dictionary=True)
    try:
        current_app.logger.info("📤 Fetching all artists from 'artists' table...")
        cursor.execute("SELECT * FROM artists")
        artists = cursor.fetchall()
        current_app.logger.info(f"✅ Retrieved {len(artists)} artists from the database.")
        return artists
    except mysql.connector.Error as e:
        current_app.logger.error(f"🔥 ERROR while fetching artists: {str(e)}")
        return {'error': str(e)}
    finally:
        cursor.close()
        conn.close()  # Return connection to pool