import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import InstructorSidebar from '../components/InstructorSidebar';

const InstructorCourses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
    const [imageLoadError, setImageLoadError] = useState({});

    const navigate = useNavigate();

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const refreshToken = localStorage.getItem('refreshToken');
            
            if (!token) {
                toast.error('Please login again');
                navigate('/login');
                return;
            }

            try {
                const response = await axios.get('http://localhost:8000/api/instructor/courses/', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                console.log('Raw API response:', response);
                console.log('Courses data:', response.data);
                
                if (Array.isArray(response.data)) {
                    setCourses(response.data);
                } else {
                    console.error('Unexpected response format:', response.data);
                    toast.error('Unexpected data format from server');
                }
            } catch (error) {
                // If token is expired, try to refresh it
                if (error.response?.status === 401 && refreshToken) {
                    try {
                        const refreshResponse = await axios.post('http://localhost:8000/api/token/refresh/', {
                            refresh: refreshToken
                        });
                        
                        const newToken = refreshResponse.data.access;
                        localStorage.setItem('accessToken', newToken);
                        
                        // Retry the original request with new token
                        const retryResponse = await axios.get('http://localhost:8000/api/instructor/courses/', {
                            headers: {
                                'Authorization': `Bearer ${newToken}`
                            }
                        });
                        
                        if (Array.isArray(retryResponse.data)) {
                            setCourses(retryResponse.data);
                        }
                    } catch (refreshError) {
                        console.error('Error refreshing token:', refreshError);
                        localStorage.removeItem('accessToken');
                        localStorage.removeItem('refreshToken');
                        localStorage.removeItem('user');
                        toast.error('Session expired. Please login again.');
                        navigate('/login');
                    }
                } else {
                    console.error('Error fetching courses:', error);
                    console.error('Error details:', error.response?.data);
                    toast.error('Failed to load courses. Please try again.');
                }
            }
        } catch (error) {
            console.error('Error in fetchCourses:', error);
            toast.error('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNewClass = () => {
        navigate('/instructor/course-management');
    };

    const handleEdit = (courseId) => {
        navigate(`/instructor/course-management/information?courseId=${courseId}`);
    };

    const handleDelete = async (courseId) => {
        if (window.confirm('Are you sure you want to delete this course? This action will also delete all associated videos from Vimeo and files from Google Drive. This action cannot be undone.')) {
            try {
                const token = localStorage.getItem('accessToken');
                
                // First, get the course details to have access to file IDs
                const courseResponse = await axios.get(`http://localhost:8000/api/courses/${courseId}/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const course = courseResponse.data;
                console.log('Deleting course:', course);

                // Delete the course and all associated content
                await axios.delete(`http://localhost:8000/api/courses/${courseId}/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    data: {
                        delete_all: true
                    }
                });
                
                toast.success('Course and all associated content deleted successfully');
                fetchCourses();
            } catch (error) {
                console.error('Error deleting course:', error);
                toast.error(error.response?.data?.message || 'Failed to delete course. Please try again.');
            }
        }
    };

    const handleImageError = (courseId) => {
        setImageLoadError(prev => ({
            ...prev,
            [courseId]: true
        }));
    };

    const getImageUrl = (url) => {
        if (!url) return null;
        
        // If it's a Google Drive URL
        if (url.includes('drive.google.com')) {
            // Get the file ID from the URL
            const fileId = url.match(/id=([^&]+)/)?.[1];
            if (fileId) {
                // Return the direct thumbnail URL with size parameter
                return `https://drive.google.com/thumbnail?id=${fileId}&sz=w500`;
            }
        }
        return url;
    };

    return (
        <div className="flex min-h-screen bg-[#FFEDE2]">
            <InstructorSidebar activePage="courses" />
            
            {/* Main Content */}
            <div className="flex-1">
                {/* Top Bar - Profile Only */}
                <div className="bg-[#FFEDE2] px-8 py-4 mr-20">
                    <div className="flex justify-end">
                        <div className="flex items-center space-x-2">
                            <div className="relative">
                                <img
                                    src={user?.profile_image || "/src/assets/icons/profile.svg"}
                                    alt="Profile"
                                    className="h-10 w-10 rounded-full"
                                />
                                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-400 border-2 border-white"></div>
                            </div>
                            <div className="flex items-center">
                                <span className="text-gray-700">{user?.name}</span>
                                <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24">
                                    <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth={2} 
                                        d="M19 9l-7 7-7-7" 
                                        stroke="#5B42B7"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Card Container */}
                <div className="mx-8 bg-white rounded-lg shadow-sm">
                    {/* Card Header */}
                    <div className="p-6 flex justify-between items-center">
                        <div 
                            className="flex items-center text-[#5B42B7] cursor-pointer"
                            onClick={handleCreateNewClass}
                        >
                            <img
                                src="/src/assets/icons/play.svg"
                                alt="Start Creating"
                                className="h-10 w-10 mr-2"
                                style={{ filter: 'invert(32%) sepia(15%) saturate(2848%) hue-rotate(222deg) brightness(92%) contrast(92%)' }}
                            />
                            <span>Start Creating a New Class</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <input
                                    type="search"
                                    placeholder="Search your courses"
                                    className="w-64 px-4 py-2 pl-10 rounded-lg border border-[#5B42B7] focus:outline-none"
                                />
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-[#5B42B7]" fill="none" viewBox="0 0 24 24">
                                        <path 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                            strokeWidth={2} 
                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                                            stroke="#5B42B7"
                                        />
                                    </svg>
                                </div>
                            </div>
                            <div className="relative">
                                <select className="px-4 py-2 pr-10 rounded-lg border border-[#5B42B7] bg-[#5B42B7] text-white appearance-none">
                                    <option>Newest</option>
                                    <option>Oldest</option>
                                    <option>Popular</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
                                        <path 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                            strokeWidth={2} 
                                            d="M19 9l-7 7-7-7" 
                                            stroke="white"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Course List */}
                    <div className="px-6 pb-6">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5B42B7] mx-auto"></div>
                                <p className="mt-4 text-gray-500">Loading courses...</p>
                            </div>
                        ) : courses.length > 0 ? (
                            <div className="space-y-4">
                                {courses.map(course => (
                                    <div key={course.id} className="bg-[#FFEDE2] p-4 rounded-lg flex justify-between items-center">
                                        <div className="flex items-center space-x-4">
                                            <div className="h-16 w-24 relative overflow-hidden rounded">
                                                {!imageLoadError[course.id] ? (
                                                    <img
                                                        src={getImageUrl(course.image_url)}
                                                        alt={course.title}
                                                        className="h-full w-full object-cover"
                                                        onError={() => handleImageError(course.id)}
                                                        referrerPolicy="no-referrer"
                                                    />
                                                ) : (
                                                    <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                                                        <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold">{course.title}</h3>
                                                <span className="text-[#5B42B7] text-sm bg-white px-3 py-1 rounded-full">
                                                    {course.level_info}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button 
                                                onClick={() => handleEdit(course.id)}
                                                className="px-4 py-1 border border-[#5B42B7] text-[#5B42B7] rounded-lg hover:bg-white"
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(course.id)}
                                                className="px-4 py-1 bg-[#5B42B7] text-white rounded-lg hover:bg-[#4a357f]"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-gray-500">No courses found. Start by creating a new class!</p>
                            </div>
                        )}
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="px-6 pb-6 flex justify-end space-x-4">
                        <button 
                            onClick={handleCreateNewClass} 
                            className="px-6 py-2 bg-[#5B42B7] text-white rounded-lg hover:bg-[#4a357f]"
                        >
                            Create New Class
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstructorCourses; 