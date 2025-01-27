from django.core.management.base import BaseCommand
from django.core.mail import send_mail, get_connection
from django.conf import settings

class Command(BaseCommand):
    help = 'Test email configuration'

    def handle(self, *args, **options):
        try:
            # Test connection first
            connection = get_connection()
            connection.open()
            
            # Send test email
            send_mail(
                subject='Test Email from Bona Fide',
                message='This is a test email to verify email settings.',
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=['bonafidefacilitators@gmail.com'],
                fail_silently=False,
                connection=connection,
            )
            
            self.stdout.write(self.style.SUCCESS('Test email sent successfully'))
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Failed to send email: {str(e)}\n\n'
                               f'Current settings:\n'
                               f'EMAIL_HOST: {settings.EMAIL_HOST}\n'
                               f'EMAIL_PORT: {settings.EMAIL_PORT}\n'
                               f'EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}\n'
                               f'EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}\n'
                               f'EMAIL_HOST_PASSWORD: {"*" * len(settings.EMAIL_HOST_PASSWORD)}\n')
            ) 