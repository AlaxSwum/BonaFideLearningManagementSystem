from rest_framework import serializers
from .models import Course

class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = [
            'id', 'title', 'description', 'level_info',
            'image_url', 'image_view_url',
            'introduction_video_url', 'introduction_video_thumbnail',
        ]
        read_only_fields = [
            'image_url', 'image_view_url',
            'introduction_video_url', 'introduction_video_thumbnail'
        ]

    def create(self, validated_data):
        # Extract files from request.FILES
        request = self.context.get('request')
        image_file = request.FILES.get('image') if request else None
        video_file = request.FILES.get('video') if request else None

        # Remove media and flag fields from validated_data
        for field in ['image', 'video', 'should_update_image', 'should_delete_image', 
                     'should_update_video', 'should_delete_video']:
            validated_data.pop(field, None)

        # Create the course instance
        try:
            # Create course with basic data
            course = Course.objects.create(**validated_data)

            # Handle image upload if present
            if image_file:
                success = course.save_image_to_drive(image_file)
                if not success:
                    course.delete()
                    raise serializers.ValidationError("Failed to upload image")

            # Handle video upload if present
            if video_file:
                success = course.save_video_to_vimeo(video_file)
                if not success:
                    course.delete()
                    raise serializers.ValidationError("Failed to upload video")

            return course

        except Exception as e:
            # If anything fails, make sure to clean up
            if 'course' in locals():
                course.delete()
            raise serializers.ValidationError(str(e))

    def update(self, instance, validated_data):
        # Get files from request.FILES
        request = self.context.get('request')
        image_file = request.FILES.get('image') if request else None
        video_file = request.FILES.get('video') if request else None

        # Get flags
        should_update_image = validated_data.pop('should_update_image', False)
        should_delete_image = validated_data.pop('should_delete_image', False)
        should_update_video = validated_data.pop('should_update_video', False)
        should_delete_video = validated_data.pop('should_delete_video', False)

        # Remove media fields from validated_data
        validated_data.pop('image', None)
        validated_data.pop('video', None)

        try:
            # Handle image
            if should_delete_image:
                if hasattr(instance, 'file_manager'):
                    instance.file_manager.delete_from_drive()
                instance.image_url = None
                instance.image_view_url = None
            elif should_update_image and image_file:
                success = instance.save_image_to_drive(image_file)
                if not success:
                    raise serializers.ValidationError("Failed to upload image")

            # Handle video
            if should_delete_video:
                instance.delete_from_vimeo(instance.introduction_video_url)
                instance.introduction_video_url = None
                instance.introduction_video_thumbnail = None
            elif should_update_video and video_file:
                success = instance.save_video_to_vimeo(video_file)
                if not success:
                    raise serializers.ValidationError("Failed to upload video")

            # Update other fields
            for attr, value in validated_data.items():
                setattr(instance, attr, value)

            instance.save()
            return instance

        except Exception as e:
            raise serializers.ValidationError(str(e)) 