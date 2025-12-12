import logging
import random
import string
from datetime import datetime, timedelta
from mysql.connector import Error
from .database import get_db_connection

logger = logging.getLogger(__name__)

def generate_otp():
    """Generate a 6-digit OTP."""
    return ''.join(random.choices(string.digits, k=6))

def store_otp(email, otp, expiry_minutes=10):
    """Store OTP in database using an atomic upsert to prevent deadlocks."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        expiry_time = datetime.now() + timedelta(minutes=expiry_minutes)
        
        # This query will INSERT a new OTP, or UPDATE the existing one for that email.
        # IMPORTANT: This requires a UNIQUE constraint on the email column
        query = """
            INSERT INTO otp_codes (email, otp, expiry_time) 
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE otp = VALUES(otp), expiry_time = VALUES(expiry_time)
        """
        
        cursor.execute(query, (email, otp, expiry_time))
        conn.commit()
        return {"status": "success", "message": "OTP stored successfully"}
    except Error as e:
        conn.rollback()
        error_msg = str(e)
        logger.error(f"DB error in store_otp: {e}")
        
        # Provide helpful error message for common issues
        if "Duplicate entry" in error_msg or "ON DUPLICATE KEY UPDATE" in error_msg:
            return {
                "status": "error", 
                "message": "Database configuration error: OTP table missing UNIQUE constraint on email column. Run fix_otp_service.py to fix this."
            }
        elif "Table" in error_msg and "doesn't exist" in error_msg:
            return {
                "status": "error",
                "message": "OTP table does not exist. Please create it using database/otp_table.sql"
            }
        
        return {"status": "error", "message": f"Database error: {error_msg}"}

def verify_otp(email, otp):
    """Verify OTP for given email."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get OTP and check if it's valid and not expired
        cursor.execute(
            "SELECT * FROM otp_codes WHERE email = %s AND otp = %s AND expiry_time > NOW()",
            (email, otp)
        )
        result = cursor.fetchone()
        
        if result:
            # Delete the used OTP
            cursor.execute("DELETE FROM otp_codes WHERE email = %s", (email,))
            conn.commit()
            return {"status": "success", "message": "OTP verified successfully"}
        else:
            return {"status": "error", "message": "Invalid or expired OTP"}
    except Error as e:
        logger.error(f"DB error in verify_otp: {e}")
        return {"status": "error", "message": str(e)}

def cleanup_expired_otp():
    """Clean up expired OTP codes."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM otp_codes WHERE expiry_time < NOW()")
        conn.commit()
        return {"status": "success", "message": "Expired OTPs cleaned up"}
    except Error as e:
        logger.error(f"DB error in cleanup_expired_otp: {e}")
        return {"status": "error", "message": str(e)} 