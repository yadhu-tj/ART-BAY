import os
import logging
from flask import Blueprint, render_template, request, redirect, url_for, flash, session, current_app
from werkzeug.utils import secure_filename
from functools import wraps
from models.artist_dashboard_queries import (
    get_artworks_by_artist,
    add_artwork,
    delete_artwork_for_artist,
    update_artwork_price
)

# Setup logging
logger = logging.getLogger(__name__)

# Blueprint setup
artist_dashboard_bp = Blueprint('artist_dashboard', __name__, template_folder='../templates')

# --- Middleware & Helpers ---
def artist_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session or session['user'].get('role') != 'artist':
            flash('You must be logged in as an artist to access this page.')
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg'}

# --- Routes ---
@artist_dashboard_bp.route('/dashboard', methods=['GET'])
@artist_required
def dashboard():
    artist_email = session['user']['email']
    artworks = get_artworks_by_artist(artist_email)
    
    if 'error' in artworks:
        flash(f"An error occurred: {artworks['error']}")
        artworks = []
        
    return render_template('dashboard.html', artworks=artworks)

@artist_dashboard_bp.route('/add_art', methods=['GET', 'POST'])
@artist_required
def add_art():
    if request.method == 'POST':
        file = request.files.get('image')
        if not file or not allowed_file(file.filename):
            flash('Invalid or missing image file.')
            return redirect(request.url)

        try:
            filename = secure_filename(file.filename)
            file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)

            result = add_artwork(
                email=session['user']['email'],
                title=request.form['title'],
                description=request.form.get('description', ''),
                price=float(request.form['price']),
                category=request.form.get('category', ''),
                filename=filename
            )

            if 'error' in result:
                flash(f"Error adding art: {result['error']}")
            else:
                flash('Art added successfully!')
            return redirect(url_for('artist_dashboard.dashboard'))

        except ValueError:
            flash('Price must be a valid number.')
        except Exception as e:
            logger.error(f"Error adding artwork: {e}")
            flash('An unexpected error occurred.')
        
        return redirect(url_for('artist_dashboard.add_art_route'))

    return render_template('add_art.html')

@artist_dashboard_bp.route('/delete_art/<int:art_id>', methods=['POST'])
@artist_required
def delete_art(art_id):
    artist_email = session['user']['email']
    
    # First, get the artwork to find the image file to delete
    artworks = get_artworks_by_artist(artist_email)
    artwork_to_delete = next((art for art in artworks if art['art_id'] == art_id), None)

    if artwork_to_delete:
        # Delete the database record securely
        success = delete_artwork_for_artist(art_id, artist_email)
        if success:
            # Delete the image file from the server
            image_path = os.path.join(current_app.config['UPLOAD_FOLDER'], artwork_to_delete['image_path'])
            if os.path.exists(image_path):
                os.remove(image_path)
            flash('Art deleted successfully!')
        else:
            flash('Error deleting art. Please try again.')
    else:
        flash('Art not found or you do not have permission to delete it.')

    return redirect(url_for('artist_dashboard.dashboard'))

@artist_dashboard_bp.route('/edit_price/<int:art_id>', methods=['GET', 'POST'])
@artist_required
def edit_price(art_id):
    artist_email = session['user']['email']

    # First, get the artwork to make sure the artist owns it
    artworks = get_artworks_by_artist(artist_email) # Assuming this is in your model
    artwork_to_edit = next((art for art in artworks if art['art_id'] == art_id), None)

    if not artwork_to_edit:
        flash('Art not found or you do not have permission to edit it.')
        return redirect(url_for('artist_dashboard.dashboard'))

    # If the form is being SUBMITTED
    if request.method == 'POST':
        try:
            new_price = float(request.form['price'])
            # Update the price, ensuring ownership again in the query
            success = update_artwork_price(art_id, artist_email, new_price)
            if success:
                flash('Price updated successfully!')
            else:
                flash('Error updating price.')
            return redirect(url_for('artist_dashboard.dashboard'))
        except ValueError:
            flash('Price must be a valid number.')
        except Exception as e:
            logger.error(f"Error updating price: {e}")
            flash('An unexpected error occurred.')
        return redirect(url_for('artist_dashboard.edit_price', art_id=art_id))

    # If the page is being VIEWED (GET request)
    # You will need an 'edit_price.html' template for this
    return render_template('edit_price.html', art=artwork_to_edit)