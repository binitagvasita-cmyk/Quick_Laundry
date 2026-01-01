from datetime import datetime, timedelta
from utils.database import Database
import logging

logger = logging.getLogger(__name__)


class PasswordResetService:
    """Password reset token management service"""
    
    @staticmethod
    def create_reset_request(email, token, expires_in_hours=1):
        """
        Create password reset request in database
        Returns: (success, message)
        """
        try:
            expires_at = datetime.now() + timedelta(hours=expires_in_hours)
            
            # Delete any existing reset requests for this email
            delete_query = """
                DELETE FROM password_reset_tokens 
                WHERE email = %s
            """
            Database.execute_query(delete_query, (email,))
            
            # Insert new reset request
            insert_query = """
                INSERT INTO password_reset_tokens 
                (email, token, expires_at)
                VALUES (%s, %s, %s)
            """
            
            reset_id = Database.execute_query(
                insert_query,
                (email, token, expires_at)
            )
            
            if reset_id:
                logger.info(f"Password reset request created for: {email}")
                return True, "Reset request created"
            else:
                return False, "Failed to create reset request"
                
        except Exception as e:
            logger.error(f"Error creating reset request: {e}")
            return False, str(e)
    
    @staticmethod
    def verify_reset_token(token):
        """
        Verify password reset token
        Returns: (is_valid, email/error_message)
        """
        try:
            query = """
                SELECT id, email, token, expires_at, is_used
                FROM password_reset_tokens
                WHERE token = %s
            """
            
            result = Database.execute_query(query, (token,), fetch='one')
            
            if not result:
                return False, "Invalid reset token"
            
            # Check if already used
            if result['is_used']:
                return False, "Reset token has already been used"
            
            # Check if expired
            if datetime.now() > result['expires_at']:
                return False, "Reset token has expired"
            
            return True, result['email']
            
        except Exception as e:
            logger.error(f"Error verifying reset token: {e}")
            return False, str(e)
    
    @staticmethod
    def mark_token_as_used(token):
        """
        Mark reset token as used
        Returns: (success, message)
        """
        try:
            query = """
                UPDATE password_reset_tokens
                SET is_used = TRUE, used_at = NOW()
                WHERE token = %s
            """
            
            Database.execute_query(query, (token,))
            logger.info("Reset token marked as used")
            
            return True, "Token marked as used"
            
        except Exception as e:
            logger.error(f"Error marking token as used: {e}")
            return False, str(e)
    
    @staticmethod
    def get_reset_attempts(email, hours=1):
        """
        Get number of reset attempts in last N hours
        Used for rate limiting
        Returns: count
        """
        try:
            time_ago = datetime.now() - timedelta(hours=hours)
            
            query = """
                SELECT COUNT(*) as count
                FROM password_reset_tokens
                WHERE email = %s AND created_at > %s
            """
            
            result = Database.execute_query(query, (email, time_ago), fetch='one')
            return result['count'] if result else 0
            
        except Exception as e:
            logger.error(f"Error getting reset attempts: {e}")
            return 0
    
    @staticmethod
    def can_request_reset(email, max_attempts=3, window_hours=1):
        """
        Check if user can request password reset (rate limiting)
        Returns: (can_request, message)
        """
        attempts = PasswordResetService.get_reset_attempts(email, window_hours)
        
        if attempts >= max_attempts:
            return False, f"Too many reset requests. Please try again after {window_hours} hour(s)"
        
        return True, f"Can request reset ({attempts}/{max_attempts} attempts used)"
    
    @staticmethod
    def cleanup_expired_tokens():
        """
        Delete expired reset tokens from database
        Should be run periodically (e.g., daily cron job)
        """
        try:
            query = """
                DELETE FROM password_reset_tokens
                WHERE expires_at < NOW()
            """
            
            Database.execute_query(query)
            logger.info("Expired password reset tokens cleaned up")
            
        except Exception as e:
            logger.error(f"Error cleaning up expired tokens: {e}")
    
    @staticmethod
    def delete_user_reset_tokens(email):
        """
        Delete all reset tokens for a user
        Returns: (success, message)
        """
        try:
            query = "DELETE FROM password_reset_tokens WHERE email = %s"
            Database.execute_query(query, (email,))
            
            logger.info(f"All reset tokens deleted for: {email}")
            return True, "Reset tokens deleted"
            
        except Exception as e:
            logger.error(f"Error deleting reset tokens: {e}")
            return False, str(e)