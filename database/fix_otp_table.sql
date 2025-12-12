-- Fix OTP Table - Add UNIQUE constraint to email column
-- Run this script if your OTP service is not working

USE online_art_gallery_database_final;

-- Step 1: Remove any duplicate emails (keep the most recent one)
DELETE t1 FROM otp_codes t1
INNER JOIN otp_codes t2 
WHERE t1.id < t2.id AND t1.email = t2.email;

-- Step 2: Add UNIQUE constraint to email column
-- If this fails, the table might already have the constraint
ALTER TABLE otp_codes ADD UNIQUE KEY unique_email (email);

-- Step 3: Verify the constraint was added
SHOW INDEXES FROM otp_codes WHERE Column_name = 'email';

-- If the above ALTER TABLE fails, you can drop and recreate the table:
-- DROP TABLE IF EXISTS otp_codes;
-- CREATE TABLE otp_codes (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     email VARCHAR(255) NOT NULL UNIQUE,
--     otp VARCHAR(6) NOT NULL,
--     expiry_time DATETIME NOT NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     INDEX idx_email (email),
--     INDEX idx_expiry (expiry_time)
-- );

