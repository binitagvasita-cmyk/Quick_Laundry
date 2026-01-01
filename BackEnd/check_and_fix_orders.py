# ============================================
# CHECK AND FIX ORDERS TABLE
# Checks current structure and fixes if needed
# ============================================

from utils.database import Database
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def check_table_structure():
    """Check the current orders table structure"""
    connection = None
    cursor = None
    
    try:
        connection = Database.get_connection()
        cursor = connection.cursor()
        
        print("\n" + "="*60)
        print("CURRENT ORDERS TABLE STRUCTURE")
        print("="*60 + "\n")
        
        cursor.execute("DESCRIBE orders")
        rows = cursor.fetchall()
        
        for row in rows:
            print(f"{row[0]:20s} {row[1]:20s} {row[2]:5s} {row[3]:5s} {str(row[4]):10s}")
        
        print("\n" + "="*60)
        
        # Check delivery_date column specifically
        cursor.execute("SHOW COLUMNS FROM orders LIKE 'delivery_date'")
        delivery_col = cursor.fetchone()
        
        if delivery_col:
            print(f"\ndelivery_date column:")
            print(f"  Type: {delivery_col[1]}")
            print(f"  Null: {delivery_col[2]}")
            print(f"  Default: {delivery_col[4]}")
            
            # Check if it allows NULL
            if delivery_col[2] == 'YES':
                print("\n⚠️  WARNING: delivery_date allows NULL values")
                print("This might cause the 'Data truncated' error")
                return False
            else:
                print("\n✓ delivery_date is configured correctly (NOT NULL)")
                return True
        
        return False
        
    except Exception as e:
        logger.exception(f"Error checking table: {e}")
        return False
    
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


def fix_delivery_date_column():
    """Fix the delivery_date column to NOT NULL"""
    connection = None
    cursor = None
    
    try:
        connection = Database.get_connection()
        cursor = connection.cursor()
        
        print("\n" + "="*60)
        print("FIXING delivery_date COLUMN")
        print("="*60 + "\n")
        
        # First, check current type
        cursor.execute("SHOW COLUMNS FROM orders LIKE 'delivery_date'")
        current_col = cursor.fetchone()
        current_type = current_col[1] if current_col else 'date'
        
        print(f"Current type: {current_type}")
        
        # First, update any NULL values to a default
        print("\nStep 1: Updating any NULL values...")
        
        if 'datetime' in current_type.lower():
            cursor.execute("""
                UPDATE orders 
                SET delivery_date = DATE_ADD(created_at, INTERVAL 24 HOUR)
                WHERE delivery_date IS NULL
            """)
        else:
            # For DATE type, use DATE() function
            cursor.execute("""
                UPDATE orders 
                SET delivery_date = DATE(DATE_ADD(created_at, INTERVAL 24 HOUR))
                WHERE delivery_date IS NULL
            """)
        
        updated = cursor.rowcount
        print(f"  Updated {updated} rows with NULL delivery_date")
        
        # Now alter the column to NOT NULL with correct type
        print("\nStep 2: Altering column to NOT NULL...")
        
        # Use the current type but make it NOT NULL
        if 'datetime' in current_type.lower():
            alter_query = """
                ALTER TABLE orders 
                MODIFY COLUMN delivery_date DATETIME NOT NULL
            """
        else:
            alter_query = """
                ALTER TABLE orders 
                MODIFY COLUMN delivery_date DATE NOT NULL
            """
        
        cursor.execute(alter_query)
        print("  ✓ Column altered successfully")
        
        connection.commit()
        
        print("\n" + "="*60)
        print("✓ FIX COMPLETED SUCCESSFULLY")
        print("="*60 + "\n")
        
        return True
        
    except Exception as e:
        logger.exception(f"Error fixing column: {e}")
        if connection:
            try:
                connection.rollback()
            except:
                pass
        return False
    
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


def recreate_tables():
    """Recreate all order tables from scratch"""
    connection = None
    cursor = None
    
    try:
        connection = Database.get_connection()
        cursor = connection.cursor()
        
        print("\n" + "="*60)
        print("⚠️  RECREATING ORDERS TABLES")
        print("="*60 + "\n")
        
        print("⚠️  WARNING: This will DELETE all existing orders!")
        response = input("Type 'DELETE' to continue or anything else to cancel: ")
        
        if response != 'DELETE':
            print("\n❌ Operation cancelled")
            return False
        
        print("\nDropping existing tables...")
        cursor.execute("DROP TABLE IF EXISTS order_items")
        print("  ✓ order_items dropped")
        
        cursor.execute("DROP TABLE IF EXISTS orders")
        print("  ✓ orders dropped")
        
        # Create orders table with DATE type (not DATETIME)
        print("\nCreating new orders table...")
        create_orders_query = """
            CREATE TABLE orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                
                subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                tax DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                
                order_status ENUM('pending', 'confirmed', 'processing', 'ready', 'delivered', 'cancelled') 
                    DEFAULT 'pending',
                payment_status ENUM('pending', 'paid', 'failed', 'refunded') 
                    DEFAULT 'pending',
                
                delivery_date DATE NOT NULL,
                pickup_date DATE NULL,
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
        print("  ✓ orders table created")
        
        # Create order_items table
        print("\nCreating new order_items table...")
        create_items_query = """
            CREATE TABLE order_items (
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
        print("  ✓ order_items table created")
        
        connection.commit()
        
        print("\n" + "="*60)
        print("✓ TABLES RECREATED SUCCESSFULLY")
        print("="*60 + "\n")
        
        return True
        
    except Exception as e:
        logger.exception(f"Error recreating tables: {e}")
        if connection:
            try:
                connection.rollback()
            except:
                pass
        return False
    
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


def main():
    """Main menu"""
    print("\n" + "="*60)
    print("ORDERS TABLE DIAGNOSTIC & FIX TOOL")
    print("="*60 + "\n")
    
    try:
        from config import DevelopmentConfig
        
        print("Connecting to database...")
        Database.initialize(DevelopmentConfig)
        print("✓ Database connection established\n")
        
        while True:
            print("\nOptions:")
            print("1. Check current table structure")
            print("2. Fix delivery_date column (if NULL allowed)")
            print("3. Recreate tables (DELETES ALL DATA)")
            print("4. Exit")
            
            choice = input("\nSelect option (1-4): ")
            
            if choice == '1':
                check_table_structure()
            elif choice == '2':
                if fix_delivery_date_column():
                    print("\nVerifying fix...")
                    check_table_structure()
            elif choice == '3':
                if recreate_tables():
                    print("\nVerifying new structure...")
                    check_table_structure()
            elif choice == '4':
                print("\nExiting...")
                break
            else:
                print("\n❌ Invalid option")
        
    except Exception as e:
        print(f"\n✗ ERROR: {e}\n")
        print("Make sure:")
        print("  1. MySQL is running")
        print("  2. Database credentials in config.py are correct")
        print("  3. Database 'laundry_db' exists")


if __name__ == '__main__':
    main()