# ============================================
# PRICING MODEL
# Database operations for pricing and categories
# ============================================

from utils.database import Database
import logging

logger = logging.getLogger(__name__)


class Pricing:
    """Pricing model for database operations"""
    
    @staticmethod
    def get_all_categories():
        """
        Get all service categories
        Returns: list of categories
        """
        try:
            query = """
                SELECT id, category_name, category_slug, description, 
                       icon, display_order, is_active, created_at
                FROM service_categories
                WHERE is_active = TRUE
                ORDER BY display_order ASC
            """
            result = Database.execute_query(query, fetch='all')
            return result if result else []
        except Exception as e:
            logger.error(f"Error getting categories: {e}")
            return []
    
    @staticmethod
    def get_category_by_id(category_id):
        """
        Get category by ID
        Returns: category dict or None
        """
        try:
            query = """
                SELECT id, category_name, category_slug, description, 
                       icon, display_order, is_active
                FROM service_categories
                WHERE id = %s AND is_active = TRUE
            """
            result = Database.execute_query(query, (category_id,), fetch='one')
            return result
        except Exception as e:
            logger.error(f"Error getting category by ID: {e}")
            return None
    
    @staticmethod
    def get_category_by_slug(slug):
        """
        Get category by slug
        Returns: category dict or None
        """
        try:
            query = """
                SELECT id, category_name, category_slug, description, 
                       icon, display_order, is_active
                FROM service_categories
                WHERE category_slug = %s AND is_active = TRUE
            """
            result = Database.execute_query(query, (slug,), fetch='one')
            return result
        except Exception as e:
            logger.error(f"Error getting category by slug: {e}")
            return None
    
    @staticmethod
    def get_all_pricing_items():
        """
        Get all pricing items with category info
        Returns: list of pricing items
        """
        try:
            query = """
                SELECT 
                    pi.id,
                    pi.category_id,
                    sc.category_name,
                    sc.category_slug,
                    pi.item_name,
                    pi.item_slug,
                    pi.service_type,
                    pi.price,
                    pi.gender_category,
                    pi.description,
                    pi.is_popular,
                    pi.display_order
                FROM pricing_items pi
                JOIN service_categories sc ON pi.category_id = sc.id
                WHERE pi.is_active = TRUE AND sc.is_active = TRUE
                ORDER BY sc.display_order ASC, pi.display_order ASC
            """
            result = Database.execute_query(query, fetch='all')
            return result if result else []
        except Exception as e:
            logger.error(f"Error getting all pricing items: {e}")
            return []
    
    @staticmethod
    def get_items_by_category(category_id):
        """
        Get pricing items by category ID
        Returns: list of pricing items
        """
        try:
            query = """
                SELECT 
                    id, item_name, item_slug, service_type, price,
                    gender_category, description, is_popular, display_order
                FROM pricing_items
                WHERE category_id = %s AND is_active = TRUE
                ORDER BY display_order ASC
            """
            result = Database.execute_query(query, (category_id,), fetch='all')
            return result if result else []
        except Exception as e:
            logger.error(f"Error getting items by category: {e}")
            return []
    
    @staticmethod
    def get_items_by_service_type(service_type):
        """
        Get pricing items by service type
        Returns: list of pricing items
        """
        try:
            query = """
                SELECT 
                    pi.id,
                    pi.category_id,
                    sc.category_name,
                    pi.item_name,
                    pi.item_slug,
                    pi.service_type,
                    pi.price,
                    pi.gender_category,
                    pi.description,
                    pi.is_popular
                FROM pricing_items pi
                JOIN service_categories sc ON pi.category_id = sc.id
                WHERE pi.service_type = %s AND pi.is_active = TRUE AND sc.is_active = TRUE
                ORDER BY sc.display_order ASC, pi.display_order ASC
            """
            result = Database.execute_query(query, (service_type,), fetch='all')
            return result if result else []
        except Exception as e:
            logger.error(f"Error getting items by service type: {e}")
            return []
    
    @staticmethod
    def get_items_by_gender(gender_category):
        """
        Get pricing items by gender category
        Returns: list of pricing items
        """
        try:
            query = """
                SELECT 
                    pi.id,
                    pi.category_id,
                    sc.category_name,
                    pi.item_name,
                    pi.item_slug,
                    pi.service_type,
                    pi.price,
                    pi.gender_category,
                    pi.description,
                    pi.is_popular
                FROM pricing_items pi
                JOIN service_categories sc ON pi.category_id = sc.id
                WHERE pi.gender_category = %s AND pi.is_active = TRUE AND sc.is_active = TRUE
                ORDER BY sc.display_order ASC, pi.display_order ASC
            """
            result = Database.execute_query(query, (gender_category,), fetch='all')
            return result if result else []
        except Exception as e:
            logger.error(f"Error getting items by gender: {e}")
            return []
    
    @staticmethod
    def get_popular_items():
        """
        Get popular pricing items
        Returns: list of popular items
        """
        try:
            query = """
                SELECT 
                    pi.id,
                    pi.category_id,
                    sc.category_name,
                    sc.icon,
                    pi.item_name,
                    pi.item_slug,
                    pi.service_type,
                    pi.price,
                    pi.gender_category,
                    pi.description
                FROM pricing_items pi
                JOIN service_categories sc ON pi.category_id = sc.id
                WHERE pi.is_popular = TRUE AND pi.is_active = TRUE AND sc.is_active = TRUE
                ORDER BY pi.price ASC
                LIMIT 10
            """
            result = Database.execute_query(query, fetch='all')
            return result if result else []
        except Exception as e:
            logger.error(f"Error getting popular items: {e}")
            return []
    
    @staticmethod
    def get_item_by_id(item_id):
        """
        Get pricing item by ID
        Returns: item dict or None
        """
        try:
            query = """
                SELECT 
                    pi.id,
                    pi.category_id,
                    sc.category_name,
                    sc.category_slug,
                    pi.item_name,
                    pi.item_slug,
                    pi.service_type,
                    pi.price,
                    pi.gender_category,
                    pi.description,
                    pi.is_popular
                FROM pricing_items pi
                JOIN service_categories sc ON pi.category_id = sc.id
                WHERE pi.id = %s AND pi.is_active = TRUE
            """
            result = Database.execute_query(query, (item_id,), fetch='one')
            return result
        except Exception as e:
            logger.error(f"Error getting item by ID: {e}")
            return None
    
    @staticmethod
    def search_items(search_term):
        """
        Search pricing items by name
        Returns: list of matching items
        """
        try:
            search_pattern = f"%{search_term}%"
            query = """
                SELECT 
                    pi.id,
                    pi.category_id,
                    sc.category_name,
                    sc.icon,
                    pi.item_name,
                    pi.item_slug,
                    pi.service_type,
                    pi.price,
                    pi.gender_category,
                    pi.description,
                    pi.is_popular
                FROM pricing_items pi
                JOIN service_categories sc ON pi.category_id = sc.id
                WHERE (pi.item_name LIKE %s OR pi.description LIKE %s)
                AND pi.is_active = TRUE AND sc.is_active = TRUE
                ORDER BY pi.is_popular DESC, pi.price ASC
                LIMIT 20
            """
            result = Database.execute_query(query, (search_pattern, search_pattern), fetch='all')
            return result if result else []
        except Exception as e:
            logger.error(f"Error searching items: {e}")
            return []
    
    @staticmethod
    def get_pricing_summary():
        """
        Get pricing summary statistics
        Returns: dict with summary data
        """
        try:
            query = """
                SELECT 
                    COUNT(*) as total_items,
                    COUNT(DISTINCT category_id) as total_categories,
                    MIN(price) as min_price,
                    MAX(price) as max_price,
                    AVG(price) as avg_price,
                    SUM(CASE WHEN is_popular = TRUE THEN 1 ELSE 0 END) as popular_items_count
                FROM pricing_items
                WHERE is_active = TRUE
            """
            result = Database.execute_query(query, fetch='one')
            return result
        except Exception as e:
            logger.error(f"Error getting pricing summary: {e}")
            return None
    
    @staticmethod
    def get_items_grouped_by_category():
        """
        Get all items grouped by category
        Returns: dict with categories as keys and items as values
        """
        try:
            # Get all categories
            categories = Pricing.get_all_categories()
            
            if not categories:
                return {}
            
            # Get items for each category
            result = {}
            for category in categories:
                items = Pricing.get_items_by_category(category['id'])
                result[category['category_slug']] = {
                    'category': category,
                    'items': items
                }
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting items grouped by category: {e}")
            return {}
    
    @staticmethod
    def get_items_grouped_by_service_type():
        """
        Get all items grouped by service type
        Returns: dict with service types as keys and items as values
        """
        try:
            service_types = ['iron', 'wash_iron', 'roll_press', 'dry_clean', 'premium_wash', 'steam_iron']
            
            result = {}
            for service_type in service_types:
                items = Pricing.get_items_by_service_type(service_type)
                if items:
                    result[service_type] = items
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting items grouped by service type: {e}")
            return {}
    
    @staticmethod
    def calculate_total_price(items_list):
        """
        Calculate total price for a list of items
        items_list: [{'item_id': 1, 'quantity': 2}, ...]
        Returns: (success, total_price or error_message)
        """
        try:
            total_price = 0.0
            
            for item_data in items_list:
                item_id = item_data.get('item_id')
                quantity = item_data.get('quantity', 1)
                
                # Get item details
                item = Pricing.get_item_by_id(item_id)
                if not item:
                    return False, f"Item with ID {item_id} not found"
                
                total_price += float(item['price']) * quantity
            
            return True, round(total_price, 2)
            
        except Exception as e:
            logger.error(f"Error calculating total price: {e}")
            return False, str(e)