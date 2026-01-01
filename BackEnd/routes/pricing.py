# ============================================
# PRICING ROUTES
# API endpoints for pricing and categories
# ============================================

from flask import Blueprint, request, jsonify
from models.pricing import Pricing
from services.jwt_service import optional_token
import logging

logger = logging.getLogger(__name__)

pricing_bp = Blueprint('pricing', __name__, url_prefix='/api/pricing')


def init_pricing_routes(app):
    """Initialize pricing routes"""
    
    # ========================================
    # GET ALL CATEGORIES
    # ========================================
    @pricing_bp.route('/categories', methods=['GET', 'OPTIONS'])
    @optional_token
    def get_categories():
        """Get all service categories"""
        
        if request.method == 'OPTIONS':
            return jsonify(success=True), 200
        
        try:
            categories = Pricing.get_all_categories()
            
            return jsonify({
                'success': True,
                'categories': categories,
                'count': len(categories)
            }), 200
            
        except Exception as e:
            logger.exception("Error getting categories")
            return jsonify({
                'success': False,
                'message': 'Failed to fetch categories'
            }), 500
    
    # ========================================
    # GET CATEGORY BY ID
    # ========================================
    @pricing_bp.route('/categories/<int:category_id>', methods=['GET', 'OPTIONS'])
    @optional_token
    def get_category(category_id):
        """Get category by ID"""
        
        if request.method == 'OPTIONS':
            return jsonify(success=True), 200
        
        try:
            category = Pricing.get_category_by_id(category_id)
            
            if not category:
                return jsonify({
                    'success': False,
                    'message': 'Category not found'
                }), 404
            
            return jsonify({
                'success': True,
                'category': category
            }), 200
            
        except Exception as e:
            logger.exception("Error getting category")
            return jsonify({
                'success': False,
                'message': 'Failed to fetch category'
            }), 500
    
    # ========================================
    # GET ALL PRICING ITEMS
    # ========================================
    @pricing_bp.route('/items', methods=['GET', 'OPTIONS'])
    @optional_token
    def get_all_items():
        """Get all pricing items"""
        
        if request.method == 'OPTIONS':
            return jsonify(success=True), 200
        
        try:
            items = Pricing.get_all_pricing_items()
            
            return jsonify({
                'success': True,
                'items': items,
                'count': len(items)
            }), 200
            
        except Exception as e:
            logger.exception("Error getting all items")
            return jsonify({
                'success': False,
                'message': 'Failed to fetch items'
            }), 500
    
    # ========================================
    # GET ITEMS BY CATEGORY
    # ========================================
    @pricing_bp.route('/items/category/<int:category_id>', methods=['GET', 'OPTIONS'])
    @optional_token
    def get_items_by_category(category_id):
        """Get items by category ID"""
        
        if request.method == 'OPTIONS':
            return jsonify(success=True), 200
        
        try:
            items = Pricing.get_items_by_category(category_id)
            
            return jsonify({
                'success': True,
                'items': items,
                'count': len(items)
            }), 200
            
        except Exception as e:
            logger.exception("Error getting items by category")
            return jsonify({
                'success': False,
                'message': 'Failed to fetch items'
            }), 500
    
    # ========================================
    # GET ITEMS BY SERVICE TYPE
    # ========================================
    @pricing_bp.route('/items/service/<service_type>', methods=['GET', 'OPTIONS'])
    @optional_token
    def get_items_by_service(service_type):
        """Get items by service type"""
        
        if request.method == 'OPTIONS':
            return jsonify(success=True), 200
        
        try:
            valid_types = ['iron', 'wash_iron', 'roll_press', 'dry_clean', 'premium_wash', 'steam_iron']
            
            if service_type not in valid_types:
                return jsonify({
                    'success': False,
                    'message': f'Invalid service type. Must be one of: {", ".join(valid_types)}'
                }), 400
            
            items = Pricing.get_items_by_service_type(service_type)
            
            return jsonify({
                'success': True,
                'service_type': service_type,
                'items': items,
                'count': len(items)
            }), 200
            
        except Exception as e:
            logger.exception("Error getting items by service type")
            return jsonify({
                'success': False,
                'message': 'Failed to fetch items'
            }), 500
    
    # ========================================
    # GET ITEMS BY GENDER
    # ========================================
    @pricing_bp.route('/items/gender/<gender_category>', methods=['GET', 'OPTIONS'])
    @optional_token
    def get_items_by_gender(gender_category):
        """Get items by gender category"""
        
        if request.method == 'OPTIONS':
            return jsonify(success=True), 200
        
        try:
            valid_genders = ['common', 'men', 'women', 'kids']
            
            if gender_category not in valid_genders:
                return jsonify({
                    'success': False,
                    'message': f'Invalid gender category. Must be one of: {", ".join(valid_genders)}'
                }), 400
            
            items = Pricing.get_items_by_gender(gender_category)
            
            return jsonify({
                'success': True,
                'gender_category': gender_category,
                'items': items,
                'count': len(items)
            }), 200
            
        except Exception as e:
            logger.exception("Error getting items by gender")
            return jsonify({
                'success': False,
                'message': 'Failed to fetch items'
            }), 500
    
    # ========================================
    # GET POPULAR ITEMS
    # ========================================
    @pricing_bp.route('/items/popular', methods=['GET', 'OPTIONS'])
    @optional_token
    def get_popular_items():
        """Get popular items"""
        
        if request.method == 'OPTIONS':
            return jsonify(success=True), 200
        
        try:
            items = Pricing.get_popular_items()
            
            return jsonify({
                'success': True,
                'items': items,
                'count': len(items)
            }), 200
            
        except Exception as e:
            logger.exception("Error getting popular items")
            return jsonify({
                'success': False,
                'message': 'Failed to fetch popular items'
            }), 500
    
    # ========================================
    # GET ITEM BY ID
    # ========================================
    @pricing_bp.route('/items/<int:item_id>', methods=['GET', 'OPTIONS'])
    @optional_token
    def get_item(item_id):
        """Get item by ID"""
        
        if request.method == 'OPTIONS':
            return jsonify(success=True), 200
        
        try:
            item = Pricing.get_item_by_id(item_id)
            
            if not item:
                return jsonify({
                    'success': False,
                    'message': 'Item not found'
                }), 404
            
            return jsonify({
                'success': True,
                'item': item
            }), 200
            
        except Exception as e:
            logger.exception("Error getting item")
            return jsonify({
                'success': False,
                'message': 'Failed to fetch item'
            }), 500
    
    # ========================================
    # SEARCH ITEMS
    # ========================================
    @pricing_bp.route('/search', methods=['GET', 'OPTIONS'])
    @optional_token
    def search_items():
        """Search items by name"""
        
        if request.method == 'OPTIONS':
            return jsonify(success=True), 200
        
        try:
            search_term = request.args.get('q', '').strip()
            
            if not search_term:
                return jsonify({
                    'success': False,
                    'message': 'Search term is required'
                }), 400
            
            if len(search_term) < 2:
                return jsonify({
                    'success': False,
                    'message': 'Search term must be at least 2 characters'
                }), 400
            
            items = Pricing.search_items(search_term)
            
            return jsonify({
                'success': True,
                'search_term': search_term,
                'items': items,
                'count': len(items)
            }), 200
            
        except Exception as e:
            logger.exception("Error searching items")
            return jsonify({
                'success': False,
                'message': 'Failed to search items'
            }), 500
    
    # ========================================
    # GET ITEMS GROUPED BY CATEGORY
    # ========================================
    @pricing_bp.route('/grouped/category', methods=['GET', 'OPTIONS'])
    @optional_token
    def get_items_grouped_by_category():
        """Get items grouped by category"""
        
        if request.method == 'OPTIONS':
            return jsonify(success=True), 200
        
        try:
            grouped_items = Pricing.get_items_grouped_by_category()
            
            return jsonify({
                'success': True,
                'data': grouped_items,
                'count': len(grouped_items)
            }), 200
            
        except Exception as e:
            logger.exception("Error getting grouped items")
            return jsonify({
                'success': False,
                'message': 'Failed to fetch grouped items'
            }), 500
    
    # ========================================
    # GET ITEMS GROUPED BY SERVICE TYPE
    # ========================================
    @pricing_bp.route('/grouped/service', methods=['GET', 'OPTIONS'])
    @optional_token
    def get_items_grouped_by_service():
        """Get items grouped by service type"""
        
        if request.method == 'OPTIONS':
            return jsonify(success=True), 200
        
        try:
            grouped_items = Pricing.get_items_grouped_by_service_type()
            
            return jsonify({
                'success': True,
                'data': grouped_items,
                'count': len(grouped_items)
            }), 200
            
        except Exception as e:
            logger.exception("Error getting grouped items by service")
            return jsonify({
                'success': False,
                'message': 'Failed to fetch grouped items'
            }), 500
    
    # ========================================
    # GET PRICING SUMMARY
    # ========================================
    @pricing_bp.route('/summary', methods=['GET', 'OPTIONS'])
    @optional_token
    def get_pricing_summary():
        """Get pricing summary statistics"""
        
        if request.method == 'OPTIONS':
            return jsonify(success=True), 200
        
        try:
            summary = Pricing.get_pricing_summary()
            
            if not summary:
                return jsonify({
                    'success': False,
                    'message': 'Failed to get summary'
                }), 500
            
            return jsonify({
                'success': True,
                'summary': summary
            }), 200
            
        except Exception as e:
            logger.exception("Error getting pricing summary")
            return jsonify({
                'success': False,
                'message': 'Failed to fetch summary'
            }), 500
    
    # ========================================
    # CALCULATE TOTAL PRICE
    # ========================================
    @pricing_bp.route('/calculate', methods=['POST', 'OPTIONS'])
    @optional_token
    def calculate_total():
        """Calculate total price for items"""
        
        if request.method == 'OPTIONS':
            return jsonify(success=True), 200
        
        try:
            data = request.get_json(silent=True)
            
            if not data or 'items' not in data:
                return jsonify({
                    'success': False,
                    'message': 'Items list is required'
                }), 400
            
            items_list = data['items']
            
            if not isinstance(items_list, list):
                return jsonify({
                    'success': False,
                    'message': 'Items must be a list'
                }), 400
            
            success, result = Pricing.calculate_total_price(items_list)
            
            if not success:
                return jsonify({
                    'success': False,
                    'message': result
                }), 400
            
            return jsonify({
                'success': True,
                'total_price': result,
                'items_count': len(items_list)
            }), 200
            
        except Exception as e:
            logger.exception("Error calculating total price")
            return jsonify({
                'success': False,
                'message': 'Failed to calculate total'
            }), 500
    
    # ========================================
    # PRICING HEALTH CHECK
    # ========================================
    @pricing_bp.route('/health', methods=['GET', 'OPTIONS'])
    def pricing_health():
        """Pricing API health check"""
        
        if request.method == 'OPTIONS':
            return jsonify(success=True), 200
        
        try:
            # Test database connection
            categories = Pricing.get_all_categories()
            
            return jsonify({
                'status': 'healthy',
                'message': 'Pricing API is operational',
                'categories_count': len(categories)
            }), 200
            
        except Exception as e:
            logger.exception("Pricing health check failed")
            return jsonify({
                'status': 'unhealthy',
                'message': str(e)
            }), 503
    
    # Register blueprint
    app.register_blueprint(pricing_bp)
    logger.info("Pricing routes initialized")