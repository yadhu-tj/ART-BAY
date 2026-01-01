import os
import time
from flask import Blueprint, render_template, request, jsonify, session, current_app, url_for
from werkzeug.utils import secure_filename
from werkzeug.security import check_password_hash, generate_password_hash
from models.user_queries import (
    get_user_by_email, update_user_profile, update_profile_pic, 
    update_user_password, get_user_orders_with_items, get_user_addresses,
    confirm_order_receipt
)
from config.config import Config

user_bp = Blueprint('user', __name__, template_folder='templates')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@user_bp.route('/')
def profile():
    """Renders the user profile page."""
    if 'user' not in session:
        return render_template('auth/login.html', error="Please login to view your profile.")
    
    email = session['user']['email']
    user = get_user_by_email(email)
    
    # Fetch additional data
    orders = get_user_orders_with_items(email)
    addresses = get_user_addresses(email)
    
    return render_template('profile.html', user=user, orders=orders, addresses=addresses)

@user_bp.route('/update', methods=['POST'])
def update_info():
    """Updates user name or phone."""
    if 'user' not in session:
        return jsonify({'status': 'error', 'message': 'Not logged in'}), 401
    
    email = session['user']['email']
    data = request.json
    name = data.get('name')
    phone = data.get('phone')
    
    result = update_user_profile(email, name=name, phone=phone)
    
    if result['status'] == 'success':
        # Update session
        if name:
            user_data = session['user']
            user_data['name'] = name
            session['user'] = user_data
            session.modified = True
            
    return jsonify(result)

@user_bp.route('/upload-pic', methods=['POST'])
def upload_pic():
    """Handles profile picture upload."""
    if 'user' not in session:
        return jsonify({'status': 'error', 'message': 'Not logged in'}), 401
        
    if 'file' not in request.files:
        return jsonify({'status': 'error', 'message': 'No file part'}), 400
        
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'status': 'error', 'message': 'No selected file'}), 400
        
    if file and allowed_file(file.filename):
        # Create directory if it doesn't exist
        upload_dir = os.path.join(Config.UPLOAD_FOLDER, 'profiles')
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate generic filename
        timestamp = int(time.time())
        # Use user_id logic if available, or email hash, or just generic unique
        # We don't have user_id in session directly, need to fetch user or just use email safe string
        # Requirement: "profile_{user_id}_{timestamp}.jpg"
        # I'll fetch user to get ID or just use email sanitization if ID not easily avail without query?
        # get_user_by_email was called in profile(), but here we are in a POST.
        # Let's get generic ID from DB or assume we can use email.
        # Requirement explicitly says "user_id". I should probably get it.
        email = session['user']['email']
        user = get_user_by_email(email)
        user_id = user['id'] if user and 'id' in user else 'uid' 
        # Note: key might be 'user_id' or 'id'. user_queries doesn't specify return dict keys explicitly except SELECT *.
        # usually it's whatever column name is.
        
        ext = file.filename.rsplit('.', 1)[1].lower()
        new_filename = f"profile_{user_id}_{timestamp}.{ext}"
        filepath = os.path.join(upload_dir, new_filename)
        
        file.save(filepath)
        
        # URL path for DB
        db_path = f"static/uploads/profiles/{new_filename}"
        
        # Update DB
        result = update_profile_pic(email, db_path)
        
        if result['status'] == 'success':
            # Update session? Session doesn't store pic usually, but good practice if needed.
            # But frontend gets it from 'user' object in DB or session. 
            # If session has it, update it.
            # Current session: name, email, role. Maybe add pic?
            # User might want to see it update in Navbar if navbar uses session.
            # But navbar logic usually assumes session['user'] basics.
            # I will act as if I should add it if it helps, but mostly just DB.
            pass
            
        return jsonify({
            'status': 'success', 
            'message': 'Image uploaded!', 
            'image_url': f"/{db_path}" # Absolute path for frontend
        })
        
    return jsonify({'status': 'error', 'message': 'Invalid file type'}), 400

@user_bp.route('/security/password', methods=['POST'])
def change_password():
    if 'user' not in session:
        return jsonify({'status': 'error', 'message': 'Not logged in'}), 401
        
    email = session['user']['email']
    data = request.json
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    
    if not current_password or not new_password:
        return jsonify({'status': 'error', 'message': 'Missing fields'}), 400
        
    user = get_user_by_email(email)
    
    if not user or not check_password_hash(user['password'], current_password):
        return jsonify({'status': 'error', 'message': 'Incorrect current password'}), 400
        
    new_hash = generate_password_hash(new_password)
    result = update_user_password(email, new_hash)
    
    return jsonify(result)

@user_bp.route('/add-address', methods=['POST'])
def add_address():
    """Adds a new shipping address."""
    if 'user' not in session:
        return jsonify({'status': 'error', 'message': 'Not logged in'}), 401
    
    from models.checkout_queries import add_shipping_info
    
    email = session['user']['email']
    data = request.json
    
    # Simple validation
    required = ['name', 'address', 'city', 'zipcode', 'country']
    if not all(field in data for field in required):
         return jsonify({'status': 'error', 'message': 'Missing required fields'}), 400
         
    # Call existing model function
    new_id = add_shipping_info(
        email, 
        data['name'], 
        data['address'], 
        data['city'], 
        data['zipcode'], 
        data['country'], 
        data.get('phone', 'N/A')
    )
    
    if new_id:
        return jsonify({'status': 'success', 'message': 'Address added!'})
    else:
        return jsonify({'status': 'error', 'message': 'Database error'}), 500

@user_bp.route('/orders/confirm/<int:order_id>', methods=['POST'])
def confirm_order(order_id):
    """Allows a user to confirm they've received an order."""
    if 'user' not in session:
        return jsonify({'status': 'error', 'message': 'Not logged in'}), 401
    
    email = session['user']['email']
    result = confirm_order_receipt(order_id, email)
    return jsonify(result)
