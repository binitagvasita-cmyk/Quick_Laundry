import bcrypt
from datetime import datetime
from BackEnd.utils.database import Database
import logging

logger = logging.getLogger(__name__)


class User:
    """User model for database operations"""
    
    @staticmethod
    def hash_password(password):
        """Hash password using bcrypt"""
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    @staticmethod
    def verify_password(password, hashed_password):
        """Verify password against hash"""
        try:
            return bcrypt.checkpw(
                password.encode('utf-8'), 
                hashed_password.encode('utf-8')
            )
        except Exception as e:
            logger.error(f"Error verifying password: {e}")
            return False
    
    @staticmethod
    def email_exists(email):
        """Check if email already exists"""
        try:
            query = "SELECT id FROM users WHERE email = %s"
            result = Database.execute_query(query, (email,), fetch='one')
            return result is not None
        except Exception as e:
            logger.error(f"Error checking email existence: {e}")
            return False
    
    @staticmethod
    def username_exists(username):
        """Check if username already exists"""
        try:
            query = "SELECT id FROM users WHERE username = %s"
            result = Database.execute_query(query, (username,), fetch='one')
            return result is not None
        except Exception as e:
            logger.error(f"Error checking username existence: {e}")
            return False
    
    @staticmethod
    def phone_exists(phone):
        """Check if phone number already exists"""
        try:
            query = "SELECT id FROM users WHERE phone = %s"
            result = Database.execute_query(query, (phone,), fetch='one')
            return result is not None
        except Exception as e:
            logger.error(f"Error checking phone existence: {e}")
            return False
    
    @staticmethod
    def create_user(user_data):
        """
        Create a new user in database
        Returns: (success, user_id/error_message)
        """
        connection = None
        cursor = None
        
        try:
            # Check if email exists
            if User.email_exists(user_data['email']):
                logger.warning(f"Email already exists: {user_data['email']}")
                return False, "Email already registered"
            
            # Check if username exists
            if User.username_exists(user_data['username']):
                logger.warning(f"Username already exists: {user_data['username']}")
                return False, "Username already taken"
            
            # Check if phone exists
            if User.phone_exists(user_data['phone']):
                logger.warning(f"Phone already exists: {user_data['phone']}")
                return False, "Phone number already registered"
            
            # Hash password
            password_hash = User.hash_password(user_data['password'])
            logger.info(f"Password hashed successfully for: {user_data['email']}")
            
            # Get database connection manually
            connection = Database.get_connection()
            cursor = connection.cursor(dictionary=True)
            
            # Prepare insert query
            query = """
                INSERT INTO users (
                    email, username, password_hash, phone, full_name,
                    address, city, pincode, service_type, 
                    communication_preference, subscribe_newsletter,
                    profile_picture, email_verified
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
            """
            
            values = (
                user_data['email'],
                user_data['username'],
                password_hash,
                user_data['phone'],
                user_data.get('full_name'),
                user_data['address'],
                user_data['city'],
                user_data['pincode'],
                user_data.get('service_type', 'standard'),
                user_data.get('communication_preference', 'both'),
                user_data.get('subscribe_newsletter', False),
                user_data.get('profile_picture'),
                True  # email_verified = True since OTP was verified
            )
            
            logger.info(f"Executing INSERT for user: {user_data['email']}")
            
            # Execute query
            cursor.execute(query, values)
            connection.commit()
            
            # Get the inserted user ID
            user_id = cursor.lastrowid
            
            if user_id and user_id > 0:
                logger.info(f"User created successfully with ID {user_id}: {user_data['email']}")
                return True, user_id
            else:
                logger.error("User insert succeeded but no ID returned")
                return False, "Failed to create user - no ID returned"
                
        except Exception as e:
            logger.exception(f"Error creating user: {e}")
            if connection:
                connection.rollback()
            return False, str(e)
            
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()
    
    @staticmethod
    def create_google_user(user_data):
        """
        Create a new user from Google OAuth
        Returns: (success, user_id/error_message)
        """
        connection = None
        cursor = None
        
        try:
            # Check if email exists
            if User.email_exists(user_data['email']):
                logger.warning(f"Email already exists: {user_data['email']}")
                return False, "Email already registered"
            
            # Check if username exists
            if User.username_exists(user_data['username']):
                logger.warning(f"Username already exists: {user_data['username']}")
                return False, "Username already taken"
            
            # Get database connection
            connection = Database.get_connection()
            cursor = connection.cursor(dictionary=True)
            
            # Prepare insert query (no password for OAuth users)
            query = """
                INSERT INTO users (
                    email, username, phone, full_name,
                    address, city, pincode, service_type, 
                    communication_preference, subscribe_newsletter,
                    profile_picture, email_verified, google_id, oauth_provider
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
            """
            
            values = (
                user_data['email'],
                user_data['username'],
                user_data.get('phone', ''),
                user_data.get('full_name'),
                user_data.get('address', ''),
                user_data.get('city', ''),
                user_data.get('pincode', ''),
                user_data.get('service_type', 'standard'),
                user_data.get('communication_preference', 'both'),
                user_data.get('subscribe_newsletter', False),
                user_data.get('profile_picture'),
                True,  # email_verified = True for Google users
                user_data.get('google_id'),
                user_data.get('oauth_provider', 'google')
            )
            
            # Execute query
            cursor.execute(query, values)
            connection.commit()
            
            user_id = cursor.lastrowid
            
            if user_id and user_id > 0:
                logger.info(f"Google user created successfully with ID {user_id}: {user_data['email']}")
                return True, user_id
            else:
                logger.error("Google user insert succeeded but no ID returned")
                return False, "Failed to create user"
                
        except Exception as e:
            logger.exception(f"Error creating Google user: {e}")
            if connection:
                connection.rollback()
            return False, str(e)
            
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()
    
    @staticmethod
    def get_user_by_id(user_id):
        """Get user by ID"""
        try:
            query = """
                SELECT id, email, username, phone, full_name, address, 
                       city, pincode, service_type, communication_preference,
                       subscribe_newsletter, profile_picture, is_active,
                       email_verified, created_at, updated_at
                FROM users 
                WHERE id = %s
            """
            result = Database.execute_query(query, (user_id,), fetch='one')
            return result
        except Exception as e:
            logger.error(f"Error getting user by ID: {e}")
            return None
    
    @staticmethod
    def get_user_by_email(email):
        """Get user by email"""
        try:
            query = """
                SELECT id, email, username, password_hash, phone, full_name, 
                       address, city, pincode, service_type, 
                       communication_preference, subscribe_newsletter,
                       profile_picture, is_active, email_verified,
                       created_at, updated_at
                FROM users 
                WHERE email = %s
            """
            result = Database.execute_query(query, (email,), fetch='one')
            return result
        except Exception as e:
            logger.error(f"Error getting user by email: {e}")
            return None
    
    @staticmethod
    def get_user_by_username(username):
        """Get user by username"""
        try:
            query = """
                SELECT id, email, username, password_hash, phone, full_name,
                       address, city, pincode, service_type,
                       communication_preference, subscribe_newsletter,
                       profile_picture, is_active, email_verified,
                       created_at, updated_at
                FROM users 
                WHERE username = %s
            """
            result = Database.execute_query(query, (username,), fetch='one')
            return result
        except Exception as e:
            logger.error(f"Error getting user by username: {e}")
            return None
    
    @staticmethod
    def get_user_by_google_id(google_id):
        """Get user by Google ID"""
        try:
            query = """
                SELECT id, email, username, phone, full_name, 
                       address, city, pincode, service_type, 
                       communication_preference, subscribe_newsletter,
                       profile_picture, is_active, email_verified,
                       google_id, oauth_provider, created_at, updated_at
                FROM users 
                WHERE google_id = %s
            """
            result = Database.execute_query(query, (google_id,), fetch='one')
            return result
        except Exception as e:
            logger.error(f"Error getting user by Google ID: {e}")
            return None
    
    @staticmethod
    def update_user(user_id, update_data):
        """
        Update user information
        Returns: (success, message)
        """
        connection = None
        cursor = None
        
        try:
            # Build dynamic update query based on provided fields
            allowed_fields = [
                'full_name', 'phone', 'address', 'city', 'pincode',
                'service_type', 'communication_preference', 
                'subscribe_newsletter', 'profile_picture'
            ]
            
            update_fields = []
            values = []
            
            for field in allowed_fields:
                if field in update_data:
                    update_fields.append(f"{field} = %s")
                    values.append(update_data[field])
            
            if not update_fields:
                return False, "No fields to update"
            
            values.append(user_id)
            
            # Get database connection
            connection = Database.get_connection()
            cursor = connection.cursor()
            
            query = f"""
                UPDATE users 
                SET {', '.join(update_fields)}
                WHERE id = %s
            """
            
            cursor.execute(query, tuple(values))
            connection.commit()
            
            logger.info(f"User {user_id} updated successfully")
            return True, "User updated successfully"
            
        except Exception as e:
            logger.exception(f"Error updating user: {e}")
            if connection:
                connection.rollback()
            return False, str(e)
            
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()
    
    @staticmethod
    def update_password(user_id, new_password):
        """
        Update user password
        Returns: (success, message)
        """
        connection = None
        cursor = None
        
        try:
            password_hash = User.hash_password(new_password)
            
            connection = Database.get_connection()
            cursor = connection.cursor()
            
            query = "UPDATE users SET password_hash = %s WHERE id = %s"
            cursor.execute(query, (password_hash, user_id))
            connection.commit()
            
            logger.info(f"Password updated for user {user_id}")
            return True, "Password updated successfully"
            
        except Exception as e:
            logger.exception(f"Error updating password: {e}")
            if connection:
                connection.rollback()
            return False, str(e)
            
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()
    
    @staticmethod
    def deactivate_user(user_id):
        """
        Deactivate user account
        Returns: (success, message)
        """
        try:
            query = "UPDATE users SET is_active = FALSE WHERE id = %s"
            Database.execute_query(query, (user_id,))
            
            logger.info(f"User {user_id} deactivated")
            return True, "User deactivated successfully"
            
        except Exception as e:
            logger.error(f"Error deactivating user: {e}")
            return False, str(e)
    
    @staticmethod
    def activate_user(user_id):
        """
        Activate user account
        Returns: (success, message)
        """
        try:
            query = "UPDATE users SET is_active = TRUE WHERE id = %s"
            Database.execute_query(query, (user_id,))
            
            logger.info(f"User {user_id} activated")
            return True, "User activated successfully"
            
        except Exception as e:
            logger.error(f"Error activating user: {e}")
            return False, str(e)
    
    @staticmethod
    def delete_user(user_id):
        """
        Permanently delete user (use with caution)
        Returns: (success, message)
        """
        try:
            query = "DELETE FROM users WHERE id = %s"
            Database.execute_query(query, (user_id,))
            
            logger.info(f"User {user_id} deleted permanently")
            return True, "User deleted successfully"
            
        except Exception as e:
            logger.error(f"Error deleting user: {e}")
            return False, str(e)
    
    @staticmethod
    def get_user_safe(user_id):
        """
        Get user data without sensitive information (for API responses)
        Returns: user dict without password_hash
        """
        user = User.get_user_by_id(user_id)
        if user:
            # Remove password_hash if present
            if 'password_hash' in user:
                del user['password_hash']
        return user
    
    @staticmethod
    def authenticate(email_or_username, password):
        """
        Authenticate user with email/username and password
        Returns: (success, user_data/error_message)
        """
        try:
            # Try to find user by email first
            user = User.get_user_by_email(email_or_username)
            
            # If not found, try username
            if not user:
                user = User.get_user_by_username(email_or_username)
            
            if not user:
                return False, "Invalid credentials"
            
            # Check if account is active
            if not user['is_active']:
                return False, "Account is deactivated"
            
            # Verify password
            if not User.verify_password(password, user['password_hash']):
                return False, "Invalid credentials"
            
            # Remove password hash from response
            del user['password_hash']
            
            logger.info(f"User authenticated: {user['email']}")
            return True, user
            
        except Exception as e:
            logger.error(f"Error authenticating user: {e}")
            return False, "Authentication failed"
    
    @staticmethod
    def record_login_attempt(email, ip_address, success):
        """
        Record login attempt for security monitoring
        Returns: (success, message)
        """
        try:
            query = """
                INSERT INTO login_attempts (email, ip_address, success)
                VALUES (%s, %s, %s)
            """
            Database.execute_query(query, (email, ip_address, success))
            return True, "Login attempt recorded"
        except Exception as e:
            logger.error(f"Error recording login attempt: {e}")
            return False, str(e)
    
    @staticmethod
    def get_recent_login_attempts(email, minutes=15):
        """
        Get recent failed login attempts for rate limiting
        Returns: count of failed attempts
        """
        try:
            from datetime import datetime, timedelta
            time_ago = datetime.now() - timedelta(minutes=minutes)
            
            query = """
                SELECT COUNT(*) as count
                FROM login_attempts
                WHERE email = %s 
                AND success = FALSE 
                AND attempt_time > %s
            """
            result = Database.execute_query(query, (email, time_ago), fetch='one')
            return result['count'] if result else 0
        except Exception as e:
            logger.error(f"Error getting login attempts: {e}")
            return 0
    
    @staticmethod
    def is_account_locked(email, max_attempts=5, lockout_minutes=15):
        """
        Check if account is temporarily locked due to failed login attempts
        Returns: (is_locked, remaining_time_minutes)
        """
        try:
            failed_attempts = User.get_recent_login_attempts(email, lockout_minutes)
            
            if failed_attempts >= max_attempts:
                return True, lockout_minutes
            
            return False, 0
        except Exception as e:
            logger.error(f"Error checking account lock: {e}")
            return False, 0