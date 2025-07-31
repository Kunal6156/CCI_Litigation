import os
from django.core.wsgi import get_wsgi_application
from dotenv import load_dotenv # Add this import

load_dotenv() # Load environment variables from .env file

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cci_litigation_backend.settings')

application = get_wsgi_application()