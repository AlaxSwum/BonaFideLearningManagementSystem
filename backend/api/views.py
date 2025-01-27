from django.shortcuts import render, get_object_or_404
from rest_framework import generics, status, viewsets
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, action
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from .serializers import (
    UserSerializer, CourseSerializer, CategorySerializer, SubcategorySerializer,
    CurriculumSerializer, CodeQuestionSerializer, AssignmentSerializer, InstructorSerializer,
    IntendedLearnersSerializer
)
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.forms import PasswordResetForm
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from .models import Course, Category, Subcategory, Curriculum, CodeQuestion, Assignment, Instructor, User, IntendedLearners
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.mail import send_mail
import jwt
from datetime import datetime, timedelta

from .utils.storage import upload_to_drive
from google.cloud import storage
import vimeo
from urllib.parse import urlparse
import os
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from django.http import JsonResponse
from rest_framework.exceptions import PermissionDenied

User = get_user_model()

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    print("Registration data received:", request.data)
    
    # Create a mutable copy of the data
    data = request.data.copy()
    
    # Ensure required fields are present
    required_fields = ['username', 'email', 'password', 'country', 'city']
    missing_fields = [field for field in required_fields if not data.get(field)]
    
    if missing_fields:
        return Response({
            "error": f"Missing required fields: {', '.join(missing_fields)}"
        }, status=status.HTTP_400_BAD_REQUEST)
    
    serializer = UserSerializer(data=data)
    
    if serializer.is_valid():
        try:
            user = serializer.save()
            return Response({
                "message": "User registered successfully",
                "user_id": user.id
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            print("Registration error:", str(e))
            return Response({
                "error": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    print("Serializer errors:", serializer.errors)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def login_user(request):
    email = request.data.get('email')
    password = request.data.get('password')
    
    print(f"Login attempt - Email: {email}")
    
    try:
        user = User.objects.get(email=email)
        if user.check_password(password):
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            
            # Get role information
            role_name = user.role.name if hasattr(user, 'role') and user.role else None
            is_instructor = role_name == 'Instructor'
            
            return Response({
                'status': 'success',
                'tokens': {
                    'access': access_token,
                    'refresh': str(refresh)
                },
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'name': user.name,
                    'role': role_name,
                    'is_instructor': is_instructor,
                    'profile_image': user.profile_image,
                    'bio': user.bio
                }
            })
        else:
            return Response({
                'status': 'error',
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)
    except User.DoesNotExist:
        return Response({
            'status': 'error',
            'error': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"Login error: {str(e)}")
        return Response({
            'status': 'error',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_details(request):
    user = request.user
    return Response({
        'id': user.id,
        'email': user.email,
        'name': user.name,
        'role': user.role,
        'profile_image': user.profile_image,
        'bio': user.bio
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_request(request):
    print(f"Password reset request for: {request.data.get('email')}")
    form = PasswordResetForm(request.data)
    
    if form.is_valid():
        try:
            email = form.cleaned_data["email"]
            
            if not User.objects.filter(email=email).exists():
                return Response(
                    {"detail": "No account found with this email"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get the current site
            protocol = 'https' if request.is_secure() else 'http'
            
            # Save with debug info
            print(f"Sending reset email with settings:\n"
                f"Domain: {settings.DOMAIN}\n"
                f"Protocol: {protocol}\n"
                f"From: {settings.DEFAULT_FROM_EMAIL}")
            
            form.save(
                request=request,
                email_template_name='password/password_reset_email.html',
                subject_template_name='password/password_reset_subject.txt',
                html_email_template_name='password/password_reset_email.html',
                from_email=settings.DEFAULT_FROM_EMAIL,
                domain_override=settings.DOMAIN,
                use_https=request.is_secure(),
            )
            
            print(f"Reset email sent to: {email}")
            return Response(
                {"detail": "Password reset email has been sent."},
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            print(f"Error sending reset email: {str(e)}")
            print(f"Email settings:\n"
                f"BACKEND: {settings.EMAIL_BACKEND}\n"
                f"HOST: {settings.EMAIL_HOST}\n"
                f"PORT: {settings.EMAIL_PORT}\n"
                f"TLS: {settings.EMAIL_USE_TLS}")
            return Response(
                {"detail": f"Error sending email: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    print(f"Form errors: {form.errors}")
    return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_confirm(request):
    try:
        # Get data from request
        uid = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        
        print(f"Password reset attempt - UID: {uid}, Token: {token}")  # Debug log
        
        if not all([uid, token, new_password]):
            return Response(
                {"detail": "Missing required fields"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Decode the user id
            user_id = urlsafe_base64_decode(uid).decode()
            user = User.objects.get(pk=user_id)
            print(f"Found user: {user.email}")  # Debug log
        except (TypeError, ValueError, User.DoesNotExist) as e:
            print(f"Error finding user: {str(e)}")  # Debug log
            return Response(
                {"detail": "Invalid user ID"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify token
        if not default_token_generator.check_token(user, token):
            print("Invalid or expired token")  # Debug log
            return Response(
                {"detail": "Invalid or expired reset token"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Set new password
        try:
            user.set_password(new_password)
            user.save()
            print(f"Password updated successfully for user: {user.email}")  # Debug log
            
            return Response(
                {"detail": "Password has been reset successfully"},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            print(f"Error saving password: {str(e)}")  # Debug log
            return Response(
                {"detail": "Error saving new password"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    except Exception as e:
        print(f"Password reset error: {str(e)}")  # Debug log
        return Response(
            {"detail": "Password reset failed"},
            status=status.HTTP_400_BAD_REQUEST
        )

# Common create method to use in both classes
def create_course(self, request, *args, **kwargs):
    try:
        print("\n=== DEBUG: Course Creation ===")
        print("Request data:", request.data)
        print("Files:", request.FILES)
        print("===========================\n")

        # Get the action type from request
        action_type = request.data.get('action_type', 'save_continue')

        # Create course first with basic data
        course_data = {
            'title': request.data.get('title'),
            'description': request.data.get('description'),
            'level_info': request.data.get('level_info'),
            'instructor': request.user
        }

        # Create the course instance
        course = Course.objects.create(**course_data)

        try:
            # Handle image upload if present
            if 'image' in request.FILES:
                image_file = request.FILES['image']
                print(f"Processing image: {image_file.name}")
                success = course.save_image_to_drive(image_file)
                if not success:
                    raise Exception("Failed to upload image")

            # Handle video upload if present
            if 'video' in request.FILES:
                video_file = request.FILES['video']
                print(f"Processing video: {video_file.name}")
                success = course.save_video_to_vimeo(video_file)
                if not success:
                    raise Exception("Failed to upload video")

            # Return success response
            serializer = self.get_serializer(course)
            response_data = {
                'status': 'success',
                'data': serializer.data,
                'notification': {
                    'type': 'success',
                    'title': 'Success!',
                    'message': 'Changes saved successfully',
                    'duration': 1500,
                    'position': 'top-center'
                },
                'stay_on_page': True  # Add this flag
            }

            # Only add redirect for 'back' action
            if action_type == 'back':
                response_data.update({
                    'redirect': {
                        'path': '/instructor/courses',  # Change to courses page
                        'delay': 1500
                    }
                })
                response_data['stay_on_page'] = False  # Override stay_on_page for back action

            return Response(response_data, status=status.HTTP_201_CREATED)

        except Exception as e:
            course.delete()
            raise Exception(f"File upload failed: {str(e)}")

    except Exception as e:
        print(f"Error creating course: {str(e)}")
        return Response(
            {
                'status': 'error',
                'message': str(e)
            },
            status=status.HTTP_400_BAD_REQUEST
        )

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)
    
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [AllowAny]
        return [permission() for permission in permission_classes]
    
    def create(self, request, *args, **kwargs):
        return create_course(self, request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        try:
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            
            # Print received data for debugging
            print("Update data:", request.data)
            print("Files:", request.FILES)
            print("User:", request.user)
            
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            
            if not serializer.is_valid():
                print("Validation errors:", serializer.errors)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            self.perform_update(serializer)
            return Response(serializer.data)
            
        except Exception as e:
            print(f"Error updating course: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {"detail": "Error updating course", "error": str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'])
    def curriculum(self, request, pk=None):
        course = self.get_object()
        curriculum = course.curriculum_items.all()
        serializer = CurriculumSerializer(curriculum, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def code_questions(self, request, pk=None):
        course = self.get_object()
        questions = course.code_questions.all()
        serializer = CodeQuestionSerializer(questions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def assignments(self, request, pk=None):
        course = self.get_object()
        assignments = course.assignments.all()
        serializer = AssignmentSerializer(assignments, many=True)
        return Response(serializer.data)
    
    def delete_from_gcs(self, image_url):
        """Delete image from Google Cloud Storage"""
        try:
            if not image_url:
                return
                
            # Parse the URL to get the path
            parsed_url = urlparse(image_url)
            path = parsed_url.path.lstrip('/')
            
            # Initialize GCS client
            storage_client = storage.Client.from_service_account_json(
                os.path.join(settings.BASE_DIR, 'Credential.json')
            )
            bucket = storage_client.bucket(settings.GS_BUCKET_NAME)
            blob = bucket.blob(path)
            
            # Delete the blob
            blob.delete()
            print(f"Deleted image from GCS: {path}")
            
        except Exception as e:
            print(f"Error deleting image from GCS: {str(e)}")

    def delete_from_vimeo(self, video_url):
        """Delete video from Vimeo"""
        try:
            if not video_url:
                return
                
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
                print(f"Extracted video ID: {video_id}")
                
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

    def perform_destroy(self, instance):
        """Override destroy method to clean up resources before deletion"""
        try:
            # Delete image from Google Cloud Storage if image_url exists
            if hasattr(instance, 'image_url') and instance.image_url:
                self.delete_from_gcs(instance.image_url)
            
            # Delete local image if it exists
            if instance.image:
                instance.image.delete(save=False)
            
            # Delete video from Vimeo if it exists
            if instance.introduction_video:
                self.delete_from_vimeo(instance.introduction_video)
            
            # Delete the database record
            instance.delete()
            
        except Exception as e:
            print(f"Error during course deletion: {str(e)}")
            raise

    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            print(f"Starting deletion of course: {instance.title}")
            
            # Store video URL for logging
            video_url = instance.introduction_video
            
            # Delete the course (this will trigger the model's delete method)
            instance.delete()
            
            print(f"Course deleted successfully. Video URL was: {video_url}")
            
            return Response({
                "detail": "Course and associated resources deleted successfully",
                "video_url": video_url
            }, status=status.HTTP_204_NO_CONTENT)
            
        except Exception as e:
            print(f"Error deleting course: {str(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            return Response({
                "detail": f"Error deleting course: {str(e)}",
                "traceback": traceback.format_exc()
            }, status=status.HTTP_400_BAD_REQUEST)

    def upload_introduction_video(self, request, course_id):
        try:
            course = Course.objects.get(id=course_id)
            video_file = request.FILES.get('introduction_video')
            
            # Validate video
            if video_file:
                if video_file.content_type not in settings.ALLOWED_VIDEO_TYPES:
                    return JsonResponse({
                        'status': 'error',
                        'message': 'Invalid video format'
                    }, status=400)
                    
                if video_file.size > settings.VIDEO_UPLOAD_MAX_SIZE:
                    return JsonResponse({
                        'status': 'error',
                        'message': 'Video too large'
                    }, status=400)
                
                # Upload to Drive
                success = course.save_introduction_video(video_file)
                if success:
                    return JsonResponse({
                        'status': 'success',
                        'video_url': course.introduction_video_url
                    })
            
            return JsonResponse({
                'status': 'error',
                'message': 'No video file provided'
            }, status=400)
            
        except Course.DoesNotExist:
            return JsonResponse({
                'status': 'error',
                'message': 'Course not found'
            }, status=404)
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)

    @action(detail=True, methods=['POST'], parser_classes=[MultiPartParser])
    def upload_video(self, request, pk=None):
        """Upload introduction video for a course"""
        try:
            course = self.get_object()
            video_file = request.FILES.get('video')
            
            if not video_file:
                return Response({
                    'status': 'error',
                    'message': 'No video file provided'
                }, status=400)

            # Upload to Drive
            success = course.save_introduction_video(video_file)
            
            if success:
                return Response({
                    'status': 'success',
                    'video_url': course.introduction_video_url,
                    'message': 'Video uploaded successfully'
                })
            
            return Response({
                'status': 'error',
                'message': 'Upload failed'
            }, status=400)
            
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=500)

class CategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for managing course categories"""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Category.objects.all().order_by('name')

class SubcategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for managing course subcategories"""
    queryset = Subcategory.objects.all()
    serializer_class = SubcategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Filter by category if provided
        category_id = self.request.query_params.get('category_id', None)
        queryset = Subcategory.objects.all()
        
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        return queryset.order_by('category', 'name')

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get subcategories grouped by category"""
        categories = Category.objects.all()
        data = {}
        
        for category in categories:
            subcategories = category.subcategories.all()
            data[category.name] = SubcategorySerializer(subcategories, many=True).data
        
        return Response(data)

class InstructorViewSet(viewsets.ModelViewSet):
    queryset = Instructor.objects.all()
    serializer_class = InstructorSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter instructors based on query parameters"""
        queryset = Instructor.objects.all()
        
        # Filter by expertise
        expertise = self.request.query_params.get('expertise', None)
        if expertise:
            queryset = queryset.filter(expertise__icontains=expertise)
        
        # Filter by minimum rating
        min_rating = self.request.query_params.get('min_rating', None)
        if min_rating:
            queryset = queryset.filter(rating__gte=float(min_rating))
        
        return queryset
    
    def perform_create(self, serializer):
        """Create instructor profile for authenticated user"""
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def rate_instructor(self, request, pk=None):
        """Add a rating for an instructor"""
        instructor = self.get_object()
        rating = request.data.get('rating')
        
        try:
            rating = float(rating)
            if not (0 <= rating <= 5):
                raise ValueError("Rating must be between 0 and 5")
                
            # Update instructor rating
            instructor.rating = (instructor.rating * instructor.rating_count + rating) / (instructor.rating_count + 1)
            instructor.rating_count += 1
            instructor.save()
            
            return Response({
                'message': 'Rating added successfully',
                'new_rating': instructor.average_rating
            })
        except (TypeError, ValueError) as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def test_upload(request):
    try:
        image = request.FILES.get('image')
        if not image:
            return Response({"error": "No image provided"}, status=400)
            
        print("Testing upload for:", image.name)
        image_url = upload_to_drive(image, 'test-uploads')
        
        return Response({
            "success": bool(image_url),
            "url": image_url,
            "message": "Upload successful" if image_url else "Upload failed"
        })
    except Exception as e:
        print("Upload test error:", str(e))
        return Response({"error": str(e)}, status=500)

class PasswordResetView(APIView):
    permission_classes = []
    
    def post(self, request):
        email = request.data.get('email')
        print(f"Received password reset request for email: {email}")
        
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            token = jwt.encode({
                'user_id': user.id,
                'exp': datetime.utcnow() + timedelta(hours=1)
            }, settings.SECRET_KEY, algorithm='HS256')
            
            reset_link = f"http://{settings.DOMAIN}/reset-password/{token}"
            
            # Send reset email
            send_mail(
                subject='Password Reset Request - Bona Fide',
                message=f'''
                Hello {user.name},

                You requested a password reset for your Bona Fide account.
                Click the following link to reset your password:

                {reset_link}

                This link will expire in 1 hour.

                If you didn't request this reset, please ignore this email.

                Best regards,
                Bona Fide Team
                ''',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
            
            return Response({
                'message': 'Password reset email sent successfully'
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response({
                'error': 'No account found with this email address'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"Error sending reset email: {str(e)}")
            return Response({
                'error': 'Failed to send reset email',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def post(self, request):
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        
        print(f"Reset attempt - Request data: {request.data}")  # Debug log
        
        if not token or not new_password:
            return Response({
                'error': 'Token and new password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Decode token
            payload = jwt.decode(
                token, 
                settings.SECRET_KEY, 
                algorithms=['HS256']
            )
            user_id = payload.get('user_id')
            print(f"Token decoded, user_id: {user_id}")
            
            if not user_id:
                return Response({
                    'error': 'Invalid token format'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get user
            user = User.objects.get(id=user_id)
            print(f"Found user: {user.email}")
            
            # Set new password
            user.set_password(new_password)
            user.save()
            print(f"Password updated for user: {user.email}")
            
            return Response({
                'message': 'Password reset successful'
            }, status=status.HTTP_200_OK)
            
        except jwt.ExpiredSignatureError:
            print("Token expired")
            return Response({
                'error': 'Reset link has expired'
            }, status=status.HTTP_400_BAD_REQUEST)
        except (jwt.InvalidTokenError, User.DoesNotExist) as e:
            print(f"Invalid token or user not found: {str(e)}")
            return Response({
                'error': 'Invalid reset link'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Unexpected error: {str(e)}")
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data,
                                         context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'email': user.email
        })

class InstructorCoursesView(generics.ListAPIView):
    """View for listing courses of the logged-in instructor"""
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Only return courses where the logged-in user is the instructor
        return Course.objects.filter(instructor=self.request.user).order_by('-created_at')

class CourseListCreateView(generics.ListCreateAPIView):
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get_queryset(self):
        return Course.objects.all()

    def create(self, request, *args, **kwargs):
        return create_course(self, request, *args, **kwargs)

class CourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View for retrieving, updating or deleting a course"""
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def perform_update(self, serializer):
        # Ensure only the instructor can update their own courses
        course = self.get_object()
        if course.instructor != self.request.user:
            raise PermissionDenied("You can only update your own courses")
        
        # Get the files from request
        image = self.request.FILES.get('image')
        video = self.request.FILES.get('video')
        
        # Update the course with new data
        instance = serializer.save()
        
        # Handle image upload if provided
        if image:
            # Your existing image upload logic
            pass
        
        # Handle video upload if provided
        if video:
            # Your existing video upload logic
            pass
        
        return instance

    def perform_destroy(self, instance):
        # Ensure only the instructor can delete their own courses
        if instance.instructor != self.request.user:
            raise PermissionDenied("You can only delete your own courses")
        instance.delete()

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_course_details(request, course_id):
    try:
        course = Course.objects.get(id=course_id)
        serializer = CourseSerializer(course)
        print(f"Fetched course details for ID {course_id}: {serializer.data}")  # Debug log
        return Response(serializer.data)
    except Course.DoesNotExist:
        return Response(
            {"error": "Course not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        print(f"Error fetching course: {str(e)}")
        return Response(
            {"error": str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def intended_learners(request, course_id):
    print(f"Received {request.method} request for course_id: {course_id}")
    print(f"Request path: {request.path}")
    print(f"Request data: {request.data}")

    try:
        course = Course.objects.get(id=course_id, instructor=request.user)
    except Course.DoesNotExist:
        print(f"Course {course_id} not found or user {request.user} is not the instructor")
        return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        try:
            intended_learners = IntendedLearners.objects.get(course=course)
            serializer = IntendedLearnersSerializer(intended_learners)
            return Response(serializer.data)
        except IntendedLearners.DoesNotExist:
            return Response({})

    elif request.method == 'POST':
        print(f"POST data received: {request.data}")  # Debug log
        # Create or update intended learners
        intended_learners, created = IntendedLearners.objects.get_or_create(course=course)
        serializer = IntendedLearnersSerializer(intended_learners, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        print(f"Serializer errors: {serializer.errors}")  # Debug log
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
