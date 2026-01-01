// ============================================
// CONTACT US PAGE JAVASCRIPT
// Handles form submission, validation, and integrations
// ============================================

// Global theme state (in-memory, no localStorage)
window.appTheme = {
  current: "light",
  toggle: function () {
    this.current = this.current === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", this.current);
  },
  set: function (theme) {
    this.current = theme;
    document.documentElement.setAttribute("data-theme", theme);
  },
  get: function () {
    return this.current;
  },
};

// ============================================
// LOAD HEADER AND SIDEBAR
// ============================================

document.addEventListener("DOMContentLoaded", () => {
  // Load Header
  fetch("Header.html")
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.text();
    })
    .then((data) => {
      const headerElement = document.getElementById("header");
      if (headerElement) {
        headerElement.innerHTML = data;

        // Initialize header after DOM is inserted
        const script = document.createElement("script");
        script.src = "JS/header.js";
        script.onload = () => {
          console.log("Header loaded successfully");
          initContactPage();
        };
        script.onerror = () => console.error("Failed to load header.js");
        document.body.appendChild(script);
      }
    })
    .catch((error) => console.error("Error loading header:", error));

  // Load Sidebar
  fetch("Sidebar.html")
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.text();
    })
    .then((data) => {
      const sidebarElement = document.getElementById("sidebar");
      if (sidebarElement) {
        sidebarElement.innerHTML = data;

        // Initialize sidebar after DOM is inserted
        const script = document.createElement("script");
        script.src = "JS/Sidebar.js";
        script.onload = () => console.log("Sidebar loaded successfully");
        script.onerror = () => console.error("Failed to load Sidebar.js");
        document.body.appendChild(script);
      }
    })
    .catch((error) => console.error("Error loading sidebar:", error));
});

// ============================================
// CONTACT PAGE INITIALIZATION
// ============================================

function initContactPage() {
  console.log("Contact page initialized");

  // Initialize form validation
  initFormValidation();

  // Initialize form submission
  initFormSubmission();

  // Add smooth scroll for anchor links
  initSmoothScroll();

  // Initialize intersection observer for animations
  initScrollAnimations();

  // Add contact card interactions
  initContactCardInteractions();
}

// ============================================
// FORM VALIDATION
// ============================================

function initFormValidation() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const inputs = form.querySelectorAll(".form-input, .form-textarea");

  inputs.forEach((input) => {
    // Real-time validation on blur
    input.addEventListener("blur", () => {
      validateField(input);
    });

    // Clear error on focus
    input.addEventListener("focus", () => {
      clearFieldError(input);
    });

    // Real-time validation while typing (debounced)
    let typingTimer;
    input.addEventListener("input", () => {
      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => {
        if (input.value.trim() !== "") {
          validateField(input);
        }
      }, 500);
    });
  });
}

function validateField(field) {
  const value = field.value.trim();
  const fieldName = field.name;
  let isValid = true;
  let errorMessage = "";

  // Clear previous error
  clearFieldError(field);

  // Validation rules
  if (fieldName === "name") {
    if (value.length < 2) {
      isValid = false;
      errorMessage = "Name must be at least 2 characters";
    } else if (!/^[a-zA-Z\s]+$/.test(value)) {
      isValid = false;
      errorMessage = "Name can only contain letters and spaces";
    }
  } else if (fieldName === "email") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      isValid = false;
      errorMessage = "Please enter a valid email address";
    }
  } else if (fieldName === "subject") {
    if (value.length < 3) {
      isValid = false;
      errorMessage = "Subject must be at least 3 characters";
    }
  } else if (fieldName === "message") {
    if (value.length < 10) {
      isValid = false;
      errorMessage = "Message must be at least 10 characters";
    }
  }

  // Show error if invalid
  if (!isValid) {
    showFieldError(field, errorMessage);
  } else {
    showFieldSuccess(field);
  }

  return isValid;
}

function showFieldError(field, message) {
  field.classList.add("error");
  field.classList.remove("success");

  // Add error message if it doesn't exist
  let errorEl = field.parentElement.querySelector(".error-message");
  if (!errorEl) {
    errorEl = document.createElement("span");
    errorEl.className = "error-message";
    field.parentElement.appendChild(errorEl);
  }
  errorEl.textContent = message;
  errorEl.style.display = "block";
}

function showFieldSuccess(field) {
  field.classList.add("success");
  field.classList.remove("error");
  clearFieldError(field);
}

function clearFieldError(field) {
  field.classList.remove("error", "success");
  const errorEl = field.parentElement.querySelector(".error-message");
  if (errorEl) {
    errorEl.style.display = "none";
  }
}

// Add error/success styles dynamically
const style = document.createElement("style");
style.textContent = `
  .form-input.error,
  .form-textarea.error {
    border-color: #ef4444 !important;
    animation: shake 0.3s ease;
  }

  .form-input.success,
  .form-textarea.success {
    border-color: #10b981 !important;
  }

  .error-message {
    color: #ef4444;
    font-size: 13px;
    margin-top: 6px;
    display: none;
    animation: slideDown 0.3s ease;
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-10px); }
    75% { transform: translateX(10px); }
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(style);

// ============================================
// FORM SUBMISSION
// ============================================

function initFormSubmission() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validate all fields
    const inputs = form.querySelectorAll(".form-input, .form-textarea");
    let isFormValid = true;

    inputs.forEach((input) => {
      if (!validateField(input)) {
        isFormValid = false;
      }
    });

    if (!isFormValid) {
      showNotification("Please fix the errors in the form", "error");
      return;
    }

    // Get form data
    const formData = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      subject: form.subject.value.trim(),
      message: form.message.value.trim(),
      timestamp: new Date().toISOString(),
    };

    // Show loading state
    const submitBtn = form.querySelector(".form-submit");
    const originalBtnContent = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="spinner">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" stroke-opacity="0.3"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      </svg>
      <span>Sending...</span>
    `;

    // Add spinner animation
    const spinnerStyle = document.createElement("style");
    spinnerStyle.textContent = `
      .spinner {
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(spinnerStyle);

    try {
      // Simulate API call (replace with actual API endpoint)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Success
      console.log("Form submitted:", formData);
      showNotification("Message sent successfully! We'll get back to you soon.", "success");

      // Reset form
      form.reset();
      inputs.forEach((input) => clearFieldError(input));

      // Add confetti effect
      createConfetti();
    } catch (error) {
      console.error("Error submitting form:", error);
      showNotification("Failed to send message. Please try again.", "error");
    } finally {
      // Restore button
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnContent;
    }
  });
}

// ============================================
// NOTIFICATION SYSTEM
// ============================================

function showNotification(message, type = "info") {
  // Remove existing notifications
  const existing = document.querySelectorAll(".notification");
  existing.forEach((n) => n.remove());

  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;

  const icons = {
    success: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
      <path d="M8 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    error: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
      <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
    info: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
      <path d="M12 16v-4M12 8h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
  };

  notification.innerHTML = `
    <div class="notification-icon">${icons[type]}</div>
    <div class="notification-message">${message}</div>
    <button class="notification-close">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>
  `;

  // Add notification styles
  const notificationStyle = document.createElement("style");
  notificationStyle.textContent = `
    .notification {
      position: fixed;
      top: 100px;
      right: 20px;
      background: var(--bg-primary);
      border: 2px solid;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 300px;
      max-width: 500px;
      animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .notification-success {
      border-color: #10b981;
      color: #10b981;
    }

    .notification-error {
      border-color: #ef4444;
      color: #ef4444;
    }

    .notification-info {
      border-color: #3b82f6;
      color: #3b82f6;
    }

    .notification-icon {
      flex-shrink: 0;
    }

    .notification-message {
      flex: 1;
      color: var(--text-primary);
      font-size: 14px;
      font-weight: 500;
    }

    .notification-close {
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--text-secondary);
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .notification-close:hover {
      background: var(--bg-secondary);
      color: var(--text-primary);
    }

    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOutRight {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }

    @media (max-width: 640px) {
      .notification {
        top: 80px;
        right: 10px;
        left: 10px;
        min-width: auto;
      }
    }
  `;
  document.head.appendChild(notificationStyle);

  document.body.appendChild(notification);

  // Close button functionality
  const closeBtn = notification.querySelector(".notification-close");
  closeBtn.addEventListener("click", () => {
    notification.style.animation = "slideOutRight 0.3s ease forwards";
    setTimeout(() => notification.remove(), 300);
  });

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.style.animation = "slideOutRight 0.3s ease forwards";
      setTimeout(() => notification.remove(), 300);
    }
  }, 5000);
}

// ============================================
// CONFETTI EFFECT
// ============================================

function createConfetti() {
  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
  const confettiCount = 50;

  for (let i = 0; i < confettiCount; i++) {
    setTimeout(() => {
      const confetti = document.createElement("div");
      confetti.className = "confetti";
      confetti.style.cssText = `
        position: fixed;
        width: 10px;
        height: 10px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        left: ${Math.random() * 100}%;
        top: -10px;
        opacity: 1;
        border-radius: ${Math.random() > 0.5 ? "50%" : "0"};
        z-index: 9999;
        pointer-events: none;
        animation: confettiFall ${2 + Math.random() * 2}s ease-in-out forwards;
      `;

      document.body.appendChild(confetti);

      setTimeout(() => confetti.remove(), 4000);
    }, i * 30);
  }

  const confettiStyle = document.createElement("style");
  confettiStyle.textContent = `
    @keyframes confettiFall {
      to {
        transform: translateY(100vh) rotate(${360 + Math.random() * 360}deg);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(confettiStyle);
}

// ============================================
// SMOOTH SCROLL
// ============================================

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (href === "#") return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });
}

// ============================================
// SCROLL ANIMATIONS
// ============================================

function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
      }
    });
  }, observerOptions);

  // Observe elements
  const elements = document.querySelectorAll(
    ".contact-card, .contact-form-section, .map-section"
  );
  elements.forEach((el) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(20px)";
    el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
    observer.observe(el);
  });
}

// ============================================
// CONTACT CARD INTERACTIONS
// ============================================

function initContactCardInteractions() {
  const cards = document.querySelectorAll(".contact-card");

  cards.forEach((card) => {
    // Add click ripple effect
    card.addEventListener("click", function (e) {
      const ripple = document.createElement("span");
      const rect = this.getBoundingClientRect();
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

      const rippleStyle = document.createElement("style");
      rippleStyle.textContent = `
        @keyframes ripple {
          to {
            transform: scale(2);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(rippleStyle);

      this.style.position = "relative";
      this.style.overflow = "hidden";
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });

    // Track card button clicks
    const button = card.querySelector(".card-button");
    if (button) {
      button.addEventListener("click", (e) => {
        const cardTitle = card.querySelector(".card-title").textContent;
        console.log(`Contact card clicked: ${cardTitle}`);
        
        // Analytics tracking could go here
        // Example: trackEvent('contact_click', { method: cardTitle });
      });
    }
  });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Format phone number
function formatPhoneNumber(phone) {
  const cleaned = phone.replace(/\D/g, "");
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return "(" + match[1] + ") " + match[2] + "-" + match[3];
  }
  return phone;
}

// Copy to clipboard
function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      showNotification("Copied to clipboard!", "success");
    })
    .catch((err) => {
      console.error("Failed to copy:", err);
      showNotification("Failed to copy", "error");
    });
}

// Export functions for external use
window.contactPage = {
  showNotification,
  copyToClipboard,
  formatPhoneNumber,
};

console.log("Contact Us page script loaded successfully");