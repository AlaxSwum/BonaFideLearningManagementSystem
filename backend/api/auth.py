from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

class EmailBackend(ModelBackend):
    def authenticate(self, request, email=None, password=None, **kwargs):
        try:
            # Check if user exists with the given email
            user = User.objects.get(email=email)
            logger.info(f"Found user with email: {email}")
            
            valid_password = user.check_password(password)
            logger.info(f"Password validation {'successful' if valid_password else 'failed'} for {email}")
            
            if valid_password:
                return user
            return None
                
        except User.DoesNotExist:
            logger.warning(f"No user found with email: {email}")
            return None
        except Exception as e:
            logger.error(f"Authentication error for {email}: {str(e)}")
            return None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None 