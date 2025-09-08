import mysql.connector
from config.config import Config

def create_otp_table():
    try:
        # Connect to database
        conn = mysql.connector.connect(**Config.DB_CONFIG)
        cursor = conn.cursor()
        
        print("✅ Connected to database")
        
        # Create OTP table
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS otp_codes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            otp VARCHAR(6) NOT NULL,
            expiry_time DATETIME NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_email (email),
            INDEX idx_expiry (expiry_time)
        );
        """
        
        cursor.execute(create_table_sql)
        conn.commit()
        
        print("✅ OTP table created successfully")
        
        # Verify table exists
        cursor.execute("SHOW TABLES LIKE 'otp_codes'")
        if cursor.fetchone():
            print("✅ OTP table verified")
        else:
            print("❌ OTP table not found")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    create_otp_table() 