from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.validators import RegexValidator, MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from decimal import Decimal
import re

class Department(models.Model):
    """Department model for organizational structure"""
    name = models.CharField(max_length=100, unique=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name_plural = "Departments"
        ordering = ['name']


class UserManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Users must have an email address')
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('first_name', 'Admin')
        extra_fields.setdefault('last_name', 'User')
        extra_fields.setdefault('user_type', 'admin')
        extra_fields.setdefault('department_name', 'Corporate Office')
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_staff', True)
        
        return self.create_user(username, email, password, **extra_fields)


class User(AbstractUser):
    """Extended User model with department and role-based access"""
    
    # Updated department choices to match your structure
    DEPARTMENT_CHOICES = [
        # Corporate Office (4 users - 2 admin, 2 normal)
        ('Corporate Office', 'Corporate Office'),
        
        # Units (2 users each)
        ('Tandur', 'Tandur'),
        ('Rajban', 'Rajban'), 
        ('Bokajan', 'Bokajan'),
        
        # NOUs (1 user each)
        ('Akaltara', 'Akaltara'),
        ('Mandhar', 'Mandhar'),
        ('Nayagaoun', 'Nayagaoun'),
        ('Adilabad', 'Adilabad'),
        ('Kurkunta', 'Kurkunta'),
        ('Delhi Grinding', 'Delhi Grinding'),
        ('Bhatinda Grinding', 'Bhatinda Grinding'),
    ]
    
    # User role choices
    USER_TYPE_CHOICES = [
        ('admin', 'Admin'),
        ('user', 'Regular User'),
    ]
    
    # Required fields
    department_name = models.CharField(
        max_length=50, 
        choices=DEPARTMENT_CHOICES,
        help_text="Department this user belongs to"
    )
    
    user_type = models.CharField(
        max_length=10,
        choices=USER_TYPE_CHOICES,
        default='user',
        help_text="User role type"
    )
    
    # Admin flag for compatibility
    is_admin = models.BooleanField(
        default=False,
        help_text="Designates whether this user has admin privileges"
    )
    
    # Contact information
    phone_number = models.CharField(
        max_length=15,
        validators=[RegexValidator(r'^\+?1?\d{9,15}$')],
        blank=True,
        null=True,
        help_text="Phone number with country code"
    )
    
    # Profile fields
    designation = models.CharField(max_length=100, blank=True, null=True)
    employee_id = models.CharField(max_length=20, unique=True, blank=True, null=True)
    
    # Timestamps
    last_login_ip = models.GenericIPAddressField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Resolve conflicts with default User model
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='cci_users_groups',
        blank=True,
        help_text='The groups this user belongs to.',
        related_query_name='cci_user',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='cci_users_permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_query_name='cci_user',
    )
    objects = UserManager()

    
    class Meta:
        ordering = ['department_name', 'username']
        verbose_name = "CCI User"
        verbose_name_plural = "CCI Users"
    
    def save(self, *args, **kwargs):
        # Sync is_admin with user_type
        if self.user_type == 'admin':
            self.is_admin = True
            self.is_staff = True
        else:
            self.is_admin = False
        super().save(*args, **kwargs)
    
    def __str__(self):
        role = "Admin" if self.is_admin else "User"
        return f"{self.username} ({self.get_department_name_display()}) - {role}"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()
    
    def can_edit_case(self, case):
        """Check if user can edit a specific case"""
        if self.is_admin:
            return True
        return case.internal_department == self.department_name
    
    def can_view_case(self, case):
        """Check if user can view a specific case"""
        return True


def validate_case_number(value):
    """Validate case number is positive integer"""
    if value <= 0:
        raise ValidationError('Case number must be a positive integer')


def validate_case_year(value):
    """Validate case year is reasonable"""
    from datetime import datetime
    current_year = datetime.now().year
    if value < 1947 or value > current_year + 1:
        raise ValidationError(f'Case year must be between 1947 and {current_year + 1}')


def validate_mobile_number(value):
    """Validate exactly 10 digit mobile number"""
    if not re.match(r'^\d{10}$', str(value)):
        raise ValidationError('Mobile number must be exactly 10 digits')


class Case(models.Model):
    """Updated Case model matching exact Excel format requirements"""
    
    # Case Type choices (as per Excel requirement)
    CASE_TYPE_CHOICES = [
        ('CS', 'CS - Civil Suit'),
        ('CRP', 'CRP - Civil Revision Petition'),
        ('CRA', 'CRA - Civil Revision Application'),
        ('WP', 'WP - Writ Petition'),
        ('SLP', 'SLP - Special Leave Petition'),
        ('CC', 'CC - Contempt Case'),
        ('MA', 'MA - Miscellaneous Application'),
        ('CA', 'CA - Civil Appeal'),
        ('Others', 'Others'),
    ]
    
    # Nature of Claim choices (as per Excel requirement)
    NATURE_OF_CLAIM_CHOICES = [
        ('Service', 'Service'),
        ('Labour', 'Labour'),
        ('Contractual', 'Contractual'),
        ('Property', 'Property'),
        ('Land', 'Land'),
        ('Criminal', 'Criminal'),
        ('Arbitration', 'Arbitration'),
        ('Others', 'Others'),
    ]
    
    # ===== EXACT EXCEL COLUMN MAPPING =====
    
    # Column 1-3: Case Number (Type, Number, Year)
    case_type = models.CharField(
        max_length=10,
        # choices=CASE_TYPE_CHOICES,
        help_text="Case type (CS, WP, SLP, etc.)"
    )
    
    case_number = models.PositiveIntegerField(
        validators=[validate_case_number],
        help_text="Case number (positive integer)"
    )
    
    case_year = models.PositiveIntegerField(
        validators=[validate_case_year],
        help_text="Case year (YYYY format)"
    )
    
    # Column 4: Date of Filing/Intimation (DD-MM-YYYY format)
    date_of_filing = models.DateField(
        help_text="Date of filing/intimation (DD-MM-YYYY)"
    )
    
    # Column 5: Pending Before Court
    pending_before_court = models.CharField(
        max_length=200,
        help_text="Court/Tribunal where case is pending"
    )
    
    # Column 6: Party Details (Petitioner)
    party_petitioner = models.TextField(
        max_length=1000,
        help_text="Petitioner/Applicant party details"
    )
    
    # Column 7: Party Details (Respondent)
    party_respondent = models.TextField(
        max_length=1000,
        help_text="Respondent party details"
    )
    
    # Column 8: Nature of Claim (dropdown)
    nature_of_claim = models.CharField(
        max_length=50,
        choices=NATURE_OF_CLAIM_CHOICES,
        help_text="Nature of legal claim"
    )
    
    # Column 9-11: Advocate Details
    advocate_name = models.CharField(
        max_length=200,
        help_text="Advocate's full name"
    )
    
    advocate_email = models.EmailField(
        help_text="Advocate's email address"
    )
    
    advocate_mobile = models.CharField(
        max_length=10,
        validators=[validate_mobile_number],
        help_text="Advocate's 10-digit mobile number"
    )
    
    # Column 12: Financial Implications (Rs. format)
    financial_implications = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Financial amount in Rs. (Indian format)"
    )
    
    # Column 13: Internal Department of CCI
    internal_department = models.CharField(
        max_length=50,
        # choices=User.DEPARTMENT_CHOICES,
        help_text="Internal CCI department handling the case"
    )
    
    # Column 14: Last Date of Hearing
    last_hearing_date = models.DateField(
        null=True,
        blank=True,
        help_text="Last hearing date (DD-MM-YYYY)"
    )
    
    # Column 15: Next Date of Hearing
    next_hearing_date = models.DateField(
        null=True,
        blank=True,
        help_text="Next hearing date (DD-MM-YYYY)"
    )
    
    # Column 16: Brief Description of Matter (popup, max 2500 chars)
    brief_description = models.TextField(
        max_length=2500,
        help_text="Brief description of the matter (max 2500 characters)"
    )
    
    # Column 17: Relief Claimed by Party (popup, max 500 chars)
    relief_claimed = models.TextField(
        max_length=500,
        help_text="Relief claimed by party (max 500 characters)"
    )
    
    # Column 18: Present Status (popup, max 500 chars)
    present_status = models.TextField(
        max_length=500,
        help_text="Present status of the case (max 500 characters)"
    )
    
    # Column 19: Remarks (popup, max 500 chars)
    case_remarks = models.TextField(
        max_length=500,
        blank=True,
        null=True,
        help_text="Additional remarks (max 500 characters)"
    )
    
    # ===== SYSTEM FIELDS =====
    
    # Auto-generated compound case ID for display
    case_id = models.CharField(
        max_length=50,
        unique=True,
        editable=False,
        help_text="Auto-generated case ID (Type/Number/Year)"
    )
    
    # User tracking
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_cases',
        help_text="User who created this case"
    )
    
    last_updated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='updated_cases',
        help_text="User who last updated this case"
    )
    
    # Auto-save tracking
    is_auto_saved = models.BooleanField(
        default=False,
        help_text="Whether this is an auto-saved draft"
    )
    
    auto_save_timestamp = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Last auto-save timestamp"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-case_year', '-case_number']
        verbose_name = "Litigation Case"
        verbose_name_plural = "Litigation Cases"
        unique_together = ['case_type', 'case_number', 'case_year']
        indexes = [
            models.Index(fields=['internal_department']),
            models.Index(fields=['case_type', 'case_year']),
            models.Index(fields=['date_of_filing']),
            models.Index(fields=['next_hearing_date']),
            models.Index(fields=['created_by']),
            models.Index(fields=['case_id']),
        ]
    
    def clean(self):
        """Validate model fields"""
        super().clean()
        
        # Validate case number format
        if self.case_number and self.case_number <= 0:
            raise ValidationError({'case_number': 'Case number must be positive'})
        
        # Validate dates
        if self.last_hearing_date and self.next_hearing_date:
            if self.last_hearing_date > self.next_hearing_date:
                raise ValidationError({
                    'next_hearing_date': 'Next hearing date must be after last hearing date'
                })
    
    def save(self, *args, **kwargs):
        # Auto-generate case_id
        if self.case_type and self.case_number and self.case_year:
            self.case_id = f"{self.case_type}/{self.case_number}/{self.case_year}"
        
        # Auto-update last_updated_by if provided
        if hasattr(self, '_current_user'):
            self.last_updated_by = self._current_user
        
        # Call clean method
        self.clean()
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.case_id} - {self.party_petitioner[:50]}... vs {self.party_respondent[:50]}..."
    
    @property
    def formatted_case_number(self):
        """Return formatted case number for display"""
        return self.case_id
    
    @property
    def formatted_financial_amount(self):
        """Return Indian formatted currency"""
        if not self.financial_implications:
            return "Rs. 0.00"
        
        # Convert to Indian numbering system
        amount = self.financial_implications
        amount_str = f"{amount:,.2f}"
        
        # Convert to Indian format (lakhs, crores)
        parts = amount_str.split('.')
        integer_part = parts[0].replace(',', '')
        decimal_part = parts[1] if len(parts) > 1 else '00'
        
        # Indian numbering system formatting
        if len(integer_part) > 3:
            # Add commas in Indian format
            result = ''
            for i, digit in enumerate(reversed(integer_part)):
                if i == 3:  # After thousands
                    result = ',' + result
                elif i > 3 and (i - 3) % 2 == 0:  # Every 2 digits after thousands
                    result = ',' + result
                result = digit + result
            return f"Rs. {result}.{decimal_part}"
        else:
            return f"Rs. {integer_part}.{decimal_part}"
    
    @property
    def is_hearing_due_soon(self):
        """Check if hearing is due within next 2 days"""
        if not self.next_hearing_date:
            return False
        
        from django.utils import timezone
        from datetime import timedelta
        
        today = timezone.now().date()
        return self.next_hearing_date <= today + timedelta(days=2)
    
    @property
    def case_age_days(self):
        """Calculate case age in days"""
        from django.utils import timezone
        return (timezone.now().date() - self.date_of_filing).days
    
    def get_next_hearing_alert_needed(self):
        """Check if SMS/Email alert is needed"""
        if not self.next_hearing_date:
            return False
        
        from django.utils import timezone
        from datetime import timedelta
        
        tomorrow = timezone.now().date() + timedelta(days=1)
        return self.next_hearing_date == tomorrow


class CaseNote(models.Model):
    """Model for case notes/comments"""
    case = models.ForeignKey(
        Case,
        on_delete=models.CASCADE,
        related_name='notes'
    )
    
    note = models.TextField(help_text="Case note/comment")
    
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='case_notes'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    is_internal = models.BooleanField(
        default=True,
        help_text="Internal note (not visible to external parties)"
    )
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Note for {self.case.case_id} by {self.created_by.username}"


class CaseAutoSave(models.Model):
    """Model for auto-saved case drafts"""
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='auto_saved_cases'
    )
    
    case_data = models.JSONField(
        help_text="Auto-saved case form data"
    )
    
    case_id = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text="Case ID if editing existing case"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
        unique_together = ['user', 'case_id']
    
    def __str__(self):
        case_ref = self.case_id or "New Case"
        return f"Auto-save: {case_ref} by {self.user.username}"


class NotificationLog(models.Model):
    """Model to track SMS/Email notifications sent"""
    
    NOTIFICATION_TYPE_CHOICES = [
        ('sms', 'SMS'),
        ('email', 'Email'),
    ]
    
    NOTIFICATION_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
    ]
    
    case = models.ForeignKey(
        Case,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    
    notification_type = models.CharField(
        max_length=10,
        choices=NOTIFICATION_TYPE_CHOICES
    )
    
    recipient = models.CharField(
        max_length=200,
        help_text="Phone number or email address"
    )
    
    message_content = models.TextField(
        help_text="Notification message content"
    )
    
    status = models.CharField(
        max_length=10,
        choices=NOTIFICATION_STATUS_CHOICES,
        default='pending'
    )
    
    sent_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.notification_type.upper()} to {self.recipient} for {self.case.case_id}"


class UserLoginHistory(models.Model):
    """Track user login history"""
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='login_history'
    )
    
    login_time = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    success = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-login_time']
        verbose_name = "Login History"
        verbose_name_plural = "Login Histories"
    
    def __str__(self):
        return f"{self.user.username} - {self.login_time} - {'Success' if self.success else 'Failed'}"
# models.py - Add this Draft model to your existing models

class Draft(models.Model):
    """Model for storing user drafts persistently"""
    
    DRAFT_TYPE_CHOICES = [
        ('case', 'Case Draft'),
        ('user', 'User Draft'),
        ('other', 'Other Draft'),
    ]
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='drafts',
        help_text="User who owns this draft"
    )
    
    draft_type = models.CharField(
        max_length=10,
        choices=DRAFT_TYPE_CHOICES,
        default='case',
        help_text="Type of draft (case, user, etc.)"
    )
    
    title = models.CharField(
        max_length=200,
        help_text="User-friendly title for the draft"
    )
    
    form_data = models.JSONField(
        help_text="Draft form data as JSON"
    )
    
    case_id = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text="Case ID if editing existing case"
    )
    
    # Auto-generated identifier for frontend
    draft_key = models.CharField(
        max_length=100,
        unique=True,
        help_text="Unique key for frontend identification"
    )
    
    # Metadata
    is_auto_saved = models.BooleanField(
        default=True,
        help_text="Whether this was auto-saved or manually saved"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
        unique_together = ['user', 'draft_key']
        indexes = [
            models.Index(fields=['user', 'draft_type']),
            models.Index(fields=['user', 'case_id']),
            models.Index(fields=['draft_key']),
        ]
    
    def save(self, *args, **kwargs):
        # Auto-generate draft_key if not provided
        if not self.draft_key:
            import uuid
            self.draft_key = f"{self.draft_type}_{self.user.id}_{uuid.uuid4().hex[:8]}"
        
        # Auto-generate title if not provided
        if not self.title:
            if self.case_id:
                self.title = f"Draft for Case {self.case_id}"
            else:
                self.title = f"New {self.draft_type.title()} Draft"
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.title} - {self.user.username}"
    
    @property
    def age_in_minutes(self):
        """Get draft age in minutes"""
        from django.utils import timezone
        return int((timezone.now() - self.updated_at).total_seconds() / 60)
    
    @property
    def is_recent(self):
        """Check if draft was updated recently (within 1 hour)"""
        return self.age_in_minutes <= 60