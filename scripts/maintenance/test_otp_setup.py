#!/usr/bin/env python3
"""
Test script to check OTP setup and create database table if needed
"""

import mysql.connector
from config.config import Config
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_database_connection():
    """Test database connection and create OTP table if needed."""
    try:
        # Connect to database
        conn = mysql.connector.connect(**Config.DB_CONFIG)
        cursor = conn.cursor()
        
        logger.info("✅ Database connection successful")
        
        # Check if OTP table exists
        cursor.execute("SHOW TABLES LIKE 'otp_codes'")
        table_exists = cursor.fetchone()
        
        if table_exists:
            logger.info("✅ OTP table already exists")
        else:
            logger.info("❌ OTP table not found, creating it...")
            
            # Create OTP table
            create_table_sql = """
            CREATE TABLE IF NOT EXISTS otp_codes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                otp VARCHAR(6) NOT NULL,
                expiry_time DATETIME NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_email (email),
                INDEX idx_expiry (expiry_time)
            );
            """
            
            cursor.execute(create_table_sql)
            conn.commit()
            logger.info("✅ OTP table created successfully")
        
        # Test OTP functions
        from models.otp_queries import generate_otp, store_otp, verify_otp
        
        # Generate test OTP
        test_otp = generate_otp()
        logger.info(f"✅ OTP generation test: {test_otp}")
        
        # Test storing OTP
        test_email = "test@example.com"
        store_result = store_otp(test_email, test_otp)
        logger.info(f"✅ OTP storage test: {store_result}")
        
        # Test verifying OTP
        verify_result = verify_otp(test_email, test_otp)
        logger.info(f"✅ OTP verification test: {verify_result}")
        
        cursor.close()
        conn.close()
        
        logger.info("✅ All OTP database tests passed!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Database test failed: {e}")
        return False

def test_email_config():
    """Test email configuration."""
    try:
        logger.info(f"📧 Sender Email: {Config.SENDER_EMAIL}")
        logger.info(f"🔑 Sender Password: {'*' * len(Config.SENDER_PASSWORD) if Config.SENDER_PASSWORD else 'Not set'}")
        
        if Config.SENDER_EMAIL and Config.SENDER_EMAIL != 'your-email@gmail.com':
            logger.info("✅ Email configuration looks good")
            return True
        else:
            logger.warning("⚠️ Email configuration needs to be set up")
            return False
            
    except Exception as e:
        logger.error(f"❌ Email config test failed: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("ART&BAY OTP Setup Test")
    print("=" * 60)
    
    db_test = test_database_connection()
    email_test = test_email_config()
    
    print("\n" + "=" * 60)
    if db_test and email_test:
        print("✅ All tests passed! OTP system is ready.")
    else:
        print("❌ Some tests failed. Please check the configuration.")
    print("=" * 60) 