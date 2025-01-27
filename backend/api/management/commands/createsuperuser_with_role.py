from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from api.models import Role

User = get_user_model()

class Command(BaseCommand):
    help = 'Creates a superuser with Admin role'

    def handle(self, *args, **options):
        if not User.objects.filter(is_superuser=True).exists():
            admin_role = Role.objects.get(id=1)
            User.objects.create_superuser(
                username='BonaFide',
                email='bonafidefacilitator.lms@gmail.com',
                password='admin123',
                role=admin_role
            )
            self.stdout.write(self.style.SUCCESS('Superuser created successfully'))
        else:
            self.stdout.write(self.style.WARNING('Superuser already exists')) 