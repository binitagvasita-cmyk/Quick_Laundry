# ============================================
# DRY CLEAN MODEL
# Database operations for dry cleaning orders
# ============================================

from BackEnd.utils.database import Database
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class DryClean:
    """Dry Clean model for handling dry cleaning orders"""
    
    @staticmethod
    def create_order(order_data):
        """
        Create a new dry clean order
        
        Args:
            order_data: Dictionary containing order details
            
        Returns:
            Tuple (success: bool, result: order_id or error_message)
        """
        connection = None
        cursor = None
        
        try:
            # Get database connection
            connection = Database.get_connection()
            cursor = connection.cursor()
            
            # Extract order data
            name = order_data.get('name')
            email = order_data.get('email')
            phone = order_data.get('phone')
            address = order_data.get('address')
            service = order_data.get('service')
            items = order_data.get('items')
            pickup_date = order_data.get('pickup_date')
            pickup_time = order_data.get('pickup_time')
            special_instructions = order_data.get('special_instructions', '')
            user_id = order_data.get('user_id')
            
            logger.info(f"Creating dry clean order - Name: {name}, Email: {email}, Service: {service}")
            
            # Insert order
            insert_query = """
                INSERT INTO dry_clean_orders (
                    user_id, name, email, phone, address,
                    service, items, pickup_date, pickup_time,
                    special_instructions, status
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
            """
            
            params = (
                user_id,
                name,
                email,
                phone,
                address,
                service,
                items,
                pickup_date,
                pickup_time,
                special_instructions,
                'pending'
            )
            
            cursor.execute(insert_query, params)
            order_id = cursor.lastrowid
            
            # Commit transaction
            connection.commit()
            
            logger.info(f"✅ Dry clean order {order_id} created successfully")
            
            return True, order_id
            
        except Exception as e:
            logger.exception(f"❌ Error creating dry clean order: {e}")
            
            if connection:
                try:
                    connection.rollback()
                except Exception as rb_error:
                    logger.error(f"Rollback error: {rb_error}")
            
            return False, str(e)
        
        finally:
            if cursor:
                try:
                    cursor.close()
                except:
                    pass
            if connection:
                try:
                    connection.close()
                except:
                    pass
    
    @staticmethod
    def get_order_by_id(order_id):
        """Get dry clean order by ID"""
        cursor = None
        connection = None
        
        try:
            connection = Database.get_connection()
            cursor = connection.cursor(dictionary=True)
            
            query = """
                SELECT *
                FROM dry_clean_orders
                WHERE id = %s
            """
            
            cursor.execute(query, (order_id,))
            order = cursor.fetchone()
            
            if not order:
                return None
            
            # Format dates to ISO string
            if order.get('pickup_date'):
                order['pickup_date'] = order['pickup_date'].isoformat() if hasattr(order['pickup_date'], 'isoformat') else str(order['pickup_date'])
            if order.get('created_at'):
                order['created_at'] = order['created_at'].isoformat() if hasattr(order['created_at'], 'isoformat') else str(order['created_at'])
            if order.get('updated_at'):
                order['updated_at'] = order['updated_at'].isoformat() if hasattr(order['updated_at'], 'isoformat') else str(order['updated_at'])
            
            return order
            
        except Exception as e:
            logger.exception(f"Error getting dry clean order {order_id}: {e}")
            return None
        
        finally:
            if cursor:
                try:
                    cursor.close()
                except:
                    pass
            if connection:
                try:
                    connection.close()
                except:
                    pass
    
    @staticmethod
    def get_all_orders(status=None, limit=None, email=None):
        """Get all dry clean orders with optional filtering"""
        cursor = None
        connection = None
        
        try:
            connection = Database.get_connection()
            cursor = connection.cursor(dictionary=True)
            
            query = "SELECT * FROM dry_clean_orders WHERE 1=1"
            params = []
            
            if status:
                query += " AND status = %s"
                params.append(status)
            
            if email:
                query += " AND email = %s"
                params.append(email)
            
            query += " ORDER BY created_at DESC"
            
            if limit:
                query += " LIMIT %s"
                params.append(limit)
            
            cursor.execute(query, tuple(params) if params else None)
            orders = cursor.fetchall()
            
            # Format dates for each order
            for order in orders:
                if order.get('pickup_date'):
                    order['pickup_date'] = order['pickup_date'].isoformat() if hasattr(order['pickup_date'], 'isoformat') else str(order['pickup_date'])
                if order.get('created_at'):
                    order['created_at'] = order['created_at'].isoformat() if hasattr(order['created_at'], 'isoformat') else str(order['created_at'])
                if order.get('updated_at'):
                    order['updated_at'] = order['updated_at'].isoformat() if hasattr(order['updated_at'], 'isoformat') else str(order['updated_at'])
            
            return orders
            
        except Exception as e:
            logger.exception(f"Error getting dry clean orders: {e}")
            return []
        
        finally:
            if cursor:
                try:
                    cursor.close()
                except:
                    pass
            if connection:
                try:
                    connection.close()
                except:
                    pass
    
    @staticmethod
    def update_order_status(order_id, status):
        """Update dry clean order status"""
        connection = None
        cursor = None
        
        try:
            valid_statuses = ['pending', 'confirmed', 'processing', 'completed', 'cancelled']
            
            if status not in valid_statuses:
                return False, f'Invalid status. Must be one of: {", ".join(valid_statuses)}'
            
            connection = Database.get_connection()
            cursor = connection.cursor()
            
            query = "UPDATE dry_clean_orders SET status = %s, updated_at = NOW() WHERE id = %s"
            
            cursor.execute(query, (status, order_id))
            
            if cursor.rowcount == 0:
                return False, 'Order not found'
            
            connection.commit()
            logger.info(f"Dry clean order {order_id} status updated to {status}")
            
            return True, f'Order status updated to {status}'
            
        except Exception as e:
            logger.exception(f"Error updating order status: {e}")
            if connection:
                try:
                    connection.rollback()
                except:
                    pass
            return False, str(e)
        
        finally:
            if cursor:
                try:
                    cursor.close()
                except:
                    pass
            if connection:
                try:
                    connection.close()
                except:
                    pass
    
    @staticmethod
    def delete_order(order_id):
        """Delete a dry clean order"""
        connection = None
        cursor = None
        
        try:
            connection = Database.get_connection()
            cursor = connection.cursor()
            
            cursor.execute("DELETE FROM dry_clean_orders WHERE id = %s", (order_id,))
            
            if cursor.rowcount == 0:
                return False, 'Order not found'
            
            connection.commit()
            logger.info(f"Dry clean order {order_id} deleted")
            
            return True, 'Order deleted successfully'
            
        except Exception as e:
            logger.exception(f"Error deleting order: {e}")
            if connection:
                try:
                    connection.rollback()
                except:
                    pass
            return False, str(e)
        
        finally:
            if cursor:
                try:
                    cursor.close()
                except:
                    pass
            if connection:
                try:
                    connection.close()
                except:
                    pass
    
    @staticmethod
    def get_order_statistics():
        """Get dry clean order statistics"""
        cursor = None
        connection = None
        
        try:
            connection = Database.get_connection()
            cursor = connection.cursor(dictionary=True)
            
            query = """
                SELECT 
                    COUNT(*) as total_orders,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
                    SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_orders,
                    SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_orders,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
                    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders
                FROM dry_clean_orders
            """
            
            cursor.execute(query)
            stats = cursor.fetchone()
            
            return stats
            
        except Exception as e:
            logger.exception(f"Error getting order statistics: {e}")
            return None
        
        finally:
            if cursor:
                try:
                    cursor.close()
                except:
                    pass
            if connection:
                try:
                    connection.close()
                except:
                    pass
    
    @staticmethod
    def create_contact(contact_data):
        """Create a new contact form submission"""
        connection = None
        cursor = None
        
        try:
            connection = Database.get_connection()
            cursor = connection.cursor()
            
            name = contact_data.get('name')
            email = contact_data.get('email')
            subject = contact_data.get('subject')
            message = contact_data.get('message')
            
            logger.info(f"Creating contact submission - Name: {name}, Email: {email}")
            
            insert_query = """
                INSERT INTO dry_clean_contacts (
                    name, email, subject, message
                ) VALUES (
                    %s, %s, %s, %s
                )
            """
            
            params = (name, email, subject, message)
            
            cursor.execute(insert_query, params)
            contact_id = cursor.lastrowid
            
            connection.commit()
            
            logger.info(f"✅ Contact submission {contact_id} created successfully")
            
            return True, contact_id
            
        except Exception as e:
            logger.exception(f"❌ Error creating contact submission: {e}")
            
            if connection:
                try:
                    connection.rollback()
                except:
                    pass
            
            return False, str(e)
        
        finally:
            if cursor:
                try:
                    cursor.close()
                except:
                    pass
            if connection:
                try:
                    connection.close()
                except:
                    pass