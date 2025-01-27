from contextlib import suppress
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager, AbstractBaseUser, PermissionsMixin
from django.core.validators import RegexValidator, MinValueValidator, MaxValueValidator
from django.utils import timezone
import vimeo
from django.conf import settings
import re
from django.core.files.storage import default_storage
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from io import BytesIO
import os
from vimeo import VimeoClient
import tempfile
import json

class CustomUserManager(BaseUserManager):
    def create_user(self, email, name, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        
        # Set default role as Student (id=3)
        if 'role' not in extra_fields:
            try:
                student_role = Role.objects.get(id=3)  # Student role
                extra_fields['role'] = student_role
            except Role.DoesNotExist:
                pass

        user = self.model(
            email=email,
            name=name,
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        try:
            admin_role = Role.objects.get(id=1)  # Admin role
            extra_fields['role'] = admin_role
        except Role.DoesNotExist:
            pass
        
        return self.create_user(email, name, password, **extra_fields)

class Role(models.Model):
    """Role model for user roles"""
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(null=True, blank=True)

    class Meta:
        ordering = ['id']
        verbose_name = 'Role'
        verbose_name_plural = 'Roles'

    def __str__(self):
        return self.name

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    """Custom user model with specified fields"""
    
    # Remove unused fields from AbstractUser
    username = None
    first_name = None
    last_name = None
    
    # Required fields
    name = models.CharField(max_length=255, null=False)
    email = models.EmailField(unique=True)
    country = models.CharField(max_length=100, null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    
    # Role as ForeignKey with default=3 (Student)
    role = models.ForeignKey(
        Role,
        on_delete=models.SET_NULL,
        null=True,
        default=3,  # Default to Student role (id=3)
        related_name='users'
    )
    
    # Optional fields
    profile_image = models.CharField(max_length=255, null=True, blank=True)
    bio = models.TextField(null=True, blank=True)
    
    # Keep date_joined from AbstractUser
    date_joined = models.DateTimeField(default=timezone.now)
    
    # Add our own timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        indexes = [
            models.Index(fields=['email'], name='email_idx'),
            models.Index(fields=['role'], name='role_idx'),
        ]

    def __str__(self):
        return self.email

    @property
    def is_student(self):
        """Check if user is a student"""
        return self.role_id == 3 if self.role else False

    @property
    def is_instructor(self):
        """Check if user is an instructor"""
        return self.role_id == 2 if self.role else False

    @property
    def is_staff_member(self):
        """Check if user is a staff member"""
        return self.role and self.role.name == 'Staff'

    @property
    def is_admin(self):
        """Check if user is an administrator"""
        return self.role and self.role.name == 'Administration'

class Course(models.Model):
    """Main course model containing basic course information"""
    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    description = models.TextField()
    level_info = models.CharField(max_length=50)
    instructor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,  # Changed from CASCADE to SET_NULL
        related_name='courses',
        null=True,  # Allow null temporarily for migration
        blank=True
    )
    
    # Categories and Subcategories (Many-to-Many relationships)
    categories = models.ManyToManyField(
        'Category',
        through='CourseCategory',
        related_name='courses'
    )
    subcategories = models.ManyToManyField(
        'Subcategory',
        through='CourseSubcategory',
        related_name='courses'
    )
    
    # Image fields
    image_url = models.URLField(max_length=500, null=True, blank=True)  # For direct download
    image_view_url = models.URLField(max_length=500, null=True, blank=True)  # For browser viewing
    
    # Video fields
    introduction_video_url = models.URLField(max_length=500, null=True, blank=True)
    introduction_video_thumbnail = models.URLField(max_length=500, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        db_table = 'courses'
        ordering = ['-created_at']

    @property
    def instructor_name(self):
        """Get the instructor's name"""
        return self.instructor.name if self.instructor else None

    @property
    def instructor_email(self):
        """Get the instructor's email"""
        return self.instructor.email if self.instructor else None

    @property
    def category_names(self):
        """Get list of category names"""
        return [category.name for category in self.categories.all()]

    @property
    def subcategory_names(self):
        """Get list of subcategory names"""
        return [subcategory.name for subcategory in self.subcategories.all()]

    def save(self, *args, **kwargs):
        # First save the course
        super().save(*args, **kwargs)
        
        # Create CourseFileManager if it doesn't exist
        if not hasattr(self, 'file_manager'):
            CourseFileManager.objects.create(course=self)

    def delete_from_vimeo(self, video_url):
        """Delete video from Vimeo"""
        try:
            if not video_url:
                return False
                
            # Initialize Vimeo client
            client = vimeo.VimeoClient(
                token=settings.VIMEO_ACCESS_TOKEN,
                key=settings.VIMEO_CLIENT_ID,
                secret=settings.VIMEO_CLIENT_SECRET
            )
            
            # Extract video ID from URL
            # Example URL: https://vimeo.com/1048841803/863864408e
            try:
                # Split by '/' and get the video ID (should be the last numeric part)
                parts = video_url.rstrip('/').split('/')
                video_id = next(part for part in parts[::-1] if part.isdigit())
                print(f"Extracted video ID for deletion: {video_id}")
                
                # Delete the video
                response = client.delete(f'/videos/{video_id}')
                print(f"Deleted video from Vimeo: {video_id}")
                return True
                
            except Exception as e:
                print(f"Error extracting video ID from URL {video_url}: {str(e)}")
                return False
                
        except Exception as e:
            print(f"Error deleting video from Vimeo: {str(e)}")
            return False

    def save_video_to_vimeo(self, video_file):
        """Upload video to Vimeo and store the URL"""
        try:
            # Get or create file manager
            if not hasattr(self, 'file_manager'):
                CourseFileManager.objects.create(course=self)

            # Delete existing video if it exists
            if self.introduction_video_url:
                print(f"Deleting existing video: {self.introduction_video_url}")
                self.delete_from_vimeo(self.introduction_video_url)
                self.introduction_video_url = None
                self.introduction_video_thumbnail = None
                self.save()

            # Initialize Vimeo client
            client = vimeo.VimeoClient(
                token=settings.VIMEO_ACCESS_TOKEN,
                key=settings.VIMEO_CLIENT_ID,
                secret=settings.VIMEO_CLIENT_SECRET
            )

            # Create a temporary file to store the video
            with tempfile.NamedTemporaryFile(delete=False) as temp_file:
                for chunk in video_file.chunks():
                    temp_file.write(chunk)
                temp_file_path = temp_file.name

            try:
                print(f"Starting video upload to Vimeo for course: {self.title}")
                # Upload to Vimeo
                video_uri = client.upload(temp_file_path, data={
                    'name': f'{self.title} - Introduction Video',
                    'description': f'Introduction video for the course: {self.title}'
                })

                # Get the video data
                response = client.get(video_uri).json()
                print(f"Video upload successful, response: {response}")
                
                # Store video URL and thumbnail
                self.introduction_video_url = response['link']
                if response.get('pictures') and response['pictures'].get('sizes'):
                    self.introduction_video_thumbnail = response['pictures']['sizes'][-1]['link']
                
                self.save()
                print(f"Video uploaded successfully to Vimeo: {self.introduction_video_url}")
                return True

            finally:
                # Clean up the temporary file
                os.unlink(temp_file_path)

        except Exception as e:
            print(f"Error uploading video to Vimeo: {str(e)}")
            return False

    def _get_drive_service(self):
        """Get an authorized Google Drive service instance"""
        try:
            # Get credentials from the JSON file
            creds_path = os.path.join(settings.BASE_DIR, 'credentials.json')
            credentials = service_account.Credentials.from_service_account_file(
                creds_path,
                scopes=settings.GOOGLE_DRIVE_SETTINGS['SCOPES']
            )

            # Build and return the Drive service
            service = build('drive', 'v3', credentials=credentials)
            return service

        except Exception as e:
            print(f"Error getting Drive service: {str(e)}")
            raise

    def delete(self, *args, **kwargs):
        try:
            # Delete video from Vimeo if it exists
            if self.introduction_video_url:
                video_id = self.introduction_video_url.split('/')[-1]
                client = vimeo.VimeoClient(
                    token=settings.VIMEO_ACCESS_TOKEN,
                    key=settings.VIMEO_CLIENT_ID,
                    secret=settings.VIMEO_CLIENT_SECRET
                )
                client.delete(f'/videos/{video_id}')
                print(f"Deleted video from Vimeo: {video_id}")

            # Delete Google Drive folder if it exists
            if hasattr(self, 'file_manager') and self.file_manager.drive_folder_id:
                service = self._get_drive_service()
                service.files().delete(fileId=self.file_manager.drive_folder_id).execute()
                print(f"Deleted folder from Google Drive: {self.file_manager.drive_folder_id}")

        except Exception as e:
            print(f"Error during deletion: {str(e)}")

        super().delete(*args, **kwargs)

    def save_image_to_drive(self, image_file):
        """Upload image to Google Drive and store the URL"""
        try:
            # Get or create file manager
            if not hasattr(self, 'file_manager'):
                CourseFileManager.objects.create(course=self)

            # Get Google Drive service
            service = self._get_drive_service()

            # Delete existing image if it exists
            if self.file_manager.image_file_id:
                try:
                    print(f"Deleting existing image with ID: {self.file_manager.image_file_id}")
                    service.files().delete(fileId=self.file_manager.image_file_id).execute()
                    self.file_manager.image_file_id = None
                    self.image_url = None
                    self.file_manager.save()
                except Exception as e:
                    print(f"Error deleting existing image: {str(e)}")

            # Create course folder if it doesn't exist
            if not self.file_manager.drive_folder_id:
                # First check if root folder exists
                root_query = "name='LMS Course Materials' and mimeType='application/vnd.google-apps.folder' and trashed=false"
                root_results = service.files().list(q=root_query, spaces='drive', fields='files(id)').execute()
                root_items = root_results.get('files', [])
                
                if root_items:
                    root_folder_id = root_items[0]['id']
                else:
                    # Create root folder if it doesn't exist
                    root_metadata = {
                        'name': 'LMS Course Materials',
                        'mimeType': 'application/vnd.google-apps.folder'
                    }
                    root_folder = service.files().create(body=root_metadata, fields='id').execute()
                    root_folder_id = root_folder['id']
                    # Make root folder accessible
                    service.permissions().create(
                        fileId=root_folder_id,
                        body={
                            'type': 'anyone',
                            'role': 'reader',
                            'allowFileDiscovery': True
                        },
                        fields='id'
                    ).execute()

                # Create course folder under root
                folder_metadata = {
                    'name': self.title,
                    'mimeType': 'application/vnd.google-apps.folder',
                    'parents': [root_folder_id]
                }
                folder = service.files().create(
                    body=folder_metadata,
                    fields='id'
                ).execute()
                self.file_manager.drive_folder_id = folder['id']
                self.file_manager.save()

                # Make course folder accessible
                service.permissions().create(
                    fileId=folder['id'],
                    body={
                        'type': 'anyone',
                        'role': 'reader',
                        'allowFileDiscovery': True
                    },
                    fields='id'
                ).execute()

            # Prepare image file for upload
            file_metadata = {
                'name': f'{self.title}_image{os.path.splitext(image_file.name)[1]}',
                'parents': [self.file_manager.drive_folder_id]
            }

            # Create media
            media = MediaIoBaseUpload(
                BytesIO(image_file.read()),
                mimetype=image_file.content_type,
                resumable=True
            )

            # Upload file
            file = service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id, webContentLink'
            ).execute()

            # Store file ID
            self.file_manager.image_file_id = file['id']
            
            # Make the file publicly accessible with a more permissive role
            service.permissions().create(
                fileId=file['id'],
                body={
                    'type': 'anyone',
                    'role': 'reader',
                    'allowFileDiscovery': True
                },
                fields='id'
            ).execute()

            # Get the webContentLink and modify it for direct access
            web_content_link = file.get('webContentLink', '')
            # Remove the "export=download" parameter and add "export=view"
            self.image_url = web_content_link.replace('&export=download', '') + '&export=view'
            
            self.file_manager.save()
            self.save()

            print(f"Image uploaded successfully to Google Drive: {self.image_url}")
            return True

        except Exception as e:
            print(f"Error uploading image to Google Drive: {str(e)}")
            return False

class IntendedLearners(models.Model):
    """Detailed learning information for each course"""
    course = models.OneToOneField(
        Course,
        on_delete=models.CASCADE,
        related_name='intended_learners'
    )
    learning_outcomes = models.TextField(blank=True, default='[]')
    skills_needed = models.TextField(blank=True, default='[]')
    target_audience = models.TextField(blank=True, default='[]')
    career_goals = models.TextField(blank=True, default='[]')
    participation_encouragement = models.TextField(blank=True, default='[]')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def get_learning_outcomes(self):
        return json.loads(self.learning_outcomes)

    def set_learning_outcomes(self, value):
        self.learning_outcomes = json.dumps(value)

    def get_skills_needed(self):
        return json.loads(self.skills_needed)

    def set_skills_needed(self, value):
        self.skills_needed = json.dumps(value)

    def get_target_audience(self):
        return json.loads(self.target_audience)

    def set_target_audience(self, value):
        self.target_audience = json.dumps(value)

    def get_career_goals(self):
        return json.loads(self.career_goals)

    def set_career_goals(self, value):
        self.career_goals = json.dumps(value)

    def get_participation_encouragement(self):
        return json.loads(self.participation_encouragement)

    def set_participation_encouragement(self, value):
        self.participation_encouragement = json.dumps(value)

    class Meta:
        db_table = 'intended_learners'
        verbose_name_plural = 'Intended Learners'

    def __str__(self):
        return f"Intended learners for {self.course.title}"

class Category(models.Model):
    """Course categories"""
    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'categories'
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def __str__(self):
        return self.name

class Subcategory(models.Model):
    """Subcategories belonging to main categories"""
    name = models.CharField(max_length=100)
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name='subcategories'
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'subcategories'
        verbose_name_plural = 'Subcategories'
        ordering = ['category', 'name']
        unique_together = ['name', 'category']  # Prevent duplicate subcategories in same category

    def __str__(self):
        return f"{self.category.name} - {self.name}"

class CourseCategory(models.Model):
    """Junction table for Course-Category many-to-many relationship"""
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'course_categories'
        verbose_name_plural = 'Course Categories'
        unique_together = ['course', 'category']  # Prevent duplicate assignments

    def __str__(self):
        return f"{self.course.title} - {self.category.name}"

class CourseSubcategory(models.Model):
    """Junction table for Course-Subcategory many-to-many relationship"""
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    subcategory = models.ForeignKey(Subcategory, on_delete=models.CASCADE)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'course_subcategories'
        verbose_name_plural = 'Course Subcategories'
        unique_together = ['course', 'subcategory']  # Prevent duplicate assignments

    def __str__(self):
        return f"{self.course.title} - {self.subcategory.name}"

class Curriculum(models.Model):
    """Course curriculum items (videos, readings, etc.)"""
    CONTENT_TYPES = [
        ('video', 'Video'),
        ('reading', 'Reading'),
        ('quiz', 'Quiz'),
        ('assignment', 'Assignment'),
        ('other', 'Other')
    ]

    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='curriculum_items'
    )
    type = models.CharField(max_length=20, choices=CONTENT_TYPES)
    title = models.CharField(max_length=255)
    description = models.TextField()
    resource_url = models.URLField(max_length=255)
    order = models.PositiveIntegerField()  # For ordering curriculum items
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'curriculum'
        ordering = ['course', 'order']  # Order by course and then by order field
        unique_together = ['course', 'order']  # Prevent duplicate order numbers in same course

    def __str__(self):
        return f"{self.course.title} - {self.title}"

class CodeQuestion(models.Model):
    """Coding questions for courses"""
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='code_questions'
    )
    question = models.TextField()
    answer = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'code_questions'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.course.title} - Question {self.id}"

class Assignment(models.Model):
    """Course assignments"""
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='assignments'
    )
    question = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'assignments'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.course.title} - Assignment {self.id}"

class Instructor(models.Model):
    """Instructor profile model containing instructor-specific information"""
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='instructor_profile'
    )
    expertise = models.CharField(max_length=255)
    rating = models.FloatField(
        default=0.0,
        validators=[
            MinValueValidator(0.0),
            MaxValueValidator(5.0)
        ]
    )
    rating_count = models.PositiveIntegerField(default=0)
    bio = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'instructors'
        ordering = ['-rating', '-rating_count']

    def __str__(self):
        return f"{self.user.name} - Instructor"

    def calculate_rating(self):
        """Recalculate average rating"""
        # This method can be expanded when you add a ratings/reviews system
        if self.rating_count > 0:
            return self.rating / self.rating_count
        return 0.0

    @property
    def average_rating(self):
        """Get formatted rating"""
        return f"{self.rating:.1f}"

class Quiz(models.Model):
    """Quiz model containing quiz information"""
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='quizzes'
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    total_questions = models.PositiveIntegerField()
    max_score = models.PositiveIntegerField()
    duration = models.PositiveIntegerField(help_text="Duration in minutes")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'quizzes'
        ordering = ['-created_at']
        verbose_name_plural = 'Quizzes'

    def __str__(self):
        return f"{self.course.title} - {self.title}"

    def calculate_total_questions(self):
        """Update total questions count"""
        self.total_questions = self.questions.count()
        self.save()

class Question(models.Model):
    """Question model for quiz questions"""
    QUESTION_TYPES = [
        ('MCQ', 'Multiple Choice'),
        ('TF', 'True/False'),
    ]

    quiz = models.ForeignKey(
        Quiz,
        on_delete=models.CASCADE,
        related_name='questions'
    )
    question_text = models.TextField()
    question_type = models.CharField(
        max_length=3,
        choices=QUESTION_TYPES,
        default='MCQ'
    )
    order = models.PositiveIntegerField()
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'questions'
        ordering = ['quiz', 'order']
        unique_together = ['quiz', 'order']

    def __str__(self):
        return f"{self.quiz.title} - Question {self.order}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.quiz.calculate_total_questions()

class Option(models.Model):
    """Option model for question choices"""
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='options'
    )
    option_text = models.TextField()
    is_correct = models.BooleanField(default=False)
    why_correct = models.TextField(
        null=True, 
        blank=True,
        help_text="Explanation for why this option is correct"
    )
    why_not_correct = models.TextField(
        null=True, 
        blank=True,
        help_text="Explanation for why this option is incorrect"
    )
    order = models.PositiveIntegerField()
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'options'
        ordering = ['question', 'order']
        unique_together = ['question', 'order']

    def __str__(self):
        return f"{self.question} - Option {self.order}"

    def clean(self):
        """Validate option data"""
        if self.is_correct and not self.why_correct:
            raise ValidationError("Correct options must have an explanation")
        if not self.is_correct and not self.why_not_correct:
            raise ValidationError("Incorrect options must have an explanation")

class CourseFileManager(models.Model):
    """Handles file uploads and storage for courses"""
    course = models.OneToOneField(Course, on_delete=models.CASCADE, related_name='file_manager')
    
    # Google Drive folder IDs
    drive_folder_id = models.CharField(max_length=100, null=True, blank=True)
    drive_images_folder_id = models.CharField(max_length=100, null=True, blank=True)
    
    # Individual file IDs
    image_file_id = models.CharField(max_length=100, null=True, blank=True)
    video_file_id = models.CharField(max_length=100, null=True, blank=True)
    
    # Google Drive folder URLs
    drive_folder_url = models.URLField(max_length=500, null=True, blank=True)
    drive_images_folder_url = models.URLField(max_length=500, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"File Manager for {self.course.title}"

    class Meta:
        db_table = 'course_file_managers'
        verbose_name = 'Course File Manager'
        verbose_name_plural = 'Course File Managers'

    def delete_from_drive(self):
        """Delete all associated files and folders from Google Drive"""
        try:
            # Get Google Drive service
            creds_path = os.path.join(settings.BASE_DIR, 'credentials.json')
            creds = service_account.Credentials.from_service_account_file(
                creds_path, 
                scopes=settings.GOOGLE_DRIVE_SETTINGS['SCOPES']
            )
            service = build('drive', 'v3', credentials=creds)
            
            # Delete image file if exists
            if self.image_file_id:
                try:
                    service.files().delete(fileId=self.image_file_id).execute()
                    print(f"Successfully deleted image file {self.image_file_id} from Google Drive")
                except Exception as e:
                    print(f"Error deleting image file: {str(e)}")

            # Delete video file if exists
            if self.video_file_id:
                try:
                    service.files().delete(fileId=self.video_file_id).execute()
                    print(f"Successfully deleted video file {self.video_file_id} from Google Drive")
                except Exception as e:
                    print(f"Error deleting video file: {str(e)}")

            # Delete course folder if exists
            if self.drive_folder_id:
                try:
                    service.files().delete(fileId=self.drive_folder_id).execute()
                    print(f"Successfully deleted folder {self.drive_folder_id} from Google Drive")
                except Exception as e:
                    print(f"Error deleting course folder: {str(e)}")

        except Exception as e:
            print(f"Error setting up Google Drive service: {str(e)}")
