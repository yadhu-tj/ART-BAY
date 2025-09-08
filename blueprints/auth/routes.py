from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for, current_app
from models.user_queries import add_user, get_user_by_email, upgrade_to_artist
from models.otp_queries import generate_otp, store_otp, verify_otp, cleanup_expired_otp
from services.email_service import EmailService
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
            
            # --- CORRECTED REDIRECTION LOGIC ---
            if user['role'] == 'admin':
                redirect_url = url_for('admin.dashboard')
            elif user['role'] == 'artist':
                redirect_url = url_for('artist_dashboard.dashboard')
            else: # Regular user
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


@auth_bp.route('/login')
def login_page():
    return render_template('auth/login.html')
@auth_bp.route('/artist-login')
def artist_login_page():
    return render_template('auth/artist_login.html')

@auth_bp.route('/signup')
def signup_page():
    return render_template('auth/signup.html')

@auth_bp.route('/send-otp', methods=['POST'])
def send_otp():
    try:
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({"status": "error", "message": "Email is required"}), 400

        # Check if user exists
        user = get_user_by_email(email)
        if not user:
            return jsonify({"status": "error", "message": "No account found with this email address"}), 404

        # Generate OTP
        otp_code = generate_otp()
        
        # Store OTP in database
        store_result = store_otp(email, otp_code)
        if store_result.get('status') != 'success':
            return jsonify({"status": "error", "message": "Failed to generate OTP"}), 500

        # Send OTP email
        email_service = EmailService()
        email_result = email_service.send_otp_email(email, otp_code, user.get('name', ''))
        
        if email_result.get('status') == 'success':
            current_app.logger.info(f"OTP sent successfully to {email}")
            return jsonify({
                "status": "success",
                "message": "OTP sent successfully to your email"
            }), 200
        else:
            return jsonify({
                "status": "error",
                "message": "Failed to send OTP email. Please try again."
            }), 500

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

        # Verify OTP
        verify_result = verify_otp(email, otp)
        if verify_result.get('status') != 'success':
            return jsonify({"status": "error", "message": verify_result.get('message', 'Invalid OTP')}), 400

        # Get user details
        user = get_user_by_email(email)
        if not user:
            return jsonify({"status": "error", "message": "User not found"}), 404

        # Create session
        session['user'] = {
            'name': user['name'],
            'email': user['email'],
            'role': user['role']
        }
        
        # Determine redirect URL based on user role
        if user['role'] == 'admin':
            redirect_url = url_for('admin.dashboard')
        elif user['role'] == 'artist':
            redirect_url = url_for('artist_dashboard.dashboard')
        else:
            redirect_url = url_for('home')
        
        current_app.logger.info(f"OTP login successful for {email}")
        return jsonify({
            'status': 'success',
            'message': 'Login successful!',
            'redirect': redirect_url
        }), 200

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

        # Check if user already exists
        existing_user = get_user_by_email(email)
        if existing_user:
            return jsonify({"status": "error", "message": "An account with this email already exists"}), 409

        # Generate OTP
        otp_code = generate_otp()
        
        # Store OTP in database
        store_result = store_otp(email, otp_code)
        if store_result.get('status') != 'success':
            return jsonify({"status": "error", "message": "Failed to generate OTP"}), 500

        # Send OTP email
        email_service = EmailService()
        email_result = email_service.send_otp_email(email, otp_code, name)
        
        if email_result.get('status') == 'success':
            current_app.logger.info(f"Signup OTP sent successfully to {email}")
            return jsonify({
                "status": "success",
                "message": "OTP sent successfully to your email"
            }), 200
        else:
            return jsonify({
                "status": "error",
                "message": "Failed to send OTP email. Please try again."
            }), 500

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
        
        if not email or not name or not password or not otp:
            return jsonify({"status": "error", "message": "All fields are required"}), 400

        # Verify OTP
        verify_result = verify_otp(email, otp)
        if verify_result.get('status') != 'success':
            return jsonify({"status": "error", "message": verify_result.get('message', 'Invalid OTP')}), 400

        # Check if user already exists (double-check)
        existing_user = get_user_by_email(email)
        if existing_user:
            return jsonify({"status": "error", "message": "An account with this email already exists"}), 409

        # Create the user account
        add_result = add_user(name, email, password)
        if "error" in add_result:
            return jsonify({"status": "error", "message": add_result["error"]}), 500

        # Send welcome email
        email_service = EmailService()
        email_service.send_welcome_email(email, name)
        
        current_app.logger.info(f"Account created successfully for {email}")
        return jsonify({
            'status': 'success',
            'message': 'Account created successfully!'
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error verifying signup OTP: {str(e)}")
        return jsonify({"status": "error", "message": "Internal server error"}), 500

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




    
    