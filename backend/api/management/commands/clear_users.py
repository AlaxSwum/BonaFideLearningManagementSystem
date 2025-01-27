from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Clear all users from the database'

    def handle(self, *args, **options):
        try:
            # Delete all users
            count = User.objects.all().delete()[0]
            self.stdout.write(
                self.style.SUCCESS(f'Successfully deleted {count} users')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error deleting users: {str(e)}')
            ) 