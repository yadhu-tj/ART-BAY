import sys
import os
import mysql.connector
from mysql.connector import Error

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.config import Config

def add_profile_column():
    conn = None
    cursor = None
    try:
        print("Connecting to database...")
        conn = mysql.connector.connect(**Config.DB_CONFIG)
        cursor = conn.cursor()
        
        # Check if column exists first to avoid errors
        print("Checking if column exists...")
        cursor.execute("SHOW COLUMNS FROM users LIKE 'profile_pic'")
        result = cursor.fetchone()
        
        if result:
            print("Column 'profile_pic' already exists.")
        else:
            print("Adding 'profile_pic' column to users table...")
            cursor.execute("ALTER TABLE users ADD COLUMN profile_pic VARCHAR(255) DEFAULT NULL")
            conn.commit()
            print("Success! Column added.")
            
    except Error as e:
        print(f"Error: {e}")
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()
            print("Connection closed.")

if __name__ == "__main__":
    add_profile_column()
