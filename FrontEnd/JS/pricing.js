// ============================================
// QUICK LAUNDRY PRICING PAGE SCRIPT
// Enhanced with Image Support, Service Categories, and Move Items Feature
// ============================================

// API Configuration
const API_BASE_URL = 'http://localhost:3000/api/pricing';

// ============================================
// PRICING MANAGER CLASS
// ============================================
class PricingManager {
    constructor() {
        this.allItems = [];
        this.filteredItems = [];
        this.currentServiceFilter = 'all';
        this.currentGenderFilter = 'all';
        this.searchTerm = '';
        this.selectedItem = null;
        this.init();
    }

    init() {
        console.log('Initializing Enhanced Pricing Manager...');
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupEventListeners();
                this.loadPricingData();
            });
        } else {
            this.setupEventListeners();
            this.loadPricingData();
        }
    }

    // ============================================
    // API CALLS
    // ============================================
    async loadPricingData() {
        try {
            this.showLoading(true);

            const [categoriesResponse, itemsResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/categories`),
                fetch(`${API_BASE_URL}/items`)
            ]);

            if (!categoriesResponse.ok || !itemsResponse.ok) {
                throw new Error('Failed to fetch pricing data');
            }

            const categoriesData = await categoriesResponse.json();
            const itemsData = await itemsResponse.json();

            console.log('Categories:', categoriesData);
            console.log('All Items:', itemsData);

            this.allItems = itemsData.items || [];
            this.filteredItems = [...this.allItems];

            this.displayServiceCategories();
            this.applyFilters();

            this.showLoading(false);

        } catch (error) {
            console.error('Error loading pricing data:', error);
            this.showLoading(false);
            this.showNotification('Failed to load pricing data. Please try again.', 'error');
        }
    }

    // ============================================
    // MOVE ITEM TO DIFFERENT SERVICE
    // ============================================
    async moveItemToService(itemId, newService) {
        try {
            this.showLoading(true);

            const response = await fetch(`${API_BASE_URL}/items/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    service_type: newService
                })
            });

            if (!response.ok) {
                throw new Error('Failed to move item');
            }

            const result = await response.json();
            console.log('Item moved successfully:', result);

            // Update local data
            const item = this.allItems.find(i => i.id === itemId);
            if (item) {
                item.service_type = newService;
                this.applyFilters();
                this.showNotification(`${item.item_name} moved to ${this.formatServiceType(newService)}!`, 'success');
            }

            this.showLoading(false);
            this.closeMoveModal();

        } catch (error) {
            console.error('Error moving item:', error);
            this.showLoading(false);
            this.showNotification('Failed to move item. Please try again.', 'error');
        }
    }

    // ============================================
    // DISPLAY FUNCTIONS
    // ============================================
    displayServiceCategories() {
        // This creates the main service filter buttons
        // Already handled in HTML, just update if needed
    }

    displayItems() {
        const container = document.getElementById('itemsGrid');
        if (!container) return;

        if (this.filteredItems.length === 0) {
            document.getElementById('emptyState').style.display = 'flex';
            container.innerHTML = '';
            return;
        }

        document.getElementById('emptyState').style.display = 'none';

        // Group items by category for better organization
        const itemsByCategory = this.groupItemsByCategory(this.filteredItems);

        container.innerHTML = Object.entries(itemsByCategory).map(([categoryName, items]) => {
            return `
                <div class="category-section fade-in">
                    <h3 class="category-section-title">
                        <i class="fas fa-tshirt"></i>
                        ${categoryName}
                        <span class="items-count-badge">${items.length} items</span>
                    </h3>
                    <div class="items-grid">
                        ${items.map(item => this.createItemCard(item)).join('')}
                    </div>
                </div>
            `;
        }).join('');

        // Attach move button event listeners
        this.attachMoveButtonListeners();
    }

    groupItemsByCategory(items) {
        const grouped = {};
        items.forEach(item => {
            const categoryName = item.category_name || 'Other Items';
            if (!grouped[categoryName]) {
                grouped[categoryName] = [];
            }
            grouped[categoryName].push(item);
        });
        return grouped;
    }

    createItemCard(item) {
        const serviceTypeDisplay = this.formatServiceType(item.service_type);
        const imagePath = this.getItemImagePath(item);

        return `
            <div class="item-card fade-in" data-item-id="${item.id}">
                <div class="item-card-image">
                    <img src="${imagePath}" alt="${item.item_name}" onerror="this.src='Images/items/placeholder.png'">

                    <div class="item-card-overlay">
                        <span class="service-badge">${serviceTypeDisplay}</span>
                    </div>
                </div>
                <div class="item-card-content">
                    <h4 class="item-card-title">${item.item_name}</h4>
                    <p class="item-card-description">${item.description || 'Professional laundry service'}</p>
                    <div class="item-card-footer">
                        <div class="item-price-tag">
                            <span class="currency">₹</span>
                            <span class="price">${this.formatPrice(item.price)}</span>
                        </div>
                        <button class="move-item-btn" data-item-id="${item.id}">
                            <i class="fas fa-exchange-alt"></i>
                            <span>Move</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getItemImagePath(item) {
        // First, check if valid image_path exists in database
        if (item.image_path && 
            item.image_path !== 'NULL' && 
            item.image_path !== '' &&
            !item.image_path.includes('placeholder.com') &&
            !item.image_path.includes('via.placeholder')) {
            
            // Clean up the path
            let path = item.image_path.replace(/^\.\//, '').replace(/^\//,'');
            
            // Ensure it starts with images/
            if (!path.startsWith('images/')) {
                path = 'images/' + path;
            }
            
            return path;
        }
        
        // If no valid path, try matching with common laundry items
        const itemNameLower = item.item_name.toLowerCase();
        
        // Map common item names to your actual image files
        const imageMap = {
            'choli': 'choli',
            'coat': 'coat',
            'blazer': 'coat',
            'jacket': 'coat',
            'kurti': 'kurti',
            'kurta': 'kurti',
            'kurtis': 'kurti',
            'pant': 'pant',
            'pants': 'pant',
            'trouser': 'pant',
            'jeans': 'pant',
            'saree': 'saree',
            'sari': 'saree',
            'dupatta': 'saree2',
            'duppatta': 'saree2'
        };
        
        // Try to find a match
        for (const [keyword, imageName] of Object.entries(imageMap)) {
            if (itemNameLower.includes(keyword)) {
                return `images/items/${imageName}.jpg`;
            }
        }
        
        // Use generic iron images based on category
        const ironImages = ['iron1', 'iron2', 'iron3', 'iron4'];
        const randomIron = ironImages[Math.floor(Math.random() * ironImages.length)];
        return `images/${randomIron}.jpg`;
    }

    // ============================================
    // MOVE ITEM MODAL
    // ============================================
    attachMoveButtonListeners() {
        const moveButtons = document.querySelectorAll('.move-item-btn');
        moveButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const itemId = parseInt(btn.getAttribute('data-item-id'));
                this.openMoveModal(itemId);
            });
        });
    }

    openMoveModal(itemId) {
        const item = this.allItems.find(i => i.id === itemId);
        if (!item) return;

        this.selectedItem = item;

        const modal = document.getElementById('moveModal');
        const itemNameElement = document.getElementById('moveItemName');
        const optionsContainer = document.getElementById('serviceOptions');

        itemNameElement.textContent = `Moving: ${item.item_name}`;

        // Create service options (exclude current service)
        const services = [
            { value: 'iron', label: 'Iron Only', icon: 'fa-iron' },
            { value: 'wash_iron', label: 'Wash + Iron', icon: 'fa-water' },
            { value: 'steam_press', label: 'Steam Press', icon: 'fa-hot-tub' },
            { value: 'roll_press', label: 'Roll Press', icon: 'fa-compress' },
            { value: 'petrol_wash', label: 'Petrol Wash', icon: 'fa-spray-can' }
        ];

        optionsContainer.innerHTML = services
            .filter(service => service.value !== item.service_type)
            .map(service => `
                <button class="service-option-btn" data-service="${service.value}">
                    <div class="service-option-icon">
                        <i class="fas ${service.icon}"></i>
                    </div>
                    <span class="service-option-label">${service.label}</span>
                </button>
            `).join('');

        // Attach click listeners to service options
        const serviceOptionBtns = optionsContainer.querySelectorAll('.service-option-btn');
        serviceOptionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const newService = btn.getAttribute('data-service');
                this.moveItemToService(item.id, newService);
            });
        });

        modal.classList.add('active');
    }

    closeMoveModal() {
        const modal = document.getElementById('moveModal');
        modal.classList.remove('active');
        this.selectedItem = null;
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================
    setupEventListeners() {
        // Search input with debounce for better performance
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.searchTerm = e.target.value.trim();
                    this.applyFilters();
                }, 300);
            });
        }

        // Service filter tabs
        const serviceFilterBtns = document.querySelectorAll('.service-filter-btn');
        serviceFilterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                serviceFilterBtns.forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                
                const service = e.currentTarget.getAttribute('data-service');
                this.currentServiceFilter = service;
                this.applyFilters();
            });
        });

        // Gender filter buttons
        const genderFilterBtns = document.querySelectorAll('.gender-filter-btn');
        genderFilterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                genderFilterBtns.forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                
                const gender = e.currentTarget.getAttribute('data-gender');
                this.currentGenderFilter = gender;
                this.applyFilters();
            });
        });

        // Close modal when clicking outside
        const modal = document.getElementById('moveModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeMoveModal();
                }
            });
        }

        console.log('Event listeners setup complete');
    }

    // ============================================
    // FILTER FUNCTIONS
    // ============================================
    applyFilters() {
        console.log('Applying filters:', {
            service: this.currentServiceFilter,
            gender: this.currentGenderFilter,
            search: this.searchTerm
        });

        this.filteredItems = [...this.allItems];

        // Apply service type filter
        if (this.currentServiceFilter !== 'all') {
            this.filteredItems = this.filteredItems.filter(item => 
                item.service_type === this.currentServiceFilter
            );
        }

        // Apply gender filter
        if (this.currentGenderFilter !== 'all') {
            this.filteredItems = this.filteredItems.filter(item => 
                item.gender_category === this.currentGenderFilter
            );
        }

        // Apply search filter
        if (this.searchTerm.length >= 2) {
            const searchLower = this.searchTerm.toLowerCase();
            this.filteredItems = this.filteredItems.filter(item => 
                item.item_name.toLowerCase().includes(searchLower) ||
                (item.description && item.description.toLowerCase().includes(searchLower))
            );
        }

        this.displayItems();
        this.updateResultCount();
    }

    updateResultCount() {
        const countElement = document.getElementById('resultCount');
        if (countElement) {
            countElement.textContent = `${this.filteredItems.length} items`;
        }
    }

    // ============================================
    // HELPER FUNCTIONS
    // ============================================
    formatServiceType(serviceType) {
        const types = {
            'iron': 'Iron Only',
            'wash_iron': 'Wash + Iron',
            'roll_press': 'Roll Press',
            'steam_press': 'Steam Press',
            'petrol_wash': 'Petrol Wash'
        };
        return types[serviceType] || serviceType;
    }

    formatPrice(price) {
        return parseFloat(price).toFixed(2);
    }

    // ============================================
    // UI HELPERS
    // ============================================
    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    showNotification(message, type = 'info') {
        const existing = document.querySelectorAll('.notification-toast');
        existing.forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `notification-toast ${type}`;
        
        const icon = type === 'success' ? 'fa-check-circle' : 
                    type === 'error' ? 'fa-exclamation-circle' : 
                    'fa-info-circle';
        
        notification.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        `;

        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notification-toast {
                    position: fixed;
                    top: 100px;
                    right: 20px;
                    background: white;
                    padding: 16px 24px;
                    border-radius: 12px;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    z-index: 10001;
                    animation: slideIn 0.3s ease;
                }
                .notification-toast.success { border-left: 4px solid #10b981; }
                .notification-toast.success i { color: #10b981; }
                .notification-toast.error { border-left: 4px solid #ef4444; }
                .notification-toast.error i { color: #ef4444; }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
}

// ============================================
// GLOBAL FUNCTIONS FOR HTML ONCLICK
// ============================================
function closeMoveModal() {
    if (window.pricingManager) {
        window.pricingManager.closeMoveModal();
    }
}

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================
console.log('Enhanced Pricing.js loaded');

let pricingManager;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM loaded, initializing pricing manager');
        pricingManager = new PricingManager();
        window.pricingManager = pricingManager;
    });
} else {
    console.log('DOM already loaded, initializing pricing manager');
    pricingManager = new PricingManager();
    window.pricingManager = pricingManager;
}