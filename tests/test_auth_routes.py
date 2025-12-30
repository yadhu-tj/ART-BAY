import pytest
import json
from unittest.mock import patch, MagicMock
from werkzeug.security import generate_password_hash

def test_signup_get(client):
    """Test that the signup page loads."""
    response = client.get('/auth/signup')
    assert response.status_code == 200
    assert b"Sign Up" in response.data or b"Create Account" in response.data

@patch('blueprints.auth.routes.add_user')
def test_signup_post_success(mock_add_user, client):
    """Test successful signup via POST."""
    mock_add_user.return_value = {"message": "User added successfully"}
    
    data = {
        'name': 'New User',
        'email': 'new@example.com',
        'password': 'password123',
        'confirmPassword': 'password123'
    }
    
    response = client.post('/auth/signup', data=data)
    
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['status'] == 'success'
    assert json_data['message'] == 'User added successfully'

@patch('blueprints.auth.routes.add_user')
def test_signup_post_password_mismatch(mock_add_user, client):
    """Test signup with mismatched passwords."""
    data = {
        'name': 'New User',
        'email': 'new@example.com',
        'password': 'password123',
        'confirmPassword': 'differentpassword'
    }
    
    response = client.post('/auth/signup', data=data)
    
    assert response.status_code == 400
    json_data = response.get_json()
    assert json_data['status'] == 'error'
    assert 'Passwords do not match' in json_data['message']
    mock_add_user.assert_not_called()

def test_login_get(client):
    """Test that the login page loads."""
    response = client.get('/auth/login')
    assert response.status_code == 200
    # Check for login form identifier
    assert b"Login" in response.data

@patch('blueprints.auth.routes.get_user_by_email')
def test_login_post_success(mock_get_user, client):
    """Test successful login."""
    # Mock a user with a hashed password
    hashed_pw = generate_password_hash('password123')
    mock_user = {
        'name': 'Test User',
        'email': 'test@example.com',
        'password': hashed_pw,
        'role': 'user'
    }
    mock_get_user.return_value = mock_user
    
    data = {
        'email': 'test@example.com',
        'password': 'password123'
    }
    
    response = client.post('/auth/login', data=data)
    
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['status'] == 'success'
    assert 'Login successful' in json_data['message']

@patch('blueprints.auth.routes.get_user_by_email')
def test_login_post_invalid_credentials(mock_get_user, client):
    """Test login with wrong password."""
    # Mock the user found
    hashed_pw = generate_password_hash('correct_password')
    mock_user = {
        'name': 'Test User',
        'email': 'test@example.com',
        'password': hashed_pw,
        'role': 'user'
    }
    mock_get_user.return_value = mock_user
    
    data = {
        'email': 'test@example.com',
        'password': 'wrong_password'
    }
    
    response = client.post('/auth/login', data=data)
    
    assert response.status_code == 401
    json_data = response.get_json()
    assert json_data['status'] == 'error'
