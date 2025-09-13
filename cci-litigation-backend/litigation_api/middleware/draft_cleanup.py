from django.utils import timezone
from django.conf import settings
from django.core.management import call_command
from datetime import timedelta
import threading

class DraftCleanupMiddleware:
    """Middleware to run periodic cleanup based on settings"""
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.last_cleanup = None
    
    def __call__(self, request):
        # Check if cleanup should run
        self.check_and_run_cleanup()
        
        response = self.get_response(request)
        return response
    
    def check_and_run_cleanup(self):
        draft_settings = getattr(settings, 'DRAFT_SETTINGS', {})
        
        if not draft_settings.get('ENABLE_AUTO_CLEANUP', True):
            return
        
        now = timezone.now()
        schedule = draft_settings.get('CLEANUP_SCHEDULE', 'daily')
        
        # Determine if cleanup should run
        should_run = False
        
        if self.last_cleanup is None:
            should_run = True
        elif schedule == 'daily' and (now - self.last_cleanup).days >= 1:
            should_run = True
        elif schedule == 'weekly' and (now - self.last_cleanup).days >= 7:
            should_run = True
        elif schedule == 'monthly' and (now - self.last_cleanup).days >= 30:
            should_run = True
        
        if should_run:
            self.run_background_cleanup()
            self.last_cleanup = now
    
    def run_background_cleanup(self):
        """Run cleanup in background thread"""
        def cleanup():
            try:
                call_command('cleanup_old_drafts', verbosity=0)
                print("✅ Middleware draft cleanup completed")
            except Exception as e:
                print(f"❌ Middleware draft cleanup failed: {e}")
        
        cleanup_thread = threading.Thread(target=cleanup)
        cleanup_thread.daemon = True
        cleanup_thread.start()