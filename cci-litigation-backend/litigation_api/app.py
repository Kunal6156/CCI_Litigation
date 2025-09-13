from django.apps import AppConfig
from django.conf import settings

class LitigationApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'litigation_api'
    
    def ready(self):
        # Import signals
        from . import signals
        
        # Run cleanup on startup if enabled
        draft_settings = getattr(settings, 'DRAFT_SETTINGS', {})
        if draft_settings.get('CLEANUP_ON_STARTUP', False):
            self.run_startup_cleanup()
    
    def run_startup_cleanup(self):
        try:
            from django.core.management import call_command
            call_command('cleanup_old_drafts', verbosity=0)
            print("✅ Startup draft cleanup completed")
        except Exception as e:
            print(f"❌ Startup draft cleanup failed: {e}")