from google.oauth2 import id_token
from google.auth.transport import requests
from BackEnd.models.user import User
import logging

logger = logging.getLogger(__name__)


class GoogleOAuthService:
    """Google OAuth authentication service"""
    
    def __init__(self, client_id):
        self.client_id = client_id
    
    def verify_google_token(self, token):
        """
        Verify Google ID token
        Returns: (success, user_info/error_message)
        """
        try:
            # Verify the token
            idinfo = id_token.verify_oauth2_token(
                token, 
                requests.Request(), 
                self.client_id
            )
            
            # Verify the issuer
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                return False, "Invalid token issuer"
            
            # Extract user information
            user_info = {
                'google_id': idinfo['sub'],
                'email': idinfo['email'],
                'email_verified': idinfo.get('email_verified', False),
                'name': idinfo.get('name'),
                'picture': idinfo.get('picture'),
                'given_name': idinfo.get('given_name'),
                'family_name': idinfo.get('family_name')
            }
            
            logger.info(f"Google token verified for: {user_info['email']}")
            return True, user_info
            
        except ValueError as e:
            logger.error(f"Invalid Google token: {e}")
            return False, "Invalid Google token"
        except Exception as e:
            logger.error(f"Error verifying Google token: {e}")
            return False, str(e)
    
    def get_or_create_user(self, google_user_info):
        """
        Get existing user or create new user from Google info
        Returns: (success, user_data/error_message)
        """
        try:
            email = google_user_info['email']
            google_id = google_user_info['google_id']
            
            # Check if user exists by email
            existing_user = User.get_user_by_email(email)
            
            if existing_user:
                # User exists - check if it's a Google account
                if existing_user.get('google_id'):
                    # Already a Google user
                    logger.info(f"Existing Google user logged in: {email}")
                    
                    # Update profile picture if changed
                    if google_user_info.get('picture'):
                        User.update_user(existing_user['id'], {
                            'profile_picture': google_user_info['picture']
                        })
                    
                    return True, existing_user
                else:
                    # User registered with email/password
                    # Link Google account
                    success = self.link_google_account(
                        existing_user['id'], 
                        google_id,
                        google_user_info.get('picture')
                    )
                    
                    if success:
                        logger.info(f"Linked Google account to existing user: {email}")
                        updated_user = User.get_user_by_email(email)
                        return True, updated_user
                    else:
                        return False, "Failed to link Google account"
            
            else:
                # New user - create account
                username = self.generate_unique_username(email)
                
                user_data = {
                    'email': email,
                    'username': username,
                    'password': None,  # No password for OAuth users
                    'phone': '',
                    'full_name': google_user_info.get('name'),
                    'address': '',
                    'city': '',
                    'pincode': '',
                    'profile_picture': google_user_info.get('picture'),
                    'email_verified': True,  # Google already verified
                    'google_id': google_id,
                    'oauth_provider': 'google'
                }
                
                success, result = User.create_google_user(user_data)
                
                if success:
                    user_id = result
                    new_user = User.get_user_by_id(user_id)
                    logger.info(f"New Google user created: {email}")
                    return True, new_user
                else:
                    return False, result
                    
        except Exception as e:
            logger.error(f"Error in get_or_create_user: {e}")
            return False, str(e)
    
    def link_google_account(self, user_id, google_id, profile_picture=None):
        """
        Link Google account to existing user
        Returns: success boolean
        """
        try:
            from utils.database import Database
            
            update_data = {
                'google_id': google_id,
                'oauth_provider': 'google',
                'email_verified': True
            }
            
            if profile_picture:
                update_data['profile_picture'] = profile_picture
            
            # Build update query
            set_clauses = []
            values = []
            
            for key, value in update_data.items():
                set_clauses.append(f"{key} = %s")
                values.append(value)
            
            values.append(user_id)
            
            query = f"""
                UPDATE users 
                SET {', '.join(set_clauses)}
                WHERE id = %s
            """
            
            Database.execute_query(query, tuple(values))
            logger.info(f"Google account linked for user {user_id}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error linking Google account: {e}")
            return False
    
    def generate_unique_username(self, email):
        """
        Generate unique username from email
        Returns: username string
        """
        import re
        
        # Extract username part from email
        base_username = email.split('@')[0]
        
        # Remove special characters, keep only alphanumeric and underscore
        base_username = re.sub(r'[^a-zA-Z0-9_]', '', base_username)
        
        # Ensure minimum length
        if len(base_username) < 3:
            base_username = 'user' + base_username
        
        # Check if username exists
        username = base_username
        counter = 1
        
        while User.username_exists(username):
            username = f"{base_username}{counter}"
            counter += 1
        
        return username
    
    def unlink_google_account(self, user_id):
        """
        Unlink Google account from user
        Returns: (success, message)
        """
        try:
            from utils.database import Database
            
            # Check if user has password set
            user = User.get_user_by_id(user_id)
            
            if not user:
                return False, "User not found"
            
            if not user.get('password_hash'):
                return False, "Cannot unlink Google account without setting a password first"
            
            query = """
                UPDATE users 
                SET google_id = NULL, oauth_provider = 'local'
                WHERE id = %s
            """
            
            Database.execute_query(query, (user_id,))
            logger.info(f"Google account unlinked for user {user_id}")
            
            return True, "Google account unlinked successfully"
            
        except Exception as e:
            logger.error(f"Error unlinking Google account: {e}")
            return False, str(e)