
import React from 'react';
import InstructorNavigation from './InstructorNavigation';

const InstructorSidebar = ({ activePage }) => {
    return (
        <div className="w-64 bg-[#FFEDE2] shadow-lg">
            {/* Logo Section */}
            <div className="p-4 border-b">
                <div className="flex items-center">
                    <img src="/src/assets/photos/logo.png" alt="Bona Fide" className="ml-2 h-12 w-12" />
                    <span className="ml-2 text-xl font-semibold text-[#FF7F0E]">Bona Fide</span>
                </div>
            </div>

            {/* Navigation Component */}
            <InstructorNavigation activePage={activePage} />
        </div>
    );
};

export default InstructorSidebar; 