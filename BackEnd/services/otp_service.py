import random
import string
from datetime import datetime, timedelta
from utils.database import Database
import logging

logger = logging.getLogger(__name__)


class OTPService:
    """OTP generation and verification service"""
    
    @staticmethod
    def generate_otp(length=6):
        """Generate a random numeric OTP"""
        return ''.join(random.choices(string.digits, k=length))
    
    @staticmethod
    def create_otp(email, purpose='registration', expiry_minutes=10):
        """
        Create and store OTP for email verification
        Returns: (otp_code, expires_at) or (None, None) on error
        """
        try:
            # Generate OTP
            otp_code = OTPService.generate_otp()
            
            # Calculate expiry time
            expires_at = datetime.now() + timedelta(minutes=expiry_minutes)
            
            # Delete any existing OTPs for this email and purpose
            delete_query = """
                DELETE FROM otp_verification 
                WHERE email = %s AND purpose = %s
            """
            Database.execute_query(delete_query, (email, purpose))
            
            # Insert new OTP
            insert_query = """
                INSERT INTO otp_verification 
                (email, otp_code, purpose, expires_at) 
                VALUES (%s, %s, %s, %s)
            """
            Database.execute_query(
                insert_query, 
                (email, otp_code, purpose, expires_at)
            )
            
            logger.info(f"OTP created for {email}: {otp_code} (expires at {expires_at})")
            return otp_code, expires_at
            
        except Exception as e:
            logger.error(f"Error creating OTP: {e}")
            return None, None
    
    @staticmethod
    def verify_otp(email, otp_code, purpose='registration'):
        """
        Verify OTP for email
        Returns: (is_valid, message)
        """
        try:
            # Get OTP record
            query = """
                SELECT id, otp_code, expires_at, is_verified 
                FROM otp_verification 
                WHERE email = %s AND purpose = %s 
                ORDER BY created_at DESC 
                LIMIT 1
            """
            result = Database.execute_query(query, (email, purpose), fetch='one')
            
            if not result:
                return False, "No OTP found for this email"
            
            # Check if already verified
            if result['is_verified']:
                return False, "OTP has already been used"
            
            # Check if expired
            if datetime.now() > result['expires_at']:
                return False, "OTP has expired. Please request a new one"
            
            # Check if OTP matches
            if result['otp_code'] != otp_code:
                return False, "Invalid OTP code"
            
            # Mark OTP as verified
            update_query = """
                UPDATE otp_verification 
                SET is_verified = TRUE 
                WHERE id = %s
            """
            Database.execute_query(update_query, (result['id'],))
            
            logger.info(f"OTP verified successfully for {email}")
            return True, "OTP verified successfully"
            
        except Exception as e:
            logger.error(f"Error verifying OTP: {e}")
            return False, "Error verifying OTP"
    
    @staticmethod
    def is_otp_verified(email, purpose='registration'):
        """
        Check if email has a verified OTP
        Returns: Boolean
        """
        try:
            query = """
                SELECT id FROM otp_verification 
                WHERE email = %s 
                AND purpose = %s 
                AND is_verified = TRUE 
                AND expires_at > NOW()
                ORDER BY created_at DESC 
                LIMIT 1
            """
            result = Database.execute_query(query, (email, purpose), fetch='one')
            
            return result is not None
            
        except Exception as e:
            logger.error(f"Error checking OTP verification: {e}")
            return False
    
    @staticmethod
    def cleanup_expired_otps():
        """
        Delete expired OTPs from database
        Should be run periodically (e.g., daily cron job)
        """
        try:
            query = """
                DELETE FROM otp_verification 
                WHERE expires_at < NOW()
            """
            Database.execute_query(query)
            logger.info("Expired OTPs cleaned up")
            
        except Exception as e:
            logger.error(f"Error cleaning up expired OTPs: {e}")
    
    @staticmethod
    def get_otp_attempts(email, purpose='registration', minutes=10):
        """
        Get number of OTP attempts in the last N minutes
        Used for rate limiting
        Returns: number of attempts
        """
        try:
            time_ago = datetime.now() - timedelta(minutes=minutes)
            
            query = """
                SELECT COUNT(*) as count 
                FROM otp_verification 
                WHERE email = %s 
                AND purpose = %s 
                AND created_at > %s
            """
            result = Database.execute_query(
                query, 
                (email, purpose, time_ago), 
                fetch='one'
            )
            
            return result['count'] if result else 0
            
        except Exception as e:
            logger.error(f"Error getting OTP attempts: {e}")
            return 0
    
    @staticmethod
    def can_request_otp(email, purpose='registration', max_attempts=5, window_minutes=10):
        """
        Check if user can request another OTP (rate limiting)
        Returns: (can_request, message)
        """
        attempts = OTPService.get_otp_attempts(email, purpose, window_minutes)
        
        if attempts >= max_attempts:
            return False, f"Too many OTP requests. Please try again after {window_minutes} minutes"
        
        return True, f"Can request OTP ({attempts}/{max_attempts} attempts used)"
    
    @staticmethod
    def resend_otp(email, purpose='registration', expiry_minutes=10):
        """
        Resend OTP (with rate limiting)
        Returns: (success, otp_code/message, expires_at/None)
        """
        # Check rate limiting
        can_request, message = OTPService.can_request_otp(email, purpose)
        
        if not can_request:
            return False, message, None
        
        # Generate new OTP
        otp_code, expires_at = OTPService.create_otp(email, purpose, expiry_minutes)
        
        if otp_code:
            return True, otp_code, expires_at
        else:
            return False, "Failed to generate OTP", None