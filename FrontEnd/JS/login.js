// ========== Configuration ==========
const API_BASE_URL = (() => {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3000/api';
  } else {
    // Point to your Render backend
    return 'https://quick-laundry-backend.onrender.com/api';
  }
})();
const GOOGLE_CLIENT_ID = "968269738462-j7gmjvsqpk2b5l26c17em039eoeb5jcv.apps.googleusercontent.com";

// Demo mode - set to true to bypass API calls for testing UI
const DEMO_MODE = false;

// Auto-detect if backend is available
let BACKEND_AVAILABLE = false;

// Test backend availability on load
async function testBackendConnection() {
  try {
    const response = await fetch('https://quick-laundry-backend.onrender.com', {
      method: 'GET',
      signal: AbortSignal.timeout(3000) // 3 second timeout
    });
    BACKEND_AVAILABLE = response.ok;
    console.log('✓ Backend server is available');
    return true;
  } catch (error) {
    BACKEND_AVAILABLE = false;
    console.error('✗ Backend server is not available');
    console.error('Error:', error.message);
    return false;
  }
}

// ========== Theme Management (Synced with header.js) ==========
class ThemeManager {
  constructor() {
    this.currentTheme =
      this.getStoredTheme() || this.getParentTheme() || "light";
    this.init();
  }

  init() {
    this.applyTheme(this.currentTheme);
    this.setupThemeToggle();
    this.listenToParentTheme();
  }

  getStoredTheme() {
    try {
      return localStorage.getItem("app-theme");
    } catch (e) {
      console.warn("localStorage not available:", e);
      return null;
    }
  }

  getParentTheme() {
    if (window.parent && window.parent !== window) {
      try {
        const parentTheme =
          window.parent.document.documentElement.getAttribute("data-theme");
        return parentTheme;
      } catch (e) {
        return null;
      }
    }
    return null;
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

    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
      const icon = themeToggle.querySelector("svg");
      if (icon) {
        if (theme === "dark") {
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
          icon.innerHTML = `
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          `;
        }
      }
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

  listenToParentTheme() {
    window.addEventListener("message", (event) => {
      if (event.data && event.data.action === "themeChanged") {
        this.applyTheme(event.data.theme);
      }
    });

    if (window.parent && window.parent !== window) {
      setInterval(() => {
        const parentTheme = this.getParentTheme();
        if (parentTheme && parentTheme !== this.currentTheme) {
          this.applyTheme(parentTheme);
        }
      }, 1000);
    }
  }
}

// ========== Password Toggle ==========
class PasswordToggle {
  constructor() {
    this.toggleBtn = document.getElementById("togglePassword");
    this.passwordInput = document.getElementById("password");
    this.init();
  }

  init() {
    if (this.toggleBtn && this.passwordInput) {
      this.toggleBtn.addEventListener("click", () => this.toggle());
    }
  }

  toggle() {
    const type =
      this.passwordInput.getAttribute("type") === "password"
        ? "text"
        : "password";
    this.passwordInput.setAttribute("type", type);

    const icon = this.toggleBtn.querySelector("svg");
    if (type === "text") {
      icon.innerHTML = `
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      `;
    } else {
      icon.innerHTML = `
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      `;
    }
  }
}

// ========== Form Validation ==========
class FormValidator {
  constructor() {
    this.emailInput = document.getElementById("email");
    this.passwordInput = document.getElementById("password");
  }

  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validatePassword(password) {
    return password.length >= 6;
  }

  validate() {
    const email = this.emailInput.value.trim();
    const password = this.passwordInput.value;

    if (!email) {
      return { valid: false, message: "Email is required" };
    }

    if (!this.validateEmail(email)) {
      return { valid: false, message: "Please enter a valid email address" };
    }

    if (!password) {
      return { valid: false, message: "Password is required" };
    }

    if (!this.validatePassword(password)) {
      return {
        valid: false,
        message: "Password must be at least 6 characters",
      };
    }

    return { valid: true };
  }
}

// ========== API Helper ==========
class APIHelper {
  static async makeRequest(url, options) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: text };
      }

      return { response, data };
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }
}

// ========== Login Handler ==========
class LoginHandler {
  constructor() {
    this.form = document.getElementById("loginForm");
    this.loginBtn = document.getElementById("loginBtn");
    this.errorMessage = document.getElementById("errorMessage");
    this.errorText = document.getElementById("errorText");
    this.btnText = this.loginBtn.querySelector(".btn-text");
    this.btnLoader = this.loginBtn.querySelector(".btn-loader");
    this.validator = new FormValidator();
    this.init();
  }

  init() {
    this.form.addEventListener("submit", (e) => this.handleSubmit(e));

    const inputs = this.form.querySelectorAll("input");
    inputs.forEach((input) => {
      input.addEventListener("input", () => this.hideError());
    });
  }

  showError(message) {
    this.errorText.textContent = message;
    this.errorMessage.style.display = "flex";
  }

  hideError() {
    this.errorMessage.style.display = "none";
  }

  setLoading(loading) {
    if (loading) {
      this.loginBtn.disabled = true;
      this.btnText.style.display = "none";
      this.btnLoader.style.display = "block";
    } else {
      this.loginBtn.disabled = false;
      this.btnText.style.display = "block";
      this.btnLoader.style.display = "none";
    }
  }

  async handleSubmit(e) {
    e.preventDefault();
    this.hideError();

    // Validate form
    const validation = this.validator.validate();
    if (!validation.valid) {
      this.showError(validation.message);
      return;
    }

    // Get form data
    const formData = {
      email: document.getElementById("email").value.trim(),
      password: document.getElementById("password").value,
    };

    const rememberMe = document.getElementById("remember").checked;

    // Show loading state
    this.setLoading(true);

    try {
      if (DEMO_MODE) {
        // Demo mode - simulate successful login
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const demoData = {
          success: true,
          user: {
            id: 1,
            email: formData.email,
            username: formData.email.split('@')[0],
            full_name: "Demo User"
          },
          access_token: "demo_token_" + Date.now(),
          refresh_token: "demo_refresh_" + Date.now(),
          expires_in: 86400
        };
        
        this.handleLoginSuccess(demoData, rememberMe);
      } else {
        // Check if backend is available first
        if (!BACKEND_AVAILABLE) {
          const isAvailable = await testBackendConnection();
          if (!isAvailable) {
            this.showError(
              "⚠️ Cannot connect to backend server.\n\n" +
              "Please ensure:\n" +
              "1. Backend server is running: python app.py\n" +
              "2. Server is running on http://localhost:3000\n" +
              "3. MySQL database is running\n\n" +
              "Click 'Test Backend' button in console to diagnose."
            );
            console.error('%c Backend Connection Failed ', 'background: #f44336; color: white; padding: 5px; font-weight: bold;');
            console.log('%c Run this command to test:', 'color: #2196F3; font-weight: bold;');
            console.log('curl http://localhost:3000/health');
            return;
          }
        }

        // Real API call
        const { response, data } = await APIHelper.makeRequest(`${API_BASE_URL}/login`, {
          method: "POST",
          body: JSON.stringify(formData),
        });

        if (response.ok && data.success) {
          this.handleLoginSuccess(data, rememberMe);
        } else {
          this.showError(data.message || "Login failed. Please check your credentials.");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      
      // Provide more specific error messages
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        BACKEND_AVAILABLE = false;
        this.showError(
          "⚠️ Backend server connection failed!\n\n" +
          "Steps to fix:\n" +
          "1. Open terminal in backend folder\n" +
          "2. Run: python app.py\n" +
          "3. Ensure MySQL is running\n" +
          "4. Check if port 3000 is free\n\n" +
          "Open browser console (F12) for more details."
        );
      } else if (error.name === 'TypeError') {
        this.showError("Network error. Please check your internet connection and server status.");
      } else if (error.name === 'AbortError') {
        this.showError("Request timeout. The server took too long to respond.");
      } else {
        this.showError("An unexpected error occurred. Please try again.");
      }
    } finally {
      this.setLoading(false);
    }
  }

  handleLoginSuccess(data, rememberMe) {
    // Store tokens
    this.storeAuthData(data, rememberMe);

    // Send success message to parent
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          action: "loginSuccess",
          user: data.user,
        },
        "*"
      );
    }

    console.log("Login successful!", data.user);

    // For standalone mode
    if (window.parent === window) {
      alert("Login successful!");
      // Redirect to dashboard or appropriate page
      window.location.href = "/dashboard.html";
    }
  }

  storeAuthData(data, rememberMe) {
    const storage = rememberMe ? localStorage : sessionStorage;

    try {
      storage.setItem("access_token", data.access_token);
      storage.setItem("refresh_token", data.refresh_token);
      storage.setItem("user", JSON.stringify(data.user));
      storage.setItem("token_expiry", Date.now() + data.expires_in * 1000);
    } catch (e) {
      console.warn("Failed to store auth data:", e);
    }
  }
}

// ========== Google OAuth Handler ==========
class GoogleOAuthHandler {
  constructor() {
    this.clientId = GOOGLE_CLIENT_ID;
    this.initGoogleButton();
  }

  initGoogleButton() {
    // Load Google Identity Services
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => this.setupGoogleButton();
    script.onerror = () => {
      console.error("Failed to load Google Identity Services");
    };
    document.head.appendChild(script);
  }

  setupGoogleButton() {
    // Find the Google button
    const googleBtn = document.querySelector('.btn-social[aria-label*="Google"]');
    
    if (!googleBtn) {
      console.error("Google button not found");
      return;
    }

    try {
      // Initialize Google Sign-In
      google.accounts.id.initialize({
        client_id: this.clientId,
        callback: (response) => this.handleGoogleLogin(response),
      });

      // Add click handler
      googleBtn.addEventListener("click", (e) => {
        e.preventDefault();
        google.accounts.id.prompt();
      });

      console.log("Google OAuth initialized");
    } catch (error) {
      console.error("Error initializing Google OAuth:", error);
    }
  }

  async handleGoogleLogin(response) {
    try {
      console.log("Google login response received");

      if (DEMO_MODE) {
        alert("Google login (Demo Mode) - Feature will be available when backend is connected");
        return;
      }

      const { response: apiResponse, data } = await APIHelper.makeRequest(`${API_BASE_URL}/auth/google`, {
        method: "POST",
        body: JSON.stringify({
          token: response.credential,
        }),
      });

      if (apiResponse.ok && data.success) {
        // Store tokens
        this.storeAuthData(data);

        // Send success message to parent
        if (window.parent && window.parent !== window) {
          window.parent.postMessage(
            {
              action: "loginSuccess",
              user: data.user,
            },
            "*"
          );
        }

        console.log("Google login successful!", data.user);

        // For standalone mode
        if (window.parent === window) {
          alert("Google login successful!");
          window.location.href = "/dashboard.html";
        }
      } else {
        alert(data.message || "Google login failed");
      }
    } catch (error) {
      console.error("Google login error:", error);
      alert("Google login failed. Please ensure the backend server is running.");
    }
  }

  storeAuthData(data) {
    try {
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token_expiry", Date.now() + data.expires_in * 1000);
    } catch (e) {
      console.warn("Failed to store auth data:", e);
    }
  }
}

// ========== Forgot Password Handler ==========
class ForgotPasswordHandler {
  constructor() {
    this.setupForgotPasswordLink();
  }

  setupForgotPasswordLink() {
    const forgotLink = document.querySelector(".forgot-password");
    if (forgotLink) {
      forgotLink.addEventListener("click", (e) => {
        e.preventDefault();
        this.showForgotPasswordModal();
      });
    }
  }

  showForgotPasswordModal() {
    // Create modal
    const modal = document.createElement("div");
    modal.className = "forgot-password-modal";
    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h2>Reset Password</h2>
          <button class="modal-close" aria-label="Close">&times;</button>
        </div>
        <div class="modal-body">
          <p style="color: var(--text-secondary); margin-bottom: 20px;">
            Enter your email address and we'll send you a link to reset your password.
          </p>
          <form id="forgotPasswordForm">
            <div class="form-group">
              <label for="resetEmail">Email Address</label>
              <div class="input-wrapper">
                <svg class="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" stroke-width="2"/>
                  <polyline points="22,6 12,13 2,6" stroke="currentColor" stroke-width="2"/>
                </svg>
                <input type="email" id="resetEmail" placeholder="Enter your email" required />
              </div>
            </div>
            <div class="error-message" id="resetErrorMessage" style="display: none;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="2"/>
                <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" stroke-width="2"/>
              </svg>
              <span id="resetErrorText"></span>
            </div>
            <div class="success-message" id="resetSuccessMessage" style="display: none;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2"/>
              </svg>
              <span id="resetSuccessText"></span>
            </div>
            <button type="submit" class="btn-login" id="resetBtn">
              <span class="btn-text">Send Reset Link</span>
              <span class="btn-loader" style="display: none;">
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" opacity="0.25"/>
                  <path d="M12 2 A10 10 0 0 1 22 12" stroke="currentColor" stroke-width="2" fill="none"/>
                </svg>
              </span>
            </button>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Add styles if not already present
    if (!document.getElementById("forgot-password-styles")) {
      const styles = document.createElement("style");
      styles.id = "forgot-password-styles";
      styles.textContent = `
        .forgot-password-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
        }
        .modal-content {
          position: relative;
          background: var(--bg-primary);
          border-radius: 12px;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: modalSlideIn 0.3s ease;
        }
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-bottom: 1px solid var(--border-color);
        }
        .modal-header h2 {
          margin: 0;
          color: var(--text-primary);
          font-size: 20px;
        }
        .modal-close {
          background: none;
          border: none;
          font-size: 28px;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all 0.2s;
        }
        .modal-close:hover {
          background: var(--bg-secondary);
          color: var(--text-primary);
        }
        .modal-body {
          padding: 24px;
        }
        .success-message {
          display: none;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: #d4edda;
          color: #155724;
          border-radius: 6px;
          margin-bottom: 16px;
        }
      `;
      document.head.appendChild(styles);
    }

    // Setup event handlers
    const closeBtn = modal.querySelector(".modal-close");
    const overlay = modal.querySelector(".modal-overlay");
    const form = modal.querySelector("#forgotPasswordForm");

    const closeModal = () => modal.remove();
    closeBtn.addEventListener("click", closeModal);
    overlay.addEventListener("click", closeModal);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.handleForgotPassword(modal);
    });
  }

  async handleForgotPassword(modal) {
    const emailInput = modal.querySelector("#resetEmail");
    const submitBtn = modal.querySelector("#resetBtn");
    const btnText = submitBtn.querySelector(".btn-text");
    const btnLoader = submitBtn.querySelector(".btn-loader");
    const errorMsg = modal.querySelector("#resetErrorMessage");
    const errorText = modal.querySelector("#resetErrorText");
    const successMsg = modal.querySelector("#resetSuccessMessage");
    const successText = modal.querySelector("#resetSuccessText");

    const email = emailInput.value.trim();

    // Hide messages
    errorMsg.style.display = "none";
    successMsg.style.display = "none";

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errorText.textContent = "Please enter a valid email address";
      errorMsg.style.display = "flex";
      return;
    }

    // Show loading
    submitBtn.disabled = true;
    btnText.style.display = "none";
    btnLoader.style.display = "block";

    try {
      if (DEMO_MODE) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        successText.textContent = "Password reset link sent! (Demo Mode)";
        successMsg.style.display = "flex";
        emailInput.value = "";
        setTimeout(() => modal.remove(), 3000);
      } else {
        const { response, data } = await APIHelper.makeRequest(`${API_BASE_URL}/forgot-password`, {
          method: "POST",
          body: JSON.stringify({ email }),
        });

        if (response.ok && data.success) {
          successText.textContent = data.message;
          successMsg.style.display = "flex";
          emailInput.value = "";
          
          // Close modal after 3 seconds
          setTimeout(() => modal.remove(), 3000);
        } else {
          errorText.textContent = data.message || "Failed to send reset link";
          errorMsg.style.display = "flex";
        }
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      errorText.textContent = "Cannot connect to server. Please ensure the backend is running.";
      errorMsg.style.display = "flex";
    } finally {
      submitBtn.disabled = false;
      btnText.style.display = "block";
      btnLoader.style.display = "none";
    }
  }
}

// ========== Microsoft OAuth Handler (Placeholder) ==========
class MicrosoftOAuthHandler {
  constructor() {
    this.setupMicrosoftButton();
  }

  setupMicrosoftButton() {
    const microsoftBtn = document.querySelector('.btn-social[aria-label*="Microsoft"]');
    if (microsoftBtn) {
      microsoftBtn.addEventListener("click", () => {
        alert("Microsoft login will be implemented soon!");
      });
    }
  }
}

// ========== Signup Link Handler ==========
class SignupLinkHandler {
  constructor() {
    this.setupSignupLink();
  }

  setupSignupLink() {
    const signupLink = document.getElementById("signupLink");
    if (signupLink) {
      signupLink.addEventListener("click", (e) => {
        e.preventDefault();

        if (window.parent && window.parent !== window) {
          window.parent.postMessage(
            {
              action: "switchToRegister",
            },
            "*"
          );
        } else {
          window.location.href = "registration.html";
        }
      });
    }
  }
}

// ========== Input Focus Animation ==========
class InputAnimations {
  constructor() {
    this.setupInputAnimations();
  }

  setupInputAnimations() {
    const inputs = document.querySelectorAll(".input-wrapper input");

    inputs.forEach((input) => {
      input.addEventListener("focus", (e) => {
        const wrapper = e.target.closest(".input-wrapper");
        const icon = wrapper.querySelector(".input-icon");
        if (icon) {
          icon.style.color = "var(--input-focus)";
        }
      });

      input.addEventListener("blur", (e) => {
        const wrapper = e.target.closest(".input-wrapper");
        const icon = wrapper.querySelector(".input-icon");
        if (icon) {
          icon.style.color = "var(--text-tertiary)";
        }
      });
    });
  }
}

// ========== Initialize Everything ==========
document.addEventListener("DOMContentLoaded", async () => {
  // Hide theme toggle if in iframe
  if (window.parent && window.parent !== window) {
    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
      themeToggle.style.display = "none";
    }
  }

  // Test backend connection on load
  console.log('%c Checking Backend Connection... ', 'background: #2196F3; color: white; padding: 5px; font-weight: bold;');
  await testBackendConnection();

  // Initialize all components
  const themeManager = new ThemeManager();
  window.themeManager = themeManager;

  const passwordToggle = new PasswordToggle();
  const loginHandler = new LoginHandler();
  const googleOAuthHandler = new GoogleOAuthHandler();
  const microsoftOAuthHandler = new MicrosoftOAuthHandler();
  const forgotPasswordHandler = new ForgotPasswordHandler();
  const signupLinkHandler = new SignupLinkHandler();
  const inputAnimations = new InputAnimations();

  console.log("Login page initialized with theme:", themeManager.currentTheme);
  console.log("Google OAuth ready with client ID:", GOOGLE_CLIENT_ID);
  console.log("Demo Mode:", DEMO_MODE ? "ENABLED" : "DISABLED");
  console.log("Backend Status:", BACKEND_AVAILABLE ? "✓ ONLINE" : "✗ OFFLINE");
  
  if (!DEMO_MODE && !BACKEND_AVAILABLE) {
    console.error('%c ⚠️ Backend Server Not Running! ', 'background: #f44336; color: white; padding: 10px; font-size: 14px; font-weight: bold;');
    console.log('%c Fix Steps: ', 'color: #4CAF50; font-weight: bold; font-size: 12px;');
    console.log('1. cd backend');
    console.log('2. python app.py');
    console.log('3. Ensure MySQL is running');
    console.log('4. Refresh this page');
    console.log('');
    console.log('%c Test Backend: ', 'color: #2196F3; font-weight: bold;');
    console.log('curl http://localhost:3000/health');
  }
  
  // Add test backend function to window for easy access
  window.testBackend = testBackendConnection;
});