from app import create_app
from models.database import get_db_connection

def diagnose():
    app = create_app()
    with app.app_context():
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            print("\n=== DIAGNOSTIC START ===")
            
            # 1. Check Table Schema
            print("\n1. Checking 'artists' table schema:")
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

            # 2. Check Row Count
            print("\n2. Checking Row Counts:")
            cursor.execute("SELECT COUNT(*) as total FROM artists")
            total = cursor.fetchone()['total']
            
            cursor.execute("SELECT COUNT(*) as pending FROM artists WHERE approved = 0")
            pending = cursor.fetchone()['pending']
            
            print(f"   - Total Artists in table: {total}")
            print(f"   - Pending (approved=0): {pending}")
            
            # 3. Dump Data
            print("\n3. Dumping Data (First 5 rows):")
            cursor.execute("SELECT * FROM artists LIMIT 5")
            rows = cursor.fetchall()
            if not rows:
                print("   [Empty] No rows found.")
            for row in rows:
                print(f"   - {row}")

            print("\n=== DIAGNOSTIC END ===")
            
        except Exception as e:
            print(f"\n[ERROR] {e}")
        finally:
            if 'conn' in locals() and conn.is_connected():
                conn.close()

if __name__ == "__main__":
    diagnose()
