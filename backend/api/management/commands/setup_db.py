from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from api.models import Role

User = get_user_model()

class Command(BaseCommand):
    help = 'Setup initial database with test users'

    def handle(self, *args, **options):
        # Verify roles exist
        roles = Role.objects.all()
        if not roles.exists():
            self.stdout.write(self.style.ERROR('No roles found. Please run migrations first.'))
            return

        # Create test users
        users = [
            {
                'email': 'admin@bonafide.com',
                'name': 'Admin User',
                'password': 'Admin@123',
                'role_id': 1  # Administration
            },
            {
                'email': 'instructor@bonafide.com',
                'name': 'Test Instructor',
                'password': 'Test@123',
                'role_id': 2  # Instructor
            },
            {
                'email': 'student@bonafide.com',
                'name': 'Test Student',
                'password': 'Test@123',
                'role_id': 3  # Student (default)
            },
            {
                'email': 'staff@bonafide.com',
                'name': 'Test Staff',
                'password': 'Test@123',
                'role_id': 4  # Staff
            }
        ]

        for user_data in users:
            if not User.objects.filter(email=user_data['email']).exists():
                try:
                    user = User.objects.create_user(**user_data)
                    self.stdout.write(
                        self.style.SUCCESS(f"Created user: {user.email} with role: {user.role.name}")
                    )
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f"Failed to create user {user_data['email']}: {str(e)}")
                    ) 