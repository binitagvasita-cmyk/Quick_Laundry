#!/usr/bin/env python3
"""
Dry Clean Database Setup Script
Creates tables for dry cleaning orders and contacts
"""

import mysql.connector
from mysql.connector import Error
import logging
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def get_db_connection():
    """Create database connection"""
    try:
        connection = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            port=int(os.getenv('DB_PORT', 3306)),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', ''),
            database=os.getenv('DB_NAME', 'laundry_db')
        )
        return connection
    except Error as e:
        logger.error(f"Error connecting to database: {e}")
        return None


def create_dry_clean_orders_table(cursor):
    """Create dry clean orders table"""
    query = """
    CREATE TABLE IF NOT EXISTS dry_clean_orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        address TEXT NOT NULL,
        service VARCHAR(100) NOT NULL,
        items TEXT NOT NULL,
        pickup_date DATE NOT NULL,
        pickup_time VARCHAR(20) NOT NULL,
        special_instructions TEXT,
        status ENUM('pending', 'confirmed', 'processing', 'completed', 'cancelled') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_email (email),
        INDEX idx_status (status),
        INDEX idx_pickup_date (pickup_date),
        INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
    cursor.execute(query)
    logger.info("✅ Dry clean orders table created")


def create_dry_clean_contacts_table(cursor):
    """Create dry clean contacts table"""
    query = """
    CREATE TABLE IF NOT EXISTS dry_clean_contacts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(500) NOT NULL,
        message TEXT NOT NULL,
        status ENUM('new', 'read', 'replied', 'archived') DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
    cursor.execute(query)
    logger.info("✅ Dry clean contacts table created")


def insert_sample_dry_clean_data(cursor):
    """Insert sample dry clean orders for testing"""
    
    # Sample orders
    orders = [
        (
            None,  # user_id
            'John Doe',
            'john.doe@example.com',
            '9876543210',
            '123 Main Street, City, State - 123456',
            'Dry Cleaning',
            '2 Suits, 3 Shirts',
            '2025-01-15',
            '10:00 AM - 12:00 PM',
            'Please handle with care',
            'pending'
        ),
        (
            None,
            'Jane Smith',
            'jane.smith@example.com',
            '9876543211',
            '456 Park Avenue, City, State - 123457',
            'Laundry Service',
            '5 Pants, 10 T-shirts',
            '2025-01-16',
            '2:00 PM - 4:00 PM',
            'Prefer mild detergent',
            'confirmed'
        ),
        (
            None,
            'Bob Wilson',
            'bob.wilson@example.com',
            '9876543212',
            '789 Lake Road, City, State - 123458',
            'Steam Ironing',
            '4 Formal Shirts, 2 Pants',
            '2025-01-17',
            '4:00 PM - 6:00 PM',
            '',
            'processing'
        )
    ]
    
    query = """
    INSERT INTO dry_clean_orders 
    (user_id, name, email, phone, address, service, items, pickup_date, pickup_time, special_instructions, status)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    ON DUPLICATE KEY UPDATE name=name
    """
    
    for order in orders:
        try:
            cursor.execute(query, order)
        except Error as e:
            logger.warning(f"Sample order already exists or error: {e}")
    
    logger.info("✅ Sample dry clean orders inserted")
    
    # Sample contacts
    contacts = [
        (
            'Alice Johnson',
            'alice.j@example.com',
            'Inquiry about pricing',
            'I would like to know the pricing for bulk laundry services.',
            'new'
        ),
        (
            'Mike Brown',
            'mike.b@example.com',
            'Pickup time change',
            'Can I change my pickup time to evening slot?',
            'read'
        )
    ]
    
    contact_query = """
    INSERT INTO dry_clean_contacts 
    (name, email, subject, message, status)
    VALUES (%s, %s, %s, %s, %s)
    ON DUPLICATE KEY UPDATE name=name
    """
    
    for contact in contacts:
        try:
            cursor.execute(contact_query, contact)
        except Error as e:
            logger.warning(f"Sample contact already exists or error: {e}")
    
    logger.info("✅ Sample contacts inserted")


def verify_tables(cursor):
    """Verify that tables were created successfully"""
    try:
        # Check dry_clean_orders table
        cursor.execute("SELECT COUNT(*) FROM dry_clean_orders")
        orders_count = cursor.fetchone()[0]
        logger.info(f"📊 Dry clean orders table: {orders_count} records")
        
        # Check dry_clean_contacts table
        cursor.execute("SELECT COUNT(*) FROM dry_clean_contacts")
        contacts_count = cursor.fetchone()[0]
        logger.info(f"📊 Dry clean contacts table: {contacts_count} records")
        
        return True
    except Error as e:
        logger.error(f"Error verifying tables: {e}")
        return False


def main():
    """Main setup function"""
    logger.info("="*60)
    logger.info("Starting Dry Clean Database Setup")
    logger.info("="*60)
    
    connection = get_db_connection()
    
    if not connection:
        logger.error("Failed to connect to database. Please check your .env file")
        return False
    
    try:
        cursor = connection.cursor()
        
        # Create tables
        logger.info("\n📊 Creating dry clean tables...")
        
        create_dry_clean_orders_table(cursor)
        create_dry_clean_contacts_table(cursor)
        
        # Insert sample data
        logger.info("\n📝 Inserting sample data...")
        insert_sample_dry_clean_data(cursor)
        
        # Commit all changes
        connection.commit()
        
        # Verify tables
        logger.info("\n🔍 Verifying tables...")
        verify_tables(cursor)
        
        logger.info("\n" + "="*60)
        logger.info("✅ Dry Clean Database Setup Completed Successfully!")
        logger.info("="*60)
        logger.info("\nTables created:")
        logger.info("  • dry_clean_orders")
        logger.info("  • dry_clean_contacts")
        logger.info("\n✅ Sample data inserted for testing")
        logger.info("="*60)
        
        return True
        
    except Error as e:
        logger.error(f"❌ Error during setup: {e}")
        connection.rollback()
        return False
        
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()
            logger.info("\n🔌 Database connection closed")


def add_tables_to_existing_db():
    """
    Alternative function to add dry clean tables to existing database
    without inserting sample data
    """
    logger.info("="*60)
    logger.info("Adding Dry Clean Tables to Existing Database")
    logger.info("="*60)
    
    connection = get_db_connection()
    
    if not connection:
        logger.error("Failed to connect to database")
        return False
    
    try:
        cursor = connection.cursor()
        
        # Create tables only
        logger.info("\n📊 Creating tables...")
        create_dry_clean_orders_table(cursor)
        create_dry_clean_contacts_table(cursor)
        
        # Commit changes
        connection.commit()
        
        logger.info("\n✅ Tables added successfully!")
        logger.info("="*60)
        
        return True
        
    except Error as e:
        logger.error(f"❌ Error: {e}")
        connection.rollback()
        return False
        
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


if __name__ == '__main__':
    import sys
    
    # Check for command line argument
    if len(sys.argv) > 1 and sys.argv[1] == '--no-sample-data':
        success = add_tables_to_existing_db()
    else:
        success = main()
    
    exit(0 if success else 1)