from flask import Blueprint, request, jsonify, session, url_for
from models.art_queries import (
    add_art, get_all_artworks, get_art_by_id,
    delete_artwork, get_db_connection
)
from mysql.connector import Error

art_bp = Blueprint("art", __name__, url_prefix="/art")


# Add Artwork
@art_bp.route('/add', methods=['POST'])
def add_artwork():
    if 'user_id' not in session:
        return jsonify({"status": "error", "message": "Unauthorized"}), 401

    data = request.json
    required_fields = ['email', 'title', 'price', 'category', 'image_path']
    if not all(data.get(field) for field in required_fields):
        return jsonify({"status": "error", "message": "Missing required fields"}), 400

    result = add_art(
        data["email"], data["title"], data.get("description", ""),
        data["price"], data["category"], data["image_path"]
    )
    return jsonify(result)


# Get All Artworks
@art_bp.route('/all', methods=['GET'])
def fetch_all_artworks():
    artworks = get_all_artworks()
    return jsonify(artworks)


# Get Artwork by ID
@art_bp.route('/<int:art_id>', methods=['GET'])
def fetch_art_by_id(art_id):
    artwork = get_art_by_id(art_id)
    return jsonify(artwork)


# Delete Artwork
@art_bp.route('/delete/<int:art_id>', methods=['DELETE'])
def remove_artwork(art_id):
    if 'user_id' not in session:
        return jsonify({"status": "error", "message": "Unauthorized"}), 401

    result = delete_artwork(art_id)
    return jsonify(result)


# Filter + Sort Artworks
@art_bp.route('/filter', methods=['POST'])
def filter_artworks():
    data = request.get_json()
    conn = get_db_connection()

    if not conn:
        return jsonify({"status": "error", "message": "Database connection failed"}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        sql = """
            SELECT 
                art.art_id, art.title, art.description, art.price,
                art.category, art.image_path, art.created_at,
                users.name AS artist, art.email
            FROM art
            JOIN artists ON art.email = artists.email
            JOIN users ON artists.email = users.email
            WHERE 1=1
        """
        params = []

        # Search
        search_term = data.get('search')
        if search_term:
            sql += " AND (art.title LIKE %s OR art.description LIKE %s)"
            like_term = f"%{search_term}%"
            params.extend([like_term, like_term])

        # Artist filter
        if data.get('artist'):
            sql += " AND users.name = %s"
            params.append(data['artist'])

        # Category filter
        if data.get('category'):
            sql += " AND art.category = %s"
            params.append(data['category'])

        # Price filter
        price_range = data.get('price')
        if price_range and price_range != '0-10000':
            if price_range == '1001+':
                sql += " AND art.price >= %s"
                params.append(1001)
            else:
                try:
                    min_price, max_price = map(int, price_range.split('-'))
                    sql += " AND art.price BETWEEN %s AND %s"
                    params.extend([min_price, max_price])
                except ValueError:
                    return jsonify({"status": "error", "message": "Invalid price range"}), 400

        # Sorting
        sort_order = data.get('sort')
        sql += " ORDER BY art.created_at ASC" if sort_order == 'oldest' else " ORDER BY art.created_at DESC"

        # Execute
        cursor.execute(sql, params)
        artworks = cursor.fetchall()

        # Format image path
        for art in artworks:
            if art.get("image_path"):
                filename = art["image_path"].split("/")[-1]
                art["image_path"] = url_for("static", filename=f"uploads/{filename}")

        return jsonify({'artworks': artworks})

    except Error as e:
        return jsonify({"status": "error", "message": str(e)}), 500

    finally:
        cursor.close()
        conn.close()
