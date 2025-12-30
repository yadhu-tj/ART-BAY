#
from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for, current_app
from models.user_queries import add_user, get_user_by_email, upgrade_to_artist
from models.otp_queries import generate_otp, store_otp, verify_otp
from services.email_service import EmailService
from werkzeug.security import check_password_hash

# Initialize Blueprint
auth_bp = Blueprint('auth', __name__, template_folder='templates')

# --- MERGED SIGNUP ROUTE (GET & POST) ---
@auth_bp.route('/signup', methods=['GET', 'POST'])
def signup():
    # Handle GET request (Render Page)
    if request.method == 'GET':
        return render_template('auth/signup.html')

    # Handle POST request (Process Signup)
    try:
        name = request.form.get('name')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirmPassword')

        if not all([name, email, password, confirm_password]):
            return jsonify({"status": "error", "message": "All fields are required!"}), 400

        # Input Length Validation
        if len(name) > 100:
            return jsonify({"status": "error", "message": "Name is too long (max 100 characters)"}), 400
        if len(email) > 120:
            return jsonify({"status": "error", "message": "Email is too long (max 120 characters)"}), 400
        if len(password) > 128:
            return jsonify({"status": "error", "message": "Password is too long (max 128 characters)"}), 400

        if password != confirm_password:
            return jsonify({"status": "error", "message": "Passwords do not match!"}), 400

        result = add_user(name, email, password)
        
        if "message" in result:
            current_app.logger.info(f"Signup successful for {email}")
            return jsonify({
                "status": "success",
                "message": result["message"],
                "redirect": url_for('auth.login') # Points to this same route now
            }), 200
        
        current_app.logger.error(f"Signup failed: {result.get('error')}")
        return jsonify({"status": "error", "message": result.get("error", "An error occurred")}), 400
    except Exception as e:
        current_app.logger.error(f"Signup error: {str(e)}")
        return jsonify({"status": "error", "message": "Internal server error"}), 500


# --- MERGED LOGIN ROUTE (GET & POST) ---
@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    # Handle GET request (Render Page)
    if request.method == 'GET':
        return render_template('auth/login.html')

    # Handle POST request (Process Login)
    try:
        email = request.form.get('email')
        password = request.form.get('password')

        if not all([email, password]):
            return jsonify({"status": "error", "message": "Email and password are required!"}), 400

        user = get_user_by_email(email)
        
        if user and check_password_hash(user['password'], password):
            session['user'] = {
                'name': user['name'],
                'email': user['email'],
                'role': user['role']
            }
            
            # Determine redirect URL
            if user['role'] == 'admin':
                redirect_url = url_for('admin.dashboard')
            elif user['role'] == 'artist':
                redirect_url = url_for('artist_dashboard.dashboard')
            else:
                redirect_url = url_for('home')
            
            return jsonify({
                'status': 'success',
                'message': 'Login successful!',
                'redirect': redirect_url
            }), 200
        
        return jsonify({'status': 'error', 'message': "Invalid email or password"}), 401
    except Exception as e:
        current_app.logger.error(f"Login error: {str(e)}")
        return jsonify({"status": "error", "message": "Internal server error"}), 500


# --- OTHER ROUTES ---

@auth_bp.route('/admin-login')
def admin_login_page():
    if 'user' in session and session['user']['role'] == 'admin':
        return redirect(url_for('admin.dashboard'))
    return render_template('auth/admin_login.html')

@auth_bp.route('/logout')
def logout():
    session.pop('user', None)
    
    # Check if client specifically requested JSON
    if request.args.get('mode') == 'json':
        return jsonify({'status': 'success', 'message': 'Logged out successfully'})
        
    # Default behavior for standard links: Redirect home
    return redirect(url_for('home'))

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

@auth_bp.route('/artist-login')
def artist_login_page():
    # Redirect if already logged in as artist
    if 'user' in session and session['user'].get('role') == 'artist':
        return redirect(url_for('artist_dashboard.dashboard'))
    return render_template('auth/artist_login.html')

# --- OTP ROUTES (Kept as is) ---

@auth_bp.route('/send-otp', methods=['POST'])
def send_otp():
    try:
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({"status": "error", "message": "Email is required"}), 400

        user = get_user_by_email(email)
        if not user:
            return jsonify({"status": "error", "message": "No account found with this email address"}), 404

        otp_code = generate_otp()
        store_result = store_otp(email, otp_code)
        
        if store_result.get('status') != 'success':
            return jsonify({"status": "error", "message": "Failed to generate OTP"}), 500

        email_service = EmailService()
        email_result = email_service.send_otp_email(email, otp_code, user.get('name', ''))
        
        if email_result.get('status') == 'success':
            current_app.logger.info(f"OTP sent successfully to {email}")
            return jsonify({"status": "success", "message": "OTP sent successfully"}), 200
        else:
            return jsonify({"status": "error", "message": "Failed to send OTP email."}), 500

    except Exception as e:
        current_app.logger.error(f"Error sending OTP: {str(e)}")
        return jsonify({"status": "error", "message": "Internal server error"}), 500

@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp_login():
    try:
        data = request.get_json()
        email = data.get('email')
        otp = data.get('otp')
        
        if not email or not otp:
            return jsonify({"status": "error", "message": "Email and OTP are required"}), 400

        verify_result = verify_otp(email, otp)
        if verify_result.get('status') != 'success':
            return jsonify({"status": "error", "message": verify_result.get('message', 'Invalid OTP')}), 400

        user = get_user_by_email(email)
        if not user:
            return jsonify({"status": "error", "message": "User not found"}), 404

        session['user'] = {
            'name': user['name'],
            'email': user['email'],
            'role': user['role']
        }
        
        if user['role'] == 'admin':
            redirect_url = url_for('admin.dashboard')
        elif user['role'] == 'artist':
            redirect_url = url_for('artist_dashboard.dashboard')
        else:
            redirect_url = url_for('home')
        
        return jsonify({'status': 'success', 'message': 'Login successful!', 'redirect': redirect_url}), 200

    except Exception as e:
        current_app.logger.error(f"Error verifying OTP: {str(e)}")
        return jsonify({"status": "error", "message": "Internal server error"}), 500

@auth_bp.route('/send-signup-otp', methods=['POST'])
def send_signup_otp():
    try:
        data = request.get_json()
        email = data.get('email')
        name = data.get('name')
        
        if not email or not name:
            return jsonify({"status": "error", "message": "Email and name are required"}), 400

        existing_user = get_user_by_email(email)
        if existing_user:
            return jsonify({"status": "error", "message": "An account with this email already exists"}), 409

        otp_code = generate_otp()
        store_result = store_otp(email, otp_code)
        
        if store_result.get('status') != 'success':
            return jsonify({"status": "error", "message": "Failed to generate OTP"}), 500

        email_service = EmailService()
        email_result = email_service.send_otp_email(email, otp_code, name)
        
        if email_result.get('status') == 'success':
            return jsonify({"status": "success", "message": "OTP sent successfully"}), 200
        else:
            return jsonify({"status": "error", "message": "Failed to send OTP email."}), 500

    except Exception as e:
        current_app.logger.error(f"Error sending signup OTP: {str(e)}")
        return jsonify({"status": "error", "message": "Internal server error"}), 500

@auth_bp.route('/verify-signup-otp', methods=['POST'])
def verify_signup_otp():
    try:
        data = request.get_json()
        email = data.get('email')
        name = data.get('name')
        password = data.get('password')
        otp = data.get('otp')
        
        if not all([email, name, password, otp]):
            return jsonify({"status": "error", "message": "All fields are required"}), 400

        verify_result = verify_otp(email, otp)
        if verify_result.get('status') != 'success':
            return jsonify({"status": "error", "message": verify_result.get('message', 'Invalid OTP')}), 400

        add_result = add_user(name, email, password)
        if "error" in add_result:
            if "already registered" in add_result["error"]:
                return jsonify({"status": "error", "message": add_result["error"]}), 409
            return jsonify({"status": "error", "message": add_result["error"]}), 500

        email_service = EmailService()
        email_service.send_welcome_email(email, name)
        
        return jsonify({'status': 'success', 'message': 'Account created successfully!'}), 200

    except Exception as e:
        current_app.logger.error(f"Error verifying signup OTP: {str(e)}")
        return jsonify({"status": "error", "message": "Internal server error"}), 500

@auth_bp.route('/check-login')
def check_login():
    if 'user' in session:
        return jsonify({'status': 'success', 'user': session['user']})
    return jsonify({'status': 'error', 'message': 'Not logged in'}), 401

    