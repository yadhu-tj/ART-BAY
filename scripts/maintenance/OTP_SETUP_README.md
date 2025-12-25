# ART&BAY OTP Authentication Setup Guide

This guide will help you set up email-based OTP (One-Time Password) authentication for your ART&BAY application.

## 🚀 Features

- **Secure OTP Authentication**: 6-digit codes sent via email
- **10-minute Expiry**: OTP codes expire automatically for security
- **Resend Functionality**: Users can request new OTP codes
- **Fallback Password Login**: Traditional password login still available
- **Modern UI**: Beautiful, responsive interface with animations
- **Email Templates**: Professional HTML email templates

## 📋 Prerequisites

1. **Gmail Account**: You need a Gmail account for sending emails
2. **2-Factor Authentication**: Must be enabled on your Gmail account
3. **App Password**: Generated from Google Account settings
4. **MySQL Database**: For storing OTP codes

## 🔧 Setup Instructions

### Step 1: Database Setup

1. **Create OTP Table**: Run the SQL script to create the required table:

```sql
-- Execute this in your MySQL database
CREATE TABLE IF NOT EXISTS otp_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    expiry_time DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_expiry (expiry_time)
);
```

Or run the provided SQL file:
```bash
mysql -u your_username -p your_database < database/otp_table.sql
```

### Step 2: Email Configuration

#### Option A: Automated Setup (Recommended)

Run the setup script:
```bash
python setup_email.py
```

Follow the interactive prompts to configure your email settings.

#### Option B: Manual Configuration

1. **Enable 2-Factor Authentication**:
   - Go to your Google Account settings
   - Navigate to Security
   - Enable 2-Step Verification

2. **Generate App Password**:
   - Go to Security > App passwords
   - Select "Mail" as the app
   - Generate a new 16-character password

3. **Update Environment Variables**:
   Edit your `dotenv.env` file and add:
   ```
   SENDER_EMAIL=your-email@gmail.com
   SENDER_PASSWORD=your-16-character-app-password
   ```

### Step 3: Install Dependencies

Make sure you have the required Python packages:
```bash
pip install flask-mail
```

### Step 4: Test the Setup

1. **Start your Flask application**:
   ```bash
   python app.py
   ```

2. **Test OTP Login**:
   - Go to `http://localhost:5000`
   - Click "Login"
   - Choose "Login with OTP"
   - Enter your email
   - Check your email for the OTP code
   - Enter the code to complete login

## 🎨 User Interface

### Login Flow

1. **Email Input**: Users enter their email address
2. **OTP Input**: 6-digit code input with individual boxes
3. **Verification**: Automatic validation and login
4. **Fallback**: Option to use traditional password login

### Features

- **Auto-focus**: Automatically moves to next input box
- **Paste Support**: Users can paste the entire OTP
- **Backspace Navigation**: Easy navigation between inputs
- **Countdown Timer**: Shows remaining time for OTP validity
- **Resend Option**: Request new OTP after expiry
- **Error Handling**: Clear error messages and visual feedback

## 🔒 Security Features

- **6-digit OTP**: Secure random generation
- **10-minute Expiry**: Automatic expiration
- **Single Use**: OTP is deleted after successful verification
- **Rate Limiting**: Prevents abuse (can be implemented)
- **Email Validation**: Ensures user exists before sending OTP

## 📧 Email Templates

The system includes professional HTML email templates:

- **OTP Email**: Clean, branded design with security notice
- **Welcome Email**: For new user registrations
- **Responsive Design**: Works on all email clients

## 🛠️ Customization

### Email Template Customization

Edit `services/email_service.py` to customize email templates:

```python
def send_otp_email(self, recipient_email, otp, user_name=""):
    # Customize the email body HTML here
    body = """
    <html>
    <body>
        <!-- Your custom email template -->
    </body>
    </html>
    """
```

### OTP Configuration

Modify OTP settings in `models/otp_queries.py`:

```python
def store_otp(email, otp, expiry_minutes=10):  # Change expiry time
    # Customize OTP storage logic
```

### UI Customization

Edit `static/css/otp_login.css` to customize the appearance:

```css
.otp-input {
    /* Customize OTP input boxes */
    width: 50px;
    height: 60px;
    /* Add your custom styles */
}
```

## 🐛 Troubleshooting

### Common Issues

1. **"Failed to send OTP email"**:
   - Check your Gmail App Password
   - Ensure 2-Factor Authentication is enabled
   - Verify email configuration in `.env` file

2. **"Invalid OTP"**:
   - Check if OTP has expired (10 minutes)
   - Ensure you're entering the complete 6-digit code
   - Try requesting a new OTP

3. **Database Errors**:
   - Verify OTP table exists
   - Check database connection settings
   - Ensure proper permissions

### Debug Mode

Enable debug logging by adding to your Flask app:
```python
app.logger.setLevel(logging.DEBUG)
```

## 📱 Mobile Support

The OTP interface is fully responsive and works on:
- Mobile phones
- Tablets
- Desktop computers
- All modern browsers

## 🔄 API Endpoints

The system provides these API endpoints:

- `POST /auth/send-otp`: Send OTP to email
- `POST /auth/verify-otp`: Verify OTP and login
- `POST /auth/login`: Traditional password login (fallback)

## 📈 Performance

- **Fast Response**: OTP generation and email sending optimized
- **Database Indexing**: Proper indexes for quick OTP lookups
- **Cleanup Jobs**: Automatic removal of expired OTPs
- **Connection Pooling**: Efficient database connections

## 🔮 Future Enhancements

Potential improvements:
- SMS OTP support
- Rate limiting
- OTP analytics
- Multi-factor authentication
- Remember device option

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Verify all configuration steps
3. Review error logs
4. Test with a simple email first

---

**Note**: This OTP system is designed for development and testing. For production use, consider implementing additional security measures like rate limiting and monitoring. 