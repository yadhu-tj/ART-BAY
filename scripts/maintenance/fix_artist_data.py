import os
import mysql.connector
from dotenv import load_dotenv

load_dotenv('dotenv.env')

def get_db_config():
    return {
        'host': os.getenv('DB_HOST', 'localhost'),
        'user': os.getenv('DB_USER', 'root'),
        'password': os.getenv('DB_PASSWORD', ''),
        'database': os.getenv('DB_NAME', 'online_art_gallery_database_final')
    }

def fix_data():
    print("\n=== FIXING ARTIST DATA (ROBUST) ===")
    config = get_db_config()
    conn = None
    try:
        conn = mysql.connector.connect(**config)
        cursor = conn.cursor(dictionary=True)
        
        # 1. Add created_at if missing
        print("1. Checking 'created_at' column...")
        try:
            cursor.execute("SELECT created_at FROM artists LIMIT 1")
            cursor.fetchall()
            print("   [OK] Column exists.")
        except:
            print("   [MISSING] Adding 'created_at' column...")
            try:
                cursor.execute("ALTER TABLE artists ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
                print("   [OK] Column added.")
            except Exception as e:
                print(f"   [ERROR] Failed to add column: {e}")

        # 2. Fix Default Value of approved
        print("2. Altering 'artists' table default value to 0...")
        try:
            cursor.execute("ALTER TABLE artists ALTER COLUMN approved SET DEFAULT 0")
            print("   [OK] Default set to 0.")
        except Exception as e:
            print(f"   [ERROR] Alter failed: {e}")
            
        # 3. Reset one artist to pending
        print("3. Resetting an artist to Pending...")
        # Just pick any artist with approved=1
        cursor.execute("SELECT email FROM artists WHERE approved = 1 LIMIT 1")
        target = cursor.fetchone()
        
        if target:
            print(f"   Targeting: {target['email']}")
            cursor.execute("UPDATE artists SET approved = 0 WHERE email = %s", (target['email'],))
            conn.commit()
            print("   [OK] Status updated to 0 (Pending).")
        else:
            print("   No approved artists found to reset (maybe all are already 0?).")

    except Exception as e:
        print(f"\n[FATAL] {e}")
    finally:
        if conn and conn.is_connected():
            conn.close()

if __name__ == "__main__":
    fix_data()
