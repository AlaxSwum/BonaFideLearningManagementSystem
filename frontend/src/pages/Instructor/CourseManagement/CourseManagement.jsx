import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import CourseManagementSidebar from '../components/CourseManagementSidebar';
import CourseInformation from './Sections/CourseInformation';
import IntendedLearners from './Sections/IntendedLearners';
import Curriculum from './Sections/Curriculum';
import Pricing from './Sections/Pricing';
import Promotions from './Sections/Promotions';
import Announcements from './Sections/Announcements';
import Messages from './Sections/Messages';
import { Link } from 'react-router-dom';

const CourseManagement = () => {
    const [user, setUser] = React.useState(JSON.parse(localStorage.getItem('user')));
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
    };

    return (
        <div className="flex min-h-screen bg-[#FFEDE2]">
            <CourseManagementSidebar />
            
            <div className="flex-1 ml-80">
                {/* Top Bar - Profile */}
                <div className="sticky top-0 bg-[#FFEDE2] border-b border-[#FF7F0E]/10 z-20 shadow-sm">
                    <div className="max-w-full px-8 py-4">
                        <div className="flex justify-end">
                            <div className="relative">
                                <button 
                                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                                    className="flex items-center space-x-3 focus:outline-none hover:bg-white/60 rounded-lg px-3 py-2 transition-all duration-200"
                                >
                                    <div className="relative">
                                        <img
                                            src={user?.profile_image || "/src/assets/icons/profile.svg"}
                                            alt="Profile"
                                            className="h-10 w-10 rounded-full border-2 border-[#FF7F0E]/20"
                                        />
                                        <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-400 border-2 border-white"></div>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="text-gray-700 font-medium">{user?.name || "Instructor"}</span>
                                        <svg 
                                            className={`w-4 h-4 ml-2 transform transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} 
                                            fill="none" 
                                            viewBox="0 0 24 24"
                                        >
                                            <path 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round" 
                                                strokeWidth={2} 
                                                d="M19 9l-7 7-7-7" 
                                                stroke="#FF7F0E"
                                            />
                                        </svg>
                                    </div>
                                </button>

                                {/* Profile Dropdown Menu */}
                                {showProfileMenu && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-1 z-50 border border-[#FF7F0E]/10">
                                        <Link
                                            to="/instructor/profile"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#FFEDE2] transition-colors duration-150"
                                        >
                                            Profile Settings
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[#FFEDE2] transition-colors duration-150"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="p-8 bg-[#FFEDE2]">
                    <Routes>
                        <Route index element={<Navigate to="information" replace />} />
                        <Route path="information" element={<CourseInformation />} />
                        <Route path="intended-learners" element={<IntendedLearners />} />
                        <Route path="curriculum" element={<Curriculum />} />
                        <Route path="pricing" element={<Pricing />} />
                        <Route path="promotions" element={<Promotions />} />
                        <Route path="announcements" element={<Announcements />} />
                        <Route path="messages" element={<Messages />} />
                    </Routes>
                </div>
            </div>
        </div>
    );
};

export default CourseManagement; 