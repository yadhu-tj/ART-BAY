import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime

@pytest.fixture
def mock_artwork():
    return {
        'art_id': 19,
        'title': 'Nebula Dreams',
        'description': 'A deep space abstract painting.',
        'price': 1200.00,
        'category': 'Painting',
        'image_path': 'artist@example.com_nebula.jpg',
        'email': 'artist@example.com',
        'artist_name': 'Cosmo Art',
        'artist_bio': 'Space obsessed painter.',
        'profile_pic': 'cosmo_profile.jpg',
        'created_at': datetime(2026, 1, 1)
    }

@patch('models.art_queries.get_db_connection')
def test_get_art_details_query(mock_get_db_connection, mock_artwork):
    """Test the database query for art details."""
    from models.art_queries import get_art_details
    
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_get_db_connection.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor
    mock_cursor.fetchone.return_value = mock_artwork

    result = get_art_details(19)
    
    assert result['title'] == 'Nebula Dreams'
    assert result['artist_name'] == 'Cosmo Art'
    assert result['artist_bio'] == 'Space obsessed painter.'
    assert 'profile_pic' in result
    
    # Check if JOINs are present in SQL
    args, _ = mock_cursor.execute.call_args
    sql = args[0].upper()
    assert "LEFT JOIN ARTISTS" in sql
    assert "JOIN USERS" in sql

def test_view_art_details_route_success(client, mock_artwork):
    """Test the art details route returns 200 and renders content."""
    with patch('blueprints.art_routes.get_art_details', return_value=mock_artwork):
        response = client.get('/art/view/19')
        assert response.status_code == 200
        assert b'Nebula Dreams' in response.data
        assert b'Cosmo Art' in response.data
        assert b'Acquire Artwork' in response.data
        # Verify the specific image path logic fix
        assert b'/static/uploads/cosmo_profile.jpg' in response.data

def test_view_art_details_route_404(client):
    """Test the route returns 404 for missing artwork."""
    with patch('blueprints.art_routes.get_art_details', return_value=None):
        response = client.get('/art/view/999')
        assert response.status_code == 404

def test_view_art_details_route_db_error(client):
    """Test the route handles DB errors gracefully."""
    with patch('blueprints.art_routes.get_art_details', return_value={'error': 'Database down'}):
        response = client.get('/art/view/19')
        # Should return 404 per our current implementation's error handling
        assert response.status_code == 404
