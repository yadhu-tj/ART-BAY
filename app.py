import logging
import sys
from flask import Flask, render_template, session
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
    app.config.from_object(Config)

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

    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(art_bp, url_prefix='/art')
    app.register_blueprint(artist_bp, url_prefix='/artist')
    app.register_blueprint(cart_bp, url_prefix='/cart')
    app.register_blueprint(artist_dashboard_bp, url_prefix='/artist-dashboard')
    app.register_blueprint(checkout_bp, url_prefix='/checkout')
    app.register_blueprint(admin_bp, url_prefix='/admin')

    # Context Processor to make user available in all templates
    @app.context_processor
    def inject_user():
        return {'user': session.get('user')}

    # Core Routes
    @app.route('/')
    def home():
        return render_template('index.html')

    @app.route('/gallery')
    def gallery():
        from models.art_queries import get_all_artworks
        artworks = get_all_artworks()
        return render_template('gallery.html', artworks=artworks)

    # Error Handlers
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
    app.run(host='0.0.0.0', port=5000, debug=True)