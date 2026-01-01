# ============================================
# DRY CLEAN ROUTES
# API endpoints for dry cleaning services
# ============================================

from flask import Blueprint, request, jsonify
from models.dry_clean import DryClean
from services.jwt_service import optional_token, token_required
import logging

logger = logging.getLogger(__name__)

dry_clean_bp = Blueprint('dry_clean', __name__, url_prefix='/api/dry-clean')

def init_dry_clean_routes(app):
    """Initialize dry clean routes"""
    
    # ========================================
    # CREATE DRY CLEAN ORDER
    # ========================================
    @dry_clean_bp.route('/orders', methods=['POST', 'OPTIONS'])
    @optional_token
    def create_dry_clean_order():
        """Create a new dry clean order"""
        
        if request.method == 'OPTIONS':
            return jsonify(success=True), 200
        
        try:
            data = request.get_json(silent=True)
            
            if not data:
                return jsonify({
                    'success': False,
                    'message': 'Request body is required'
                }), 400
            
            # Validate required fields
            required_fields = ['name', 'email', 'phone', 'address', 'service', 
                             'items', 'pickupDate', 'pickupTime']
            
            missing_fields = [field for field in required_fields if not data.get(field)]
            
            if missing_fields:
                return jsonify({
                    'success': False,
                    'message': f'Missing required fields: {", ".join(missing_fields)}'
                }), 400
            
            # Create order data
            order_data = {
                'name': data['name'],
                'email': data['email'],
                'phone': data['phone'],
                'address': data['address'],
                'service': data['service'],
                'items': data['items'],
                'pickup_date': data['pickupDate'],
                'pickup_time': data['pickupTime'],
                'special_instructions': data.get('specialInstructions', ''),
                'user_id': getattr(request, 'user_id', None)  # From JWT if logged in
            }
            
            # Create order
            success, result = DryClean.create_order(order_data)
            
            if not success:
                return jsonify({
                    'success': False,
                    'message': result
                }), 500
            
            # Get complete order details
            order = DryClean.get_order_by_id(result)
            
            return jsonify({
                'success': True,
                'message': 'Order placed successfully!',
                'order': order
            }), 201
            
        except Exception as e:
            logger.exception("Error creating dry clean order")
            return jsonify({
                'success': False,
                'message': 'Failed to create order'
            }), 500
    
    # ========================================
    # GET ALL DRY CLEAN ORDERS
    # ========================================
    @dry_clean_bp.route('/orders', methods=['GET', 'OPTIONS'])
    @optional_token
    def get_dry_clean_orders():
        """Get all dry clean orders (with optional filtering)"""
        
        if request.method == 'OPTIONS':
            return jsonify(success=True), 200
        
        try:
            # Get query parameters
            status = request.args.get('status')
            limit = request.args.get('limit', type=int)
            email = request.args.get('email')
            
            # Get orders
            orders = DryClean.get_all_orders(status=status, limit=limit, email=email)
            
            return jsonify({
                'success': True,
                'orders': orders,
                'count': len(orders)
            }), 200
            
        except Exception as e:
            logger.exception("Error getting dry clean orders")
            return jsonify({
                'success': False,
                'message': 'Failed to fetch orders'
            }), 500
    
    # ========================================
    # GET DRY CLEAN ORDER BY ID
    # ========================================
    @dry_clean_bp.route('/orders/<int:order_id>', methods=['GET', 'OPTIONS'])
    @optional_token
    def get_dry_clean_order(order_id):
        """Get dry clean order by ID"""
        
        if request.method == 'OPTIONS':
            return jsonify(success=True), 200
        
        try:
            order = DryClean.get_order_by_id(order_id)
            
            if not order:
                return jsonify({
                    'success': False,
                    'message': 'Order not found'
                }), 404
            
            return jsonify({
                'success': True,
                'order': order
            }), 200
            
        except Exception as e:
            logger.exception("Error getting dry clean order")
            return jsonify({
                'success': False,
                'message': 'Failed to fetch order'
            }), 500
    
    # ========================================
    # UPDATE DRY CLEAN ORDER STATUS
    # ========================================
    @dry_clean_bp.route('/orders/<int:order_id>/status', methods=['PUT', 'OPTIONS'])
    @optional_token
    def update_order_status(order_id):
        """Update dry clean order status"""
        
        if request.method == 'OPTIONS':
            return jsonify(success=True), 200
        
        try:
            data = request.get_json(silent=True)
            
            if not data or 'status' not in data:
                return jsonify({
                    'success': False,
                    'message': 'Status is required'
                }), 400
            
            success, message = DryClean.update_order_status(order_id, data['status'])
            
            if not success:
                return jsonify({
                    'success': False,
                    'message': message
                }), 400
            
            # Get updated order
            order = DryClean.get_order_by_id(order_id)
            
            return jsonify({
                'success': True,
                'message': message,
                'order': order
            }), 200
            
        except Exception as e:
            logger.exception("Error updating order status")
            return jsonify({
                'success': False,
                'message': 'Failed to update status'
            }), 500
    
    # ========================================
    # DELETE DRY CLEAN ORDER
    # ========================================
    @dry_clean_bp.route('/orders/<int:order_id>', methods=['DELETE', 'OPTIONS'])
    @optional_token
    def delete_order(order_id):
        """Delete dry clean order"""
        
        if request.method == 'OPTIONS':
            return jsonify(success=True), 200
        
        try:
            success, message = DryClean.delete_order(order_id)
            
            if not success:
                return jsonify({
                    'success': False,
                    'message': message
                }), 404
            
            return jsonify({
                'success': True,
                'message': message
            }), 200
            
        except Exception as e:
            logger.exception("Error deleting order")
            return jsonify({
                'success': False,
                'message': 'Failed to delete order'
            }), 500
    
    # ========================================
    # GET ORDER STATISTICS
    # ========================================
    @dry_clean_bp.route('/statistics', methods=['GET', 'OPTIONS'])
    @optional_token
    def get_statistics():
        """Get dry clean order statistics"""
        
        if request.method == 'OPTIONS':
            return jsonify(success=True), 200
        
        try:
            stats = DryClean.get_order_statistics()
            
            return jsonify({
                'success': True,
                'statistics': stats
            }), 200
            
        except Exception as e:
            logger.exception("Error getting statistics")
            return jsonify({
                'success': False,
                'message': 'Failed to fetch statistics'
            }), 500
    
    # ========================================
    # CONTACT FORM SUBMISSION
    # ========================================
    @dry_clean_bp.route('/contact', methods=['POST', 'OPTIONS'])
    def submit_contact():
        """Submit contact form"""
        
        if request.method == 'OPTIONS':
            return jsonify(success=True), 200
        
        try:
            data = request.get_json(silent=True)
            
            if not data:
                return jsonify({
                    'success': False,
                    'message': 'Request body is required'
                }), 400
            
            required_fields = ['name', 'email', 'subject', 'message']
            missing_fields = [field for field in required_fields if not data.get(field)]
            
            if missing_fields:
                return jsonify({
                    'success': False,
                    'message': f'Missing required fields: {", ".join(missing_fields)}'
                }), 400
            
            success, result = DryClean.create_contact(data)
            
            if not success:
                return jsonify({
                    'success': False,
                    'message': result
                }), 500
            
            return jsonify({
                'success': True,
                'message': 'Thank you for contacting us! We will get back to you soon.',
                'contact_id': result
            }), 201
            
        except Exception as e:
            logger.exception("Error submitting contact form")
            return jsonify({
                'success': False,
                'message': 'Failed to submit contact form'
            }), 500
    
    # ========================================
    # HEALTH CHECK
    # ========================================
    @dry_clean_bp.route('/health', methods=['GET', 'OPTIONS'])
    def dry_clean_health():
        """Dry clean API health check"""
        
        if request.method == 'OPTIONS':
            return jsonify(success=True), 200
        
        try:
            # Test database connection
            stats = DryClean.get_order_statistics()
            
            return jsonify({
                'status': 'healthy',
                'message': 'Dry Clean API is operational',
                'total_orders': stats.get('total_orders', 0)
            }), 200
            
        except Exception as e:
            logger.exception("Dry clean health check failed")
            return jsonify({
                'status': 'unhealthy',
                'message': str(e)
            }), 503
    
    # Register blueprint
    app.register_blueprint(dry_clean_bp)
    logger.info("Dry Clean routes initialized")