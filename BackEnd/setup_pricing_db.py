# ============================================
# QUICK LAUNDRY PRICING DATABASE SETUP
# Creates tables and inserts pricing data
# ============================================

from utils.database import Database
import logging

logger = logging.getLogger(__name__)


def create_pricing_tables():
    """Create pricing tables if they don't exist"""
    
    # Service Categories Table
    create_categories_table = """
    CREATE TABLE IF NOT EXISTS service_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_name VARCHAR(100) NOT NULL,
        category_slug VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        icon VARCHAR(50),
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_slug (category_slug),
        INDEX idx_active (is_active),
        INDEX idx_order (display_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """
    
    # Pricing Items Table
    create_items_table = """
    CREATE TABLE IF NOT EXISTS pricing_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_id INT NOT NULL,
        item_name VARCHAR(100) NOT NULL,
        item_slug VARCHAR(100) NOT NULL,
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
        INDEX idx_active (is_active),
        INDEX idx_popular (is_popular),
        INDEX idx_order (display_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """
    
    try:
        with Database.get_connection() as connection:
            cursor = connection.cursor()
            
            # Create tables
            cursor.execute(create_categories_table)
            logger.info("Service categories table created/verified")
            
            cursor.execute(create_items_table)
            logger.info("Pricing items table created/verified")
            
            connection.commit()
            cursor.close()
            
            return True
            
    except Exception as e:
        logger.error(f"Error creating pricing tables: {e}")
        return False


def insert_pricing_data():
    """Insert pricing data if tables are empty"""
    
    try:
        with Database.get_connection() as connection:
            cursor = connection.cursor(dictionary=True)
            
            # Check if data already exists
            cursor.execute("SELECT COUNT(*) as count FROM service_categories")
            result = cursor.fetchone()
            
            if result['count'] > 0:
                logger.info("Pricing data already exists, skipping insert")
                cursor.close()
                return True
            
            # Insert Service Categories
            categories = [
                ('Common Items', 'common-items', 'Everyday clothing items for all', 'fas fa-tshirt', 1),
                ('Men Wear', 'men-wear', "Men's clothing and formal wear", 'fas fa-user-tie', 2),
                ('Women Wear', 'women-wear', "Women's clothing and traditional wear", 'fas fa-female', 3),
                ('Premium Services', 'premium-services', 'Premium washing and special care', 'fas fa-star', 4),
                ('Kids Wear', 'kids-wear', "Children's clothing", 'fas fa-child', 5)
            ]
            
            insert_category_query = """
                INSERT INTO service_categories 
                (category_name, category_slug, description, icon, display_order) 
                VALUES (%s, %s, %s, %s, %s)
            """
            
            for category in categories:
                cursor.execute(insert_category_query, category)
            
            logger.info("Service categories inserted successfully")
            
            # Insert Pricing Items
            pricing_items = [
                # Common Items (Iron Service)
                (1, 'Shirt', 'shirt', 'iron', 7.00, 'common', 'Regular shirt ironing', True, 1),
                (1, 'T-Shirt', 't-shirt', 'iron', 7.00, 'common', 'T-shirt ironing', True, 2),
                (1, 'Pant', 'pant', 'iron', 7.00, 'common', 'Trouser/pant ironing', True, 3),
                (1, 'Jeans', 'jeans', 'iron', 7.00, 'common', 'Denim jeans ironing', True, 4),
                (1, 'Kurta', 'kurta', 'iron', 7.00, 'common', 'Traditional kurta ironing', False, 5),
                (1, 'Kurti', 'kurti', 'iron', 7.00, 'common', 'Ladies kurti ironing', False, 6),
                (1, 'Top', 'top', 'iron', 7.00, 'common', 'Ladies top ironing', False, 7),
                (1, 'Leggings', 'leggings', 'iron', 7.00, 'common', 'Leggings ironing', False, 8),
                (1, 'Night Dress', 'night-dress', 'iron', 7.00, 'common', 'Night dress ironing', False, 9),
                (1, 'Dupatta', 'dupatta', 'iron', 7.00, 'common', 'Dupatta ironing', False, 10),
                (1, 'Kids Wear', 'kids-wear', 'iron', 7.00, 'common', 'Kids clothing ironing', False, 11),
                
                # Men's Wear (Iron Service)
                (2, 'Blazer', 'blazer', 'iron', 50.00, 'men', 'Formal blazer ironing', True, 1),
                (2, 'Coat / Suit', 'coat-suit', 'iron', 150.00, 'men', 'Full suit/coat ironing', True, 2),
                (2, 'Kurta Pajama Set', 'kurta-pajama-set', 'iron', 50.00, 'men', 'Traditional kurta pajama set', False, 3),
                (2, 'Dhoti Kurta Set', 'dhoti-kurta-set', 'iron', 50.00, 'men', 'Traditional dhoti kurta set', False, 4),
                
                # Women's Wear (Iron Service)
                (3, 'Saree (Normal)', 'saree-normal', 'iron', 20.00, 'women', 'Regular saree ironing', True, 1),
                (3, 'Heavy Suit / Punjabi Suit', 'heavy-punjabi-suit', 'iron', 25.00, 'women', 'Designer punjabi suit ironing', True, 2),
                (3, 'Gown', 'gown', 'iron', 25.00, 'women', 'Ladies gown ironing', False, 3),
                (3, 'Chaniya Choli (Simple)', 'chaniya-choli-simple', 'iron', 100.00, 'women', 'Simple chaniya choli ironing', False, 4),
                (3, 'Chaniya Choli (Heavy)', 'chaniya-choli-heavy', 'iron', 150.00, 'women', 'Heavy designer chaniya choli', False, 5),
                (3, 'Shawl / Stole', 'shawl-stole', 'iron', 10.00, 'women', 'Shawl or stole ironing', False, 6),
                
                # Men's Wash + Iron
                (2, 'Shirt', 'shirt-wash', 'wash_iron', 50.00, 'men', 'Shirt wash and iron', True, 11),
                (2, 'T-Shirt', 't-shirt-wash', 'wash_iron', 50.00, 'men', 'T-shirt wash and iron', True, 12),
                (2, 'Pant', 'pant-wash', 'wash_iron', 50.00, 'men', 'Pant wash and iron', True, 13),
                (2, 'Jeans', 'jeans-wash', 'wash_iron', 50.00, 'men', 'Jeans wash and iron', True, 14),
                (2, 'Kurta / Pajama', 'kurta-pajama-wash', 'wash_iron', 100.00, 'men', 'Kurta pajama wash and iron', False, 15),
                (2, 'Dhoti / Kurta Set', 'dhoti-kurta-set-wash', 'wash_iron', 120.00, 'men', 'Dhoti kurta set wash and iron', False, 16),
                (2, 'Blazer', 'blazer-wash', 'wash_iron', 300.00, 'men', 'Blazer wash and iron', False, 17),
                (2, 'Coat', 'coat-wash', 'wash_iron', 350.00, 'men', 'Coat wash and iron', False, 18),
                
                # Women's Wash + Iron
                (3, 'Top', 'top-wash', 'wash_iron', 50.00, 'women', 'Top wash and iron', True, 11),
                (3, 'Dupatta', 'dupatta-wash', 'wash_iron', 70.00, 'women', 'Dupatta wash and iron', False, 12),
                (3, 'Skirt', 'skirt-wash', 'wash_iron', 50.00, 'women', 'Skirt wash and iron', False, 13),
                (3, 'Simple Suit', 'simple-suit-wash', 'wash_iron', 100.00, 'women', 'Simple suit (Kurti + Bottom)', True, 14),
                (3, 'Heavy Suit / Punjabi Suit', 'heavy-punjabi-suit-wash', 'wash_iron', 120.00, 'women', 'Designer suit wash and iron', True, 15),
                (3, 'Gown', 'gown-wash', 'wash_iron', 120.00, 'women', 'Gown wash and iron', False, 16),
                (3, 'Saree (Normal)', 'saree-normal-wash', 'wash_iron', 200.00, 'women', 'Normal saree wash and iron', True, 17),
                (3, 'Saree (Heavy)', 'saree-heavy-wash', 'wash_iron', 300.00, 'women', 'Heavy saree wash and iron', False, 18),
                (3, 'Chaniya Choli (Simple)', 'chaniya-choli-simple-wash', 'wash_iron', 350.00, 'women', 'Simple chaniya choli wash and iron', False, 19),
                (3, 'Chaniya Choli (Heavy)', 'chaniya-choli-heavy-wash', 'wash_iron', 550.00, 'women', 'Heavy chaniya choli wash and iron', False, 20),
                
                # Premium Services
                (4, 'Dry Cleaning - Shirt', 'dry-clean-shirt', 'dry_clean', 80.00, 'common', 'Professional dry cleaning for shirts', True, 1),
                (4, 'Dry Cleaning - Suit', 'dry-clean-suit', 'dry_clean', 400.00, 'common', 'Professional dry cleaning for suits', True, 2),
                (4, 'Steam Ironing - Shirt', 'steam-iron-shirt', 'steam_iron', 15.00, 'common', 'Steam ironing for crisp finish', True, 3),
                (4, 'Steam Ironing - Saree', 'steam-iron-saree', 'steam_iron', 40.00, 'women', 'Steam ironing for sarees', True, 4),
                (4, 'Premium Wash - Shirt', 'premium-wash-shirt', 'premium_wash', 100.00, 'common', 'Premium quality washing', False, 5),
                (4, 'Premium Wash - Suit', 'premium-wash-suit', 'premium_wash', 500.00, 'common', 'Premium quality suit wash', False, 6),
            ]
            
            insert_item_query = """
                INSERT INTO pricing_items 
                (category_id, item_name, item_slug, service_type, price, gender_category, description, is_popular, display_order) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            for item in pricing_items:
                cursor.execute(insert_item_query, item)
            
            logger.info("Pricing items inserted successfully")
            
            connection.commit()
            cursor.close()
            
            return True
            
    except Exception as e:
        logger.error(f"Error inserting pricing data: {e}")
        return False


def initialize_pricing_database():
    """Initialize pricing database - create tables and insert data"""
    try:
        logger.info("Initializing pricing database...")
        
        # Create tables
        if not create_pricing_tables():
            logger.error("Failed to create pricing tables")
            return False
        
        # Insert data
        if not insert_pricing_data():
            logger.error("Failed to insert pricing data")
            return False
        
        logger.info("Pricing database initialized successfully")
        return True
        
    except Exception as e:
        logger.error(f"Error initializing pricing database: {e}")
        return False


if __name__ == '__main__':
    # For testing purposes
    from config import config_by_name
    
    # Initialize database connection
    config = config_by_name['development']
    Database.initialize(config)
    
    # Initialize pricing database
    initialize_pricing_database()