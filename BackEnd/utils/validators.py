import re
from email_validator import validate_email, EmailNotValidError


class Validators:
    """Input validation utilities"""
    
    @staticmethod
    def validate_email_format(email):
        """
        Validate email format
        Returns: (is_valid, error_message)
        """
        if not email:
            return False, "Email is required"
        
        try:
            # Validate and normalize email
            valid = validate_email(email, check_deliverability=False)
            return True, valid.email
        except EmailNotValidError as e:
            return False, str(e)
    
    @staticmethod
    def validate_username(username):
        """
        Validate username: 3-50 characters, letters, numbers, and underscore only
        Returns: (is_valid, error_message)
        """
        if not username:
            return False, "Username is required"
        
        if len(username) < 3 or len(username) > 50:
            return False, "Username must be between 3 and 50 characters"
        
        if not re.match(r'^[a-zA-Z0-9_]+$', username):
            return False, "Username can only contain letters, numbers, and underscores"
        
        return True, None
    
    @staticmethod
    def validate_password(password):
        """
        Validate password: 8-50 characters, at least 1 special character, no spaces
        Returns: (is_valid, error_message)
        """
        if not password:
            return False, "Password is required"
        
        if len(password) < 8 or len(password) > 50:
            return False, "Password must be between 8 and 50 characters"
        
        if ' ' in password:
            return False, "Password cannot contain spaces"
        
        if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]', password):
            return False, "Password must contain at least one special character"
        
        return True, None
    
    @staticmethod
    def validate_phone(phone):
        """
        Validate phone number: digits, spaces, +, (), -, . allowed, 10-15 characters
        Returns: (is_valid, error_message)
        """
        if not phone:
            return False, "Phone number is required"
        
        # Remove common formatting characters for length check
        clean_phone = re.sub(r'[\s+().-]', '', phone)
        
        if len(clean_phone) < 10 or len(clean_phone) > 15:
            return False, "Phone number must be between 10 and 15 digits"
        
        if not re.match(r'^[\d\s+().-]+$', phone):
            return False, "Phone number contains invalid characters"
        
        return True, None
    
    @staticmethod
    def validate_full_name(full_name):
        """
        Validate full name: letters and spaces only (optional field)
        Returns: (is_valid, error_message)
        """
        if not full_name:
            return True, None  # Optional field
        
        if not re.match(r'^[a-zA-Z\s]+$', full_name):
            return False, "Full name can only contain letters and spaces"
        
        if len(full_name) > 255:
            return False, "Full name is too long"
        
        return True, None
    
    @staticmethod
    def validate_address(address):
        """
        Validate address: required field
        Returns: (is_valid, error_message)
        """
        if not address:
            return False, "Address is required"
        
        if len(address) < 5:
            return False, "Address is too short"
        
        if len(address) > 500:
            return False, "Address is too long"
        
        return True, None
    
    @staticmethod
    def validate_city(city):
        """
        Validate city: required field, letters and spaces
        Returns: (is_valid, error_message)
        """
        if not city:
            return False, "City is required"
        
        if not re.match(r'^[a-zA-Z\s]+$', city):
            return False, "City can only contain letters and spaces"
        
        if len(city) > 100:
            return False, "City name is too long"
        
        return True, None
    
    @staticmethod
    def validate_pincode(pincode):
        """
        Validate pincode: 5-6 digits
        Returns: (is_valid, error_message)
        """
        if not pincode:
            return False, "Pincode is required"
        
        if not re.match(r'^\d{5,6}$', pincode):
            return False, "Pincode must be 5 or 6 digits"
        
        return True, None
    
    @staticmethod
    def validate_service_type(service_type):
        """
        Validate service type: must be express, standard, or economy
        Returns: (is_valid, error_message)
        """
        valid_types = ['express', 'standard', 'economy']
        
        if not service_type:
            return True, 'standard'  # Default value
        
        if service_type not in valid_types:
            return False, f"Service type must be one of: {', '.join(valid_types)}"
        
        return True, service_type
    
    @staticmethod
    def validate_communication_preference(preference):
        """
        Validate communication preference: must be sms, email, or both
        Returns: (is_valid, error_message)
        """
        valid_preferences = ['sms', 'email', 'both']
        
        if not preference:
            return True, 'both'  # Default value
        
        if preference not in valid_preferences:
            return False, f"Communication preference must be one of: {', '.join(valid_preferences)}"
        
        return True, preference
    
    @staticmethod
    def validate_otp(otp):
        """
        Validate OTP: must be 6 digits
        Returns: (is_valid, error_message)
        """
        if not otp:
            return False, "OTP is required"
        
        if not re.match(r'^\d{6}$', otp):
            return False, "OTP must be exactly 6 digits"
        
        return True, None
    
    @staticmethod
    def validate_registration_data(data):
        """
        Validate all registration data
        Returns: (is_valid, errors_dict)
        """
        errors = {}
        
        # Email validation
        is_valid, msg = Validators.validate_email_format(data.get('email'))
        if not is_valid:
            errors['email'] = msg
        
        # Username validation
        is_valid, msg = Validators.validate_username(data.get('username'))
        if not is_valid:
            errors['username'] = msg
        
        # Password validation
        is_valid, msg = Validators.validate_password(data.get('password'))
        if not is_valid:
            errors['password'] = msg
        
        # Phone validation
        is_valid, msg = Validators.validate_phone(data.get('phone'))
        if not is_valid:
            errors['phone'] = msg
        
        # Full name validation (optional)
        is_valid, msg = Validators.validate_full_name(data.get('full_name'))
        if not is_valid:
            errors['full_name'] = msg
        
        # Address validation
        is_valid, msg = Validators.validate_address(data.get('address'))
        if not is_valid:
            errors['address'] = msg
        
        # City validation
        is_valid, msg = Validators.validate_city(data.get('city'))
        if not is_valid:
            errors['city'] = msg
        
        # Pincode validation
        is_valid, msg = Validators.validate_pincode(data.get('pincode'))
        if not is_valid:
            errors['pincode'] = msg
        
        # Service type validation
        is_valid, msg = Validators.validate_service_type(data.get('service_type'))
        if not is_valid:
            errors['service_type'] = msg
        
        # Communication preference validation
        is_valid, msg = Validators.validate_communication_preference(data.get('communication_preference'))
        if not is_valid:
            errors['communication_preference'] = msg
        
        # OTP verification check
        if not data.get('otp_verified'):
            errors['otp'] = "Email must be verified with OTP"
        
        return len(errors) == 0, errors