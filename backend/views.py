from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
from backend.models import Course
from backend.serializers import CourseSerializer
import json

class CourseView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        try:
            print("\n===== DETAILED DEBUG =====")
            print("Request data type:", type(request.data))
            print("Request data:", {k: str(v)[:100] for k, v in request.data.items()})
            print("Files type:", type(request.FILES))
            print("Files keys:", list(request.FILES.keys()))
            print("=========================\n")

            # Extract basic data
            course_data = {
                'title': request.data.get('title', ''),
                'description': request.data.get('description', ''),
                'level_info': request.data.get('level_info', '')
            }

            # Create course instance
            course = Course.objects.create(**course_data)
            print(f"Course created with ID: {course.id}")

            try:
                # Handle image upload
                if 'image' in request.FILES:
                    image_file = request.FILES['image']
                    print(f"Processing image: {image_file.name}")
                    success = course.save_image_to_drive(image_file)
                    if not success:
                        raise Exception("Failed to upload image")
                    print("Image upload successful")

                # Handle video upload
                if 'video' in request.FILES:
                    video_file = request.FILES['video']
                    print(f"Processing video: {video_file.name}")
                    success = course.save_video_to_vimeo(video_file)
                    if not success:
                        raise Exception("Failed to upload video")
                    print("Video upload successful")

                # Refresh course instance to get updated URLs
                course.refresh_from_db()
                
                return Response(
                    CourseSerializer(course).data,
                    status=status.HTTP_201_CREATED
                )

            except Exception as e:
                print(f"Error during file upload: {str(e)}")
                # Clean up the course if file upload fails
                course.delete()
                raise Exception(f"File upload failed: {str(e)}")

        except Exception as e:
            print(f"Error in course creation: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def put(self, request, course_id):
        try:
            course = Course.objects.get(id=course_id)
            
            # Update basic fields
            course.title = request.data.get('title', course.title)
            course.description = request.data.get('description', course.description)
            course.level_info = request.data.get('level_info', course.level_info)

            # Handle image
            if request.data.get('should_delete_image') == 'true':
                if hasattr(course, 'file_manager'):
                    course.file_manager.delete_from_drive()
                course.image_url = None
                course.image_view_url = None
            elif request.data.get('should_update_image') == 'true' and 'image' in request.FILES:
                course.save_image_to_drive(request.FILES['image'])

            # Handle video
            if request.data.get('should_delete_video') == 'true':
                course.delete_from_vimeo(course.introduction_video_url)
                course.introduction_video_url = None
                course.introduction_video_thumbnail = None
            elif request.data.get('should_update_video') == 'true' and 'video' in request.FILES:
                course.save_video_to_vimeo(request.FILES['video'])

            course.save()
            return Response(CourseSerializer(course).data)

        except Course.DoesNotExist:
            return Response(
                {'error': 'Course not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"Error updating course: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            ) 