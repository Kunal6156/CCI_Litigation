from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from rest_framework import status

# Import the necessary Simple JWT views
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView, # Good to include verify endpoint
)

def health_check(request):
    """Simple health check endpoint"""
    return JsonResponse({
        'status': 'healthy',
        'service': 'CCI Litigation Backend',
        'version': '1.0.0'
    }, status=status.HTTP_200_OK)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    path('health/', health_check, name='health_check'),
    
    path('api/', include('litigation_api.urls')),
    
    path('', health_check, name='root'),
     path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    
]
   
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
  
from django.http import HttpResponseNotFound

def block_favicon(request):
    return HttpResponseNotFound("Not Found")

urlpatterns += [
    path('favicon.ico', block_favicon),
]
