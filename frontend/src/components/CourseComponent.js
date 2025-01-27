const updateCourse = async (courseId, courseData) => {
    if (!courseId) {
        console.error('Course ID is undefined');
        return;
    }
    
    try {
        const response = await fetch(`/api/courses/${courseId}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(courseData)
        });
        // ... handle response
    } catch (error) {
        console.error('Error updating course:', error);
    }
} 