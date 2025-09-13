from rest_framework import permissions
from rest_framework.permissions import BasePermission
from django.contrib.auth.models import AnonymousUser

class IsAuthenticated(BasePermission):
    """
    Custom authentication check
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)


class IsAdminUser(BasePermission):
    """
    Custom permission to allow access only to admin users.
    Admins have full access to all operations.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.is_admin or request.user.user_type == 'admin'

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.is_admin or request.user.user_type == 'admin'


class IsAdminOrReadOnly(BasePermission):
    """
    Custom permission that allows read access to all authenticated users
    but write access only to admin users.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Allow read permissions for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions only for admin users
        return request.user.is_admin or request.user.user_type == 'admin'


class IsDepartmentalEmployeeOrAdmin(BasePermission):
    """
    Enhanced permission for Case objects with detailed access control:
    
    ADMIN USERS:
    - Can view ALL cases from ALL departments
    - Can create cases for ANY department
    - Can edit/update ANY case from ANY department
    - Can delete ANY case from ANY department
    
    REGULAR USERS:
    - Can view ALL cases from ALL departments (read-only access)
    - Can create cases ONLY for their own department
    - Can edit/update ONLY cases from their own department
    - Can delete ONLY cases from their own department
    """
    
    def has_permission(self, request, view):
        # Check if user is authenticated
        if not request.user or not request.user.is_authenticated:
            return False

        # Admin users have full permission for any action
        if request.user.is_admin or request.user.user_type == 'admin':
            return True

        # For regular users
        if request.method in permissions.SAFE_METHODS:
            # GET, HEAD, OPTIONS - allow viewing all cases
            return True
        
        if request.method == 'POST':
            # CREATE - check if creating for their own department
            department_name = request.data.get('department_name')
            if not department_name:
                return False
            return request.user.department_name == department_name
        
        # For PUT, PATCH, DELETE - check object-level permissions
        return True

    def has_object_permission(self, request, view, obj):
        # Check if user is authenticated
        if not request.user or not request.user.is_authenticated:
            return False

        # Admin users have full object-level permission
        if request.user.is_admin or request.user.user_type == 'admin':
            return True

        # For regular users
        if request.method in permissions.SAFE_METHODS:
            # Allow viewing any case
            return True
        
        # For modifications (PUT, PATCH, DELETE), only allow own department cases
        return obj.department_name == request.user.department_name


class IsOwnerOrAdmin(BasePermission):
    """
    Permission that allows access to object owners or admin users.
    Used for user profile management.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admin users can access any object
        if request.user.is_admin or request.user.user_type == 'admin':
            return True
        
        # Users can only access their own objects
        return obj == request.user


class CanManageUsers(BasePermission):
    """
    Permission for user management operations.
    Only admin users can create, update, or delete other users.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Only admin users can manage other users
        if request.user.is_admin or request.user.user_type == 'admin':
            return True
        
        # Regular users can only view user lists (for dropdowns, etc.)
        return request.method in permissions.SAFE_METHODS

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admin users can manage any user
        if request.user.is_admin or request.user.user_type == 'admin':
            return True
        
        # Regular users can only view other users, not modify
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Users can only modify their own profile
        return obj == request.user


class CanExportData(BasePermission):
    """
    Permission for data export operations.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # All authenticated users can export data they have access to
        return True


class DepartmentBasedPermission(BasePermission):
    """
    Base permission class for department-based access control.
    Can be extended for specific models.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)
    
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admin users have access to all departments
        if request.user.is_admin or request.user.user_type == 'admin':
            return True
        
        # Check if object has department_name attribute
        if hasattr(obj, 'department_name'):
            return obj.department_name == request.user.department_name
        
        # Check if object has a department foreign key
        if hasattr(obj, 'department'):
            return obj.department.name == request.user.department_name
        
        # Default to allowing access if no department info
        return True


class IsOwnerOrReadOnly(BasePermission):
    """
    Permission that allows read access to all authenticated users
    but write access only to the owner of the object or admin users.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Read permissions for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Admin users have full access
        if request.user.is_admin or request.user.user_type == 'admin':
            return True
        
        # Write permissions only for the owner
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        
        return False


# Utility functions for permission checks
def user_can_access_department(user, department_name):
    """
    Check if a user can access data from a specific department.
    """
    if not user or not user.is_authenticated:
        return False
    
    if user.is_admin or user.user_type == 'admin':
        return True
    
    return user.department_name == department_name


def user_can_modify_case(user, case):
    """
    Check if a user can modify a specific case.
    """
    if not user or not user.is_authenticated:
        return False
    
    if user.is_admin or user.user_type == 'admin':
        return True
    
    return case.department_name == user.department_name


def get_user_accessible_departments(user):
    """
    Get list of departments a user can access.
    """
    if not user or not user.is_authenticated:
        return []
    
    if user.is_admin or user.user_type == 'admin':
        # Admin can access all departments
        from .models import User
        return [choice[0] for choice in User.DEPARTMENT_CHOICES]
    
    # Regular users can only access their own department
    return [user.department_name]