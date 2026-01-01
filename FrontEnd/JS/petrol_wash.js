// Petrol Wash Service Manager
class PetrolWashService {
  constructor() {
    this.API_URL = (() => {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3000/api';
  } else {
    // Point to your Render backend
    return 'https://quick-laundry-backend.onrender.com/api';
  }
})();
  }

  init() {
    this.loadServices();
    this.setupEventListeners();
    this.updateCartUI();
    this.setupAuthListener();
  }

  // Authentication
  checkAuth() {
    try {
      const token = localStorage.getItem('access_token');
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      return !!(token && isLoggedIn);
    } catch (e) {
      return false;
    }
  }

  getCurrentUser() {
    try {
      const userData = localStorage.getItem('currentUser');
      return userData ? JSON.parse(userData) : null;
    } catch (e) {
      return null;
    }
  }

  setupAuthListener() {
    window.addEventListener('userLoggedIn', (e) => {
      this.isLoggedIn = true;
      this.currentUser = e.detail.user;
    });

    window.addEventListener('userLoggedOut', () => {
      this.isLoggedIn = false;
      this.currentUser = null;
      this.cart = [];
      this.saveCart();
      this.updateCartUI();
    });
  }

  // Services Data
  getServicesData() {
    return [
      {
        id: 1,
        name: "Petrol Wash Premium",
        description: "Deep cleaning with petroleum-based solvents for tough stains and oil marks",
        price: 299,
        duration: "2-3 days",
        image: "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400&h=300&fit=crop",
        features: ["Tough stain removal", "Odor elimination", "Fabric protection", "Express delivery"]
      },
      {
        id: 2,
        name: "Dry Clean Special",
        description: "Professional dry cleaning for delicate garments and formal wear",
        price: 199,
        duration: "1-2 days",
        image: "https://images.unsplash.com/photo-1567449303183-3e6d4b6c670e?w=400&h=300&fit=crop",
        features: ["Gentle cleaning", "Press & fold", "Quality guarantee", "Same-day available"]
      },
      {
        id: 3,
        name: "Steam Iron Service",
        description: "Professional ironing with advanced steam technology for crisp finish",
        price: 99,
        duration: "Same day",
        image: "https://images.unsplash.com/photo-1556291820-7a52b6d6b3de?w=400&h=300&fit=crop",
        features: ["Wrinkle-free", "Crisp finish", "Quick service", "Home delivery"]
      },
      {
        id: 4,
        name: "Leather & Suede Care",
        description: "Specialized cleaning and conditioning for leather and suede items",
        price: 499,
        duration: "3-4 days",
        image: "https://images.unsplash.com/photo-1490367532698-7ff79d609cef?w=400&h=300&fit=crop",
        features: ["Expert care", "Color restoration", "Conditioning", "Waterproofing"]
      },
      {
        id: 5,
        name: "Wedding Dress Care",
        description: "Premium cleaning and preservation for wedding attire and special occasion wear",
        price: 799,
        duration: "4-5 days",
        image: "https://images.unsplash.com/photo-1591799265444-d66432b91588?w=400&h=300&fit=crop",
        features: ["Delicate handling", "Stain treatment", "Preservation packaging", "Expert care"]
      },
      {
        id: 6,
        name: "Curtain & Upholstery",
        description: "Deep cleaning for curtains, sofas, and upholstery items",
        price: 399,
        duration: "3-4 days",
        image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop",
        features: ["Deep cleaning", "Dust removal", "Fabric care", "Home pickup"]
      }
    ];
  }

  // Load and Display Services
  loadServices() {
    this.services = this.getServicesData();
    this.displayServices();
  }

  displayServices() {
    const grid = document.getElementById('servicesGrid');
    if (!grid) return;

    grid.innerHTML = this.services.map(service => `
      <div class="service-card" data-id="${service.id}">
        <img src="${service.image}" alt="${service.name}" class="service-image">
        <div class="service-content">
          <div class="service-header">
            <h3 class="service-name">${service.name}</h3>
            <div class="service-price">₹${service.price}</div>
          </div>
          <p class="service-description">${service.description}</p>
          <div class="service-duration">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
              <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span>${service.duration}</span>
          </div>
          <div class="service-features">
            ${service.features.map(f => `
              <div class="service-feature">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <span>${f}</span>
              </div>
            `).join('')}
          </div>
          <div class="service-actions">
            <button class="btn-add-cart" data-id="${service.id}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M9 2L7 6M17 2L19 6M3 6H21M19 6L20 20H4L5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              Add to Cart
            </button>
            <button class="btn-order-now" data-id="${service.id}">Order Now</button>
          </div>
        </div>
      </div>
    `).join('');

    this.setupServiceListeners();
  }

  setupServiceListeners() {
    document.querySelectorAll('.btn-add-cart').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        this.addToCart(id);
      });
    });

    document.querySelectorAll('.btn-order-now').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        this.addToCart(id);
        this.openCart();
      });
    });
  }

  // Cart Management
  loadCart() {
    try {
      const saved = localStorage.getItem('petrol_wash_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  saveCart() {
    try {
      localStorage.setItem('petrol_wash_cart', JSON.stringify(this.cart));
    } catch (e) {
      console.error('Failed to save cart:', e);
    }
  }

  addToCart(serviceId) {
    const service = this.services.find(s => s.id === serviceId);
    if (!service) return;

    const existing = this.cart.find(item => item.id === serviceId);
    if (existing) {
      existing.quantity++;
    } else {
      this.cart.push({ ...service, quantity: 1 });
    }

    this.saveCart();
    this.updateCartUI();
    this.showNotification(`${service.name} added to cart!`, 'success');
  }

  removeFromCart(serviceId) {
    this.cart = this.cart.filter(item => item.id !== serviceId);
    this.saveCart();
    this.updateCartUI();
    this.showNotification('Item removed from cart', 'info');
  }

  updateQuantity(serviceId, change) {
    const item = this.cart.find(i => i.id === serviceId);
    if (!item) return;

    item.quantity += change;
    if (item.quantity <= 0) {
      this.removeFromCart(serviceId);
    } else {
      this.saveCart();
      this.updateCartUI();
    }
  }

  getCartTotal() {
    return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  updateCartUI() {
    const count = document.getElementById('cartCount');
    const items = document.getElementById('cartItems');
    const total = document.getElementById('cartTotal');

    const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
    if (count) count.textContent = totalItems;

    if (items) {
      if (this.cart.length === 0) {
        items.innerHTML = '<div class="cart-empty">Your cart is empty</div>';
      } else {
        items.innerHTML = this.cart.map(item => `
          <div class="cart-item">
            <img src="${item.image}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-details">
              <div class="cart-item-name">${item.name}</div>
              <div class="cart-item-price">₹${item.price}</div>
              <div class="cart-item-quantity">
                <button class="qty-btn" data-id="${item.id}" data-action="decrease">-</button>
                <span class="qty-value">${item.quantity}</span>
                <button class="qty-btn" data-id="${item.id}" data-action="increase">+</button>
              </div>
            </div>
            <button class="cart-item-remove" data-id="${item.id}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2"/>
              </svg>
            </button>
          </div>
        `).join('');

        this.setupCartItemListeners();
      }
    }

    if (total) {
      total.textContent = `₹${this.getCartTotal()}`;
    }
  }

  setupCartItemListeners() {
    document.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        const action = e.currentTarget.dataset.action;
        this.updateQuantity(id, action === 'increase' ? 1 : -1);
      });
    });

    document.querySelectorAll('.cart-item-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        this.removeFromCart(id);
      });
    });
  }

  // Modal Management
  openCart() {
    const modal = document.getElementById('cartModal');
    if (modal) {
      modal.classList.add('active');
      this.updateCartUI();
    }
  }

  closeCart() {
    const modal = document.getElementById('cartModal');
    if (modal) modal.classList.remove('active');
  }

  openOrderForm() {
    if (!this.isLoggedIn) {
      this.showNotification('Please login to place an order', 'error');
      if (window.authManager) {
        window.authManager.openAuthModal('login');
      }
      return;
    }

    if (this.cart.length === 0) {
      this.showNotification('Your cart is empty', 'error');
      return;
    }

    this.closeCart();
    const modal = document.getElementById('orderModal');
    if (modal) {
      modal.classList.add('active');
      this.populateOrderForm();
    }
  }

  closeOrderForm() {
    const modal = document.getElementById('orderModal');
    if (modal) modal.classList.remove('active');
  }

  populateOrderForm() {
    const summary = document.getElementById('orderSummary');
    const total = document.getElementById('orderTotal');

    if (summary) {
      summary.innerHTML = this.cart.map(item => `
        <div class="order-summary-item">
          <span>${item.name} x ${item.quantity}</span>
          <strong>₹${item.price * item.quantity}</strong>
        </div>
      `).join('');
    }

    if (total) {
      total.textContent = `₹${this.getCartTotal()}`;
    }

    // Pre-fill user data if available
    const form = document.getElementById('orderForm');
    if (form && this.currentUser) {
      form.elements.fullName.value = this.currentUser.full_name || this.currentUser.username || '';
      form.elements.email.value = this.currentUser.email || '';
      form.elements.phone.value = this.currentUser.phone || '';
    }

    // Set minimum date to today
    const dateInput = form.elements.pickupDate;
    if (dateInput) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.min = today;
      dateInput.value = today;
    }
  }

  // Order Submission
  async submitOrder(formData) {
    try {
      const orderData = {
        user_id: this.currentUser?.id || null,
        customer_name: formData.fullName,
        customer_email: formData.email,
        customer_phone: formData.phone,
        pickup_address: formData.address,
        pickup_date: formData.pickupDate,
        pickup_time: formData.pickupTime,
        special_instructions: formData.instructions,
        items: this.cart.map(item => ({
          service_id: item.id,
          service_name: item.name,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity
        })),
        total_amount: this.getCartTotal(),
        status: 'pending'
      };

      const token = localStorage.getItem('access_token');
      const response = await fetch(`${this.API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        throw new Error('Failed to place order');
      }

      const result = await response.json();
      
      // Clear cart
      this.cart = [];
      this.saveCart();
      this.updateCartUI();
      this.closeOrderForm();

      this.showNotification('Order placed successfully! We will contact you soon.', 'success');
      
      // Optionally redirect to orders page
      setTimeout(() => {
        window.location.href = 'my_orders.html';
      }, 2000);

      return result;
    } catch (error) {
      console.error('Order submission error:', error);
      this.showNotification('Failed to place order. Please try again.', 'error');
      throw error;
    }
  }

  // Event Listeners
  setupEventListeners() {
    // Cart button
    const cartBtn = document.getElementById('cartButton');
    if (cartBtn) {
      cartBtn.addEventListener('click', () => this.openCart());
    }

    // Cart close
    const cartClose = document.getElementById('cartClose');
    if (cartClose) {
      cartClose.addEventListener('click', () => this.closeCart());
    }

    // Checkout button
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => this.openOrderForm());
    }

    // Order close
    const orderClose = document.getElementById('orderClose');
    if (orderClose) {
      orderClose.addEventListener('click', () => this.closeOrderForm());
    }

    // Order form submit
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
      orderForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
          fullName: orderForm.elements.fullName.value,
          phone: orderForm.elements.phone.value,
          email: orderForm.elements.email.value,
          address: orderForm.elements.address.value,
          pickupDate: orderForm.elements.pickupDate.value,
          pickupTime: orderForm.elements.pickupTime.value,
          instructions: orderForm.elements.instructions.value
        };

        await this.submitOrder(formData);
      });
    }

    // Close modals on outside click
    document.getElementById('cartModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'cartModal') this.closeCart();
    });

    document.getElementById('orderModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'orderModal') this.closeOrderForm();
    });
  }

  // Notifications
  showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) return;

    notification.textContent = message;
    notification.className = `notification ${type} show`;

    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  window.petrolWashService = new PetrolWashService();
  console.log('Petrol Wash Service initialized');
});