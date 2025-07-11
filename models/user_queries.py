import mysql.connector
from mysql.connector import pooling
from werkzeug.security import generate_password_hash, check_password_hash
from flask import current_app

# Database connection pool
db_pool = None

def init_db_connection(app=None):
    """
    Initialize the database connection pool.
    """
    global db_pool
    try:
        if app is None:
            return

        db_config = {
            'host': app.config.get('DB_HOST', 'localhost'),
            'user': app.config.get('DB_USER', 'root'),
            'password': app.config.get('DB_PASSWORD', ''),
            'database': app.config.get('DB_NAME', 'online_art_gallery_database_final'),
            'pool_name': 'mypool',
            'pool_size': 5,
            'autocommit': True,
        }

        db_pool = pooling.MySQLConnectionPool(**db_config)
        current_app.logger.info("Database connection pool initialized successfully")
    except Exception as e:
        if app:
            current_app.logger.error(f"Database connection pool initialization failed: {str(e)}")
        raise RuntimeError(f"Failed to initialize database connection pool: {str(e)}")

def get_db_connection():
    """
    Get a database connection from the pool.
    """
    if db_pool is None:
        from flask import current_app
        with current_app.app_context():
            init_db_connection(current_app)
    return db_pool.get_connection()

def add_user(name, email, password):
    """
    Add a new user to the database with a hashed password and default role as 'user'.
    """
    connection = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Check if email already exists
        if email_exists(email, cursor):
            return {"error": "This email is already registered."}

        # Hash the password
        hashed_password = generate_password_hash(password, method='pbkdf2:sha256')

        # Insert new user with role as 'user'
        query = "INSERT INTO users (name, email, password, role) VALUES (%s, %s, %s, 'user')"
        cursor.execute(query, (name, email, hashed_password))
        connection.commit()

        current_app.logger.info(f"New user added: {name}, {email}, role=user")
        return {"message": "User added successfully"}
    except mysql.connector.Error as e:
        current_app.logger.error(f"Database error during add_user: {str(e)}")
        if connection:
            connection.rollback()
        return {"error": str(e)}
    except Exception as e:
        current_app.logger.error(f"Unexpected error during add_user: {str(e)}")
        if connection:
            connection.rollback()
        return {"error": str(e)}
    finally:
        if connection:
            connection.close()

def email_exists(email, cursor=None):
    """
    Check if an email already exists in the users table.
    """
    connection = None
    try:
        if not cursor:
            connection = get_db_connection()
            cursor = connection.cursor(dictionary=True)

        query = "SELECT COUNT(*) FROM users WHERE email = %s"
        cursor.execute(query, (email,))
        count = cursor.fetchone()['COUNT(*)']
        return count > 0
    except mysql.connector.Error as e:
        current_app.logger.error(f"Database error during email_exists: {str(e)}")
        return {"error": str(e)}
    except Exception as e:
        current_app.logger.error(f"Unexpected error during email_exists: {str(e)}")
        return {"error": str(e)}
    finally:
        if not cursor and connection:
            connection.close()

def get_user_by_email(email):
    """
    Retrieve a user by email.
    """
    connection = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        query = "SELECT * FROM users WHERE email = %s"
        cursor.execute(query, (email,))
        user = cursor.fetchone()

        if user:
            current_app.logger.info(f"Retrieved user: {user['email']}")
        else:
            current_app.logger.warning(f"No user found with email: {email}")

        return user
    except mysql.connector.Error as e:
        current_app.logger.error(f"Database error during get_user_by_email: {str(e)}")
        return {"error": str(e)}
    except Exception as e:
        current_app.logger.error(f"Unexpected error during get_user_by_email: {str(e)}")
        return {"error": str(e)}
    finally:
        if connection:
            connection.close()

def upgrade_to_artist(email):
    """
    Update the role of a user to 'artist' when they choose to upgrade.
    """
    connection = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        query = "UPDATE users SET role = 'artist' WHERE email = %s"
        cursor.execute(query, (email,))
        connection.commit()

        current_app.logger.info(f"User upgraded to artist: {email}")
        return {"message": "You are now an artist!"}
    except mysql.connector.Error as e:
        current_app.logger.error(f"Database error during upgrade_to_artist: {str(e)}")
        if connection:
            connection.rollback()
        return {"error": str(e)}
    except Exception as e:
        current_app.logger.error(f"Unexpected error during upgrade_to_artist: {str(e)}")
        if connection:
            connection.rollback()
        return {"error": str(e)}
    finally:
        if connection:
            connection.close()

def close_db():
    """Close the database connection pool."""
    global db_pool
    if db_pool:
        db_pool = None
        current_app.logger.info("Database connection pool closed successfully")

import atexit
atexit.register(close_db)