import logging
from decimal import Decimal
import json
from flask import Blueprint, render_template, request, redirect, url_for, flash, session, current_app, jsonify
from mysql.connector import Error
from models.checkout_queries import MySQLShippingInfo
from models.cart_queries import get_cart_items

# Setup logging
logger = logging.getLogger(__name__)

# Blueprint setup
checkout_bp = Blueprint('checkout', __name__, template_folder='templates')

# Checkout page
@checkout_bp.route('/checkout', methods=['GET'])
def checkout_page():
    if 'user' not in session:
        flash('You need to login first.')
        return redirect(url_for('auth.login'))

    try:
        # Accept frontend cart as URL-safe JSON
        if request.args.get('cart'):
            try:
                cart_json = request.args.get('cart')
                session['cart'] = json.loads(cart_json)
            except Exception as e:
                logger.error(f"Cart JSON decode error for {session['user']['email']}: {e}")

        # Prefer session cart, fall back to DB
        cart_items = session.get('cart') or get_cart_items(session['user']['email'])

        if isinstance(cart_items, dict) and 'error' in cart_items:
            logger.error(f"❌ Error fetching cart for {session['user']['email']}: {cart_items['error']}")
            flash("Failed to retrieve cart items.")
            return redirect(url_for('cart.view_cart'))

        if not cart_items:
            flash('Your cart is empty!')
            return redirect(url_for('cart.view_cart'))

        # Validate cart item structure
        required_keys = {'art_id', 'price', 'quantity', 'title', 'image_path'}
        if not all(required_keys.issubset(item) for item in cart_items):
            logger.error(f"Invalid cart item structure for {session['user']['email']}")
            flash("Invalid cart data.")
            return redirect(url_for('cart.view_cart'))

        # Validate quantity type
        if not all(isinstance(item['quantity'], int) for item in cart_items):
            logger.error(f"Invalid quantity type in cart for {session['user']['email']}")
            flash("Invalid cart data.")
            return redirect(url_for('cart.view_cart'))

        # Calculate totals with Decimal
        try:
            subtotal = sum(Decimal(str(item['price'])) * item['quantity'] for item in cart_items)
        except ValueError as e:
            logger.error(f"Invalid price format for {session['user']['email']}: {e}")
            flash("Invalid cart data. Please try again.")
            return redirect(url_for('cart.view_cart'))

        shipping = Decimal('50.00')
        tax = (subtotal * Decimal('0.1')).quantize(Decimal('0.01'))
        total = subtotal + shipping + tax

        return render_template(
            'checkout.html',
            cart_items=cart_items,
            subtotal=subtotal,
            shipping=shipping,
            tax=tax,
            total=total
        )

    except Exception as e:
        logger.error(f"Checkout error for {session['user']['email']}: {e}")
        flash("Checkout failed. Please try again.")
        return redirect(url_for('cart.view_cart'))

# Process shipping information
@checkout_bp.route('/process_shipping', methods=['POST'])
def process_shipping():
    try:
        if 'user' not in session:
            logger.info("No user in session, redirecting to login")
            return jsonify({"error": "Login required to process shipping"}), 401

        fullname = request.form.get('fullname')
        email = session['user']['email']  # Use session email for consistency
        address = request.form.get('address')
        city = request.form.get('city')
        zipcode = request.form.get('zip')
        country = request.form.get('country')

        logger.info(f"Received shipping form: fullname={fullname}, email={email}, address={address}, city={city}, zipcode={zipcode}, country={country}")

        if not all([fullname, address, city, zipcode, country]):
            logger.info("Missing required fields")
            return jsonify({"error": "Please fill in all required fields"}), 400

        db_config = current_app.config['DB_CONFIG']
        shipping_db = MySQLShippingInfo(
            host=db_config['host'],
            database=db_config['database'],
            user=db_config['user'],
            password=db_config['password']
        )

        if not shipping_db.connect():
            logger.error("Database connection failed")
            return jsonify({"error": "Database connection failed"}), 500

        # Verify email exists in users table
        conn = current_app.db_pool.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT email FROM users WHERE email = %s", (email,))
        user_exists = cursor.fetchone()
        cursor.close()
        conn.close()

        if not user_exists:
            logger.error(f"Email {email} not found in users table")
            return jsonify({"error": "User email not registered"}), 400

        shipping_id = shipping_db.add_shipping_info(
            email=email,
            name=fullname,
            phone="N/A",
            address=address,
            city=city,
            zipcode=zipcode,
            country=country
        )

        shipping_db.close()

        if shipping_id:
            logger.info(f"Shipping info saved, ID: {shipping_id}")
            session['shipping_id'] = shipping_id
            # Clear cart
            conn = current_app.db_pool.get_connection()
            cursor = conn.cursor()
            cursor.execute("DELETE FROM cart WHERE email = %s", (email,))
            conn.commit()
            cursor.close()
            conn.close()
            session.pop('shipping_id', None)
            return jsonify({"message": "Shipping information saved successfully"}), 200
        else:
            logger.error("Failed to save shipping info")
            return jsonify({"error": "Failed to save shipping information"}), 500

    except Exception as e:
        logger.error(f"🔥 Error processing shipping info for {email}: {e}")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

# Register the Blueprint
def init_app(app):
    app.register_blueprint(checkout_bp)