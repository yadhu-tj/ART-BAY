import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config.config import Config

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_server = "smtp.gmail.com"
        self.smtp_port = 587
        self.sender_email = Config.SENDER_EMAIL
        self.sender_password = Config.SENDER_PASSWORD
        
    def send_otp_email(self, recipient_email, otp, user_name=""):
        """Send OTP email to user."""
        try:
            # Create message
            msg = MIMEMultipart()
            msg['From'] = self.sender_email
            msg['To'] = recipient_email
            msg['Subject'] = "ART&BAY - Your Login OTP"
            
            # Email body
            body = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #ff6a00; margin: 0;">ART&BAY</h1>
                        <p style="color: #666; margin: 5px 0;">Your Art Gallery</p>
                    </div>
                    
                    <div style="background-color: #f9f9f9; padding: 30px; border-radius: 10px; border-left: 4px solid #ff6a00;">
                        <h2 style="color: #333; margin-top: 0;">Login Verification</h2>
                        <p>Hello {user_name or 'there'},</p>
                        <p>You have requested to login to your ART&BAY account. Please use the following OTP to complete your login:</p>
                        
                        <div style="background-color: #fff; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                            <h1 style="color: #ff6a00; font-size: 32px; letter-spacing: 5px; margin: 0; font-family: monospace;">{otp}</h1>
                        </div>
                        
                        <p><strong>This OTP will expire in 10 minutes.</strong></p>
                        
                        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p style="margin: 0; color: #856404;">
                                <strong>Security Notice:</strong> Never share this OTP with anyone. 
                                ART&BAY will never ask for your OTP via phone or email.
                            </p>
                        </div>
                        
                        <p>If you didn't request this login, please ignore this email.</p>
                        
                        <p>Best regards,<br>The ART&BAY Team</p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
                        <p>This is an automated email. Please do not reply to this message.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            msg.attach(MIMEText(body, 'html'))
            
            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.sender_email, self.sender_password)
                server.send_message(msg)
                
            logger.info(f"OTP email sent successfully to {recipient_email}")
            return {"status": "success", "message": "OTP email sent successfully"}
            
        except Exception as e:
            logger.error(f"Error sending OTP email to {recipient_email}: {e}")
            return {"status": "error", "message": f"Failed to send OTP email: {str(e)}"}
    
    def send_welcome_email(self, recipient_email, user_name):
        """Send welcome email to new users."""
        try:
            msg = MIMEMultipart()
            msg['From'] = self.sender_email
            msg['To'] = recipient_email
            msg['Subject'] = "Welcome to ART&BAY!"
            
            body = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #ff6a00; margin: 0;">ART&BAY</h1>
                        <p style="color: #666; margin: 5px 0;">Your Art Gallery</p>
                    </div>
                    
                    <div style="background-color: #f9f9f9; padding: 30px; border-radius: 10px;">
                        <h2 style="color: #333; margin-top: 0;">Welcome to ART&BAY!</h2>
                        <p>Hello {user_name},</p>
                        <p>Thank you for joining ART&BAY! We're excited to have you as part of our art community.</p>
                        
                        <p>With ART&BAY, you can:</p>
                        <ul>
                            <li>Discover amazing artworks from talented artists</li>
                            <li>Purchase unique pieces for your collection</li>
                            <li>Connect with artists and art enthusiasts</li>
                            <li>Showcase your own artwork (if you're an artist)</li>
                        </ul>
                        
                        <p>Start exploring our gallery today!</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="http://localhost:5000" style="background-color: #ff6a00; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Visit ART&BAY</a>
                        </div>
                        
                        <p>Best regards,<br>The ART&BAY Team</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            msg.attach(MIMEText(body, 'html'))
            
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.sender_email, self.sender_password)
                server.send_message(msg)
                
            logger.info(f"Welcome email sent successfully to {recipient_email}")
            return {"status": "success", "message": "Welcome email sent successfully"}
            
        except Exception as e:
            logger.error(f"Error sending welcome email to {recipient_email}: {e}")
            return {"status": "error", "message": f"Failed to send welcome email: {str(e)}"} 