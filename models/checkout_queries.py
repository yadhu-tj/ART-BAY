import mysql.connector
from mysql.connector import Error
from datetime import datetime
from typing import Dict, Any, Optional

class MySQLShippingInfo:
    def __init__(self, host: str, database: str, user: str, password: str):
        """Initialize MySQL connection parameters"""
        self.host = host
        self.database = database
        self.user = user
        self.password = password
        self.connection = None
        
    def connect(self):
        """Establish database connection"""
        try:
            self.connection = mysql.connector.connect(
                host=self.host,
                database=self.database,
                user=self.user,
                password=self.password
            )
            return True
        except Error as e:
            print(f"Error connecting to MySQL: {e}")
            return False
    
    def close(self):
        """Close database connection"""
        if self.connection and self.connection.is_connected():
            self.connection.close()
    
    def create_table(self):
        """Create shipping_info table if not exists"""
        query = """
        CREATE TABLE IF NOT EXISTS shipping_info (
            shipping_id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            phone VARCHAR(20) NOT NULL,
            address TEXT NOT NULL,
            city VARCHAR(100) NOT NULL,
            zipcode VARCHAR(10) NOT NULL,
            country VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (email) REFERENCES users(email) ON DELETE CASCADE
        )
        """
        try:
            cursor = self.connection.cursor()
            cursor.execute(query)
            self.connection.commit()
            return True
        except Error as e:
            print(f"Error creating table: {e}")
            return False
    
    def add_shipping_info(self, email: str, name: str, phone: str, 
                         address: str, city: str, zipcode: str, country: str) -> Optional[int]:
        """Add new shipping information"""
        query = """
        INSERT INTO shipping_info (email, name, phone, address, city, zipcode, country)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        try:
            cursor = self.connection.cursor()
            cursor.execute(query, (email, name, phone, address, city, zipcode, country))
            self.connection.commit()
            return cursor.lastrowid
        except Error as e:
            print(f"Error adding shipping info: {e}")
            return None
    
    def get_shipping_info(self, shipping_id: int) -> Optional[Dict[str, Any]]:
        """Get shipping information by ID"""
        query = "SELECT * FROM shipping_info WHERE shipping_id = %s"
        try:
            cursor = self.connection.cursor(dictionary=True)
            cursor.execute(query, (shipping_id,))
            result = cursor.fetchone()
            if result:
                result['created_at'] = result['created_at'].isoformat() if result.get('created_at') else None
            return result
        except Error as e:
            print(f"Error getting shipping info: {e}")
            return None
    
    def update_shipping_info(self, shipping_id: int, **kwargs) -> bool:
        """Update shipping information"""
        if not kwargs:
            return False
            
        set_clause = ", ".join([f"{k} = %s" for k in kwargs.keys()])
        query = f"UPDATE shipping_info SET {set_clause} WHERE shipping_id = %s"
        
        try:
            cursor = self.connection.cursor()
            cursor.execute(query, (*kwargs.values(), shipping_id))
            self.connection.commit()
            return cursor.rowcount > 0
        except Error as e:
            print(f"Error updating shipping info: {e}")
            return False
    
    def delete_shipping_info(self, shipping_id: int) -> bool:
        """Delete shipping information"""
        query = "DELETE FROM shipping_info WHERE shipping_id = %s"
        try:
            cursor = self.connection.cursor()
            cursor.execute(query, (shipping_id,))
            self.connection.commit()
            return cursor.rowcount > 0
        except Error as e:
            print(f"Error deleting shipping info: {e}")
            return False

# Example usage
if __name__ == "__main__":
    db = MySQLShippingInfo(
        host="localhost",
        database="your_database",
        user="your_username",
        password="your_password"
    )
    
    if db.connect():
        db.create_table()
        
        # Add new shipping info
        shipping_id = db.add_shipping_info(
            email="user@example.com",
            name="John Doe",
            phone="1234567890",
            address="123 Main St",
            city="New York",
            zipcode="10001",
            country="USA"
        )
        
        if shipping_id:
            print(f"Added shipping info with ID: {shipping_id}")
            
            # Get shipping info
            info = db.get_shipping_info(shipping_id)
            print("Shipping info:", info)
            
            # Update shipping info
            if db.update_shipping_info(shipping_id, phone="9876543210"):
                print("Updated phone number")
            
            # Delete shipping info
            if db.delete_shipping_info(shipping_id):
                print("Deleted shipping info")
        
        db.close()