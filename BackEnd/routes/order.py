# ============================================
# ORDER ROUTES - CORRECTED
# API endpoints for order management
# ============================================

from flask import Blueprint, request, jsonify
from models.order import Order
from functools import wraps
import logging

logger = logging.getLogger(__name__)

order_bp = Blueprint('order', __name__, url_prefix='/api/orders')


def init_order_routes(app):
    """Initialize order routes"""
    
    # Get JWT service from app config
    jwt_service = app.config.get('JWT_SERVICE')
    
    # Define token_required decorator
    def token_required(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = None
            
            # Handle OPTIONS request
            if request.method == 'OPTIONS':
                return jsonify(success=True), 200
            
            # Get token from header
            auth_header = request.headers.get('Authorization')
            
            if auth_header and auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
            
            if not token:
                logger.warning("No token provided")
                return jsonify({
                    'success': False,
                    'message': 'Token is missing'
                }), 401
            
            try:
                # Verify token
                is_valid, payload = jwt_service.verify_token(token)
                
                if not is_valid:
                    logger.warning(f"Invalid token: {payload}")
                    return jsonify({
                        'success': False,
                        'message': 'Invalid or expired token'
                    }), 401
                
                # Add user info to request
                request.current_user = payload
                
            except Exception as e:
                logger.exception(f"Token verification error: {e}")
                return jsonify({
                    'success': False,
                    'message': 'Token verification failed'
                }), 401
            
            return f(*args, **kwargs)
        
        return decorated
    
    # ========================================
    # CREATE ORDER
    # ========================================
    @order_bp.route('', methods=['POST', 'OPTIONS'])
    @token_required
    def create_order():
        """Create a new order"""
        
        try:
            # Get order data from request
            data = request.get_json(silent=True)
            
            if not data:
                return jsonify({
                    'success': False,
                    'message': 'No data provided'
                }), 400
            
            # Validate required fields
            if not data.get('items'):
                return jsonify({
                    'success': False,
                    'message': 'Order must contain at least one item'
                }), 400
            
            if not data.get('total_items') or data.get('total_items') <= 0:
                return jsonify({
                    'success': False,
                    'message': 'Invalid total items count'
                }), 400
            
            if not data.get('total_amount') or data.get('total_amount') <= 0:
                return jsonify({
                    'success': False,
                    'message': 'Invalid total amount'
                }), 400
            
            # Get user ID from authenticated user
            user_id = request.current_user.get('user_id') or request.current_user.get('id')
            
            logger.info(f"Creating order for user {user_id}")
            logger.info(f"Order data: Service={data.get('service_type')}, Items={data.get('total_items')}, Amount={data.get('total_amount')}")
            logger.info(f"Urgent items: {data.get('urgent_items')}, Normal items: {data.get('normal_items')}")
            
            # Create order in database
            success, result = Order.create_order(user_id, data)
            
            if success:
                order_id = result
                logger.info(f"Order created successfully with ID: {order_id}")
                
                # Get the created order details
                order = Order.get_order_by_id(order_id, user_id)
                
                return jsonify({
                    'success': True,
                    'message': 'Order placed successfully',
                    'order_id': order_id,
                    'order': order
                }), 201
            else:
                logger.error(f"Failed to create order: {result}")
                return jsonify({
                    'success': False,
                    'message': f'Failed to create order: {result}'
                }), 500
        
        except Exception as e:
            logger.exception(f"Error in create_order: {e}")
            return jsonify({
                'success': False,
                'message': f'Internal server error: {str(e)}'
            }), 500
    
    # ========================================
    # GET USER'S ORDERS
    # ========================================
    @order_bp.route('/my-orders', methods=['GET', 'OPTIONS'])
    @token_required
    def get_my_orders():
        """Get all orders for the current user"""
        
        try:
            user_id = request.current_user.get('user_id') or request.current_user.get('id')
            
            # Get query parameters
            limit = request.args.get('limit', type=int)
            status = request.args.get('status', type=str)
            
            logger.info(f"Fetching orders for user {user_id}")
            
            # Get orders from database
            orders = Order.get_user_orders(user_id, limit=limit, status=status)
            
            return jsonify({
                'success': True,
                'orders': orders,
                'count': len(orders)
            }), 200
        
        except Exception as e:
            logger.exception(f"Error in get_my_orders: {e}")
            return jsonify({
                'success': False,
                'message': f'Internal server error: {str(e)}'
            }), 500
    
    # ========================================
    # GET ORDER BY ID
    # ========================================
    @order_bp.route('/<int:order_id>', methods=['GET', 'OPTIONS'])
    @token_required
    def get_order(order_id):
        """Get a specific order by ID"""
        
        try:
            user_id = request.current_user.get('user_id') or request.current_user.get('id')
            
            logger.info(f"Fetching order {order_id} for user {user_id}")
            
            # Get order from database
            order = Order.get_order_by_id(order_id, user_id)
            
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
            logger.exception(f"Error in get_order: {e}")
            return jsonify({
                'success': False,
                'message': f'Internal server error: {str(e)}'
            }), 500
    
    # ========================================
    # UPDATE ORDER STATUS
    # ========================================
    @order_bp.route('/<int:order_id>/status', methods=['PUT', 'OPTIONS'])
    @token_required
    def update_status(order_id):
        """Update order status"""
        
        try:
            user_id = request.current_user.get('user_id') or request.current_user.get('id')
            data = request.get_json(silent=True)
            
            if not data or 'status' not in data:
                return jsonify({
                    'success': False,
                    'message': 'Status is required'
                }), 400
            
            status = data['status']
            
            logger.info(f"Updating order {order_id} status to {status}")
            
            # Update order status
            success, message = Order.update_order_status(order_id, status, user_id)
            
            if success:
                return jsonify({
                    'success': True,
                    'message': message
                }), 200
            else:
                return jsonify({
                    'success': False,
                    'message': message
                }), 400
        
        except Exception as e:
            logger.exception(f"Error in update_status: {e}")
            return jsonify({
                'success': False,
                'message': f'Internal server error: {str(e)}'
            }), 500
    
    # ========================================
    # CANCEL ORDER
    # ========================================
    @order_bp.route('/<int:order_id>/cancel', methods=['POST', 'OPTIONS'])
    @token_required
    def cancel_order(order_id):
        """Cancel an order"""
        
        try:
            user_id = request.current_user.get('user_id') or request.current_user.get('id')
            
            logger.info(f"Cancelling order {order_id} for user {user_id}")
            
            # Cancel order
            success, message = Order.cancel_order(order_id, user_id)
            
            if success:
                return jsonify({
                    'success': True,
                    'message': message
                }), 200
            else:
                return jsonify({
                    'success': False,
                    'message': message
                }), 400
        
        except Exception as e:
            logger.exception(f"Error in cancel_order: {e}")
            return jsonify({
                'success': False,
                'message': f'Internal server error: {str(e)}'
            }), 500
    
    # ========================================
    # GET ORDER STATISTICS
    # ========================================
    @order_bp.route('/statistics', methods=['GET', 'OPTIONS'])
    @token_required
    def get_statistics():
        """Get order statistics for the current user"""
        
        try:
            user_id = request.current_user.get('user_id') or request.current_user.get('id')
            
            logger.info(f"Fetching order statistics for user {user_id}")
            
            # Get statistics
            stats = Order.get_order_statistics(user_id)
            
            if stats:
                return jsonify({
                    'success': True,
                    'statistics': stats
                }), 200
            else:
                return jsonify({
                    'success': False,
                    'message': 'Failed to fetch statistics'
                }), 500
        
        except Exception as e:
            logger.exception(f"Error in get_statistics: {e}")
            return jsonify({
                'success': False,
                'message': f'Internal server error: {str(e)}'
            }), 500
    
    # ========================================
    # DELETE ORDER
    # ========================================
    @order_bp.route('/<int:order_id>', methods=['DELETE', 'OPTIONS'])
    @token_required
    def delete_order(order_id):
        """Delete an order permanently"""
        
        try:
            user_id = request.current_user.get('user_id') or request.current_user.get('id')
            
            logger.info(f"Deleting order {order_id} for user {user_id}")
            
            # Delete order
            success, message = Order.delete_order(order_id, user_id)
            
            if success:
                return jsonify({
                    'success': True,
                    'message': message
                }), 200
            else:
                return jsonify({
                    'success': False,
                    'message': message
                }), 400
        
        except Exception as e:
            logger.exception(f"Error in delete_order: {e}")
            return jsonify({
                'success': False,
                'message': f'Internal server error: {str(e)}'
            }), 500
    
    # ========================================
    # HEALTH CHECK
    # ========================================
    @order_bp.route('/health', methods=['GET', 'OPTIONS'])
    def health_check():
        """Health check endpoint"""
        return jsonify({
            'status': 'ok',
            'service': 'orders'
        }), 200
    
    # Register blueprint
    app.register_blueprint(order_bp)
    logger.info("Order routes initialized successfully")