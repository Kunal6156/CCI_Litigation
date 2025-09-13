from rest_framework import serializers
from .models import User, Case, Department, CaseNote, CaseAutoSave, NotificationLog, UserLoginHistory
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import URLValidator
from django.utils import timezone
from django.contrib.auth import authenticate
from datetime import date, timedelta
import re


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Enhanced JWT token serializer with custom claims and comprehensive validation.
    """
    username_field = 'username'  # Can be username or email
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make department_name optional for login but validate later
        self.fields['department_name'] = serializers.CharField(required=False)
        # Add email field for frontend compatibility
        self.fields['email'] = serializers.CharField(required=False)
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add comprehensive custom claims
        token['user_id'] = user.id
        token['username'] = user.username
        token['email'] = user.email
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        token['full_name'] = user.get_full_name()
        token['department_name'] = user.department_name
        token['user_type'] = user.user_type
        token['is_admin'] = user.is_admin
        token['is_staff'] = user.is_staff
        token['designation'] = user.designation if hasattr(user, 'designation') else ''
        token['employee_id'] = user.employee_id if hasattr(user, 'employee_id') else ''
        token['phone_number'] = user.phone_number if hasattr(user, 'phone_number') else ''
        
        # Add detailed permissions based on role
        token['permissions'] = {
            'can_manage_users': user.is_admin,
            'can_create_users': user.is_admin,
            'can_delete_users': user.is_admin,
            'can_reset_passwords': user.is_admin,
            'can_export_data': True,
            'can_view_all_cases': True,  # As per requirement
            'can_edit_all_cases': user.is_admin,
            'can_delete_all_cases': user.is_admin,
            'can_edit_own_dept_cases': True,
            'can_view_dashboard': True,
            'can_manage_departments': user.is_admin,
            'accessible_departments': [user.department_name] if not user.is_admin else 'all',
            'max_file_upload_size': 10485760,  # 10MB
            'can_bulk_import': user.is_admin,
            'can_view_audit_logs': user.is_admin
        }
        
        return token
    
    def validate(self, attrs):
        # Get login credentials
        username = attrs.get('username') 
        email = attrs.get('email')  # This comes from frontend for email login
        password = attrs.get('password')
        department_name = attrs.get('department_name')
        
        # Determine login identifier - prioritize email if provided
        login_identifier = email or username
        
        if not login_identifier or not password:
            raise serializers.ValidationError({
                'non_field_errors': ['Username/Email and password are required.']
            })
        
        # Clean inputs
        login_identifier = login_identifier.strip()
        password = password.strip() if password else ''
        
        # Try to find user by email first, then by username
        user = None
        try:
            # First, try to detect if login_identifier is an email
            if '@' in login_identifier:
                # Email login - search by email
                user = User.objects.get(email__iexact=login_identifier, is_active=True)
            else:
                # Username login - search by username
                user = User.objects.get(username__iexact=login_identifier, is_active=True)
                
        except User.DoesNotExist:
            # If the above failed, try the opposite approach as fallback
            try:
                if '@' in login_identifier:
                    # Maybe they have a username with @ symbol
                    user = User.objects.get(username__iexact=login_identifier, is_active=True)
                else:
                    # Maybe they entered username but we should check email too
                    user = User.objects.get(email__iexact=login_identifier, is_active=True)
            except User.DoesNotExist:
                raise serializers.ValidationError({
                    'non_field_errors': ['Invalid credentials. Please check your username/email and password.']
                })
        except User.MultipleObjectsReturned:
            raise serializers.ValidationError({
                'non_field_errors': ['Multiple accounts found. Please contact administrator.']
            })
        
        # Authenticate user
        if not user.check_password(password):
            raise serializers.ValidationError({
                'non_field_errors': ['Invalid credentials. Please check your username/email and password.']
            })
        
        # Check if user account is active
        if not user.is_active:
            raise serializers.ValidationError({
                'non_field_errors': ['Your account has been deactivated. Please contact administrator.']
            })
        
        # If department is provided in login, validate it matches user's department
        if department_name and user.department_name != department_name:
            raise serializers.ValidationError({
                'department_name': 'Selected department does not match your assigned department.'
            })
        
        # Set username for the parent serializer
        attrs['username'] = user.username
        
        # Store user for token generation
        self.user = user
        
        return super().validate(attrs)  # This generates the tokens)  # only access/refresh token


class UserSerializer(serializers.ModelSerializer):
    """
    Enhanced User serializer with comprehensive validation and security.
    """
    password = serializers.CharField(write_only=True, required=False, min_length=8)
    confirm_password = serializers.CharField(write_only=True, required=False)
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    department_display = serializers.CharField(source='get_department_name_display', read_only=True)
    cases_created = serializers.IntegerField(read_only=True)
    last_login_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'department_name', 'department_display', 'user_type', 'is_admin', 
            'is_active', 'is_staff', 'phone_number', 'designation', 'employee_id', 
            'password', 'confirm_password', 'date_joined', 'last_login', 
            'last_login_formatted', 'created_at', 'updated_at', 'cases_created'
        ]
        extra_kwargs = {
            'password': {'write_only': True, 'min_length': 8},
            'id': {'read_only': True},
            'date_joined': {'read_only': True},
            'last_login': {'read_only': True},
            'created_at': {'read_only': True},
            'updated_at': {'read_only': True},
            'cases_created': {'read_only': True},
            'username': {'min_length': 3, 'max_length': 150},
            'email': {'required': True},
            'first_name': {'required': True, 'min_length': 2, 'max_length': 30},
            'last_name': {'required': True, 'min_length': 2, 'max_length': 30},
        }
    
    def get_last_login_formatted(self, obj):
        """Format last login date"""
        if obj.last_login:
            return obj.last_login.strftime('%Y-%m-%d %H:%M:%S')
        return 'Never'
    
    def validate_username(self, value):
        """Enhanced username validation"""
        if not value:
            raise serializers.ValidationError('Username is required.')
        
        value = value.strip().lower()
        
        # Username format validation
        if not re.match(r'^[a-zA-Z0-9_.-]+$', value):
            raise serializers.ValidationError(
                'Username can only contain letters, numbers, dots, hyphens, and underscores.'
            )
        
        # Length validation
        if len(value) < 3:
            raise serializers.ValidationError('Username must be at least 3 characters long.')
        
        if len(value) > 150:
            raise serializers.ValidationError('Username cannot exceed 150 characters.')
        
        # Reserved usernames
        reserved_usernames = ['admin', 'administrator', 'root', 'system', 'api', 'test']
        if value.lower() in reserved_usernames:
            raise serializers.ValidationError('This username is reserved.')
        
        # Check uniqueness (excluding current instance for updates)
        queryset = User.objects.filter(username__iexact=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        
        if queryset.exists():
            raise serializers.ValidationError('A user with this username already exists.')
        
        return value
    
    def validate_email(self, value):
        """Enhanced email validation"""
        if not value:
            raise serializers.ValidationError('Email is required.')
        
        value = value.strip().lower()
        
        # Basic email format is handled by EmailField, but add custom checks
        if len(value) > 254:
            raise serializers.ValidationError('Email address is too long.')
        
        # Check for valid domain (basic check)
        if value.count('@') != 1:
            raise serializers.ValidationError('Invalid email format.')
        
        local, domain = value.split('@')
        if not local or not domain:
            raise serializers.ValidationError('Invalid email format.')
        
        # Check uniqueness (excluding current instance for updates)
        queryset = User.objects.filter(email__iexact=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        
        if queryset.exists():
            raise serializers.ValidationError('A user with this email already exists.')
        
        return value
    
    def validate_first_name(self, value):
        """Validate first name"""
        if not value or not value.strip():
            raise serializers.ValidationError('First name is required.')
        
        value = value.strip().title()
        
        # Only allow letters, spaces, hyphens, and apostrophes
        if not re.match(r"^[a-zA-Z\s\-']+$", value):
            raise serializers.ValidationError(
                'First name can only contain letters, spaces, hyphens, and apostrophes.'
            )
        
        return value
    
    def validate_last_name(self, value):
        """Validate last name"""
        if not value or not value.strip():
            raise serializers.ValidationError('Last name is required.')
        
        value = value.strip().title()
        
        # Only allow letters, spaces, hyphens, and apostrophes
        if not re.match(r"^[a-zA-Z\s\-']+$", value):
            raise serializers.ValidationError(
                'Last name can only contain letters, spaces, hyphens, and apostrophes.'
            )
        
        return value
    
    def validate_phone_number(self, value):
        """Validate phone number"""
        if value:
            value = value.strip()
            # Indian phone number validation (basic)
            if not re.match(r'^\+?91?[6-9]\d{9}$', value.replace('-', '').replace(' ', '')):
                raise serializers.ValidationError(
                    'Please enter a valid Indian phone number.'
                )
        return value
    
    def validate_employee_id(self, value):
        """Validate employee ID uniqueness and format"""
        if value:
            value = value.strip().upper()
            
            # Basic format validation (adjust as needed)
            if not re.match(r'^[A-Z0-9]{3,20}$', value):
                raise serializers.ValidationError(
                    'Employee ID must be 3-20 characters long and contain only letters and numbers.'
                )
            
            # Check uniqueness (excluding current instance for updates)
            queryset = User.objects.filter(employee_id__iexact=value)
            if self.instance:
                queryset = queryset.exclude(pk=self.instance.pk)
            
            if queryset.exists():
                raise serializers.ValidationError('A user with this employee ID already exists.')
        
        return value
    
    def validate_designation(self, value):
        """Validate designation"""
        if value:
            value = value.strip().title()
            if len(value) > 100:
                raise serializers.ValidationError('Designation cannot exceed 100 characters.')
        return value
    
    def validate(self, data):
        """Enhanced cross-field validation"""
        # Password validation
        password = data.get('password')
        confirm_password = data.get('confirm_password')
        
        # For new users, password is required
        if not self.instance and not password:
            raise serializers.ValidationError({
                'password': 'Password is required for new users.'
            })
        
        # If password is provided, validate confirmation
        if password or confirm_password:
            if password != confirm_password:
                raise serializers.ValidationError({
                    'confirm_password': 'Password confirmation does not match.'
                })
            
            if password:
                # Django password validation
                try:
                    validate_password(password, self.instance)
                except DjangoValidationError as e:
                    raise serializers.ValidationError({'password': list(e.messages)})
                
                # Additional custom password rules
                if len(password) < 8:
                    raise serializers.ValidationError({
                        'password': 'Password must be at least 8 characters long.'
                    })
                
                # Check for at least one uppercase, lowercase, digit, and special char
                if not re.search(r'[A-Z]', password):
                    raise serializers.ValidationError({
                        'password': 'Password must contain at least one uppercase letter.'
                    })
                
                if not re.search(r'[a-z]', password):
                    raise serializers.ValidationError({
                        'password': 'Password must contain at least one lowercase letter.'
                    })
                
                if not re.search(r'\d', password):
                    raise serializers.ValidationError({
                        'password': 'Password must contain at least one digit.'
                    })
                
                if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>?]', password):
                    raise serializers.ValidationError({
                        'password': 'Password must contain at least one special character.'
                    })
        
        # Required fields for new users
        if not self.instance:  # Creating new user
            required_fields = ['username', 'email', 'first_name', 'last_name', 'department_name']
            for field in required_fields:
                if not data.get(field):
                    raise serializers.ValidationError({
                        field: 'This field is required for new users.'
                    })
        
        # Department validation
        department_name = data.get('department_name')
        if department_name:
            valid_departments = [choice[0] for choice in User.DEPARTMENT_CHOICES]
            if department_name not in valid_departments:
                raise serializers.ValidationError({
                    'department_name': f'Invalid department. Must be one of: {", ".join(valid_departments)}'
                })
        
        # User type validation
        user_type = data.get('user_type', 'user')
        if user_type not in ['admin', 'user']:
            raise serializers.ValidationError({
                'user_type': 'User type must be either "admin" or "user".'
            })
        
        return data
    
    def create(self, validated_data):
        """Create user with proper password hashing and defaults"""
        validated_data.pop('confirm_password', None)
        password = validated_data.pop('password', None)
        
        # Set defaults
        validated_data.setdefault('is_active', True)
        validated_data.setdefault('user_type', 'user')
        
        # Set is_admin based on user_type
        validated_data['is_admin'] = (validated_data.get('user_type') == 'admin')
        
        # Create user
        user = User.objects.create(**validated_data)
        
        # Set password
        if password:
            user.set_password(password)
            user.save()
        
        return user
    
    def update(self, instance, validated_data):
        """Update user with proper password handling"""
        validated_data.pop('confirm_password', None)
        password = validated_data.pop('password', None)
        
        # Update is_admin based on user_type if changed
        if 'user_type' in validated_data:
            validated_data['is_admin'] = (validated_data['user_type'] == 'admin')
        
        # Update fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Update password if provided
        if password:
            instance.set_password(password)
        
        instance.save()
        return instance


class UserSummarySerializer(serializers.ModelSerializer):
    """Lightweight user serializer for dropdowns and references"""
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    department_display = serializers.CharField(source='get_department_name_display', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'full_name', 'department_name', 
            'department_display', 'user_type', 'is_admin', 'is_active',
            'last_login', 'employee_id'
        ]


class CaseSerializer(serializers.ModelSerializer):
    """
    Updated Case serializer matching exact Excel format requirements
    """
    # Computed fields for display
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    last_updated_by_username = serializers.CharField(source='last_updated_by.username', read_only=True)
    last_updated_by_name = serializers.CharField(source='last_updated_by.get_full_name', read_only=True)
    internal_department_display = serializers.CharField(source='get_internal_department_display', read_only=True)
    case_type_display = serializers.CharField(source='get_case_type_display', read_only=True)
    nature_of_claim_display = serializers.CharField(source='get_nature_of_claim_display', read_only=True)
    
    # Computed properties
    formatted_case_number = serializers.CharField( read_only=True)
    formatted_financial_amount = serializers.CharField(read_only=True)
    case_age_days = serializers.IntegerField( read_only=True)
    is_hearing_due_soon = serializers.BooleanField(read_only=True)
    
    # Date formatting for frontend (DD-MM-YYYY)
    date_of_filing_formatted = serializers.SerializerMethodField()
    last_hearing_date_formatted = serializers.SerializerMethodField()
    next_hearing_date_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = Case
        fields = [
            # Core Excel columns
            'id', 'case_id', 'case_type', 'case_number', 'case_year',
            'date_of_filing', 'date_of_filing_formatted',
            'pending_before_court', 'party_petitioner', 'party_respondent',
            'nature_of_claim', 'nature_of_claim_display',
            'advocate_name', 'advocate_email', 'advocate_mobile',
            'financial_implications', 'formatted_financial_amount',
            'internal_department', 'internal_department_display',
            'last_hearing_date', 'last_hearing_date_formatted',
            'next_hearing_date', 'next_hearing_date_formatted',
            'brief_description', 'relief_claimed', 'present_status', 'case_remarks',
            
            # System fields
            'created_by', 'created_by_username', 'created_by_name',
            'last_updated_by', 'last_updated_by_username', 'last_updated_by_name',
            'is_auto_saved', 'auto_save_timestamp',
            'created_at', 'updated_at',
            
            # Computed fields
            'formatted_case_number', 'case_type_display',
            'case_age_days', 'is_hearing_due_soon'
        ]
        read_only_fields = (
            'id', 'case_id', 'created_at', 'updated_at', 'created_by', 'last_updated_by',
            'formatted_case_number', 'formatted_financial_amount', 'case_age_days',
            'is_hearing_due_soon', 'internal_department_display', 'case_type_display',
            'nature_of_claim_display', 'created_by_username', 'created_by_name',
            'last_updated_by_username', 'last_updated_by_name', 'auto_save_timestamp'
        )
    
    def get_date_of_filing_formatted(self, obj):
        """Format date as DD-MM-YYYY"""
        return obj.date_of_filing.strftime('%d-%m-%Y') if obj.date_of_filing else None
    
    def get_last_hearing_date_formatted(self, obj):
        """Format date as DD-MM-YYYY"""
        return obj.last_hearing_date.strftime('%d-%m-%Y') if obj.last_hearing_date else None
    
    def get_next_hearing_date_formatted(self, obj):
        """Format date as DD-MM-YYYY"""
        return obj.next_hearing_date.strftime('%d-%m-%Y') if obj.next_hearing_date else None
    
    def validate_case_type(self, value):
        """Allow any case type, just ensure it's not empty"""
        if not value or not value.strip():
            raise serializers.ValidationError("Case type cannot be empty.")
        return value.strip().upper()  
    
    def validate_case_number(self, value):
        """Validate case number"""
        if not value:
            raise serializers.ValidationError('Case number is required.')
        
        if value <= 0:
            raise serializers.ValidationError('Case number must be a positive integer.')
        
        if value > 999999:
            raise serializers.ValidationError('Case number cannot exceed 999999.')
        
        return value
    
    def validate_case_year(self, value):
        """Validate case year"""
        if not value:
            raise serializers.ValidationError('Case year is required.')
        
        current_year = date.today().year
        if value < 1947 or value > current_year + 1:
            raise serializers.ValidationError(
                f'Case year must be between 1947 and {current_year + 1}.'
            )
        
        return value
    
    def validate_date_of_filing(self, value):
        """Validate date of filing"""
        if not value:
            raise serializers.ValidationError('Date of filing is required.')
        
        # Cannot be in the future
        if value > date.today():
            raise serializers.ValidationError('Date of filing cannot be in the future.')
        
        # Cannot be too old (100 years)
        min_date = date.today() - timedelta(days=365 * 100)
        if value < min_date:
            raise serializers.ValidationError('Date of filing cannot be more than 100 years ago.')
        
        return value
    
    def validate_pending_before_court(self, value):
        """Validate court details"""
        if not value or not value.strip():
            raise serializers.ValidationError('Court/Tribunal information is required.')
        
        value = value.strip()
        if len(value) > 200:
            raise serializers.ValidationError('Court information cannot exceed 200 characters.')
        
        return value
    
    def validate_party_petitioner(self, value):
        """Validate petitioner details"""
        if not value or not value.strip():
            raise serializers.ValidationError('Petitioner details are required.')
        
        value = value.strip()
        if len(value) > 1000:
            raise serializers.ValidationError('Petitioner details cannot exceed 1000 characters.')
        
        return value
    
    def validate_party_respondent(self, value):
        """Validate respondent details"""
        if not value or not value.strip():
            raise serializers.ValidationError('Respondent details are required.')
        
        value = value.strip()
        if len(value) > 1000:
            raise serializers.ValidationError('Respondent details cannot exceed 1000 characters.')
        
        return value
    
    def validate_nature_of_claim(self, value):
        """Validate nature of claim"""
        if not value:
            raise serializers.ValidationError('Nature of claim is required.')
        
        valid_claims = [choice[0] for choice in Case.NATURE_OF_CLAIM_CHOICES]
        if value not in valid_claims:
            raise serializers.ValidationError(
                f'Invalid nature of claim. Must be one of: {", ".join(valid_claims)}'
            )
        return value
    
    def validate_advocate_name(self, value):
        """Validate advocate name"""
        if not value or not value.strip():
            raise serializers.ValidationError('Advocate name is required.')
        
        value = value.strip()
        if len(value) > 200:
            raise serializers.ValidationError('Advocate name cannot exceed 200 characters.')
        
        # Basic name validation
        if not re.match(r"^[a-zA-Z\s\-'.]+$", value):
            raise serializers.ValidationError(
                'Advocate name can only contain letters, spaces, hyphens, dots, and apostrophes.'
            )
        
        return value
    
    def validate_advocate_email(self, value):
        """Validate advocate email"""
        if not value or not value.strip():
            raise serializers.ValidationError('Advocate email is required.')
        
        value = value.strip().lower()
        
        # Email format validation
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', value):
            raise serializers.ValidationError('Please enter a valid email address.')
        
        return value
    
    def validate_advocate_mobile(self, value):
        """Validate advocate mobile (exactly 10 digits)"""
        if not value:
            raise serializers.ValidationError('Advocate mobile number is required.')
        
        # Clean the value (remove spaces, hyphens)
        cleaned_value = re.sub(r'[\s\-()]', '', str(value))
        
        # Must be exactly 10 digits
        if not re.match(r'^\d{10}$', cleaned_value):
            raise serializers.ValidationError('Mobile number must be exactly 10 digits.')
        
        # Must start with valid Indian mobile prefix (6, 7, 8, 9)
        if not cleaned_value[0] in '6789':
            raise serializers.ValidationError('Mobile number must start with 6, 7, 8, or 9.')
        
        return cleaned_value
    
    def validate_financial_implications(self, value):
        """Validate financial amount"""
        if value is not None:
            if value < 0:
                raise serializers.ValidationError('Financial amount cannot be negative.')
            
            # Set reasonable maximum (1 trillion INR)
            max_value = 1000000000000
            if value > max_value:
                raise serializers.ValidationError('Financial amount exceeds maximum allowed.')
        
        return value
    
    def validate_internal_department(self, value):
        """Allow any department name, just ensure it's not empty"""
        if not value or not value.strip():
            raise serializers.ValidationError("Internal department cannot be empty.")
        return value.strip()

    
    def validate_last_hearing_date(self, value):
        """Validate last hearing date"""
        if value:
            # Cannot be too far in the future
            max_date = date.today() + timedelta(days=30)
            if value > max_date:
                raise serializers.ValidationError('Last hearing date cannot be more than 30 days in the future.')
            
            # Cannot be too old
            min_date = date.today() - timedelta(days=365 * 10)
            if value < min_date:
                raise serializers.ValidationError('Last hearing date cannot be more than 10 years ago.')
        
        return value
    
    def validate_next_hearing_date(self, value):
        """Validate next hearing date"""
        if value:
            # Cannot be in the past (allow today)
            if value < date.today():
                raise serializers.ValidationError('Next hearing date cannot be in the past.')
            
            # Cannot be too far in the future
            max_date = date.today() + timedelta(days=365 * 5)
            if value > max_date:
                raise serializers.ValidationError('Next hearing date cannot be more than 5 years in the future.')
        
        return value
    
    def validate_brief_description(self, value):
        """Validate brief description (max 2500 chars)"""
        if not value or not value.strip():
            raise serializers.ValidationError('Brief description is required.')
        
        value = value.strip()
        if len(value) > 2500:
            raise serializers.ValidationError('Brief description cannot exceed 2500 characters.')
        
        if len(value) < 10:
            raise serializers.ValidationError('Brief description must be at least 10 characters long.')
        
        return value
    
    def validate_relief_claimed(self, value):
        """Validate relief claimed (max 500 chars)"""
        if not value or not value.strip():
            raise serializers.ValidationError('Relief claimed is required.')
        
        value = value.strip()
        if len(value) > 500:
            raise serializers.ValidationError('Relief claimed cannot exceed 500 characters.')
        
        return value
    
    def validate_present_status(self, value):
        """Validate present status (max 500 chars)"""
        if not value or not value.strip():
            raise serializers.ValidationError('Present status is required.')
        
        value = value.strip()
        if len(value) > 500:
            raise serializers.ValidationError('Present status cannot exceed 500 characters.')
        
        return value
    
    def validate_case_remarks(self, value):
        """Validate case remarks (max 500 chars, optional)"""
        if value:
            value = value.strip()
            if len(value) > 500:
                raise serializers.ValidationError('Case remarks cannot exceed 500 characters.')
        
        return value
    
    def validate(self, data):
        """Enhanced cross-field validation"""
        # Ensure unique case combination
        case_type = data.get('case_type')
        case_number = data.get('case_number')
        case_year = data.get('case_year')
        
        if case_type and case_number and case_year:
            # Check uniqueness (excluding current instance for updates)
            queryset = Case.objects.filter(
                case_type=case_type,
                case_number=case_number,
                case_year=case_year
            )
            if self.instance:
                queryset = queryset.exclude(pk=self.instance.pk)
            
            if queryset.exists():
                raise serializers.ValidationError({
                    'case_number': f'Case {case_type}/{case_number}/{case_year} already exists.'
                })
        
        # Date cross-validation
        date_filing = data.get('date_of_filing')
        last_hearing = data.get('last_hearing_date')
        next_hearing = data.get('next_hearing_date')
        
        # Last hearing cannot be before filing date
        if date_filing and last_hearing:
            if last_hearing < date_filing:
                raise serializers.ValidationError({
                    'last_hearing_date': 'Last hearing date cannot be before filing date.'
                })
        
        # Next hearing cannot be before last hearing
        if last_hearing and next_hearing:
            if next_hearing < last_hearing:
                raise serializers.ValidationError({
                    'next_hearing_date': 'Next hearing date cannot be before last hearing date.'
                })
        
        # Case year should match filing year (allow 1 year difference for practicality)
        if case_year and date_filing:
            filing_year = date_filing.year
            if abs(case_year - filing_year) > 1:
                raise serializers.ValidationError({
                    'case_year': f'Case year ({case_year}) should be close to filing year ({filing_year}).'
                })
        
        return data


class CaseSummarySerializer(serializers.ModelSerializer):
    """Lightweight case serializer for lists and references"""
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    internal_department_display = serializers.CharField(source='get_internal_department_display', read_only=True)
    case_age_days = serializers.IntegerField(source='case_age_days', read_only=True)
    is_hearing_due_soon = serializers.BooleanField(source='is_hearing_due_soon', read_only=True)
    formatted_case_number = serializers.CharField(source='formatted_case_number', read_only=True)
    formatted_financial_amount = serializers.CharField(source='formatted_financial_amount', read_only=True)
    
    class Meta:
        model = Case
        fields = [
            'id', 'case_id', 'formatted_case_number', 'case_type', 'case_number', 'case_year',
            'date_of_filing', 'party_petitioner', 'party_respondent',
            'nature_of_claim', 'next_hearing_date', 'internal_department', 
            'internal_department_display', 'created_by_name', 'created_at',
            'case_age_days', 'is_hearing_due_soon', 'financial_implications',
            'formatted_financial_amount'
        ]


class CaseAutoSaveSerializer(serializers.ModelSerializer):
    """Serializer for auto-saved case drafts"""
    
    class Meta:
        model = CaseAutoSave
        fields = [
            'id', 'user', 'case_data', 'case_id', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')
    
    def validate_case_data(self, value):
        """Validate case data JSON"""
        if not isinstance(value, dict):
            raise serializers.ValidationError('Case data must be a valid JSON object.')
        
        # Basic validation of required fields
        required_fields = ['case_type', 'case_number', 'case_year']
        for field in required_fields:
            if field not in value:
                raise serializers.ValidationError(f'Case data must include {field}.')
        
        return value


class NotificationLogSerializer(serializers.ModelSerializer):
    """Serializer for notification logs"""
    case_details = CaseSummarySerializer(source='case', read_only=True)
    
    class Meta:
        model = NotificationLog
        fields = [
            'id', 'case', 'case_details', 'notification_type', 'recipient',
            'message_content', 'status', 'sent_at', 'error_message', 'created_at'
        ]
        read_only_fields = ('id', 'sent_at', 'created_at')


class DepartmentSerializer(serializers.ModelSerializer):
    """Enhanced Department serializer with statistics"""
    total_users = serializers.SerializerMethodField()
    active_users = serializers.SerializerMethodField()
    total_cases = serializers.SerializerMethodField()
    pending_cases = serializers.SerializerMethodField()
    
    class Meta:
        model = Department
        fields = [
            'id', 'name', 'total_users', 'active_users', 'total_cases', 'pending_cases'
        ]
    
    def get_total_users(self, obj):
        """Get total users in department"""
        return User.objects.filter(department_name=obj.name).count()
    
    def get_active_users(self, obj):
        """Get active users in department"""
        return User.objects.filter(department_name=obj.name, is_active=True).count()
    
    def get_total_cases(self, obj):
        """Get total cases in department"""
        return Case.objects.filter(internal_department=obj.name).count()
    
    def get_pending_cases(self, obj):
        """Get pending cases in department"""
        return Case.objects.filter(
            internal_department=obj.name,
            present_status__icontains='pending'
        ).count()


class CaseNoteSerializer(serializers.ModelSerializer):
    """Case notes serializer for case updates and comments"""
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = CaseNote
        fields = [
            'id', 'case', 'note', 'is_internal', 'created_by', 'created_by_name', 
            'created_at'
        ]
        read_only_fields = ('id', 'created_by', 'created_at')
    
    def validate_note(self, value):
        """Validate note content"""
        if not value or not value.strip():
            raise serializers.ValidationError('Note content is required.')
        
        value = value.strip()
        if len(value) > 2000:
            raise serializers.ValidationError('Note content cannot exceed 2000 characters.')
        
        return value


class UserLoginHistorySerializer(serializers.ModelSerializer):
    """User login history serializer"""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    department_name = serializers.CharField(source='user.department_name', read_only=True)
    
    class Meta:
        model = UserLoginHistory
        fields = [
            'id', 'user', 'user_name', 'department_name', 'login_time',
            'ip_address', 'user_agent', 'success'
        ]
        read_only_fields = fields


class DashboardStatsSerializer(serializers.Serializer):
    """Serializer for dashboard statistics data"""
    total_cases = serializers.IntegerField()
    pending_cases = serializers.IntegerField()
    disposed_cases = serializers.IntegerField()
    overdue_cases = serializers.IntegerField()
    recent_cases = CaseSummarySerializer(many=True, read_only=True)
    department_wise_stats = serializers.DictField()
    monthly_stats = serializers.DictField()
    user_department = serializers.CharField()
    user_permissions = serializers.DictField()
    hearings_due_soon = serializers.IntegerField()
    high_value_cases = serializers.IntegerField()


class PasswordResetSerializer(serializers.Serializer):
    """Password reset serializer for admin use"""
    new_password = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(min_length=8, write_only=True)
    
    def validate(self, data):
        """Validate password confirmation"""
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'Password confirmation does not match.'
            })
        
        # Django password validation
        try:
            validate_password(data['new_password'])
        except DjangoValidationError as e:
            raise serializers.ValidationError({'new_password': list(e.messages)})
        
        # Additional custom password rules
        password = data['new_password']
        
        if not re.search(r'[A-Z]', password):
            raise serializers.ValidationError({
                'new_password': 'Password must contain at least one uppercase letter.'
            })
        
        if not re.search(r'[a-z]', password):
            raise serializers.ValidationError({
                'new_password': 'Password must contain at least one lowercase letter.'
            })
        
        if not re.search(r'\d', password):
            raise serializers.ValidationError({
                'new_password': 'Password must contain at least one digit.'
            })
        
        if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>?]', password):
            raise serializers.ValidationError({
                'new_password': 'Password must contain at least one special character.'
            })
        
        return data


class CaseFilterSerializer(serializers.Serializer):
    """Serializer for case filtering parameters"""
    search = serializers.CharField(required=False, max_length=200)
    internal_department = serializers.CharField(required=False, max_length=50)
    case_type = serializers.CharField(required=False, max_length=10)
    nature_of_claim = serializers.CharField(required=False, max_length=50)
    date_from = serializers.DateField(required=False)
    date_to = serializers.DateField(required=False)
    sort_by = serializers.CharField(required=False, max_length=50)
    sort_order = serializers.ChoiceField(choices=['asc', 'desc'], required=False, default='desc')
    
    def validate_date_from(self, value):
        """Validate from date"""
        if value and value > date.today():
            raise serializers.ValidationError('From date cannot be in the future.')
        return value
    
    def validate_date_to(self, value):
        """Validate to date"""
        if value and value > date.today():
            raise serializers.ValidationError('To date cannot be in the future.')
        return value
    
    def validate(self, data):
        """Cross-field validation"""
        date_from = data.get('date_from')
        date_to = data.get('date_to')
        
        if date_from and date_to and date_from > date_to:
            raise serializers.ValidationError({
                'date_to': 'To date must be after from date.'
            })
        
        return data


class BulkCaseImportSerializer(serializers.Serializer):
    """Serializer for bulk case import validation"""
    file = serializers.FileField()
    internal_department = serializers.CharField(max_length=50)
    
    def validate_file(self, value):
        """Validate uploaded file"""
        if not value.name.endswith(('.xlsx', '.xls', '.csv')):
            raise serializers.ValidationError(
                'Only Excel (.xlsx, .xls) and CSV files are supported.'
            )
        
        # Check file size (10MB limit)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError(
                'File size cannot exceed 10MB.'
            )
        
        return value
    
    def validate_internal_department(self, value):
        """Validate department name"""
        valid_departments = [choice[0] for choice in User.DEPARTMENT_CHOICES]
        if value not in valid_departments:
            raise serializers.ValidationError(
                f'Invalid department. Must be one of: {", ".join(valid_departments)}'
            )
        return value


class ExportSerializer(serializers.Serializer):
    """Serializer for data export parameters"""
    format = serializers.ChoiceField(choices=['excel', 'csv', 'pdf'], default='excel')
    date_from = serializers.DateField(required=False)
    date_to = serializers.DateField(required=False)
    internal_department = serializers.ChoiceField(choices=User.DEPARTMENT_CHOICES, required=False)
    case_type = serializers.CharField(max_length=10, required=False)
    nature_of_claim = serializers.CharField(max_length=50, required=False)
    include_notes = serializers.BooleanField(default=False)
    
    def validate(self, data):
        """Validate date range"""
        date_from = data.get('date_from')
        date_to = data.get('date_to')
        
        if date_from and date_to:
            if date_from > date_to:
                raise serializers.ValidationError({
                    'date_from': 'Start date cannot be after end date.'
                })
            
            # Limit export range to 2 years
            if (date_to - date_from).days > 730:
                raise serializers.ValidationError({
                    'date_range': 'Export range cannot exceed 2 years.'
                })
        
        return data


class SMSNotificationSerializer(serializers.Serializer):
    """Serializer for SMS notification settings"""
    mobile_number = serializers.CharField(max_length=10)
    case_id = serializers.CharField(max_length=50)
    notification_type = serializers.ChoiceField(choices=['hearing_reminder', 'case_update'])
    
    def validate_mobile_number(self, value):
        """Validate mobile number format"""
        # Clean the value
        cleaned_value = re.sub(r'[\s\-()]', '', str(value))
        
        # Must be exactly 10 digits
        if not re.match(r'^\d{10}$', cleaned_value): 
                        
            raise serializers.ValidationError('Mobile number must be exactly 10 digits.')
        
        # Must start with valid Indian mobile prefix
        if not cleaned_value[0] in '6789':
            raise serializers.ValidationError('Mobile number must start with 6, 7, 8, or 9.')
        
        return cleaned_value
    
# serializers.py - Add Draft serializer

from rest_framework import serializers
from .models import Draft

class DraftSerializer(serializers.ModelSerializer):
    """Serializer for Draft model"""
    age_in_minutes = serializers.ReadOnlyField()
    is_recent = serializers.ReadOnlyField()
    user_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Draft
        fields = [
            'id', 'draft_key', 'title', 'draft_type', 'form_data',
            'case_id', 'is_auto_saved', 'created_at', 'updated_at',
            'age_in_minutes', 'is_recent', 'user_info'
        ]
        read_only_fields = ['id', 'draft_key', 'created_at', 'updated_at']
    
    def get_user_info(self, obj):
        """Get basic user information"""
        return {
            'id': obj.user.id,
            'username': obj.user.username,
            'full_name': obj.user.get_full_name(),
            'department': obj.user.department_name
        }
    
    def validate_form_data(self, value):
        """Validate form data is a valid JSON object"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Form data must be a JSON object")
        return value
    
    def validate_title(self, value):
        """Validate title length"""
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Title must be at least 3 characters long")
        return value.strip()


class DraftSummarySerializer(serializers.ModelSerializer):
    """Simplified serializer for draft lists"""
    age_in_minutes = serializers.ReadOnlyField()
    is_recent = serializers.ReadOnlyField()
    
    class Meta:
        model = Draft
        fields = [
            'id', 'draft_key', 'title', 'draft_type', 'case_id',
            'is_auto_saved', 'updated_at', 'age_in_minutes', 'is_recent'
        ]