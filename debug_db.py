from app import create_app
from models.database import get_db_connection

def debug_artists():
    app = create_app()
    with app.app_context():
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            print("--- DEBUGGING ARTISTS TABLE ---")
            
            # 1. Check table existence
            cursor.execute("SHOW TABLES LIKE 'artists'")
            if not cursor.fetchone():
                print("ERROR: 'artists' table does not exist!")
                return
    
            # 2. Dump all artists
            cursor.execute("SELECT * FROM artists")
            artists = cursor.fetchall()
            print(f"Total rows in 'artists': {len(artists)}")
            for artist in artists:
                print(f" - Email: {artist.get('email')}, Approved: {artist.get('approved')}, Created: {artist.get('created_at')}")
                
            # 3. test the count query
            cursor.execute("SELECT COUNT(*) AS count FROM artists WHERE approved = 0")
            count = cursor.fetchone()['count']
            print(f"Query 'SELECT COUNT(*) FROM artists WHERE approved = 0' result: {count}")
            
        except Exception as e:
            print(f"Error: {e}")
        finally:
            if 'conn' in locals() and conn.is_connected():
                conn.close()

if __name__ == "__main__":
    debug_artists()
