import pytest
from unittest.mock import patch

def test_admin_dashboard_access_denied_for_guest(client):
    """Test that guests (unauthenticated) cannot access admin dashboard."""
    response = client.get('/admin/dashboard')
    # Should redirect to login
    assert response.status_code == 302 
    assert '/auth/login' in response.headers['Location']

def test_admin_dashboard_access_denied_for_regular_user(client):
    """Test that regular users cannot access admin dashboard."""
    with client.session_transaction() as sess:
        sess['user'] = {'role': 'user', 'email': 'user@example.com', 'name': 'Regular User'}
    
    response = client.get('/admin/dashboard')
    # Should redirect to login (or 403 if implemented that way, but code showed redirect)
    assert response.status_code == 302
    assert '/auth/login' in response.headers['Location']

def test_admin_dashboard_access_denied_for_artist(client):
    """Test that artists cannot access admin dashboard (privilege escalation check)."""
    with client.session_transaction() as sess:
        sess['user'] = {'role': 'artist', 'email': 'artist@example.com', 'name': 'Artist User'}
    
    response = client.get('/admin/dashboard')
    assert response.status_code == 302

@patch('blueprints.admin_routes.get_dashboard_metrics')
def test_admin_dashboard_access_granted_for_admin(mock_metrics, client):
    """Test that admins CAN access admin dashboard."""
    # Mock metrics so the dashboard renders successfully without DB
    mock_metrics.return_value = {'total_users': 10, 'total_sales': 500}
    
    with client.session_transaction() as sess:
        sess['user'] = {'role': 'admin', 'email': 'admin@example.com', 'name': 'Admin User'}
    
    response = client.get('/admin/dashboard')
    assert response.status_code == 200
    # Verify we are on the dashboard
    assert b"Dashboard" in response.data or b"Admin" in response.data
