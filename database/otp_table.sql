-- Create OTP table for storing one-time passwords
-- IMPORTANT: The email column must have a UNIQUE constraint for ON DUPLICATE KEY UPDATE to work
CREATE TABLE IF NOT EXISTS otp_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    otp VARCHAR(6) NOT NULL,
    expiry_time DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_expiry (expiry_time)
);

-- If the table already exists without UNIQUE constraint, run this:
-- ALTER TABLE otp_codes ADD UNIQUE KEY unique_email (email);

-- Optional: Add a cleanup event to automatically remove expired OTPs
-- This requires MySQL Event Scheduler to be enabled
-- CREATE EVENT IF NOT EXISTS cleanup_expired_otp
-- ON SCHEDULE EVERY 1 HOUR
-- DO
--     DELETE FROM otp_codes WHERE expiry_time < NOW(); 