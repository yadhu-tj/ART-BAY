-- Create OTP table for storing one-time passwords
CREATE TABLE IF NOT EXISTS otp_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    expiry_time DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_expiry (expiry_time)
);

-- Optional: Add a cleanup event to automatically remove expired OTPs
-- This requires MySQL Event Scheduler to be enabled
-- CREATE EVENT IF NOT EXISTS cleanup_expired_otp
-- ON SCHEDULE EVERY 1 HOUR
-- DO
--     DELETE FROM otp_codes WHERE expiry_time < NOW(); 