from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Case, Department

# Custom UserAdmin to display and edit custom fields
class CustomUserAdmin(UserAdmin):
    # Fields to display in the user list
    list_display = ('username', 'email', 'department_name', 'is_admin', 'is_staff', 'is_active')
    # Fields to filter by in the sidebar
    list_filter = ('department_name', 'is_admin', 'is_staff', 'is_active')
    # Fields to search by
    search_fields = ('username', 'email', 'department_name')
    # Order of fields in the edit form
    fieldsets = UserAdmin.fieldsets + (
        (None, {'fields': ('department_name', 'is_admin')}),
    )
    # Order of fields in the add user form
    add_fieldsets = UserAdmin.add_fieldsets + (
        (None, {'fields': ('department_name', 'is_admin')}),
    )

# Register your models here
admin.site.register(User, CustomUserAdmin)
admin.site.register(Case)
admin.site.register(Department) # Register Department model