import logging
import mysql.connector
from mysql.connector import pooling
from flask import current_app, g

logger = logging.getLogger(__name__)

def init_db_pool(app):
    try:
        db_config = app.config['DB_CONFIG']
        app.db_pool = pooling.MySQLConnectionPool(pool_name="mypool", pool_size=5, **db_config)
        logger.info("✅ Database connection pool initialized successfully.")
    except Exception as e:
        logger.critical(f"❌ Failed to initialize database pool: {e}")
        raise

def get_db_connection():
    if 'db_conn' not in g:
        try:
            g.db_conn = current_app.db_pool.get_connection()
        except Exception as e:
            logger.error(f"❌ Failed to get connection from pool: {e}")
            raise
    return g.db_conn

def close_db_connection(e=None):
    db_conn = g.pop('db_conn', None)
    if db_conn is not None:
        db_conn.close()