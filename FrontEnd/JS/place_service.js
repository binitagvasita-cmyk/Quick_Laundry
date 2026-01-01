// ============================================
// PLACE SERVICE PAGE - DYNAMIC ORDER SYSTEM
// Quick Laundry Application
// ============================================

const API_BASE_URL = 'http://localhost:3000/api';

// State Management
const appState = {
  allItems: [],
  filteredItems: [],
  categories: [],
  cart: [],
  currentServiceType: 'all',
  currentCategory: 'all',
  searchQuery: '',
  isLoading: true
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('Place Service Page Initialized');
  
  // Load theme from localStorage
  loadTheme();
  
  // Initialize page
  initializePage();
  
  // Setup event listeners
  setupEventListeners();
  
  // Load cart from localStorage
  loadCartFromStorage();
});

// ============================================
// THEME MANAGEMENT
// ============================================

function loadTheme() {
  const savedTheme = localStorage.getItem('app-theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  // Sync with global theme if available
  if (window.appTheme) {
    window.appTheme.set(savedTheme);
  }
}

// Listen for theme changes
window.addEventListener('storage', (e) => {
  if (e.key === 'app-theme') {
    document.documentElement.setAttribute('data-theme', e.newValue);
  }
});

// ============================================
// PAGE INITIALIZATION
// ============================================

async function initializePage() {
  try {
    showLoading(true);
    
    // Fetch categories and items from API
    await Promise.all([
      fetchCategories(),
      fetchAllItems()
    ]);
    
    // Render categories
    renderCategories();
    
    // Render items
    renderItems();
    
    showLoading(false);
    
  } catch (error) {
    console.error('Error initializing page:', error);
    showError('Failed to load services. Please refresh the page.');
    showLoading(false);
  }
}

// ============================================
// API CALLS
// ============================================

async function fetchCategories() {
  try {
    const token = localStorage.getItem('access_token');
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/pricing/categories`, {
      method: 'GET',
      headers: headers
    });
    
    const data = await response.json();
    
    if (data.success && data.categories) {
      appState.categories = data.categories;
      console.log('Categories loaded:', data.categories.length);
    } else {
      throw new Error('Failed to fetch categories');
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

async function fetchAllItems() {
  try {
    const token = localStorage.getItem('access_token');
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/pricing/items`, {
      method: 'GET',
      headers: headers
    });
    
    const data = await response.json();
    
    if (data.success && data.items) {
      appState.allItems = data.items;
      appState.filteredItems = data.items;
      console.log('Items loaded:', data.items.length);
    } else {
      throw new Error('Failed to fetch items');
    }
  } catch (error) {
    console.error('Error fetching items:', error);
    throw error;
  }
}

async function searchItems(query) {
  try {
    if (!query || query.length < 2) {
      appState.filteredItems = appState.allItems;
      applyFilters();
      return;
    }
    
    const token = localStorage.getItem('access_token');
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/pricing/search?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: headers
    });
    
    const data = await response.json();
    
    if (data.success && data.items) {
      appState.filteredItems = data.items;
      renderItems();
    }
  } catch (error) {
    console.error('Error searching items:', error);
  }
}

// ============================================
// RENDERING FUNCTIONS
// ============================================

function renderCategories() {
  const categoryChips = document.getElementById('categoryChips');
  
  if (!categoryChips) return;
  
  // Keep "All Categories" button and add dynamic categories
  const dynamicChips = appState.categories.map(category => `
    <button class="category-chip" data-category="${category.id}">
      ${category.category_name}
    </button>
  `).join('');
  
  categoryChips.innerHTML = `
    <button class="category-chip active" data-category="all">
      All Categories
    </button>
    ${dynamicChips}
  `;
}

function renderItems() {
  const itemsGrid = document.getElementById('itemsGrid');
  const loadingState = document.getElementById('loadingState');
  const emptyState = document.getElementById('emptyState');
  
  if (!itemsGrid) return;
  
  // Hide loading and empty states
  loadingState.style.display = 'none';
  emptyState.style.display = 'none';
  
  // Apply filters
  const items = getFilteredItems();
  
  if (items.length === 0) {
    emptyState.style.display = 'flex';
    return;
  }
  
  // Render item cards
  const itemCards = items.map(item => createItemCard(item)).join('');
  itemsGrid.innerHTML = itemCards;
}

function createItemCard(item) {
  const cartItem = appState.cart.find(ci => ci.id === item.id);
  const quantity = cartItem ? cartItem.quantity : 0;
  const isInCart = quantity > 0;
  
  const popularBadge = item.is_popular ? '<div class="popular-badge">Popular</div>' : '';
  const serviceTypeLabel = formatServiceType(item.service_type);
  const icon = getCategoryIcon(item.category_name);
  
  // Determine button state and content
  const addedClass = isInCart ? 'added' : '';
  const buttonText = isInCart ? 'Added to Cart' : 'Add to Cart';
  const checkmarkSVG = `
    <svg class="checkmark" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M13.3333 4L6 11.3333L2.66666 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  
  return `
    <div class="item-card" data-item-id="${item.id}">
      ${popularBadge}
      <div class="item-card-header">
        <div class="item-icon">${icon}</div>
      </div>
      <div class="item-info">
        <h3 class="item-name">${item.item_name}</h3>
        <p class="item-category">${item.category_name}</p>
        <span class="item-service-type">${serviceTypeLabel}</span>
      </div>
      <div class="item-price-section">
        <div class="item-price">₹${item.price}</div>
        <div class="item-actions">
          ${isInCart ? `
            <div class="quantity-control">
              <button class="quantity-btn" onclick="decreaseQuantity(${item.id})">-</button>
              <span class="quantity-display">${quantity}</span>
              <button class="quantity-btn" onclick="increaseQuantity(${item.id})">+</button>
            </div>
          ` : `
            <button class="add-to-cart-btn ${addedClass}" onclick="addToCart(${item.id})">
              ${isInCart ? checkmarkSVG : ''}
              ${buttonText}
            </button>
          `}
        </div>
      </div>
    </div>
  `;
}

// ============================================
// FILTERING & SEARCH
// ============================================

function getFilteredItems() {
  let items = [...appState.filteredItems];
  
  // Filter by service type
  if (appState.currentServiceType !== 'all') {
    items = items.filter(item => item.service_type === appState.currentServiceType);
  }
  
  // Filter by category
  if (appState.currentCategory !== 'all') {
    items = items.filter(item => item.category_id === parseInt(appState.currentCategory));
  }
  
  return items;
}

function applyFilters() {
  renderItems();
}

// ============================================
// CART MANAGEMENT
// ============================================

function addToCart(itemId) {
  const item = appState.allItems.find(i => i.id === itemId);
  
  if (!item) {
    console.error('Item not found:', itemId);
    return;
  }
  
  const existingItem = appState.cart.find(ci => ci.id === itemId);
  
  if (existingItem) {
    existingItem.quantity++;
  } else {
    appState.cart.push({
      id: item.id,
      name: item.item_name,
      price: parseFloat(item.price),
      service_type: item.service_type,
      category_name: item.category_name,
      quantity: 1
    });
  }
  
  saveCartToStorage();
  updateCartUI();
  renderItems(); // Re-render to update button states
  showNotification('Added to cart! ✓', 'success');
}

function increaseQuantity(itemId) {
  const cartItem = appState.cart.find(ci => ci.id === itemId);
  
  if (cartItem) {
    cartItem.quantity++;
    saveCartToStorage();
    updateCartUI();
    renderItems();
  }
}

function decreaseQuantity(itemId) {
  const cartItem = appState.cart.find(ci => ci.id === itemId);
  
  if (cartItem) {
    if (cartItem.quantity > 1) {
      cartItem.quantity--;
    } else {
      removeFromCart(itemId);
      return;
    }
    saveCartToStorage();
    updateCartUI();
    renderItems();
  }
}

function removeFromCart(itemId) {
  appState.cart = appState.cart.filter(ci => ci.id !== itemId);
  saveCartToStorage();
  updateCartUI();
  renderItems();
  showNotification('Removed from cart', 'info');
}

function clearCart() {
  appState.cart = [];
  saveCartToStorage();
  updateCartUI();
  renderItems();
}

function updateCartUI() {
  updateCartBadges();
  renderCartItems();
  updateCartSummary();
}

function updateCartBadges() {
  const totalItems = appState.cart.reduce((sum, item) => sum + item.quantity, 0);
  
  const cartCount = document.getElementById('cartCount');
  const floatingCartCount = document.getElementById('floatingCartCount');
  
  if (cartCount) cartCount.textContent = totalItems;
  if (floatingCartCount) floatingCartCount.textContent = totalItems;
}

function renderCartItems() {
  const cartItems = document.getElementById('cartItems');
  const cartEmpty = document.getElementById('cartEmpty');
  const cartFooter = document.getElementById('cartFooter');
  
  if (!cartItems || !cartEmpty || !cartFooter) return;
  
  if (appState.cart.length === 0) {
    cartItems.style.display = 'none';
    cartEmpty.style.display = 'flex';
    cartFooter.style.display = 'none';
  } else {
    cartItems.style.display = 'block';
    cartEmpty.style.display = 'none';
    cartFooter.style.display = 'block';
    
    const cartItemsHTML = appState.cart.map(item => {
      const icon = getCategoryIcon(item.category_name);
      const serviceTypeLabel = formatServiceType(item.service_type);
      
      return `
        <div class="cart-item">
          <div class="cart-item-icon">${icon}</div>
          <div class="cart-item-details">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-service">${serviceTypeLabel}</div>
            <div class="cart-item-controls">
              <div class="cart-item-quantity">
                <button class="cart-qty-btn" onclick="decreaseQuantity(${item.id})">-</button>
                <span class="cart-qty-display">${item.quantity}</span>
                <button class="cart-qty-btn" onclick="increaseQuantity(${item.id})">+</button>
              </div>
              <div class="cart-item-price">₹${(item.price * item.quantity).toFixed(2)}</div>
            </div>
          </div>
          <button class="cart-item-remove" onclick="removeFromCart(${item.id})">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      `;
    }).join('');
    
    cartItems.innerHTML = cartItemsHTML;
  }
}

function updateCartSummary() {
  const subtotal = appState.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.05; // 5% tax
  const total = subtotal + tax;
  
  const subtotalAmount = document.getElementById('subtotalAmount');
  const taxAmount = document.getElementById('taxAmount');
  const totalAmount = document.getElementById('totalAmount');
  
  if (subtotalAmount) subtotalAmount.textContent = `₹${subtotal.toFixed(2)}`;
  if (taxAmount) taxAmount.textContent = `₹${tax.toFixed(2)}`;
  if (totalAmount) totalAmount.textContent = `₹${total.toFixed(2)}`;
}

// ============================================
// CART STORAGE
// ============================================

function saveCartToStorage() {
  try {
    localStorage.setItem('laundry_cart', JSON.stringify(appState.cart));
  } catch (error) {
    console.error('Error saving cart to storage:', error);
  }
}

function loadCartFromStorage() {
  try {
    const savedCart = localStorage.getItem('laundry_cart');
    if (savedCart) {
      appState.cart = JSON.parse(savedCart);
      updateCartUI();
    }
  } catch (error) {
    console.error('Error loading cart from storage:', error);
    appState.cart = [];
  }
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
  // Service type tabs
  const serviceTypeTabs = document.getElementById('serviceTypeTabs');
  if (serviceTypeTabs) {
    serviceTypeTabs.addEventListener('click', (e) => {
      if (e.target.classList.contains('service-tab')) {
        const serviceType = e.target.dataset.service;
        
        // Update active state
        serviceTypeTabs.querySelectorAll('.service-tab').forEach(tab => {
          tab.classList.remove('active');
        });
        e.target.classList.add('active');
        
        // Update filter
        appState.currentServiceType = serviceType;
        applyFilters();
      }
    });
  }
  
  // Category chips
  const categoryChips = document.getElementById('categoryChips');
  if (categoryChips) {
    categoryChips.addEventListener('click', (e) => {
      if (e.target.classList.contains('category-chip')) {
        const category = e.target.dataset.category;
        
        // Update active state
        categoryChips.querySelectorAll('.category-chip').forEach(chip => {
          chip.classList.remove('active');
        });
        e.target.classList.add('active');
        
        // Update filter
        appState.currentCategory = category;
        applyFilters();
      }
    });
  }
  
  // Search input
  const searchInput = document.getElementById('searchInput');
  const searchClear = document.getElementById('searchClear');
  
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      appState.searchQuery = query;
      
      if (searchClear) {
        searchClear.style.display = query ? 'flex' : 'none';
      }
      
      // Debounced search
      clearTimeout(window.searchTimeout);
      window.searchTimeout = setTimeout(() => {
        searchItems(query);
      }, 300);
    });
  }
  
  if (searchClear) {
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      searchClear.style.display = 'none';
      appState.searchQuery = '';
      appState.filteredItems = appState.allItems;
      applyFilters();
    });
  }
  
  // Cart sidebar toggle
  const cartBadge = document.getElementById('cartBadge');
  const floatingCartBtn = document.getElementById('floatingCartBtn');
  const cartSidebar = document.getElementById('cartSidebar');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartCloseBtn = document.getElementById('cartCloseBtn');
  
  if (cartBadge) {
    cartBadge.addEventListener('click', () => openCart());
  }
  
  if (floatingCartBtn) {
    floatingCartBtn.addEventListener('click', () => openCart());
  }
  
  if (cartCloseBtn) {
    cartCloseBtn.addEventListener('click', () => closeCart());
  }
  
  if (cartOverlay) {
    cartOverlay.addEventListener('click', () => closeCart());
  }
  
  // Place order button
  const placeOrderBtn = document.getElementById('placeOrderBtn');
  if (placeOrderBtn) {
    placeOrderBtn.addEventListener('click', () => placeOrder());
  }
}

// ============================================
// CART SIDEBAR CONTROLS
// ============================================

function openCart() {
  const cartSidebar = document.getElementById('cartSidebar');
  const cartOverlay = document.getElementById('cartOverlay');
  
  if (cartSidebar && cartOverlay) {
    cartSidebar.classList.add('active');
    cartOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeCart() {
  const cartSidebar = document.getElementById('cartSidebar');
  const cartOverlay = document.getElementById('cartOverlay');
  
  if (cartSidebar && cartOverlay) {
    cartSidebar.classList.remove('active');
    cartOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// ============================================
// ORDER PLACEMENT
// ============================================

async function placeOrder() {
  // Check if user is logged in
  const token = localStorage.getItem('access_token');
  
  if (!token) {
    showNotification('Please login to place an order', 'error');
    // Optionally open login modal
    if (window.authManager) {
      window.authManager.openAuthModal('login');
    }
    return;
  }
  
  if (appState.cart.length === 0) {
    showNotification('Your cart is empty!', 'error');
    return;
  }
  
  // Calculate order totals
  const subtotal = appState.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;
  
  // Prepare order data
  const orderData = {
    items: appState.cart.map(item => ({
      item_id: item.id,
      item_name: item.name,
      quantity: item.quantity,
      price: item.price,
      service_type: item.service_type
    })),
    subtotal: subtotal.toFixed(2),
    tax: tax.toFixed(2),
    total: total.toFixed(2),
    order_date: new Date().toISOString()
  };
  
  console.log('Order data:', orderData);
  
  // TODO: Send order to backend API
  // For now, just show success message
  showNotification('Order placed successfully! 🎉', 'success');
  
  // Clear cart
  clearCart();
  closeCart();
  
  // Optionally redirect to orders page
  setTimeout(() => {
    // window.location.href = 'orders.html';
  }, 2000);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatServiceType(serviceType) {
  const types = {
    'iron': 'Iron',
    'wash_iron': 'Wash & Iron',
    'roll_press': 'Roll Press',
    'dry_clean': 'Dry Clean',
    'premium_wash': 'Premium Wash',
    'steam_iron': 'Steam Iron'
  };
  return types[serviceType] || serviceType;
}

function getCategoryIcon(categoryName) {
  const icons = {
    'Shirts': '👔',
    'Pants': '👖',
    'Dresses': '👗',
    'Suits': '🤵',
    'Traditional Wear': '🥻',
    'Kids Wear': '👶',
    'Bed Linen': '🛏️',
    'Accessories': '🧤',
    'default': '👕'
  };
  return icons[categoryName] || icons['default'];
}

function showLoading(show) {
  const loadingState = document.getElementById('loadingState');
  if (loadingState) {
    loadingState.style.display = show ? 'flex' : 'none';
  }
  appState.isLoading = show;
}

function showError(message) {
  showNotification(message, 'error');
}

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
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    animation: slideInRight 0.3s ease;
    font-weight: 600;
  `;
  
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
  setTimeout(() => {
    notification.style.animation = 'slideInRight 0.3s ease reverse';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ============================================
// EXPOSE GLOBAL FUNCTIONS
// ============================================

window.addToCart = addToCart;
window.increaseQuantity = increaseQuantity;
window.decreaseQuantity = decreaseQuantity;
window.removeFromCart = removeFromCart;
