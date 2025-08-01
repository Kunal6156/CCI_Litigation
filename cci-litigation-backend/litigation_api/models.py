from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator

class Department(models.Model):
    """Department model for organizational structure"""
    name = models.CharField(max_length=100, unique=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name_plural = "Departments"
        ordering = ['name']


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
    
    class Meta:
        ordering = ['department_name', 'username']
        verbose_name = "CCI User"
        verbose_name_plural = "CCI Users"
    
    def save(self, *args, **kwargs):
        # Sync is_admin with user_type
        if self.user_type == 'admin':
            self.is_admin = True
            self.is_staff = True  # Admin users can access Django admin
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
        return case.department_name == self.department_name
    
    def can_view_case(self, case):
        """Check if user can view a specific case"""
        # All users can view all cases, but edit only their department's
        return True


class Case(models.Model):
    """Enhanced Case model with all required validations"""
    
    # Priority levels
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    # Case status choices
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('under_hearing', 'Under Hearing'),
        ('admitted', 'Admitted'),
        ('disposed', 'Disposed'),
        ('closed', 'Closed'),
        ('dismissed', 'Dismissed'),
        ('settled', 'Settled'),
        ('withdrawn', 'Withdrawn'),
    ]
    
    # Litigation type choices
    LITIGATION_TYPE_CHOICES = [
        ('civil', 'Civil'),
        ('criminal', 'Criminal'),
        ('constitutional', 'Constitutional'),
        ('commercial', 'Commercial'),
        ('tax', 'Tax'),
        ('labor', 'Labor'),
        ('environmental', 'Environmental'),
        ('consumer', 'Consumer'),
        ('administrative', 'Administrative'),
        ('others', 'Others'),
    ]

    
    # Core mandatory fields
    case_id = models.CharField(
        max_length=50, 
        unique=True,
        help_text="Unique identifier for the case"
    )
    
    case_name = models.CharField(
        max_length=255,
        help_text="Name/title of the case"
    )
    
    date_of_institution = models.DateField(
        help_text="Date when the case was instituted"
    )
    
    parties_involved_complainant = models.TextField(
        max_length=500,
        help_text="Details of complainant/applicant parties"
    )
    
    parties_involved_opposite = models.TextField(
        max_length=500,
        help_text="Details of opposite/respondent parties"
    )
    
    bench = models.CharField(
        max_length=100,
        help_text="Bench/Court where case is filed"
    )
    
    sections_involved = models.CharField(
        max_length=255,
        help_text="Legal sections/acts involved"
    )
    
    status_of_case = models.CharField(
        max_length=100,
        choices=STATUS_CHOICES,
        default='pending',
        help_text="Current status of the case"
    )
    
    type_of_litigation = models.CharField(
        max_length=100,
        choices=LITIGATION_TYPE_CHOICES,
        help_text="Type/category of litigation"
    )
    
    relief_orders_prayed = models.TextField(
        help_text="Relief/orders prayed for in the case"
    )
    
    important_directions_orders = models.TextField(
        help_text="Important directions/orders issued"
    )
    
    # Optional date fields
    date_of_next_hearing_order = models.DateField(
        null=True, 
        blank=True,
        help_text="Date of next hearing/order"
    )
    
    date_of_final_order = models.DateField(
        null=True, 
        blank=True,
        help_text="Date of final order/judgment"
    )
    
    # Optional text fields
    outcome = models.TextField(
        null=True, 
        blank=True,
        help_text="Final outcome of the case"
    )
    
    link_of_order_judgment = models.URLField(
        max_length=500, 
        null=True, 
        blank=True,
        help_text="Link to order/judgment document"
    )
    
    # Department and user tracking
    department_name = models.CharField(
        max_length=50, 
        choices=User.DEPARTMENT_CHOICES,
        help_text="Department responsible for this case"
    )
    
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
    
    # Additional metadata
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='medium',
        help_text="Priority level of the case"
    )
    
    case_value = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Monetary value involved in the case"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # File attachments (optional)
    attachment_count = models.PositiveIntegerField(
        default=0,
        help_text="Number of documents attached"
    )
    
    class Meta:
        ordering = ['-date_of_institution', 'case_id']
        verbose_name = "Litigation Case"
        verbose_name_plural = "Litigation Cases"
        indexes = [
            models.Index(fields=['department_name']),
            models.Index(fields=['status_of_case']),
            models.Index(fields=['date_of_institution']),
            models.Index(fields=['created_by']),
        ]
    
    def __str__(self):
        return f"{self.case_id} - {self.case_name} ({self.get_department_name_display()})"
    
    def save(self, *args, **kwargs):
        # Auto-update last_updated_by if provided in kwargs
        if hasattr(self, '_current_user'):
            self.last_updated_by = self._current_user
        super().save(*args, **kwargs)
    
    @property
    def is_overdue(self):
        """Check if next hearing date has passed"""
        if self.date_of_next_hearing_order:
            from django.utils import timezone
            return self.date_of_next_hearing_order < timezone.now().date()
        return False
    
    @property
    def case_age_days(self):
        """Calculate case age in days"""
        from django.utils import timezone
        return (timezone.now().date() - self.date_of_institution).days
    
    def get_absolute_url(self):
        """Get URL for case detail view"""
        from django.urls import reverse
        return reverse('case-detail', kwargs={'pk': self.pk})


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