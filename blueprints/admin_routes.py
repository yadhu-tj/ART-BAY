from flask import Blueprint, render_template, jsonify, request, session, redirect, url_for, current_app
from functools import wraps
from models.admin_queries import get_dashboard_metrics, get_users, update_user, get_artworks, update_artwork, delete_artwork, get_orders, get_order_details, get_settings, update_settings

admin_bp = Blueprint('admin', __name__, template_folder='templates')

# Admin-only decorator
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session or session['user'].get('role') != 'admin':
            current_app.logger.warning(f"Unauthorized access attempt to {f.__name__}")
            return redirect(url_for('auth.login', next=request.url))
        return f(*args, **kwargs)
    return decorated_function

@admin_bp.route('/')
@admin_required
def index():
    return redirect(url_for('admin.dashboard'))

@admin_bp.route('/dashboard')
@admin_required
def dashboard():
    try:
        current_app.logger.info("Dashboard route accessed")
        metrics = get_dashboard_metrics()
        if 'error' in metrics:
            current_app.logger.error(f"Failed to fetch metrics: {metrics['error']}")
            return render_template(
                'admin.html',
                admin_active_page='dashboard',  # Changed from active_page to admin_active_page
                error_message=f"Failed to load dashboard metrics: {metrics['error']}",
                metrics={}
            )
        
        debug_info = {
            'template_vars': {
                'admin_active_page': 'dashboard',  # Changed here too
                'metrics': metrics,
                'session_user': session.get('user', {})
            }
        }
        current_app.logger.debug(f"Dashboard debug info: {debug_info}")
        
        return render_template(
            'admin.html',
            admin_active_page='dashboard',  # Changed here
            metrics=metrics,
            error_message=None,
            debug_info=debug_info
        )
    except Exception as e:
        current_app.logger.error(f"Dashboard error: {str(e)}", exc_info=True)
        return render_template(
            'admin.html',
            admin_active_page='dashboard',  # Changed from active_page
            error_message=f"An error occurred: {str(e)}",
            metrics={}
        )

@admin_bp.route('/api/metrics', methods=['GET'])
@admin_required
def api_metrics():
    try:
        current_app.logger.info("API metrics route accessed")
        metrics = get_dashboard_metrics()
        if 'error' in metrics:
            current_app.logger.error(f"Failed to fetch metrics: {metrics['error']}")
            return jsonify({'error': metrics['error']}), 500
        return jsonify(metrics)
    except Exception as e:
        current_app.logger.error(f"API metrics error: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users')
@admin_required
def users():
    try:
        current_app.logger.info("Users route accessed")
        users_list = get_users('')
        if 'error' in users_list:
            current_app.logger.error(f"Failed to fetch users: {users_list['error']}")
            return render_template(
                'admin.html',
                admin_active_page='users',  # Changed from active_page
                error_message=f"Failed to load users: {users_list['error']}",
                users=[],
                metrics={}
            )
        return render_template(
            'admin.html',
            admin_active_page='users',  # Changed from active_page
            users=users_list,
            metrics={},
            error_message=None
        )
    except Exception as e:
        current_app.logger.error(f"Users page error: {str(e)}", exc_info=True)
        return render_template(
            'admin.html',
            admin_active_page='users',  # Changed from active_page
            error_message=f"An error occurred: {str(e)}",
            users=[],
            metrics={}
        )

@admin_bp.route('/api/users', methods=['GET'])
@admin_required
def api_users():
    try:
        current_app.logger.info("API users route accessed")
        search = request.args.get('search', '')
        users = get_users(search)
        if 'error' in users:
            current_app.logger.error(f"Failed to fetch users: {users['error']}")
            return jsonify({'error': users['error']}), 500
        return jsonify(users)
    except Exception as e:
        current_app.logger.error(f"API users error: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/update', methods=['POST'])
@admin_required
def update_user_route():
    try:
        data = request.get_json()
        email = data.get('email')
        name = data.get('name')
        role = data.get('role')
        
        if not all([email, name, role]):
            return jsonify({'status': 'error', 'message': 'All fields are required'}), 400
        
        # Import the update_user function
        from models.admin_queries import update_user
        
        result = update_user(email, name, role)
        if 'error' in result:
            return jsonify({'status': 'error', 'message': result['error']}), 400
        
        return jsonify({'status': 'success', 'message': 'User updated successfully'})
    except Exception as e:
        current_app.logger.error(f"Update user error: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

# Add this new route for user deletion
@admin_bp.route('/users/delete', methods=['POST'])
@admin_required
def delete_user_route():
    try:
        data = request.get_json()
        email = data.get('email')
        if not email:
            return jsonify({'status': 'error', 'message': 'Email required'}), 400
        
        # You'll need to add a delete_user function to your admin_queries.py
        from models.admin_queries import delete_user
        result = delete_user(email)
        
        if 'error' in result:
            return jsonify({'status': 'error', 'message': result['error']}), 400
        return jsonify({'status': 'success', 'message': 'User deleted successfully'})
    except Exception as e:
        current_app.logger.error(f"Delete user error: {str(e)}", exc_info=True)
        return jsonify({'status': 'error', 'message': str(e)}), 500

@admin_bp.route('/artworks')
@admin_required
def artworks():
    try:
        current_app.logger.info("Artworks route accessed")
        artworks_list = get_artworks('')
        if 'error' in artworks_list:
            current_app.logger.error(f"Failed to fetch artworks: {artworks_list['error']}")
            return render_template(
                'admin.html',
                admin_active_page='artworks',  # Changed from active_page
                error_message=f"Failed to load artworks: {artworks_list['error']}",
                artworks=[],
                metrics={}
            )
        return render_template(
            'admin.html',
            admin_active_page='artworks',  # Changed from active_page
            artworks=artworks_list,
            metrics={},
            error_message=None
        )
    except Exception as e:
        current_app.logger.error(f"Artworks page error: {str(e)}", exc_info=True)
        return render_template(
            'admin.html',
            admin_active_page='artworks',  # Changed from active_page
            error_message=f"An error occurred: {str(e)}",
            artworks=[],
            metrics={}
        )

@admin_bp.route('/api/artworks', methods=['GET'])
@admin_required
def api_artworks():
    try:
        current_app.logger.info("API artworks route accessed")
        search = request.args.get('search', '')
        artworks = get_artworks(search)
        if 'error' in artworks:
            current_app.logger.error(f"Failed to fetch artworks: {artworks['error']}")
            return jsonify({'error': artworks['error']}), 500
        return jsonify(artworks)
    except Exception as e:
        current_app.logger.error(f"API artworks error: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/artworks/update', methods=['POST'])
@admin_required
def update_artwork_route():
    try:
        data = request.get_json()
        art_id = data.get('id')
        title = data.get('title')
        price = data.get('price')
        if not all([art_id, title, price]) or not isinstance(float(price), (int, float)):
            return jsonify({'status': 'error', 'message': 'Invalid data'}), 400
        result = update_artwork(art_id, title, float(price))
        if 'error' in result:
            return jsonify({'status': 'error', 'message': result['error']}), 400
        return jsonify({'status': 'success', 'message': 'Artwork updated successfully'})
    except Exception as e:
        current_app.logger.error(f"Update artwork error: {str(e)}", exc_info=True)
        return jsonify({'status': 'error', 'message': str(e)}), 500

@admin_bp.route('/artworks/delete', methods=['POST'])
@admin_required
def delete_artwork_route():
    try:
        data = request.get_json()
        art_id = data.get('id')
        if not art_id:
            return jsonify({'status': 'error', 'message': 'Art ID required'}), 400
        result = delete_artwork(art_id)
        if 'error' in result:
            return jsonify({'status': 'error', 'message': result['error']}), 400
        return jsonify({'status': 'success', 'message': 'Artwork deleted successfully'})
    except Exception as e:
        current_app.logger.error(f"Delete artwork error: {str(e)}", exc_info=True)
        return jsonify({'status': 'error', 'message': str(e)}), 500

@admin_bp.route('/orders')
@admin_required
def orders():
    try:
        current_app.logger.info("Orders route accessed")
        orders_list = get_orders('')
        if 'error' in orders_list:
            current_app.logger.error(f"Failed to fetch orders: {orders_list['error']}")
            return render_template(
                'admin.html',
                admin_active_page='orders',  # Changed from active_page
                error_message=f"Failed to load orders: {orders_list['error']}",
                orders=[],
                metrics={}
            )
        return render_template(
            'admin.html',
            admin_active_page='orders',  # Changed from active_page
            orders=orders_list,
            metrics={},
            error_message=None
        )
    except Exception as e:
        current_app.logger.error(f"Orders page error: {str(e)}", exc_info=True)
        return render_template(
            'admin.html',
            admin_active_page='orders',  # Changed from active_page
            error_message=f"An error occurred: {str(e)}",
            orders=[],
            metrics={}
        )

@admin_bp.route('/api/orders', methods=['GET'])
@admin_required
def api_orders():
    try:
        current_app.logger.info("API orders route accessed")
        search = request.args.get('search', '')
        orders = get_orders(search)
        if 'error' in orders:
            current_app.logger.error(f"Failed to fetch orders: {orders['error']}")
            return jsonify({'error': orders['error']}), 500
        return jsonify(orders)
    except Exception as e:
        current_app.logger.error(f"API orders error: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/orders/details/<int:order_id>', methods=['GET'])
@admin_required
def order_details_route(order_id):
    try:
        current_app.logger.info(f"Order details route accessed for order_id: {order_id}")
        order = get_order_details(order_id)
        if 'error' in order:
            current_app.logger.error(f"Failed to fetch order details: {order['error']}")
            return jsonify({'status': 'error', 'message': order['error']}), 400
        return jsonify({'status': 'success', 'order': order})
    except Exception as e:
        current_app.logger.error(f"Order details error: {str(e)}", exc_info=True)
        return jsonify({'status': 'error', 'message': str(e)}), 500

@admin_bp.route('/settings')
@admin_required
def settings():
    try:
        current_app.logger.info("Settings route accessed")
        settings_data = get_settings()
        if 'error' in settings_data:
            current_app.logger.error(f"Failed to fetch settings: {settings_data['error']}")
            return render_template(
                'admin.html',
                admin_active_page='settings',  # Changed from active_page
                error_message=f"Failed to load settings: {settings_data['error']}",
                settings={},
                metrics={}
            )
        return render_template(
            'admin.html',
            admin_active_page='settings',  # Changed from active_page
            settings=settings_data,
            metrics={},
            error_message=None
        )
    except Exception as e:
        current_app.logger.error(f"Settings error: {str(e)}", exc_info=True)
        return render_template(
            'admin.html',
            admin_active_page='settings',  # Changed from active_page
            error_message=f"An error occurred: {str(e)}",
            settings={},
            metrics={}
        )

@admin_bp.route('/settings', methods=['POST'])
@admin_required
def update_settings_route():
    try:
        current_app.logger.info("Update settings route accessed")
        artist_approval = '1' if request.form.get('setting_artist_approval') == '1' else '0'
        result = update_settings({'artist_approval': artist_approval})
        if 'error' in result:
            current_app.logger.error(f"Failed to update settings: {result['error']}")
            return jsonify({'status': 'error', 'message': result['error']}), 400
        return jsonify({'status': 'success', 'message': 'Settings updated successfully'})
    except Exception as e:
        current_app.logger.error(f"Update settings error: {str(e)}", exc_info=True)
        return jsonify({'status': 'error', 'message': str(e)}), 500

@admin_bp.route('/debug')
@admin_required
def debug():
    try:
        current_app.logger.info("Debug route accessed")
        metrics = get_dashboard_metrics()
        debug_info = {
            'session_user': session.get('user', {}),
            'template_exists': current_app.jinja_env.get_template('admin.html') is not None,
            'routes': [rule.endpoint for rule in current_app.url_map.iter_rules() if rule.endpoint.startswith('admin')],
            'metrics': metrics
        }
        return render_template(
            'admin.html',
            admin_active_page='debug',  # Changed from active_page
            metrics=metrics,
            settings={},
            debug_info=debug_info,
            error_message=None
        )
    except Exception as e:
        current_app.logger.error(f"Debug error: {str(e)}", exc_info=True)
        return jsonify({
            'error': str(e),
            'session_user': session.get('user', {})
        }), 500