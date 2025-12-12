#!/usr/bin/env python3
"""
Test script to verify email service functionality
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.email_service import EmailService
from config.config import Config

def test_email_service():
    """Test the email service with a simple OTP email."""
    print("Testing Email Service...")
    print(f"Sender Email: {Config.SENDER_EMAIL}")
    print(f"Sender Password: {'*' * len(Config.SENDER_PASSWORD)}")
    
    # Test email service
    email_service = EmailService()
    
    # Test OTP email
    test_email = "cosmictraveller50@gmail.com"  # Use the same email as sender for testing
    test_otp = "123456"
    test_name = "Test User"
    
    print(f"\nSending test OTP email to: {test_email}")
    
    try:
        result = email_service.send_otp_email(test_email, test_otp, test_name)
        print(f"Result: {result}")
        
        if result['status'] == 'success':
            print("✅ Email service is working correctly!")
        else:
            print(f"❌ Email service failed: {result['message']}")
            
    except Exception as e:
        print(f"❌ Exception occurred: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_email_service() 