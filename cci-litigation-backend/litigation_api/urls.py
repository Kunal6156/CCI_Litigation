from . import views
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    UserViewSet, CaseViewSet, DepartmentViewSet, 
    MyTokenObtainPairView, DraftViewSet, CaseDataValidationView,
    upcoming_hearings, send_hearing_reminders, 
    notification_history, send_manual_notification, 
    notification_settings
)

# Create router and register viewsets
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'cases', CaseViewSet, basename='case')
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'drafts', DraftViewSet, basename='draft')  # NEW: Draft endpoints
router.register(r'validation', CaseDataValidationView, basename='validation')  # NEW: Case validation endpoint

urlpatterns = [
    # Authentication endpoints
    path('auth/login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh_alt'),  # Optional alternative
path('cases/preview-bulk-paste/', views.preview_bulk_paste, name='preview-bulk-paste'),
path('cases/bulk-paste/', views.bulk_paste_cases, name='bulk-paste-cases'),
# Validation endpoints
path('validate/case-id/', views.CaseDataValidationView.as_view({'post': 'validate_case_id'}), name='validate-case-id'),
path('validate/mobile/', views.CaseDataValidationView.as_view({'post': 'validate_mobile'}), name='validate-mobile'),
path('validate/currency/', views.CaseDataValidationView.as_view({'post': 'format_currency'}), name='format-currency'),

    # API endpoints from router
    path('', include(router.urls)),

    # User profile and auth
    path('auth/profile/', UserViewSet.as_view({'get': 'profile', 'put': 'update_profile'}), name='user_profile'),
    path('auth/change-password/', UserViewSet.as_view({'post': 'change_password'}), name='change_password'),
    path('auth/logout/', UserViewSet.as_view({'post': 'logout'}), name='logout'),

    # Notification endpoints
    path('notifications/upcoming-hearings/', upcoming_hearings, name='upcoming_hearings'),
    path('notifications/send-hearing-reminders/', send_hearing_reminders, name='send_hearing_reminders'),
    path('notifications/history/', notification_history, name='notification_history'),
    path('notifications/send-manual/', send_manual_notification, name='send_manual_notification'),
    path('notifications/settings/', notification_settings, name='notification_settings'),
    # Bulk paste endpoints
]
