from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from django.db.models import Q, Count, Case as DjangoCase, When, IntegerField
from django.contrib.auth import authenticate
from django.utils import timezone
from django.http import HttpResponse
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill
from openpyxl.utils import get_column_letter
import datetime
import logging
from datetime import timedelta

from .models import User, Case, Department
from .serializers import (
    UserSerializer, CaseSerializer, DepartmentSerializer, 
    MyTokenObtainPairSerializer, UserSummarySerializer,
    CaseSummarySerializer
)
from .permissions import IsAdminUser, IsDepartmentalEmployeeOrAdmin

logger = logging.getLogger(__name__)


class MyTokenObtainPairView(TokenObtainPairView):
    """
    Enhanced JWT token view with login tracking and department validation.
    """
    serializer_class = MyTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        """Override to add login tracking and enhanced validation"""
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            # Get user info from serializer
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                user = serializer.user
                if user:
                    # Update last login
                    user.last_login = timezone.now()
                    user.save(update_fields=['last_login'])
                    
                    # Log successful login
                    logger.info(f"User {user.username} ({user.department_name}) logged in successfully")
                    
                    # Add user info to response
                    response.data['user_info'] = {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'full_name': user.get_full_name(),
                        'department_name': user.department_name,
                        'user_type': user.user_type,
                        'is_admin': user.is_admin,
                        'permissions': {
                            'can_manage_users': user.is_admin,
                            'can_export_data': True,
                            'can_view_all_cases': True,
                            'can_edit_all_cases': user.is_admin,
                            'accessible_departments': [user.department_name] if not user.is_admin else 'all'
                        }
                    }
        else:
            # Log failed login attempt
            username = request.data.get('username', 'Unknown')
            logger.warning(f"Failed login attempt for username: {username}")
        
        return response


class UserViewSet(viewsets.ModelViewSet):
    """
    Enhanced User management viewset with comprehensive role-based access.
    Only accessible by admin users.
    """
    queryset = User.objects.all().order_by('department_name', 'username')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        """Filter users based on department and search"""
        queryset = self.queryset
        
        # Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search) |
                Q(department_name__icontains=search) |
                Q(employee_id__icontains=search)
            )
        
        # Filter by department
        department = self.request.query_params.get('department', None)
        if department:
            queryset = queryset.filter(department_name=department)
        
        # Filter by user type
        user_type = self.request.query_params.get('user_type', None)
        if user_type and user_type in ['admin', 'user']:
            queryset = queryset.filter(user_type=user_type)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset
    
    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action in ['list', 'summary']:
            return UserSummarySerializer
        return UserSerializer
    
    def create(self, request, *args, **kwargs):
        """Enhanced user creation with validation"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Additional validation for admin creation
        department_name = serializer.validated_data.get('department_name')
        user_type = serializer.validated_data.get('user_type', 'user')
        
        # Check admin limits per department (2 admins max in Corporate Office)
        if user_type == 'admin' and department_name == 'corporate_office':
            existing_admins = User.objects.filter(
                department_name='corporate_office', 
                user_type='admin', 
                is_active=True
            ).count()
            if existing_admins >= 2:
                return Response(
                    {'error': 'Maximum 2 administrators allowed in Corporate Office.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Create user
        user = serializer.save()
        
        # Log user creation
        logger.info(f"User {user.username} created by admin {request.user.username}")
        
        headers = self.get_success_headers(serializer.data)
        return Response(
            {
                'message': 'User created successfully',
                'user': UserSummarySerializer(user).data
            },
            status=status.HTTP_201_CREATED,
            headers=headers
        )
    
    def update(self, request, *args, **kwargs):
        """Enhanced user update with validation"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Prevent self-deactivation
        if instance == request.user and 'is_active' in request.data:
            if not request.data['is_active']:
                return Response(
                    {'error': 'You cannot deactivate your own account.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        # Log user update
        logger.info(f"User {instance.username} updated by admin {request.user.username}")
        
        self.perform_update(serializer)
        
        return Response({
            'message': 'User updated successfully',
            'user': UserSummarySerializer(instance).data
        })
    
    def destroy(self, request, *args, **kwargs):
        """Soft delete user (deactivate instead of delete)"""
        instance = self.get_object()
        
        # Prevent self-deletion
        if instance == request.user:
            return Response(
                {'error': 'You cannot delete your own account.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Deactivate instead of delete
        instance.is_active = False
        instance.save()
        
        # Log user deactivation
        logger.info(f"User {instance.username} deactivated by admin {request.user.username}")
        
        return Response(
            {'message': 'User deactivated successfully'},
            status=status.HTTP_204_NO_CONTENT
        )
    
    @action(detail=False, methods=['get', 'put'], permission_classes=[IsAuthenticated])
    def profile(self, request):
        """Get or update user profile"""
        if request.method == 'GET':
            serializer = UserSerializer(request.user)
            return Response(serializer.data)
        elif request.method == 'PUT':
            serializer = UserSerializer(request.user, data=request.data, partial=True)
            if serializer.is_valid():
                protected_fields = ['username', 'is_admin', 'user_type']
                for field in protected_fields:
                    if field in serializer.validated_data:
                        if not request.user.is_admin:
                            return Response(
                            {'error': f'You cannot modify {field}.'},
                            status=status.HTTP_403_FORBIDDEN
                        )
                serializer.save()
                return Response({
                'message': 'Profile updated successfully',
                'user': serializer.data
            })
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    @action(detail=False, methods=['put'], permission_classes=[IsAuthenticated])
    def update_profile(self, request):
            """Update user profile (alias for profile PUT)"""
            return self.profile(request)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def change_password(self, request):
            """Change user password"""
            user = request.user
            old_password = request.data.get('old_password')
            new_password = request.data.get('new_password')
            if not old_password or not new_password:
                return Response({'error': 'Both old and new passwords are required.'},status=status.HTTP_400_BAD_REQUEST)
            if not user.check_password(old_password):
                return Response({'error': 'Current password is incorrect.'},status=status.HTTP_400_BAD_REQUEST)
            from django.contrib.auth.password_validation import validate_password
            from django.core.exceptions import ValidationError
            try:
                validate_password(new_password, user)
            except ValidationError as e:
                return Response({'error': list(e.messages)}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(new_password)
            user.save()
            logger.info(f"Password changed for user {user.username}")
            return Response({'message': 'Password changed successfully'})
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def logout(self, request):
        """Logout user (optional server-side cleanup)"""
    # You can add server-side logout logic here if needed
    # For JWT, the token management is typically handled client-side
        logger.info(f"User {request.user.username} logged out")
    
        return Response({'message': 'Logged out successfully'})
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get user summary statistics"""
        queryset = self.get_queryset()
        
        # Department-wise stats
        dept_stats = {}
        for dept_choice in User.DEPARTMENT_CHOICES:
            dept_name = dept_choice[0]
            dept_users = queryset.filter(department_name=dept_name)
            dept_stats[dept_name] = {
                'total': dept_users.count(),
                'active': dept_users.filter(is_active=True).count(),
                'admins': dept_users.filter(user_type='admin', is_active=True).count(),
                'users': dept_users.filter(user_type='user', is_active=True).count(),
            }
        
        return Response({
            'total_users': queryset.count(),
            'active_users': queryset.filter(is_active=True).count(),
            'total_admins': queryset.filter(user_type='admin', is_active=True).count(),
            'total_regular_users': queryset.filter(user_type='user', is_active=True).count(),
            'department_stats': dept_stats
        })
    
    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        """Reset user password (admin only)"""
        user = self.get_object()
        new_password = request.data.get('new_password')
        
        if not new_password:
            return Response(
                {'error': 'New password is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate password
        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError
        try:
            validate_password(new_password, user)
        except ValidationError as e:
            return Response(
                {'error': list(e.messages)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set new password
        user.set_password(new_password)
        user.save()
        
        # Log password reset
        logger.info(f"Password reset for user {user.username} by admin {request.user.username}")
        
        return Response({'message': 'Password reset successfully'})


class DepartmentViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Enhanced Department viewset with statistics.
    Accessible by any authenticated user.
    """
    queryset = Department.objects.all().order_by('name')
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def choices(self, request):
        """Get department choices for dropdowns"""
        choices = [{'value': choice[0], 'label': choice[1]} for choice in User.DEPARTMENT_CHOICES]
        return Response(choices)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get department-wise statistics"""
        stats = {}
        
        for dept_choice in User.DEPARTMENT_CHOICES:
            dept_name = dept_choice[0]
            
            # User stats
            users = User.objects.filter(department_name=dept_name, is_active=True)
            
            # Case stats
            cases = Case.objects.filter(department_name=dept_name)
            
            stats[dept_name] = {
                'users': {
                    'total': users.count(),
                    'admins': users.filter(user_type='admin').count(),
                    'regular': users.filter(user_type='user').count(),
                },
                'cases': {
                    'total': cases.count(),
                    'pending': cases.filter(status_of_case__in=['Pending', 'Under Hearing']).count(),
                    'disposed': cases.filter(status_of_case__in=['Disposed', 'Closed']).count(),
                }
            }
        
        return Response(stats)


class CaseViewSet(viewsets.ModelViewSet):
    """
    Enhanced Case management viewset with comprehensive filtering and role-based access.
    """
    queryset = Case.objects.all().select_related('created_by', 'last_updated_by')
    serializer_class = CaseSerializer
    permission_classes = [IsAuthenticated, IsDepartmentalEmployeeOrAdmin]
    
    def get_queryset(self):
        """Enhanced filtering based on user role and permissions"""
        user = self.request.user
        queryset = self.queryset
        
        # Role-based filtering
        if not user.is_admin:
            # Regular users can view all cases but edit only their department's cases
            # For viewing, we allow all cases as per requirement
            pass  # Allow viewing all cases
        
        # Search functionality
        search_query = self.request.query_params.get('search', None)
        if search_query:
            queryset = queryset.filter(
                Q(case_id__icontains=search_query) |
                Q(case_name__icontains=search_query) |
                Q(parties_involved_complainant__icontains=search_query) |
                Q(parties_involved_opposite__icontains=search_query) |
                Q(bench__icontains=search_query) |
                Q(sections_involved__icontains=search_query) |
                Q(status_of_case__icontains=search_query) |
                Q(type_of_litigation__icontains=search_query) |
                Q(relief_orders_prayed__icontains=search_query) |
                Q(important_directions_orders__icontains=search_query) |
                Q(outcome__icontains=search_query)
            )
        
        # Department filter
        department = self.request.query_params.get('department', None)
        if department:
            queryset = queryset.filter(department_name=department)
        
        # Status filter
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status_of_case=status_filter)
        
        # Date range filters
        date_from = self.request.query_params.get('date_from', None)
        date_to = self.request.query_params.get('date_to', None)
        
        if date_from:
            try:
                from datetime import datetime
                date_from = datetime.strptime(date_from, '%Y-%m-%d').date()
                queryset = queryset.filter(date_of_institution__gte=date_from)
            except ValueError:
                pass
        
        if date_to:
            try:
                from datetime import datetime
                date_to = datetime.strptime(date_to, '%Y-%m-%d').date()
                queryset = queryset.filter(date_of_institution__lte=date_to)
            except ValueError:
                pass
        
        # Sorting
        sort_by = self.request.query_params.get('sort_by', 'date_of_institution')
        sort_order = self.request.query_params.get('sort_order', 'desc')
        
        # Validate sort field
        allowed_sort_fields = [f.name for f in Case._meta.get_fields()]
        if sort_by not in allowed_sort_fields:
            sort_by = 'date_of_institution'
        
        if sort_order == 'desc':
            sort_by = f'-{sort_by}'
        
        queryset = queryset.order_by(sort_by)
        
        return queryset
    
    def get_serializer_class(self):
        if self.action in ['summary', 'dashboard_stats']:  # only for special actions
            return CaseSummarySerializer
        return CaseSerializer  # ✅ for list, retrieve, create, etc.

    
    def perform_create(self, serializer):
        """Set creator and department automatically"""
        user = self.request.user
        
        # Non-admin users can only create cases for their department
        if not user.is_admin:
            serializer.save(
                created_by=user,
                last_updated_by=user,
                department_name=user.department_name
            )
        else:
            # Admins can create for any department
            serializer.save(
                created_by=user,
                last_updated_by=user
            )
        
        # Log case creation
        logger.info(f"Case {serializer.instance.case_id} created by {user.username}")
    
    def perform_update(self, serializer):
        """Enhanced update with role-based restrictions"""
        user = self.request.user
        instance = serializer.instance
        
        # Non-admin users can only edit their department's cases
        if not user.is_admin and instance.department_name != user.department_name:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only edit cases from your department.")
        
        # Prevent department change by non-admins
        if not user.is_admin and 'department_name' in serializer.validated_data:
            if serializer.validated_data['department_name'] != instance.department_name:
                from rest_framework import serializers as rf_serializers
                raise rf_serializers.ValidationError({
                    "department_name": "You cannot change the department of a case."
                })
        
        serializer.save(last_updated_by=user)
        
        # Log case update
        logger.info(f"Case {instance.case_id} updated by {user.username}")
    
    def destroy(self, request, *args, **kwargs):
        """Enhanced delete with role-based restrictions"""
        instance = self.get_object()
        user = request.user
        
        # Non-admin users can only delete their department's cases
        if not user.is_admin and instance.department_name != user.department_name:
            return Response(
                {'error': 'You can only delete cases from your department.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Log case deletion
        logger.info(f"Case {instance.case_id} deleted by {user.username}")
        
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """Get dashboard statistics based on user role"""
        user = request.user
        
        # Base queryset based on user role
        if user.is_admin:
            cases_queryset = Case.objects.all()
        else:
            # Regular users see all cases for viewing but stats can be customized
            cases_queryset = Case.objects.all()
        
        # Calculate statistics
        total_cases = cases_queryset.count()
        pending_cases = cases_queryset.filter(
            status_of_case__in=['Pending', 'Under Hearing', 'Admitted']
        ).count()
        disposed_cases = cases_queryset.filter(
            status_of_case__in=['Disposed', 'Closed', 'Dismissed']
        ).count()
        
        # Recent cases (last 30 days)
        thirty_days_ago = timezone.now().date() - timedelta(days=30)
        recent_cases = cases_queryset.filter(
            created_at__gte=thirty_days_ago
        ).order_by('-created_at')[:10]
        
        # Department-wise statistics
        dept_stats = {}
        for dept_choice in User.DEPARTMENT_CHOICES:
            dept_name = dept_choice[0]
            dept_cases = cases_queryset.filter(department_name=dept_name)
            dept_stats[dept_name] = {
                'total': dept_cases.count(),
                'pending': dept_cases.filter(status_of_case__in=['Pending', 'Under Hearing']).count(),
                'disposed': dept_cases.filter(status_of_case__in=['Disposed', 'Closed']).count(),
            }
        
        # Monthly statistics (last 12 months)
        monthly_stats = {}
        for i in range(12):
            month_date = timezone.now().date().replace(day=1) - timedelta(days=30*i)
            month_key = month_date.strftime('%Y-%m')
            monthly_cases = cases_queryset.filter(
                date_of_institution__year=month_date.year,
                date_of_institution__month=month_date.month
            ).count()
            monthly_stats[month_key] = monthly_cases
        
        return Response({
            'total_cases': total_cases,
            'pending_cases': pending_cases,
            'disposed_cases': disposed_cases,
            'overdue_cases': 0,  # Implement overdue logic as needed
            'recent_cases': CaseSummarySerializer(recent_cases, many=True).data,
            'department_wise_stats': dept_stats,
            'monthly_stats': monthly_stats,
            'user_department': user.department_name,
            'user_permissions': {
                'can_create': True,
                'can_edit_all': user.is_admin,
                'can_delete': user.is_admin or user.user_type == 'admin',
                'can_export': True,
            }
        })
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def export_excel(self, request, *args, **kwargs):
        """
        Enhanced Excel export with better formatting and role-based data filtering.
        """
        # Use the same filtering as get_queryset but ensure role-based access
        queryset = self.get_queryset()
        
        # Additional filtering for export (if needed)
        user = request.user
        if not user.is_admin:
            # For export, regular users get all data as per requirement
            # but this can be restricted if needed
            pass
        
        # Prepare HTTP response for Excel file
        current_time = timezone.now()
        file_name = f"cci_litigation_cases_{current_time.strftime('%Y%m%d_%H%M%S')}.xlsx"
        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{file_name}"'
        
        # Create workbook and worksheet
        wb = Workbook()
        ws = wb.active
        ws.title = "CCI Litigation Cases"
        
        # Define headers
        headers = [
            "Case ID", "Case Name", "Date of Institution",
            "Parties Involved (Complainant/Applicant)",
            "Parties Involved (Opposite Parties/Respondents)",
            "Bench", "Section(s) Involved", "Status of Case", "Type of Litigation",
            "Relief/Orders Prayed", "Important Directions/Orders",
            "Date of Next Hearing/Order", "Outcome", "Date of Final Order",
            "Link of Order/Judgment", "Department", "Created By", "Last Updated By"
        ]
        
        # Add headers with styling
        ws.append(headers)
        
        # Style headers
        header_font = Font(bold=True, color="FFFFFF")
        header_fill = PatternFill(start_color="366092", end_color="366092", fill_type="solid")
        
        for col_num, cell in enumerate(ws[1], 1):
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        
        # Add data rows
        for case in queryset:
            row = [
                case.case_id or '',
                case.case_name or '',
                case.date_of_institution.strftime('%Y-%m-%d') if case.date_of_institution else '',
                case.parties_involved_complainant or '',
                case.parties_involved_opposite or '',
                case.bench or '',
                case.sections_involved or '',
                case.status_of_case or '',
                case.type_of_litigation or '',
                case.relief_orders_prayed or '',
                case.important_directions_orders or '',
                case.date_of_next_hearing_order.strftime('%Y-%m-%d') if case.date_of_next_hearing_order else '',
                case.outcome or '',
                case.date_of_final_order.strftime('%Y-%m-%d') if case.date_of_final_order else '',
                case.link_of_order_judgment or '',
                case.department_name or '',
                case.created_by.get_full_name() if case.created_by else '',
                case.last_updated_by.get_full_name() if case.last_updated_by else ''
            ]
            ws.append(row)
        
        # Auto-adjust column widths
        for column in ws.columns:
            max_length = 0
            column_letter = get_column_letter(column[0].column)
            
            for cell in column:
                try:
                    cell_value = str(cell.value) if cell.value is not None else ""
                    if len(cell_value) > max_length:
                        max_length = len(cell_value)
                except:
                    pass
            
            # Set reasonable width limits
            adjusted_width = min(max(max_length + 2, 10), 50)
            ws.column_dimensions[column_letter].width = adjusted_width
        
        # Add summary sheet if admin
        if user.is_admin:
            summary_ws = wb.create_sheet("Summary")
            summary_ws.append(["Department", "Total Cases", "Pending Cases", "Disposed Cases"])
            
            # Department-wise summary
            for dept_choice in User.DEPARTMENT_CHOICES:
                dept_name = dept_choice[0]
                dept_cases = queryset.filter(department_name=dept_name)
                summary_ws.append([
                    dept_name,
                    dept_cases.count(),
                    dept_cases.filter(status_of_case__in=['Pending', 'Under Hearing']).count(),
                    dept_cases.filter(status_of_case__in=['Disposed', 'Closed']).count()
                ])
            
            # Style summary headers
            for cell in summary_ws[1]:
                cell.font = header_font
                cell.fill = header_fill
                cell.alignment = Alignment(horizontal='center', vertical='center')
        
        # Add export metadata
        metadata_ws = wb.create_sheet("Export Info")
        metadata_ws.append(["Export Details"])
        metadata_ws.append(["Exported By", user.get_full_name()])
        metadata_ws.append(["Department", user.department_name])
        metadata_ws.append(["Export Date", current_time.strftime('%Y-%m-%d %H:%M:%S')])
        metadata_ws.append(["Total Records", queryset.count()])
        metadata_ws.append(["User Role", "Administrator" if user.is_admin else "Regular User"])
        
        # Save and return
        wb.save(response)
        
        # Log export
        logger.info(f"Excel export generated by {user.username} with {queryset.count()} records")
        
        return response