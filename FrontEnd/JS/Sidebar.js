// Sidebar Manager Class with Dynamic Authentication
class SidebarManager {
  constructor() {
    this.sidebar = document.getElementById("sidebar");
    this.sidebarToggle = document.getElementById("sidebarToggle");
    this.sidebarOverlay = document.getElementById("sidebarOverlay");
    this.isMobile = window.innerWidth <= 1024;
    this.currentPage = this.getCurrentPageFromURL();
    this.isLoggedIn = this.checkLoginStatus();
    this.currentUser = this.getCurrentUser();
    this.init();
  }

  init() {
    if (!this.sidebar) return;
    this.renderSidebar();
    this.setupToggle();
    this.setupResize();
    this.setupOverlay();
    this.setupMessageListener();
    this.setupAuthEventListeners();
  }

  getCurrentPageFromURL() {
    const path = window.location.pathname;
    const page = path.substring(path.lastIndexOf('/') + 1).replace('.html', '');
    return page || 'home';
  }

  checkLoginStatus() {
    try {
      const token = localStorage.getItem("access_token");
      const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
      return !!(token && isLoggedIn);
    } catch (e) {
      console.warn("localStorage not available:", e);
      return false;
    }
  }

  getCurrentUser() {
    try {
      const userData = localStorage.getItem("currentUser");
      return userData ? JSON.parse(userData) : null;
    } catch (e) {
      console.warn("Could not get user data:", e);
      return null;
    }
  }

  getInitials(name) {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  }

  renderSidebar() {
    const profileSection = this.sidebar.querySelector(".sidebar-profile");
    const navSection = this.sidebar.querySelector(".sidebar-nav");
    const footerSection = this.sidebar.querySelector(".sidebar-footer");

    if (this.isLoggedIn && this.currentUser) {
      this.renderLoggedInProfile(profileSection);
      this.renderLoggedInNav(navSection);
      this.renderLogoutButton(footerSection);
    } else {
      this.renderGuestProfile(profileSection);
      this.renderGuestNav(navSection);
      this.hideLogoutButton(footerSection);
    }

    this.setupNavigation();
  }

  renderLoggedInProfile(profileSection) {
    const displayName = this.currentUser.full_name || this.currentUser.username || "User";
    const email = this.currentUser.email || "";
    const profilePic = this.currentUser.profile_picture;

    let avatarHTML;
    if (profilePic) {
      avatarHTML = `<img src="${profilePic}" alt="User Avatar" id="userAvatar" />`;
    } else {
      const initials = this.getInitials(displayName);
      avatarHTML = `
        <div class="avatar-initials" id="userAvatar">
          ${initials}
        </div>
      `;
    }

    profileSection.innerHTML = `
      <div class="profile-avatar">
        ${avatarHTML}
        <span class="profile-status"></span>
      </div>
      <div class="profile-info">
        <h3 class="profile-name" id="userName">${displayName}</h3>
        <p class="profile-email" id="userEmail">${email}</p>
      </div>
      <button class="profile-edit" id="profileEdit" aria-label="Go to profile">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M11.333 2.00004C11.5081 1.82494 11.716 1.68605 11.9447 1.59129C12.1735 1.49653 12.4187 1.44775 12.6663 1.44775C12.914 1.44775 13.1592 1.49653 13.3879 1.59129C13.6167 1.68605 13.8246 1.82494 13.9997 2.00004C14.1748 2.17513 14.3137 2.383 14.4084 2.61178C14.5032 2.84055 14.552 3.08575 14.552 3.33337C14.552 3.58099 14.5032 3.82619 14.4084 4.05497C14.3137 4.28374 14.1748 4.49161 13.9997 4.66671L5.33301 13.3334L1.33301 14.6667L2.66634 10.6667L11.333 2.00004Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    `;

    const profileEdit = document.getElementById("profileEdit");
    if (profileEdit) {
      profileEdit.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "profile.html";
      });
    }
  }

  renderGuestProfile(profileSection) {
    profileSection.innerHTML = `
      <div class="profile-avatar">
        <div class="avatar-initials" id="userAvatar">G</div>
        <span class="profile-status"></span>
      </div>
      <div class="profile-info">
        <h3 class="profile-name" id="userName">Guest User</h3>
        <p class="profile-email" id="userEmail">Please login</p>
      </div>
    `;
  }

  renderLoggedInNav(navSection) {
    navSection.innerHTML = `
      <div class="nav-section">
        <span class="nav-section-title">MENU</span>

        <a href="Home.html" class="nav-item ${this.currentPage === 'home' || this.currentPage === 'Home' ? 'active' : ''}" data-page="home">
          <div class="nav-item-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M2 10L10 2L18 10M4 8V17C4 17.5523 4.44772 18 5 18H8V14C8 13.4477 8.44772 13 9 13H11C11.5523 13 12 13.4477 12 14V18H15C15.5523 18 16 17.5523 16 17V8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="nav-item-text">Home</span>
        </a>

        <a href="profile.html" class="nav-item ${this.currentPage === 'profile' ? 'active' : ''}" data-page="profile">
          <div class="nav-item-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 11C12.7614 11 15 8.76142 15 6C15 3.23858 12.7614 1 10 1C7.23858 1 5 3.23858 5 6C5 8.76142 7.23858 11 10 11Z" stroke="currentColor" stroke-width="1.5"/>
              <path d="M3 19C3 15.134 6.13401 12 10 12C13.866 12 17 15.134 17 19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
          <span class="nav-item-text">Profile</span>
        </a>

        <a href="place_service.html" class="nav-item ${this.currentPage === 'place_service' ? 'active' : ''}" data-page="place_service">
          <div class="nav-item-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 1L3 5V9C3 13.55 6.84 17.74 11 19C15.16 17.74 19 13.55 19 9V5L10 1Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M7 10L9 12L13 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="nav-item-text">Place Service</span>
          <span class="nav-badge new">New</span>
        </a>

        <a href="Services.html" class="nav-item ${this.currentPage === 'Services' ? 'active' : ''}" data-page="services">
          <div class="nav-item-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 6H16M4 10H16M4 14H16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <rect x="2" y="3" width="16" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/>
            </svg>
          </div>
          <span class="nav-item-text">Service List</span>
        </a>

        <a href="pricing.html" class="nav-item ${this.currentPage === 'pricing' ? 'active' : ''}" data-page="pricing">
          <div class="nav-item-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 1V19M14 5H8C7.46957 5 6.96086 5.21071 6.58579 5.58579C6.21071 5.96086 6 6.46957 6 7C6 7.53043 6.21071 8.03914 6.58579 8.41421C6.96086 8.78929 7.46957 9 8 9H12C12.5304 9 13.0391 9.21071 13.4142 9.58579C13.7893 9.96086 14 10.4696 14 11C14 11.5304 13.7893 12.0391 13.4142 12.4142C13.0391 12.7893 12.5304 13 12 13H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="nav-item-text">Pricing</span>
        </a>

        <a href="About_us.html" class="nav-item ${this.currentPage === 'About_us' ? 'active' : ''}" data-page="about">
          <div class="nav-item-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/>
              <path d="M10 14V10M10 6H10.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
          <span class="nav-item-text">About Us</span>
        </a>

        <a href="contactus.html" class="nav-item ${this.currentPage === 'contactus' ? 'active' : ''}" data-page="contact">
          <div class="nav-item-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M2 3h16c.55 0 1 .45 1 1v12c0 .55-.45 1-1 1H2c-.55 0-1-.45-1-1V4c0-.55.45-1 1-1z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M19 4L10 11L1 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="nav-item-text">Contact Us</span>
        </a>
      </div>
    `;
  }

  renderGuestNav(navSection) {
    navSection.innerHTML = `
      <div class="nav-section">
        <span class="nav-section-title">MENU</span>

        <a href="Home.html" class="nav-item ${this.currentPage === 'home' || this.currentPage === 'Home' ? 'active' : ''}" data-page="home">
          <div class="nav-item-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M2 10L10 2L18 10M4 8V17C4 17.5523 4.44772 18 5 18H8V14C8 13.4477 8.44772 13 9 13H11C11.5523 13 12 13.4477 12 14V18H15C15.5523 18 16 17.5523 16 17V8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="nav-item-text">Home</span>
        </a>

        <a href="About_us.html" class="nav-item ${this.currentPage === 'About_us' ? 'active' : ''}" data-page="about">
          <div class="nav-item-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/>
              <path d="M10 14V10M10 6H10.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
          <span class="nav-item-text">About Us</span>
        </a>

        <a href="Services.html" class="nav-item ${this.currentPage === 'Services' ? 'active' : ''}" data-page="services">
          <div class="nav-item-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 6H16M4 10H16M4 14H16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <rect x="2" y="3" width="16" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/>
            </svg>
          </div>
          <span class="nav-item-text">Services</span>
        </a>

        <a href="pricing.html" class="nav-item ${this.currentPage === 'pricing' ? 'active' : ''}" data-page="pricing">
          <div class="nav-item-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 1V19M14 5H8C7.46957 5 6.96086 5.21071 6.58579 5.58579C6.21071 5.96086 6 6.46957 6 7C6 7.53043 6.21071 8.03914 6.58579 8.41421C6.96086 8.78929 7.46957 9 8 9H12C12.5304 9 13.0391 9.21071 13.4142 9.58579C13.7893 9.96086 14 10.4696 14 11C14 11.5304 13.7893 12.0391 13.4142 12.4142C13.0391 12.7893 12.5304 13 12 13H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="nav-item-text">Pricing</span>
        </a>

        <a href="contactus.html" class="nav-item ${this.currentPage === 'contactus' ? 'active' : ''}" data-page="contact">
          <div class="nav-item-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M2 3h16c.55 0 1 .45 1 1v12c0 .55-.45 1-1 1H2c-.55 0-1-.45-1-1V4c0-.55.45-1 1-1z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M19 4L10 11L1 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="nav-item-text">Contact Us</span>
        </a>

        <a href="#login" class="nav-item nav-item-login" data-page="login">
          <div class="nav-item-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M13 3H17C17.5523 3 18 3.44772 18 4V16C18 16.5523 17.5523 17 17 17H13M7 14L3 10M3 10L7 6M3 10H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="nav-item-text">Login</span>
        </a>
      </div>
    `;
  }

  renderLogoutButton(footerSection) {
    if (!footerSection) {
      console.error("Footer section not found");
      return;
    }
    
    footerSection.innerHTML = `
      <button class="logout-btn" id="sidebarLogoutBtn">
        <div class="logout-icon">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7 17H3C2.44772 17 2 16.5523 2 16V4C2 3.44772 2.44772 3 3 3H7M13 14L17 10M17 10L13 6M17 10H7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <span>Logout</span>
      </button>
    `;

    const logoutBtn = document.getElementById("sidebarLogoutBtn");
    if (logoutBtn) {
      console.log("Logout button found, attaching event listener");
      
      const newLogoutBtn = logoutBtn.cloneNode(true);
      logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
      
      newLogoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("Logout button clicked!");
        this.handleLogout();
      });
    } else {
      console.error("Logout button element not found after rendering");
    }
  }

  hideLogoutButton(footerSection) {
    if (footerSection) {
      footerSection.innerHTML = '';
    }
  }

  setupToggle() {
    if (this.sidebarToggle) {
      this.sidebarToggle.addEventListener("click", () => this.toggleSidebar());
    }
  }

  toggleSidebar() {
    this.sidebar.classList.toggle("active");
    this.sidebarOverlay.classList.toggle("active");

    if (this.sidebar.classList.contains("active")) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }

  closeSidebar() {
    this.sidebar.classList.remove("active");
    this.sidebarOverlay.classList.remove("active");
    document.body.style.overflow = "";
  }

  setupNavigation() {
    const navItems = this.sidebar.querySelectorAll(".nav-item");
    
    navItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        const page = item.getAttribute("data-page");
        const href = item.getAttribute("href");

        // Handle login/signup for guest users
        if (!this.isLoggedIn && (page === "login" || page === "signup")) {
          e.preventDefault();
          this.openAuthModal(page);
          if (this.isMobile) {
            setTimeout(() => this.closeSidebar(), 300);
          }
          return;
        }

        // Handle anchor links (links starting with #)
        if (href && href.startsWith("#")) {
          e.preventDefault();
          this.createRipple(e, item);
          
          if (this.isMobile) {
            setTimeout(() => this.closeSidebar(), 300);
          }
          
          // Scroll to section if on same page
          const targetId = href.substring(1);
          const targetElement = document.getElementById(targetId);
          if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth' });
          }
          return;
        }

        // For regular page navigation (Home.html, pricing.html, etc.)
        // Let the default link behavior work
        // Just add visual feedback and close sidebar on mobile
        this.createRipple(e, item);
        
        if (this.isMobile) {
          setTimeout(() => this.closeSidebar(), 300);
        }

        // The browser will handle the navigation naturally
      });
    });
  }

  openAuthModal(type = "login") {
    let modal = document.getElementById("authModal");
    if (!modal) {
      modal = this.createAuthModal();
      document.body.appendChild(modal);
    }

    const iframe = modal.querySelector(".auth-iframe");
    if (type === "login") {
      iframe.src = "login.html";
    } else if (type === "register" || type === "signup") {
      iframe.src = "registration.html";
    }

    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  closeAuthModal() {
    const modal = document.getElementById("authModal");
    if (modal) {
      modal.classList.remove("active");
      document.body.style.overflow = "";

      setTimeout(() => {
        const iframe = modal.querySelector(".auth-iframe");
        if (iframe) iframe.src = "";
      }, 300);
    }
  }

  createAuthModal() {
    const modal = document.createElement("div");
    modal.id = "authModal";
    modal.className = "auth-modal";
    modal.innerHTML = `
      <div class="auth-modal-content">
        <button class="auth-modal-close" id="authModalClose">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <iframe class="auth-iframe" src=""></iframe>
      </div>
    `;

    const closeBtn = modal.querySelector("#authModalClose");
    closeBtn.addEventListener("click", () => this.closeAuthModal());

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        this.closeAuthModal();
      }
    });

    return modal;
  }

  setupMessageListener() {
    window.addEventListener("message", (event) => {
      const data = event.data;

      if (data.action === "loginSuccess") {
        this.isLoggedIn = true;
        this.currentUser = data.user;
        this.closeAuthModal();
        this.renderSidebar();
        this.showNotification("Login successful! Welcome back.", "success");
        console.log("Login successful:", data.user);
      } else if (data.action === "switchToRegister") {
        this.openAuthModal("register");
      } else if (data.action === "switchToLogin") {
        this.openAuthModal("login");
      } else if (data.action === "registrationSuccess") {
        this.openAuthModal("login");
        this.showNotification("Registration successful! Please login.", "success");
        console.log("Registration successful");
      }
    });
  }

  setupAuthEventListeners() {
    window.addEventListener('userLoggedIn', (event) => {
      console.log('User logged in event received in sidebar');
      this.isLoggedIn = true;
      this.currentUser = event.detail.user;
      this.renderSidebar();
    });

    window.addEventListener('userLoggedOut', () => {
      console.log('User logged out event received in sidebar');
      this.isLoggedIn = false;
      this.currentUser = null;
      this.renderSidebar();
    });
  }

  handleLogout() {
    console.log("handleLogout called");
    
    if (confirm("Are you sure you want to logout?")) {
      try {
        console.log("User confirmed logout");
        
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("currentUser");
        localStorage.removeItem("isLoggedIn");
        
        console.log("Auth data cleared from localStorage");
        
        this.isLoggedIn = false;
        this.currentUser = null;
        this.renderSidebar();
        
        this.showNotification("You have been logged out successfully!", "success");
        
        window.dispatchEvent(new CustomEvent('userLoggedOut'));
        
        console.log("Logout event dispatched");
        
        setTimeout(() => {
          console.log("Redirecting to Home.html");
          window.location.href = "Home.html";
        }, 1000);
        
      } catch (error) {
        console.error("Error during logout:", error);
        this.showNotification("Logout failed. Please try again.", "error");
      }
    } else {
      console.log("User cancelled logout");
    }
  }

  createRipple(e, element) {
    const ripple = document.createElement("span");
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: rgba(59, 130, 246, 0.3);
      left: ${x}px;
      top: ${y}px;
      pointer-events: none;
      animation: ripple 0.6s ease-out;
    `;

    if (!document.querySelector("[data-ripple-style]")) {
      const style = document.createElement("style");
      style.textContent = `
        @keyframes ripple {
          to {
            transform: scale(2);
            opacity: 0;
          }
        }
      `;
      style.setAttribute("data-ripple-style", "");
      document.head.appendChild(style);
    }

    element.style.position = "relative";
    element.style.overflow = "hidden";
    element.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }

  setupOverlay() {
    if (this.sidebarOverlay) {
      this.sidebarOverlay.addEventListener("click", () => this.closeSidebar());
    }
  }

  setupResize() {
    window.addEventListener("resize", () => {
      this.isMobile = window.innerWidth <= 1024;
      if (!this.isMobile) {
        this.closeSidebar();
      }
    });
  }

  showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: ${type === "success" ? "#10b981" : type === "error" ? "#ef4444" : "#3b82f6"};
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      animation: slideInRight 0.3s ease;
    `;

    if (!document.querySelector("[data-notification-style]")) {
      const style = document.createElement("style");
      style.textContent = `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      style.setAttribute("data-notification-style", "");
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.animation = "slideInRight 0.3s ease reverse";
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// Initialize when sidebar is loaded
setTimeout(() => {
  const sidebarManager = new SidebarManager();
  window.sidebarManager = sidebarManager;
  
  console.log("Sidebar initialized");
  console.log("Login status:", sidebarManager.isLoggedIn);
  console.log("Current user:", sidebarManager.currentUser);
  console.log("Current page:", sidebarManager.currentPage);
}, 100);
