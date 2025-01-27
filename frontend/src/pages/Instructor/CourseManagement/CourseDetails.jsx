import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import CourseManagementSidebar from '../components/CourseManagementSidebar';
import InstructorNavigation from '../components/InstructorNavigation';

const CourseDetails = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [videoName, setVideoName] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        level_info: 'Beginner',
        image: null,
        video: null
    });

    useEffect(() => {
        const fetchCourseDetails = async () => {
            try {
                const params = new URLSearchParams(location.search);
                const courseId = params.get('courseId');
                
                if (!courseId) {
                    throw new Error('Course ID not found');
                }

                const response = await axios.get(`http://localhost:8000/api/courses/${courseId}/`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    }
                });
                
                const courseData = response.data;
                setFormData({
                    title: courseData.title,
                    description: courseData.description,
                    level_info: courseData.level_info || 'Beginner',
                    introduction_video_url: courseData.introduction_video_url
                });

                // Set image preview from either image_view_url or image_url
                if (courseData.image_view_url || courseData.image_url) {
                    setImagePreview(courseData.image_view_url || courseData.image_url);
                }
                
                // Set video name from Vimeo URL if exists
                if (courseData.introduction_video_url) {
                    setVideoName(courseData.introduction_video_url.split('/').pop());
                }
                
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
                toast.error('Failed to load course details');
            }
        };

        fetchCourseDetails();
    }, [location]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError(null);
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (files.length > 0) {
            const file = files[0];
            
            if (name === 'image') {
                if (!file.type.startsWith('image/jpeg') && !file.type.startsWith('image/png')) {
                    setError('Please upload only JPG or PNG image files');
                    return;
                }
                setImagePreview(URL.createObjectURL(file));
            } else if (name === 'video') {
                setVideoName(file.name);
            }

            setFormData(prev => ({
                ...prev,
                [name]: file
            }));
            setError(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const params = new URLSearchParams(location.search);
            const courseId = params.get('courseId');
            
            const data = new FormData();
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('level_info', formData.level_info);

            // Only append image if a new one is selected
            if (formData.image instanceof File) {
                data.append('image', formData.image);
            }

            // Only append video if a new one is selected
            if (formData.video instanceof File) {
                data.append('video', formData.video);
            }

            const response = await axios.put(`http://localhost:8000/api/courses/${courseId}/`, data, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data) {
                toast.success('Course updated successfully!');
                // Refresh the page to show updated data
                window.location.reload();
            }
        } catch (err) {
            console.error('Error updating course:', err);
            const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to update course';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5B42B7]"></div>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-[#FFEDE2]">
            {/* Left Sidebar */}
            <CourseManagementSidebar activeStep="information" />
            
            {/* Main Content */}
            <div className="flex-1">
                {/* Top Bar - Profile */}
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

                {/* Form Content */}
                <div className="mx-8 bg-white rounded-lg shadow-sm">
                    <div className="p-8">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-8">Edit Course Information</h2>
                        
                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-red-700">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Course Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-[#5B42B7] focus:border-[#5B42B7]"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Course Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={4}
                                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-[#5B42B7] focus:border-[#5B42B7]"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Course Level</label>
                                <select
                                    name="level_info"
                                    value={formData.level_info}
                                    onChange={handleInputChange}
                                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-[#5B42B7] focus:border-[#5B42B7]"
                                    required
                                >
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Expert">Expert</option>
                                    <option value="All Level">All Level</option>
                                </select>
                            </div>
                        
                            {/* Image Upload/Preview Section */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Course Image</label>
                                <div className="mt-1 border-2 border-gray-300 border-dashed rounded-md p-6 hover:border-[#5B42B7] transition-colors">
                                    <div className="text-center">
                                        {!imagePreview ? (
                                            <div>
                                                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                <div className="mt-4 flex text-sm text-gray-600 justify-center">
                                                    <label className="relative cursor-pointer text-[#5B42B7] hover:text-[#4A357F]">
                                                        <span>Upload an image</span>
                                                        <input
                                                            type="file"
                                                            name="image"
                                                            accept="image/jpeg,image/png"
                                                            onChange={handleFileChange}
                                                            className="sr-only"
                                                        />
                                                    </label>
                                                    <p className="pl-1">or drag and drop</p>
                                                </div>
                                                <p className="text-xs text-gray-500">PNG or JPG up to 10MB</p>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <img src={imagePreview} alt="Course Preview" className="max-h-48 mx-auto rounded" />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setImagePreview(null);
                                                        setFormData(prev => ({ ...prev, image: null }));
                                                    }}
                                                    className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                                >
                                                    <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path d="M6 18L18 6M6 6l12 12"></path>
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Video Upload/Preview Section */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Introduction Video</label>
                                <div className="mt-1 border-2 border-gray-300 border-dashed rounded-md p-6 hover:border-[#5B42B7] transition-colors">
                                    <div className="text-center">
                                        {!videoName ? (
                                            <div>
                                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                                <div className="mt-4 flex text-sm text-gray-600 justify-center">
                                                    <label className="relative cursor-pointer text-[#5B42B7] hover:text-[#4A357F]">
                                                        <span>Upload a video</span>
                                                        <input
                                                            type="file"
                                                            name="video"
                                                            accept="video/*"
                                                            onChange={handleFileChange}
                                                            className="sr-only"
                                                        />
                                                    </label>
                                                    <p className="pl-1">or drag and drop</p>
                                                </div>
                                                <p className="text-xs text-gray-500">MP4, MOV up to 100MB</p>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                {formData.introduction_video_url ? (
                                                    <div className="aspect-w-16 aspect-h-9">
                                                        <iframe
                                                            src={formData.introduction_video_url}
                                                            className="w-full h-64 rounded-lg"
                                                            frameBorder="0"
                                                            allow="autoplay; fullscreen; picture-in-picture"
                                                            allowFullScreen
                                                        ></iframe>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center space-x-2">
                                                        <svg className="h-8 w-8 text-[#5B42B7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                        </svg>
                                                        <span className="text-sm text-gray-700">{videoName}</span>
                                                    </div>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setVideoName('');
                                                        setFormData(prev => ({ ...prev, video: null, introduction_video_url: null }));
                                                    }}
                                                    className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                                >
                                                    <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path d="M6 18L18 6M6 6l12 12"></path>
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-4 pt-6">
                                <button 
                                    type="button" 
                                    onClick={() => navigate('/instructor/courses')}
                                    className="px-6 py-2 border border-[#5B42B7] text-[#5B42B7] rounded hover:bg-[#5B42B7] hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-6 py-2 bg-[#5B42B7] text-white rounded hover:bg-[#4A357F] transition-colors flex items-center"
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Saving...
                                        </>
                                    ) : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseDetails;