# ============================================
# DATABASE UTILITY - COMPLETE FIXED VERSION
# Handles MySQL database connections
# ============================================

import mysql.connector
from mysql.connector import pooling
import logging

logger = logging.getLogger(__name__)


class Database:
    """Database connection manager with connection pooling"""
    
    _connection_pool = None
    _config = None
    
    @classmethod
    def initialize(cls, config):
        """
        Initialize database connection pool
        
        Args:
            config: Configuration object with database settings
        """
        try:
            cls._config = {
                'host': config.DB_HOST,
                'port': config.DB_PORT,
                'user': config.DB_USER,
                'password': config.DB_PASSWORD,
                'database': config.DB_NAME,
                'autocommit': False,
                'raise_on_warnings': True
            }
            
            # Create connection pool
            cls._connection_pool = pooling.MySQLConnectionPool(
                pool_name="laundry_pool",
                pool_size=5,
                pool_reset_session=True,
                **cls._config
            )
            
            logger.info(f"Database connection pool initialized for {config.DB_NAME}")
            
            # Test connection
            connection = cls.get_connection()
            if connection:
                connection.close()
                logger.info("Database connection test successful")
            
            return True
            
        except mysql.connector.Error as err:
            logger.error(f"Database initialization error: {err}")
            return False
        except Exception as e:
            logger.exception(f"Unexpected error during database initialization: {e}")
            return False
    
    @classmethod
    def get_connection(cls):
        """
        Get a database connection from the pool
        
        Returns:
            MySQL connection object (NOT a context manager)
        """
        try:
            if cls._connection_pool is None:
                logger.error("Database pool not initialized")
                raise Exception("Database pool not initialized. Call Database.initialize() first")
            
            # Get connection from pool
            connection = cls._connection_pool.get_connection()
            
            if connection.is_connected():
                return connection
            else:
                logger.error("Got disconnected connection from pool")
                raise Exception("Failed to get active connection")
                
        except mysql.connector.Error as err:
            logger.error(f"Error getting database connection: {err}")
            raise
        except Exception as e:
            logger.exception(f"Unexpected error getting connection: {e}")
            raise
    
    @classmethod
    def execute_query(cls, query, params=None, fetch='all'):
        """
        Execute a query and return results
        
        Args:
            query: SQL query string
            params: Query parameters (tuple or dict)
            fetch: 'one', 'all', or None (for INSERT/UPDATE/DELETE)
            
        Returns:
            Query results or None
        """
        connection = None
        cursor = None
        
        try:
            connection = cls.get_connection()
            cursor = connection.cursor(dictionary=True)
            
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            
            if fetch == 'one':
                result = cursor.fetchone()
            elif fetch == 'all':
                result = cursor.fetchall()
            else:
                result = None
            
            # Commit for INSERT/UPDATE/DELETE
            if query.strip().upper().startswith(('INSERT', 'UPDATE', 'DELETE')):
                connection.commit()
            
            return result
            
        except mysql.connector.Error as err:
            logger.error(f"Query execution error: {err}")
            if connection:
                connection.rollback()
            raise
            
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()
    
    @classmethod
    def test_connection(cls):
        """
        Test database connection
        
        Returns:
            Boolean indicating if connection is successful
        """
        try:
            connection = cls.get_connection()
            
            if connection and connection.is_connected():
                cursor = connection.cursor()
                cursor.execute("SELECT 1")
                result = cursor.fetchone()
                cursor.close()
                connection.close()
                
                return result is not None
            
            return False
            
        except Exception as e:
            logger.error(f"Connection test failed: {e}")
            return False
    
    @classmethod
    def close_pool(cls):
        """Close all connections in the pool"""
        try:
            if cls._connection_pool:
                # Close pool by setting to None
                # Individual connections will be closed when returned to pool
                cls._connection_pool = None
                logger.info("Database connection pool closed")
        except Exception as e:
            logger.error(f"Error closing connection pool: {e}")


# Backward compatibility - context manager support (optional)
class DatabaseConnection:
    """
    Context manager for database connections
    Use this if you want to use 'with' statements
    """
    
    def __init__(self):
        self.connection = None
        self.cursor = None
    
    def __enter__(self):
        self.connection = Database.get_connection()
        return self.connection
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            # Exception occurred, rollback
            if self.connection:
                try:
                    self.connection.rollback()
                except:
                    pass
        
        # Close connection
        if self.connection:
            try:
                self.connection.close()
            except:
                pass
        
        return False  # Don't suppress exceptions


# Helper function for context manager usage
def get_db_connection():
    """
    Get a database connection with context manager support
    
    Usage:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            # do stuff
    """
    return DatabaseConnection()