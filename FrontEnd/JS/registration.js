// FIXED VERSION - registration.js with improved error handling and backend wake-up

let currentStep = 1;
const totalSteps = 3;
let otpSent = false;
let otpVerified = false;

// API Configuration - FIXED for deployment
const API_BASE_URL = 'https://quick-laundry-backend.onrender.com/api';

console.log('API Base URL:', API_BASE_URL);

// Function to wake up Render backend (it sleeps after inactivity)
async function wakeUpBackend() {
  console.log('🔄 Checking backend server...');
  try {
    // Try the root endpoint first (which we know works from logs)
    const response = await fetch('https://quick-laundry-backend.onrender.com/', {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/json'
      }
    });
    
    if (response.ok) {
      console.log('✅ Backend is awake and ready!');
      return true;
    }
    
    console.warn('⚠️ Backend responded but not OK:', response.status);
    return false;
  } catch (error) {
    console.error('❌ Failed to reach backend:', error.message);
    return false;
  }
}

// ===== THEME MANAGEMENT =====
class ThemeManager {
  constructor() {
    this.currentTheme =
      this.getStoredTheme() || this.getParentTheme() || "light";
    this.init();
  }

  init() {
    this.applyTheme(this.currentTheme);
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

  applyTheme(theme) {
    this.currentTheme = theme;
    document.documentElement.setAttribute("data-theme", theme);
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

// ===== INITIALIZATION =====
document.addEventListener("DOMContentLoaded", async function () {
  console.log("QuickLaundry Registration initialized");
  console.log("Deployed Mode - Using Render Backend");

  // Show initial loading message
  showLoadingMessage("Connecting to server...");

  // Wake up backend first
  const isBackendReady = await wakeUpBackend();
  
  hideLoadingMessage();
  
  if (!isBackendReady) {
    showWarning(
      "Backend Starting Up",
      "The server is starting up (this takes 30-60 seconds on first load). Please wait a moment and try again."
    );
  }

  const themeManager = new ThemeManager();
  window.themeManager = themeManager;

  updateProgress();
  setupEventListeners();
  setupOtpInputs();
  setupSigninLink();
});

// Loading message functions
function showLoadingMessage(message) {
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'backend-loading';
  loadingDiv.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    color: white;
    font-size: 18px;
    flex-direction: column;
    gap: 20px;
  `;
  loadingDiv.innerHTML = `
    <div style="text-align: center;">
      <div style="font-size: 48px; margin-bottom: 20px;">⏳</div>
      <div>${message}</div>
      <div style="margin-top: 10px; font-size: 14px; opacity: 0.7;">
        Free tier servers take 30-60 seconds to wake up...
      </div>
    </div>
  `;
  document.body.appendChild(loadingDiv);
}

function hideLoadingMessage() {
  const loadingDiv = document.getElementById('backend-loading');
  if (loadingDiv) {
    loadingDiv.remove();
  }
}

function setupEventListeners() {
  const form = document.getElementById("registrationForm");

  document.querySelectorAll("input, select, textarea").forEach((field) => {
    field.addEventListener("input", function () {
      this.closest(".form-group")?.classList.remove("error");
    });
    field.addEventListener("change", function () {
      this.closest(".form-group")?.classList.remove("error");
    });
  });

  form.addEventListener("submit", handleFormSubmit);
}

// ===== SIGNIN LINK HANDLER =====
function setupSigninLink() {
  const signinLink = document.getElementById("signinLink");
  if (signinLink) {
    signinLink.addEventListener("click", function (e) {
      e.preventDefault();

      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          {
            action: "switchToLogin",
          },
          "*"
        );
      } else {
        window.location.href = "login.html";
      }
    });
  }
}

// ===== OTP INPUT HANDLING =====
function setupOtpInputs() {
  const otpInputs = document.querySelectorAll(".otp-input");

  otpInputs.forEach((input, index) => {
    input.addEventListener("input", function (e) {
      let cleaned = e.target.value.replace(/\D/g, "");
      e.target.value = cleaned;

      if (cleaned.length === 1) {
        e.target.classList.add("filled");
      } else {
        e.target.classList.remove("filled");
      }

      if (cleaned && index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      }

      checkOtpComplete();
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "Backspace" && !e.target.value && index > 0) {
        otpInputs[index - 1].focus();
      }
    });

    input.addEventListener("paste", function (e) {
      e.preventDefault();
      const pastedData = e.clipboardData.getData("text").replace(/\D/g, "");

      if (pastedData.length === 6) {
        otpInputs.forEach((inp, i) => {
          inp.value = pastedData[i] || "";
          if (inp.value) {
            inp.classList.add("filled");
          }
        });
        otpInputs[5].focus();
        checkOtpComplete();
      }
    });
  });
}

function getOtpValue() {
  const otpInputs = document.querySelectorAll(".otp-input");
  return Array.from(otpInputs)
    .map((input) => input.value)
    .join("");
}

function clearOtpInputs() {
  const otpInputs = document.querySelectorAll(".otp-input");
  otpInputs.forEach((input) => {
    input.value = "";
    input.classList.remove("filled");
  });
}

function checkOtpComplete() {
  const otp = getOtpValue();
  console.log("OTP entered:", otp, "Length:", otp.length);
  
  if (otp.length === 6) {
    verifyOtp(otp);
  }
}

// ===== LOCK EMAIL AND USERNAME AFTER OTP VERIFICATION =====
function lockEmailAndUsername() {
  const emailInput = document.getElementById("email");
  const usernameInput = document.getElementById("username");
  
  if (emailInput) {
    emailInput.disabled = true;
    emailInput.style.opacity = "0.6";
    emailInput.style.cursor = "not-allowed";
  }
  
  if (usernameInput) {
    usernameInput.disabled = true;
    usernameInput.style.opacity = "0.6";
    usernameInput.style.cursor = "not-allowed";
  }
}

// ===== OTP SEND FUNCTION - FIXED =====
async function sendOtp() {
  const email = document.getElementById("email").value;

  if (!email || !isValidEmail(email)) {
    if (typeof showError === 'function') {
      showError(
        "Invalid Email",
        "Please enter a valid email address first"
      );
    } else {
      alert("Please enter a valid email address first");
    }
    return;
  }

  const sendBtn = document.getElementById("sendOtpBtn");
  const originalText = sendBtn.innerHTML;

  sendBtn.disabled = true;
  sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

  try {
    console.log('📧 Sending OTP to:', email);
    console.log('🌐 API URL:', `${API_BASE_URL}/send-otp`);

    // Show sending message
    showOtpStatus("📤 Sending OTP...", "info");

    const response = await fetch(`${API_BASE_URL}/send-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ email }),
    });

    console.log('📨 Response status:', response.status);

    // Check content type
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error('❌ Non-JSON response:', text);
      throw new Error("Server returned invalid response. Backend may be starting up.");
    }

    const data = await response.json();
    console.log('📦 Response data:', data);

    if (data.success) {
      otpSent = true;
      showOtpStatus("✅ OTP sent successfully! Check your email.", "success");
      startOtpTimer(sendBtn);
      
      if (typeof showSuccess === 'function') {
        showSuccess(
          "OTP Sent!",
          "A 6-digit verification code has been sent to your email address. Please check your inbox (and spam folder)."
        );
      }
    } else {
      showOtpStatus(data.message || "Failed to send OTP. Please try again.", "error");
      sendBtn.disabled = false;
      sendBtn.innerHTML = originalText;
      
      if (typeof showError === 'function') {
        showError(
          "Failed to Send OTP",
          data.message || "Unable to send verification code. Please try again."
        );
      } else {
        alert(data.message || "Failed to send OTP");
      }
    }
  } catch (error) {
    console.error("❌ Send OTP error:", error);
    
    let errorMessage = "";
    
    // Check if it's a network error
    if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
      errorMessage = "⏳ Cannot reach server. This usually means:\n\n1. The server is waking up (wait 30 seconds)\n2. Network connectivity issue\n3. CORS configuration problem\n\nPlease try again in 30 seconds.";
    } else if (error.message.includes("starting up") || error.message.includes("invalid response")) {
      errorMessage = "⏳ Server is starting up. Please wait 30 seconds and click 'Send OTP' again.";
    } else {
      errorMessage = `Error: ${error.message}\n\nPlease try again.`;
    }
    
    showOtpStatus(errorMessage, "error");
    sendBtn.disabled = false;
    sendBtn.innerHTML = originalText;
    
    if (typeof showError === 'function') {
      showError(
        "Connection Error",
        errorMessage
      );
    } else {
      alert(errorMessage);
    }
  }
}

// ===== OTP VERIFICATION - FIXED =====
async function verifyOtp(otp) {
  const email = document.getElementById("email").value;
  
  if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
    showOtpStatus("Please enter a valid 6-digit OTP", "error");
    return;
  }

  try {
    console.log("🔐 Verifying OTP:", otp, "for email:", email);
    
    const response = await fetch(`${API_BASE_URL}/verify-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ email, otp }),
    });

    console.log('✅ Verify response status:', response.status);

    const data = await response.json();
    console.log("📦 Verify OTP response:", data);

    if (data.success) {
      otpVerified = true;
      showOtpStatus("✅ Email verified successfully!", "success");
      document.querySelector(".otp-section").classList.remove("error");

      document.querySelectorAll(".otp-input").forEach((input) => {
        input.disabled = true;
      });
      document.getElementById("sendOtpBtn").disabled = true;
      
      lockEmailAndUsername();
      
      if (typeof showSuccess === 'function') {
        showSuccess(
          "Email Verified!",
          "Your email has been successfully verified. You can now proceed with registration."
        );
      }
    } else {
      otpVerified = false;
      showOtpStatus(data.message || "Invalid OTP. Please try again.", "error");
      clearOtpInputs();
      document.querySelector(".otp-section").classList.add("error");
      
      document.querySelector(".otp-input").focus();
      
      if (typeof showError === 'function') {
        showError(
          "Invalid OTP",
          data.message || "The verification code you entered is incorrect. Please try again."
        );
      }
    }
  } catch (error) {
    console.error("❌ Verify OTP error:", error);
    showOtpStatus("Connection error. Please try again.", "error");
    otpVerified = false;
    
    if (typeof showError === 'function') {
      showError(
        "Verification Failed",
        `Unable to verify OTP. Error: ${error.message}`
      );
    }
  }
}

// ===== REST OF THE CODE (unchanged) =====
function startOtpTimer(button) {
  let timeLeft = 60;

  const interval = setInterval(() => {
    timeLeft--;
    button.innerHTML = `<i class="fas fa-clock"></i> Resend in ${timeLeft}s`;

    if (timeLeft <= 0) {
      clearInterval(interval);
      button.disabled = false;
      button.innerHTML = '<i class="fas fa-paper-plane"></i> Resend OTP';
    }
  }, 1000);
}

function showOtpStatus(message, type) {
  const statusDiv = document.getElementById("otpStatus");
  statusDiv.textContent = message;
  statusDiv.className = `otp-status ${type}`;
}

function updateProgress() {
  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;
  const progressFill = document.getElementById("progressFill");
  progressFill.style.width = progressPercentage + "%";

  document.querySelectorAll(".step-dot").forEach((dot, index) => {
    const stepNum = index + 1;
    dot.classList.remove("active", "completed");

    if (stepNum === currentStep) {
      dot.classList.add("active");
    } else if (stepNum < currentStep) {
      dot.classList.add("completed");
      dot.innerHTML = '<i class="fas fa-check"></i>';
    } else {
      dot.textContent = stepNum;
    }
  });

  const backBtn = document.getElementById("backBtn");
  const nextBtn = document.getElementById("nextBtn");
  const submitBtn = document.getElementById("submitBtn");

  if (currentStep === 1) {
    backBtn.style.display = "none";
  } else {
    backBtn.style.display = "block";
  }

  if (currentStep === totalSteps) {
    nextBtn.style.display = "none";
    submitBtn.style.display = "block";
  } else {
    nextBtn.style.display = "block";
    submitBtn.style.display = "none";
  }

  document.querySelectorAll(".form-step").forEach((step) => {
    step.classList.remove("active");
  });
  document
    .querySelector(`.form-step[data-step="${currentStep}"]`)
    .classList.add("active");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function nextStep() {
  if (validateStep(currentStep)) {
    if (currentStep < totalSteps) {
      currentStep++;
      updateProgress();
    }
  }
}

function previousStep() {
  if (currentStep > 1) {
    currentStep--;
    updateProgress();
  }
}

function validateStep(step) {
  let isValid = true;

  if (step === 1) {
    const email = document.getElementById("email");
    if (!email.value || !isValidEmail(email.value)) {
      email.closest(".form-group").classList.add("error");
      isValid = false;
    }

    const username = document.getElementById("username");
    if (!username.value || !/^[a-zA-Z0-9_]{3,50}$/.test(username.value)) {
      username.closest(".form-group").classList.add("error");
      isValid = false;
    }

    const phone = document.getElementById("phone");
    if (!phone.value || !/^[\d\s+().-]{10,15}$/.test(phone.value)) {
      phone.closest(".form-group").classList.add("error");
      isValid = false;
    }

    const password = document.getElementById("password");
    if (
      !password.value ||
      !/^(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])(?=\S+$).{8,50}$/.test(
        password.value
      )
    ) {
      password.closest(".form-group").classList.add("error");
      isValid = false;
    }

    const confirmPassword = document.getElementById("confirmPassword");
    if (password.value !== confirmPassword.value) {
      confirmPassword.closest(".form-group").classList.add("error");
      isValid = false;
    }
  }

  if (step === 2) {
    const fullName = document.getElementById("fullName");
    if (fullName.value && !/^[a-zA-Z\s]+$/.test(fullName.value)) {
      fullName.closest(".form-group").classList.add("error");
      isValid = false;
    }

    const address = document.getElementById("address");
    if (!address.value) {
      address.closest(".form-group").classList.add("error");
      isValid = false;
    }

    const city = document.getElementById("city");
    if (!city.value) {
      city.closest(".form-group").classList.add("error");
      isValid = false;
    }

    const pincode = document.getElementById("pincode");
    if (!pincode.value || !/^\d{5,6}$/.test(pincode.value)) {
      pincode.closest(".form-group").classList.add("error");
      isValid = false;
    }
  }

  if (step === 3) {
    if (!otpVerified) {
      document.querySelector(".otp-section").classList.add("error");
      if (!otpSent) {
        showOtpStatus("Please send and verify OTP before proceeding", "error");
      } else {
        showOtpStatus("Please verify the OTP sent to your email", "error");
      }
      isValid = false;
    }

    const terms = document.getElementById("terms");
    if (!terms.checked) {
      if (typeof showWarning === 'function') {
        showWarning(
          "Terms & Conditions",
          "Please accept the Terms of Service & Privacy Policy to continue."
        );
      } else {
        alert("Please accept the Terms of Service & Privacy Policy to continue.");
      }
      isValid = false;
    }
  }

  return isValid;
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function togglePassword(fieldId) {
  const field = document.getElementById(fieldId);
  const icon = field.nextElementSibling;

  if (field.type === "password") {
    field.type = "text";
    icon.innerHTML = '<i class="fas fa-eye-slash"></i>';
  } else {
    field.type = "password";
    icon.innerHTML = '<i class="fas fa-eye"></i>';
  }
}

function previewImage(event) {
  const file = event.target.files[0];
  const preview = document.getElementById("preview");
  const placeholder = document.getElementById("uploadPlaceholder");

  if (!file) return;

  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  const maxSize = 5 * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    if (typeof showError === 'function') {
      showError(
        "Invalid File Type",
        "Please upload a valid image file (JPG, PNG, GIF, or WEBP)."
      );
    } else {
      alert("Please upload a valid image file (JPG, PNG, GIF, or WEBP).");
    }
    event.target.value = "";
    preview.style.display = "none";
    placeholder.style.display = "flex";
    return;
  }

  if (file.size > maxSize) {
    if (typeof showError === 'function') {
      showError(
        "File Too Large",
        "File size exceeds 5 MB. Please choose a smaller image."
      );
    } else {
      alert("File size exceeds 5 MB. Please choose a smaller image.");
    }
    event.target.value = "";
    preview.style.display = "none";
    placeholder.style.display = "flex";
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    preview.src = e.target.result;
    preview.style.display = "block";
    placeholder.style.display = "none";
  };
  reader.readAsDataURL(file);
}

async function handleFormSubmit(e) {
  e.preventDefault();

  if (!validateStep(3)) {
    return;
  }

  const formData = {
    email: document.getElementById("email").value.toLowerCase().trim(),
    username: document.getElementById("username").value.trim(),
    password: document.getElementById("password").value,
    phone: document.getElementById("phone").value.trim(),
    full_name: document.getElementById("fullName").value.trim() || null,
    address: document.getElementById("address").value.trim(),
    city: document.getElementById("city").value.trim(),
    pincode: document.getElementById("pincode").value.trim(),
    service_type: document.querySelector('input[name="serviceType"]:checked').value,
    communication_preference: document.querySelector('input[name="communication"]:checked').value,
    subscribe_newsletter: document.getElementById("newsletter").checked,
    profile_picture: document.getElementById("profilePic").files[0]?.name || null,
    otp_verified: otpVerified,
  };

  console.log("📝 Form Data:", formData);

  const submitBtn = document.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';

  if (typeof showLoading === 'function') {
    showLoading("Creating your account...");
  }

  try {
    console.log('🚀 Submitting registration to:', `${API_BASE_URL}/register`);
    
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(formData),
    });

    console.log('📨 Registration response status:', response.status);
    
    const data = await response.json();
    console.log("📦 Registration response:", data);

    setTimeout(() => {
      if (typeof closePopup === 'function') {
        closePopup();
      }

      if (response.ok && data.success) {
        console.log("✅ Registration successful!");
        
        const successBanner = document.getElementById("successBanner");
        if (successBanner) {
          successBanner.style.display = "block";
        }

        setTimeout(() => {
          if (typeof showSuccess === 'function') {
            showSuccess(
              "Account Created Successfully! 🎉",
              "Welcome to QuickLaundry! Your account has been created and a welcome email has been sent to your inbox.",
              () => {
                if (window.parent && window.parent !== window) {
                  window.parent.postMessage({ action: "registrationSuccess" }, "*");
                } else {
                  window.location.href = "login.html";
                }
              }
            );
          } else {
            alert("Account created successfully! Welcome to QuickLaundry!");
            if (window.parent && window.parent !== window) {
              window.parent.postMessage({ action: "registrationSuccess" }, "*");
            } else {
              window.location.href = "login.html";
            }
          }
        }, 400);
      } else {
        console.log("❌ Registration failed:", data.message);
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        
        setTimeout(() => {
          if (typeof showError === 'function') {
            showError(
              "Registration Failed",
              data.message || "Unable to create your account. Please try again later."
            );
          } else {
            alert(data.message || "Registration failed. Please try again.");
          }
        }, 400);
      }
    }, 500);
  } catch (error) {
    console.error("❌ Registration error:", error);
    
    setTimeout(() => {
      if (typeof closePopup === 'function') {
        closePopup();
      }
      
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
      
      setTimeout(() => {
        if (typeof showError === 'function') {
          showError(
            "Connection Error",
            `Unable to connect to server: ${error.message}\n\nPlease ensure the backend is running and try again.`
          );
        } else {
          alert(`Connection error: ${error.message}`);
        }
      }, 400);
    }, 500);
  }
}

function switchToLogin() {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ action: "switchToLogin" }, "*");
  } else {
    window.location.href = "login.html";
  }
}

// Helper function for warnings
function showWarning(title, message) {
  if (typeof showError === 'function') {
    showError(title, message);
  } else {
    alert(`${title}\n\n${message}`);
  }
}