from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    UserViewSet, CaseViewSet, DepartmentViewSet, 
    MyTokenObtainPairView
)

# Create router and register viewsets
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'cases', CaseViewSet, basename='case')
router.register(r'departments', DepartmentViewSet, basename='department')

urlpatterns = [
    # Authentication endpoints - FIXED PATHS
    path('auth/login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh_alt'),  # Alternative path for compatibility
    
    # API endpoints from router
    path('', include(router.urls)),
    
    # Additional endpoints that frontend might need
    path('auth/profile/', UserViewSet.as_view({'get': 'profile', 'put': 'update_profile'}), name='user_profile'),
    path('auth/change-password/', UserViewSet.as_view({'post': 'change_password'}), name='change_password'),
    path('auth/logout/', UserViewSet.as_view({'post': 'logout'}), name='logout'),
]