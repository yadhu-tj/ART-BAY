import os
import mysql.connector
from dotenv import load_dotenv

# Load env same as app
load_dotenv('dotenv.env')

def get_db_config():
    return {
        'host': os.getenv('DB_HOST', 'localhost'),
        'user': os.getenv('DB_USER', 'root'),
        'password': os.getenv('DB_PASSWORD', ''),
        'database': os.getenv('DB_NAME', 'online_art_gallery_database_final')
    }

def diagnose():
    print("\n=== DIRECT DIAGNOSTIC START ===")
    config = get_db_config()
    print(f"Connecting to {config['database']} on {config['host']} as {config['user']}...")
    
    conn = None
    try:
        conn = mysql.connector.connect(**config)
        cursor = conn.cursor(dictionary=True)
        
        # 1. Check Table Schema
        print("\n1. Checking 'artists' table schema:")
        try:
            cursor.execute("DESCRIBE artists")
            columns = cursor.fetchall()
            found_approved = False
            for col in columns:
                print(f"   - {col['Field']}: {col['Type']} (Default: {col['Default']})")
                if col['Field'] == 'approved':
                    found_approved = True
            
            if not found_approved:
                print("   [CRITICAL] 'approved' column MISSING!")
            else:
                print("   [OK] 'approved' column exists.")
        except mysql.connector.Error as e:
            print(f"   [ERROR] Could not describe artists: {e}")

        # 2. Check Row Count
        print("\n2. Checking Content:")
        try:
            cursor.execute("SELECT * FROM artists")
            rows = cursor.fetchall()
            print(f"   Total rows: {len(rows)}")
            for row in rows:
                print(f"   - Email: {row.get('email')}, Approved: {row.get('approved')}, Created: {row.get('created_at')}")
                
            # Count pending explicitly
            pending = sum(1 for r in rows if r .get('approved') == 0)
            print(f"   Calculated Pending (approved=0): {pending}")
            
        except mysql.connector.Error as e:
             print(f"   [ERROR] Could not select from artists: {e}")

    except mysql.connector.Error as e:
        print(f"\n[FATAL] Connection failed: {e}")
    finally:
        if conn and conn.is_connected():
            conn.close()
            print("\nConnection closed.")

if __name__ == "__main__":
    diagnose()
