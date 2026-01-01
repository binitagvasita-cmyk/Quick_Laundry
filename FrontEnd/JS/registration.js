let currentStep = 1;
const totalSteps = 3;
let otpSent = false;
let otpVerified = false;

// API Configuration - Auto-detect backend URL
const API_BASE_URL = (() => {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3000/api';
  } else {
    // Point to your Render backend
    return 'https://quick-laundry-backend.onrender.com/api';
  }
})();

console.log('API Base URL:', API_BASE_URL);

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
document.addEventListener("DOMContentLoaded", function () {
  console.log("QuickLaundry Registration initialized");

  const themeManager = new ThemeManager();
  window.themeManager = themeManager;

  updateProgress();
  setupEventListeners();
  setupOtpInputs();
  setupSigninLink();
});

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

// ===== OTP SEND FUNCTION =====
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
    console.log('Sending OTP to:', email);
    console.log('API URL:', `${API_BASE_URL}/send-otp`);

    const response = await fetch(`${API_BASE_URL}/send-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ email }),
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server returned non-JSON response");
    }

    const data = await response.json();
    console.log('Response data:', data);

    if (data.success) {
      otpSent = true;
      showOtpStatus("✓ OTP sent successfully! Check your email.", "success");
      startOtpTimer(sendBtn);
      
      // Show success popup
      if (typeof showSuccess === 'function') {
        showSuccess(
          "OTP Sent!",
          "A 6-digit verification code has been sent to your email address. Please check your inbox."
        );
      }
    } else {
      showOtpStatus(data.message || "Failed to send OTP. Please try again.", "error");
      sendBtn.disabled = false;
      sendBtn.innerHTML = originalText;
      
      // Show error popup
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
    console.error("Send OTP error:", error);
    showOtpStatus("Connection error. Please check your internet.", "error");
    sendBtn.disabled = false;
    sendBtn.innerHTML = originalText;
    
    // Show error popup
    if (typeof showError === 'function') {
      showError(
        "Connection Error",
        `Unable to connect to server. Please check:\n\n1. Backend is running on port 3000\n2. Your internet connection\n3. Firewall settings\n\nError: ${error.message}`
      );
    } else {
      alert(`Connection error: ${error.message}\n\nPlease ensure the backend server is running.`);
    }
  }
}

// ===== OTP VERIFICATION =====
async function verifyOtp(otp) {
  const email = document.getElementById("email").value;
  
  if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
    showOtpStatus("Please enter a valid 6-digit OTP", "error");
    return;
  }

  try {
    console.log("Verifying OTP:", otp, "for email:", email);
    
    const response = await fetch(`${API_BASE_URL}/verify-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ email, otp }),
    });

    console.log('Verify response status:', response.status);

    const data = await response.json();
    console.log("Verify OTP response:", data);

    if (data.success) {
      otpVerified = true;
      showOtpStatus("✓ Email verified successfully!", "success");
      document.querySelector(".otp-section").classList.remove("error");

      // Disable OTP inputs after successful verification
      document.querySelectorAll(".otp-input").forEach((input) => {
        input.disabled = true;
      });
      document.getElementById("sendOtpBtn").disabled = true;
      
      // Lock email and username fields
      lockEmailAndUsername();
      
      // Show success popup
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
      
      // Re-focus first input
      document.querySelector(".otp-input").focus();
      
      // Show error popup
      if (typeof showError === 'function') {
        showError(
          "Invalid OTP",
          data.message || "The verification code you entered is incorrect. Please try again."
        );
      }
    }
  } catch (error) {
    console.error("Verify OTP error:", error);
    showOtpStatus("Connection error. Please try again.", "error");
    otpVerified = false;
    
    // Show error popup
    if (typeof showError === 'function') {
      showError(
        "Verification Failed",
        `Unable to verify OTP. Error: ${error.message}`
      );
    }
  }
}

// ===== OTP TIMER =====
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

// ===== OTP STATUS DISPLAY =====
function showOtpStatus(message, type) {
  const statusDiv = document.getElementById("otpStatus");
  statusDiv.textContent = message;
  statusDiv.className = `otp-status ${type}`;
}

// ===== PROGRESS BAR =====
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

// ===== NAVIGATION =====
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

// ===== VALIDATION =====
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

// ===== PASSWORD TOGGLE =====
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

// ===== IMAGE PREVIEW =====
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

// ===== FORM SUBMISSION =====
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

  console.log("Form Data:", formData);

  const submitBtn = document.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';

  // Show loading popup
  if (typeof showLoading === 'function') {
    showLoading("Creating your account...");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();
    console.log("Registration response:", data);

    // Wait a moment before closing loading popup
    setTimeout(() => {
      // Close loading popup
      if (typeof closePopup === 'function') {
        closePopup();
      }

      // Check if registration was successful
      if (response.ok && data.success) {
        console.log("Registration successful!");
        
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
        console.log("Registration failed:", data.message);
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
    console.error("Registration error:", error);
    
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
            `Unable to connect to server: ${error.message}`
          );
        } else {
          alert(`Connection error: ${error.message}`);
        }
      }, 400);
    }, 500);
  }
}

// ===== UTILITY FUNCTIONS =====
function switchToLogin() {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ action: "switchToLogin" }, "*");
  } else {
    window.location.href = "login.html";
  }
}