from django.contrib.auth.signals import user_logged_in
from django.dispatch import receiver
from django.conf import settings
from django.core.management import call_command
import threading

@receiver(user_logged_in)
def cleanup_on_login(sender, request, user, **kwargs):
    """Run cleanup when user logs in (if enabled in settings)"""
    draft_settings = getattr(settings, 'DRAFT_SETTINGS', {})
    
    if draft_settings.get('CLEANUP_ON_USER_LOGIN', False):
        # Run cleanup in background thread to not slow down login
        def background_cleanup():
            try:
                call_command('cleanup_old_drafts', verbosity=0)
                print(f"✅ Login cleanup completed for user: {user.username}")
            except Exception as e:
                print(f"❌ Login cleanup failed: {e}")
        
        cleanup_thread = threading.Thread(target=background_cleanup)
        cleanup_thread.daemon = True
        cleanup_thread.start()