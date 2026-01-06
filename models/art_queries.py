import logging
from mysql.connector import Error
from .database import get_db_connection

logger = logging.getLogger(__name__)

def add_art(email, title, description, price, category, image_path):
    """Adds a new artwork to the database."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        sql = """INSERT INTO art (email, title, description, price, category, image_path)
                 VALUES (%s, %s, %s, %s, %s, %s)"""
        cursor.execute(sql, (email, title, description, price, category, image_path))
        conn.commit()
        return {"status": "success", "message": "Artwork added successfully!"}
    except Error as e:
        get_db_connection().rollback()
        logger.error(f"DB Error in add_art: {e}")
        return {"status": "error", "message": str(e)}

def delete_artwork(art_id, email=None):
    """Deletes an artwork. If email is provided, ensures ownership."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if email:
            # Secure delete: Enforce ownership (User/Artist)
            query = "DELETE FROM art WHERE art_id = %s AND email = %s"
            cursor.execute(query, (art_id, email))
        else:
            # Unrestricted delete: Admin only
            query = "DELETE FROM art WHERE art_id = %s"
            cursor.execute(query, (art_id,))
            
        conn.commit()
        
        # Check if anything was actually deleted
        if cursor.rowcount == 0:
            return {"status": "error", "message": "Artwork not found or permission denied"}
            
        return {"status": "success", "message": "Artwork deleted successfully"}
    except Error as e:
        get_db_connection().rollback()
        logger.error(f"DB Error in delete_artwork: {e}")
        return {"status": "error", "message": str(e)}

def get_all_artworks():
    """Fetches all artworks with artist names."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT a.*, u.name as artist_name FROM art a
            JOIN users u ON a.email = u.email ORDER BY a.created_at DESC
        """
        cursor.execute(query)
        return cursor.fetchall()
    except Error as e:
        logger.error(f"DB error in get_all_artworks: {e}")
        return {"error": str(e)}

def get_art_by_id(art_id):
    """Fetches a single artwork by its ID."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM art WHERE art_id = %s", (art_id,))
        return cursor.fetchone()
    except Error as e:
        logger.error(f"DB error in get_art_by_id: {e}")
        return {"error": str(e)}

def get_art_details(art_id):
    """Fetches full artwork details including artist name."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT a.*, u.name as artist_name, ar.bio as artist_bio, ar.profile_pic 
            FROM art a
            JOIN users u ON a.email = u.email 
            LEFT JOIN artists ar ON a.email = ar.email
            WHERE a.art_id = %s
        """
        cursor.execute(query, (art_id,))
        return cursor.fetchone()
    except Error as e:
        logger.error(f"DB error in get_art_details: {e}")
        return {"error": str(e)}

def get_filtered_artworks(filters):
    """Fetches artworks with dynamic search, filter, and sort options."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        sql = "SELECT a.*, u.name AS artist_name FROM art a JOIN users u ON a.email = u.email WHERE 1=1"
        params = []

        if filters.get('search'):
            sql += " AND (a.title LIKE %s OR a.description LIKE %s)"
            like_term = f"%{filters['search']}%"
            params.extend([like_term, like_term])
        
        # Filter by Category (Media)
        if filters.get('media'):
            sql += " AND a.category = %s"
            params.append(filters['media'])

        # Filter by Price Range
        price_range = filters.get('price')
        if price_range:
            if price_range == '0-500':
                sql += " AND a.price BETWEEN 0 AND 500"
            elif price_range == '501-1000':
                sql += " AND a.price BETWEEN 501 AND 1000"
            elif price_range == '1001+':
                sql += " AND a.price > 1000"

        # Sorting Logic
        sort_option = filters.get('sort', 'newest')
        if sort_option == 'price-low':
            sql += " ORDER BY a.price ASC"
        elif sort_option == 'price-high':
            sql += " ORDER BY a.price DESC"
        elif sort_option == 'oldest':
            sql += " ORDER BY a.created_at ASC"
        else:
            # Default to newest
            sql += " ORDER BY a.created_at DESC"

        cursor.execute(sql, params)
        return {"artworks": cursor.fetchall()}
    except Error as e:
        logger.error(f"DB error in get_filtered_artworks: {e}")
        return {"error": str(e)}

def get_neighbor_artworks(art_id):
    """Fetches the previous and next artwork IDs and images for the carousel."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get next artwork (Ordered by created_at DESC usually, but ID is simpler for neighbors)
        # Using ID for simplicity in "neighbor" concept, or we could use created_at
        
        # Next (newer/higher ID)
        cursor.execute("SELECT art_id, image_path, title FROM art WHERE art_id > %s ORDER BY art_id ASC LIMIT 1", (art_id,))
        next_art = cursor.fetchone()
        
        # Previous (older/lower ID)
        cursor.execute("SELECT art_id, image_path, title FROM art WHERE art_id < %s ORDER BY art_id DESC LIMIT 1", (art_id,))
        prev_art = cursor.fetchone()
        
        # Circular Navigation Logic:
        # If no next, wrap to first (lowest ID)
        if not next_art:
            cursor.execute("SELECT art_id, image_path, title FROM art ORDER BY art_id ASC LIMIT 1")
            next_art = cursor.fetchone()
            
        # If no prev, wrap to last (highest ID)
        if not prev_art:
            cursor.execute("SELECT art_id, image_path, title FROM art ORDER BY art_id DESC LIMIT 1")
            prev_art = cursor.fetchone()
            
        return {"next": next_art, "prev": prev_art}
    except Error as e:
        logger.error(f"DB error in get_neighbor_artworks: {e}")
        return {"next": None, "prev": None}

def search_artworks(query):
    """
    Performs a fuzzy search across artworks.
    Matches against: Title, Description, Category, and Artist Name.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        sql = """
            SELECT a.art_id, a.title, a.category, a.image_path, a.price, u.name as artist_name 
            FROM art a
            JOIN users u ON a.email = u.email
            WHERE 
                a.title LIKE %s OR 
                a.description LIKE %s OR 
                a.category LIKE %s OR 
                u.name LIKE %s
            ORDER BY a.created_at DESC
            LIMIT 20
        """
        
        search_term = f"%{query}%"
        params = (search_term, search_term, search_term, search_term)
        
        cursor.execute(sql, params)
        return cursor.fetchall()
        
    except Error as e:
        logger.error(f"DB error in search_artworks: {e}")
        return []