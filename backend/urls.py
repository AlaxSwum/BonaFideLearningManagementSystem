from django.urls import path
from .views import CourseViewSet, CourseListCreateView

urlpatterns = [
    # Make sure only one of these is being used
    path('api/courses/', CourseListCreateView.as_view(), name='course-list-create'),
    # or
    path('api/courses/', CourseViewSet.as_view({'post': 'create'}), name='course-create'),
    path('api/courses/<int:course_id>/', views.CourseView.as_view(), name='course-detail'),
] 