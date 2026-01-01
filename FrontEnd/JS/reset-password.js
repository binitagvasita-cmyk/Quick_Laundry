// ========== Configuration ==========
const API_BASE_URL = "http://localhost:3000/api";

// Auto-detect if backend is available
let BACKEND_AVAILABLE = false;

// Test backend availability on load
async function testBackendConnection() {
  try {
    const response = await fetch('http://localhost:3000/health', {
      method: 'GET',
      signal: AbortSignal.timeout(3000)
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

// ========== State Management ==========
let resetToken = null;
let userEmail = null;

// ========== Password Requirements ==========
const passwordRequirements = {
    length: false,
    special: false,
    match: false
};

// ========== Initialize ==========
document.addEventListener('DOMContentLoaded', async () => {
    console.log('%c Reset Password Page Loaded ', 'background: #2196F3; color: white; padding: 5px; font-weight: bold;');
    
    // Test backend connection first
    await testBackendConnection();
    
    // Get token from URL
    const urlParams = new URLSearchParams(window.location.search);
    resetToken = urlParams.get('token');
    
    console.log('Token from URL:', resetToken ? 'Present ✓' : 'Missing ✗');
    
    if (!resetToken) {
        showTokenError('No reset token provided in URL. Please use the link from your email.');
        return;
    }
    
    if (!BACKEND_AVAILABLE) {
        console.error('%c ⚠️ Backend Server Not Running! ', 'background: #f44336; color: white; padding: 10px; font-size: 14px; font-weight: bold;');
        showTokenError(
            'Cannot connect to server. Please ensure:\n\n' +
            '1. Backend server is running (python app.py)\n' +
            '2. Server is running on http://localhost:3000\n' +
            '3. MySQL database is running'
        );
        return;
    }
    
    // Verify token
    await verifyResetToken();
    
    // Setup event listeners
    setupEventListeners();
});

// ========== Verify Reset Token ==========
async function verifyResetToken() {
    console.log('%c Verifying Reset Token... ', 'background: #FF9800; color: white; padding: 5px;');
    console.log('Token:', resetToken.substring(0, 20) + '...');
    console.log('Calling:', `${API_BASE_URL}/verify-reset-token`);
    
    try {
        const response = await fetch(`${API_BASE_URL}/verify-reset-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: resetToken })
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', [...response.headers.entries()]);
        
        // Try to parse response
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            console.error('Non-JSON response received:', text);
            throw new Error('Server returned invalid response format');
        }
        
        console.log('Response data:', data);
        
        if (response.ok && data.success) {
            // Token is valid
            userEmail = data.email;
            console.log('%c ✓ Token Valid ', 'background: #4CAF50; color: white; padding: 5px;');
            showResetForm();
        } else {
            // Token is invalid
            console.warn('%c ✗ Token Invalid ', 'background: #f44336; color: white; padding: 5px;');
            showTokenError(data.message || 'Invalid or expired reset link');
        }
        
    } catch (error) {
        console.error('%c Error Verifying Token ', 'background: #f44336; color: white; padding: 5px;');
        console.error('Error details:', error);
        
        if (error.message.includes('Failed to fetch')) {
            showTokenError(
                '⚠️ Cannot connect to server.\n\n' +
                'Please ensure:\n' +
                '1. Backend server is running\n' +
                '2. Run: python app.py\n' +
                '3. Check console for details'
            );
        } else {
            showTokenError('Unable to verify reset link. ' + error.message);
        }
    }
}

// ========== Show States ==========
function showResetForm() {
    console.log('Showing reset form');
    
    // Hide loading and error states
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('tokenErrorState').style.display = 'none';
    
    // Show form
    document.getElementById('resetFormState').style.display = 'block';
    
    // Set email in form
    if (userEmail) {
        document.getElementById('resetEmail').textContent = userEmail;
    }
}

function showTokenError(message) {
    console.log('Showing token error:', message);
    
    // Hide loading and form
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('resetFormState').style.display = 'none';
    
    // Show error
    const errorState = document.getElementById('tokenErrorState');
    const errorMessage = document.getElementById('tokenErrorMessage');
    
    errorMessage.textContent = message;
    errorState.style.display = 'block';
}

// ========== Event Listeners ==========
function setupEventListeners() {
    // Password toggle buttons
    setupPasswordToggle('toggleNewPassword', 'newPassword');
    setupPasswordToggle('toggleConfirmPassword', 'confirmPassword');
    
    // Password validation
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    
    newPassword.addEventListener('input', validatePasswords);
    confirmPassword.addEventListener('input', validatePasswords);
    
    // Form submission
    const form = document.getElementById('resetPasswordForm');
    form.addEventListener('submit', handleResetPassword);
}

function setupPasswordToggle(buttonId, inputId) {
    const button = document.getElementById(buttonId);
    const input = document.getElementById(inputId);
    
    if (!button || !input) return;
    
    button.addEventListener('click', () => {
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        
        // Update icon
        const icon = button.querySelector('svg');
        if (type === 'text') {
            // Show "eye-off" icon
            icon.innerHTML = `
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" stroke-width="2"/>
                <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="2"/>
            `;
        } else {
            // Show "eye" icon
            icon.innerHTML = `
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
            `;
        }
    });
}

// ========== Password Validation ==========
function validatePasswords() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Check length (at least 8 characters)
    passwordRequirements.length = newPassword.length >= 8;
    updateRequirement('req-length', passwordRequirements.length);
    
    // Check special character
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
    passwordRequirements.special = specialCharRegex.test(newPassword);
    updateRequirement('req-special', passwordRequirements.special);
    
    // Check if passwords match
    passwordRequirements.match = newPassword.length > 0 && newPassword === confirmPassword;
    updateRequirement('req-match', passwordRequirements.match);
    
    // Enable/disable submit button
    const allValid = passwordRequirements.length && 
                     passwordRequirements.special && 
                     passwordRequirements.match;
    
    document.getElementById('resetBtn').disabled = !allValid;
}

function updateRequirement(elementId, isValid) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    if (isValid) {
        element.classList.add('requirement-met');
    } else {
        element.classList.remove('requirement-met');
    }
}

// ========== Handle Password Reset ==========
async function handleResetPassword(e) {
    e.preventDefault();
    
    console.log('%c Submitting Password Reset... ', 'background: #2196F3; color: white; padding: 5px;');
    
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate passwords
    if (newPassword !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }
    
    if (newPassword.length < 8) {
        showError('Password must be at least 8 characters');
        return;
    }
    
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
    if (!specialCharRegex.test(newPassword)) {
        showError('Password must contain at least one special character');
        return;
    }
    
    // Show loading
    setLoading(true);
    hideError();
    hideSuccess();
    
    console.log('Calling:', `${API_BASE_URL}/reset-password`);
    
    try {
        const response = await fetch(`${API_BASE_URL}/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                token: resetToken,
                new_password: newPassword
            })
        });
        
        console.log('Response status:', response.status);
        
        // Try to parse response
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            console.error('Non-JSON response received:', text);
            throw new Error('Server returned invalid response format');
        }
        
        console.log('Response data:', data);
        
        if (response.ok && data.success) {
            // Success!
            console.log('%c ✓ Password Reset Successful ', 'background: #4CAF50; color: white; padding: 5px;');
            showSuccess();
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);
            
        } else {
            // Error
            console.warn('%c ✗ Password Reset Failed ', 'background: #f44336; color: white; padding: 5px;');
            showError(data.message || 'Failed to reset password');
        }
        
    } catch (error) {
        console.error('%c Error Resetting Password ', 'background: #f44336; color: white; padding: 5px;');
        console.error('Error details:', error);
        
        if (error.message.includes('Failed to fetch')) {
            showError(
                '⚠️ Cannot connect to server. Please ensure:\n' +
                '1. Backend server is running\n' +
                '2. Run: python app.py'
            );
        } else {
            showError('Unable to reset password. ' + error.message);
        }
    } finally {
        setLoading(false);
    }
}

// ========== UI Helper Functions ==========
function setLoading(loading) {
    const btn = document.getElementById('resetBtn');
    const btnText = btn.querySelector('.btn-text');
    const btnLoader = btn.querySelector('.btn-loader');
    
    if (loading) {
        btn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'block';
    } else {
        btn.disabled = false;
        btnText.style.display = 'block';
        btnLoader.style.display = 'none';
    }
}

function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    errorText.textContent = message;
    errorMessage.style.display = 'flex';
}

function hideError() {
    document.getElementById('errorMessage').style.display = 'none';
}

function showSuccess() {
    document.getElementById('successMessage').style.display = 'flex';
}

function hideSuccess() {
    document.getElementById('successMessage').style.display = 'none';
}