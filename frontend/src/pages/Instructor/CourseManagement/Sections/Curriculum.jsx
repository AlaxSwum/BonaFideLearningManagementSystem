import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCourse } from '../../../../contexts/CourseContext';

const Curriculum = () => {
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeSection, setActiveSection] = useState(1);
    const location = useLocation();
    const navigate = useNavigate();
    const { currentCourseId } = useCourse();
    const [isAddingSectionOpen, setIsAddingSectionOpen] = useState(false);
    const [newSectionTitle, setNewSectionTitle] = useState('');
    const [expandedSections, setExpandedSections] = useState({});
    const [editingItem, setEditingItem] = useState(null);
    const [newItemTitle, setNewItemTitle] = useState('');
    const [showContentOptions, setShowContentOptions] = useState(false);
    const [isAddingLecture, setIsAddingLecture] = useState(null);
    const [newLectureTitle, setNewLectureTitle] = useState('');
    const [selectedLecture, setSelectedLecture] = useState(null);
    const [newSectionPosition, setNewSectionPosition] = useState(null);
    const [showContentModal, setShowContentModal] = useState(false);
    const [selectedSection, setSelectedSection] = useState(null);
    const [contentType, setContentType] = useState(null);
    const [isAddingContent, setIsAddingContent] = useState(null);
    const [newContentData, setNewContentData] = useState({
        title: '',
        description: '',
        videoFile: null,
        videoFileName: '',
        articleContent: '',
        fileUpload: null,
        fileName: '',
        externalLink: '',
        questions: [],
        timeLimit: 30,
        passingScore: 70
    });
    const [currentQuestion, setCurrentQuestion] = useState({
        question: '',
        options: ['', '', '', ''],
        correctOption: 0,
        explanation: ''
    });
    const [allContent, setAllContent] = useState([]);
    const [selectedLectureId, setSelectedLectureId] = useState(null);
    
    // Get courseId from URL query params or localStorage
    const queryParams = new URLSearchParams(location.search);
    const urlCourseId = queryParams.get('courseId');
    const storedCourseId = localStorage.getItem('currentCourseId');
    const courseId = urlCourseId || storedCourseId;
    const isEditMode = !!courseId;

    useEffect(() => {
        if (currentCourseId) {
            localStorage.setItem('currentCourseId', currentCourseId);
            fetchCurriculum();
        } else {
            console.error('No courseId found');
            toast.error('Course ID is missing');
        }
    }, [currentCourseId]);

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
            const response = await axios.get(`http://127.0.0.1:8000/api/courses/${courseId}/curriculum/`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.data) {
                // Initialize with empty sections if none exist
                setSections(response.data.sections || []);
            } else {
                setSections(response.data.sections);
            }
        } catch (error) {
            console.error('Error fetching curriculum:', error);
            // Initialize with empty sections array if there's an error
            setSections([]);
            if (error.response?.status !== 404) {
                toast.error('Failed to fetch curriculum');
            }
        }
    };

    const toggleSection = (sectionId) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    const handleAddSection = () => {
        if (newSectionTitle.trim()) {
            const newSection = {
                id: Date.now(),
                title: newSectionTitle,
                lectures: [],
                order: newSectionPosition !== null ? newSectionPosition + 1 : sections.length + 1
            };

            setSections(prevSections => {
                let updatedSections;
                if (newSectionPosition !== null) {
                    // Insert at specific position
                    updatedSections = [
                        ...prevSections.slice(0, newSectionPosition),
                        newSection,
                        ...prevSections.slice(newSectionPosition)
                    ];
                } else {
                    // Add to end
                    updatedSections = [...prevSections, newSection];
                }
                return updatedSections.sort((a, b) => (a.order || 0) - (b.order || 0));
            });

            setNewSectionTitle('');
            setIsAddingSectionOpen(false);
            setNewSectionPosition(null);
            setExpandedSections(prev => ({
                ...prev,
                [newSection.id]: true
            }));
        }
    };

    const handleAddLecture = (sectionId) => {
        if (newLectureTitle.trim()) {
            const newLecture = {
                id: Date.now(),
                title: newLectureTitle,
                content: [],
                order: sections.find(s => s.id === sectionId).lectures.length + 1
            };
            
            setSections(prevSections => 
                prevSections.map(section => 
                    section.id === sectionId 
                        ? { ...section, lectures: [...section.lectures, newLecture] }
                        : section
                )
            );
            
            setNewLectureTitle('');
            setIsAddingLecture(null);
            toast.success('Lecture added successfully!');
        }
    };

    const handleAddContent = (sectionId, lectureId, type) => {
        setIsAddingContent({ sectionId, lectureId, type });
        setNewContentData({
            title: '',
            description: '',
            videoFile: null,
            videoFileName: '',
            articleContent: '',
            fileUpload: null,
            fileName: '',
            externalLink: '',
            questions: [],
            timeLimit: 30,
            passingScore: 70
        });
    };

    const handleAddItem = (sectionId, type) => {
        setEditingItem({
            sectionId,
            id: Date.now(),
            type,
            isNew: true
        });
        setNewItemTitle('');
    };

    const handleSaveItem = () => {
        if (newItemTitle.trim() && editingItem) {
            const newItem = {
                id: editingItem.id,
                type: editingItem.type,
                title: newItemTitle,
                content: ''
            };
            
            setSections(sections.map(section => 
                section.id === editingItem.sectionId
                    ? { ...section, items: [...section.items, newItem] }
                    : section
            ));
            
            setEditingItem(null);
            setNewItemTitle('');
        }
    };

    const handleContentClick = (type) => {
        setContentType(type);
        setShowContentModal(false);
        setIsAddingContent(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('accessToken');
            const url = `http://127.0.0.1:8000/api/courses/${courseId}/curriculum/`;
            
            const method = 'put';
            
            const response = await axios[method](url, 
                { sections },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            toast.success('Curriculum saved successfully!');
            
            // Navigate to next step with courseId
            navigate(`/instructor/course-management/pricing?courseId=${courseId}`);
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
            const url = `http://127.0.0.1:8000/api/courses/${courseId}/curriculum/draft/`;
            
            await axios.post(url, 
                { sections },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            toast.success('Curriculum saved as draft!');
            localStorage.removeItem('currentCourseId');
            navigate('/instructor/courses');
        } catch (error) {
            console.error('Error saving draft:', error);
            toast.error('Failed to save draft');
        } finally {
            setLoading(false);
        }
    };

    const handleContentTypeSelect = (type) => {
        setContentType(type);
        setShowContentOptions(false);
        setIsAddingContent(true);
    };

    // Function to handle video upload to Vimeo
    const handleVideoUpload = async (file) => {
        try {
            // Upload to Vimeo using their API
            const formData = new FormData();
            formData.append('video', file);
            
            const response = await axios.post('/api/videos/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            return response.data.vimeo_url;
        } catch (error) {
            console.error('Error uploading to Vimeo:', error);
            toast.error('Failed to upload video');
        }
    };

    // Function to handle resource upload to OneDrive
    const handleResourceUpload = async (file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await axios.post('/api/resources/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            return response.data.onedrive_url;
        } catch (error) {
            console.error('Error uploading to OneDrive:', error);
            toast.error('Failed to upload resource');
        }
    };

    // Modified handleSaveContent function
    const handleSaveContent = async () => {
        try {
            let contentUrl = '';
            
            // Handle different content types
            if (isAddingContent.type === 'lecture' && newContentData.videoFile) {
                contentUrl = await handleVideoUpload(newContentData.videoFile);
            } else if (isAddingContent.type === 'file' && newContentData.fileUpload) {
                contentUrl = await handleResourceUpload(newContentData.fileUpload);
            }

            const payload = {
                title: newContentData.title,
                description: newContentData.description,
                type: isAddingContent.type,
                section_id: selectedSection,
                lecture_id: selectedLecture,
                content_url: contentUrl,
                external_link: newContentData.externalLink,
                article_content: newContentData.articleContent
            };

            const response = await axios.post('/api/content', payload);
            
            // Update local state with new content
            setSections(prevSections => 
                prevSections.map(section => {
                    if (section.id === selectedSection) {
                        if (selectedLecture) {
                            return {
                                ...section,
                                lectures: section.lectures.map(lecture => {
                                    if (lecture.id === selectedLecture) {
                                        return {
                                            ...lecture,
                                            content: [...(lecture.content || []), response.data]
                                        };
                                    }
                                    return lecture;
                                })
                            };
                        } else {
                            return {
                                ...section,
                                lectures: [...section.lectures, response.data]
                            };
                        }
                    }
                    return section;
                })
            );

            toast.success('Content added successfully!');
            resetForm();
        } catch (error) {
            console.error('Error saving content:', error);
            toast.error('Failed to save content');
        }
    };

    const resetContentStates = () => {
        setShowContentOptions(false);
        setIsAddingContent(null);
        setContentType(null);
        setNewContentData({
            title: '',
            description: '',
            videoFile: null,
            videoFileName: '',
            articleContent: '',
            fileUpload: null,
            fileName: '',
            externalLink: '',
            questions: [],
            timeLimit: 30,
            passingScore: 70
        });
    };

    // Add this useEffect to monitor sections changes
    useEffect(() => {
        console.log('Updated sections:', sections);
    }, [sections]);

    useEffect(() => {
        console.log('Content Modal State:', {
            showContentModal,
            selectedLecture,
            selectedSection,
            contentType,
            isAddingContent
        });
    }, [showContentModal, selectedLecture, selectedSection, contentType, isAddingContent]);

    useEffect(() => {
        console.log('Modal State:', {
            showContentModal,
            selectedLecture,
            selectedSection,
            isAddingContent
        });
    }, [showContentModal, selectedLecture, selectedSection, isAddingContent]);

    const handleAddQuestion = () => {
        if (currentQuestion.question.trim() && 
            currentQuestion.options.every(opt => opt.trim()) && 
            currentQuestion.explanation.trim()) {
            
            setNewContentData(prev => ({
                ...prev,
                questions: [...prev.questions, { ...currentQuestion }]
            }));

            // Reset current question form
            setCurrentQuestion({
                question: '',
                options: ['', '', '', ''],
                correctOption: 0,
                explanation: ''
            });
        } else {
            toast.error('Please fill in all fields for the question');
        }
    };

    const handleOptionChange = (index, value) => {
        setCurrentQuestion(prev => ({
            ...prev,
            options: prev.options.map((opt, i) => i === index ? value : opt)
        }));
    };

    const handleCreateQuiz = () => {
        if (!newContentData.title.trim() || !newContentData.description.trim()) {
            toast.error('Please fill in both title and description');
            return;
        }

        // Navigate to quiz creation page with initial data
        navigate('/instructor/course-management/quiz-creation', {
            state: {
                quizData: {
                    title: newContentData.title,
                    description: newContentData.description,
                    sectionId: selectedSection,
                    lectureId: selectedLecture
                }
            }
        });
        
        // Close the current modal
        setIsAddingContent(null);
    };

    return (
        <div className="w-full bg-[#FFEDE2]">
            <div className="w-full">
                <div className="p-8">
                    {/* Header Card */}
                    <div className="mb-8">
                        <div className="flex items-start space-x-8">
                            <div className="flex-shrink-0">
                                <div className="p-4 bg-[#8E56FF]/10 rounded-xl">
                                    <svg className="w-8 h-8 text-[#8E56FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                                            <span className="text-sm font-bold text-[#8E56FF]">3/7 Steps</span>
                                        </div>
                                        <div className="w-40 h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-[#8E56FF] to-[#A881FF] rounded-full transition-all duration-700" 
                                                style={{ width: '42.85%' }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-gray-900">Course Content</h3>
                        </div>

                        <div className="min-h-[400px] space-y-4">
                            {/* New Section Form */}
                            {isAddingSectionOpen && (
                                <div className="bg-white rounded-xl p-6 border-2 border-[#8E56FF] shadow-lg">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <div className="p-2 bg-[#8E56FF]/10 rounded-lg">
                                            <svg className="w-5 h-5 text-[#8E56FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                            </svg>
                                        </div>
                                        <h4 className="text-lg font-medium text-gray-900">New Section</h4>
                                    </div>
                                    <input
                                        type="text"
                                        value={newSectionTitle}
                                        onChange={(e) => setNewSectionTitle(e.target.value)}
                                        placeholder="Enter a title for your section..."
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg
                                                focus:border-[#8E56FF] focus:ring-0 outline-none"
                                        autoFocus
                                    />
                                    <div className="flex justify-end space-x-3 mt-4">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsAddingSectionOpen(false);
                                                setNewSectionTitle('');
                                                setNewSectionPosition(null);
                                            }}
                                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg
                                                    transition-all duration-200"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleAddSection}
                                            className="px-4 py-2 bg-[#8E56FF] text-white rounded-lg
                                                    hover:bg-[#7B48E5] transition-all duration-200"
                                        >
                                            Add Section
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Add Section Button */}
                            {!isAddingSectionOpen && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAddingSectionOpen(true);
                                        setNewSectionPosition(sections.length);
                                    }}
                                    className="w-full py-3 text-sm text-[#8E56FF] hover:bg-[#8E56FF]/5 
                                            transition-all duration-200 flex items-center justify-center
                                            border-2 border-dashed border-[#8E56FF]/30 rounded-xl"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Add new section
                                </button>
                            )}

                            {sections.map((section, index) => (
                                <React.Fragment key={section.id}>
                                    {/* Section Content */}
                                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                                        {/* Section Header */}
                                        <div
                                            onClick={() => toggleSection(section.id)}
                                            className="flex items-center justify-between p-6 cursor-pointer 
                                                     hover:bg-[#8E56FF]/5 transition-all duration-200"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <svg
                                                    className={`w-5 h-5 text-[#8E56FF] transform transition-transform ${
                                                        expandedSections[section.id] ? 'rotate-90' : ''
                                                    }`}
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                                </svg>
                                                <span className="text-sm text-gray-500 font-medium">Section {section.order}:</span>
                                                <h3 className="text-lg font-medium text-gray-900">{section.title}</h3>
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {section.lectures.length} {section.lectures.length === 1 ? 'lecture' : 'lectures'}
                                            </div>
                                        </div>

                                        {expandedSections[section.id] && (
                                            <div className="border-t border-[#8E56FF]/10 p-6 space-y-4">
                                                {/* Lecture List */}
                                                <div className="space-y-4">
                                                    {section.lectures.map((lecture) => (
                                                        <div key={lecture.id} className="bg-white rounded-lg border border-gray-200 hover:border-[#8E56FF]/30 transition-all duration-200">
                                                            <div className="p-4">
                                                                {/* Lecture Header */}
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center space-x-3">
                                                                        <div className="p-2 bg-blue-100 rounded-lg">
                                                                            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                                                                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                                            </svg>
                                                                        </div>
                                                                        <span className="font-medium text-gray-900">{lecture.title}</span>
                                                                    </div>
                                                                    
                                                                    {/* Add Article Button (only in lectures) */}
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setSelectedLecture(lecture.id);
                                                                            setSelectedSection(section.id);
                                                                            setShowContentModal(true);
                                                                        }}
                                                                        className="px-4 py-2 text-sm text-[#8E56FF] hover:bg-[#8E56FF]/5 
                                                                                rounded-lg transition-all duration-200 flex items-center"
                                                                    >
                                                                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                                        </svg>
                                                                        Add Resources
                                                                    </button>
                                                                </div>

                                                                {/* Content List (Tree Structure) */}
                                                                {lecture.content && lecture.content.length > 0 && (
                                                                    <div className="mt-4 pl-8 border-l-2 border-[#8E56FF]/10">
                                                                        {lecture.content.map((item) => (
                                                                            <div 
                                                                                key={item.id} 
                                                                                className="relative ml-4 mb-3 last:mb-0 before:content-[''] before:absolute before:left-[-25px] 
                                                                                         before:top-[15px] before:w-4 before:h-[2px] before:bg-[#8E56FF]/10"
                                                                            >
                                                                                <div className="flex items-center justify-between bg-gray-50 
                                                                                            hover:bg-gray-100 rounded-xl p-4 transition-all duration-200">
                                                                                    <div className="flex items-center space-x-4">
                                                                                        <div className={`p-2 rounded-lg ${
                                                                                            item.type === 'lecture' ? 'bg-blue-100' :
                                                                                            item.type === 'quiz' ? 'bg-green-100' : 'bg-purple-100'
                                                                                        }`}>
                                                                                            <svg className={`w-5 h-5 ${
                                                                                                item.type === 'lecture' ? 'text-blue-600' :
                                                                                                item.type === 'quiz' ? 'text-green-600' : 'text-purple-600'
                                                                                            }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                                {item.type === 'lecture' && (
                                                                                                    <path 
                                                                                                        strokeLinecap="round" 
                                                                                                        strokeLinejoin="round" 
                                                                                                        strokeWidth="2" 
                                                                                                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" 
                                                                                                    />
                                                                                                )}
                                                                                                {item.type === 'quiz' && (
                                                                                                    <path 
                                                                                                        strokeLinecap="round" 
                                                                                                        strokeLinejoin="round" 
                                                                                                        strokeWidth="2" 
                                                                                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                                                                                                    />
                                                                                                )}
                                                                                                {item.type === 'article' && (
                                                                                                    <path 
                                                                                                        strokeLinecap="round" 
                                                                                                        strokeLinejoin="round" 
                                                                                                        strokeWidth="2" 
                                                                                                        d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" 
                                                                                                    />
                                                                                                )}
                                                                                            </svg>
                                                                                        </div>
                                                                                        
                                                                                        <div>
                                                                                            <h4 className="font-medium text-gray-900">{item.title}</h4>
                                                                                            {item.description && (
                                                                                                <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                    
                                                                                    <div className="flex items-center space-x-2">
                                                                                        <button 
                                                                                            onClick={() => handleEditContent(item.id)}
                                                                                            className="p-2 text-gray-400 hover:text-[#8E56FF] rounded-lg
                                                                                                    hover:bg-[#8E56FF]/5 transition-all duration-200"
                                                                                        >
                                                                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                                                                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                                            </svg>
                                                                                        </button>
                                                                                        <button 
                                                                                            onClick={() => handleDeleteContent(item.id)}
                                                                                            className="p-2 text-gray-400 hover:text-red-500 rounded-lg
                                                                                                    hover:bg-red-50 transition-all duration-200"
                                                                                        >
                                                                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                                                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                                            </svg>
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Add Content Button (only in sections) */}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedSection(section.id);
                                                        setSelectedLecture(null); // Important: clear selected lecture
                                                        setShowContentModal(true);
                                                    }}
                                                    className="w-full py-3 text-sm text-[#8E56FF] hover:bg-[#8E56FF]/5 
                                                            border-2 border-dashed border-[#8E56FF]/30 rounded-xl
                                                            transition-all duration-200 flex items-center justify-center"
                                                >
                                                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                    </svg>
                                                    Add Content
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Add Section Button between sections */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsAddingSectionOpen(true);
                                            setNewSectionPosition(index + 1);
                                        }}
                                        className="w-full py-3 text-sm text-[#8E56FF] hover:bg-[#8E56FF]/5 
                                                transition-all duration-200 flex items-center justify-center
                                                border-2 border-dashed border-[#8E56FF]/30 rounded-xl"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Add new section
                                    </button>
                                </React.Fragment>
                            ))}
                        </div>

                        <div className="flex justify-end space-x-4 mt-8">
                            <button 
                                type="button" 
                                onClick={() => navigate('/instructor/dashboard')}
                                className="px-6 py-3 border-2 border-[#8E56FF] text-[#8E56FF] rounded-xl
                                        hover:bg-[#8E56FF]/5 transition-all duration-300 
                                        font-medium"
                            >
                                Back
                            </button>
                            <button 
                                type="submit" 
                                className="px-6 py-3 bg-gradient-to-r from-[#8E56FF] to-[#6A36FF] text-white 
                                        rounded-xl hover:from-[#7B48E5] hover:to-[#5925FF] transition-all duration-300
                                        font-medium"
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Content Type Selection Modal */}
            {showContentModal && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
                    onClick={() => setShowContentModal(false)}
                >
                    <div 
                        className="bg-white rounded-xl p-6 w-[800px] max-h-[90vh] overflow-y-auto" 
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-semibold text-[#8E56FF]">
                                {selectedLecture ? 'Add Resources' : 'Add Content'}
                            </h3>
                            <button 
                                onClick={() => setShowContentModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className={`grid ${selectedLecture ? 'grid-cols-2' : 'grid-cols-3'} gap-4`}>
                            {selectedLecture ? (
                                // Show only Attachment and External Link options when adding to a lecture
                                <>
                                    <button
                                        onClick={() => {
                                            setIsAddingContent({
                                                type: 'file',
                                                sectionId: selectedSection,
                                                lectureId: selectedLecture
                                            });
                                            setContentType('file');
                                            setShowContentModal(false);
                                        }}
                                        className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 
                                                 rounded-xl hover:border-[#8E56FF] hover:bg-[#8E56FF]/5 transition-all duration-200"
                                    >
                                        <svg className="w-8 h-8 text-[#8E56FF] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                        </svg>
                                        <span className="text-gray-900 font-medium">Attachment</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            setIsAddingContent({
                                                type: 'link',
                                                sectionId: selectedSection,
                                                lectureId: selectedLecture
                                            });
                                            setContentType('link');
                                            setShowContentModal(false);
                                        }}
                                        className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 
                                                 rounded-xl hover:border-[#8E56FF] hover:bg-[#8E56FF]/5 transition-all duration-200"
                                    >
                                        <svg className="w-8 h-8 text-[#8E56FF] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                        </svg>
                                        <span className="text-gray-900 font-medium">External Link</span>
                                    </button>
                                </>
                            ) : (
                                // Show original content options for sections
                                ['lecture', 'quiz', 'article'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => {
                                            setIsAddingContent({
                                                type,
                                                sectionId: selectedSection
                                            });
                                            setContentType(type);
                                            setShowContentModal(false);
                                        }}
                                        className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 
                                                 rounded-xl hover:border-[#8E56FF] hover:bg-[#8E56FF]/5 transition-all duration-200"
                                    >
                                        <svg className="w-8 h-8 text-[#8E56FF] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            {type === 'lecture' && (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            )}
                                            {type === 'quiz' && (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            )}
                                            {type === 'article' && (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" />
                                            )}
                                        </svg>
                                        <span className="text-gray-900 font-medium">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Add this right after the content type selection modal in your JSX */}
            {isAddingContent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
                    <div className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-semibold">
                                Add {isAddingContent.type?.charAt(0).toUpperCase() + isAddingContent.type?.slice(1)}
                            </h3>
                            <button
                                onClick={() => setIsAddingContent(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Common fields */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={newContentData.title}
                                    onChange={(e) => setNewContentData({...newContentData, title: e.target.value})}
                                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#8E56FF]"
                                    placeholder="Enter title"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={newContentData.description}
                                    onChange={(e) => setNewContentData({...newContentData, description: e.target.value})}
                                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#8E56FF]"
                                    rows="3"
                                    placeholder="Enter description"
                                />
                            </div>

                            {/* Article specific fields */}
                            {isAddingContent.type === 'article' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                                    <textarea
                                        value={newContentData.articleContent}
                                        onChange={(e) => setNewContentData({...newContentData, articleContent: e.target.value})}
                                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#8E56FF]"
                                        rows="6"
                                        placeholder="Write your article content"
                                    />
                                </div>
                            )}

                            {/* Lecture specific fields */}
                            {isAddingContent.type === 'lecture' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Upload Video</label>
                                    <input
                                        type="file"
                                        accept="video/*"
                                        onChange={(e) => setNewContentData({
                                            ...newContentData,
                                            videoFile: e.target.files[0],
                                            videoFileName: e.target.files[0]?.name
                                        })}
                                        className="w-full"
                                    />
                                </div>
                            )}

                            {/* Quiz specific fields */}
                            {isAddingContent && isAddingContent.type === 'quiz' && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
                                    <div className="bg-white rounded-xl p-8 max-w-2xl w-full">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-xl font-semibold">Add Quiz</h3>
                                            <button
                                                onClick={() => setIsAddingContent(null)}
                                                className="text-gray-500 hover:text-gray-700"
                                            >
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>

                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Quiz Title</label>
                                                <input
                                                    type="text"
                                                    value={newContentData.title}
                                                    onChange={(e) => setNewContentData({...newContentData, title: e.target.value})}
                                                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#8E56FF]"
                                                    placeholder="Enter quiz title"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                                <textarea
                                                    value={newContentData.description}
                                                    onChange={(e) => setNewContentData({...newContentData, description: e.target.value})}
                                                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#8E56FF]"
                                                    rows="3"
                                                    placeholder="Enter quiz description"
                                                />
                                            </div>

                                            <div className="flex justify-end space-x-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsAddingContent(null)}
                                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleCreateQuiz}
                                                    className="px-4 py-2 bg-[#8E56FF] text-white rounded-lg hover:bg-[#7B48E5]"
                                                >
                                                    Create Quiz
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* File upload fields */}
                            {isAddingContent.type === 'file' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Upload File</label>
                                    <input
                                        type="file"
                                        onChange={(e) => setNewContentData({
                                            ...newContentData,
                                            fileUpload: e.target.files[0],
                                            fileName: e.target.files[0]?.name
                                        })}
                                        className="w-full"
                                    />
                                </div>
                            )}

                            {/* External link fields */}
                            {isAddingContent.type === 'link' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">External Link</label>
                                    <input
                                        type="url"
                                        value={newContentData.externalLink}
                                        onChange={(e) => setNewContentData({...newContentData, externalLink: e.target.value})}
                                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#8E56FF]"
                                        placeholder="Enter URL (e.g., https://example.com)"
                                    />
                                </div>
                            )}

                            <div className="flex justify-end space-x-3 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsAddingContent(null)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveContent}
                                    className="px-4 py-2 bg-[#8E56FF] text-white rounded-lg hover:bg-[#7B48E5]"
                                >
                                    Add Content
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Curriculum;