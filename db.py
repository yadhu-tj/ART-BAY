import mysql.connector
import os

def init_db_connection(app):
    connection = mysql.connector.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        user=os.getenv('DB_USER', 'root'),
        password=os.getenv('DB_PASSWORD', ''),
        database=os.getenv('DB_NAME', 'online_art_gallery_database_final')
    )
    app.config['DB_CONNECTION'] = connection
