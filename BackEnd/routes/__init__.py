"""Routes package"""

from .auth import init_auth_routes
from .pricing import init_pricing_routes
from .order import init_order_routes
from .user import init_user_routes
from .dry_clean import init_dry_clean_routes  # ADD THIS LINE

__all__ = ['init_auth_routes', 'init_pricing_routes', 'init_order_routes', 'init_user_routes', 'init_dry_clean_routes']  # ADD HERE