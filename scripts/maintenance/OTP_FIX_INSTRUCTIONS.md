# OTP Service Fix Instructions

## 🔍 Problem Identified

The OTP service is failing because the `otp_codes` table is missing a **UNIQUE constraint** on the `email` column. This constraint is required for the `ON DUPLICATE KEY UPDATE` clause in the `store_otp` function to work properly.

## ✅ Quick Fix (Recommended)

### Option 1: Run the Diagnostic Script (Easiest)

1. **Run the diagnostic and fix script:**
   ```bash
   python fix_otp_service.py
   ```

   This script will:
   - Check if the OTP table exists
   - Fix the table structure automatically
   - Test email configuration
   - Test OTP generation and storage
   - Optionally test email sending

2. **Follow the prompts** and the script will fix everything automatically.

### Option 2: Manual Database Fix

If you prefer to fix it manually:

1. **Connect to your MySQL database:**
   ```bash
   mysql -u root -p
   USE online_art_gallery_database_final;
   ```

2. **Check if the table exists:**
   ```sql
   SHOW TABLES LIKE 'otp_codes';
   ```

3. **If table doesn't exist, create it:**
   ```sql
   CREATE TABLE otp_codes (
       id INT AUTO_INCREMENT PRIMARY KEY,
       email VARCHAR(255) NOT NULL UNIQUE,
       otp VARCHAR(6) NOT NULL,
       expiry_time DATETIME NOT NULL,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       INDEX idx_email (email),
       INDEX idx_expiry (expiry_time)
   );
   ```

4. **If table exists but missing UNIQUE constraint:**
   
   First, remove any duplicate emails:
   ```sql
   DELETE t1 FROM otp_codes t1
   INNER JOIN otp_codes t2 
   WHERE t1.id < t2.id AND t1.email = t2.email;
   ```
   
   Then add the UNIQUE constraint:
   ```sql
   ALTER TABLE otp_codes ADD UNIQUE KEY unique_email (email);
   ```

## 📧 Email Configuration Check

After fixing the database, verify your email configuration:

1. **Check your `dotenv.env` file:**
   ```env
   SENDER_EMAIL=your-email@gmail.com
   SENDER_PASSWORD=your-16-character-app-password
   ```

2. **Gmail App Password Setup:**
   - Go to your Google Account: https://myaccount.google.com/
   - Navigate to **Security** → **2-Step Verification**
   - Enable 2-Step Verification if not already enabled
   - Go to **App passwords** (at the bottom of Security page)
   - Select **Mail** and **Other (Custom name)**
   - Enter "ART-BAY" as the name
   - Copy the 16-character password
   - Paste it in your `dotenv.env` file as `SENDER_PASSWORD`

3. **Important Notes:**
   - You **cannot** use your regular Gmail password
   - You **must** use an App Password (16 characters, no spaces)
   - 2-Factor Authentication **must** be enabled

## 🧪 Testing the Fix

1. **Run the diagnostic script:**
   ```bash
   python fix_otp_service.py
   ```

2. **Or test manually:**
   ```bash
   python test_email.py
   ```

3. **Test in the application:**
   - Start your Flask app: `python app.py`
   - Go to login page
   - Click "Login with OTP"
   - Enter your email
   - Check your inbox for the OTP code

## 🐛 Common Issues and Solutions

### Issue 1: "Failed to send OTP email"

**Possible causes:**
- Incorrect App Password
- 2-Factor Authentication not enabled
- Wrong email in `dotenv.env`

**Solution:**
1. Verify App Password is correct (16 characters, no spaces)
2. Ensure 2FA is enabled on Gmail
3. Double-check `SENDER_EMAIL` in `dotenv.env`

### Issue 2: "Database error in store_otp"

**Possible causes:**
- Missing UNIQUE constraint on email column
- Table doesn't exist
- Database connection issues

**Solution:**
1. Run `python fix_otp_service.py` to fix the table
2. Check database connection in `dotenv.env`
3. Verify database name is correct

### Issue 3: "Invalid or expired OTP"

**Possible causes:**
- OTP expired (10 minutes)
- Wrong OTP entered
- OTP already used

**Solution:**
1. Request a new OTP
2. Check the time (OTP expires in 10 minutes)
3. Make sure you're entering all 6 digits

### Issue 4: "ON DUPLICATE KEY UPDATE" error

**This is the main issue!** The table is missing the UNIQUE constraint.

**Solution:**
Run the fix script or manually add the UNIQUE constraint as shown above.

## 📋 Verification Checklist

After fixing, verify:

- [ ] OTP table exists with UNIQUE constraint on email
- [ ] `dotenv.env` has correct `SENDER_EMAIL`
- [ ] `dotenv.env` has correct `SENDER_PASSWORD` (App Password)
- [ ] Gmail 2-Factor Authentication is enabled
- [ ] App Password is generated and correct
- [ ] Database connection is working
- [ ] Test email can be sent successfully

## 🔄 After Fixing

1. **Restart your Flask application:**
   ```bash
   python app.py
   ```

2. **Test the OTP flow:**
   - Try logging in with OTP
   - Try signing up with OTP
   - Verify emails are received

3. **Check logs:**
   - Look at `app.log` for any errors
   - Check console output for email service messages

## 📞 Still Having Issues?

If the OTP service still doesn't work after following these steps:

1. **Check the logs:**
   ```bash
   tail -f app.log
   ```

2. **Run the diagnostic script with verbose output:**
   ```bash
   python fix_otp_service.py
   ```

3. **Test email service directly:**
   ```bash
   python test_email.py
   ```

4. **Verify database structure:**
   ```sql
   DESCRIBE otp_codes;
   SHOW INDEXES FROM otp_codes;
   ```

## 🎯 Summary

The main issue is the missing UNIQUE constraint on the `email` column in the `otp_codes` table. 

**Quickest fix:** Run `python fix_otp_service.py` and it will fix everything automatically!

---

**Last Updated:** 2025-01-XX
**Status:** ✅ Fix Available

