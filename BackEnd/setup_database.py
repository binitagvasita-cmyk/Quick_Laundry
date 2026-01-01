#!/usr/bin/env python3
"""
Complete Database Setup Script
Creates all tables for Quick Laundry application
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
            password=os.getenv('DB_PASSWORD', 'root'),
            database=os.getenv('DB_NAME', 'quicklaundry_db')
        )
        return connection
    except Error as e:
        logger.error(f"Error connecting to database: {e}")
        return None


def create_users_table(cursor):
    """Create users table"""
    query = """
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        phone VARCHAR(20) UNIQUE NOT NULL,
        full_name VARCHAR(255),
        address TEXT NOT NULL,
        city VARCHAR(100) NOT NULL,
        pincode VARCHAR(10) NOT NULL,
        service_type ENUM('express', 'standard', 'economy') DEFAULT 'standard',
        communication_preference ENUM('sms', 'email', 'both') DEFAULT 'both',
        subscribe_newsletter BOOLEAN DEFAULT FALSE,
        profile_picture VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        email_verified BOOLEAN DEFAULT FALSE,
        google_id VARCHAR(255) UNIQUE,
        oauth_provider VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_username (username),
        INDEX idx_phone (phone)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
    cursor.execute(query)
    logger.info("✓ Users table created")


def create_otp_table(cursor):
    """Create OTP verification table"""
    query = """
    CREATE TABLE IF NOT EXISTS otp_verification (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp_code VARCHAR(6) NOT NULL,
        purpose VARCHAR(50) NOT NULL,
        is_verified BOOLEAN DEFAULT FALSE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_otp_code (otp_code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
    cursor.execute(query)
    logger.info("✓ OTP verification table created")


def create_login_attempts_table(cursor):
    """Create login attempts table"""
    query = """
    CREATE TABLE IF NOT EXISTS login_attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        ip_address VARCHAR(45),
        success BOOLEAN DEFAULT FALSE,
        attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_attempt_time (attempt_time)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
    cursor.execute(query)
    logger.info("✓ Login attempts table created")


def create_password_reset_table(cursor):
    """Create password reset table"""
    query = """
    CREATE TABLE IF NOT EXISTS password_reset (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        reset_token TEXT NOT NULL,
        is_used BOOLEAN DEFAULT FALSE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
    cursor.execute(query)
    logger.info("✓ Password reset table created")


def create_sessions_table(cursor):
    """Create sessions table"""
    query = """
    CREATE TABLE IF NOT EXISTS sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        session_token TEXT NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
    cursor.execute(query)
    logger.info("✓ Sessions table created")


def create_service_categories_table(cursor):
    """Create service categories table"""
    query = """
    CREATE TABLE IF NOT EXISTS service_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_name VARCHAR(100) NOT NULL,
        category_slug VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        icon VARCHAR(100),
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_slug (category_slug),
        INDEX idx_display_order (display_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
    cursor.execute(query)
    logger.info("✓ Service categories table created")


def create_pricing_items_table(cursor):
    """Create pricing items table"""
    query = """
    CREATE TABLE IF NOT EXISTS pricing_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_id INT NOT NULL,
        item_name VARCHAR(255) NOT NULL,
        item_slug VARCHAR(255) NOT NULL,
        service_type ENUM('iron', 'wash_iron', 'roll_press', 'dry_clean', 'premium_wash', 'steam_iron') NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        gender_category ENUM('common', 'men', 'women', 'kids') DEFAULT 'common',
        description TEXT,
        is_popular BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE CASCADE,
        INDEX idx_category (category_id),
        INDEX idx_service_type (service_type),
        INDEX idx_gender (gender_category),
        INDEX idx_popular (is_popular)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
    cursor.execute(query)
    logger.info("✓ Pricing items table created")


def create_orders_table(cursor):
    """Create orders table"""
    query = """
    CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL,
        tax DECIMAL(10, 2) NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        order_status ENUM('pending', 'confirmed', 'processing', 'ready', 'delivered', 'cancelled') DEFAULT 'pending',
        payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
        delivery_date DATETIME,
        pickup_date DATETIME,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_status (order_status),
        INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
    cursor.execute(query)
    logger.info("✓ Orders table created")


def create_order_items_table(cursor):
    """Create order items table"""
    query = """
    CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        item_id INT,
        item_name VARCHAR(255) NOT NULL,
        quantity INT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        service_type VARCHAR(50),
        subtotal DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        INDEX idx_order_id (order_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
    cursor.execute(query)
    logger.info("✓ Order items table created")


def insert_sample_categories(cursor):
    """Insert sample service categories"""
    categories = [
        ('Shirts & Tops', 'shirts-tops', 'All types of shirts and tops', '👔', 1),
        ('Pants & Trousers', 'pants-trousers', 'Formal and casual pants', '👖', 2),
        ('Traditional Wear', 'traditional-wear', 'Ethnic and traditional clothing', '🥻', 3),
        ('Western Wear', 'western-wear', 'Dresses, skirts, and western outfits', '👗', 4),
        ('Kids Wear', 'kids-wear', 'Children clothing items', '👶', 5),
        ('Home Furnishing', 'home-furnishing', 'Bed sheets, curtains, etc.', '🛏️', 6)
    ]
    
    query = """
    INSERT INTO service_categories (category_name, category_slug, description, icon, display_order)
    VALUES (%s, %s, %s, %s, %s)
    ON DUPLICATE KEY UPDATE category_name=category_name
    """
    
    for category in categories:
        cursor.execute(query, category)
    
    logger.info("✓ Sample categories inserted")


def insert_sample_pricing_items(cursor):
    """Insert sample pricing items"""
    items = [
        # Shirts & Tops (category_id=1)
        (1, 'Formal Shirt', 'formal-shirt', 'iron', 25.00, 'men', 'Regular formal shirts', True, 1),
        (1, 'T-Shirt', 't-shirt', 'iron', 15.00, 'common', 'Regular t-shirts', True, 2),
        (1, 'Polo Shirt', 'polo-shirt', 'iron', 20.00, 'men', 'Polo t-shirts', False, 3),
        
        # Pants & Trousers (category_id=2)
        (2, 'Formal Pants', 'formal-pants', 'iron', 30.00, 'men', 'Formal trousers', True, 1),
        (2, 'Jeans', 'jeans', 'iron', 25.00, 'common', 'Denim jeans', True, 2),
        
        # Traditional Wear (category_id=3)
        (3, 'Saree', 'saree', 'iron', 50.00, 'women', 'Indian saree', True, 1),
        (3, 'Kurta', 'kurta', 'iron', 30.00, 'common', 'Traditional kurta', True, 2),
        
        # Western Wear (category_id=4)
        (4, 'Dress', 'dress', 'iron', 40.00, 'women', 'Western dress', False, 1),
        (4, 'Skirt', 'skirt', 'women', 'iron', 25.00, 'Western skirt', False, 2),
        
        # Kids Wear (category_id=5)
        (5, 'Kids Shirt', 'kids-shirt', 'iron', 15.00, 'kids', 'Children shirts', False, 1),
        (5, 'Kids Dress', 'kids-dress', 'iron', 20.00, 'kids', 'Children dress', False, 2)
    ]
    
    query = """
    INSERT INTO pricing_items 
    (category_id, item_name, item_slug, service_type, price, gender_category, description, is_popular, display_order)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    ON DUPLICATE KEY UPDATE item_name=item_name
    """
    
    for item in items:
        cursor.execute(query, item)
    
    logger.info("✓ Sample pricing items inserted")


def main():
    """Main setup function"""
    logger.info("="*60)
    logger.info("Starting Quick Laundry Database Setup")
    logger.info("="*60)
    
    connection = get_db_connection()
    
    if not connection:
        logger.error("Failed to connect to database. Please check your .env file")
        return False
    
    try:
        cursor = connection.cursor()
        
        # Create all tables in correct order (respecting foreign keys)
        logger.info("\n📊 Creating tables...")
        
        create_users_table(cursor)
        create_otp_table(cursor)
        create_login_attempts_table(cursor)
        create_password_reset_table(cursor)
        create_sessions_table(cursor)
        create_service_categories_table(cursor)
        create_pricing_items_table(cursor)
        create_orders_table(cursor)
        create_order_items_table(cursor)
        
        # Insert sample data
        logger.info("\n📝 Inserting sample data...")
        insert_sample_categories(cursor)
        insert_sample_pricing_items(cursor)
        
        # Commit all changes
        connection.commit()
        
        logger.info("\n" + "="*60)
        logger.info("✅ Database setup completed successfully!")
        logger.info("="*60)
        logger.info("\nTables created:")
        logger.info("  • users")
        logger.info("  • otp_verification")
        logger.info("  • login_attempts")
        logger.info("  • password_reset")
        logger.info("  • sessions")
        logger.info("  • service_categories")
        logger.info("  • pricing_items")
        logger.info("  • orders")
        logger.info("  • order_items")
        logger.info("\n✓ Sample data inserted for categories and pricing items")
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


if __name__ == '__main__':
    success = main()
    exit(0 if success else 1)