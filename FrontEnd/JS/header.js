// Theme Management with localStorage
class ThemeManager {
  constructor() {
    this.currentTheme = this.getStoredTheme() || "light";
    this.init();
  }

  init() {
    this.applyTheme(this.currentTheme);
    this.setupThemeToggle();
  }

  getStoredTheme() {
    try {
      return localStorage.getItem("app-theme");
    } catch (e) {
      console.warn("localStorage not available:", e);
      return null;
    }
  }

  setStoredTheme(theme) {
    try {
      localStorage.setItem("app-theme", theme);
    } catch (e) {
      console.warn("Could not save theme to localStorage:", e);
    }
  }

  applyTheme(theme) {
    this.currentTheme = theme;
    document.documentElement.setAttribute("data-theme", theme);

    // Update toggle button icon if it exists
    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
      const icon = themeToggle.querySelector("svg");
      if (icon) {
        if (theme === "dark") {
          // Sun icon for dark mode (clicking shows light)
          icon.innerHTML = `
            <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="1.5" fill="none"/>
            <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          `;
        } else {
          // Moon icon for light mode (clicking shows dark)
          icon.innerHTML = `
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          `;
        }
      }
    }

    // Also update global appTheme if it exists
    if (window.appTheme && typeof window.appTheme.setTheme === "function") {
      window.appTheme.setTheme(theme);
    }
  }

  toggleTheme() {
    const newTheme = this.currentTheme === "light" ? "dark" : "light";
    this.applyTheme(newTheme);
    this.setStoredTheme(newTheme);
  }

  setupThemeToggle() {
    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
      themeToggle.addEventListener("click", () => this.toggleTheme());
    }
  }
}

// Mobile Menu Management
class MobileMenu {
  constructor() {
    this.menuToggle = document.getElementById("menuToggle");
    this.nav = document.getElementById("nav");
    this.init();
  }

  init() {
    if (this.menuToggle && this.nav) {
      this.menuToggle.addEventListener("click", () => this.toggleMenu());
      this.setupNavLinks();
      this.setupOutsideClick();
      this.setupResize();
    }
  }

  toggleMenu() {
    this.menuToggle.classList.toggle("active");
    this.nav.classList.toggle("active");

    if (this.nav.classList.contains("active")) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }

  closeMenu() {
    this.menuToggle.classList.remove("active");
    this.nav.classList.remove("active");
    document.body.style.overflow = "";
  }

  setupNavLinks() {
    const navLinks = this.nav.querySelectorAll(".nav-link");
    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.forEach((l) => l.classList.remove("active"));
        link.classList.add("active");
        if (window.innerWidth <= 968) {
          this.closeMenu();
        }
      });
    });
  }

  setupOutsideClick() {
    document.addEventListener("click", (e) => {
      if (this.nav.classList.contains("active")) {
        if (
          !this.nav.contains(e.target) &&
          !this.menuToggle.contains(e.target)
        ) {
          this.closeMenu();
        }
      }
    });
  }

  setupResize() {
    window.addEventListener("resize", () => {
      if (window.innerWidth > 968) {
        this.closeMenu();
      }
    });
  }
}

// Header Scroll Effect
class HeaderScroll {
  constructor() {
    this.header = document.querySelector(".header");
    this.init();
  }

  init() {
    if (this.header) {
      window.addEventListener("scroll", () => this.handleScroll());
    }
  }

  handleScroll() {
    const currentScroll = window.pageYOffset;
    if (currentScroll > 10) {
      this.header.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
    } else {
      this.header.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)";
    }
  }
}

// Authentication Manager
class AuthManager {
  constructor() {
    this.isLoggedIn = this.checkLoginStatus();
    this.currentUser = this.getCurrentUser();
    this.init();
  }

  init() {
    this.updateUI();
    this.setupEventListeners();
    this.setupMessageListener();
  }

  checkLoginStatus() {
    try {
      // Check for access token - this is the key check
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

  setLoginStatus(status, userData = null, tokens = null) {
    try {
      localStorage.setItem("isLoggedIn", status.toString());
      
      if (userData) {
        localStorage.setItem("currentUser", JSON.stringify(userData));
      } else {
        localStorage.removeItem("currentUser");
      }

      // CRITICAL FIX: Store authentication tokens
      if (tokens) {
        if (tokens.access_token) {
          localStorage.setItem("access_token", tokens.access_token);
        }
        if (tokens.refresh_token) {
          localStorage.setItem("refresh_token", tokens.refresh_token);
        }
      } else {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      }
      
      this.isLoggedIn = status;
      this.currentUser = userData;
      this.updateUI();
      
      console.log("Login status updated:", {
        isLoggedIn: status,
        hasToken: !!tokens?.access_token,
        user: userData?.email
      });
    } catch (e) {
      console.warn("Could not save login status:", e);
    }
  }

  updateUI() {
    const loginBtn = document.getElementById("loginBtn");
    const userProfile = document.getElementById("userProfile");
    const profileName = document.getElementById("profileName");
    const headerAvatar = document.getElementById("headerAvatar");

    if (this.isLoggedIn && this.currentUser) {
      // Show profile, hide login button
      if (loginBtn) loginBtn.style.display = "none";
      if (userProfile) userProfile.style.display = "block";
      
      const displayName = this.currentUser.full_name || 
                         this.currentUser.name || 
                         this.currentUser.username || 
                         "User";
      
      if (profileName) {
        profileName.textContent = displayName;
      }

      // Update avatar
      if (headerAvatar) {
        const avatarUrl = this.currentUser.profile_picture || 
                         this.currentUser.avatar ||
                         `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.currentUser.username || 'User'}`;
        headerAvatar.src = avatarUrl;
      }
    } else {
      // Show login button, hide profile
      if (loginBtn) loginBtn.style.display = "flex";
      if (userProfile) userProfile.style.display = "none";
    }
  }

  setupEventListeners() {
    // Login button click
    const loginBtn = document.getElementById("loginBtn");
    if (loginBtn) {
      loginBtn.addEventListener("click", () => this.openAuthModal("login"));
    }

    // Profile dropdown toggle
    const profileButton = document.getElementById("profileButton");
    const dropdownMenu = document.getElementById("dropdownMenu");
    if (profileButton && dropdownMenu) {
      profileButton.addEventListener("click", (e) => {
        e.stopPropagation();
        profileButton.classList.toggle("active");
        dropdownMenu.classList.toggle("active");
      });

      // Close dropdown when clicking outside
      document.addEventListener("click", (e) => {
        if (
          !profileButton.contains(e.target) &&
          !dropdownMenu.contains(e.target)
        ) {
          profileButton.classList.remove("active");
          dropdownMenu.classList.remove("active");
        }
      });
    }

    // Logout button click
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.logout();
      });
    }
  }

  openAuthModal(type = "login") {
    // Create modal if it doesn't exist
    let modal = document.getElementById("authModal");
    if (!modal) {
      modal = this.createAuthModal();
      document.body.appendChild(modal);
    }

    // Set iframe source
    const iframe = modal.querySelector(".auth-iframe");
    if (type === "login") {
      iframe.src = "login.html";
    } else if (type === "register") {
      iframe.src = "registration.html";
    }

    // Show modal
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  closeAuthModal() {
    const modal = document.getElementById("authModal");
    if (modal) {
      modal.classList.remove("active");
      document.body.style.overflow = "";

      // Clear iframe source after animation
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

    // Close button click
    const closeBtn = modal.querySelector("#authModalClose");
    closeBtn.addEventListener("click", () => this.closeAuthModal());

    // Close on background click
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        this.closeAuthModal();
      }
    });

    return modal;
  }

  setupMessageListener() {
    // Listen for messages from iframe
    window.addEventListener("message", (event) => {
      const data = event.data;

      if (data.action === "loginSuccess") {
        // CRITICAL FIX: Store tokens along with user data
        console.log("Login success received:", data);
        
        const tokens = {
          access_token: data.access_token || data.token,
          refresh_token: data.refresh_token
        };
        
        this.setLoginStatus(true, data.user, tokens);
        this.closeAuthModal();
        
        // Notify other components
        window.dispatchEvent(new CustomEvent('userLoggedIn', { 
          detail: { user: data.user, tokens } 
        }));
        
        console.log("Login successful, tokens stored:", {
          hasAccessToken: !!tokens.access_token,
          hasRefreshToken: !!tokens.refresh_token
        });
      } else if (data.action === "switchToRegister") {
        this.openAuthModal("register");
      } else if (data.action === "switchToLogin") {
        this.openAuthModal("login");
      } else if (data.action === "registrationSuccess") {
        this.openAuthModal("login");
        console.log("Registration successful, please login");
      }
    });
  }

  logout() {
    if (confirm("Are you sure you want to logout?")) {
      // Clear all authentication data
      this.setLoginStatus(false, null, null);
      
      // Notify other components
      window.dispatchEvent(new CustomEvent('userLoggedOut'));
      
      console.log("User logged out");
      
      // Redirect to home page
      window.location.href = "index.html";
    }
  }
}

// Initialize when header is loaded
setTimeout(() => {
  const themeManager = new ThemeManager();
  window.themeManager = themeManager;

  const mobileMenu = new MobileMenu();
  const headerScroll = new HeaderScroll();
  const authManager = new AuthManager();

  window.authManager = authManager;

  console.log("Header initialized with theme:", themeManager.currentTheme);
  console.log("Login status:", authManager.isLoggedIn);
}, 100);