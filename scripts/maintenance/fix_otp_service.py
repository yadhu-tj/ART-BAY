#!/usr/bin/env python3
"""
OTP Service Diagnostic and Fix Script
This script will:
1. Check if the OTP table exists
2. Fix the table structure if needed
3. Test email configuration
4. Test OTP generation and storage
"""

import sys
import os
import mysql.connector
from dotenv import load_dotenv

# Load environment variables
load_dotenv('dotenv.env')

def get_db_connection():
    """Get database connection."""
    try:
        conn = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', ''),
            database=os.getenv('DB_NAME', 'online_art_gallery_database_final')
        )
        return conn
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return None

def check_otp_table():
    """Check if OTP table exists and has correct structure."""
    print("\n" + "="*60)
    print("STEP 1: Checking OTP Table Structure")
    print("="*60)
    
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor()
        
        # Check if table exists
        cursor.execute("SHOW TABLES LIKE 'otp_codes'")
        if not cursor.fetchone():
            print("❌ OTP table does not exist!")
            return False
        
        print("✅ OTP table exists")
        
        # Check table structure
        cursor.execute("DESCRIBE otp_codes")
        columns = cursor.fetchall()
        column_names = [col[0] for col in columns]
        
        print(f"\nCurrent table structure:")
        for col in columns:
            print(f"  - {col[0]}: {col[1]} {col[2]} {col[3]} {col[4]} {col[5]}")
        
        # Check for UNIQUE constraint on email
        cursor.execute("SHOW INDEXES FROM otp_codes WHERE Column_name = 'email'")
        indexes = cursor.fetchall()
        
        has_unique = False
        for idx in indexes:
            if idx[1] == 0:  # Non_unique = 0 means UNIQUE
                has_unique = True
                break
        
        if not has_unique:
            print("\n⚠️  Missing UNIQUE constraint on email column!")
            print("   This is required for OTP service to work properly.")
            return False
        
        print("\n✅ UNIQUE constraint exists on email column")
        return True
        
    except Exception as e:
        print(f"❌ Error checking table: {e}")
        return False
    finally:
        conn.close()

def fix_otp_table():
    """Fix the OTP table structure."""
    print("\n" + "="*60)
    print("STEP 2: Fixing OTP Table Structure")
    print("="*60)
    
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor()
        
        # Check if table exists, if not create it
        cursor.execute("SHOW TABLES LIKE 'otp_codes'")
        if not cursor.fetchone():
            print("Creating OTP table...")
            cursor.execute("""
                CREATE TABLE otp_codes (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    email VARCHAR(255) NOT NULL UNIQUE,
                    otp VARCHAR(6) NOT NULL,
                    expiry_time DATETIME NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_email (email),
                    INDEX idx_expiry (expiry_time)
                )
            """)
            conn.commit()
            print("✅ OTP table created successfully")
            return True
        
        # Table exists, check if we need to add UNIQUE constraint
        cursor.execute("SHOW INDEXES FROM otp_codes WHERE Column_name = 'email'")
        indexes = cursor.fetchall()
        
        has_unique = False
        for idx in indexes:
            if idx[1] == 0:  # Non_unique = 0 means UNIQUE
                has_unique = True
                break
        
        if not has_unique:
            print("Adding UNIQUE constraint to email column...")
            try:
                # First, remove any duplicate emails (keep the most recent)
                cursor.execute("""
                    DELETE t1 FROM otp_codes t1
                    INNER JOIN otp_codes t2 
                    WHERE t1.id < t2.id AND t1.email = t2.email
                """)
                conn.commit()
                
                # Add UNIQUE constraint
                cursor.execute("ALTER TABLE otp_codes ADD UNIQUE KEY unique_email (email)")
                conn.commit()
                print("✅ UNIQUE constraint added successfully")
                return True
            except Exception as e:
                print(f"❌ Error adding UNIQUE constraint: {e}")
                print("\nTrying alternative method...")
                # Alternative: Drop and recreate table
                try:
                    cursor.execute("DROP TABLE otp_codes")
                    cursor.execute("""
                        CREATE TABLE otp_codes (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            email VARCHAR(255) NOT NULL UNIQUE,
                            otp VARCHAR(6) NOT NULL,
                            expiry_time DATETIME NOT NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            INDEX idx_email (email),
                            INDEX idx_expiry (expiry_time)
                        )
                    """)
                    conn.commit()
                    print("✅ Table recreated with UNIQUE constraint")
                    return True
                except Exception as e2:
                    print(f"❌ Error recreating table: {e2}")
                    return False
        else:
            print("✅ Table structure is correct")
            return True
            
    except Exception as e:
        print(f"❌ Error fixing table: {e}")
        return False
    finally:
        conn.close()

def test_email_config():
    """Test email configuration."""
    print("\n" + "="*60)
    print("STEP 3: Testing Email Configuration")
    print("="*60)
    
    try:
        from config.config import Config
        
        sender_email = Config.SENDER_EMAIL
        sender_password = Config.SENDER_PASSWORD
        
        if not sender_email or sender_email == 'your-email@gmail.com':
            print("❌ SENDER_EMAIL not configured in dotenv.env")
            return False
        
        if not sender_password or sender_password == 'your-app-password':
            print("❌ SENDER_PASSWORD not configured in dotenv.env")
            return False
        
        print(f"✅ Sender Email: {sender_email}")
        print(f"✅ Sender Password: {'*' * len(sender_password)} (configured)")
        
        # Test email service
        try:
            from services.email_service import EmailService
            email_service = EmailService()
            
            if email_service.sender_email != sender_email:
                print("❌ Email service not using configured email")
                return False
            
            print("✅ Email service initialized correctly")
            return True
            
        except Exception as e:
            print(f"❌ Error initializing email service: {e}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing email config: {e}")
        return False

def test_otp_storage():
    """Test OTP generation and storage."""
    print("\n" + "="*60)
    print("STEP 4: Testing OTP Storage")
    print("="*60)
    
    try:
        from models.otp_queries import generate_otp, store_otp, verify_otp
        
        # Generate OTP
        otp = generate_otp()
        print(f"✅ Generated OTP: {otp}")
        
        # Store OTP
        test_email = "test@example.com"
        result = store_otp(test_email, otp)
        
        if result.get('status') != 'success':
            print(f"❌ Failed to store OTP: {result.get('message')}")
            return False
        
        print("✅ OTP stored successfully")
        
        # Verify OTP
        verify_result = verify_otp(test_email, otp)
        if verify_result.get('status') != 'success':
            print(f"❌ Failed to verify OTP: {verify_result.get('message')}")
            return False
        
        print("✅ OTP verified successfully")
        
        # Test duplicate email (should update, not fail)
        otp2 = generate_otp()
        result2 = store_otp(test_email, otp2)
        if result2.get('status') != 'success':
            print(f"❌ Failed to update OTP: {result2.get('message')}")
            return False
        
        print("✅ OTP update (duplicate email) works correctly")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing OTP storage: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_email_sending():
    """Test sending an actual email."""
    print("\n" + "="*60)
    print("STEP 5: Testing Email Sending")
    print("="*60)
    
    try:
        from services.email_service import EmailService
        from config.config import Config
        
        email_service = EmailService()
        test_email = Config.SENDER_EMAIL  # Send to yourself for testing
        test_otp = "123456"
        
        print(f"Sending test email to: {test_email}")
        result = email_service.send_otp_email(test_email, test_otp, "Test User")
        
        if result.get('status') == 'success':
            print("✅ Test email sent successfully!")
            print("   Check your inbox for the OTP email.")
            return True
        else:
            print(f"❌ Failed to send email: {result.get('message')}")
            print("\nCommon issues:")
            print("1. Gmail App Password might be incorrect")
            print("2. 2-Factor Authentication might not be enabled")
            print("3. 'Less secure app access' might be disabled")
            print("4. Check your internet connection")
            return False
            
    except Exception as e:
        print(f"❌ Error sending test email: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all diagnostic tests."""
    print("\n" + "="*60)
    print("ART&BAY OTP Service Diagnostic Tool")
    print("="*60)
    
    results = {
        'table_check': False,
        'table_fixed': False,
        'email_config': False,
        'otp_storage': False,
        'email_sending': False
    }
    
    # Step 1: Check table
    results['table_check'] = check_otp_table()
    
    # Step 2: Fix table if needed
    if not results['table_check']:
        results['table_fixed'] = fix_otp_table()
        if results['table_fixed']:
            # Re-check
            results['table_check'] = check_otp_table()
    
    # Step 3: Test email config
    results['email_config'] = test_email_config()
    
    # Step 4: Test OTP storage
    if results['table_check']:
        results['otp_storage'] = test_otp_storage()
    
    # Step 5: Test email sending (optional)
    if results['email_config']:
        response = input("\nDo you want to test sending an actual email? (y/n): ")
        if response.lower() == 'y':
            results['email_sending'] = test_email_sending()
    
    # Summary
    print("\n" + "="*60)
    print("DIAGNOSTIC SUMMARY")
    print("="*60)
    print(f"Table Structure: {'✅ PASS' if results['table_check'] else '❌ FAIL'}")
    print(f"Email Configuration: {'✅ PASS' if results['email_config'] else '❌ FAIL'}")
    print(f"OTP Storage: {'✅ PASS' if results['otp_storage'] else '❌ FAIL'}")
    print(f"Email Sending: {'✅ PASS' if results['email_sending'] else '⏭️  SKIPPED' if not results['email_config'] else '❌ FAIL'}")
    
    if all([results['table_check'], results['email_config'], results['otp_storage']]):
        print("\n✅ All critical tests passed! OTP service should work now.")
    else:
        print("\n❌ Some tests failed. Please fix the issues above.")
        print("\nCommon fixes:")
        print("1. Run this script to fix the database table")
        print("2. Check your dotenv.env file for correct email credentials")
        print("3. Ensure Gmail App Password is correct")
        print("4. Make sure 2-Factor Authentication is enabled on Gmail")

if __name__ == "__main__":
    main()

