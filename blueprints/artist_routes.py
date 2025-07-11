from flask import Blueprint, request, jsonify, session, redirect, url_for, render_template, current_app
import os
import mysql.connector

artist_bp = Blueprint('artist', __name__, template_folder='templates')

# --- Routes ---
@artist_bp.route('/artist-signup', methods=['GET'])
def artist_signup():
    try:
        if 'user' not in session:
            current_app.logger.info("Redirecting to login: User not in session")
            return redirect(url_for('auth.login'))
        if session['user'].get('role') != 'artist':
            current_app.logger.info("Redirecting to homepage: User role is not 'artist'")
            return redirect(url_for('home'))  # Fixed for consistency
        return render_template('artist_signup.html')
    except Exception as e:
        current_app.logger.error(f"🔥 ERROR in artist_signup (GET): {str(e)}")
        return jsonify({'error': 'Server error'}), 500

@artist_bp.route('/artist-signup', methods=['POST'])
def handle_artist_signup():
    try:
        from models.artist_queries import add_artist, get_artist_by_email

        if 'user' not in session:
            current_app.logger.warning("🚫 Unauthorized access attempt to /artist-signup (POST)")
            return jsonify({'error': 'Unauthorized access'}), 401

        email = session['user']['email']
        bio = request.form.get('bio', '').strip()
        profile_pic = request.files.get('profile_pic')

        if get_artist_by_email(email):
            current_app.logger.warning(f"⚠️ Artist signup failed: User {email} already exists in 'artists' table")
            return jsonify({'error': 'You are already registered as an artist'}), 400

        # Save profile picture if uploaded
        profile_pic_filename = None
        if profile_pic:
            profile_pic_filename = f"{email}_{profile_pic.filename}"
            upload_dir = current_app.config['UPLOAD_FOLDER']
            os.makedirs(upload_dir, exist_ok=True)
            profile_pic.save(os.path.join(upload_dir, profile_pic_filename))

        success = add_artist(email=email, bio=bio, profile_pic=profile_pic_filename)
        if 'error' in success:
            current_app.logger.error(f"❌ Artist profile creation failed for {email}: {success['error']}")
            return jsonify(success), 500

        current_app.logger.info(f"✅ Artist profile created successfully for {email}")
        
        # Automatic logout
        session.pop('user', None)  # Remove user from session
        
        return jsonify({
            'message': 'Artist profile created successfully. You have been logged out.',
            'redirect': url_for('home')  # Fixed to match the main homepage
        }), 200
    except Exception as e:
        current_app.logger.error(f"🔥 ERROR in handle_artist_signup (POST): {str(e)}")
        return jsonify({'error': 'Server error'}), 500

@artist_bp.route('/dashboard')
def artist_dashboard():
    try:
        if 'user' not in session:
            current_app.logger.info("Redirecting to login: User not in session")
            return redirect(url_for('auth.login'))
        if session['user'].get('role') != 'artist':
            current_app.logger.info("Redirecting to homepage: User role is not 'artist'")
            return redirect(url_for('home'))  # Fixed for consistency
        return render_template('artist_dashboard.html')
    except Exception as e:
        current_app.logger.error(f"🔥 ERROR in artist_dashboard: {str(e)}")
        return jsonify({'error': 'Server error'}), 500

# --- Database Functions ---
def get_db_connection():
    """Get a connection from the app's database pool."""
    try:
        if not hasattr(current_app, 'db_pool') or current_app.db_pool is None:
            current_app.logger.critical("❌ Database pool not initialized")
            return None
        conn = current_app.db_pool.get_connection()
        current_app.logger.info("✅ Retrieved connection from pool")
        return conn
    except mysql.connector.Error as e:
        current_app.logger.critical(f"❌ Failed to get connection from pool: {str(e)}")
        return None

def add_artist(email, bio, profile_pic=None):
    """Add artist to the 'artists' table."""
    conn = get_db_connection()
    if not conn:
        current_app.logger.error("❌ ERROR: Database connection is None")
        return {'error': 'Database connection failed'}

    cursor = conn.cursor()
    try:
        current_app.logger.info(f"📌 Adding artist with email {email} to 'artists' table...")
        query = "INSERT INTO artists (email, bio, profile_pic) VALUES (%s, %s, %s)"
        cursor.execute(query, (email, bio, profile_pic))
        conn.commit()
        current_app.logger.info("✅ Artist added successfully!")
        return {'message': 'Artist created successfully'}
    except mysql.connector.Error as e:
        current_app.logger.error(f"🔥 ERROR while inserting artist: {str(e)}")
        return {'error': str(e)}
    finally:
        cursor.close()
        conn.close()  # Return connection to pool

def get_artist_by_email(email):
    """Retrieve artist details by email from the 'artists' table."""
    conn = get_db_connection()
    if not conn:
        current_app.logger.error("❌ ERROR: Database connection is None")
        return None

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM artists WHERE email = %s", (email,))
        artist = cursor.fetchone()
        if artist:
            current_app.logger.info(f"✅ Artist found for email {email}")
        return artist
    except mysql.connector.Error as e:
        current_app.logger.error(f"🔥 ERROR while fetching artist: {str(e)}")
        return None
    finally:
        cursor.close()
        conn.close()  # Return connection to pool

def get_all_artists():
    """Fetch all artists from the 'artists' table."""
    conn = get_db_connection()
    if not conn:
        current_app.logger.error("❌ ERROR: Database connection is None")
        return {'error': 'Database connection failed'}

    cursor = conn.cursor(dictionary=True)
    try:
        current_app.logger.info("📤 Fetching all artists from 'artists' table...")
        cursor.execute("SELECT * FROM artists")
        artists = cursor.fetchall()
        current_app.logger.info(f"✅ Retrieved {len(artists)} artists from the database.")
        return artists
    except mysql.connector.Error as e:
        current_app.logger.error(f"🔥 ERROR while fetching artists: {str(e)}")
        return {'error': str(e)}
    finally:
        cursor.close()
        conn.close()  # Return connection to pool
