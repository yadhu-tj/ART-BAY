import pytest
from unittest.mock import patch

@patch('blueprints.auth.routes.add_user')
def test_signup_empty_fields(mock_add_user, client):
    """Test signup with completely empty fields."""
    data = {'name': '', 'email': '', 'password': '', 'confirmPassword': ''}
    response = client.post('/auth/signup', data=data)
    
    # Expect 400 Bad Request
    assert response.status_code == 400
    json_data = response.get_json()
    assert json_data['status'] == 'error'
    assert 'required' in json_data['message'].lower()
    
    # Mock should NOT be called (validation happens before DB)
    mock_add_user.assert_not_called()

@patch('blueprints.auth.routes.add_user')
def test_signup_excessive_input_length(mock_add_user, client):
    """
    Test signup with extremely long input. 
    This stresses the route's ability to handle large payloads.
    """
    long_string = "A" * 5000 # 5KB string
    data = {
        'name': long_string, 
        'email': f"test{long_string}@example.com", 
        'password': 'password123', 
        'confirmPassword': 'password123'
    }
    
    # Mock success to see if the ROUTE handles the data size okay
    mock_add_user.return_value = {"message": "User added successfully"}
    
    # The route should now REJECT this with a 400 error due to length limits
    response = client.post('/auth/signup', data=data)
    
    assert response.status_code == 400
    json_data = response.get_json()
    assert 'too long' in json_data['message'].lower()
    
    # Verify the service layer was NOT called
    mock_add_user.assert_not_called()

@patch('blueprints.cart_routes.add_to_cart')
def test_cart_add_missing_art_id(mock_add_to_cart, client):
    """Test adding to cart with missing parameter."""
    with client.session_transaction() as sess:
        sess['user'] = {'role': 'user', 'email': 'user@example.com'}
        
    response = client.post('/cart/add', json={}) # Empty JSON
    
    assert response.status_code == 400
    data = response.get_json()
    assert data['error'] == 'Missing artwork ID'
    mock_add_to_cart.assert_not_called()

@patch('blueprints.cart_routes.add_to_cart')
def test_cart_unauthorized_access(mock_add_to_cart, client):
    """Test accessing protected cart route without login."""
    # No session set
    response = client.post('/cart/add', json={'art_id': 1})
    
    assert response.status_code == 401
    mock_add_to_cart.assert_not_called()
