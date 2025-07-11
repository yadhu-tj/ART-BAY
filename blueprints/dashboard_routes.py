from flask import Blueprint, request, jsonify, session, current_app
from werkzeug.utils import secure_filename
import os
from models.artist_queries import (
    get_all_artist_artworks,
    add_new_artwork,
    remove_artwork,
    update_artwork,
    get_artwork_by_id
)

# Initialize blueprint
dashboard_bp = Blueprint("artist_dashboard", __name__, url_prefix="/artist/dashboard")

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@dashboard_bp.route("/")
def dashboard_home():
    """Main dashboard landing page"""
    if "user" not in session or session["user"].get("role") != "artist":
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    
    try:
        email = session["user"]["email"]
        artworks = get_all_artist_artworks(email)
        return jsonify({
            "status": "success",
            "artworks": artworks,
            "dashboard": True
        })
    except Exception as e:
        current_app.logger.error(f"Dashboard error: {str(e)}")
        return jsonify({"status": "error", "message": "Server error"}), 500

@dashboard_bp.route("/artworks", methods=["GET"])
def get_artworks():
    """Get all artworks for the artist"""
    if "user" not in session or session["user"].get("role") != "artist":
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    
    try:
        email = session["user"]["email"]
        artworks = get_all_artist_artworks(email)
        return jsonify({
            "status": "success",
            "artworks": artworks
        })
    except Exception as e:
        current_app.logger.error(f"Artworks fetch error: {str(e)}")
        return jsonify({"status": "error", "message": "Failed to fetch artworks"}), 500

@dashboard_bp.route("/add", methods=["POST"])
def add_artwork():
    """Add new artwork endpoint"""
    if "user" not in session or session["user"].get("role") != "artist":
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    
    try:
        email = session["user"]["email"]
        title = request.form.get("title", "").strip()
        description = request.form.get("description", "").strip()
        price = request.form.get("price", "0").strip()
        category = request.form.get("category", "").strip()
        image = request.files.get("image")

        # Validation
        if not all([title, price, category, image]):
            return jsonify({"status": "error", "message": "Missing required fields"}), 400
        
        try:
            price = float(price)
            if price <= 0:
                return jsonify({"status": "error", "message": "Price must be positive"}), 400
        except ValueError:
            return jsonify({"status": "error", "message": "Invalid price format"}), 400

        if not allowed_file(image.filename):
            return jsonify({"status": "error", "message": "Invalid file type"}), 400

        # File handling
        upload_folder = current_app.config.get("UPLOAD_FOLDER", "static/uploads")
        os.makedirs(upload_folder, exist_ok=True)
        
        filename = secure_filename(f"{email}_{image.filename}")
        image_path = os.path.join(upload_folder, filename)
        image.save(image_path)

        # Database operation - Changed artist_email to email
        result = add_new_artwork(
            email=email,
            title=title,
            description=description,
            price=price,
            category=category,
            image_path=filename
        )
        
        if "error" in result:
            # Clean up saved file if DB operation failed
            if os.path.exists(image_path):
                os.remove(image_path)
            return jsonify(result), 500
        
        # Get full artwork details to return
        artwork = get_artwork_by_id(result["artwork_id"])
        if "error" in artwork:
            return jsonify(artwork), 500

        current_app.logger.info(f"New artwork added by {email}")
        return jsonify({
            "status": "success",
            "message": "Artwork added successfully",
            "artwork": artwork
        }), 201
    except Exception as e:
        current_app.logger.error(f"Artwork add error: {str(e)}")
        return jsonify({"status": "error", "message": "Failed to add artwork"}), 500

@dashboard_bp.route("/delete/<int:art_id>", methods=["DELETE"])
def delete_artwork(art_id):
    """Delete artwork endpoint"""
    if "user" not in session or session["user"].get("role") != "artist":
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    
    try:
        email = session["user"]["email"]
        artwork = get_artwork_by_id(art_id)
        
        if "error" in artwork:
            return jsonify(artwork), 404
        
        if artwork["email"] != email:  # Changed from artist_email to email
            return jsonify({"status": "error", "message": "Unauthorized to delete this artwork"}), 403
        
        # Delete from database
        result = remove_artwork(art_id, email)
        
        if "error" in result:
            return jsonify(result), 500
        
        # Delete the image file
        if artwork["image_path"]:
            try:
                image_path = os.path.join(
                    current_app.config.get("UPLOAD_FOLDER", "static/uploads"),
                    artwork["image_path"]
                )
                if os.path.exists(image_path):
                    os.remove(image_path)
            except Exception as e:
                current_app.logger.error(f"Failed to delete image file: {str(e)}")
        
        current_app.logger.info(f"Artwork {art_id} deleted by {email}")
        return jsonify({
            "status": "success",
            "message": "Artwork deleted successfully"
        })
    except Exception as e:
        current_app.logger.error(f"Artwork delete error: {str(e)}")
        return jsonify({"status": "error", "message": "Failed to delete artwork"}), 500

@dashboard_bp.route("/update/<int:art_id>", methods=["PUT"])
def update_artwork(art_id):
    """Update artwork endpoint"""
    if "user" not in session or session["user"].get("role") != "artist":
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    
    try:
        email = session["user"]["email"]
        artwork = get_artwork_by_id(art_id)
        
        if "error" in artwork:
            return jsonify(artwork), 404
        
        if artwork["email"] != email:  # Changed from artist_email to email
            return jsonify({"status": "error", "message": "Unauthorized to update this artwork"}), 403
        
        # Get updated data
        title = request.form.get("title", artwork["title"]).strip()
        description = request.form.get("description", artwork["description"]).strip()
        price = request.form.get("price", str(artwork["price"])).strip()
        category = request.form.get("category", artwork["category"]).strip()
        image = request.files.get("image")

        # Validate price
        try:
            price = float(price)
            if price <= 0:
                return jsonify({"status": "error", "message": "Price must be positive"}), 400
        except ValueError:
            return jsonify({"status": "error", "message": "Invalid price format"}), 400

        image_filename = artwork["image_path"]
        if image:
            if not allowed_file(image.filename):
                return jsonify({"status": "error", "message": "Invalid file type"}), 400
            
            # Save new image
            upload_folder = current_app.config.get("UPLOAD_FOLDER", "static/uploads")
            os.makedirs(upload_folder, exist_ok=True)
            
            new_filename = secure_filename(f"{email}_{image.filename}")
            new_image_path = os.path.join(upload_folder, new_filename)
            image.save(new_image_path)
            
            # Delete old image if it exists and is different
            if artwork["image_path"] and artwork["image_path"] != new_filename:
                old_image_path = os.path.join(upload_folder, artwork["image_path"])
                if os.path.exists(old_image_path):
                    os.remove(old_image_path)
            
            image_filename = new_filename

        # Update in database - Changed artist_email to email
        result = update_artwork(
            art_id=art_id,
            email=email,
            title=title,
            description=description,
            price=price,
            category=category,
            image_path=image_filename
        )
        
        if "error" in result:
            return jsonify(result), 500
        
        # Get updated artwork details
        updated_artwork = get_artwork_by_id(art_id)
        if "error" in updated_artwork:
            return jsonify(updated_artwork), 500

        current_app.logger.info(f"Artwork {art_id} updated by {email}")
        return jsonify({
            "status": "success",
            "message": "Artwork updated successfully",
            "artwork": updated_artwork
        })
    except Exception as e:
        current_app.logger.error(f"Artwork update error: {str(e)}")
        return jsonify({"status": "error", "message": "Failed to update artwork"}), 500