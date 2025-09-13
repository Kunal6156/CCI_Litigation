from django.core.management.base import BaseCommand
from django.utils import timezone
from django.conf import settings
from datetime import timedelta
from litigation_api.models import Draft

class Command(BaseCommand):
    help = 'Clean up old drafts based on settings configuration'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days_old',
            type=int,
            help='Override settings and specify days old for cleanup',
        )
        parser.add_argument(
            '--draft_type',
            type=str,
            choices=['auto', 'manual', 'all'],
            default='all',
            help='Type of drafts to clean up',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force cleanup even if auto cleanup is disabled',
        )

    def handle(self, *args, **options):
        draft_settings = getattr(settings, 'DRAFT_SETTINGS', {})
        
        if not draft_settings.get('ENABLE_AUTO_CLEANUP', True) and not options['force']:
            self.stdout.write(
                self.style.WARNING(
                    'Auto cleanup is disabled in settings. Use --force to override.'
                )
            )
            return

        auto_save_days = options['days_old'] or draft_settings.get('AUTO_SAVE_RETENTION_DAYS', 7)
        manual_draft_days = options['days_old'] or draft_settings.get('MANUAL_DRAFT_RETENTION_DAYS', 30)
        
        now = timezone.now()
        auto_save_cutoff = now - timedelta(days=auto_save_days)
        manual_draft_cutoff = now - timedelta(days=manual_draft_days)
        
        drafts_to_delete = []
        
        if options['draft_type'] in ['auto', 'all']:
            auto_drafts = Draft.objects.filter(
                is_auto_saved=True,
                updated_at__lt=auto_save_cutoff
            )
            drafts_to_delete.extend(list(auto_drafts))
            self.stdout.write(f"Auto-saved drafts older than {auto_save_days} days: {auto_drafts.count()}")
        
        if options['draft_type'] in ['manual', 'all']:
            manual_drafts = Draft.objects.filter(
                is_auto_saved=False,
                updated_at__lt=manual_draft_cutoff
            )
            drafts_to_delete.extend(list(manual_drafts))
            self.stdout.write(f"Manual drafts older than {manual_draft_days} days: {manual_drafts.count()}")
        
        if not drafts_to_delete:
            self.stdout.write(self.style.SUCCESS('No old drafts found to clean up.'))
            return
        
        self.stdout.write(f"\nDrafts to be deleted: {len(drafts_to_delete)}")
        for draft in drafts_to_delete[:10]:  
            age_days = (now - draft.updated_at).days
            self.stdout.write(f"  - {draft.title} (User: {draft.user.username}, Age: {age_days} days)")
        
        if len(drafts_to_delete) > 10:
            self.stdout.write(f"  ... and {len(drafts_to_delete) - 10} more")
        
        if not options['dry_run']:
            deleted_count = 0
            for draft in drafts_to_delete:
                try:
                    draft.delete()
                    deleted_count += 1
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f"Failed to delete draft {draft.id}: {e}")
                    )
            
            self.stdout.write(
                self.style.SUCCESS(f"Successfully deleted {deleted_count} old drafts.")
            )
        else:
            self.stdout.write(
                self.style.WARNING("Dry run mode - no drafts were actually deleted.")
            )