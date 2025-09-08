import logging
import json
from decimal import Decimal
from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify, current_app
from models.cart_queries import get_cart_items, clear_cart
from models.checkout_queries import add_shipping_info, create_order_and_get_id, add_order_items

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

        # Get form data
        shipping_data = {
            'firstName': request.form.get('firstName'),
            'lastName': request.form.get('lastName'),
            'email': request.form.get('email'),
            'phone': request.form.get('phone'),
            'address': request.form.get('address'),
            'city': request.form.get('city'),
            'state': request.form.get('state'),
            'zipCode': request.form.get('zipCode'),
            'country': request.form.get('country')
        }

        logger.info(f"Received shipping form: {shipping_data}")

        # Validate required fields
        required_fields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zipCode', 'country']
        missing_fields = [field for field in required_fields if not shipping_data.get(field)]
        
        if missing_fields:
            logger.info(f"Missing required fields: {missing_fields}")
            return jsonify({"error": "Please fill in all required fields"}), 400

        # Store shipping data in session for payment step
        session['shipping_data'] = shipping_data

        return jsonify({
            "status": "success",
            "message": "Shipping information saved successfully"
        }), 200

    except Exception as e:
        logger.error(f"🔥 Error processing shipping info: {e}")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

# Process payment (fake payment system)
@checkout_bp.route('/process_payment', methods=['POST'])
def process_payment():
    try:
        if 'user' not in session:
            return jsonify({"error": "Login required to process payment"}), 401

        if 'shipping_data' not in session:
            return jsonify({"error": "Shipping information required"}), 400

        # Get payment data
        payment_data = {
            'method': request.form.get('paymentMethod'),
            'cardNumber': request.form.get('cardNumber', '').replace(' ', ''),
            'expiryDate': request.form.get('expiryDate'),
            'cvv': request.form.get('cvv'),
            'cardName': request.form.get('cardName')
        }

        logger.info(f"Processing payment for {session['user']['email']}")
        logger.info(f"Payment data received: {payment_data}")
        logger.info(f"Session shipping data: {session.get('shipping_data')}")
        logger.info(f"Session cart: {session.get('cart')}")

        # Validate payment data
        if not payment_data['method']:
            logger.error("Payment method not provided")
            return jsonify({"error": "Payment method is required"}), 400

        if payment_data['method'] == 'card':
            if not payment_data['cardNumber'] or not payment_data['expiryDate'] or not payment_data['cvv'] or not payment_data['cardName']:
                logger.error("Missing required card payment fields")
                return jsonify({"error": "Please fill in all required card payment fields"}), 400

        # Simulate payment processing
        # In a real application, this would integrate with a payment gateway
        import time
        time.sleep(2)  # Simulate processing time

        # Simulate 90% success rate
        import random
        if random.random() > 0.1:  # 90% success rate
            # Create order in database
            try:
                # Get cart items
                cart_items = session.get('cart') or get_cart_items(session['user']['email'])
                
                if not cart_items:
                    return jsonify({"error": "No items in cart"}), 400

                # Calculate total
                subtotal = sum(Decimal(str(item['price'])) * item['quantity'] for item in cart_items)
                shipping = Decimal('50.00')
                tax = (subtotal * Decimal('0.1')).quantize(Decimal('0.01'))
                total = subtotal + shipping + tax

                # Create order
                order_id = create_order_and_get_id(
                    session['user']['email'],
                    float(total)
                )

                if order_id:
                    # Add order items
                    add_order_items(order_id, cart_items)

                    # Clear cart
                    clear_result = clear_cart(session['user']['email'])
                    if 'error' in clear_result:
                        logger.error(f"Failed to clear cart: {clear_result['error']}")
                    else:
                        logger.info(f"Cart cleared successfully for {session['user']['email']}")
                    
                    session.pop('cart', None)
                    session.pop('shipping_data', None)

                    logger.info(f"Order created successfully: {order_id}")
                    
                    return jsonify({
                        "status": "success",
                        "message": "Payment processed successfully!",
                        "order_id": order_id
                    }), 200
                else:
                    return jsonify({"error": "Failed to create order"}), 500

            except Exception as e:
                logger.error(f"Error creating order: {e}")
                return jsonify({"error": "Failed to process order"}), 500

        else:
            # Simulate payment failure
            return jsonify({"error": "Payment failed. Please try again."}), 400

    except Exception as e:
        logger.error(f"Payment processing error: {e}")
        return jsonify({"error": "An error occurred during payment processing"}), 500

# Get order confirmation
@checkout_bp.route('/order_confirmation/<int:order_id>')
def order_confirmation(order_id):
    if 'user' not in session:
        return redirect(url_for('auth.login'))

    try:
        # In a real application, you would fetch order details from database
        # For now, we'll just show a success page
        return render_template('order_confirmation.html', order_id=order_id)
    except Exception as e:
        logger.error(f"Error showing order confirmation: {e}")
        flash("Error loading order confirmation.")
        return redirect(url_for('home'))

# Debug route to check cart status
@checkout_bp.route('/debug/cart_status')
def debug_cart_status():
    if 'user' not in session:
        return jsonify({"error": "Not logged in"}), 401
    
    try:
        cart_items = get_cart_items(session['user']['email'])
        return jsonify({
            "user_email": session['user']['email'],
            "cart_items": cart_items,
            "cart_count": len(cart_items) if not isinstance(cart_items, dict) else 0,
            "session_cart": session.get('cart'),
            "session_shipping": session.get('shipping_data')
        })
    except Exception as e:
        logger.error(f"Error checking cart status: {e}")
        return jsonify({"error": str(e)}), 500

# Register the Blueprint
def init_app(app):
    app.register_blueprint(checkout_bp)