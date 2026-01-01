import os
import uuid
from werkzeug.utils import secure_filename
from PIL import Image
import logging

logger = logging.getLogger(__name__)


class ImageUploadService:
    """Image upload and processing service for profile pictures"""
    
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
    THUMBNAIL_SIZE = (300, 300)  # Profile picture size
    
    def __init__(self, upload_folder):
        self.upload_folder = upload_folder
        self.profile_pictures_folder = os.path.join(upload_folder, 'profile_pictures')
        
        # Create folders if they don't exist
        os.makedirs(self.profile_pictures_folder, exist_ok=True)
    
    @staticmethod
    def allowed_file(filename):
        """Check if file extension is allowed"""
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in ImageUploadService.ALLOWED_EXTENSIONS
    
    @staticmethod
    def get_file_extension(filename):
        """Get file extension"""
        return filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    
    def generate_unique_filename(self, original_filename):
        """Generate unique filename with original extension"""
        ext = self.get_file_extension(original_filename)
        unique_id = str(uuid.uuid4())
        return f"{unique_id}.{ext}"
    
    def validate_image(self, file):
        """
        Validate uploaded image file
        Returns: (is_valid, error_message)
        """
        try:
            # Check if file exists
            if not file:
                return False, "No file provided"
            
            # Check if file has a filename
            if file.filename == '':
                return False, "No file selected"
            
            # Check file extension
            if not self.allowed_file(file.filename):
                return False, f"File type not allowed. Allowed types: {', '.join(self.ALLOWED_EXTENSIONS)}"
            
            # Check file size (read file into memory to check)
            file.seek(0, os.SEEK_END)
            file_size = file.tell()
            file.seek(0)  # Reset file pointer
            
            if file_size > self.MAX_FILE_SIZE:
                return False, f"File size too large. Maximum size: {self.MAX_FILE_SIZE / (1024 * 1024):.1f}MB"
            
            # Try to open image to verify it's a valid image
            try:
                img = Image.open(file)
                img.verify()
                file.seek(0)  # Reset after verify
            except Exception as e:
                return False, "Invalid image file"
            
            return True, None
            
        except Exception as e:
            logger.error(f"Error validating image: {e}")
            return False, "Error validating image file"
    
    def process_and_save_image(self, file, user_id):
        """
        Process and save profile picture
        Returns: (success, filename/error_message)
        """
        try:
            # Validate image
            is_valid, error_msg = self.validate_image(file)
            if not is_valid:
                return False, error_msg
            
            # Generate unique filename
            original_filename = secure_filename(file.filename)
            unique_filename = self.generate_unique_filename(original_filename)
            
            # Full path for saving
            file_path = os.path.join(self.profile_pictures_folder, unique_filename)
            
            # Open and process image
            img = Image.open(file)
            
            # Convert RGBA to RGB if necessary
            if img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            
            # Resize image to thumbnail size while maintaining aspect ratio
            img.thumbnail(self.THUMBNAIL_SIZE, Image.Resampling.LANCZOS)
            
            # Create a square image with white background
            square_img = Image.new('RGB', self.THUMBNAIL_SIZE, (255, 255, 255))
            
            # Calculate position to paste the resized image (center it)
            paste_x = (self.THUMBNAIL_SIZE[0] - img.size[0]) // 2
            paste_y = (self.THUMBNAIL_SIZE[1] - img.size[1]) // 2
            square_img.paste(img, (paste_x, paste_y))
            
            # Save processed image
            square_img.save(file_path, quality=90, optimize=True)
            
            logger.info(f"Profile picture saved successfully for user {user_id}: {unique_filename}")
            
            # Return relative path for storing in database
            relative_path = f"uploads/profile_pictures/{unique_filename}"
            return True, relative_path
            
        except Exception as e:
            logger.error(f"Error processing and saving image: {e}")
            return False, "Error processing image file"
    
    def delete_old_image(self, image_path):
        """Delete old profile picture"""
        try:
            if not image_path:
                return True
            
            # Check if it's a custom uploaded image (not default avatar)
            if 'dicebear.com' in image_path or 'http' in image_path:
                return True  # Don't delete external URLs
            
            # Construct full path
            # Remove 'uploads/' prefix if present
            if image_path.startswith('uploads/'):
                image_path = image_path.replace('uploads/', '', 1)
            
            full_path = os.path.join(self.upload_folder, image_path)
            
            # Delete file if it exists
            if os.path.exists(full_path):
                os.remove(full_path)
                logger.info(f"Deleted old profile picture: {full_path}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error deleting old image: {e}")
            return False
    
    def get_image_url(self, image_path, app_url):
        """
        Get full URL for profile picture
        Returns: full URL or default avatar URL
        """
        try:
            if not image_path:
                return None
            
            # If it's already a full URL (external service), return as is
            if image_path.startswith('http'):
                return image_path
            
            # If it's a relative path, construct full URL
            if image_path.startswith('uploads/'):
                return f"{app_url}/{image_path}"
            else:
                return f"{app_url}/uploads/{image_path}"
                
        except Exception as e:
            logger.error(f"Error getting image URL: {e}")
            return None
    
    @staticmethod
    def get_default_avatar(username):
        """Get default avatar URL from DiceBear"""
        return f"https://api.dicebear.com/7.x/avataaars/svg?seed={username}"