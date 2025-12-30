import pytest
from unittest.mock import MagicMock, patch
from models.user_queries import add_user, get_user_by_email

@patch('models.user_queries.get_db_connection')
def test_add_user_success(mock_get_db_connection):
    # Setup mock
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_get_db_connection.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor

    # Call the function
    result = add_user("Test User", "test@example.com", "password123")

    # Assertions
    assert result == {"message": "User added successfully"}
    mock_cursor.execute.assert_called_once()
    mock_conn.commit.assert_called_once()
    
    # Verify execute was called with correct SQL
    args, _ = mock_cursor.execute.call_args
    assert "INSERT INTO users" in args[0]
    assert args[1][0] == "Test User"
    assert args[1][1] == "test@example.com"

@patch('models.user_queries.get_db_connection')
def test_get_user_by_email_found(mock_get_db_connection):
    # Setup mock
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_get_db_connection.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor
    
    expected_user = {'id': 1, 'name': 'Test User', 'email': 'test@example.com'}
    mock_cursor.fetchone.return_value = expected_user

    # Call the function
    user = get_user_by_email("test@example.com")

    # Assertions
    assert user == expected_user
    mock_cursor.execute.assert_called_once()
    args, _ = mock_cursor.execute.call_args
    assert "SELECT * FROM users" in args[0]
    assert args[1][0] == "test@example.com"

@patch('models.user_queries.get_db_connection')
def test_get_user_by_email_not_found(mock_get_db_connection):
    # Setup mock
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_get_db_connection.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor
    
    mock_cursor.fetchone.return_value = None

    # Call the function
    user = get_user_by_email("nonexistent@example.com")

    # Assertions
    assert user is None
