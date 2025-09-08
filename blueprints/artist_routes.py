import os
from flask import Blueprint, request, jsonify, session, redirect, url_for, render_template, current_app
from werkzeug.utils import secure_filename
from models.artist_queries import add_artist_profile, get_artist_by_email
from models.user_queries import upgrade_to_artist

artist_bp = Blueprint('artist', __name__, template_folder='templates')

@artist_bp.route('/register', methods=['GET', 'POST'])
def register():
    if 'user' not in session:
        return redirect(url_for('auth.login'))

    if request.method == 'POST':
        email = session['user']['email']
        
        # Prevent re-application
        if get_artist_by_email(email):
            return jsonify({'error': 'You have already submitted an artist application.'}), 400

        # Update the user's role to 'artist' in the database
        upgrade_result = upgrade_to_artist(email)
        if 'error' in upgrade_result:
            return jsonify(upgrade_result), 500

        # Save artist profile info (bio and picture)
        bio = request.form.get('bio', '')
        profile_pic_filename = None
        profile_pic = request.files.get('profile_pic')
        if profile_pic and profile_pic.filename != '':
            safe_filename = secure_filename(profile_pic.filename)
            profile_pic_filename = f"{email}_{safe_filename}"
            profile_pic.save(os.path.join(current_app.config['UPLOAD_FOLDER'], profile_pic_filename))
        
        # Add their profile to the artists table (approved will default to 0)
        add_artist_profile(email, bio, profile_pic_filename)

        # --- KEY CHANGE HERE ---
        # Instead of redirecting, inform the user their application is pending.
        # We do NOT update the session role yet.
        return jsonify({
            'status': 'success',
            'message': 'Your application has been submitted and is pending review. You will be notified upon approval.'
        })

    # For GET requests, show the signup form
    return render_template('artist_signup.html')