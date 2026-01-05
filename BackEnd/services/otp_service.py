import random
import string
from datetime import datetime, timedelta
from BackEnd.utils.database import Database
import logging

logger = logging.getLogger(__name__)


class OTPService:
    """OTP generation and verification service"""
    
    @staticmethod
    def generate_otp(length=6):
        """Generate a random numeric OTP"""
        otp = ''.join(random.choices(string.digits, k=length))
        logger.info(f"🔢 Generated OTP: {otp}")
        return otp
    
    @staticmethod
    def create_otp(email, purpose='registration', expiry_minutes=10):
        """
        Create and store OTP for email verification
        Returns: (otp_code, expires_at) or (None, None) on error
        """
        try:
            logger.info(f"📝 Creating OTP for {email} (purpose: {purpose})")
            
            # Generate OTP
            otp_code = OTPService.generate_otp()
            
            # Calculate expiry time
            expires_at = datetime.now() + timedelta(minutes=expiry_minutes)
            logger.info(f"⏰ OTP will expire at: {expires_at}")
            
            # Delete any existing OTPs for this email and purpose
            delete_query = """
                DELETE FROM otp_verification 
                WHERE email = %s AND purpose = %s
            """
            deleted = Database.execute_query(delete_query, (email, purpose))
            if deleted:
                logger.info(f"🗑️ Deleted existing OTP records for {email}")
            
            # Insert new OTP - FIXED: using 'otp' instead of 'otp_code'
            insert_query = """
                INSERT INTO otp_verification 
                (email, otp, purpose, expires_at) 
                VALUES (%s, %s, %s, %s)
            """
            result = Database.execute_query(
                insert_query, 
                (email, otp_code, purpose, expires_at)
            )
            
            if result:
                logger.info(f"✅ OTP created successfully for {email}: {otp_code} (expires at {expires_at})")
                return otp_code, expires_at
            else:
                logger.error(f"❌ Failed to insert OTP into database for {email}")
                logger.error(f"Query: {insert_query}")
                logger.error(f"Values: ({email}, {otp_code}, {purpose}, {expires_at})")
                return None, None
            
        except Exception as e:
            logger.error(f"❌ Error creating OTP for {email}: {e}")
            logger.exception("Full error traceback:")
            return None, None
    
    @staticmethod
    def verify_otp(email, otp_code, purpose='registration'):
        """
        Verify OTP for email
        Returns: (is_valid, message)
        """
        try:
            logger.info(f"🔍 Verifying OTP for {email} (code: {otp_code}, purpose: {purpose})")
            
            # Get OTP record - FIXED: using 'otp' instead of 'otp_code'
            query = """
                SELECT id, otp, expires_at, is_verified 
                FROM otp_verification 
                WHERE email = %s AND purpose = %s 
                ORDER BY created_at DESC 
                LIMIT 1
            """
            result = Database.execute_query(query, (email, purpose), fetch='one')
            
            if not result:
                logger.warning(f"⚠️ No OTP found for {email}")
                return False, "No OTP found for this email"
            
            logger.info(f"📋 Found OTP record: ID={result['id']}, Code={result['otp']}, Verified={result['is_verified']}, Expires={result['expires_at']}")
            
            # Check if already verified
            if result['is_verified']:
                logger.warning(f"⚠️ OTP already used for {email}")
                return False, "OTP has already been used"
            
            # Check if expired
            if datetime.now() > result['expires_at']:
                logger.warning(f"⚠️ OTP expired for {email} (expired at {result['expires_at']})")
                return False, "OTP has expired. Please request a new one"
            
            # Check if OTP matches - FIXED: using 'otp' instead of 'otp_code'
            if result['otp'] != otp_code:
                logger.warning(f"⚠️ Invalid OTP for {email}. Expected: {result['otp']}, Got: {otp_code}")
                return False, "Invalid OTP code"
            
            # Mark OTP as verified
            update_query = """
                UPDATE otp_verification 
                SET is_verified = TRUE 
                WHERE id = %s
            """
            Database.execute_query(update_query, (result['id'],))
            
            logger.info(f"✅ OTP verified successfully for {email}")
            return True, "OTP verified successfully"
            
        except Exception as e:
            logger.error(f"❌ Error verifying OTP for {email}: {e}")
            logger.exception("Full error traceback:")
            return False, "Error verifying OTP"
    
    @staticmethod
    def is_otp_verified(email, purpose='registration'):
        """
        Check if email has a verified OTP
        Returns: Boolean
        """
        try:
            logger.info(f"🔎 Checking if OTP is verified for {email} (purpose: {purpose})")
            
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
            
            is_verified = result is not None
            logger.info(f"{'✅' if is_verified else '❌'} OTP verification status for {email}: {is_verified}")
            
            return is_verified
            
        except Exception as e:
            logger.error(f"❌ Error checking OTP verification for {email}: {e}")
            logger.exception("Full error traceback:")
            return False
    
    @staticmethod
    def cleanup_expired_otps():
        """
        Delete expired OTPs from database
        Should be run periodically (e.g., daily cron job)
        """
        try:
            logger.info("🧹 Cleaning up expired OTPs...")
            
            query = """
                DELETE FROM otp_verification 
                WHERE expires_at < NOW()
            """
            result = Database.execute_query(query)
            
            logger.info(f"✅ Expired OTPs cleaned up successfully")
            
        except Exception as e:
            logger.error(f"❌ Error cleaning up expired OTPs: {e}")
            logger.exception("Full error traceback:")
    
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
            
            count = result['count'] if result else 0
            logger.info(f"📊 OTP attempts for {email} in last {minutes} minutes: {count}")
            
            return count
            
        except Exception as e:
            logger.error(f"❌ Error getting OTP attempts for {email}: {e}")
            logger.exception("Full error traceback:")
            return 0
    
    @staticmethod
    def can_request_otp(email, purpose='registration', max_attempts=5, window_minutes=10):
        """
        Check if user can request another OTP (rate limiting)
        Returns: (can_request, message)
        """
        logger.info(f"🚦 Checking rate limit for {email} (max: {max_attempts} in {window_minutes} min)")
        
        attempts = OTPService.get_otp_attempts(email, purpose, window_minutes)
        
        if attempts >= max_attempts:
            logger.warning(f"⚠️ Rate limit exceeded for {email}: {attempts}/{max_attempts} attempts")
            return False, f"Too many OTP requests. Please try again after {window_minutes} minutes"
        
        logger.info(f"✅ Rate limit OK for {email}: {attempts}/{max_attempts} attempts used")
        return True, f"Can request OTP ({attempts}/{max_attempts} attempts used)"
    
    @staticmethod
    def resend_otp(email, purpose='registration', expiry_minutes=10):
        """
        Resend OTP (with rate limiting)
        Returns: (success, otp_code/message, expires_at/None)
        """
        logger.info(f"🔄 Resending OTP for {email}")
        
        # Check rate limiting
        can_request, message = OTPService.can_request_otp(email, purpose)
        
        if not can_request:
            logger.warning(f"⚠️ Cannot resend OTP for {email}: {message}")
            return False, message, None
        
        # Generate new OTP
        otp_code, expires_at = OTPService.create_otp(email, purpose, expiry_minutes)
        
        if otp_code:
            logger.info(f"✅ OTP resent successfully for {email}")
            return True, otp_code, expires_at
        else:
            logger.error(f"❌ Failed to resend OTP for {email}")
            return False, "Failed to generate OTP", None