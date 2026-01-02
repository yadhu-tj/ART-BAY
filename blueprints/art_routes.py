from flask import Blueprint, request, jsonify, session, render_template
from models.art_queries import (
    add_art, get_all_artworks, get_art_by_id,
    delete_artwork, get_filtered_artworks, get_art_details
)

art_bp = Blueprint("art", __name__, url_prefix="/art")

@art_bp.route('/add', methods=['POST'])
def add_artwork_route():
    # NOTE: This should check for an artist role, not just user_id
    if 'user' not in session or session['user'].get('role') != 'artist':
        return jsonify({"status": "error", "message": "Unauthorized"}), 401

    data = request.json
    # ... (rest of your add artwork logic) ...
    result = add_art(...)
    return jsonify(result)

@art_bp.route('/all', methods=['GET'])
def fetch_all_artworks_route():
    artworks = get_all_artworks()
    return jsonify(artworks)

@art_bp.route('/<int:art_id>', methods=['GET'])
def fetch_art_by_id_route(art_id):
    artwork = get_art_by_id(art_id)
    return jsonify(artwork)

@art_bp.route('/view/<int:art_id>', methods=['GET'])
def view_art_details_route(art_id):
    artwork = get_art_details(art_id)
    if not artwork or "error" in artwork:
        # Check if it was a DB error or just not found
        if artwork and "error" in artwork:
             print(f"Error fetching art details: {artwork['error']}")
        return render_template('404.html'), 404
    return render_template('art_details.html', artwork=artwork)

@art_bp.route('/delete/<int:art_id>', methods=['DELETE'])
def remove_artwork_route(art_id):
    # 1. Checks if user is logged in
    if 'user' not in session:
        return jsonify({"status": "error", "message": "Unauthorized"}), 401

    user = session['user']
    role = user.get('role')
    email = user.get('email')

    # 2. Determine permission level
    # If Admin -> Pass 'None' to skip ownership check
    # If Artist/User -> Pass 'email' to enforce ownership check
    owner_email = None if role == 'admin' else email

    # 3. Call the secure function
    result = delete_artwork(art_id, email=owner_email)
    
    # 4. Return appropriate status code
    status_code = 200 if result['status'] == 'success' else 403
    return jsonify(result), status_code

@art_bp.route('/filter', methods=['POST'])
def filter_artworks_route():
    # NOTE: The complex logic is now moved to the model function
    filters = request.get_json()
    result = get_filtered_artworks(filters)
    return jsonify(result)