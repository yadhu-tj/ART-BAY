
import logging
import sys
import atexit
from flask import Flask, render_template, session
from config.config import Config
from mysql.connector import pooling

# Configure logging before imports
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

def create_app():
    """Initialize and configure the Flask application."""
    app = Flask(__name__)
    
    try:
        # Load configuration
        app.config.from_object(Config)
        logger.info("Configuration loaded successfully")

        # Initialize database pool
        def init_db_pool(app):
            if not hasattr(app, 'db_pool'):
                try:
                    app.db_pool = pooling.MySQLConnectionPool(
                        pool_name="mypool",
                        pool_size=5,
                        **app.config['DB_CONFIG']  # Use config from Flask app
                    )
                    logger.info("Database pool initialized successfully")
                except Exception as e:
                    logger.critical(f"Failed to initialize database pool: {str(e)}")
                    raise

        # Cleanup function
        def close_db():
            if hasattr(app, 'db_pool'):
                app.db_pool = None
                logger.info("Database pool cleanup completed")

        # Initialize database within app context
        with app.app_context():
            init_db_pool(app)
            atexit.register(close_db)  # Register cleanup

        # Import blueprints after app creation to avoid circular imports
        from blueprints.auth.routes import auth_bp
        from blueprints.art_routes import art_bp
        from blueprints.artist_routes import artist_bp
        from blueprints.cart_routes import cart_bp
        from blueprints.artist_dashboard_routes import artist_dashboard_bp
        from blueprints.checkout_routes import checkout_bp
        from blueprints.admin_routes import admin_bp  # Import admin blueprint

        # Context Processor
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
            logger.info(f"Gallery artworks: {artworks}")
            return render_template('gallery.html', artworks=artworks)

        # Error Handlers
        @app.errorhandler(404)
        def not_found_error(error):
            return render_template('404.html'), 404

        @app.errorhandler(Exception)
        def handle_exception(e):
            logger.error(f"Unhandled exception: {str(e)}", exc_info=True)
            return render_template('error.html', error=str(e)), 500

        # Register Blueprints
        app.register_blueprint(auth_bp, url_prefix='/auth')
        app.register_blueprint(art_bp, url_prefix='/art')
        app.register_blueprint(artist_bp, url_prefix='/artist')
        app.register_blueprint(cart_bp, url_prefix='/cart')
        app.register_blueprint(artist_dashboard_bp, url_prefix='/artist_dashboard')
        app.register_blueprint(checkout_bp, url_prefix='/checkout')
        app.register_blueprint(admin_bp, url_prefix='/admin')  # Register admin blueprint
        logger.info("Blueprints registered")

        return app

    except Exception as e:
        logger.critical(f"Application initialization failed: {str(e)}", exc_info=True)
        raise

if __name__ == "__main__":
    app = create_app()
    try:
        logger.info("Starting development server")
        app.run(host='0.0.0.0', port=5000, debug=True)
    except Exception as e:
        logger.critical(f"Server startup failed: {str(e)}")
        sys.exit(1)