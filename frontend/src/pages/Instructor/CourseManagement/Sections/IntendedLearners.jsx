import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useLocation, useNavigate } from 'react-router-dom';

const IntendedLearners = () => {
    const [formData, setFormData] = useState({
        target_audience: [''],
        skills_needed: [''],
        learning_outcomes: [''],
        career_goals: [''],
        participation_encouragement: ['']
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [activeSection, setActiveSection] = useState('learning_outcomes');
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const courseId = queryParams.get('courseId');
    const navigate = useNavigate();

    useEffect(() => {
        if (courseId) {
            fetchIntendedLearners();
        }
    }, [courseId]);

    useEffect(() => {
        if (!courseId) {
            console.error('No courseId found in URL');
            toast.error('Course ID is missing');
        }
    }, [courseId]);

    const fetchIntendedLearners = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await axios.get(`http://localhost:8000/api/courses/${courseId}/intended-learners/`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            console.log('Raw fetched data:', response.data);

            if (response.data) {
                const processData = (field) => {
                    if (!field) return [''];
                    // Handle JSON array data
                    if (typeof field === 'string') {
                        try {
                            // Try to parse if it's a JSON string
                            const parsed = JSON.parse(field);
                            return Array.isArray(parsed) && parsed.length > 0 ? parsed : [''];
                        } catch {
                            // If not JSON, return as single item array
                            return [field];
                        }
                    }
                    // If already an array, return it
                    return Array.isArray(field) && field.length > 0 ? field : [''];
                };

                const newFormData = {
                    target_audience: processData(response.data.target_audience),
                    skills_needed: processData(response.data.skills_needed),
                    learning_outcomes: processData(response.data.learning_outcomes),
                    career_goals: processData(response.data.career_goals),
                    participation_encouragement: processData(response.data.participation_knowledge)
                };

                console.log('Setting form data to:', newFormData);
                setFormData(newFormData);
            }
        } catch (error) {
            console.error('Error fetching intended learners:', error);
            console.log('Error response:', error.response?.data);
            toast.error('Failed to load intended learners data');
        }
    };

    const handleInputChange = (section, index, value) => {
        setFormData(prev => ({
            ...prev,
            [section]: prev[section].map((item, i) => i === index ? value : item)
        }));
        setError(null);
    };

    const addField = (section) => {
        setFormData(prev => ({
            ...prev,
            [section]: [...prev[section], '']
        }));
    };

    const removeField = (section, index) => {
        if (formData[section].length > 1) {
            setFormData(prev => ({
                ...prev,
                [section]: prev[section].filter((_, i) => i !== index)
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const token = localStorage.getItem('accessToken');
            
            const cleanedFormData = {
                target_audience: formData.target_audience.filter(item => item.trim() !== ''),
                skills_needed: formData.skills_needed.filter(item => item.trim() !== ''),
                learning_outcomes: formData.learning_outcomes.filter(item => item.trim() !== ''),
                career_goals: formData.career_goals.filter(item => item.trim() !== ''),
                participation_knowledge: formData.participation_encouragement.filter(item => item.trim() !== '')
            };

            console.log('Sending data:', cleanedFormData);

            const response = await axios({
                method: 'post',
                url: `http://localhost:8000/api/courses/${courseId}/intended-learners/`,
                data: cleanedFormData,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data) {
                toast.success('Intended learners information saved successfully!');
                setSuccess(true);
                await fetchIntendedLearners();
            }
        } catch (error) {
            console.error('Error saving intended learners:', error.response || error);
            const errorMessage = error.response?.data?.message || 'Failed to save intended learners information';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        navigate('/instructor/courses');
    };

    const renderSection = (title, section, placeholder, description, icon) => {
        console.log(`Rendering section ${section} with values:`, formData[section]);
        return (
            <div 
                className={`bg-white rounded-2xl p-8 shadow-sm border border-gray-200 transition-all duration-300 
                           hover:shadow-lg ${
                    activeSection === section 
                        ? 'ring-2 ring-[#FF7F0E] border-transparent transform scale-[1.01]' 
                        : 'hover:border-[#FF7F0E]/30'
                }`}
                onClick={() => setActiveSection(section)}
            >
                <div className="mb-8">
                    <div className="flex items-center space-x-5">
                        <div className={`p-4 rounded-xl shadow-sm border border-gray-100 transition-all duration-300
                                      ${activeSection === section 
                                          ? 'bg-[#FF7F0E]/10 shadow-[#FF7F0E]/20' 
                                          : 'bg-white hover:bg-[#FF7F0E]/10'
                                      }`}>
                            <div className="text-[#FF7F0E]">
                                {icon}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                            <p className="text-sm text-gray-600 mt-2 leading-relaxed max-w-2xl">{description}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {formData[section].map((value, index) => {
                        console.log(`Rendering input ${index} for ${section} with value:`, value);
                        return (
                            <div key={index} className="group relative">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center justify-center">
                                    <div className={`w-7 h-7 rounded-full transition-all duration-300 flex items-center justify-center
                                                  ${activeSection === section 
                                                      ? 'bg-[#FF7F0E] text-white' 
                                                      : 'bg-[#FF7F0E]/10 text-[#FF7F0E]'
                                                  }`}>
                                        <span className="text-sm font-semibold">{index + 1}</span>
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    value={value || ''}
                                    onChange={(e) => handleInputChange(section, index, e.target.value)}
                                    className={`w-full pl-16 pr-12 py-4 border-2 rounded-xl bg-white
                                             transition-all duration-200 text-gray-700 placeholder-gray-400
                                             focus:ring-2 focus:ring-[#FF7F0E]/20 focus:border-[#FF7F0E]
                                             group-hover:border-[#FF7F0E]/30`}
                                    placeholder={placeholder}
                                    maxLength={160}
                                />
                                {formData[section].length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeField(section, index)}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 
                                                 text-gray-400 hover:text-red-500 transition-all duration-200
                                                 opacity-0 group-hover:opacity-100 focus:opacity-100
                                                 hover:scale-110"
                                    >
                                        <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                            <path d="M6 18L18 6M6 6l12 12"></path>
                                        </svg>
                                    </button>
                                )}
                                <div className="absolute right-14 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                                    {value.length}/160
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-6 flex justify-between items-center">
                    <button
                        type="button"
                        onClick={() => addField(section)}
                        className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-lg
                                 transition-all duration-200 hover:scale-105
                                 text-[#FF7F0E] hover:bg-[#FF7F0E]/5"
                    >
                        <svg className="h-5 w-5 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M12 4v16m8-8H4"></path>
                        </svg>
                        Add another item
                    </button>
                    <div className="text-sm font-medium text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                        {formData[section].length} item{formData[section].length !== 1 ? 's' : ''}
                    </div>
                </div>
            </div>
        );
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
                                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                            </div>
                            
                            <div className="flex-grow">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">Intended Learners</h2>
                                        <p className="text-sm text-gray-600 mt-1">Step 2 of 7</p>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm font-medium text-gray-700">Course Setup</span>
                                            <span className="text-sm font-bold text-[#FF7F0E]">2/7 Steps</span>
                                        </div>
                                        <div className="w-40 h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-[#FF7F0E] to-[#FFA559] rounded-full transition-all duration-700" 
                                                style={{ width: '28.57%' }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {renderSection(
                            "Learning Objectives",
                            "learning_outcomes",
                            "Example: Define the roles and responsibilities of a project manager",
                            "Add at least 4 learning objectives or outcomes that learners will achieve",
                            <svg className="w-5 h-5 text-[#5B42B7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                        )}

                        {renderSection(
                            "Prerequisites",
                            "skills_needed",
                            "Example: No programming experience needed. You will learn everything you need to know",
                            "List required skills, experience, tools or equipment needed",
                            <svg className="w-5 h-5 text-[#5B42B7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                        )}

                        {renderSection(
                            "Target Students",
                            "target_audience",
                            "Example: Beginner Python developers curious about data science",
                            "Describe who this course is designed for",
                            <svg className="w-5 h-5 text-[#5B42B7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        )}

                        {renderSection(
                            "Career Opportunities",
                            "career_goals",
                            "Example: Apply for junior developer positions with confidence",
                            "List potential career paths and opportunities this course enables",
                            <svg className="w-5 h-5 text-[#5B42B7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        )}

                        {renderSection(
                            "Engagement Strategy",
                            "participation_encouragement",
                            "Example: Weekly live coding sessions and project reviews",
                            "Describe how you'll keep students engaged and motivated",
                            <svg className="w-5 h-5 text-[#5B42B7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                        )}

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
                    </form>
                </div>
            </div>
        </div>
    );
};

export default IntendedLearners; 