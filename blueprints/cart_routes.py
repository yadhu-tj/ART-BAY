from flask import Blueprint, request, jsonify, session, redirect, url_for, render_template, current_app
from models.cart_queries import add_to_cart, get_cart_items, remove_from_cart

cart_bp = Blueprint('cart', __name__, template_folder='templates')

@cart_bp.route('/', methods=['GET'])
def view_cart():
    try:
        if 'user' not in session:
            current_app.logger.info("Redirecting to login: User not in session")
            return redirect(url_for('auth.login'))

        email = session['user']['email']
        current_app.logger.info(f"Viewing cart for {email}")
        cart_items = get_cart_items(email)

        if isinstance(cart_items, dict) and 'error' in cart_items:
            current_app.logger.error(f"❌ Error fetching cart items: {cart_items['error']}")
            return jsonify(cart_items), 500

        total_price = sum(item['price'] * item['quantity'] for item in cart_items)
        current_app.logger.info(f"Cart rendered: {len(cart_items)} items, total: {total_price}")
        return render_template('cart.html', cart_items=cart_items, total_price=total_price)
    except Exception as e:
        current_app.logger.error(f"🔥 ERROR in view_cart: {str(e)}")
        return jsonify({'error': 'Server error'}), 500

@cart_bp.route('/add', methods=['POST'])
def add_to_cart_route():
    try:
        if 'user' not in session:
            current_app.logger.warning("🚫 Unauthorized access attempt to /cart/add")
            return jsonify({'error': 'Unauthorized access'}), 401

        email = session['user']['email']
        data = request.get_json() or {}
        art_id = data.get('art_id')

        if not art_id:
            current_app.logger.warning("Missing artwork ID in /cart/add request")
            return jsonify({'error': 'Missing artwork ID'}), 400

        result = add_to_cart(email, art_id)
        if 'error' in result:
            current_app.logger.error(f"❌ Error adding to cart: {result['error']}")
            return jsonify(result), 500

        current_app.logger.info(f"✅ Artwork {art_id} added to cart by {email}")
        return jsonify({'status': 'success', 'message': 'Artwork added to cart successfully'}), 200
    except Exception as e:
        current_app.logger.error(f"🔥 ERROR in add_to_cart_route: {str(e)}")
        return jsonify({'error': 'Server error'}), 500

@cart_bp.route('/items', methods=['GET'])
def cart_items_route():
    try:
        current_app.logger.info(f"Received request to /cart/items")
        if 'user' not in session:
            current_app.logger.warning("🚫 Unauthorized access attempt to /cart/items")
            return jsonify({'error': 'Unauthorized access'}), 401

        email = session['user']['email']
        current_app.logger.info(f"Fetching cart items for {email}")
        cart_items = get_cart_items(email)

        if isinstance(cart_items, dict) and 'error' in cart_items:
            current_app.logger.error(f"❌ Error fetching cart items: {cart_items['error']}")
            return jsonify(cart_items), 500

        total_price = sum(item['price'] * item['quantity'] for item in cart_items)
        current_app.logger.info(f"Returning {len(cart_items)} cart items, total: {total_price}")
        return jsonify({"status": "success", "cart_items": cart_items, "total_price": total_price}) , 200
    except Exception as e:
        current_app.logger.error(f"🔥 ERROR in cart_items_route: {str(e)}")
        return jsonify({'error': 'Server error'}), 500

@cart_bp.route('/remove', methods=['POST'])
def remove_from_cart_route():
    try:
        current_app.logger.info(f"Received request to /cart/remove")
        if 'user' not in session:
            current_app.logger.warning("🚫 Unauthorized access attempt to /cart/remove")
            return jsonify({'error': 'Unauthorized access'}), 401

        cart_id = request.form.get('cart_id')
        current_app.logger.info(f"Attempting to remove cart_id: {cart_id}")

        if not cart_id:
            current_app.logger.warning("Missing cart ID in /cart/remove request")
            return jsonify({'error': 'Missing cart ID'}), 400

        result = remove_from_cart(cart_id)

        if 'error' in result:
            current_app.logger.error(f"❌ Error removing from cart: {result['error']}")
            return jsonify(result), 500

        current_app.logger.info(f"✅ Item {cart_id} removed from cart")
        return jsonify({'status': 'success', 'message': 'Artwork removed from cart successfully'}), 200
    except Exception as e:
        current_app.logger.error(f"🔥 ERROR in remove_from_cart_route: {str(e)}")
        return jsonify({'error': 'Server error'}), 500              
    