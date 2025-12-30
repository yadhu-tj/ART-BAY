import logging
import sys
import os
from flask import Flask, render_template, session

# Import the Config class
from config.config import Config
from models.database import init_db_pool, close_db_connection

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

def create_app():
    """Initialize and configure the Flask application."""
    app = Flask(__name__)

    # --- THIS IS THE KEY CHANGE ---
    # Load the configuration from the Config class
    app.config.from_object(Config)
   
    # --- END OF CHANGE ---

    # Initialize and register database functions
    init_db_pool(app)
    app.teardown_appcontext(close_db_connection)

    # Import and register blueprints
    from blueprints.auth.routes import auth_bp
    from blueprints.art_routes import art_bp
    from blueprints.artist_routes import artist_bp
    from blueprints.cart_routes import cart_bp
    from blueprints.artist_dashboard_routes import artist_dashboard_bp
    from blueprints.checkout_routes import checkout_bp
    from blueprints.admin_routes import admin_bp
    from blueprints.info_routes import info_bp
    from blueprints.user_routes import user_bp

    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(art_bp, url_prefix='/art')
    app.register_blueprint(artist_bp, url_prefix='/artist')
    app.register_blueprint(cart_bp, url_prefix='/cart')
    app.register_blueprint(artist_dashboard_bp, url_prefix='/artist-dashboard')
    app.register_blueprint(checkout_bp, url_prefix='/checkout')
    app.register_blueprint(admin_bp, url_prefix='/admin')
    app.register_blueprint(info_bp)
    app.register_blueprint(user_bp, url_prefix='/profile')

    @app.context_processor
    def inject_user():
        return {'user': session.get('user')}

    @app.route('/')
    def home():
        return render_template('index.html')

    @app.route('/gallery')
    def gallery():
        from flask import request
        from models.art_queries import get_filtered_artworks
        
        # Capture all filter params from URL
        filters = {
            'media': request.args.get('category') or request.args.get('media'),
            'search': request.args.get('search'),
            'price': request.args.get('price'),
            'sort': request.args.get('sort', 'newest')
        }
            
        result = get_filtered_artworks(filters)
        artworks = result.get('artworks', [])
        
        return render_template('gallery.html', artworks=artworks)

    @app.errorhandler(404)
    def not_found_error(error):
        return render_template('404.html'), 404

    @app.errorhandler(Exception)
    def handle_exception(e):
        logging.error(f"Unhandled exception: {str(e)}", exc_info=True)
        return render_template('error.html', error=str(e)), 500

    return app

if __name__ == "__main__":
    app = create_app()
    port = int(os.environ.get('PORT', 5000))
    debug_mode = os.environ.get('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug_mode)