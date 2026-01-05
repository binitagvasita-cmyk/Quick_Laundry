from flask import Blueprint, request, jsonify
from BackEnd.models.user import User
from BackEnd.services.otp_service import OTPService
from BackEnd.services.email_service import EmailService
from BackEnd.services.jwt_service import JWTService, token_required
from BackEnd.services.google_oauth_service import GoogleOAuthService
from BackEnd.services.password_reset_service import PasswordResetService
from BackEnd.services.session_service import SessionService
from BackEnd.utils.validators import Validators
from BackEnd.utils.database import Database
import logging

logger = logging.getLogger(__name__)

auth_bp = Blueprint('auth', __name__, url_prefix='/api')


def init_auth_routes(app, config):

    email_service = EmailService(config)
    jwt_service = JWTService(config.JWT_SECRET_KEY, config.JWT_ALGORITHM)
    google_oauth_service = GoogleOAuthService(config.GOOGLE_CLIENT_ID)

    app.config['JWT_SERVICE'] = jwt_service

    # ---------- SEND OTP ----------
    @auth_bp.route('/send-otp', methods=['POST', 'OPTIONS'])
    def send_otp():
        """Send OTP to email for verification"""
        
        # Handle CORS preflight
        if request.method == 'OPTIONS':
            response = jsonify(success=True)
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
            response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
            return response, 200

        try:
            logger.info("=" * 50)
            logger.info("📧 SEND OTP REQUEST RECEIVED")
            logger.info("=" * 50)
            
            data = request.get_json(silent=True)
            logger.info(f"📦 Request data: {data}")
            
            if not data or 'email' not in data:
                logger.error("❌ No email provided in request")
                return jsonify(
                    success=False,
                    message='Email is required'
                ), 400

            email = data['email'].strip().lower()
            logger.info(f"📧 Processing OTP request for: {email}")

            # Validate email format
            is_valid, msg = Validators.validate_email_format(email)
            if not is_valid:
                logger.error(f"❌ Invalid email format: {msg}")
                return jsonify(
                    success=False,
                    message=msg
                ), 400

            logger.info("✅ Email format is valid")

            # Check rate limiting
            logger.info("🚦 Checking rate limits...")
            can_request, message = OTPService.can_request_otp(
                email, 
                'registration',
                config.OTP_MAX_ATTEMPTS,
                config.OTP_EXPIRY_MINUTES
            )

            if not can_request:
                logger.warning(f"⚠️ Rate limit exceeded for {email}: {message}")
                return jsonify(
                    success=False,
                    message=message
                ), 429

            logger.info("✅ Rate limit check passed")

            # Generate and store OTP
            logger.info("🔢 Generating OTP...")
            otp_code, expires_at = OTPService.create_otp(
                email, 
                'registration',
                config.OTP_EXPIRY_MINUTES
            )

            if not otp_code:
                logger.error("❌ CRITICAL: OTP generation failed!")
                logger.error("This usually means:")
                logger.error("1. Database INSERT failed")
                logger.error("2. otp_verification table is missing columns")
                logger.error("3. Database connection issue")
                
                # Try to get more info about the table
                try:
                    check_query = "DESCRIBE otp_verification"
                    table_info = Database.execute_query(check_query, fetch='all')
                    logger.info(f"📋 otp_verification table structure: {table_info}")
                except Exception as e:
                    logger.error(f"❌ Could not check table structure: {e}")
                
                return jsonify(
                    success=False,
                    message='Failed to generate OTP. Database error. Please contact support.'
                ), 500

            logger.info(f"✅ OTP generated successfully: {otp_code}")
            logger.info(f"⏰ Expires at: {expires_at}")

            # Send OTP email
            logger.info(f"📤 Sending OTP email to {email}...")
            email_success, email_msg = email_service.send_otp_email(
                email, 
                otp_code, 
                expires_at
            )

            if not email_success:
                logger.error(f"❌ Failed to send OTP email: {email_msg}")
                return jsonify(
                    success=False,
                    message=f'Failed to send OTP email: {email_msg}'
                ), 500

            logger.info(f"✅ OTP sent successfully to {email}")
            logger.info("=" * 50)
            
            return jsonify(
                success=True,
                message='OTP sent successfully. Please check your email',
                expires_in_minutes=config.OTP_EXPIRY_MINUTES
            ), 200

        except Exception as e:
            logger.error("=" * 50)
            logger.error("❌ SEND OTP ERROR")
            logger.exception(f"Full error traceback: {e}")
            logger.error("=" * 50)
            return jsonify(
                success=False,
                message=f'Internal server error: {str(e)}'
            ), 500

    # ---------- VERIFY OTP ----------
    @auth_bp.route('/verify-otp', methods=['POST', 'OPTIONS'])
    def verify_otp():
        """Verify OTP code"""
        
        # Handle CORS preflight
        if request.method == 'OPTIONS':
            response = jsonify(success=True)
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
            response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
            return response, 200

        try:
            data = request.get_json(silent=True)
            
            if not data or 'email' not in data or 'otp' not in data:
                return jsonify(
                    success=False,
                    message='Email and OTP are required'
                ), 400

            email = data['email'].strip().lower()
            otp = data['otp'].strip()

            # Validate OTP format
            is_valid, msg = Validators.validate_otp(otp)
            if not is_valid:
                return jsonify(
                    success=False,
                    message=msg
                ), 400

            # Verify OTP
            is_valid, message = OTPService.verify_otp(email, otp, 'registration')

            if is_valid:
                logger.info(f"OTP verified successfully for {email}")
                return jsonify(
                    success=True,
                    message='OTP verified successfully'
                ), 200
            else:
                return jsonify(
                    success=False,
                    message=message
                ), 400

        except Exception as e:
            logger.exception("Verify OTP error")
            return jsonify(
                success=False,
                message='Internal server error. Please try again later'
            ), 500

    # ---------- REGISTER ----------
    @auth_bp.route('/register', methods=['POST', 'OPTIONS'])
    def register():
        """Register new user"""
        
        # Handle CORS preflight
        if request.method == 'OPTIONS':
            response = jsonify(success=True)
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
            response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
            return response, 200

        try:
            data = request.get_json(silent=True)

            if not data:
                return jsonify(
                    success=False,
                    message='No data provided'
                ), 400

            # Check if OTP was verified
            if not data.get('otp_verified'):
                return jsonify(
                    success=False,
                    message='Email must be verified with OTP before registration'
                ), 400

            # Validate all registration data
            is_valid, errors = Validators.validate_registration_data(data)
            
            if not is_valid:
                return jsonify(
                    success=False,
                    message='Validation failed',
                    errors=errors
                ), 400

            # Create user
            success, result = User.create_user(data)

            if success:
                user_id = result
                user = User.get_user_by_id(user_id)
                
                # Send welcome email
                email_service.send_welcome_email(
                    user['email'],
                    user['username'],
                    user.get('full_name')
                )

                logger.info(f"User registered successfully: {user['email']}")
                
                return jsonify(
                    success=True,
                    message='Registration successful',
                    user=user
                ), 201
            else:
                return jsonify(
                    success=False,
                    message=result
                ), 400

        except Exception as e:
            logger.exception("Registration error")
            return jsonify(
                success=False,
                message='Internal server error. Please try again later'
            ), 500

    # ---------- LOGIN ----------
    @auth_bp.route('/login', methods=['POST', 'OPTIONS'])
    def login():
        """User login"""
        
        # Handle CORS preflight
        if request.method == 'OPTIONS':
            return jsonify(success=True), 200

        try:
            data = request.get_json(silent=True)

            if not data or 'email' not in data or 'password' not in data:
                return jsonify(
                    success=False,
                    message='Email and password are required'
                ), 400

            email_or_username = data['email'].strip()
            password = data['password']
            ip_address = request.remote_addr

            is_locked, remaining_time = User.is_account_locked(
                email_or_username,
                config.MAX_LOGIN_ATTEMPTS,
                config.LOGIN_LOCKOUT_MINUTES
            )

            if is_locked:
                return jsonify(
                    success=False,
                    message=f'Account locked. Try again in {remaining_time} minutes'
                ), 429

            success, result = User.authenticate(email_or_username, password)
            User.record_login_attempt(email_or_username, ip_address, success)

            if not success:
                return jsonify(success=False, message=result), 401

            user = result

            access_token = jwt_service.generate_token(
                user['id'],
                user['email'],
                user['username'],
                expires_in_hours=config.JWT_ACCESS_TOKEN_EXPIRES
            )

            refresh_token = jwt_service.generate_refresh_token(
                user['id'],
                user['email'],
                expires_in_days=config.JWT_REFRESH_TOKEN_EXPIRES
            )

            SessionService.create_session(
                user['id'],
                access_token,
                ip_address,
                request.headers.get('User-Agent', ''),
                config.JWT_ACCESS_TOKEN_EXPIRES
            )

            return jsonify(
                success=True,
                message='Login successful',
                user=user,
                access_token=access_token,
                refresh_token=refresh_token,
                token_type='Bearer',
                expires_in=config.JWT_ACCESS_TOKEN_EXPIRES * 3600
            ), 200

        except Exception as e:
            logger.exception("Login error")
            return jsonify(success=False, message='Internal server error'), 500

    # ---------- FORGOT PASSWORD ----------
    @auth_bp.route('/forgot-password', methods=['POST', 'OPTIONS'])
    def forgot_password():
        """Request password reset link"""
        if request.method == 'OPTIONS':
            return jsonify(success=True), 200
        
        try:
            data = request.get_json(silent=True)
            
            if not data:
                return jsonify(success=False, message='No data provided'), 400
            
            email = data.get('email', '').strip().lower()
            
            if not email:
                return jsonify(success=False, message='Email is required'), 400
            
            is_valid, msg = Validators.validate_email_format(email)
            if not is_valid:
                return jsonify(success=False, message=msg), 400
            
            can_request, message = PasswordResetService.can_request_reset(
                email, max_attempts=3, window_hours=1
            )
            
            if not can_request:
                logger.warning(f"Rate limit exceeded for password reset: {email}")
                return jsonify(success=False, message=message), 429
            
            user = User.get_user_by_email(email)
            
            success_message = "If an account exists with this email, you will receive a password reset link shortly."
            
            if not user:
                logger.info(f"Password reset requested for non-existent email: {email}")
                return jsonify(success=True, message=success_message), 200
            
            if user.get('google_id') and not user.get('password_hash'):
                logger.info(f"Password reset requested for OAuth-only account: {email}")
                return jsonify(
                    success=False,
                    message='This account uses Google Sign-In. Please use "Sign in with Google" instead.'
                ), 400
            
            reset_token = jwt_service.generate_password_reset_token(email, expires_in_hours=1)
            
            if not reset_token:
                logger.error(f"Failed to generate reset token for: {email}")
                return jsonify(success=False, message='Failed to generate reset token. Please try again.'), 500
            
            success, db_message = PasswordResetService.create_reset_request(
                email, reset_token, expires_in_hours=1
            )
            
            if not success:
                logger.error(f"Failed to store reset request: {db_message}")
                return jsonify(success=False, message='Failed to process reset request. Please try again.'), 500
            
            email_success, email_message = email_service.send_password_reset_email(email, reset_token)
            
            if not email_success:
                logger.error(f"Failed to send reset email to {email}: {email_message}")
                return jsonify(success=False, message='Failed to send reset email. Please try again later.'), 500
            
            logger.info(f"Password reset email sent to: {email}")
            
            return jsonify(success=True, message=success_message), 200
            
        except Exception as e:
            logger.exception(f"Error in forgot_password: {e}")
            return jsonify(success=False, message='An error occurred. Please try again later.'), 500

    # ---------- RESET PASSWORD ----------
    @auth_bp.route('/reset-password', methods=['POST', 'OPTIONS'])
    def reset_password():
        """Reset password using token"""
        if request.method == 'OPTIONS':
            return jsonify(success=True), 200
        
        try:
            data = request.get_json(silent=True)
            
            if not data:
                return jsonify(success=False, message='No data provided'), 400
            
            token = data.get('token', '').strip()
            new_password = data.get('new_password', '')
            
            if not token:
                return jsonify(success=False, message='Reset token is required'), 400
            
            if not new_password:
                return jsonify(success=False, message='New password is required'), 400
            
            is_valid, password_message = Validators.validate_password(new_password)
            if not is_valid:
                return jsonify(success=False, message=password_message), 400
            
            token_valid, email_or_error = jwt_service.verify_password_reset_token(token)
            
            if not token_valid:
                logger.warning(f"Invalid reset token attempt: {email_or_error}")
                return jsonify(success=False, message=email_or_error), 400
            
            email = email_or_error
            
            db_valid, db_email_or_error = PasswordResetService.verify_reset_token(token)
            
            if not db_valid:
                logger.warning(f"Reset token verification failed for {email}: {db_email_or_error}")
                return jsonify(success=False, message=db_email_or_error), 400
            
            user = User.get_user_by_email(email)
            
            if not user:
                logger.error(f"User not found during password reset: {email}")
                return jsonify(success=False, message='User not found'), 404
            
            success, update_message = User.update_password(user['id'], new_password)
            
            if not success:
                logger.error(f"Failed to update password for {email}: {update_message}")
                return jsonify(success=False, message='Failed to update password. Please try again.'), 500
            
            PasswordResetService.mark_token_as_used(token)
            SessionService.delete_user_sessions(user['id'])
            
            logger.info(f"Password reset successful for: {email}")
            
            return jsonify(
                success=True,
                message='Password reset successful. Please login with your new password.'
            ), 200
            
        except Exception as e:
            logger.exception(f"Error in reset_password: {e}")
            return jsonify(success=False, message='An error occurred. Please try again later.'), 500

    # ---------- VERIFY RESET TOKEN ----------
    @auth_bp.route('/verify-reset-token', methods=['POST', 'OPTIONS'])
    def verify_reset_token():
        """Verify if reset token is valid"""
        if request.method == 'OPTIONS':
            return jsonify(success=True), 200
        
        try:
            data = request.get_json(silent=True)
            
            if not data:
                return jsonify(success=False, message='No data provided'), 400
            
            token = data.get('token', '').strip()
            
            if not token:
                return jsonify(success=False, message='Token is required'), 400
            
            token_valid, email_or_error = jwt_service.verify_password_reset_token(token)
            
            if not token_valid:
                return jsonify(success=False, message=email_or_error), 400
            
            db_valid, db_email_or_error = PasswordResetService.verify_reset_token(token)
            
            if not db_valid:
                return jsonify(success=False, message=db_email_or_error), 400
            
            email = email_or_error
            email_parts = email.split('@')
            if len(email_parts) == 2:
                masked_email = email_parts[0][:2] + '***@' + email_parts[1]
            else:
                masked_email = '***@***'
            
            return jsonify(success=True, message='Token is valid', email=masked_email), 200
            
        except Exception as e:
            logger.exception(f"Error in verify_reset_token: {e}")
            return jsonify(success=False, message='An error occurred verifying the token'), 500

    # ---------- AUTH HEALTH ----------
    @auth_bp.route('/health-auth', methods=['GET', 'OPTIONS'])
    def auth_health():
        """Health check for auth routes"""
        return jsonify(status='ok'), 200

    # Register blueprint
    app.register_blueprint(auth_bp)