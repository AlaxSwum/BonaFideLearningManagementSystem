from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from api.models import Role
from django.db import transaction

User = get_user_model()

class Command(BaseCommand):
    help = 'Reset database and create initial admin user'

    def handle(self, *args, **options):
        try:
            with transaction.atomic():
                # Clear all users
                User.objects.all().delete()
                self.stdout.write(self.style.SUCCESS('Cleared all users'))

                # Create roles if they don't exist
                roles_data = [
                    {
                        'id': 1,
                        'name': 'Administration',
                        'description': 'System administrator with full access'
                    },
                    {
                        'id': 2,
                        'name': 'Instructor',
                        'description': 'Course instructor with teaching privileges'
                    },
                    {
                        'id': 3,
                        'name': 'Student',
                        'description': 'Regular student user'
                    },
                    {
                        'id': 4,
                        'name': 'Staff',
                        'description': 'Support staff member'
                    }
                ]

                for role_data in roles_data:
                    Role.objects.get_or_create(
                        id=role_data['id'],
                        defaults=role_data
                    )

                # Get admin role
                admin_role = Role.objects.get(id=1)

                # Create admin user
                admin = User.objects.create_user(
                    email='bonafidefacilitators@gmail.com',
                    name='Bona Fide',
                    password='BonaFide@1122',
                    role=admin_role,
                    is_staff=True,
                    is_superuser=True
                )

                self.stdout.write(
                    self.style.SUCCESS(
                        f'Successfully created admin user:\n'
                        f'Name: {admin.name}\n'
                        f'Email: {admin.email}\n'
                        f'Role: {admin.role.name}'
                    )
                )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error: {str(e)}')
            ) 