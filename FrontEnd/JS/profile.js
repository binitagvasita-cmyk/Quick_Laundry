// ============================================
// LAUNDRYWALA PROFILE PAGE SCRIPT
// Professional User Profile Management
// Complete Updated Version with Fixed Avatar Upload
// ============================================

// API Configuration
const API_BASE_URL = (() => {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3000/api';
  } else {
    // Point to your Render backend
    return 'https://quick-laundry-backend.onrender.com/api';
  }
})();
// ============================================
// PROFILE MANAGER CLASS
// ============================================
class ProfileManager {
    constructor() {
        this.userData = null;
        this.token = this.getAuthToken();
        this.init();
    }

    init() {
        // Check authentication first
        if (!this.token) {
            this.redirectToLogin();
            return;
        }

        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupEventListeners();
                this.loadUserProfile();
            });
        } else {
            this.setupEventListeners();
            this.loadUserProfile();
        }
    }

    // ============================================
    // AUTHENTICATION
    // ============================================
    getAuthToken() {
        try {
            return localStorage.getItem('access_token');
        } catch (e) {
            console.error('Error getting token:', e);
            return null;
        }
    }

    redirectToLogin() {
        this.showNotification('Please login to view your profile', 'error');
        setTimeout(() => {
            window.location.href = 'Home.html';
        }, 2000);
    }

    // ============================================
    // API CALLS
    // ============================================
    async loadUserProfile() {
        try {
            this.showLoading(true);

            // First try to get user data from localStorage
            const userDataStr = localStorage.getItem('currentUser');
            
            if (userDataStr) {
                this.userData = JSON.parse(userDataStr);
                console.log('Loaded user from localStorage:', this.userData);
                
                // Display the data immediately
                this.displayUserProfile();
                
                // Then try to fetch fresh data from API if user has ID
                if (this.userData.id) {
                    try {
                        const freshData = await this.fetchUserProfile(this.userData.id);
                        if (freshData) {
                            this.userData = freshData;
                            localStorage.setItem('currentUser', JSON.stringify(freshData));
                            this.displayUserProfile();
                        }
                    } catch (error) {
                        console.warn('Could not fetch fresh data, using cached data:', error);
                    }
                }
            } else {
                throw new Error('No user data found');
            }

            this.showLoading(false);

        } catch (error) {
            console.error('Error loading profile:', error);
            this.showLoading(false);
            this.showNotification('Failed to load profile: ' + error.message, 'error');
            
            // If critical error, redirect to login after delay
            setTimeout(() => {
                this.redirectToLogin();
            }, 3000);
        }
    }

    async fetchUserProfile(userId) {
        try {
            console.log(`Fetching profile for user ID: ${userId}`);
            console.log(`Using token: ${this.token ? 'Token exists' : 'No token'}`);

            const response = await fetch(`${API_BASE_URL}/user/${userId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Fetch response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Fetch error:', errorData);
                throw new Error(errorData.message || 'Failed to fetch profile');
            }

            const data = await response.json();
            console.log('Fetched user data:', data);
            
            return data.user || data;

        } catch (error) {
            console.error('Error fetching profile:', error);
            return null;
        }
    }

    async updateProfile(updateData) {
        try {
            this.showLoading(true);

            console.log('Updating profile with data:', updateData);
            console.log('User ID:', this.userData.id);
            console.log('API URL:', `${API_BASE_URL}/user/${this.userData.id}`);

            const response = await fetch(`${API_BASE_URL}/user/${this.userData.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            console.log('Update response status:', response.status);

            const data = await response.json();
            console.log('Update response data:', data);

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to update profile');
            }

            // Update local data with the response
            if (data.user) {
                this.userData = data.user;
                localStorage.setItem('currentUser', JSON.stringify(data.user));
            } else {
                this.userData = { ...this.userData, ...updateData };
                localStorage.setItem('currentUser', JSON.stringify(this.userData));
            }

            // Also update in header if authManager exists
            if (window.authManager) {
                window.authManager.currentUser = this.userData;
                window.authManager.updateUI();
            }

            // Also update in sidebar if sidebarManager exists
            if (window.sidebarManager) {
                window.sidebarManager.currentUser = this.userData;
                window.sidebarManager.renderSidebar();
            }

            this.displayUserProfile();
            this.showLoading(false);
            this.showNotification('Profile updated successfully!', 'success');

            return true;

        } catch (error) {
            console.error('Error updating profile:', error);
            this.showLoading(false);
            this.showNotification(error.message || 'Failed to update profile', 'error');
            return false;
        }
    }

    async changePassword(currentPassword, newPassword) {
        try {
            this.showLoading(true);

            console.log('Changing password...');

            const response = await fetch(`${API_BASE_URL}/user/change-password`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword
                })
            });

            console.log('Change password response status:', response.status);

            const data = await response.json();
            console.log('Change password response data:', data);

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to change password');
            }

            this.showLoading(false);
            this.showNotification('Password changed successfully!', 'success');

            return true;

        } catch (error) {
            console.error('Error changing password:', error);
            this.showLoading(false);
            this.showNotification(error.message || 'Failed to change password', 'error');
            return false;
        }
    }

    // ============================================
    // IMPROVED AVATAR UPLOAD METHODS
    // ============================================
    
    setupAvatarUpload() {
        // Create file input once if it doesn't exist
        if (!document.getElementById('avatarFileInput')) {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.id = 'avatarFileInput';
            fileInput.accept = 'image/jpeg,image/jpg,image/png,image/gif,image/webp';
            fileInput.style.display = 'none';
            document.body.appendChild(fileInput);

            fileInput.addEventListener('change', (e) => this.handleAvatarSelection(e));
        }

        // Setup avatar edit button
        const avatarEditBtn = document.getElementById('avatarEditBtn');
        if (avatarEditBtn) {
            avatarEditBtn.onclick = () => this.showAvatarOptions();
        }
    }

    showAvatarOptions() {
        const hasCustomAvatar = this.userData?.profile_picture && 
                                !this.userData.profile_picture.includes('dicebear.com');

        // Create modal for avatar options
        this.createAvatarOptionsModal(hasCustomAvatar);
    }

    createAvatarOptionsModal(hasCustomAvatar) {
        // Remove existing modal if any
        const existingModal = document.getElementById('avatarOptionsModal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.id = 'avatarOptionsModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h2>Profile Picture</h2>
                    <button class="modal-close" id="closeAvatarOptions">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <button class="btn btn-primary" id="uploadNewPictureBtn" style="width: 100%; justify-content: center;">
                            <i class="fas fa-upload"></i> Upload New Picture
                        </button>
                        ${hasCustomAvatar ? `
                            <button class="btn btn-secondary" id="deleteCurrentPictureBtn" style="width: 100%; justify-content: center; color: #ef4444; border-color: #ef4444;">
                                <i class="fas fa-trash"></i> Delete Current Picture
                            </button>
                        ` : ''}
                        <button class="btn btn-secondary" id="cancelAvatarOptionsBtn" style="width: 100%; justify-content: center;">
                            Cancel
                        </button>
                    </div>
                    <div style="margin-top: 16px; padding: 12px; background: var(--bg-secondary); border-radius: 8px; font-size: 13px; color: var(--text-secondary);">
                        <i class="fas fa-info-circle"></i> Supported: JPG, PNG, GIF, WebP (Max 5MB)
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        // Setup event listeners for modal buttons
        const closeBtn = document.getElementById('closeAvatarOptions');
        const uploadBtn = document.getElementById('uploadNewPictureBtn');
        const deleteBtn = document.getElementById('deleteCurrentPictureBtn');
        const cancelBtn = document.getElementById('cancelAvatarOptionsBtn');

        const closeModal = () => {
            modal.remove();
            document.body.style.overflow = '';
        };

        if (closeBtn) closeBtn.onclick = closeModal;
        if (cancelBtn) cancelBtn.onclick = closeModal;
        if (uploadBtn) uploadBtn.onclick = () => this.triggerFileUpload();
        if (deleteBtn) deleteBtn.onclick = () => this.confirmDeleteAvatar();

        // Close on outside click
        modal.onclick = (e) => {
            if (e.target.id === 'avatarOptionsModal') {
                closeModal();
            }
        };
    }

    triggerFileUpload() {
        // Close options modal
        const modal = document.getElementById('avatarOptionsModal');
        if (modal) {
            modal.remove();
            document.body.style.overflow = '';
        }

        // Trigger file input
        const fileInput = document.getElementById('avatarFileInput');
        if (fileInput) {
            fileInput.click();
        }
    }

    async handleAvatarSelection(event) {
        const file = event.target.files[0];
        
        if (!file) {
            console.log('No file selected');
            return;
        }

        console.log('File selected:', file.name, file.type, file.size);

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            this.showNotification('Invalid file type. Please upload JPG, PNG, GIF, or WebP', 'error');
            event.target.value = '';
            return;
        }

        // Validate file size (5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            this.showNotification('File too large. Maximum size is 5MB', 'error');
            event.target.value = '';
            return;
        }

        // Show preview and confirm
        this.showAvatarPreview(file);
        
        // Clear input
        event.target.value = '';
    }

    showAvatarPreview(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            // Remove existing preview modal if any
            const existingPreview = document.getElementById('avatarPreviewModal');
            if (existingPreview) existingPreview.remove();

            const previewModal = document.createElement('div');
            previewModal.className = 'modal active';
            previewModal.id = 'avatarPreviewModal';
            previewModal.innerHTML = `
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h2>Preview Profile Picture</h2>
                        <button class="modal-close" id="closePreview">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <img src="${e.target.result}" 
                                 style="width: 200px; height: 200px; border-radius: 50%; object-fit: cover; border: 4px solid var(--primary-blue); box-shadow: 0 8px 24px rgba(0,0,0,0.2);"
                                 alt="Preview">
                        </div>
                        <div style="text-align: center; margin-bottom: 20px; color: var(--text-secondary); font-size: 14px;">
                            <i class="fas fa-file"></i> ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)
                        </div>
                        <div style="display: flex; gap: 12px;">
                            <button class="btn btn-secondary" id="cancelPreview" style="flex: 1; justify-content: center;">
                                Cancel
                            </button>
                            <button class="btn btn-primary" id="confirmUploadBtn" style="flex: 1; justify-content: center;">
                                <i class="fas fa-check"></i> Upload
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(previewModal);

            const closeModal = () => {
                previewModal.remove();
                document.body.style.overflow = '';
            };

            // Add event listeners
            const closeBtn = document.getElementById('closePreview');
            const cancelBtn = document.getElementById('cancelPreview');
            const confirmBtn = document.getElementById('confirmUploadBtn');

            if (closeBtn) closeBtn.onclick = closeModal;
            if (cancelBtn) cancelBtn.onclick = closeModal;
            if (confirmBtn) {
                confirmBtn.onclick = async () => {
                    closeModal();
                    await this.uploadAvatar(file);
                };
            }

            // Close on outside click
            previewModal.onclick = (e) => {
                if (e.target.id === 'avatarPreviewModal') {
                    closeModal();
                }
            };
        };

        reader.onerror = () => {
            this.showNotification('Failed to read file', 'error');
        };

        reader.readAsDataURL(file);
    }

    async uploadAvatar(file) {
        try {
            this.showLoading(true);
            console.log('Starting upload for:', file.name);

            const formData = new FormData();
            formData.append('profile_picture', file);

            // Log the request details
            console.log('Upload URL:', `${API_BASE_URL}/user/${this.userData.id}/upload-avatar`);
            console.log('Has token:', !!this.token);
            console.log('File details:', {
                name: file.name,
                type: file.type,
                size: file.size
            });

            const response = await fetch(`${API_BASE_URL}/user/${this.userData.id}/upload-avatar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                    // Don't set Content-Type - browser sets it with boundary for FormData
                },
                body: formData
            });

            console.log('Upload response status:', response.status);
            console.log('Response headers:', [...response.headers.entries()]);

            let data;
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                console.log('Non-JSON response:', text);
                throw new Error('Server returned non-JSON response. Check backend logs.');
            }

            console.log('Upload response data:', data);

            if (!response.ok) {
                throw new Error(data.message || data.error || `Upload failed with status ${response.status}`);
            }

            if (!data.success) {
                throw new Error(data.message || 'Upload was not successful');
            }

            // Update user data with various possible response formats
            let newAvatarUrl = null;
            
            if (data.user) {
                this.userData = data.user;
                newAvatarUrl = data.user.profile_picture_url || data.user.profile_picture;
            } else {
                // Handle different response structures
                const pictureUrl = data.profile_picture_url || data.profile_picture;
                
                // If it's a relative path, convert to absolute URL
                if (pictureUrl) {
                    if (pictureUrl.startsWith('http://') || pictureUrl.startsWith('https://')) {
                        newAvatarUrl = pictureUrl;
                    } else if (pictureUrl.startsWith('/')) {
                        // Relative path starting with /
                        newAvatarUrl = `http://localhost:3000${pictureUrl}`;
                    } else {
                        // Relative path without leading /
                        newAvatarUrl = `http://localhost:3000/${pictureUrl}`;
                    }
                    
                    this.userData.profile_picture = newAvatarUrl;
                    this.userData.profile_picture_url = newAvatarUrl;
                }
            }

            console.log('New avatar URL set to:', newAvatarUrl);

            // Verify the URL is accessible
            if (newAvatarUrl) {
                console.log('Testing if image is accessible at:', newAvatarUrl);
                
                // Test image load
                const testImg = new Image();
                testImg.onload = () => console.log('✓ Image is accessible and valid');
                testImg.onerror = () => console.error('✗ Image failed to load from:', newAvatarUrl);
                testImg.src = newAvatarUrl;
            }

            // Save to localStorage
            localStorage.setItem('currentUser', JSON.stringify(this.userData));

            // Update UI immediately
            this.displayUserProfile();

            // Update header and sidebar if available
            if (window.authManager) {
                window.authManager.currentUser = this.userData;
                window.authManager.updateUI();
            }
            if (window.sidebarManager) {
                window.sidebarManager.currentUser = this.userData;
                window.sidebarManager.renderSidebar();
            }

            this.showLoading(false);
            this.showNotification('Profile picture uploaded successfully!', 'success');

        } catch (error) {
            console.error('Upload error:', error);
            this.showLoading(false);
            
            // Provide more specific error messages
            let errorMessage = 'Failed to upload profile picture';
            if (error.message.includes('non-JSON')) {
                errorMessage = 'Server error. Please check if the backend is running correctly.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            this.showNotification(errorMessage, 'error');
        }
    }

    confirmDeleteAvatar() {
        // Close options modal
        const modal = document.getElementById('avatarOptionsModal');
        if (modal) {
            modal.remove();
            document.body.style.overflow = '';
        }

        // Create confirmation modal
        const confirmModal = document.createElement('div');
        confirmModal.className = 'modal active';
        confirmModal.id = 'deleteConfirmModal';
        confirmModal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h2>Delete Profile Picture</h2>
                    <button class="modal-close" id="closeDeleteConfirm">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <p style="margin-bottom: 20px; color: var(--text-primary);">
                        Are you sure you want to delete your profile picture? This action cannot be undone.
                    </p>
                    <div style="display: flex; gap: 12px;">
                        <button class="btn btn-secondary" id="cancelDelete" style="flex: 1; justify-content: center;">
                            Cancel
                        </button>
                        <button class="btn btn-primary" id="confirmDelete" style="flex: 1; justify-content: center; background: #ef4444;">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(confirmModal);

        const closeModal = () => {
            confirmModal.remove();
            document.body.style.overflow = '';
        };

        const closeBtn = document.getElementById('closeDeleteConfirm');
        const cancelBtn = document.getElementById('cancelDelete');
        const confirmBtn = document.getElementById('confirmDelete');

        if (closeBtn) closeBtn.onclick = closeModal;
        if (cancelBtn) cancelBtn.onclick = closeModal;
        if (confirmBtn) {
            confirmBtn.onclick = async () => {
                closeModal();
                await this.deleteAvatar();
            };
        }

        // Close on outside click
        confirmModal.onclick = (e) => {
            if (e.target.id === 'deleteConfirmModal') {
                closeModal();
            }
        };
    }

    async deleteAvatar() {
        try {
            this.showLoading(true);
            console.log('Deleting avatar for user:', this.userData.id);

            const response = await fetch(`${API_BASE_URL}/user/${this.userData.id}/delete-avatar`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Delete response status:', response.status);

            const data = await response.json();
            console.log('Delete response data:', data);

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to delete avatar');
            }

            // Update user data
            if (data.user) {
                this.userData = data.user;
            } else {
                this.userData.profile_picture = null;
                this.userData.profile_picture_url = null;
            }

            localStorage.setItem('currentUser', JSON.stringify(this.userData));

            // Update UI
            this.displayUserProfile();

            if (window.authManager) {
                window.authManager.currentUser = this.userData;
                window.authManager.updateUI();
            }
            if (window.sidebarManager) {
                window.sidebarManager.currentUser = this.userData;
                window.sidebarManager.renderSidebar();
            }

            this.showLoading(false);
            this.showNotification('Profile picture deleted successfully!', 'success');

        } catch (error) {
            console.error('Delete error:', error);
            this.showLoading(false);
            this.showNotification(error.message || 'Failed to delete profile picture', 'error');
        }
    }

    // ============================================
    // DISPLAY FUNCTIONS
    // ============================================
    displayUserProfile() {
        if (!this.userData) return;

        console.log('Displaying user profile:', this.userData);

        // Update avatar - handle both profile_picture_url, profile_picture and avatar fields
        let avatarUrl = this.userData.profile_picture_url || 
                        this.userData.profile_picture || 
                        this.userData.avatar;
        
        // If avatarUrl is relative path, convert to absolute
        if (avatarUrl && !avatarUrl.startsWith('http')) {
            if (avatarUrl.startsWith('/')) {
                avatarUrl = `http://localhost:3000${avatarUrl}`;
            } else {
                avatarUrl = `http://localhost:3000/${avatarUrl}`;
            }
        }
        
        // If still no avatar, use default
        if (!avatarUrl || avatarUrl.includes('undefined')) {
            avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.userData.username || 'User'}`;
        }
        
        console.log('Avatar URL to display:', avatarUrl);
        
        // Update avatar in profile page (main priority)
        this.updateElement('profileAvatarLarge', avatarUrl, 'src');
        
        // Update in header/sidebar if those elements exist
        this.updateElement('userAvatar', avatarUrl, 'src');
        this.updateElement('headerAvatar', avatarUrl, 'src');

        // Update header info
        const displayName = this.userData.full_name || this.userData.name || this.userData.username || 'User';
        this.updateElement('profileHeaderName', displayName);
        this.updateElement('userName', displayName);
        this.updateElement('profileName', displayName);
        
        this.updateElement('profileHeaderEmail', this.userData.email || '');
        this.updateElement('userEmail', this.userData.email || '');

        // Update badges
        if (this.userData.email_verified) {
            const verifiedBadge = document.getElementById('verifiedBadge');
            if (verifiedBadge) {
                verifiedBadge.style.display = 'inline-flex';
            }
        }

        const accountStatus = this.userData.is_active ? 'Active' : 'Inactive';
        this.updateElement('accountStatus', accountStatus);
        
        const statusBadge = document.getElementById('accountStatus');
        if (statusBadge) {
            statusBadge.className = this.userData.is_active ? 'status-badge status-active' : 'status-badge status-inactive';
        }

        // Personal Information
        this.updateElement('fullName', this.userData.full_name || this.userData.name || 'Not provided');
        this.updateElement('username', this.userData.username || 'Not provided');
        this.updateElement('email', this.userData.email || 'Not provided');
        this.updateElement('phone', this.userData.phone || 'Not provided');

        // Address Information
        this.updateElement('address', this.userData.address || 'Not provided');
        this.updateElement('city', this.userData.city || 'Not provided');
        this.updateElement('pincode', this.userData.pincode || 'Not provided');

        // Service Preferences
        this.updateElement('serviceType', this.capitalizeFirst(this.userData.service_type || 'standard'));
        this.updateElement('communicationPreference', this.capitalizeFirst(this.userData.communication_preference || 'both'));
        this.updateElement('subscribeNewsletter', this.userData.subscribe_newsletter ? 'Yes' : 'No');

        // Member Since
        if (this.userData.created_at) {
            const date = new Date(this.userData.created_at);
            this.updateElement('memberSince', date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }));
        } else {
            this.updateElement('memberSince', 'Not available');
        }

        console.log('Profile displayed successfully');
    }

    updateElement(id, value, attribute = 'textContent') {
        const element = document.getElementById(id);
        if (element) {
            if (attribute === 'src') {
                // Add cache buster to force reload
                const cacheBuster = value.includes('?') ? `&t=${Date.now()}` : `?t=${Date.now()}`;
                element.src = value + cacheBuster;
                
                // Add error handler for images
                element.onerror = () => {
                    console.warn(`Failed to load image for ${id}, using fallback`);
                    const fallbackUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.userData?.username || 'User'}`;
                    element.src = fallbackUrl;
                };
                
                // Add load success handler
                element.onload = () => {
                    console.log(`✓ Image loaded successfully for ${id}`);
                };
            } else {
                element[attribute] = value;
            }
        } else {
            // Don't warn for optional elements
            if (!['userAvatar', 'headerAvatar', 'userName', 'userEmail', 'profileName'].includes(id)) {
                console.warn(`Element not found: ${id}`);
            }
        }
    }

    capitalizeFirst(str) {
        return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================
    setupEventListeners() {
        // Setup avatar upload functionality
        this.setupAvatarUpload();

        // Edit Profile Button
        const editProfileBtn = document.getElementById('editProfileBtn');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => {
                this.openEditModal();
            });
        }

        // Change Password Button
        const changePasswordBtn = document.getElementById('changePasswordBtn');
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', () => {
                this.openPasswordModal();
            });
        }

        // Edit Profile Modal
        const closeEditModal = document.getElementById('closeEditModal');
        if (closeEditModal) {
            closeEditModal.addEventListener('click', () => {
                this.closeEditModal();
            });
        }

        const cancelEditBtn = document.getElementById('cancelEditBtn');
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => {
                this.closeEditModal();
            });
        }

        const editProfileForm = document.getElementById('editProfileForm');
        if (editProfileForm) {
            editProfileForm.addEventListener('submit', (e) => {
                this.handleEditProfile(e);
            });
        }

        // Change Password Modal
        const closePasswordModal = document.getElementById('closePasswordModal');
        if (closePasswordModal) {
            closePasswordModal.addEventListener('click', () => {
                this.closePasswordModal();
            });
        }

        const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
        if (cancelPasswordBtn) {
            cancelPasswordBtn.addEventListener('click', () => {
                this.closePasswordModal();
            });
        }

        const changePasswordForm = document.getElementById('changePasswordForm');
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', (e) => {
                this.handleChangePassword(e);
            });
        }

        // Close modals on outside click
        const editProfileModal = document.getElementById('editProfileModal');
        if (editProfileModal) {
            editProfileModal.addEventListener('click', (e) => {
                if (e.target.id === 'editProfileModal') {
                    this.closeEditModal();
                }
            });
        }

        const changePasswordModal = document.getElementById('changePasswordModal');
        if (changePasswordModal) {
            changePasswordModal.addEventListener('click', (e) => {
                if (e.target.id === 'changePasswordModal') {
                    this.closePasswordModal();
                }
            });
        }

        console.log('Event listeners setup complete');
    }

    // ============================================
    // MODAL FUNCTIONS
    // ============================================
    openEditModal() {
        if (!this.userData) return;

        // Populate form with current data
        const editFullName = document.getElementById('editFullName');
        if (editFullName) editFullName.value = this.userData.full_name || '';
        
        const editPhone = document.getElementById('editPhone');
        if (editPhone) editPhone.value = this.userData.phone || '';
        
        const editAddress = document.getElementById('editAddress');
        if (editAddress) editAddress.value = this.userData.address || '';
        
        const editCity = document.getElementById('editCity');
        if (editCity) editCity.value = this.userData.city || '';
        
        const editPincode = document.getElementById('editPincode');
        if (editPincode) editPincode.value = this.userData.pincode || '';
        
        const editServiceType = document.getElementById('editServiceType');
        if (editServiceType) editServiceType.value = this.userData.service_type || 'standard';
        
        const editCommunication = document.getElementById('editCommunication');
        if (editCommunication) editCommunication.value = this.userData.communication_preference || 'both';
        
        const editNewsletter = document.getElementById('editNewsletter');
        if (editNewsletter) editNewsletter.checked = this.userData.subscribe_newsletter || false;

        const modal = document.getElementById('editProfileModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeEditModal() {
        const modal = document.getElementById('editProfileModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        const form = document.getElementById('editProfileForm');
        if (form) form.reset();
    }

    openPasswordModal() {
        const modal = document.getElementById('changePasswordModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closePasswordModal() {
        const modal = document.getElementById('changePasswordModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        const form = document.getElementById('changePasswordForm');
        if (form) form.reset();
    }

    // ============================================
    // FORM HANDLERS
    // ============================================
    async handleEditProfile(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const updateData = {
            full_name: formData.get('full_name'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            city: formData.get('city'),
            pincode: formData.get('pincode'),
            service_type: formData.get('service_type'),
            communication_preference: formData.get('communication_preference'),
            subscribe_newsletter: formData.get('subscribe_newsletter') === 'on'
        };

        console.log('Form data to update:', updateData);

        // Validation
        if (!updateData.phone || updateData.phone.length < 10) {
            this.showNotification('Please enter a valid phone number', 'error');
            return;
        }

        if (!updateData.address || updateData.address.trim().length < 5) {
            this.showNotification('Please enter a valid address', 'error');
            return;
        }

        if (!updateData.city || updateData.city.trim().length < 2) {
            this.showNotification('Please enter a valid city', 'error');
            return;
        }

        if (!updateData.pincode || !/^\d{5,6}$/.test(updateData.pincode)) {
            this.showNotification('Please enter a valid pincode', 'error');
            return;
        }

        const success = await this.updateProfile(updateData);
        
        if (success) {
            this.closeEditModal();
        }
    }

    async handleChangePassword(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const currentPassword = formData.get('current_password');
        const newPassword = formData.get('new_password');
        const confirmPassword = formData.get('confirm_password');

        // Validation
        if (!currentPassword) {
            this.showNotification('Please enter your current password', 'error');
            return;
        }

        if (newPassword.length < 8) {
            this.showNotification('New password must be at least 8 characters', 'error');
            return;
        }

        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
            this.showNotification('New password must contain at least one special character', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showNotification('Passwords do not match', 'error');
            return;
        }

        if (currentPassword === newPassword) {
            this.showNotification('New password must be different from current password', 'error');
            return;
        }

        const success = await this.changePassword(currentPassword, newPassword);
        
        if (success) {
            this.closePasswordModal();
            
            // Log out after password change
            setTimeout(() => {
                this.showNotification('Please login with your new password', 'info');
                this.handleLogout();
            }, 2000);
        }
    }

    // ============================================
    // LOGOUT
    // ============================================
    handleLogout() {
        try {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('isLoggedIn');
            
            this.showNotification('Logged out successfully', 'success');
            
            setTimeout(() => {
                window.location.href = 'Home.html';
            }, 1000);
            
        } catch (error) {
            console.error('Error during logout:', error);
            window.location.href = 'Home.html';
        }
    }

    // ============================================
    // UI HELPERS
    // ============================================
    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            if (show) {
                overlay.classList.add('active');
            } else {
                overlay.classList.remove('active');
            }
        }
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existing = document.querySelectorAll('.notification-toast');
        existing.forEach(n => n.remove());

        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification-toast ${type}`;
        
        const icon = type === 'success' ? 'fa-check-circle' : 
                    type === 'error' ? 'fa-exclamation-circle' : 
                    'fa-info-circle';
        
        notification.innerHTML = `
            <i class="fas ${icon}"></i>
            <div class="notification-toast-content">
                <div class="notification-toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                <div class="notification-toast-message">${message}</div>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
}

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================
console.log('Profile.js loaded');

// Initialize profile manager when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM loaded, initializing profile manager');
        const profileManager = new ProfileManager();
        window.profileManager = profileManager;
    });
} else {
    console.log('DOM already loaded, initializing profile manager');
    const profileManager = new ProfileManager();
    window.profileManager = profileManager;
}

// ============================================
// HANDLE PAGE VISIBILITY
// ============================================
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.profileManager) {
        // Reload profile when page becomes visible
        window.profileManager.loadUserProfile();
    }
});