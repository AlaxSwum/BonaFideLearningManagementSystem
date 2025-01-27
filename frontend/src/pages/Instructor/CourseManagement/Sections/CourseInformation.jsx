import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CourseInformation = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const courseId = queryParams.get('courseId');
    const isEditMode = !!courseId;

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        level_info: 'Beginner',
        image: null,
        video: null
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [videoName, setVideoName] = useState('');
    const [existingImageUrl, setExistingImageUrl] = useState(null);
    const [existingVideoUrl, setExistingVideoUrl] = useState(null);
    const [isImageDeleted, setIsImageDeleted] = useState(false);
    const [videoPreview, setVideoPreview] = useState(null);

    useEffect(() => {
        if (isEditMode) {
            fetchCourseDetails();
        }
    }, [courseId]);

    const getImageUrl = (url) => {
        if (!url) return null;
        
        if (url.includes('drive.google.com')) {
            const fileId = url.match(/id=([^&]+)/)?.[1];
            if (fileId) {
                return `https://drive.google.com/thumbnail?id=${fileId}&sz=w500`;
            }
        }
        return url;
    };

    const getVideoEmbedUrl = (url) => {
        if (!url) return null;
        
        // Handle Vimeo URLs
        const vimeoRegex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)(?:\/([a-zA-Z0-9]+))?/;
        const match = url.match(vimeoRegex);
        
        if (match) {
            const videoId = match[1];
            const hash = match[2];
            return `https://player.vimeo.com/video/${videoId}${hash ? '?h=' + hash : ''}`;
        }
        
        return url;
    };

    const fetchCourseDetails = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await axios.get(`http://localhost:8000/api/courses/${courseId}/`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const courseData = response.data;
            console.log('Fetched course data:', courseData);
            
            setFormData({
                title: courseData.title,
                description: courseData.description,
                level_info: courseData.level_info,
                image: null,
                video: null
            });
            
            if (courseData.image_url) {
                const processedImageUrl = getImageUrl(courseData.image_url);
                setExistingImageUrl(courseData.image_url);
                setImagePreview(processedImageUrl);
                console.log('Setting image preview:', processedImageUrl);
            }
            
            if (courseData.introduction_video_url) {
                console.log('Raw video URL from API:', courseData.introduction_video_url);
                const processedVideoUrl = getVideoEmbedUrl(courseData.introduction_video_url);
                console.log('Processed video URL:', processedVideoUrl);
                setExistingVideoUrl(processedVideoUrl);
                setVideoName('Current video');
            }
        } catch (error) {
            console.error('Error fetching course details:', error);
            toast.error('Failed to load course details');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError(null);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (e.target.name === 'image') {
            // Validate image file
            if (!file.type.startsWith('image/')) {
                toast.error('Please upload a valid image file');
                return;
            }
            console.log('New image selected:', file.name);
            setFormData(prev => ({ ...prev, image: file }));
            setExistingImageUrl(null);
            setIsImageDeleted(false);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else if (e.target.name === 'video') {
            // Validate video file
            if (!file.type.startsWith('video/')) {
                toast.error('Please upload a valid video file');
                return;
            }
            console.log('New video selected:', file.name);
            setFormData(prev => ({ ...prev, video: file }));
            setExistingVideoUrl(null);
            setVideoName(file.name);
        }
    };

    const handleImageDelete = () => {
        setImagePreview(null);
        setFormData(prev => ({ ...prev, image: null }));
        setExistingImageUrl(null);
        setIsImageDeleted(true);
    };

    const handleSubmit = async (action) => {
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('accessToken');
            const formDataToSend = new FormData();
            
            // Add basic course information
            formDataToSend.append('title', formData.title);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('level_info', formData.level_info);
            formDataToSend.append('action_type', action);

            // Handle image
            if (formData.image) {
                console.log('Uploading new image:', formData.image.name);
                formDataToSend.append('image', formData.image);
                formDataToSend.append('should_update_image', 'true');
            } else if (isImageDeleted) {
                console.log('Deleting existing image');
                formDataToSend.append('should_delete_image', 'true');
            }

            // Handle video
            if (formData.video) {
                console.log('Uploading new video:', formData.video.name);
                formDataToSend.append('video', formData.video);
                formDataToSend.append('should_update_video', 'true');
            } else if (!existingVideoUrl && isEditMode) {
                console.log('Deleting existing video');
                formDataToSend.append('should_delete_video', 'true');
            }

            let response;
            if (isEditMode) {
                response = await axios({
                    method: 'put',
                    url: `http://localhost:8000/api/courses/${courseId}/`,
                    data: formDataToSend,
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    }
                });
            } else {
                response = await axios.post(
                    'http://localhost:8000/api/courses/',
                    formDataToSend,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'multipart/form-data',
                        }
                    }
                );
            }

            if (response.data.status === 'success') {
                toast.success(response.data.notification.message);
                
                // Only navigate if it's a 'back' action or if there's a redirect in the response
                if (action === 'back' || (response.data.redirect && !response.data.stay_on_page)) {
                    setTimeout(() => {
                        navigate('/instructor/courses');
                    }, 1500);
                }
            }

        } catch (error) {
            console.error('Error details:', error.response?.data || error);
            const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Failed to save course';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Add this new function for handling back navigation
    const handleBack = () => {
        navigate('/instructor/courses');
    };

    return (
        <div className="w-full bg-[#FFEDE2]">
            <div className="w-full">
                <div className="p-8">
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 mb-8 hover:shadow-md transition-all duration-300">
                        <div className="flex items-start space-x-8">
                            <div className="flex-shrink-0">
                                <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                                    <svg className="w-8 h-8 text-[#FF7F0E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                            </div>
                            
                            <div className="flex-grow">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">Course Information</h2>
                                        <p className="text-sm text-gray-600 mt-1">Step 1 of 7</p>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm font-medium text-gray-700">Course Setup</span>
                                            <span className="text-sm font-bold text-[#FF7F0E]">1/7 Steps</span>
                                        </div>
                                        <div className="w-40 h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-[#FF7F0E] to-[#FFA559] rounded-full transition-all duration-700" 
                                                style={{ width: '14.28%' }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-lg">
                            <div className="mb-8">
                                <div className="flex items-center space-x-5">
                                    <div className="p-4 rounded-xl shadow-sm border border-gray-100 transition-all duration-300 bg-white hover:bg-[#FF7F0E]/10">
                                        <div className="text-[#FF7F0E]">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">Basic Information</h3>
                                        <p className="text-sm text-gray-600 mt-2 leading-relaxed max-w-2xl">
                                            Provide the essential details about your course
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="group relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Course Title</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-4 border-2 rounded-xl bg-white
                                                 transition-all duration-200 text-gray-700 placeholder-gray-400
                                                 focus:ring-2 focus:ring-[#FF7F0E]/20 focus:border-[#FF7F0E]
                                                 group-hover:border-[#FF7F0E]/30"
                                        placeholder="Enter a descriptive title for your course"
                                        required
                                    />
                                </div>

                                <div className="group relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Course Description</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows={4}
                                        className="w-full px-4 py-4 border-2 rounded-xl bg-white
                                                 transition-all duration-200 text-gray-700 placeholder-gray-400
                                                 focus:ring-2 focus:ring-[#FF7F0E]/20 focus:border-[#FF7F0E]
                                                 group-hover:border-[#FF7F0E]/30"
                                        placeholder="Write a compelling description of your course"
                                        required
                                    />
                                </div>

                                <div className="group relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Course Image</label>
                                    <div className="flex flex-col items-center space-y-4">
                                        {imagePreview ? (
                                            <div className="relative">
                                                <img src={imagePreview} alt="Preview" className="rounded-xl max-h-48 w-auto shadow-md" />
                                                <button
                                                    type="button"
                                                    onClick={handleImageDelete}
                                                    className="absolute -top-2 -right-2 p-1.5 bg-red-100 text-red-600 rounded-full 
                                                             hover:bg-red-200 transition-colors shadow-sm hover:shadow-md"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <p className="text-sm text-gray-500 mb-4">No image selected</p>
                                            </div>
                                        )}
                                        <label className="px-6 py-3 bg-gradient-to-r from-[#FF7F0E] to-[#FFA559] text-white rounded-xl 
                                                      hover:from-[#E67200] hover:to-[#FF9240] transition-all duration-200 
                                                      cursor-pointer flex items-center space-x-2 shadow-sm hover:shadow-md">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
                                            </svg>
                                            <span className="font-medium">{imagePreview ? 'Change Image' : 'Upload Image'}</span>
                                            <input 
                                                type="file" 
                                                id="image" 
                                                name="image" 
                                                onChange={handleFileChange}
                                                accept="image/*"
                                                className="hidden"
                                            />
                                        </label>
                                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                                    </div>
                                </div>

                                <div className="group relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Introduction Video</label>
                                    <div className="flex flex-col items-center space-y-4">
                                        {existingVideoUrl ? (
                                            <div className="w-full relative">
                                                <div className="aspect-w-16 aspect-h-9 rounded-xl overflow-hidden bg-gray-100 shadow-md">
                                                    <iframe
                                                        src={existingVideoUrl}
                                                        className="w-full h-full"
                                                        frameBorder="0"
                                                        allow="autoplay; fullscreen; picture-in-picture"
                                                        allowFullScreen
                                                    ></iframe>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setExistingVideoUrl(null);
                                                            setFormData(prev => ({ ...prev, video: null }));
                                                        }}
                                                        className="absolute top-2 right-2 p-1.5 bg-red-100 text-red-600 rounded-full 
                                                                 hover:bg-red-200 transition-colors shadow-sm hover:shadow-md z-10"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                                <p className="text-sm text-gray-500 mb-4">No video selected</p>
                                            </div>
                                        )}
                                        <label className="px-6 py-3 bg-gradient-to-r from-[#FF7F0E] to-[#FFA559] text-white rounded-xl 
                                                      hover:from-[#E67200] hover:to-[#FF9240] transition-all duration-200 
                                                      cursor-pointer flex items-center space-x-2 shadow-sm hover:shadow-md">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
                                            </svg>
                                            <span className="font-medium">{existingVideoUrl ? 'Change Video' : 'Upload Video'}</span>
                                            <input 
                                                type="file" 
                                                id="video" 
                                                name="video" 
                                                onChange={handleFileChange}
                                                accept="video/*"
                                                className="hidden"
                                            />
                                        </label>
                                        <p className="text-xs text-gray-500">MP4, WebM up to 100MB</p>
                                        {videoName && !existingVideoUrl && (
                                            <div className="flex items-center justify-between w-full bg-gray-50 px-4 py-3 rounded-lg">
                                                <span className="text-sm text-gray-600">{videoName}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setVideoName('');
                                                        setFormData(prev => ({ ...prev, video: null }));
                                                    }}
                                                    className="text-red-500 hover:text-red-600 transition-colors"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-4 pt-8">
                            <button 
                                type="button" 
                                onClick={handleBack}
                                className="px-6 py-3 border-2 border-[#FF7F0E] text-[#FF7F0E] rounded-xl
                                         hover:bg-[#FF7F0E]/5 transition-all duration-200 
                                         font-medium shadow-sm hover:shadow-md"
                            >
                                Back
                            </button>
                            <button 
                                type="button"
                                onClick={() => handleSubmit('save_continue')}
                                className="px-6 py-3 bg-[#FF7F0E] text-white rounded-xl hover:bg-[#E67200] 
                                         transition-all duration-200 flex items-center font-medium 
                                         shadow-sm hover:shadow-md disabled:opacity-50"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Saving...
                                    </>
                                ) : 'Save & Continue'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CourseInformation; 
