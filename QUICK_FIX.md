# 🚀 Quick Fix for OTP Service

## The Problem
The OTP service is failing because the database table is missing a **UNIQUE constraint** on the email column.

## ⚡ Fastest Solution (2 minutes)

### Step 1: Run the Fix Script
```bash
python fix_otp_service.py
```

This will automatically:
- ✅ Check and fix the database table
- ✅ Test email configuration  
- ✅ Test OTP functionality
- ✅ Show you what's wrong and fix it

### Step 2: Verify Email Settings

Make sure your `dotenv.env` file has:
```env
SENDER_EMAIL=your-email@gmail.com
SENDER_PASSWORD=your-16-character-app-password
```

**Important:** You need a Gmail App Password (not your regular password):
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Go to "App passwords"
4. Generate a password for "Mail"
5. Use that 16-character password in `dotenv.env`

### Step 3: Test It
```bash
python app.py
```

Then try logging in with OTP at: http://localhost:5000/auth/login

---

## 🔧 Alternative: Manual SQL Fix

If you prefer to fix it manually:

```sql
-- Connect to MySQL
mysql -u root -p
USE online_art_gallery_database_final;

-- Add UNIQUE constraint
ALTER TABLE otp_codes ADD UNIQUE KEY unique_email (email);
```

Or run the SQL file:
```bash
mysql -u root -p online_art_gallery_database_final < database/fix_otp_table.sql
```

---

## ✅ That's It!

After running the fix script, your OTP service should work. If you still have issues, check `OTP_FIX_INSTRUCTIONS.md` for detailed troubleshooting.

