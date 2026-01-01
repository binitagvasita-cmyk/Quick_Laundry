// ===== POPUP/MODAL SYSTEM =====

class Popup {
  constructor() {
    this.currentPopup = null;
    this.initStyles();
  }

  // Initialize styles by injecting CSS if not already present
  initStyles() {
    if (!document.getElementById('popup-styles')) {
      const link = document.createElement('link');
      link.id = 'popup-styles';
      link.rel = 'stylesheet';
      link.href = 'CSS/popup.css';
      document.head.appendChild(link);
    }
  }

  // Create popup overlay
  createOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.close();
      }
    });
    return overlay;
  }

  // Show alert popup
  alert(options) {
    const {
      title = 'Alert',
      message = '',
      type = 'info', // success, error, warning, info
      confirmText = 'OK',
      onConfirm = null
    } = options;

    // Close any existing popup
    this.close();

    // Create overlay
    const overlay = this.createOverlay();

    // Get icon based on type
    const icons = {
      success: 'fa-check-circle',
      error: 'fa-times-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    };

    // Create popup HTML
    overlay.innerHTML = `
      <div class="popup-container">
        <div class="popup-header">
          <div class="popup-icon ${type}">
            <i class="fas ${icons[type]}"></i>
          </div>
          <div class="popup-content">
            <h3 class="popup-title">${title}</h3>
            <p class="popup-message">${message}</p>
          </div>
        </div>
        <div class="popup-footer">
          <button class="popup-btn popup-btn-primary" id="popupConfirm">
            ${confirmText}
          </button>
        </div>
      </div>
    `;

    // Add to document
    document.body.appendChild(overlay);

    // Show with animation
    setTimeout(() => overlay.classList.add('active'), 10);

    // Store reference
    this.currentPopup = overlay;

    // Add event listeners
    const confirmBtn = overlay.querySelector('#popupConfirm');
    confirmBtn.addEventListener('click', () => {
      if (onConfirm) onConfirm();
      this.close();
    });

    // Handle Escape key
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        this.close();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);

    return this;
  }

  // Show confirm popup
  confirm(options) {
    const {
      title = 'Confirm',
      message = '',
      type = 'warning',
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      onConfirm = null,
      onCancel = null
    } = options;

    // Close any existing popup
    this.close();

    // Create overlay
    const overlay = this.createOverlay();

    // Get icon based on type
    const icons = {
      success: 'fa-check-circle',
      error: 'fa-times-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    };

    // Create popup HTML
    overlay.innerHTML = `
      <div class="popup-container">
        <div class="popup-header">
          <div class="popup-icon ${type}">
            <i class="fas ${icons[type]}"></i>
          </div>
          <div class="popup-content">
            <h3 class="popup-title">${title}</h3>
            <p class="popup-message">${message}</p>
          </div>
        </div>
        <div class="popup-footer">
          <button class="popup-btn popup-btn-secondary" id="popupCancel">
            ${cancelText}
          </button>
          <button class="popup-btn popup-btn-primary" id="popupConfirm">
            ${confirmText}
          </button>
        </div>
      </div>
    `;

    // Add to document
    document.body.appendChild(overlay);

    // Show with animation
    setTimeout(() => overlay.classList.add('active'), 10);

    // Store reference
    this.currentPopup = overlay;

    // Add event listeners
    const confirmBtn = overlay.querySelector('#popupConfirm');
    const cancelBtn = overlay.querySelector('#popupCancel');

    confirmBtn.addEventListener('click', () => {
      if (onConfirm) onConfirm();
      this.close();
    });

    cancelBtn.addEventListener('click', () => {
      if (onCancel) onCancel();
      this.close();
    });

    // Handle Escape key
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        if (onCancel) onCancel();
        this.close();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);

    return this;
  }

  // Show success popup
  success(title, message, onConfirm = null) {
    return this.alert({
      title,
      message,
      type: 'success',
      confirmText: 'Great!',
      onConfirm
    });
  }

  // Show error popup
  error(title, message, onConfirm = null) {
    return this.alert({
      title,
      message,
      type: 'error',
      confirmText: 'OK',
      onConfirm
    });
  }

  // Show warning popup
  warning(title, message, onConfirm = null) {
    return this.alert({
      title,
      message,
      type: 'warning',
      confirmText: 'OK',
      onConfirm
    });
  }

  // Show info popup
  info(title, message, onConfirm = null) {
    return this.alert({
      title,
      message,
      type: 'info',
      confirmText: 'Got it',
      onConfirm
    });
  }

  // Show loading popup
  loading(message = 'Loading...') {
    // Close any existing popup
    this.close();

    // Create overlay
    const overlay = this.createOverlay();

    // Create popup HTML
    overlay.innerHTML = `
      <div class="popup-container">
        <div class="popup-loading">
          <div class="popup-spinner"></div>
          <div class="popup-loading-text">${message}</div>
        </div>
      </div>
    `;

    // Add to document
    document.body.appendChild(overlay);

    // Show with animation
    setTimeout(() => overlay.classList.add('active'), 10);

    // Store reference
    this.currentPopup = overlay;

    return this;
  }

  // Close current popup
  close() {
    if (this.currentPopup) {
      this.currentPopup.classList.remove('active');
      
      setTimeout(() => {
        if (this.currentPopup && this.currentPopup.parentNode) {
          this.currentPopup.parentNode.removeChild(this.currentPopup);
        }
        this.currentPopup = null;
      }, 200);
    }
  }

  // Close all popups
  closeAll() {
    const popups = document.querySelectorAll('.popup-overlay');
    popups.forEach(popup => {
      popup.classList.remove('active');
      setTimeout(() => {
        if (popup.parentNode) {
          popup.parentNode.removeChild(popup);
        }
      }, 200);
    });
    this.currentPopup = null;
  }
}

// Create global popup instance
window.popup = new Popup();

// Convenience functions for global access
window.showAlert = (options) => window.popup.alert(options);
window.showConfirm = (options) => window.popup.confirm(options);
window.showSuccess = (title, message, onConfirm) => window.popup.success(title, message, onConfirm);
window.showError = (title, message, onConfirm) => window.popup.error(title, message, onConfirm);
window.showWarning = (title, message, onConfirm) => window.popup.warning(title, message, onConfirm);
window.showInfo = (title, message, onConfirm) => window.popup.info(title, message, onConfirm);
window.showLoading = (message) => window.popup.loading(message);
window.closePopup = () => window.popup.close();