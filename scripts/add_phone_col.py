import sys
import os
import mysql.connector
from mysql.connector import Error

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.config import Config

def add_phone_column():
    conn = None
    try:
        print("Connecting to database...")
        conn = mysql.connector.connect(**Config.DB_CONFIG)
        cursor = conn.cursor()
        
        # Check if column exists first
        print("Checking if column 'phone' exists...")
        cursor.execute("SHOW COLUMNS FROM users LIKE 'phone'")
        result = cursor.fetchone()
        
        if result:
            print("Column 'phone' already exists.")
        else:
            print("Adding 'phone' column to users table...")
            cursor.execute("ALTER TABLE users ADD COLUMN phone VARCHAR(20) DEFAULT NULL")
            conn.commit()
            print("Success! Column added.")
            
    except Error as e:
        print(f"Error: {e}")
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()
            print("Connection closed.")

if __name__ == "__main__":
    add_phone_column()
