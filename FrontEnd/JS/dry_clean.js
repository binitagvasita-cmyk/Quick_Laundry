// ============================================
// DRY CLEAN SERVICE - WITH PAYMENT MODAL
// ============================================

// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// Service Pricing (₹500-2000 range)
const SERVICE_PRICING = {
    'suits': { name: 'Suits & Blazers', basePrice: 800, perItem: 150 },
    'dresses': { name: 'Dresses & Gowns', basePrice: 1200, perItem: 200 },
    'leather': { name: 'Daily Wear Clothes', basePrice: 500, perItem: 50 },
    'wedding': { name: 'Wedding Attire', basePrice: 2000, perItem: 300 },
    'curtains': { name: 'Curtains & Drapes', basePrice: 1500, perItem: 250 },
    'saree': { name: 'Saree', basePrice: 600, perItem: 100 },
    'household': { name: 'Household Items', basePrice: 700, perItem: 80 }
};

// Store order data globally
let currentOrderData = null;

// ============================================
// MODAL FUNCTIONALITY
// ============================================

const orderModal = document.getElementById('orderModal');
const closeModalBtn = document.getElementById('closeModal');
const orderForm = document.getElementById('orderForm');
const orderButtons = document.querySelectorAll('.order-btn, #orderNowBtn');

// Open Order Modal
orderButtons.forEach(button => {
    button.addEventListener('click', () => {
        orderModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('orderDate').setAttribute('min', today);
    });
});

// Close Order Modal
closeModalBtn.addEventListener('click', () => {
    closeOrderModal();
});

orderModal.addEventListener('click', (e) => {
    if (e.target === orderModal) {
        closeOrderModal();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (orderModal.classList.contains('active')) {
            closeOrderModal();
        }
        if (document.getElementById('paymentModal')?.classList.contains('active')) {
            closePaymentModal();
        }
    }
});

function closeOrderModal() {
    orderModal.classList.remove('active');
    document.body.style.overflow = '';
}

// ============================================
// FORM SUBMISSION - ORDER DETAILS
// ============================================

orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('orderName').value.trim(),
        email: document.getElementById('orderEmail').value.trim(),
        phone: document.getElementById('orderPhone').value.trim(),
        address: document.getElementById('orderAddress').value.trim(),
        service: document.getElementById('orderService').value,
        items: document.getElementById('orderItems').value.trim(),
        pickupDate: document.getElementById('orderDate').value,
        pickupTime: document.getElementById('orderTime').value,
        specialInstructions: document.getElementById('orderNotes').value.trim()
    };
    
    if (!validateForm(formData)) {
        return;
    }
    
    // Store order data
    currentOrderData = formData;
    
    // Close order modal
    closeOrderModal();
    
    // Show payment modal after short delay
    setTimeout(() => {
        showPaymentModal(formData);
    }, 300);
});

// ============================================
// PAYMENT MODAL
// ============================================

function showPaymentModal(orderData) {
    const servicePricing = SERVICE_PRICING[orderData.service];
    const estimatedTotal = servicePricing.basePrice;
    const advanceAmount = Math.round(estimatedTotal * 0.2); // 20% advance
    
    // Create payment modal HTML
    const paymentModalHTML = `
        <div class="modal active" id="paymentModal">
            <div class="modal-content payment-modal-content">
                <button class="modal-close" id="closePaymentModal">&times;</button>
                
                <div class="payment-header">
                    <div class="payment-icon">
                        <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
                            <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" stroke-width="2"/>
                            <path d="M2 10h20" stroke="currentColor" stroke-width="2"/>
                            <circle cx="7" cy="15" r="1" fill="currentColor"/>
                        </svg>
                    </div>
                    <h2 class="modal-title">Payment Required</h2>
                    <p class="modal-description">Pay 20% advance to confirm your booking</p>
                </div>
                
                <div class="payment-summary">
                    <h3>Order Summary</h3>
                    <div class="summary-row">
                        <span>Service:</span>
                        <strong>${servicePricing.name}</strong>
                    </div>
                    <div class="summary-row">
                        <span>Pickup Date:</span>
                        <strong>${formatDate(orderData.pickupDate)}</strong>
                    </div>
                    <div class="summary-row">
                        <span>Pickup Time:</span>
                        <strong>${orderData.pickupTime}</strong>
                    </div>
                    <div class="summary-divider"></div>
                    <div class="summary-row total-row">
                        <span>Estimated Total:</span>
                        <strong>₹${estimatedTotal}</strong>
                    </div>
                    <div class="summary-row advance-row">
                        <span>Advance Payment (20%):</span>
                        <strong class="highlight-amount">₹${advanceAmount}</strong>
                    </div>
                    <div class="summary-note">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                            <path d="M12 16v-4M12 8h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        <span>Final amount will be calculated after inspection</span>
                    </div>
                </div>
                
                <div class="payment-methods">
                    <h3>Select Payment Method</h3>
                    <div class="payment-options">
                        <label class="payment-option">
                            <input type="radio" name="paymentMethod" value="upi" checked>
                            <div class="option-content">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2"/>
                                    <path d="M12 6v12M6 12h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                                <div>
                                    <strong>UPI</strong>
                                    <span>Google Pay, PhonePe, Paytm</span>
                                </div>
                            </div>
                        </label>
                        
                        <label class="payment-option">
                            <input type="radio" name="paymentMethod" value="card">
                            <div class="option-content">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" stroke-width="2"/>
                                    <path d="M2 10h20" stroke="currentColor" stroke-width="2"/>
                                </svg>
                                <div>
                                    <strong>Card</strong>
                                    <span>Credit / Debit Card</span>
                                </div>
                            </div>
                        </label>
                        
                        <label class="payment-option">
                            <input type="radio" name="paymentMethod" value="netbanking">
                            <div class="option-content">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" stroke-width="2"/>
                                    <path d="M9 22V12h6v10" stroke="currentColor" stroke-width="2"/>
                                </svg>
                                <div>
                                    <strong>Net Banking</strong>
                                    <span>All major banks</span>
                                </div>
                            </div>
                        </label>
                        
                        <label class="payment-option">
                            <input type="radio" name="paymentMethod" value="wallet">
                            <div class="option-content">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <rect x="3" y="6" width="18" height="14" rx="2" stroke="currentColor" stroke-width="2"/>
                                    <path d="M3 10h18" stroke="currentColor" stroke-width="2"/>
                                </svg>
                                <div>
                                    <strong>Wallet</strong>
                                    <span>Paytm, Mobikwik</span>
                                </div>
                            </div>
                        </label>
                    </div>
                </div>
                
                <div class="payment-actions">
                    <button type="button" class="btn-secondary" id="backToOrderBtn">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M12 4l-8 6 8 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        Back to Order
                    </button>
                    <button type="button" class="btn-primary" id="proceedPaymentBtn">
                        <span>Pay ₹${advanceAmount}</span>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M4 10h12m0 0l-4-4m4 4l-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing payment modal if any
    const existingModal = document.getElementById('paymentModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add to DOM
    document.body.insertAdjacentHTML('beforeend', paymentModalHTML);
    
    // Add event listeners
    setupPaymentModalListeners(advanceAmount, estimatedTotal);
}

function setupPaymentModalListeners(advanceAmount, totalAmount) {
    const paymentModal = document.getElementById('paymentModal');
    const closeBtn = document.getElementById('closePaymentModal');
    const backBtn = document.getElementById('backToOrderBtn');
    const proceedBtn = document.getElementById('proceedPaymentBtn');
    
    closeBtn.addEventListener('click', () => {
        closePaymentModal();
    });
    
    backBtn.addEventListener('click', () => {
        closePaymentModal();
        setTimeout(() => {
            orderModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }, 300);
    });
    
    proceedBtn.addEventListener('click', () => {
        processPayment(advanceAmount, totalAmount);
    });
    
    paymentModal.addEventListener('click', (e) => {
        if (e.target === paymentModal) {
            closePaymentModal();
        }
    });
}

function closePaymentModal() {
    const paymentModal = document.getElementById('paymentModal');
    if (paymentModal) {
        paymentModal.classList.remove('active');
        setTimeout(() => {
            paymentModal.remove();
            document.body.style.overflow = '';
        }, 300);
    }
}

// ============================================
// PAYMENT PROCESSING
// ============================================

async function processPayment(advanceAmount, totalAmount) {
    const proceedBtn = document.getElementById('proceedPaymentBtn');
    const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    
    // Show loading
    const originalText = proceedBtn.innerHTML;
    proceedBtn.innerHTML = '<span>Processing Payment...</span>';
    proceedBtn.disabled = true;
    
    try {
        // Simulate payment processing (2 seconds)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Mock payment success
        const paymentData = {
            orderId: 'ORD' + Date.now(),
            transactionId: 'TXN' + Date.now(),
            amount: advanceAmount,
            method: selectedMethod,
            status: 'success',
            timestamp: new Date().toISOString()
        };
        
        // Save order with payment info
        await saveOrder(paymentData, totalAmount);
        
        // Close payment modal
        closePaymentModal();
        
        // Show success
        showSuccessToast(`Payment successful! Order ID: #${paymentData.orderId}`);
        
        // Reset order form
        orderForm.reset();
        
        // Show confirmation page (optional)
        setTimeout(() => {
            showOrderConfirmation(paymentData, totalAmount);
        }, 1000);
        
    } catch (error) {
        console.error('Payment error:', error);
        showErrorToast('Payment failed. Please try again.');
        proceedBtn.innerHTML = originalText;
        proceedBtn.disabled = false;
    }
}

async function saveOrder(paymentData, totalAmount) {
    const orderPayload = {
        ...currentOrderData,
        orderId: paymentData.orderId,
        transactionId: paymentData.transactionId,
        advanceAmount: paymentData.amount,
        totalAmount: totalAmount,
        paymentMethod: paymentData.method,
        paymentStatus: 'advance_paid',
        orderStatus: 'confirmed',
        timestamp: paymentData.timestamp
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/dry-clean/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
            },
            body: JSON.stringify(orderPayload)
        });
        
        const result = await response.json();
        console.log('Order saved:', result);
        
        // Save to localStorage as backup
        const savedOrders = JSON.parse(localStorage.getItem('dryclean_orders') || '[]');
        savedOrders.push(orderPayload);
        localStorage.setItem('dryclean_orders', JSON.stringify(savedOrders));
        
    } catch (error) {
        console.error('Error saving order:', error);
        // Save to localStorage anyway
        const savedOrders = JSON.parse(localStorage.getItem('dryclean_orders') || '[]');
        savedOrders.push(orderPayload);
        localStorage.setItem('dryclean_orders', JSON.stringify(savedOrders));
    }
}

function showOrderConfirmation(paymentData, totalAmount) {
    const confirmationHTML = `
        <div class="modal active" id="confirmationModal">
            <div class="modal-content confirmation-modal">
                <div class="confirmation-header">
                    <div class="success-animation">
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="#10b981" stroke-width="2"/>
                            <path d="M8 12l2 2 4-4" stroke="#10b981" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </div>
                    <h2>Booking Confirmed!</h2>
                    <p>Your order has been placed successfully</p>
                </div>
                
                <div class="confirmation-details">
                    <div class="detail-row">
                        <span>Order ID:</span>
                        <strong>#${paymentData.orderId}</strong>
                    </div>
                    <div class="detail-row">
                        <span>Transaction ID:</span>
                        <strong>${paymentData.transactionId}</strong>
                    </div>
                    <div class="detail-row">
                        <span>Amount Paid:</span>
                        <strong>₹${paymentData.amount}</strong>
                    </div>
                    <div class="detail-row">
                        <span>Remaining Amount:</span>
                        <strong>₹${totalAmount - paymentData.amount}</strong>
                    </div>
                </div>
                
                <div class="confirmation-note">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                        <path d="M12 16v-4M12 8h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    <p>You will receive a confirmation email shortly. Our team will contact you before pickup.</p>
                </div>
                
                <button class="btn-primary btn-full" id="closeConfirmationBtn">
                    <span>Done</span>
                </button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', confirmationHTML);
    
    document.getElementById('closeConfirmationBtn').addEventListener('click', () => {
        const modal = document.getElementById('confirmationModal');
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    });
}

// ============================================
// FORM VALIDATION
// ============================================

function validateForm(data) {
    if (data.name.length < 3) {
        showErrorToast('Name must be at least 3 characters');
        return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        showErrorToast('Please enter a valid email address');
        return false;
    }
    
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(data.phone)) {
        showErrorToast('Phone number must be 10 digits');
        return false;
    }
    
    if (data.address.length < 10) {
        showErrorToast('Please enter complete address');
        return false;
    }
    
    if (!data.service) {
        showErrorToast('Please select a service');
        return false;
    }
    
    if (data.items.length < 5) {
        showErrorToast('Please describe items to be cleaned');
        return false;
    }
    
    const selectedDate = new Date(data.pickupDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
        showErrorToast('Please select a future date');
        return false;
    }
    
    if (!data.pickupTime) {
        showErrorToast('Please select pickup time');
        return false;
    }
    
    return true;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
    });
}

function showSuccessToast(message) {
    const toast = document.getElementById('successToast');
    const messageEl = document.getElementById('toastMessage');
    
    messageEl.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

function showErrorToast(message) {
    const toast = document.getElementById('errorToast');
    const messageEl = document.getElementById('errorMessage');
    
    messageEl.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// ============================================
// PHONE NUMBER FORMATTING
// ============================================

const phoneInput = document.getElementById('orderPhone');
phoneInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
});

// ============================================
// AUTO-FILL FOR LOGGED-IN USERS
// ============================================

window.addEventListener('DOMContentLoaded', () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const currentUser = localStorage.getItem('currentUser');
    
    if (isLoggedIn && currentUser) {
        try {
            const userData = JSON.parse(currentUser);
            
            orderButtons.forEach(button => {
                button.addEventListener('click', () => {
                    if (userData.full_name) {
                        document.getElementById('orderName').value = userData.full_name;
                    }
                    if (userData.email) {
                        document.getElementById('orderEmail').value = userData.email;
                    }
                    if (userData.phone) {
                        document.getElementById('orderPhone').value = userData.phone;
                    }
                });
            });
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
});

// ============================================
// SERVICE CARD INTERACTIONS
// ============================================

document.querySelectorAll('.service-card').forEach(card => {
    const serviceBtn = card.querySelector('.service-button');
    const serviceType = card.getAttribute('data-service');
    
    serviceBtn.addEventListener('click', () => {
        document.getElementById('orderService').value = serviceType;
    });
});

// ============================================
// SCROLL ANIMATIONS
// ============================================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.service-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});

console.log('🧺 Dry Clean Service with Payment Module Initialized');
console.log('💳 Payment Gateway Ready (Mock Mode)');
console.log('✅ All features loaded successfully!');