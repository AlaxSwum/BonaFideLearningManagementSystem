import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useLocation, useNavigate } from 'react-router-dom';

const Curriculum = () => {
    const [sections, setSections] = useState([
        { id: 1, title: '', items: [] }
    ]);
    const [loading, setLoading] = useState(false);
    const [activeSection, setActiveSection] = useState(1);
    const location = useLocation();
    const navigate = useNavigate();
    
    // Get courseId from URL query params or localStorage
    const queryParams = new URLSearchParams(location.search);
    const urlCourseId = queryParams.get('courseId');
    const storedCourseId = localStorage.getItem('currentCourseId');
    const courseId = urlCourseId || storedCourseId;
    const isEditMode = !!courseId;

    useEffect(() => {
        if (courseId) {
            localStorage.setItem('currentCourseId', courseId);
            // Only fetch curriculum if we're in edit mode and on the curriculum page
            if (isEditMode && location.pathname.includes('/curriculum')) {
                fetchCurriculum();
            }
        } else {
            // If no courseId is found, redirect to course management
            navigate('/instructor/course-management');
        }
    }, [courseId, location.pathname]);

    // Navigation functions
    const goToIntendedLearners = () => {
        navigate(`/instructor/course-management/intended-learners?courseId=${courseId}`);
    };

    const goToCourseInformation = () => {
        navigate(`/instructor/course-management/information?courseId=${courseId}`);
    };

    const fetchCurriculum = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await axios.get(`http://127.0.0.1:8000/api/curriculum/${courseId}/`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.data.sections && response.data.sections.length > 0) {
                setSections(response.data.sections);
            }
        } catch (error) {
            // Only show error toast if we're actually on the curriculum page
            if (location.pathname.includes('/curriculum')) {
                console.error('Error fetching curriculum:', error);
                if (error.response?.status === 404) {
                    // If curriculum doesn't exist yet, just use the default empty section
                    return;
                }
                toast.error('Failed to fetch curriculum');
            }
        }
    };

    const addSection = () => {
        setSections(prev => [...prev, { 
            id: prev.length + 1, 
            title: '', 
            items: [] 
        }]);
    };

    const updateSectionTitle = (sectionId, title) => {
        setSections(prev => prev.map(section => 
            section.id === sectionId ? { ...section, title } : section
        ));
    };

    const addItem = (sectionId, type) => {
        setSections(prev => prev.map(section => {
            if (section.id === sectionId) {
                return {
                    ...section,
                    items: [...section.items, { 
                        id: section.items.length + 1, 
                        type, 
                        title: '',
                        duration: type === 'lecture' ? '00:00' : '0'
                    }]
                };
            }
            return section;
        }));
    };

    const updateItem = (sectionId, itemId, updates) => {
        setSections(prev => prev.map(section => {
            if (section.id === sectionId) {
                return {
                    ...section,
                    items: section.items.map(item => 
                        item.id === itemId ? { ...item, ...updates } : item
                    )
                };
            }
            return section;
        }));
    };

    const removeItem = (sectionId, itemId) => {
        setSections(prev => prev.map(section => {
            if (section.id === sectionId) {
                return {
                    ...section,
                    items: section.items.filter(item => item.id !== itemId)
                };
            }
            return section;
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('accessToken');
            const url = isEditMode 
                ? `http://127.0.0.1:8000/api/curriculum/${courseId}/`
                : 'http://127.0.0.1:8000/api/curriculum/';
            
            const method = isEditMode ? 'put' : 'post';
            
            const response = await axios[method](url, 
                { sections },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            toast.success('Curriculum saved successfully!');
            
            // If we're creating a new course and get a courseId in response
            const nextCourseId = isEditMode ? courseId : response.data.courseId;
            if (nextCourseId) {
                localStorage.setItem('currentCourseId', nextCourseId);
            }
            
            // Navigate to next step with courseId
            navigate(`/instructor/course-management/pricing?courseId=${nextCourseId || courseId}`);
        } catch (error) {
            console.error('Error saving curriculum:', error);
            toast.error('Failed to save curriculum');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAsDraft = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const url = isEditMode 
                ? `http://127.0.0.1:8000/api/curriculum/${courseId}/draft/`
                : 'http://127.0.0.1:8000/api/curriculum/draft/';
            
            await axios.post(url, 
                { sections },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            toast.success('Curriculum saved as draft!');
            // Clear the stored courseId when going back to course management
            localStorage.removeItem('currentCourseId');
            // Navigate back to course management
            navigate('/instructor/course-management');
        } catch (error) {
            console.error('Error saving draft:', error);
            toast.error('Failed to save draft');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full bg-[#FFEDE2]">
            <div className="w-full">
                <div className="p-8">
                    {/* Header Card */}
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 mb-8 hover:shadow-md transition-all duration-300">
                        <div className="flex items-start space-x-8">
                            <div className="flex-shrink-0">
                                <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                                    <svg className="w-8 h-8 text-[#FF7F0E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </div>
                            </div>
                            
                            <div className="flex-grow">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">Curriculum</h2>
                                        <p className="text-sm text-gray-600 mt-1">Step 3 of 7</p>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm font-medium text-gray-700">Course Setup</span>
                                            <span className="text-sm font-bold text-[#FF7F0E]">3/7 Steps</span>
                                        </div>
                                        <div className="w-40 h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-[#FF7F0E] to-[#FFA559] rounded-full transition-all duration-700" 
                                                style={{ width: '42.85%' }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Buttons */}
                        <div className="mt-6 flex space-x-4">
                            <button
                                type="button"
                                onClick={goToCourseInformation}
                                className="text-[#FF7F0E] hover:text-[#E67200] font-medium"
                            >
                                ← Back to Course Information
                            </button>
                            <button
                                type="button"
                                onClick={goToIntendedLearners}
                                className="text-[#FF7F0E] hover:text-[#E67200] font-medium"
                            >
                                Back to Intended Learners
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {sections.map((section) => (
                            <div 
                                key={section.id}
                                className={`bg-white rounded-2xl p-8 shadow-sm border border-gray-200 transition-all duration-300 
                                          hover:shadow-lg ${
                                    activeSection === section.id 
                                        ? 'ring-2 ring-[#FF7F0E] border-transparent transform scale-[1.01]' 
                                        : 'hover:border-[#FF7F0E]/30'
                                }`}
                                onClick={() => setActiveSection(section.id)}
                            >
                                <div className="mb-8">
                                    <div className="flex items-center space-x-5">
                                        <div className={`p-4 rounded-xl shadow-sm border border-gray-100 transition-all duration-300
                                                      ${activeSection === section.id 
                                                          ? 'bg-[#FF7F0E]/10 shadow-[#FF7F0E]/20' 
                                                          : 'bg-white hover:bg-[#FF7F0E]/10'
                                                      }`}>
                                            <div className="text-[#FF7F0E]">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="flex-grow">
                                            <input
                                                type="text"
                                                value={section.title}
                                                onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                                                placeholder="Enter section title"
                                                className="w-full text-xl font-bold text-gray-900 bg-transparent border-0 border-b-2 border-gray-200 
                                                         focus:ring-0 focus:border-[#FF7F0E] transition-colors duration-200
                                                         placeholder-gray-400"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {section.items.map((item) => (
                                        <div key={item.id} className="group relative bg-gray-50 p-4 rounded-xl hover:bg-gray-100 transition-all duration-200">
                                            <div className="flex items-center space-x-4">
                                                <div className={`p-2 rounded-lg ${item.type === 'lecture' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                                    {item.type === 'lecture' ? (
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <input
                                                    type="text"
                                                    value={item.title}
                                                    onChange={(e) => updateItem(section.id, item.id, { title: e.target.value })}
                                                    placeholder={`${item.type === 'lecture' ? 'Lecture' : 'Quiz'} title`}
                                                    className="flex-grow bg-transparent border-0 focus:ring-0 text-gray-700"
                                                />
                                                <input
                                                    type={item.type === 'lecture' ? 'time' : 'number'}
                                                    value={item.duration}
                                                    onChange={(e) => updateItem(section.id, item.id, { duration: e.target.value })}
                                                    className="w-24 bg-transparent border-0 focus:ring-0 text-gray-500 text-right"
                                                    placeholder={item.type === 'lecture' ? 'Duration' : 'Points'}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(section.id, item.id)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors duration-200"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 flex space-x-4">
                                    <button
                                        type="button"
                                        onClick={() => addItem(section.id, 'lecture')}
                                        className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg
                                                 transition-all duration-200 hover:scale-105
                                                 text-[#FF7F0E] hover:bg-[#FF7F0E]/5"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Add Lecture
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => addItem(section.id, 'quiz')}
                                        className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg
                                                 transition-all duration-200 hover:scale-105
                                                 text-[#FF7F0E] hover:bg-[#FF7F0E]/5"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Add Quiz
                                    </button>
                                </div>
                            </div>
                        ))}

                        <div className="flex justify-between items-center pt-8">
                            <button
                                type="button"
                                onClick={addSection}
                                className="inline-flex items-center px-6 py-3 text-[#FF7F0E] font-medium rounded-xl
                                         border-2 border-[#FF7F0E] hover:bg-[#FF7F0E]/5 transition-all duration-200"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Add New Section
                            </button>

                            <div className="flex space-x-4">
                                <button 
                                    type="button" 
                                    onClick={handleSaveAsDraft}
                                    className="px-6 py-3 border-2 border-[#FF7F0E] text-[#FF7F0E] rounded-xl
                                             hover:bg-[#FF7F0E]/5 transition-all duration-200 
                                             font-medium shadow-sm hover:shadow-md"
                                    disabled={loading}
                                >
                                    Save as Draft
                                </button>
                                <button 
                                    type="submit" 
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
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Curriculum; 