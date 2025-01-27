from rest_framework import serializers
from .models import User, Course, IntendedLearners, Category, Subcategory, CourseCategory, CourseSubcategory, Curriculum, CodeQuestion, Assignment, Instructor, CourseFileManager
import vimeo
from django.conf import settings
import tempfile
import os
from googleapiclient.http import MediaIoBaseUpload
from googleapiclient.discovery import build
from io import BytesIO
from google.oauth2 import service_account
import json

class UserSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='name')  # Map username to name field
    confirm_password = serializers.CharField(write_only=True, required=False)  # Make it optional for now
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'password', 'confirm_password',
            'country', 'city', 'role', 'profile_image', 'bio',
            'created_at', 'updated_at'
        ]
        extra_kwargs = {
            # Required fields from registration form
            'email': {'required': True},
            'password': {'write_only': True, 'required': True},
            'country': {'required': True},
            'city': {'required': True},
            
            # Optional/Auto-filled fields
            'role': {'read_only': True},  # Set automatically
            'profile_image': {'required': False},
            'bio': {'required': False},
            'created_at': {'read_only': True},
            'updated_at': {'read_only': True},
        }

    def validate(self, data):
        # If confirm_password is provided, validate it matches
        confirm_password = data.get('confirm_password')
        if confirm_password and data.get('password') != confirm_password:
            raise serializers.ValidationError({
                "confirm_password": "Passwords do not match"
            })
        return data

    def create(self, validated_data):
        # Remove confirm_password if it exists
        validated_data.pop('confirm_password', None)
        
        # Create user with required fields
        user = User.objects.create_user(
            email=validated_data['email'],
            name=validated_data.get('name'),  # This comes from username via source='name'
            password=validated_data['password'],
            country=validated_data.get('country'),
            city=validated_data.get('city')
        )
        return user

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'created_at']

class SubcategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Subcategory
        fields = ['id', 'name', 'category', 'created_at']

class CurriculumSerializer(serializers.ModelSerializer):
    class Meta:
        model = Curriculum
        fields = ['id', 'course', 'type', 'title', 'description', 
                 'resource_url', 'order', 'created_at']

class CodeQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CodeQuestion
        fields = ['id', 'course', 'question', 'answer', 'created_at']

class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = ['id', 'course', 'question', 'created_at']

class IntendedLearnersSerializer(serializers.ModelSerializer):
    learning_outcomes = serializers.ListField(child=serializers.CharField(), required=False)
    skills_needed = serializers.ListField(child=serializers.CharField(), required=False)
    target_audience = serializers.ListField(child=serializers.CharField(), required=False)
    career_goals = serializers.ListField(child=serializers.CharField(), required=False)
    participation_encouragement = serializers.ListField(child=serializers.CharField(), required=False)
    
    class Meta:
        model = IntendedLearners
        fields = ['id', 'course', 'target_audience', 'skills_needed',
                 'learning_outcomes', 'career_goals', 'participation_encouragement']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['learning_outcomes'] = instance.get_learning_outcomes()
        ret['skills_needed'] = instance.get_skills_needed()
        ret['target_audience'] = instance.get_target_audience()
        ret['career_goals'] = instance.get_career_goals()
        ret['participation_encouragement'] = instance.get_participation_encouragement()
        return ret

    def to_internal_value(self, data):
        internal_value = super().to_internal_value(data)
        for field in ['learning_outcomes', 'skills_needed', 'target_audience', 
                     'career_goals', 'participation_encouragement']:
            if field in internal_value:
                internal_value[field] = json.dumps(internal_value[field])
        return internal_value

class CourseSerializer(serializers.ModelSerializer):
    instructor_name = serializers.CharField(source='instructor.name', read_only=True)
    image = serializers.FileField(write_only=True, required=False)
    video = serializers.FileField(write_only=True, required=False)
    should_update_image = serializers.BooleanField(write_only=True, required=False)
    should_delete_image = serializers.BooleanField(write_only=True, required=False)
    should_update_video = serializers.BooleanField(write_only=True, required=False)
    should_delete_video = serializers.BooleanField(write_only=True, required=False)

    def create(self, validated_data):
        image_file = validated_data.pop('image', None)
        video_file = validated_data.pop('video', None)
        
        # Create the course instance
        course = Course.objects.create(**validated_data)
        
        try:
            # Create folder structure in Google Drive
            if not hasattr(course, 'file_manager'):
                CourseFileManager.objects.create(course=course)

            # Handle image upload to Google Drive if provided
            if image_file:
                course.save_image_to_drive(image_file)

            # Handle video upload to Vimeo if provided
            if video_file:
                course.save_video_to_vimeo(video_file)
                
            course.save()
            return course

        except Exception as e:
            # If anything fails, delete the course and raise the error
            course.delete()
            raise serializers.ValidationError(f"Error creating course: {str(e)}")

    def update(self, instance, validated_data):
        image_file = validated_data.pop('image', None)
        video_file = validated_data.pop('video', None)
        should_update_image = validated_data.pop('should_update_image', False)
        should_delete_image = validated_data.pop('should_delete_image', False)
        should_update_video = validated_data.pop('should_update_video', False)
        should_delete_video = validated_data.pop('should_delete_video', False)

        # Update basic fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        try:
            # Handle image update/deletion
            if should_delete_image:
                # Delete existing image from Google Drive
                if instance.file_manager.image_file_id:
                    service = instance._get_drive_service()
                    service.files().delete(fileId=instance.file_manager.image_file_id).execute()
                    instance.file_manager.image_file_id = None
                    instance.image_url = None
                    instance.file_manager.save()

            if should_update_image and image_file:
                # Upload new image to Google Drive
                instance.save_image_to_drive(image_file)

            # Handle video update/deletion
            if should_delete_video:
                # Delete existing video from Vimeo
                if instance.introduction_video_url:
                    instance.delete_from_vimeo(instance.introduction_video_url)
                    instance.introduction_video_url = None
                    instance.introduction_video_thumbnail = None

            if should_update_video and video_file:
                # Upload new video to Vimeo
                instance.save_video_to_vimeo(video_file)

            instance.save()
            return instance

        except Exception as e:
            raise serializers.ValidationError(f"Error updating course: {str(e)}")

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'description', 'level_info',
            'image', 'video', 'image_url', 'introduction_video_url',
            'introduction_video_thumbnail', 'instructor_name',
            'created_at', 'updated_at', 'instructor',
            'should_update_image', 'should_delete_image',
            'should_update_video', 'should_delete_video'
        ]
        read_only_fields = [
            'image_url', 'introduction_video_url',
            'introduction_video_thumbnail', 'instructor_name',
            'created_at', 'updated_at'
        ]

    def validate_level_info(self, value):
        valid_levels = ['Beginner', 'Intermediate', 'Expert', 'All Level']
        value = value.title()
        if value not in valid_levels:
            raise serializers.ValidationError(
                "Level info must be one of: Beginner, Intermediate, Expert, All Level"
            )
        return value

class InstructorSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='user.name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    average_rating = serializers.CharField(read_only=True)

    class Meta:
        model = Instructor
        fields = [
            'id', 'name', 'email', 'expertise', 
            'rating', 'rating_count', 'average_rating',
            'bio', 'created_at', 'updated_at'
        ]
        read_only_fields = ['rating', 'rating_count', 'created_at', 'updated_at']
