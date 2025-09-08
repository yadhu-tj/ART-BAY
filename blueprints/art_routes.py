from flask import Blueprint, request, jsonify, session
from models.art_queries import (
    add_art, get_all_artworks, get_art_by_id,
    delete_artwork, get_filtered_artworks
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

@art_bp.route('/delete/<int:art_id>', methods=['DELETE'])
def remove_artwork_route(art_id):
    # NOTE: This should also check for ownership or admin role
    if 'user' not in session:
        return jsonify({"status": "error", "message": "Unauthorized"}), 401

    result = delete_artwork(art_id)
    return jsonify(result)

@art_bp.route('/filter', methods=['POST'])
def filter_artworks_route():
    # NOTE: The complex logic is now moved to the model function
    filters = request.get_json()
    result = get_filtered_artworks(filters)
    return jsonify(result)