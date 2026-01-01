from flask import Blueprint, request, jsonify, current_app, send_from_directory
from BackEnd.models.user import User
from BackEnd.services.jwt_service import token_required
from BackEnd.services.email_service import EmailService
from BackEnd.services.image_upload_service import ImageUploadService
from werkzeug.utils import secure_filename
import logging
import os

logger = logging.getLogger(__name__)

user_bp = Blueprint('user', __name__, url_prefix='/api')


def init_user_routes(app, config):
    """Initialize user profile routes"""
    
    email_service = EmailService(config)
    image_upload_service = ImageUploadService(config.UPLOAD_FOLDER)
    
    # ---------- GET USER PROFILE ----------
    @user_bp.route('/user/<int:user_id>', methods=['GET', 'OPTIONS'])
    @token_required
    def get_user_profile(user_id):
        """Get user profile by ID"""
        # Note: OPTIONS is now handled by @token_required decorator
        
        try:
            # Check if the requesting user is accessing their own profile
            current_user = request.current_user
            if current_user.get('user_id') != user_id:
                logger.warning(f"User {current_user.get('user_id')} attempted to access profile of user {user_id}")
                return jsonify(
                    success=False,
                    message='Unauthorized access'
                ), 403
            
            # Get user profile
            user = User.get_user_safe(user_id)
            
            if not user:
                logger.warning(f"User {user_id} not found")
                return jsonify(
                    success=False,
                    message='User not found'
                ), 404
            
            # Add full URL for profile picture if it exists
            if user.get('profile_picture'):
                user['profile_picture_url'] = image_upload_service.get_image_url(
                    user['profile_picture'],
                    config.APP_URL
                )
            
            logger.info(f"User profile fetched successfully for user {user_id}")
            
            return jsonify(
                success=True,
                user=user
            ), 200
            
        except Exception as e:
            logger.exception(f"Get user profile error for user {user_id}")
            return jsonify(
                success=False,
                message='Internal server error'
            ), 500
    
    # ---------- UPDATE USER PROFILE ----------
    @user_bp.route('/user/<int:user_id>', methods=['PUT', 'OPTIONS'])
    @token_required
    def update_user_profile(user_id):
        """Update user profile"""
        # Note: OPTIONS is now handled by @token_required decorator
        
        try:
            # Check if the requesting user is updating their own profile
            current_user = request.current_user
            if current_user.get('user_id') != user_id:
                logger.warning(f"User {current_user.get('user_id')} attempted to update profile of user {user_id}")
                return jsonify(
                    success=False,
                    message='Unauthorized access'
                ), 403
            
            data = request.get_json(silent=True)
            
            if not data:
                return jsonify(
                    success=False,
                    message='No data provided'
                ), 400
            
            # Get current user data
            user = User.get_user_by_id(user_id)
            if not user:
                return jsonify(
                    success=False,
                    message='User not found'
                ), 404
            
            # Track which fields are being updated
            updated_fields = []
            
            # Prepare update data
            update_data = {}
            
            # Allow updating these fields
            allowed_fields = [
                'full_name', 'phone', 'address', 'city', 'pincode',
                'service_type', 'communication_preference', 'subscribe_newsletter'
            ]
            
            for field in allowed_fields:
                if field in data:
                    update_data[field] = data[field]
                    # Track what was updated for email notification
                    if user.get(field) != data[field]:
                        updated_fields.append(field)
            
            if not update_data:
                return jsonify(
                    success=False,
                    message='No valid fields to update'
                ), 400
            
            # Update user profile
            success, message = User.update_user(user_id, update_data)
            
            if not success:
                logger.error(f"Failed to update user {user_id}: {message}")
                return jsonify(
                    success=False,
                    message=message
                ), 400
            
            # Get updated user data
            updated_user = User.get_user_safe(user_id)
            
            # Send profile update email notification
            if updated_fields:
                try:
                    email_service.send_profile_update_email(
                        updated_user['email'],
                        updated_user['username'],
                        updated_user.get('full_name'),
                        updated_fields
                    )
                    logger.info(f"Profile update email sent to {updated_user['email']}")
                except Exception as email_error:
                    logger.error(f"Failed to send profile update email: {email_error}")
                    # Don't fail the request if email fails
            
            logger.info(f"Profile updated successfully for user {user_id}")
            
            return jsonify(
                success=True,
                message='Profile updated successfully',
                user=updated_user
            ), 200
            
        except Exception as e:
            logger.exception(f"Update user profile error for user {user_id}")
            return jsonify(
                success=False,
                message='Internal server error'
            ), 500
    
    # ---------- UPLOAD PROFILE PICTURE ----------
    @user_bp.route('/user/<int:user_id>/upload-avatar', methods=['POST', 'OPTIONS'])
    @token_required
    def upload_profile_picture(user_id):
        """Upload profile picture"""
        # Note: OPTIONS is now handled by @token_required decorator
        
        try:
            # Check if the requesting user is updating their own profile
            current_user = request.current_user
            if current_user.get('user_id') != user_id:
                logger.warning(f"User {current_user.get('user_id')} attempted to upload avatar for user {user_id}")
                return jsonify(
                    success=False,
                    message='Unauthorized access'
                ), 403
            
            # Check if file is in request
            if 'profile_picture' not in request.files:
                return jsonify(
                    success=False,
                    message='No file uploaded'
                ), 400
            
            file = request.files['profile_picture']
            
            # Validate and process image
            success, result = image_upload_service.process_and_save_image(file, user_id)
            
            if not success:
                logger.warning(f"Image upload failed for user {user_id}: {result}")
                return jsonify(
                    success=False,
                    message=result
                ), 400
            
            # Get the file path
            file_path = result
            
            # Get current user to delete old profile picture
            user = User.get_user_by_id(user_id)
            if user and user.get('profile_picture'):
                # Delete old profile picture
                image_upload_service.delete_old_image(user['profile_picture'])
                logger.info(f"Old profile picture deleted for user {user_id}")
            
            # Update user profile with new picture path
            update_success, update_message = User.update_user(user_id, {
                'profile_picture': file_path
            })
            
            if not update_success:
                logger.error(f"Failed to update profile picture in database for user {user_id}")
                return jsonify(
                    success=False,
                    message='Failed to update profile picture'
                ), 500
            
            # Get updated user data
            updated_user = User.get_user_safe(user_id)
            
            # Generate full URL for the image
            image_url = image_upload_service.get_image_url(file_path, config.APP_URL)
            
            # Send profile update email
            try:
                email_service.send_profile_update_email(
                    updated_user['email'],
                    updated_user['username'],
                    updated_user.get('full_name'),
                    ['profile_picture']
                )
                logger.info(f"Profile picture update email sent to {updated_user['email']}")
            except Exception as email_error:
                logger.error(f"Failed to send profile update email: {email_error}")
            
            logger.info(f"Profile picture uploaded successfully for user {user_id}")
            
            return jsonify(
                success=True,
                message='Profile picture uploaded successfully',
                profile_picture=file_path,
                profile_picture_url=image_url,
                user=updated_user
            ), 200
            
        except Exception as e:
            logger.exception(f"Upload profile picture error for user {user_id}")
            return jsonify(
                success=False,
                message='Internal server error'
            ), 500
    
    # ---------- DELETE PROFILE PICTURE ----------
    @user_bp.route('/user/<int:user_id>/delete-avatar', methods=['DELETE', 'OPTIONS'])
    @token_required
    def delete_profile_picture(user_id):
        """Delete profile picture and revert to default"""
        # Note: OPTIONS is now handled by @token_required decorator
        
        try:
            # Check if the requesting user is updating their own profile
            current_user = request.current_user
            if current_user.get('user_id') != user_id:
                logger.warning(f"User {current_user.get('user_id')} attempted to delete avatar for user {user_id}")
                return jsonify(
                    success=False,
                    message='Unauthorized access'
                ), 403
            
            # Get current user
            user = User.get_user_by_id(user_id)
            if not user:
                return jsonify(
                    success=False,
                    message='User not found'
                ), 404
            
            # Delete old profile picture if it exists
            if user.get('profile_picture'):
                image_upload_service.delete_old_image(user['profile_picture'])
                logger.info(f"Profile picture file deleted for user {user_id}")
            
            # Set profile picture to None (will use default avatar)
            success, message = User.update_user(user_id, {
                'profile_picture': None
            })
            
            if not success:
                logger.error(f"Failed to delete profile picture in database for user {user_id}")
                return jsonify(
                    success=False,
                    message='Failed to delete profile picture'
                ), 500
            
            # Get updated user data
            updated_user = User.get_user_safe(user_id)
            
            # Generate default avatar URL
            default_avatar = ImageUploadService.get_default_avatar(updated_user['username'])
            
            logger.info(f"Profile picture deleted successfully for user {user_id}")
            
            return jsonify(
                success=True,
                message='Profile picture deleted successfully',
                default_avatar=default_avatar,
                user=updated_user
            ), 200
            
        except Exception as e:
            logger.exception(f"Delete profile picture error for user {user_id}")
            return jsonify(
                success=False,
                message='Internal server error'
            ), 500
    
    # ---------- CHANGE PASSWORD ----------
    @user_bp.route('/user/change-password', methods=['POST', 'OPTIONS'])
    @token_required
    def change_password():
        """Change user password"""
        # Note: OPTIONS is now handled by @token_required decorator
        
        try:
            current_user = request.current_user
            user_id = current_user.get('user_id')
            
            data = request.get_json(silent=True)
            
            if not data:
                return jsonify(
                    success=False,
                    message='No data provided'
                ), 400
            
            current_password = data.get('current_password')
            new_password = data.get('new_password')
            
            if not current_password or not new_password:
                return jsonify(
                    success=False,
                    message='Current password and new password are required'
                ), 400
            
            # Validate new password
            if len(new_password) < 8:
                return jsonify(
                    success=False,
                    message='New password must be at least 8 characters'
                ), 400
            
            # Get user
            user = User.get_user_by_id(user_id)
            if not user:
                return jsonify(
                    success=False,
                    message='User not found'
                ), 404
            
            # Get full user data with password hash
            user_with_password = User.get_user_by_email(user['email'])
            
            # Verify current password
            if not User.verify_password(current_password, user_with_password['password_hash']):
                logger.warning(f"Incorrect current password for user {user_id}")
                return jsonify(
                    success=False,
                    message='Current password is incorrect'
                ), 400
            
            # Check if new password is same as current
            if User.verify_password(new_password, user_with_password['password_hash']):
                return jsonify(
                    success=False,
                    message='New password must be different from current password'
                ), 400
            
            # Update password
            success, message = User.update_password(user_id, new_password)
            
            if not success:
                logger.error(f"Failed to update password for user {user_id}: {message}")
                return jsonify(
                    success=False,
                    message=message
                ), 500
            
            logger.info(f"Password changed successfully for user {user_id}")
            
            return jsonify(
                success=True,
                message='Password changed successfully'
            ), 200
            
        except Exception as e:
            logger.exception(f"Change password error for user {user_id}")
            return jsonify(
                success=False,
                message='Internal server error'
            ), 500
    
    # ---------- SERVE UPLOADED FILES ----------
    @user_bp.route('/uploads/<path:filename>', methods=['GET'])
    def serve_upload(filename):
        """Serve uploaded files (profile pictures)"""
        try:
            upload_folder = config.UPLOAD_FOLDER
            return send_from_directory(upload_folder, filename)
        except Exception as e:
            logger.error(f"Error serving file {filename}: {e}")
            return jsonify(
                success=False,
                message='File not found'
            ), 404
    
    # ---------- USER ROUTES HEALTH CHECK ----------
    @user_bp.route('/user/health', methods=['GET', 'OPTIONS'])
    def user_health():
        """Health check for user routes"""
        # No authentication required for health check
        return jsonify(
            status='ok',
            message='User routes are working'
        ), 200
    
    # Register blueprint
    app.register_blueprint(user_bp)
    logger.info("User routes initialized successfully")