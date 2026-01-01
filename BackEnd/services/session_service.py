from datetime import datetime, timedelta
from utils.database import Database
import logging

logger = logging.getLogger(__name__)


class SessionService:
    """User session management service"""
    
    @staticmethod
    def create_session(user_id, token, ip_address=None, user_agent=None, expires_in_hours=24):
        """
        Create a new session in database
        Returns: (success, session_id/error_message)
        """
        try:
            expires_at = datetime.now() + timedelta(hours=expires_in_hours)
            
            query = """
                INSERT INTO user_sessions 
                (user_id, token, ip_address, user_agent, expires_at)
                VALUES (%s, %s, %s, %s, %s)
            """
            
            session_id = Database.execute_query(
                query,
                (user_id, token, ip_address, user_agent, expires_at)
            )
            
            if session_id:
                logger.info(f"Session created for user {user_id}")
                return True, session_id
            else:
                return False, "Failed to create session"
                
        except Exception as e:
            logger.error(f"Error creating session: {e}")
            return False, str(e)
    
    @staticmethod
    def get_session_by_token(token):
        """
        Get session by token
        Returns: session record or None
        """
        try:
            query = """
                SELECT id, user_id, token, ip_address, user_agent, 
                       expires_at, created_at
                FROM user_sessions
                WHERE token = %s AND expires_at > NOW()
            """
            
            result = Database.execute_query(query, (token,), fetch='one')
            return result
            
        except Exception as e:
            logger.error(f"Error getting session: {e}")
            return None
    
    @staticmethod
    def validate_session(token):
        """
        Validate if session is active and not expired
        Returns: (is_valid, user_id/error_message)
        """
        try:
            session = SessionService.get_session_by_token(token)
            
            if not session:
                return False, "Session not found or expired"
            
            # Check if expired
            if session['expires_at'] < datetime.now():
                SessionService.delete_session_by_token(token)
                return False, "Session has expired"
            
            return True, session['user_id']
            
        except Exception as e:
            logger.error(f"Error validating session: {e}")
            return False, str(e)
    
    @staticmethod
    def get_user_sessions(user_id):
        """
        Get all active sessions for a user
        Returns: list of session records
        """
        try:
            query = """
                SELECT id, token, ip_address, user_agent, 
                       expires_at, created_at
                FROM user_sessions
                WHERE user_id = %s AND expires_at > NOW()
                ORDER BY created_at DESC
            """
            
            result = Database.execute_query(query, (user_id,), fetch='all')
            return result if result else []
            
        except Exception as e:
            logger.error(f"Error getting user sessions: {e}")
            return []
    
    @staticmethod
    def delete_session_by_token(token):
        """
        Delete a specific session
        Returns: (success, message)
        """
        try:
            query = "DELETE FROM user_sessions WHERE token = %s"
            Database.execute_query(query, (token,))
            
            logger.info(f"Session deleted")
            return True, "Session deleted successfully"
            
        except Exception as e:
            logger.error(f"Error deleting session: {e}")
            return False, str(e)
    
    @staticmethod
    def delete_session_by_id(session_id):
        """
        Delete a session by ID
        Returns: (success, message)
        """
        try:
            query = "DELETE FROM user_sessions WHERE id = %s"
            Database.execute_query(query, (session_id,))
            
            logger.info(f"Session {session_id} deleted")
            return True, "Session deleted successfully"
            
        except Exception as e:
            logger.error(f"Error deleting session: {e}")
            return False, str(e)
    
    @staticmethod
    def delete_user_sessions(user_id):
        """
        Delete all sessions for a user (logout from all devices)
        Returns: (success, message)
        """
        try:
            query = "DELETE FROM user_sessions WHERE user_id = %s"
            Database.execute_query(query, (user_id,))
            
            logger.info(f"All sessions deleted for user {user_id}")
            return True, "All sessions deleted successfully"
            
        except Exception as e:
            logger.error(f"Error deleting user sessions: {e}")
            return False, str(e)
    
    @staticmethod
    def extend_session(token, additional_hours=24):
        """
        Extend session expiry time
        Returns: (success, message)
        """
        try:
            new_expires_at = datetime.now() + timedelta(hours=additional_hours)
            
            query = """
                UPDATE user_sessions 
                SET expires_at = %s
                WHERE token = %s
            """
            
            Database.execute_query(query, (new_expires_at, token))
            
            logger.info(f"Session extended")
            return True, "Session extended successfully"
            
        except Exception as e:
            logger.error(f"Error extending session: {e}")
            return False, str(e)
    
    @staticmethod
    def cleanup_expired_sessions():
        """
        Delete all expired sessions from database
        Should be run periodically (e.g., daily cron job)
        Returns: number of deleted sessions
        """
        try:
            query = """
                DELETE FROM user_sessions 
                WHERE expires_at < NOW()
            """
            
            Database.execute_query(query)
            logger.info("Expired sessions cleaned up")
            
            return True
            
        except Exception as e:
            logger.error(f"Error cleaning up expired sessions: {e}")
            return False
    
    @staticmethod
    def get_session_count_by_user(user_id):
        """
        Get number of active sessions for a user
        Returns: count
        """
        try:
            query = """
                SELECT COUNT(*) as count
                FROM user_sessions
                WHERE user_id = %s AND expires_at > NOW()
            """
            
            result = Database.execute_query(query, (user_id,), fetch='one')
            return result['count'] if result else 0
            
        except Exception as e:
            logger.error(f"Error getting session count: {e}")
            return 0
    
    @staticmethod
    def limit_user_sessions(user_id, max_sessions=5):
        """
        Limit number of concurrent sessions per user
        Deletes oldest sessions if limit exceeded
        Returns: (success, message)
        """
        try:
            # Get current session count
            count = SessionService.get_session_count_by_user(user_id)
            
            if count <= max_sessions:
                return True, "Within session limit"
            
            # Delete oldest sessions
            delete_count = count - max_sessions
            
            query = """
                DELETE FROM user_sessions
                WHERE id IN (
                    SELECT id FROM (
                        SELECT id FROM user_sessions
                        WHERE user_id = %s AND expires_at > NOW()
                        ORDER BY created_at ASC
                        LIMIT %s
                    ) as old_sessions
                )
            """
            
            Database.execute_query(query, (user_id, delete_count))
            
            logger.info(f"Deleted {delete_count} old sessions for user {user_id}")
            return True, f"Limited to {max_sessions} sessions"
            
        except Exception as e:
            logger.error(f"Error limiting user sessions: {e}")
            return False, str(e)