from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for, current_app
from models.user_queries import add_user, get_user_by_email, upgrade_to_artist
from werkzeug.security import check_password_hash

# Initialize Blueprint
auth_bp = Blueprint('auth', __name__, template_folder='templates')

@auth_bp.route('/signup', methods=['POST'])
def signup():
    try:
        name = request.form.get('name')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirmPassword')

        if not all([name, email, password, confirm_password]):
            return jsonify({"status": "error", "message": "All fields are required!"}), 400

        if password != confirm_password:
            return jsonify({"status": "error", "message": "Passwords do not match!"}), 400

        result = add_user(name, email, password)
        
        if "message" in result:
            current_app.logger.info(f"Signup successful for {email}")
            return jsonify({
                "status": "success",
                "message": result["message"],
                "redirect": url_for('auth.login_page')
            }), 200
        
        current_app.logger.error(f"Signup failed: {result.get('error')}")
        return jsonify({"status": "error", "message": result.get("error", "An error occurred")}), 400
    except Exception as e:
        current_app.logger.error(f"Signup error: {str(e)}")
        return jsonify({"status": "error", "message": "Internal server error"}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    # print("Login route reached")
    try:
        email = request.form.get('email')
        password = request.form.get('password')

        if not all([email, password]):
            return jsonify({"status": "error", "message": "Email and password are required!"}), 400

        user = get_user_by_email(email)
        
        if user and check_password_hash(user['password'], password):
            session['user'] = {
                'id': user.get('id', user['email']),
                'name': user['name'],
                'email': user['email'],
                'username': user['name'],  # Add username for admin template
                'role': user['role']
            }
            
            # Redirect admin users to admin dashboard
            if user['role'] == 'admin':
                return jsonify({
                    'status': 'success',
                    'message': "Login successful!",
                    'redirect': url_for('admin.dashboard')
                }), 200
            
            return jsonify({
                'status': 'success',
                'message': "Login successful!",
                'redirect': url_for('home')
            }), 200
        
        return jsonify({'status': 'error', 'message': "Invalid email or password"}), 400
    except Exception as e:
        current_app.logger.error(f"Login error: {str(e)}")
        return jsonify({"status": "error", "message": "Internal server error"}), 500

@auth_bp.route('/admin-login')
def admin_login_page():
    if 'user' in session and session['user']['role'] == 'admin':
        return redirect(url_for('admin.dashboard'))
    return render_template('auth/admin_login.html')

@auth_bp.route('/logout')
def logout():
    # print("Logout route reached")
    session.pop('user', None)
    return jsonify({'status': 'success', 'message': 'Logged out successfully'})

@auth_bp.route('/upgrade-to-artist', methods=['POST'])
def upgrade_to_artist_route():
    if 'user' not in session:
        return jsonify({'status': 'error', 'message': 'You must be logged in to upgrade.'}), 403

    email = session['user']['email']
    result = upgrade_to_artist(email)

    if "message" in result:
        session['user']['role'] = 'artist'
        return jsonify({'status': 'success', 'message': result["message"]})
    return jsonify({'status': 'error', 'message': result.get("error", "An error occurred.")}), 400

@auth_bp.route('/register-artist', methods=['POST'])
def register_artist():
    if 'user' not in session:
        current_app.logger.info("Register artist attempted without login")
        return jsonify({
            'status': 'error',
            'message': 'You must be logged in to register as an artist.',
            'redirect': url_for('auth.login_page')
        }), 403

    if session['user']['role'] == 'artist':
        current_app.logger.info(f"User {session['user']['email']} already an artist")
        return jsonify({
            'status': 'success',
            'message': 'You are already an artist.',
            'redirect': url_for('auth.artist_login')
        }), 200

    email = session['user']['email']
    result = upgrade_to_artist(email)

    if "message" in result:
        session['user']['role'] = 'artist'
        current_app.logger.info(f"User {email} registered as artist. Session: {session['user']}")
        return jsonify({
            'status': 'success',
            'message': result["message"],
            'redirect': url_for('auth.artist_login')
        }), 200
    else:
        current_app.logger.error(f"Register artist failed: {result.get('error')}")
        return jsonify({
            'status': 'error',
            'message': result.get("error", "An error occurred.")
        }), 400

@auth_bp.route('/login')
def login_page():
    return render_template('auth/login.html')
@auth_bp.route('/artist-login')
def artist_login_page():
    return render_template('auth/artist_login.html')

@auth_bp.route('/signup')
def signup_page():
    return render_template('auth/signup.html')

@auth_bp.route('/check-login')
def check_login():
    if 'user' in session:
        return jsonify({'status': 'success', 'user': session['user']})
    return jsonify({'status': 'error', 'message': 'Not logged in'}), 401

@auth_bp.route('/artist-login')
def artist_login():
    if 'user' not in session or session['user']['role'] != 'artist':
        current_app.logger.info("Redirecting to login due to missing user or non-artist role")
        return redirect(url_for('auth.artist_login_page'))
    # return render_template('auth/artist_login.html')