import os
import logging
from flask import Blueprint, render_template, request, redirect, url_for, flash, session, current_app
from werkzeug.utils import secure_filename
from config.config import Config
from models.artist_dashboard_queries import (
    get_dashboard_artworks,
    add_dashboard_artwork,
    delete_dashboard_artwork,
    update_dashboard_art_price
)
from mysql.connector import Error

# Setup logging
logger = logging.getLogger(__name__)

# Blueprint setup
artist_dashboard_bp = Blueprint('artist_dashboard', __name__, template_folder='../templates')

# Configuration for file uploads
UPLOAD_FOLDER = Config.UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Middleware to check if user is an artist
def artist_required(f):
    def wrap(*args, **kwargs):
        if 'user' not in session or session['user'].get('role') != 'artist':
            flash('You must be logged in as an artist to access this page.')
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    wrap.__name__ = f.__name__
    return wrap

# Dashboard: View existing art
@artist_dashboard_bp.route('/dashboard', methods=['GET'])
@artist_required
def dashboard():
    artist_email = session['user']['email']
    try:
        artworks = get_dashboard_artworks(artist_email)
        logger.info(f"Loaded artworks for artist {artist_email}: {len(artworks)} items")
        return render_template('dashboard.html', artworks=artworks)
    except Error as e:
        logger.error(f"Database error fetching artworks: {e}")
        flash('An error occurred while loading your artworks.')
        return redirect(url_for('artist_dashboard.dashboard'))

# Add new art
@artist_dashboard_bp.route('/add_art', methods=['GET', 'POST'])
@artist_required
def add_art():
    if request.method == 'POST':
        title = request.form['title']
        description = request.form.get('description', '')
        try:
            price = float(request.form['price'])
        except ValueError:
            flash('Price must be a valid number.')
            return redirect(url_for('artist_dashboard.add_art'))

        category = request.form.get('category', '')
        file = request.files.get('image')

        if not file or not allowed_file(file.filename):
            flash('Invalid or missing image file.')
            return redirect(url_for('artist_dashboard.add_art'))

        filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)

        artist_email = session['user']['email']
        try:
            add_dashboard_artwork(artist_email, title, description, price, category, filename)
            flash('Art added successfully!')
            logger.info(f"New art '{title}' added by {artist_email}")
            return redirect(url_for('artist_dashboard.dashboard'))
        except Error as e:
            logger.error(f"Database error adding artwork: {e}")
            flash('An error occurred while adding your artwork.')
            return redirect(url_for('artist_dashboard.add_art'))

    return render_template('add_art.html')

# Delete art
@artist_dashboard_bp.route('/delete_art/<int:art_id>', methods=['POST'])
@artist_required
def delete_art(art_id):
    artist_email = session['user']['email']
    try:
        artwork = get_dashboard_artworks(artist_email, art_id=art_id)
        logger.debug(f"Artwork query result for art_id {art_id}: {artwork}")
        if not artwork or len(artwork) == 0:
            flash('Art not found or you don’t have permission to delete it.')
            return redirect(url_for('artist_dashboard.dashboard'))

        # Delete the image file
        image_path = os.path.join(UPLOAD_FOLDER, artwork[0]['image_path'])
        logger.debug(f"Attempting to delete image: {image_path}")
        if os.path.exists(image_path):
            os.remove(image_path)
        else:
            logger.warning(f"Image file not found: {image_path}")

        delete_dashboard_artwork(art_id)
        flash('Art deleted successfully!')
        logger.info(f"Art ID {art_id} deleted by {artist_email}")
    except Error as e:
        logger.error(f"Database error deleting artwork ID {art_id}: {e}")
        flash('An error occurred while deleting the artwork.')
    return redirect(url_for('artist_dashboard.dashboard'))

# Edit art price
@artist_dashboard_bp.route('/edit_price/<int:art_id>', methods=['GET', 'POST'])
@artist_required
def edit_price(art_id):
    artist_email = session['user']['email']
    logger.debug(f"Edit price requested for art_id {art_id} by {artist_email}")
    try:
        artwork = get_dashboard_artworks(artist_email, art_id=art_id)
        logger.debug(f"Artwork query result for edit art_id {art_id}: {artwork}")
        if not artwork or len(artwork) == 0:
            logger.warning(f"No artwork found for art_id {art_id} by {artist_email}")
            flash('Art not found or you don’t have permission to edit it.')
            return redirect(url_for('artist_dashboard.dashboard'))

        if request.method == 'POST':
            logger.debug(f"POST received for art_id {art_id}, form data: {request.form}")
            try:
                new_price = float(request.form['price'])
                update_dashboard_art_price(art_id, new_price)
                flash('Price updated successfully!')
                logger.info(f"Price updated for art ID {art_id} to {new_price} by {artist_email}")
                return redirect(url_for('artist_dashboard.dashboard'))
            except ValueError:
                logger.error(f"Invalid price format for art_id {art_id}: {request.form.get('price')}")
                flash('Price must be a valid number.')
                return redirect(url_for('artist_dashboard.edit_price', art_id=art_id))
            except Error as e:
                logger.error(f"Database error updating price for art_id {art_id}: {e}")
                flash('An error occurred while updating the price.')
                return redirect(url_for('artist_dashboard.edit_price', art_id=art_id))

        logger.debug(f"Rendering edit_price.html for art_id {art_id}")
        return render_template('edit_price.html', art=artwork[0])
    except Error as e:
        logger.error(f"Database error fetching artwork for edit art_id {art_id}: {e}")
        flash('An error occurred while loading the artwork.')
        return redirect(url_for('artist_dashboard.dashboard'))

# Register the Blueprint
def init_app(app):
    app.register_blueprint(artist_dashboard_bp)
