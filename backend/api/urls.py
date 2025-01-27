from django.urls import path, include
from django.contrib.auth import views as auth_views
from django.views.decorators.csrf import csrf_exempt
from django.core.exceptions import ValidationError
from django.http import JsonResponse
from . import views
from rest_framework.permissions import AllowAny
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, SubcategoryViewSet, 
    InstructorViewSet, PasswordResetView, PasswordResetConfirmView,
    CourseListCreateView, CourseDetailView, InstructorCoursesView
)

class CustomPasswordResetView(auth_views.PasswordResetView):
    permission_classes = [AllowAny]
    
    def form_valid(self, form):
        try:
            return super().form_valid(form)
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'detail': str(e)
            }, status=400)

    def form_invalid(self, form):
        return JsonResponse({
            'status': 'error',
            'errors': form.errors
        }, status=400)

class CustomPasswordResetConfirmView(auth_views.PasswordResetConfirmView):
    permission_classes = [AllowAny]
    success_url = '/login/'  # Change this to point to login page
    
    def form_valid(self, form):
        try:
            form.save()
            return JsonResponse({
                'status': 'success',
                'message': 'Password has been reset successfully'
            })
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'detail': str(e)
            }, status=400)

router = DefaultRouter()
# Removed courses from router to avoid conflicts with explicit URL patterns
router.register(r'categories', CategoryViewSet)
router.register(r'subcategories', SubcategoryViewSet)
router.register(r'instructors', InstructorViewSet)

urlpatterns = [
    path('register/', views.register_user, name='register'),
    path('login/', views.login_user, name='login'),
    path('user/me/', views.get_user_details, name='user-details'),
    # Password Reset URLs
    path('password-reset/', views.PasswordResetView.as_view(), name='password_reset'),
    path('password-reset/done/', 
        auth_views.PasswordResetDoneView.as_view(
            template_name='password/password_reset_done.html'
        ),
        name='password_reset_done'
    ),
    path('password-reset-confirm/', views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('password-reset-complete/', 
        auth_views.PasswordResetCompleteView.as_view(
            template_name='password/password_reset_complete.html'
        ),
        name='password_reset_complete'
    ),
    path('', include(router.urls)),
    # Course URLs
    path('courses/', CourseListCreateView.as_view(), name='course-list-create'),
    path('courses/<int:pk>/', CourseDetailView.as_view(), name='course-detail'),
    path('instructor/courses/', InstructorCoursesView.as_view(), name='instructor-courses'),
    path('courses/<int:course_id>/', views.get_course_details, name='course-details'),
    path('courses/<int:course_id>/intended-learners/', views.intended_learners, name='course_intended_learners'),
]
