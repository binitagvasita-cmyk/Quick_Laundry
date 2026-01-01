# ============================================
# SETUP ORDERS DATABASE - FIXED
# Creates orders and order_items tables
# ============================================

from utils.database import Database
import logging

logger = logging.getLogger(__name__)


def create_orders_table():
    """Create orders and order_items tables"""
    connection = None
    cursor = None
    
    try:
        connection = Database.get_connection()
        cursor = connection.cursor()
        
        logger.info("Creating orders table...")
        
        # Drop existing tables if needed (ONLY FOR DEVELOPMENT - UNCOMMENT IF YOU WANT TO RECREATE)
        # print("\n⚠️  WARNING: About to drop existing tables!")
        # response = input("Type 'yes' to continue or 'no' to skip: ")
        # if response.lower() == 'yes':
        #     cursor.execute("DROP TABLE IF EXISTS order_items")
        #     cursor.execute("DROP TABLE IF EXISTS orders")
        #     logger.info("Existing tables dropped")
        
        # Create orders table with proper DATETIME column
        create_orders_query = """
            CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                
                subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                tax DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                
                order_status ENUM('pending', 'confirmed', 'processing', 'ready', 'delivered', 'cancelled') 
                    DEFAULT 'pending',
                payment_status ENUM('pending', 'paid', 'failed', 'refunded') 
                    DEFAULT 'pending',
                
                delivery_date DATETIME NOT NULL,
                pickup_date DATETIME NULL,
                notes TEXT,
                
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id),
                INDEX idx_order_status (order_status),
                INDEX idx_delivery_date (delivery_date),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """
        
        cursor.execute(create_orders_query)
        logger.info("✓ Orders table created successfully")
        
        # Create order_items table
        create_items_query = """
            CREATE TABLE IF NOT EXISTS order_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT NOT NULL,
                
                item_id INT NOT NULL,
                item_name VARCHAR(200) NOT NULL,
                quantity INT NOT NULL DEFAULT 1,
                price DECIMAL(10, 2) NOT NULL,
                service_type VARCHAR(50) NOT NULL,
                subtotal DECIMAL(10, 2) NOT NULL,
                
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
                INDEX idx_order_id (order_id),
                INDEX idx_service_type (service_type)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """
        
        cursor.execute(create_items_query)
        logger.info("✓ Order items table created successfully")
        
        # Commit changes
        connection.commit()
        logger.info("✓ All order tables created and committed successfully")
        
        # Verify tables were created
        cursor.execute("SHOW TABLES LIKE 'orders'")
        orders_exists = cursor.fetchone()
        
        cursor.execute("SHOW TABLES LIKE 'order_items'")
        items_exists = cursor.fetchone()
        
        if orders_exists and items_exists:
            logger.info("✓ Table verification successful")
            
            # Show table structures
            logger.info("\n=== ORDERS TABLE STRUCTURE ===")
            cursor.execute("DESCRIBE orders")
            for row in cursor.fetchall():
                logger.info(f"  {row}")
            
            logger.info("\n=== ORDER_ITEMS TABLE STRUCTURE ===")
            cursor.execute("DESCRIBE order_items")
            for row in cursor.fetchall():
                logger.info(f"  {row}")
            
            return True
        else:
            logger.error("✗ Table verification failed")
            return False
        
    except Exception as e:
        logger.exception(f"✗ Error creating orders tables: {e}")
        if connection:
            try:
                connection.rollback()
                logger.info("Transaction rolled back")
            except:
                pass
        return False
    
    finally:
        if cursor:
            try:
                cursor.close()
            except:
                pass
        if connection:
            try:
                connection.close()
            except:
                pass


def initialize_orders_database():
    """Initialize the orders database"""
    try:
        logger.info("="*60)
        logger.info("INITIALIZING ORDERS DATABASE")
        logger.info("="*60)
        
        success = create_orders_table()
        
        if success:
            logger.info("="*60)
            logger.info("✓ ORDERS DATABASE INITIALIZED SUCCESSFULLY")
            logger.info("="*60)
        else:
            logger.error("="*60)
            logger.error("✗ FAILED TO INITIALIZE ORDERS DATABASE")
            logger.error("="*60)
        
        return success
        
    except Exception as e:
        logger.exception(f"Error initializing orders database: {e}")
        return False


if __name__ == '__main__':
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    
    print("\n" + "="*60)
    print("ORDERS DATABASE SETUP SCRIPT")
    print("="*60 + "\n")
    
    # Initialize database connection
    try:
        from config import DevelopmentConfig
        
        print("Connecting to database...")
        Database.initialize(DevelopmentConfig)
        print("✓ Database connection established\n")
        
        # Run initialization
        success = initialize_orders_database()
        
        if success:
            print("\n" + "="*60)
            print("SUCCESS! Orders database is ready to use.")
            print("="*60 + "\n")
            print("You can now:")
            print("  1. Start your backend: python app.py")
            print("  2. Place orders from the frontend")
            print("="*60 + "\n")
        else:
            print("\n" + "="*60)
            print("FAILED! Please check the error messages above.")
            print("="*60 + "\n")
            
    except Exception as e:
        print(f"\n✗ ERROR: {e}\n")
        print("Make sure:")
        print("  1. MySQL is running")
        print("  2. Database credentials in config.py are correct")
        print("  3. Database 'laundry_db' exists")
        print("  4. users table exists (required for foreign key)")