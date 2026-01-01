import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify
import logging

logger = logging.getLogger(__name__)


class JWTService:
    """JWT token management service"""
    
    def __init__(self, secret_key, algorithm='HS256'):
        self.secret_key = secret_key
        self.algorithm = algorithm
    
    def generate_token(self, user_id, email, username, expires_in_hours=24):
        """
        Generate JWT token for user
        Returns: token string
        """
        try:
            payload = {
                'user_id': user_id,
                'email': email,
                'username': username,
                'iat': datetime.utcnow(),
                'exp': datetime.utcnow() + timedelta(hours=expires_in_hours)
            }
            
            token = jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
            logger.info(f"Token generated for user: {email}")
            
            return token
            
        except Exception as e:
            logger.error(f"Error generating token: {e}")
            return None
    
    def generate_refresh_token(self, user_id, email, expires_in_days=30):
        """
        Generate refresh token for extended sessions
        Returns: refresh token string
        """
        try:
            payload = {
                'user_id': user_id,
                'email': email,
                'type': 'refresh',
                'iat': datetime.utcnow(),
                'exp': datetime.utcnow() + timedelta(days=expires_in_days)
            }
            
            token = jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
            logger.info(f"Refresh token generated for user: {email}")
            
            return token
            
        except Exception as e:
            logger.error(f"Error generating refresh token: {e}")
            return None
    
    def verify_token(self, token):
        """
        Verify JWT token
        Returns: (is_valid, payload/error_message)
        """
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return True, payload
            
        except jwt.ExpiredSignatureError:
            return False, "Token has expired"
        except jwt.InvalidTokenError:
            return False, "Invalid token"
        except Exception as e:
            logger.error(f"Error verifying token: {e}")
            return False, str(e)
    
    def generate_password_reset_token(self, email, expires_in_hours=1):
        """
        Generate password reset token
        Returns: token string
        """
        try:
            payload = {
                'email': email,
                'type': 'password_reset',
                'iat': datetime.utcnow(),
                'exp': datetime.utcnow() + timedelta(hours=expires_in_hours)
            }
            
            token = jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
            logger.info(f"Password reset token generated for: {email}")
            
            return token
            
        except Exception as e:
            logger.error(f"Error generating password reset token: {e}")
            return None
    
    def verify_password_reset_token(self, token):
        """
        Verify password reset token
        Returns: (is_valid, email/error_message)
        """
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            
            if payload.get('type') != 'password_reset':
                return False, "Invalid token type"
            
            return True, payload.get('email')
            
        except jwt.ExpiredSignatureError:
            return False, "Reset link has expired"
        except jwt.InvalidTokenError:
            return False, "Invalid reset link"
        except Exception as e:
            logger.error(f"Error verifying password reset token: {e}")
            return False, str(e)


def token_required(f):
    """
    Decorator to protect routes that require authentication
    Usage: @token_required
    
    CRITICAL FIX: Allows OPTIONS requests to pass through for CORS preflight
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        # CRITICAL FIX: Allow OPTIONS requests without authentication
        # This must be checked BEFORE any authentication logic
        if request.method == 'OPTIONS':
            return jsonify({'success': True}), 200
        
        token = None
        
        # Get token from header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]  # Bearer <token>
            except IndexError:
                logger.warning("Invalid token format in Authorization header")
                return jsonify({
                    'success': False,
                    'message': 'Invalid token format'
                }), 401
        
        if not token:
            logger.warning(f"Missing authentication token for {request.method} {request.path}")
            return jsonify({
                'success': False,
                'message': 'Authentication token is missing'
            }), 401
        
        try:
            # Get JWT service from app config
            from flask import current_app
            jwt_service = current_app.config.get('JWT_SERVICE')
            
            if not jwt_service:
                logger.error("JWT_SERVICE not configured in app config")
                return jsonify({
                    'success': False,
                    'message': 'JWT service not configured'
                }), 500
            
            # Verify token
            is_valid, payload = jwt_service.verify_token(token)
            
            if not is_valid:
                logger.warning(f"Token verification failed: {payload}")
                return jsonify({
                    'success': False,
                    'message': payload  # Error message
                }), 401
            
            # Add user info to request
            request.current_user = payload
            logger.debug(f"Authenticated user {payload.get('user_id')} for {request.method} {request.path}")
            
        except Exception as e:
            logger.exception(f"Token verification error: {e}")
            return jsonify({
                'success': False,
                'message': 'Invalid or expired token'
            }), 401
        
        return f(*args, **kwargs)
    
    return decorated


def optional_token(f):
    """
    Decorator for routes that work with or without authentication
    Usage: @optional_token
    
    If a valid token is provided, user info is added to request.current_user
    If no token or invalid token, request continues without authentication
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        # OPTIONS requests always pass through
        if request.method == 'OPTIONS':
            return jsonify({'success': True}), 200
        
        token = None
        
        # Get token from header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                logger.debug("Invalid token format in optional_token")
                pass
        
        if token:
            try:
                from flask import current_app
                jwt_service = current_app.config.get('JWT_SERVICE')
                
                if jwt_service:
                    is_valid, payload = jwt_service.verify_token(token)
                    if is_valid:
                        request.current_user = payload
                        logger.debug(f"Optional token validated for user {payload.get('user_id')}")
            except Exception as e:
                logger.debug(f"Optional token verification error: {e}")
                # Continue without authentication
                pass
        
        return f(*args, **kwargs)
    
    return decorated