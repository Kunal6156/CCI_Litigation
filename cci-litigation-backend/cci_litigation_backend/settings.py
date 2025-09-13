import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv 

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.0/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-your-very-secret-key-here-for-dev') # Use environment variable in production!

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DJANGO_DEBUG', 'True').lower() == 'true' # Changed default to True for development

ALLOWED_HOSTS = os.environ.get('DJANGO_ALLOWED_HOSTS', '127.0.0.1,localhost').split(',') # Add your production domain later


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party apps
    'rest_framework',
    'corsheaders',  # IMPORTANT: Make sure this is installed via pip
    'rest_framework_simplejwt',
    'django_filters',  # Added for enhanced filtering
    # Your app
    'litigation_api',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # IMPORTANT: Must be at the top of middleware
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'litigation_api.middleware.draft_cleanup.DraftCleanupMiddleware',
]

ROOT_URLCONF = 'cci_litigation_backend.urls'

# Remove the APPEND_SLASH configuration that was causing issues
# if DEBUG:
#     APPEND_SLASH = False
#     print(f"DEBUG: APPEND_SLASH = {APPEND_SLASH}")

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'cci_litigation_backend.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.0/ref/settings/#databases
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3', # Changed to SQLite
        'NAME': BASE_DIR / 'db.sqlite3',        # This will create a file named db.sqlite3 in your project root
    }
}

# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.postgresql',
#         'NAME': os.environ.get('DB_NAME', 'cci_litigation_db'),
#         'USER': os.environ.get('DB_USER', 'cci_user'),
#         'PASSWORD': os.environ.get('DB_PASSWORD', 'your_dev_db_password'),
#         'HOST': os.environ.get('DB_HOST', 'localhost'),
#         'PORT': os.environ.get('DB_PORT', '5432'),
#     }
# }


# Password validation
# https://docs.djangoproject.com/en/5.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 8,  # Enhanced minimum length
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Custom User Model
AUTH_USER_MODEL = 'litigation_api.User'


# Internationalization
# https://docs.djangoproject.com/en/5.0/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'Asia/Kolkata' # Set to India Standard Time

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.0/howto/static-files/

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'  # For production

# Media files (user uploads)
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
# https://docs.djangoproject.com/en/5.0/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20, 
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.MultiPartParser',
        'rest_framework.parsers.FormParser',
    ],
    'EXCEPTION_HANDLER': 'rest_framework.views.exception_handler',
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
        'login': '10/min',  
    }
}

# Simple JWT settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=120), 
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),   
    'ROTATE_REFRESH_TOKENS': True, 
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY, 
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,
    'JWK_URL': None,
    'LEEWAY': 0,

    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'USER_AUTHENTICATION_RULE': 'rest_framework_simplejwt.authentication.default_user_authentication_rule',

    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'TOKEN_USER_CLASS': 'rest_framework_simplejwt.models.TokenUser',

    'JTI_CLAIM': 'jti',

    'SLIDING_TOKEN_REFRESH_EXP_CLAIM': 'refresh_exp',
    'SLIDING_TOKEN_LIFETIME': timedelta(minutes=5),
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=1),

    # Custom claims for your user model
    'USER_DETAILS_FIELDS': {
        'username': 'username',
        'email': 'email',
        'department_name': 'department_name',
        'is_admin': 'is_admin',
        'first_name': 'first_name',
        'last_name': 'last_name',
    },
    'TOKEN_OBTAIN_SERIALIZER': 'litigation_api.serializers.MyTokenObtainPairSerializer',
}

# CORS settings (FIXED VERSION)
# Development settings - allow your frontend origin
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

# Allow credentials (cookies, authorization headers, etc.)
CORS_ALLOW_CREDENTIALS = True

# Allow all headers that your frontend might send
CORS_ALLOW_ALL_HEADERS = True

# Allow all HTTP methods
CORS_ALLOW_ALL_METHODS = True

# For development only - you can enable this for easier testing
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True

# Additional CORS settings for specific headers
CORS_ALLOWED_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# Preflight request settings
CORS_PREFLIGHT_MAX_AGE = 86400  # 24 hours

# Security settings for production
if not DEBUG:
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

# Logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
            'formatter': 'verbose',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'WARNING',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'litigation_api': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG' if DEBUG else 'INFO',
            'propagate': False,
        },
    },
}

# Create logs directory if it doesn't exist
os.makedirs(BASE_DIR / 'logs', exist_ok=True)

# File upload settings
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024 
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024 
FILE_UPLOAD_PERMISSIONS = 0o644

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'CCI Legal Team <noreply@ccilitigation.com>')

SMS_API_KEY = os.environ.get('SMS_API_KEY')
SMS_SENDER_ID = os.environ.get('SMS_SENDER_ID', 'CCILTD')
SMS_TEMPLATE_ID = os.environ.get('SMS_TEMPLATE_ID')

CCI_LITIGATION_SETTINGS = {
    'DEPARTMENT_USER_LIMITS': {
        'corporate_office': 4,  
        'tandur': 2,
        'rajban': 2,
        'bokajan': 2,
        'akaltara': 1,
        'mandhar': 1,
        'nayagaoun': 1,
        'adilabad': 1,
        'kurkunta': 1,
        'delhi_grinding': 1,
        'bhatinda_grinding': 1,
    },
    'ADMIN_USER_LIMITS': {
        'corporate_office': 2,  
    },
    
    'MAX_CASES_PER_USER': int(os.environ.get('MAX_CASES_PER_USER', '1000')),
    'MAX_FILE_SIZE_MB': int(os.environ.get('MAX_FILE_SIZE_MB', '10')),
    'ALLOWED_FILE_EXTENSIONS': ['.pdf', '.doc', '.docx', '.xlsx', '.xls', '.jpg', '.jpeg', '.png'],
    
    'ENABLE_AUDIT_LOGGING': os.environ.get('ENABLE_AUDIT_LOGGING', 'True').lower() == 'true',
    'ENABLE_EMAIL_NOTIFICATIONS': os.environ.get('ENABLE_EMAIL_NOTIFICATIONS', 'False').lower() == 'true',
    'ENABLE_EXPORT_FEATURE': os.environ.get('ENABLE_EXPORT_FEATURE', 'True').lower() == 'true',
    'ENABLE_CASE_NOTES': os.environ.get('ENABLE_CASE_NOTES', 'True').lower() == 'true',
    
    'PASSWORD_MIN_LENGTH': 8,
    'PASSWORD_REQUIRE_UPPERCASE': True,
    'PASSWORD_REQUIRE_LOWERCASE': True,
    'PASSWORD_REQUIRE_DIGIT': True,
    'PASSWORD_REQUIRE_SPECIAL_CHAR': True,
    
    'SESSION_TIMEOUT_MINUTES': int(os.environ.get('SESSION_TIMEOUT_MINUTES', '120')),
    'AUTO_LOGOUT_WARNING_MINUTES': int(os.environ.get('AUTO_LOGOUT_WARNING_MINUTES', '10')),
    
    'DEFAULT_PAGE_SIZE': 20,
    'MAX_PAGE_SIZE': 100,
    
    'EXPORT_MAX_RECORDS': int(os.environ.get('EXPORT_MAX_RECORDS', '10000')),
    'EXPORT_FORMATS': ['xlsx', 'csv'],
}

SESSION_COOKIE_AGE = CCI_LITIGATION_SETTINGS['SESSION_TIMEOUT_MINUTES'] * 60  
SESSION_SAVE_EVERY_REQUEST = True
SESSION_EXPIRE_AT_BROWSER_CLOSE = True

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
        'TIMEOUT': 300, 
        'OPTIONS': {
            'MAX_ENTRIES': 1000,
        }
    }
}

ENVIRONMENT = os.environ.get('ENVIRONMENT', 'development')

if ENVIRONMENT == 'production':
    DEBUG = False
    ALLOWED_HOSTS = os.environ.get('DJANGO_ALLOWED_HOSTS', '').split(',')
    
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('DB_NAME'),
            'USER': os.environ.get('DB_USER'),
            'PASSWORD': os.environ.get('DB_PASSWORD'),
            'HOST': os.environ.get('DB_HOST', 'localhost'),
            'PORT': os.environ.get('DB_PORT', '5432'),
            'OPTIONS': {
                'sslmode': 'require',
            },
        }
    }
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': os.environ.get('REDIS_URL', 'redis://127.0.0.1:6379/1'),
        }
    }

elif ENVIRONMENT == 'staging':

    DEBUG = True
    ALLOWED_HOSTS = ['staging.ccilitigation.com', 'localhost', '127.0.0.1']

API_VERSION = 'v1'

CUSTOM_ERROR_MESSAGES = {
    'required': 'This field is required.',
    'invalid': 'Enter a valid value.',
    'max_length': 'Ensure this field has no more than {max_length} characters.',
    'min_length': 'Ensure this field has at least {min_length} characters.',
}

ADMIN_SITE_HEADER = 'CCI Litigation Platform Administration'
ADMIN_SITE_TITLE = 'CCI Litigation Admin'
ADMIN_INDEX_TITLE = 'Welcome to CCI Litigation Administration'

DRAFT_SETTINGS = {
    'AUTO_SAVE_INTERVAL': 30,           
    'MAX_DRAFTS_PER_USER': 50,     
    'AUTO_SAVE_RETENTION_DAYS': 7, 
    'MANUAL_DRAFT_RETENTION_DAYS': 30, 
    'MAX_LOCAL_DRAFTS': 5,             
    'ENABLE_AUTO_CLEANUP': True,       
    'CLEANUP_SCHEDULE': 'daily',        
    'CLEANUP_TIME': '02:00',            
    'CLEANUP_ON_STARTUP': False,       
    'CLEANUP_ON_USER_LOGIN': False,    
}