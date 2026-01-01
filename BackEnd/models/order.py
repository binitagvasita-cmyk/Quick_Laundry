# ============================================
# ORDER MODEL - FIXED DELIVERY_DATE ISSUE
# ============================================

from utils.database import Database
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class Order:
    """Order model for handling order operations"""
    
    @staticmethod
    def create_order(user_id, order_data):
        """
        Create a new order for iron service
        
        Args:
            user_id: ID of the user placing the order
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
            
            # Extract order data from frontend
            items = order_data.get('items', [])
            service_type = order_data.get('service_type', 'iron')
            total_items = order_data.get('total_items', 0)
            total_amount = order_data.get('total_amount', 0)
            urgent_items = order_data.get('urgent_items', 0)
            normal_items = order_data.get('normal_items', 0)
            delivery_address = order_data.get('delivery_address', '')
            contact_number = order_data.get('contact_number', '')
            notes = order_data.get('notes', '')
            
            logger.info(f"Processing order - User: {user_id}, Items: {total_items}, Amount: {total_amount}")
            
            # Calculate delivery date based on service type
            order_date = datetime.now()
            
            if urgent_items > 0:
                # Urgent: Same day if before 6 PM, otherwise next day
                if order_date.hour < 18:
                    delivery_date = order_date.replace(hour=20, minute=0, second=0, microsecond=0)
                else:
                    delivery_date = order_date + timedelta(days=1)
                    delivery_date = delivery_date.replace(hour=20, minute=0, second=0, microsecond=0)
            else:
                # Normal: 24 hours from now
                delivery_date = order_date + timedelta(hours=24)
            
            # Calculate subtotal and tax
            subtotal = float(total_amount)
            tax = round(subtotal * 0.18, 2)  # 18% GST
            total = subtotal + tax
            
            logger.info(f"Order calculations - Subtotal: {subtotal}, Tax: {tax}, Total: {total}")
            logger.info(f"Delivery date calculated: {delivery_date}")
            
            # Build notes with all information
            order_notes = f"Service: {service_type} | Address: {delivery_address} | Contact: {contact_number}"
            order_notes += f" | Urgent: {urgent_items} | Normal: {normal_items}"
            if notes:
                order_notes += f" | Notes: {notes}"
            
            # CRITICAL FIX: Insert order with properly formatted delivery_date
            insert_query = """
                INSERT INTO orders (
                    user_id, subtotal, tax, total,
                    order_status, payment_status,
                    delivery_date, notes
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s
                )
            """
            
            # Convert datetime to string format that MySQL accepts
            delivery_date_str = delivery_date.strftime('%Y-%m-%d %H:%M:%S')
            
            # Prepare parameters with explicit type conversion
            params = (
                int(user_id),
                float(subtotal),
                float(tax),
                float(total),
                'pending',
                'pending',
                delivery_date_str,  # String format for MySQL
                order_notes
            )
            
            logger.info(f"Inserting order with delivery_date: {delivery_date_str}")
            logger.info(f"Full params: {params}")
            
            cursor.execute(insert_query, params)
            
            order_id = cursor.lastrowid
            logger.info(f"Order record created with ID: {order_id}")
            
            # Insert order items
            if items:
                items_query = """
                    INSERT INTO order_items (
                        order_id, item_id, item_name, quantity, 
                        price, service_type, subtotal
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                """
                
                for idx, item in enumerate(items, start=1):
                    item_name = item.get('service', 'Iron Service')
                    quantity = int(item.get('quantity', 0))
                    price = float(item.get('price_per_item', 0))
                    item_subtotal = float(item.get('subtotal', 0))
                    
                    item_params = (
                        int(order_id),
                        idx,
                        item_name,
                        quantity,
                        price,
                        service_type,
                        item_subtotal
                    )
                    
                    cursor.execute(items_query, item_params)
                    logger.info(f"Order item added - {item_name}: {quantity} x {price} = {item_subtotal}")
            
            # Commit transaction
            connection.commit()
            
            logger.info(f"✓ Order {order_id} created successfully for user {user_id}")
            
            return True, order_id
            
        except Exception as e:
            logger.exception(f"✗ Error creating order: {e}")
            
            # Rollback transaction if connection exists
            if connection:
                try:
                    connection.rollback()
                    logger.info("Transaction rolled back")
                except Exception as rb_error:
                    logger.error(f"Rollback error: {rb_error}")
            
            return False, str(e)
        
        finally:
            # Close cursor and connection
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
    def get_order_by_id(order_id, user_id=None):
        """Get order by ID with items"""
        cursor = None
        connection = None
        
        try:
            connection = Database.get_connection()
            cursor = connection.cursor(dictionary=True)
            
            query = """
                SELECT 
                    o.id, o.user_id, o.subtotal, o.tax, o.total,
                    o.order_status, o.payment_status, o.delivery_date,
                    o.pickup_date, o.notes, o.created_at, o.updated_at,
                    u.full_name, u.email, u.phone, u.address
                FROM orders o
                JOIN users u ON o.user_id = u.id
                WHERE o.id = %s
            """
            
            params = [order_id]
            
            if user_id:
                query += " AND o.user_id = %s"
                params.append(user_id)
            
            cursor.execute(query, tuple(params))
            order = cursor.fetchone()
            
            if not order:
                return None
            
            # Get order items
            items_query = "SELECT * FROM order_items WHERE order_id = %s"
            cursor.execute(items_query, (order_id,))
            items = cursor.fetchall()
            
            order['items'] = items
            
            # Format dates to ISO string
            if order.get('delivery_date'):
                order['delivery_date'] = order['delivery_date'].isoformat() if hasattr(order['delivery_date'], 'isoformat') else str(order['delivery_date'])
            if order.get('pickup_date'):
                order['pickup_date'] = order['pickup_date'].isoformat() if hasattr(order['pickup_date'], 'isoformat') else str(order['pickup_date'])
            if order.get('created_at'):
                order['created_at'] = order['created_at'].isoformat() if hasattr(order['created_at'], 'isoformat') else str(order['created_at'])
            if order.get('updated_at'):
                order['updated_at'] = order['updated_at'].isoformat() if hasattr(order['updated_at'], 'isoformat') else str(order['updated_at'])
            
            return order
            
        except Exception as e:
            logger.exception(f"Error getting order {order_id}: {e}")
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
    def get_user_orders(user_id, limit=None, status=None):
        """Get all orders for a user"""
        cursor = None
        connection = None
        
        try:
            connection = Database.get_connection()
            cursor = connection.cursor(dictionary=True)
            
            query = "SELECT * FROM orders WHERE user_id = %s"
            params = [user_id]
            
            if status:
                query += " AND order_status = %s"
                params.append(status)
            
            query += " ORDER BY created_at DESC"
            
            if limit:
                query += " LIMIT %s"
                params.append(limit)
            
            cursor.execute(query, tuple(params))
            orders = cursor.fetchall()
            
            # Format dates and get items for each order
            for order in orders:
                if order.get('delivery_date'):
                    order['delivery_date'] = order['delivery_date'].isoformat() if hasattr(order['delivery_date'], 'isoformat') else str(order['delivery_date'])
                if order.get('pickup_date'):
                    order['pickup_date'] = order['pickup_date'].isoformat() if hasattr(order['pickup_date'], 'isoformat') else str(order['pickup_date'])
                if order.get('created_at'):
                    order['created_at'] = order['created_at'].isoformat() if hasattr(order['created_at'], 'isoformat') else str(order['created_at'])
                if order.get('updated_at'):
                    order['updated_at'] = order['updated_at'].isoformat() if hasattr(order['updated_at'], 'isoformat') else str(order['updated_at'])
                
                # Get items
                items_query = "SELECT * FROM order_items WHERE order_id = %s"
                cursor.execute(items_query, (order['id'],))
                order['items'] = cursor.fetchall()
            
            return orders
            
        except Exception as e:
            logger.exception(f"Error getting user orders: {e}")
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
    def update_order_status(order_id, status, user_id=None):
        """Update order status"""
        connection = None
        cursor = None
        
        try:
            valid_statuses = ['pending', 'confirmed', 'processing', 'ready', 'delivered', 'cancelled']
            
            if status not in valid_statuses:
                return False, f'Invalid status. Must be one of: {", ".join(valid_statuses)}'
            
            connection = Database.get_connection()
            cursor = connection.cursor()
            
            query = "UPDATE orders SET order_status = %s, updated_at = NOW() WHERE id = %s"
            params = [status, order_id]
            
            if user_id:
                query += " AND user_id = %s"
                params.append(user_id)
            
            cursor.execute(query, tuple(params))
            
            if cursor.rowcount == 0:
                return False, 'Order not found or unauthorized'
            
            connection.commit()
            logger.info(f"Order {order_id} status updated to {status}")
            
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
    def cancel_order(order_id, user_id):
        """Cancel an order"""
        connection = None
        cursor = None
        
        try:
            connection = Database.get_connection()
            cursor = connection.cursor(dictionary=True)
            
            cursor.execute(
                "SELECT order_status FROM orders WHERE id = %s AND user_id = %s",
                (order_id, user_id)
            )
            order = cursor.fetchone()
            
            if not order:
                return False, 'Order not found'
            
            if order['order_status'] not in ['pending', 'confirmed']:
                return False, 'Order cannot be cancelled at this stage'
            
            cursor.execute(
                "UPDATE orders SET order_status = 'cancelled', updated_at = NOW() WHERE id = %s",
                (order_id,)
            )
            
            connection.commit()
            logger.info(f"Order {order_id} cancelled by user {user_id}")
            
            return True, 'Order cancelled successfully'
            
        except Exception as e:
            logger.exception(f"Error cancelling order: {e}")
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
    def get_order_statistics(user_id):
        """Get order statistics for a user"""
        cursor = None
        connection = None
        
        try:
            connection = Database.get_connection()
            cursor = connection.cursor(dictionary=True)
            
            query = """
                SELECT 
                    COUNT(*) as total_orders,
                    SUM(CASE WHEN order_status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
                    SUM(CASE WHEN order_status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_orders,
                    SUM(CASE WHEN order_status = 'processing' THEN 1 ELSE 0 END) as processing_orders,
                    SUM(CASE WHEN order_status = 'ready' THEN 1 ELSE 0 END) as ready_orders,
                    SUM(CASE WHEN order_status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
                    SUM(CASE WHEN order_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
                    SUM(total) as total_spent
                FROM orders
                WHERE user_id = %s
            """
            
            cursor.execute(query, (user_id,))
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
    def delete_order(order_id, user_id):
        """Delete an order permanently"""
        connection = None
        cursor = None
        
        try:
            connection = Database.get_connection()
            cursor = connection.cursor()
            
            # Delete order items first
            cursor.execute("DELETE FROM order_items WHERE order_id = %s", (order_id,))
            
            # Delete order
            cursor.execute(
                "DELETE FROM orders WHERE id = %s AND user_id = %s",
                (order_id, user_id)
            )
            
            if cursor.rowcount == 0:
                return False, 'Order not found'
            
            connection.commit()
            logger.info(f"Order {order_id} deleted by user {user_id}")
            
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
    def get_all_orders(limit=None, status=None):
        """Get all orders (admin function)"""
        cursor = None
        connection = None
        
        try:
            connection = Database.get_connection()
            cursor = connection.cursor(dictionary=True)
            
            query = """
                SELECT 
                    o.id, o.user_id, o.subtotal, o.tax, o.total,
                    o.order_status, o.payment_status, o.delivery_date,
                    o.created_at, o.updated_at,
                    u.full_name, u.email, u.phone
                FROM orders o
                JOIN users u ON o.user_id = u.id
                WHERE 1=1
            """
            
            params = []
            
            if status:
                query += " AND o.order_status = %s"
                params.append(status)
            
            query += " ORDER BY o.created_at DESC"
            
            if limit:
                query += " LIMIT %s"
                params.append(limit)
            
            cursor.execute(query, tuple(params) if params else None)
            orders = cursor.fetchall()
            
            # Format dates
            for order in orders:
                if order.get('delivery_date'):
                    order['delivery_date'] = order['delivery_date'].isoformat() if hasattr(order['delivery_date'], 'isoformat') else str(order['delivery_date'])
                if order.get('created_at'):
                    order['created_at'] = order['created_at'].isoformat() if hasattr(order['created_at'], 'isoformat') else str(order['created_at'])
                if order.get('updated_at'):
                    order['updated_at'] = order['updated_at'].isoformat() if hasattr(order['updated_at'], 'isoformat') else str(order['updated_at'])
            
            return orders
            
        except Exception as e:
            logger.exception(f"Error getting all orders: {e}")
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