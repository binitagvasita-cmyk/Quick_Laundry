import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class EmailService:
    """Email sending service"""
    
    def __init__(self, config):
        self.config = config
        self.smtp_server = config.MAIL_SERVER
        self.smtp_port = config.MAIL_PORT
        self.username = config.MAIL_USERNAME
        self.password = config.MAIL_PASSWORD
        self.sender = config.MAIL_DEFAULT_SENDER
        self.app_name = config.APP_NAME
        self.app_url = config.APP_URL
        
        # 🔧 DEBUG: Log email configuration (without exposing password)
        logger.info("="*50)
        logger.info("📧 EMAIL SERVICE INITIALIZED")
        logger.info(f"SMTP Server: {self.smtp_server}")
        logger.info(f"SMTP Port: {self.smtp_port}")
        logger.info(f"Username: {self.username}")
        logger.info(f"Password Set: {bool(self.password)}")
        logger.info(f"Sender: {self.sender}")
        logger.info(f"App Name: {self.app_name}")
        logger.info("="*50)
        
        # ⚠️ CRITICAL: Check if email credentials are missing
        if not self.username or not self.password:
            logger.error("❌ CRITICAL: Email credentials are MISSING!")
            logger.error("Please set MAIL_USERNAME and MAIL_PASSWORD in Render Environment Variables")
    
    def _create_smtp_connection(self):
        """Create and return SMTP connection"""
        try:
            logger.info(f"🔄 Attempting to connect to {self.smtp_server}:{self.smtp_port}")
            logger.info(f"📧 Using username: {self.username}")
            logger.info(f"🔑 Password configured: {bool(self.password)}")
            
            # Check credentials before attempting connection
            if not self.username or not self.password:
                raise ValueError("Email credentials not configured. Please set MAIL_USERNAME and MAIL_PASSWORD in environment variables.")
            
            server = smtplib.SMTP(self.smtp_server, self.smtp_port, timeout=30)
            logger.info("✅ SMTP connection established")
            
            server.starttls()
            logger.info("✅ TLS started")
            
            server.login(self.username, self.password)
            logger.info("✅ SMTP authentication successful")
            
            return server
            
        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"❌ SMTP Authentication Failed: {e}")
            logger.error("⚠️ Check your Gmail App Password or enable 2-Step Verification")
            raise ValueError("Email authentication failed. Please check your Gmail settings.")
        except smtplib.SMTPConnectError as e:
            logger.error(f"❌ SMTP Connection Error: {e}")
            raise ValueError("Unable to connect to email server.")
        except Exception as e:
            logger.error(f"❌ Failed to connect to SMTP server: {e}")
            logger.error(f"Error type: {type(e).__name__}")
            raise
    
    def send_email(self, to_email, subject, html_content, text_content=None):
        """
        Send email with HTML content
        Returns: (success, message)
        """
        try:
            logger.info(f"📤 Preparing to send email to {to_email}")
            logger.info(f"📋 Subject: {subject}")
            
            # Create message
            message = MIMEMultipart('alternative')
            message['Subject'] = subject
            message['From'] = self.sender
            message['To'] = to_email
            
            # Add text version (fallback)
            if text_content:
                text_part = MIMEText(text_content, 'plain')
                message.attach(text_part)
            
            # Add HTML version
            html_part = MIMEText(html_content, 'html')
            message.attach(html_part)
            
            logger.info("📧 Email message created, attempting to send...")
            
            # Send email
            with self._create_smtp_connection() as server:
                server.send_message(message)
            
            logger.info(f"✅ Email sent successfully to {to_email}")
            return True, "Email sent successfully"
            
        except ValueError as e:
            # Configuration errors
            logger.error(f"❌ Configuration error: {e}")
            return False, str(e)
        except Exception as e:
            logger.error(f"❌ Failed to send email to {to_email}: {e}")
            logger.error(f"Error type: {type(e).__name__}")
            return False, f"Failed to send email: {str(e)}"
    
    def send_otp_email(self, to_email, otp_code, expires_at):
        """
        Send OTP verification email
        Returns: (success, message)
        """
        logger.info(f"🔢 Preparing OTP email for {to_email}")
        logger.info(f"🔢 OTP Code: {otp_code}")
        
        subject = f"Your {self.app_name} Verification Code"
        
        # Calculate expiry minutes
        expiry_minutes = int((expires_at - datetime.now()).total_seconds() / 60)
        logger.info(f"⏱️ OTP expires in {expiry_minutes} minutes")
        
        # HTML content
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f4f4f4;
                }}
                .container {{
                    background-color: #ffffff;
                    border-radius: 10px;
                    padding: 40px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }}
                .header {{
                    text-align: center;
                    margin-bottom: 30px;
                }}
                .logo {{
                    font-size: 32px;
                    margin-bottom: 10px;
                }}
                .title {{
                    color: #2563eb;
                    font-size: 24px;
                    margin: 0;
                }}
                .otp-box {{
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    font-size: 36px;
                    font-weight: bold;
                    letter-spacing: 8px;
                    padding: 20px;
                    text-align: center;
                    border-radius: 8px;
                    margin: 30px 0;
                }}
                .message {{
                    font-size: 16px;
                    color: #555;
                    margin: 20px 0;
                }}
                .warning {{
                    background-color: #fff3cd;
                    border-left: 4px solid #ffc107;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 4px;
                }}
                .footer {{
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    color: #888;
                    font-size: 14px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">🧺</div>
                    <h1 class="title">{self.app_name}</h1>
                </div>
                
                <p class="message">Hello,</p>
                
                <p class="message">
                    Thank you for registering with {self.app_name}! To complete your registration, 
                    please verify your email address using the OTP code below:
                </p>
                
                <div class="otp-box">{otp_code}</div>
                
                <p class="message">
                    This OTP is valid for <strong>{expiry_minutes} minutes</strong>. 
                    Please enter it on the registration page to verify your email address.
                </p>
                
                <div class="warning">
                    <strong>⚠️ Security Notice:</strong><br>
                    If you didn't request this verification code, please ignore this email. 
                    Never share your OTP with anyone.
                </div>
                
                <div class="footer">
                    <p>
                        Need help? Contact us at {self.username}<br>
                        © {datetime.now().year} {self.app_name}. All rights reserved.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Text content (fallback)
        text_content = f"""
        {self.app_name} - Email Verification
        
        Hello,
        
        Thank you for registering with {self.app_name}!
        
        Your verification code is: {otp_code}
        
        This OTP is valid for {expiry_minutes} minutes.
        
        If you didn't request this code, please ignore this email.
        
        © {datetime.now().year} {self.app_name}
        """
        
        return self.send_email(to_email, subject, html_content, text_content)
    
    def send_welcome_email(self, to_email, username, full_name=None):
        """
        Send welcome email after successful registration
        Returns: (success, message)
        """
        display_name = full_name if full_name else username
        subject = f"Welcome to {self.app_name}! 🎉"
        
        # HTML content
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f4f4f4;
                }}
                .container {{
                    background-color: #ffffff;
                    border-radius: 10px;
                    padding: 40px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }}
                .header {{
                    text-align: center;
                    margin-bottom: 30px;
                }}
                .logo {{
                    font-size: 48px;
                    margin-bottom: 10px;
                }}
                .title {{
                    color: #2563eb;
                    font-size: 28px;
                    margin: 10px 0;
                }}
                .welcome-message {{
                    font-size: 18px;
                    color: #555;
                    text-align: center;
                    margin: 20px 0;
                }}
                .features {{
                    background-color: #f8f9fa;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 30px 0;
                }}
                .feature-item {{
                    margin: 15px 0;
                    padding-left: 30px;
                    position: relative;
                }}
                .feature-item:before {{
                    content: "✓";
                    position: absolute;
                    left: 0;
                    color: #10b981;
                    font-weight: bold;
                    font-size: 20px;
                }}
                .cta-button {{
                    text-align: center;
                    margin: 30px 0;
                }}
                .button {{
                    display: inline-block;
                    padding: 15px 40px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: bold;
                    font-size: 16px;
                }}
                .footer {{
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    color: #888;
                    font-size: 14px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">🎉</div>
                    <h1 class="title">Welcome to {self.app_name}!</h1>
                </div>
                
                <p class="welcome-message">
                    Hi <strong>{display_name}</strong>,<br>
                    We're thrilled to have you on board!
                </p>
                
                <p>
                    Your account has been successfully created. You're now part of the {self.app_name} family, 
                    where fresh, clean laundry is just a few clicks away.
                </p>
                
                <div class="features">
                    <h3 style="margin-top: 0; color: #2563eb;">What You Can Do:</h3>
                    <div class="feature-item">Schedule pickup and delivery at your convenience</div>
                    <div class="feature-item">Choose from Express, Standard, or Economy services</div>
                    <div class="feature-item">Track your orders in real-time</div>
                    <div class="feature-item">Manage multiple addresses</div>
                    <div class="feature-item">Get exclusive offers and discounts</div>
                </div>
                
                <div class="cta-button">
                    <a href="{self.app_url}" class="button">Start Your First Order</a>
                </div>
                
                <p style="text-align: center; color: #666; margin-top: 30px;">
                    Need help? We're here for you!<br>
                    Contact us at <a href="mailto:{self.username}">{self.username}</a>
                </p>
                
                <div class="footer">
                    <p>
                        <strong>{self.app_name}</strong><br>
                        Fresh Clothes Delivered Fast to Your Doorstep<br>
                        LAUNDRY | DRY CLEAN | IRON
                    </p>
                    <p>
                        © {datetime.now().year} {self.app_name}. All rights reserved.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Text content (fallback)
        text_content = f"""
        Welcome to {self.app_name}!
        
        Hi {display_name},
        
        We're thrilled to have you on board!
        
        Your account has been successfully created. You're now part of the {self.app_name} family.
        
        What You Can Do:
        - Schedule pickup and delivery at your convenience
        - Choose from Express, Standard, or Economy services
        - Track your orders in real-time
        - Manage multiple addresses
        - Get exclusive offers and discounts
        
        Start your first order: {self.app_url}
        
        Need help? Contact us at {self.username}
        
        © {datetime.now().year} {self.app_name}
        """
        
        return self.send_email(to_email, subject, html_content, text_content)
    
    def send_password_reset_email(self, to_email, reset_token):
        """
        Send password reset email
        Returns: (success, message)
        """
        reset_url = f"{self.app_url}/reset-password.html?token={reset_token}"
        subject = f"Reset Your {self.app_name} Password"
        
        # HTML content
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f4f4f4;
                }}
                .container {{
                    background-color: #ffffff;
                    border-radius: 10px;
                    padding: 40px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }}
                .header {{
                    text-align: center;
                    margin-bottom: 30px;
                }}
                .logo {{
                    font-size: 32px;
                    margin-bottom: 10px;
                }}
                .title {{
                    color: #2563eb;
                    font-size: 24px;
                    margin: 0;
                }}
                .message {{
                    font-size: 16px;
                    color: #555;
                    margin: 20px 0;
                }}
                .button-container {{
                    text-align: center;
                    margin: 30px 0;
                }}
                .button {{
                    display: inline-block;
                    padding: 15px 40px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white !important;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: bold;
                    font-size: 16px;
                }}
                .button:hover {{
                    background: linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%);
                }}
                .warning {{
                    background-color: #fff3cd;
                    border-left: 4px solid #ffc107;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 4px;
                }}
                .info-box {{
                    background-color: #e3f2fd;
                    border-left: 4px solid #2196f3;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 4px;
                }}
                .footer {{
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    color: #888;
                    font-size: 14px;
                }}
                .link-text {{
                    word-break: break-all;
                    background-color: #f5f5f5;
                    padding: 10px;
                    border-radius: 4px;
                    font-size: 12px;
                    color: #666;
                    margin-top: 15px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">🔐</div>
                    <h1 class="title">Password Reset Request</h1>
                </div>
                
                <p class="message">Hello,</p>
                
                <p class="message">
                    We received a request to reset your password for your {self.app_name} account. 
                    Click the button below to create a new password:
                </p>
                
                <div class="button-container">
                    <a href="{reset_url}" class="button">Reset Password</a>
                </div>
                
                <div class="info-box">
                    <strong>ℹ️ Important:</strong><br>
                    This password reset link will expire in <strong>1 hour</strong> for security reasons.
                </div>
                
                <p class="message">
                    If the button doesn't work, you can copy and paste the following link into your browser:
                </p>
                
                <div class="link-text">
                    {reset_url}
                </div>
                
                <div class="warning">
                    <strong>⚠️ Security Notice:</strong><br>
                    If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
                    If you're concerned about your account security, please contact our support team immediately.
                </div>
                
                <div class="footer">
                    <p>
                        Need help? Contact us at {self.username}<br>
                        © {datetime.now().year} {self.app_name}. All rights reserved.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Text content (fallback)
        text_content = f"""
        {self.app_name} - Password Reset Request
        
        Hello,
        
        We received a request to reset your password for your {self.app_name} account.
        
        Click the link below to reset your password:
        {reset_url}
        
        This link will expire in 1 hour for security reasons.
        
        If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
        
        Need help? Contact us at {self.username}
        
        © {datetime.now().year} {self.app_name}
        """
        
        return self.send_email(to_email, subject, html_content, text_content)
    
    def send_profile_update_email(self, to_email, username, full_name=None, updated_fields=None):
        """
        Send profile update confirmation email
        Returns: (success, message)
        """
        display_name = full_name if full_name else username
        subject = f"Your {self.app_name} Profile Has Been Updated"
        
        # Build updated fields list
        fields_html = ""
        if updated_fields:
            fields_html = "<ul style='margin: 10px 0; padding-left: 25px;'>"
            for field in updated_fields:
                # Convert field names to readable format
                readable_field = field.replace('_', ' ').title()
                fields_html += f"<li style='margin: 5px 0;'>{readable_field}</li>"
            fields_html += "</ul>"
        
        # HTML content
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f4f4f4;
                }}
                .container {{
                    background-color: #ffffff;
                    border-radius: 10px;
                    padding: 40px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }}
                .header {{
                    text-align: center;
                    margin-bottom: 30px;
                }}
                .logo {{
                    font-size: 32px;
                    margin-bottom: 10px;
                }}
                .title {{
                    color: #2563eb;
                    font-size: 24px;
                    margin: 0;
                }}
                .message {{
                    font-size: 16px;
                    color: #555;
                    margin: 20px 0;
                }}
                .success-box {{
                    background-color: #d1fae5;
                    border-left: 4px solid #10b981;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 4px;
                }}
                .info-box {{
                    background-color: #f0f9ff;
                    border-left: 4px solid #3b82f6;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 4px;
                }}
                .warning {{
                    background-color: #fff3cd;
                    border-left: 4px solid #ffc107;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 4px;
                }}
                .button-container {{
                    text-align: center;
                    margin: 30px 0;
                }}
                .button {{
                    display: inline-block;
                    padding: 15px 40px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white !important;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: bold;
                    font-size: 16px;
                }}
                .footer {{
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    color: #888;
                    font-size: 14px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">✅</div>
                    <h1 class="title">Profile Updated Successfully</h1>
                </div>
                
                <p class="message">Hi <strong>{display_name}</strong>,</p>
                
                <div class="success-box">
                    <strong>✓ Profile Update Confirmed</strong><br>
                    Your profile information has been successfully updated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}.
                </div>
                
                {f'<div class="info-box"><strong>Updated Information:</strong>{fields_html}</div>' if fields_html else ''}
                
                <p class="message">
                    You can view your updated profile information by logging into your account.
                </p>
                
                <div class="button-container">
                    <a href="{self.app_url}/profile.html" class="button">View My Profile</a>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Security Notice:</strong><br>
                    If you didn't make these changes, please contact our support team immediately at {self.username}. 
                    Your account security is important to us.
                </div>
                
                <div class="footer">
                    <p>
                        <strong>{self.app_name}</strong><br>
                        Need help? Contact us at <a href="mailto:{self.username}">{self.username}</a>
                    </p>
                    <p>
                        © {datetime.now().year} {self.app_name}. All rights reserved.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Text content (fallback)
        fields_text = ""
        if updated_fields:
            fields_text = "\n\nUpdated Information:\n"
            for field in updated_fields:
                readable_field = field.replace('_', ' ').title()
                fields_text += f"- {readable_field}\n"
        
        text_content = f"""
        {self.app_name} - Profile Updated Successfully
        
        Hi {display_name},
        
        Your profile information has been successfully updated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}.
        {fields_text}
        
        You can view your updated profile information by logging into your account at:
        {self.app_url}/profile.html
        
        SECURITY NOTICE:
        If you didn't make these changes, please contact our support team immediately at {self.username}.
        
        Need help? Contact us at {self.username}
        
        © {datetime.now().year} {self.app_name}
        """
        
        return self.send_email(to_email, subject, html_content, text_content)