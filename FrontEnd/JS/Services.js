// ============================================
// SERVICES PAGE JAVASCRIPT
// Handles service booking and page interactions
// ============================================

// Book Service Function - Redirects to place_service.html with selected service
function bookService(serviceName) {
  // Check if user is logged in
  const isLoggedIn = checkUserLogin();

  if (!isLoggedIn) {
    // Show login prompt if not logged in
    showNotification(
      "Please login to book a service",
      "warning"
    );

    // Open login modal after a short delay
    setTimeout(() => {
      if (window.authManager) {
        window.authManager.openAuthModal("login");
      } else if (window.sidebarManager) {
        window.sidebarManager.openAuthModal("login");
      }
    }, 500);
    return;
  }

  // Store selected service in sessionStorage for the booking page
  try {
    const serviceData = {
      name: serviceName,
      timestamp: new Date().toISOString(),
    };
    sessionStorage.setItem("selectedService", JSON.stringify(serviceData));
  } catch (e) {
    console.warn("Could not save service selection:", e);
  }

  // Show success message
  showNotification(`Redirecting to book ${serviceName}...`, "success");

  // Redirect to place_service.html after a short delay
  setTimeout(() => {
    window.location.href = "place_service.html";
  }, 800);
}

// Check if user is logged in
function checkUserLogin() {
  try {
    const token = localStorage.getItem("access_token");
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    return !!(token && isLoggedIn);
  } catch (e) {
    console.warn("Could not check login status:", e);
    return false;
  }
}

// Show notification message
function showNotification(message, type = "info") {
  // Remove existing notification if any
  const existingNotification = document.querySelector(".service-notification");
  if (existingNotification) {
    existingNotification.remove();
  }

  // Create notification element
  const notification = document.createElement("div");
  notification.className = "service-notification";
  notification.textContent = message;

  // Set notification style based on type
  let backgroundColor;
  switch (type) {
    case "success":
      backgroundColor = "#10b981";
      break;
    case "error":
      backgroundColor = "#ef4444";
      break;
    case "warning":
      backgroundColor = "#f59e0b";
      break;
    default:
      backgroundColor = "#3b82f6";
  }

  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: ${backgroundColor};
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    z-index: 10000;
    font-weight: 600;
    font-size: 15px;
    animation: slideInRight 0.4s ease, slideOutRight 0.4s ease 2.6s;
    max-width: 350px;
  `;

  // Add animation styles if not already present
  if (!document.querySelector("[data-notification-animation]")) {
    const style = document.createElement("style");
    style.setAttribute("data-notification-animation", "");
    style.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(400px);
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
          transform: translateX(400px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  // Remove notification after 3 seconds
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Add smooth scroll behavior for internal links
function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (href !== "#" && href.length > 1) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }
    });
  });
}

// Add ripple effect to buttons
function createRipple(event, button) {
  const ripple = document.createElement("span");
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;

  ripple.style.cssText = `
    position: absolute;
    width: ${size}px;
    height: ${size}px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);
    left: ${x}px;
    top: ${y}px;
    pointer-events: none;
    animation: rippleEffect 0.6s ease-out;
  `;

  if (!document.querySelector("[data-ripple-animation]")) {
    const style = document.createElement("style");
    style.setAttribute("data-ripple-animation", "");
    style.textContent = `
      @keyframes rippleEffect {
        to {
          transform: scale(2);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  button.style.position = "relative";
  button.style.overflow = "hidden";
  button.appendChild(ripple);

  setTimeout(() => ripple.remove(), 600);
}

// Setup ripple effect on all book buttons
function setupRippleEffects() {
  document.querySelectorAll(".btn-book-service").forEach((button) => {
    button.addEventListener("click", function (e) {
      createRipple(e, this);
    });
  });
}

// Track page views and service interactions
function trackServiceView(serviceName) {
  console.log(`Service viewed: ${serviceName}`);
  // You can add analytics tracking here
}

// Initialize scroll animations for service cards
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -100px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
      }
    });
  }, observerOptions);

  document.querySelectorAll(".service-card").forEach((card) => {
    observer.observe(card);
  });
}

// Get popular services based on user preferences or defaults
function highlightPopularServices() {
  const popularServices = ["Dry Cleaning", "Wash & Iron", "Express Service"];

  document.querySelectorAll(".service-card").forEach((card) => {
    const serviceName = card.querySelector(".service-name").textContent;
    if (popularServices.includes(serviceName) && !card.classList.contains("featured")) {
      // Add subtle highlight to popular services
      card.style.borderColor = "rgba(59, 130, 246, 0.3)";
    }
  });
}

// Search and filter services (for future implementation)
function filterServices(searchTerm) {
  const cards = document.querySelectorAll(".service-card");
  const normalizedSearch = searchTerm.toLowerCase().trim();

  cards.forEach((card) => {
    const serviceName = card.querySelector(".service-name").textContent.toLowerCase();
    const serviceDesc = card.querySelector(".service-description").textContent.toLowerCase();

    if (serviceName.includes(normalizedSearch) || serviceDesc.includes(normalizedSearch)) {
      card.style.display = "flex";
      card.style.animation = "fadeInUp 0.4s ease";
    } else {
      card.style.display = "none";
    }
  });
}

// Add keyboard navigation support
function setupKeyboardNavigation() {
  document.addEventListener("keydown", (e) => {
    // Press 'B' to focus on first book button
    if (e.key === "b" || e.key === "B") {
      const firstBookButton = document.querySelector(".btn-book-service");
      if (firstBookButton) {
        firstBookButton.focus();
      }
    }
  });
}

// Update page title based on scroll position
function updatePageTitle() {
  let ticking = false;

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const scrollPosition = window.scrollY;
        const heroSection = document.querySelector(".services-hero");

        if (heroSection) {
          const heroHeight = heroSection.offsetHeight;
          if (scrollPosition > heroHeight) {
            document.title = "Browse Services - Quick Laundry";
          } else {
            document.title = "Our Services - Quick Laundry";
          }
        }

        ticking = false;
      });

      ticking = true;
    }
  });
}

// Initialize page when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("Services page loaded");

  // Setup all interactions
  setupSmoothScroll();
  setupRippleEffects();
  setupKeyboardNavigation();
  highlightPopularServices();
  updatePageTitle();

  // Initialize scroll animations after a short delay
  setTimeout(() => {
    initScrollAnimations();
  }, 100);

  // Log page view
  console.log("Services page ready");

  // Check if user came from a specific referrer
  const referrer = document.referrer;
  if (referrer.includes("Home.html") || referrer.includes("index.html")) {
    console.log("User navigated from home page");
  }
});

// Handle page visibility changes
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    console.log("Services page hidden");
  } else {
    console.log("Services page visible");
  }
});

// Export functions for potential use in other scripts
if (typeof window !== "undefined") {
  window.servicesPage = {
    bookService,
    filterServices,
    showNotification,
    checkUserLogin,
  };
}

// Add window load event for final adjustments
window.addEventListener("load", () => {
  console.log("All services page resources loaded");

  // Ensure all images and icons are loaded
  const serviceCards = document.querySelectorAll(".service-card");
  console.log(`Total services displayed: ${serviceCards.length}`);
});

// Handle navigation events
window.addEventListener("popstate", (event) => {
  console.log("Browser back/forward button pressed");
  // You can add custom logic here if needed
});

// Performance monitoring
if (window.performance) {
  window.addEventListener("load", () => {
    const perfData = window.performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    console.log(`Page load time: ${pageLoadTime}ms`);
  });
}