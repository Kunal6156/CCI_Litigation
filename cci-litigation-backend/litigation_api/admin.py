from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Case, Department,Draft

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

# ✅ Register Draft model with admin
@admin.register(Draft)
class DraftAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'user', 'draft_type', 'case_id', 'is_auto_saved', 
        'updated_at'
    ]
    list_filter = ['draft_type', 'is_auto_saved', 'updated_at']
    search_fields = ['title', 'draft_key', 'user__username']
    readonly_fields = ['draft_key', 'created_at', 'updated_at']