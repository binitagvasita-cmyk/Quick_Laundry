from flask import Flask, jsonify
from flask_cors import CORS
from BackEnd.config import config_by_name
from BackEnd.utils.database import Database
from BackEnd.routes.auth import init_auth_routes
from BackEnd.routes.pricing import init_pricing_routes
from BackEnd.routes.order import init_order_routes
from BackEnd.routes.user import init_user_routes
from BackEnd.routes.dry_clean import init_dry_clean_routes  # NEW - DRY CLEAN ROUTES
import logging
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def create_app(config_name='development'):
    """Application factory"""
    
    # Create Flask app
    app = Flask(__name__)
    
    # Load configuration
    config = config_by_name.get(config_name, config_by_name['default'])
    app.config.from_object(config)
    config.init_app(app)
    
    # Enable CORS with proper configuration
    CORS(app, 
         resources={
             r"/api/*": {
                 "origins": "*",
                 "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                 "allow_headers": ["Content-Type", "Authorization", "Accept"],
                 "expose_headers": ["Content-Type", "Authorization"],
                 "supports_credentials": True,
                 "max_age": 3600
             }
         })
    
    # Initialize database
    try:
        Database.initialize(config)
        logger.info("Database initialized successfully")
        
        # Initialize pricing database
        from setup_pricing_db import initialize_pricing_database
        initialize_pricing_database()
        logger.info("Pricing database initialized successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise
    
    # Create upload folder if it doesn't exist
    if not os.path.exists(config.UPLOAD_FOLDER):
        os.makedirs(config.UPLOAD_FOLDER)
        logger.info(f"Created upload folder: {config.UPLOAD_FOLDER}")
    
    # Create profile_pictures subfolder
    profile_pictures_folder = os.path.join(config.UPLOAD_FOLDER, 'profile_pictures')
    if not os.path.exists(profile_pictures_folder):
        os.makedirs(profile_pictures_folder)
        logger.info(f"Created profile pictures folder: {profile_pictures_folder}")
    
    # Initialize routes
    init_auth_routes(app, config)
    logger.info("Authentication routes initialized")
    
    init_pricing_routes(app)
    logger.info("Pricing routes initialized")
    
    init_order_routes(app)
    logger.info("Order routes initialized")
    
    init_user_routes(app, config)
    logger.info("User profile routes initialized")
    
    init_dry_clean_routes(app)  # NEW - INITIALIZE DRY CLEAN ROUTES
    logger.info("Dry Clean routes initialized")
    
    # Health check endpoint
    @app.route('/health', methods=['GET', 'OPTIONS'])
    def health_check():
        """Health check endpoint"""
        try:
            # Test database connection
            db_status = Database.test_connection()
            
            return jsonify({
                'status': 'healthy' if db_status else 'degraded',
                'database': 'connected' if db_status else 'disconnected',
                'app_name': config.APP_NAME,
                'environment': config_name
            }), 200 if db_status else 503
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return jsonify({
                'status': 'unhealthy',
                'error': str(e)
            }), 503
    
    # Root endpoint
    @app.route('/', methods=['GET'])
    def index():
        """Root endpoint"""
        return jsonify({
            'message': f'Welcome to {config.APP_NAME} API',
            'version': '1.0.0',
            'endpoints': {
                'health': '/health',
                'auth': {
                    'send_otp': '/api/send-otp',
                    'verify_otp': '/api/verify-otp',
                    'register': '/api/register',
                    'login': '/api/login',
                },
                'user': {
                    'get_profile': '/api/user/<id>',
                    'update_profile': '/api/user/<id>',
                    'upload_avatar': '/api/user/<id>/upload-avatar',
                    'delete_avatar': '/api/user/<id>/delete-avatar',
                    'change_password': '/api/user/change-password',
                    'health': '/api/user/health'
                },
                'pricing': {
                    'categories': '/api/pricing/categories',
                    'items': '/api/pricing/items',
                    'popular': '/api/pricing/items/popular',
                    'search': '/api/pricing/search?q=<term>',
                    'health': '/api/pricing/health'
                },
                'orders': {
                    'create': '/api/orders',
                    'my_orders': '/api/orders/my-orders',
                    'order_details': '/api/orders/<id>',
                    'cancel': '/api/orders/<id>/cancel',
                    'statistics': '/api/orders/statistics',
                    'health': '/api/orders/health'
                },
                'dry_clean': {  # NEW - DRY CLEAN ENDPOINTS
                    'create_order': '/api/dry-clean/orders',
                    'get_orders': '/api/dry-clean/orders',
                    'get_order': '/api/dry-clean/orders/<id>',
                    'update_status': '/api/dry-clean/orders/<id>/status',
                    'delete_order': '/api/dry-clean/orders/<id>',
                    'statistics': '/api/dry-clean/statistics',
                    'contact': '/api/dry-clean/contact',
                    'health': '/api/dry-clean/health'
                }
            }
        }), 200
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        """Handle 404 errors"""
        return jsonify({
            'success': False,
            'message': 'Endpoint not found'
        }), 404
    
    @app.errorhandler(405)
    def method_not_allowed(error):
        """Handle 405 errors"""
        return jsonify({
            'success': False,
            'message': 'Method not allowed'
        }), 405
    
    @app.errorhandler(500)
    def internal_error(error):
        """Handle 500 errors"""
        logger.error(f"Internal server error: {error}")
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500
    
    # Request logging middleware
    @app.before_request
    def log_request():
        """Log incoming requests"""
        from flask import request
        logger.info(f"{request.method} {request.path} - {request.remote_addr}")
    
    # Response middleware - Add CORS headers to all responses
    @app.after_request
    def add_cors_headers(response):
        """Add CORS headers to all responses"""
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Accept'
        response.headers['Access-Control-Expose-Headers'] = 'Content-Type, Authorization'
        response.headers['Access-Control-Max-Age'] = '3600'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        
        # Log response
        from flask import request
        logger.info(f"{request.method} {request.path} - Status: {response.status_code}")
        
        return response
    
    logger.info(f"{config.APP_NAME} application created successfully")
    
    return app


def main():
    """Main entry point"""
    
    # Get environment from environment variable
    env = os.getenv('FLASK_ENV', 'development')
    
    # Create app
    app = create_app(env)
    
    # Get configuration
    config = config_by_name.get(env, config_by_name['default'])
    
    # Print startup information
    logger.info("="*50)
    logger.info(f"Starting {config.APP_NAME} Server")
    logger.info(f"Environment: {env}")
    logger.info(f"Debug Mode: {config.DEBUG}")
    logger.info(f"Database: {config.DB_NAME}")
    logger.info(f"Upload Folder: {config.UPLOAD_FOLDER}")
    logger.info(f"CORS: Enabled for all origins")
    logger.info(f"Server: http://0.0.0.0:3000")
    logger.info("="*50)
    logger.info("\n🧺 Dry Clean Service: ENABLED")
    logger.info("📍 Dry Clean API: http://localhost:3000/api/dry-clean")
    logger.info("="*50)
    
    # Run app
    app.run(
        host='0.0.0.0',
        port=3000,
        debug=config.DEBUG, 
        threaded=True
    )


if __name__ == '__main__':
    main()