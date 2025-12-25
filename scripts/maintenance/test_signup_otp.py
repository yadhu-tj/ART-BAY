#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models.user_queries import get_user_by_email
from models.otp_queries import generate_otp, store_otp, verify_otp

def test_signup_otp():
    app = create_app()
    
    with app.app_context():
        print("Testing Signup OTP functionality...")
        
        # Test email
        test_email = "test_signup@example.com"
        test_name = "Test User"
        test_password = "password123"
        
        # Check if user exists
        existing_user = get_user_by_email(test_email)
        if existing_user:
            print(f"⚠️  User {test_email} already exists")
        else:
            print(f"✅ User {test_email} does not exist (good for testing)")
        
        # Test OTP generation and storage
        print("\n1. Testing OTP generation and storage...")
        otp_code = generate_otp()
        print(f"Generated OTP: {otp_code}")
        
        store_result = store_otp(test_email, otp_code)
        print(f"Store result: {store_result}")
        
        # Test OTP verification
        print("\n2. Testing OTP verification...")
        verify_result = verify_otp(test_email, otp_code)
        print(f"Verify result: {verify_result}")
        
        # Test with wrong OTP
        print("\n3. Testing with wrong OTP...")
        wrong_verify = verify_otp(test_email, "000000")
        print(f"Wrong OTP result: {wrong_verify}")
        
        print("\n✅ Signup OTP functionality test completed!")

if __name__ == "__main__":
    test_signup_otp() 