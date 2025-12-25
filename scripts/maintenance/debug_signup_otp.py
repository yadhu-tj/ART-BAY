#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import requests
import json

def test_signup_otp_flow():
    base_url = "http://localhost:5000"
    
    print("🔍 Testing Signup OTP Flow...")
    
    # Test 1: Check if signup page loads
    print("\n1. Testing signup page load...")
    try:
        response = requests.get(f"{base_url}/auth/signup")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Signup page loads successfully")
            # Check if OTP elements are present
            content = response.text
            if "userInfoStep" in content and "otpStep" in content:
                print("✅ OTP elements found in HTML")
            else:
                print("❌ OTP elements missing from HTML")
        else:
            print(f"❌ Signup page failed to load: {response.text}")
    except Exception as e:
        print(f"❌ Error loading signup page: {e}")
    
    # Test 2: Test send-signup-otp endpoint
    print("\n2. Testing send-signup-otp endpoint...")
    try:
        data = {
            "email": "test_debug@example.com",
            "name": "Test Debug User"
        }
        response = requests.post(
            f"{base_url}/auth/send-signup-otp",
            headers={"Content-Type": "application/json"},
            json=data
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Send signup OTP endpoint works")
        else:
            print(f"❌ Send signup OTP endpoint failed: {response.text}")
    except Exception as e:
        print(f"❌ Error testing send-signup-otp: {e}")
    
    # Test 3: Test verify-signup-otp endpoint (with invalid OTP first)
    print("\n3. Testing verify-signup-otp endpoint...")
    try:
        data = {
            "email": "test_debug@example.com",
            "name": "Test Debug User",
            "password": "password123",
            "otp": "000000"  # Invalid OTP
        }
        response = requests.post(
            f"{base_url}/auth/verify-signup-otp",
            headers={"Content-Type": "application/json"},
            json=data
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 400:
            print("✅ Verify signup OTP endpoint works (correctly rejected invalid OTP)")
        else:
            print(f"❌ Verify signup OTP endpoint unexpected response: {response.text}")
    except Exception as e:
        print(f"❌ Error testing verify-signup-otp: {e}")
    
    print("\n🔍 Debug test completed!")

if __name__ == "__main__":
    test_signup_otp_flow() 