/* ============================================
   IRON SERVICE PAGE - ORDER MANAGEMENT
   Database Integration & Order Processing
   ============================================ */

// API Configuration
const API_CONFIG = {
    baseURL: 'http://localhost:3000/api', // Updated to match your backend port
    endpoints: {
        createOrder: '/orders',
        getOrders: '/orders/my-orders',
        updateOrder: '/orders'
    }
};

// Global order data
let orderData = {
    items: [],
    totalItems: 0,
    totalAmount: 0,
    urgentItems: 0,
    normalItems: 0
};

// ============================================
// QUANTITY CONTROL FUNCTIONS
// ============================================

function incrementQty(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        input.value = parseInt(input.value) + 1;
        calculateTotal();
    }
}

function decrementQty(inputId) {
    const input = document.getElementById(inputId);
    if (input && parseInt(input.value) > 0) {
        input.value = parseInt(input.value) - 1;
        calculateTotal();
    }
}

// ============================================
// CALCULATE TOTAL FUNCTION
// ============================================

function calculateTotal() {
    let grandTotal = 0;
    let totalItems = 0;
    let urgentCount = 0;
    let normalCount = 0;
    orderData.items = [];

    // Get all quantity inputs
    document.querySelectorAll('.qty-input').forEach(input => {
        const qty = parseInt(input.value) || 0;
        const price = parseInt(input.dataset.price);
        const targetId = input.dataset.target;
        const serviceName = input.dataset.service;

        // Calculate subtotal for this item
        const subtotal = qty * price;
        
        // Update subtotal display
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            targetElement.innerText = subtotal;
        }

        // Add to grand total and item count
        if (qty > 0) {
            grandTotal += subtotal;
            totalItems += qty;

            // Count urgent vs normal items
            if (serviceName === 'Urgent Iron') {
                urgentCount += qty;
            } else if (serviceName === 'Normal Iron') {
                normalCount += qty;
            }

            // Add to order items array
            orderData.items.push({
                service: serviceName,
                quantity: qty,
                price_per_item: price,
                subtotal: subtotal
            });
        }
    });

    // Update displays
    const grandTotalElement = document.getElementById('grandTotal');
    const totalItemsElement = document.getElementById('totalItems');
    
    if (grandTotalElement) {
        grandTotalElement.innerText = `₹${grandTotal}`;
    }
    
    if (totalItemsElement) {
        totalItemsElement.innerText = totalItems;
    }

    // Update global order data
    orderData.totalItems = totalItems;
    orderData.totalAmount = grandTotal;
    orderData.urgentItems = urgentCount;
    orderData.normalItems = normalCount;

    // Enable/disable order button
    const orderButton = document.getElementById('placeOrderBtn');
    if (orderButton) {
        if (totalItems > 0) {
            orderButton.disabled = false;
            orderButton.style.opacity = '1';
        } else {
            orderButton.disabled = true;
            orderButton.style.opacity = '0.6';
        }
    }
}

// ============================================
// AUTHENTICATION CHECK
// ============================================

function checkAuthentication() {
    try {
        const token = localStorage.getItem('access_token');
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        return !!(token && isLoggedIn);
    } catch (e) {
        console.warn('localStorage not available:', e);
        return false;
    }
}

function getCurrentUser() {
    try {
        const userData = localStorage.getItem('currentUser');
        return userData ? JSON.parse(userData) : null;
    } catch (e) {
        console.warn('Could not get user data:', e);
        return null;
    }
}

function getAuthToken() {
    try {
        return localStorage.getItem('access_token');
    } catch (e) {
        console.warn('Could not get auth token:', e);
        return null;
    }
}

// ============================================
// PLACE ORDER FUNCTION
// ============================================

async function placeOrder() {
    // Check if user is logged in
    if (!checkAuthentication()) {
        showError('Please Login', 'You need to be logged in to place an order. Please login or create an account.');
        
        // Open login modal after 2 seconds
        setTimeout(() => {
            if (window.authManager) {
                window.authManager.openAuthModal('login');
            }
        }, 2000);
        return;
    }

    // Check if there are items in the order
    if (orderData.totalItems === 0) {
        showError('Empty Order', 'Please select at least one item to place an order.');
        return;
    }

    // Get current user data
    const currentUser = getCurrentUser();
    const authToken = getAuthToken();

    if (!currentUser || !authToken) {
        showError('Authentication Error', 'Unable to verify your login. Please login again.');
        return;
    }

    // Calculate delivery date
    const orderDate = new Date();
    let deliveryDate = new Date();
    
    if (orderData.urgentItems > 0) {
        // Urgent: Same day if before 6 PM, otherwise next day
        if (orderDate.getHours() < 18) {
            deliveryDate.setHours(20, 0, 0, 0);
        } else {
            deliveryDate.setDate(deliveryDate.getDate() + 1);
            deliveryDate.setHours(20, 0, 0, 0);
        }
    } else {
        // Normal: 24 hours from now
        deliveryDate = new Date(orderDate.getTime() + (24 * 60 * 60 * 1000));
    }

    // Prepare order data
    const orderPayload = {
        service_type: 'iron',
        items: orderData.items,
        total_items: orderData.totalItems,
        total_amount: orderData.totalAmount,
        urgent_items: orderData.urgentItems,
        normal_items: orderData.normalItems,
        order_date: orderDate.toISOString(),
        delivery_address: currentUser.address || 'Not provided',
        contact_number: currentUser.phone || currentUser.mobile || 'Not provided',
        notes: ''
    };

    console.log('Placing order:', orderPayload);

    // Show loading state
    const orderButton = document.getElementById('placeOrderBtn');
    const originalButtonContent = orderButton.innerHTML;
    orderButton.disabled = true;
    orderButton.innerHTML = `
        <span class="btn-icon">⏳</span>
        <span>Processing...</span>
    `;

    try {
        // Send order to backend API
        const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.createOrder}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(orderPayload)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // Order placed successfully
            console.log('Order placed successfully:', result);
            
            // Calculate delivery info
            const deliveryInfo = formatDeliveryInfo(deliveryDate, orderData.urgentItems > 0);
            
            // Show success modal
            showSuccess(result.order_id, deliveryInfo);
            
            // Reset order form
            resetOrderForm();
            
            // Save order to local storage as backup
            saveOrderToLocalStorage(orderPayload, result.order_id);
            
        } else {
            // Order failed
            throw new Error(result.message || 'Failed to place order');
        }

    } catch (error) {
        console.error('Order error:', error);
        
        // If backend is not available, save order locally
        if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed to fetch')) {
            console.log('Backend not available, saving order locally...');
            const localOrderId = saveOrderToLocalStorage(orderPayload);
            const deliveryInfo = formatDeliveryInfo(deliveryDate, orderData.urgentItems > 0);
            showSuccess(localOrderId, deliveryInfo, true);
            resetOrderForm();
        } else {
            showError('Order Failed', error.message || 'Unable to place order. Please try again.');
        }
        
    } finally {
        // Restore button state
        orderButton.disabled = false;
        orderButton.innerHTML = originalButtonContent;
        calculateTotal(); // This will re-enable/disable based on items
    }
}

// ============================================
// DELIVERY INFO FORMATTING
// ============================================

function formatDeliveryInfo(deliveryDate, isUrgent) {
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    const formattedDate = deliveryDate.toLocaleDateString('en-US', options);
    const serviceType = isUrgent ? 'Express Service' : 'Standard Service';
    
    return `${serviceType} - Expected delivery by ${formattedDate}`;
}

// ============================================
// LOCAL STORAGE BACKUP FUNCTIONS
// ============================================

function saveOrderToLocalStorage(orderData, orderId = null) {
    try {
        // Generate order ID if not provided
        const localOrderId = orderId || `ORDER-${Date.now()}`;
        
        // Get existing orders
        let orders = JSON.parse(localStorage.getItem('ironOrders') || '[]');
        
        // Add new order
        const orderWithId = {
            ...orderData,
            order_id: localOrderId,
            created_at: new Date().toISOString(),
            synced: !!orderId // true if saved to backend, false if local only
        };
        
        orders.push(orderWithId);
        
        // Save back to localStorage
        localStorage.setItem('ironOrders', JSON.stringify(orders));
        
        console.log('Order saved to localStorage:', localOrderId);
        return localOrderId;
        
    } catch (e) {
        console.warn('Could not save order to localStorage:', e);
        return null;
    }
}

function getOrdersFromLocalStorage() {
    try {
        const orders = localStorage.getItem('ironOrders');
        return orders ? JSON.parse(orders) : [];
    } catch (e) {
        console.warn('Could not retrieve orders from localStorage:', e);
        return [];
    }
}

function clearLocalOrders() {
    try {
        localStorage.removeItem('ironOrders');
        console.log('Local orders cleared');
    } catch (e) {
        console.warn('Could not clear local orders:', e);
    }
}

// ============================================
// RESET ORDER FORM
// ============================================

function resetOrderForm() {
    // Reset all quantity inputs
    document.querySelectorAll('.qty-input').forEach(input => {
        input.value = 0;
    });
    
    // Reset displays
    document.querySelectorAll('[id$="Total"]').forEach(element => {
        element.innerText = '0';
    });
    
    // Reset order data
    orderData = {
        items: [],
        totalItems: 0,
        totalAmount: 0,
        urgentItems: 0,
        normalItems: 0
    };
    
    // Recalculate (will show zeros and disable button)
    calculateTotal();
}

// ============================================
// MODAL FUNCTIONS
// ============================================

function showSuccess(orderId, deliveryInfo, isLocal = false) {
    const modal = document.getElementById('successModal');
    const orderDetails = document.getElementById('orderDetails');
    
    if (modal && orderDetails) {
        const message = isLocal 
            ? `Your order (${orderId}) has been saved locally and will be synced when the server is available. ${deliveryInfo}`
            : `Your order has been placed successfully! Order ID: ${orderId}. ${deliveryInfo}`;
        
        orderDetails.textContent = message;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Auto-close after 8 seconds
        setTimeout(() => {
            closeModal();
        }, 8000);
    }
}

function showError(title, message) {
    const modal = document.getElementById('errorModal');
    const errorTitle = document.getElementById('errorTitle');
    const errorMessage = document.getElementById('errorMessage');
    
    if (modal && errorTitle && errorMessage) {
        errorTitle.textContent = title;
        errorMessage.textContent = message;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = '';
}

// ============================================
// FETCH USER ORDERS (Optional - for order history)
// ============================================

async function fetchUserOrders() {
    if (!checkAuthentication()) {
        console.log('User not authenticated');
        return [];
    }

    const authToken = getAuthToken();
    
    try {
        const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.getOrders}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const result = await response.json();
            return result.orders || [];
        } else {
            console.error('Failed to fetch orders');
            return getOrdersFromLocalStorage(); // Fallback to local storage
        }
    } catch (error) {
        console.error('Error fetching orders:', error);
        return getOrdersFromLocalStorage(); // Fallback to local storage
    }
}

// ============================================
// NOTIFICATION SYSTEM
// ============================================

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        z-index: 10001;
        animation: slideInRight 0.3s ease;
        font-weight: 600;
        max-width: 350px;
    `;

    // Add animation style if not exists
    if (!document.querySelector('[data-notification-style]')) {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        style.setAttribute('data-notification-style', '');
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

document.addEventListener('keydown', (e) => {
    // Escape key to close modals
    if (e.key === 'Escape') {
        closeModal();
    }
    
    // Enter key to place order (if focused on quantity input)
    if (e.key === 'Enter' && e.target.classList.contains('qty-input')) {
        e.preventDefault();
        const orderButton = document.getElementById('placeOrderBtn');
        if (orderButton && !orderButton.disabled) {
            placeOrder();
        }
    }
});

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('Iron service page initialized');
    
    // Initialize calculations
    calculateTotal();
    
    // Check authentication status
    if (checkAuthentication()) {
        const user = getCurrentUser();
        console.log('User logged in:', user?.email || 'Unknown');
        showNotification('Welcome back! Ready to place your order.', 'info');
    } else {
        console.log('User not logged in');
    }
    
    // Add click outside modal to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    });
    
    // Log local orders for debugging
    const localOrders = getOrdersFromLocalStorage();
    if (localOrders.length > 0) {
        console.log(`Found ${localOrders.length} local orders:`, localOrders);
    }
});

// ============================================
// EXPORT FUNCTIONS FOR DEBUGGING
// ============================================

window.ironService = {
    calculateTotal,
    placeOrder,
    closeModal,
    fetchUserOrders,
    getOrdersFromLocalStorage,
    clearLocalOrders,
    showNotification
};

console.log('Iron service module loaded. Access via window.ironService');