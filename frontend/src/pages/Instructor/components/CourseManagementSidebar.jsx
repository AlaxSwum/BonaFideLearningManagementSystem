import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const CourseManagementSidebar = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const courseId = queryParams.get('courseId');

    const sidebarItems = [
        {
            title: 'Course Information',
            path: '/instructor/course-management/information',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            title: 'Intended Learners',
            path: '/instructor/course-management/intended-learners',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            )
        },
        {
            title: 'Curriculum',
            path: '/instructor/course-management/curriculum',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            )
        },
        {
            title: 'Pricing',
            path: '/instructor/course-management/pricing',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            title: 'Promotions',
            path: '/instructor/course-management/promotions',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
            )
        },
        {
            title: 'Announcements',
            path: '/instructor/course-management/announcements',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
            )
        },
        {
            title: 'Messages',
            path: '/instructor/course-management/messages',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
            )
        }
    ];

    return (
        <div className="fixed top-0 left-0 h-screen w-80 bg-gradient-to-b from-[#FFEDE2] to-[#FFF5EE] shadow-xl z-10">
            <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-[#FF7F0E]/20 scrollbar-track-transparent">
                {/* Course Creation Section */}
                <div className="p-6">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="p-3 bg-[#FF7F0E]/10 rounded-xl shadow-sm">
                            <svg className="w-6 h-6 text-[#FF7F0E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="font-semibold text-gray-900">Course Creation</h2>
                            <p className="text-sm text-gray-600">Manage your course</p>
                        </div>
                    </div>

                    {/* Navigation Items */}
                    <nav className="space-y-2">
                        {sidebarItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            const itemPath = courseId ? `${item.path}?courseId=${courseId}` : item.path;

                            return (
                                <Link
                                    key={item.title}
                                    to={itemPath}
                                    className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200
                                              ${isActive 
                                                  ? 'bg-white shadow-md transform scale-[1.02]' 
                                                  : 'text-gray-700 hover:bg-white/60 hover:shadow-sm hover:scale-[1.01]'
                                              }`}
                                >
                                    <div className={`mr-3 ${isActive ? 'text-[#FF7F0E]' : 'text-gray-400'}`}>
                                        {item.icon}
                                    </div>
                                    <span className={`text-sm font-medium ${isActive ? 'text-[#FF7F0E]' : ''}`}>
                                        {item.title}
                                    </span>
                                    {isActive && (
                                        <svg className="w-5 h-5 ml-auto text-[#FF7F0E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                        </svg>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>
        </div>
    );
};

export default CourseManagementSidebar;