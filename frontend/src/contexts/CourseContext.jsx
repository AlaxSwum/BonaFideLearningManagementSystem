import React, { createContext, useContext, useState } from 'react';

const CourseContext = createContext();

export const CourseProvider = ({ children }) => {
    const [currentCourseId, setCurrentCourseId] = useState(null);
    const [courseData, setCourseData] = useState(null);

    const value = {
        currentCourseId,
        setCurrentCourseId,
        courseData,
        setCourseData
    };

    return (
        <CourseContext.Provider value={value}>
            {children}
        </CourseContext.Provider>
    );
};

export const useCourse = () => {
    const context = useContext(CourseContext);
    if (!context) {
        throw new Error('useCourse must be used within a CourseProvider');
    }
    return context;
}; 