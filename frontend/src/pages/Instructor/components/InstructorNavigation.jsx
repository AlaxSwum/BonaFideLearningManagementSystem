import React from 'react';
import { Link } from 'react-router-dom';

const InstructorNavigation = ({ activePage }) => {
    const navItems = [
        {
            path: '/instructor/courses',
            label: 'Courses',
            icon: '/src/assets/icons/course.svg'
        },
        {
            path: '/instructor/communications',
            label: 'Communications',
            icon: '/src/assets/icons/communication.png'
        },
        {
            path: '/instructor/payments',
            label: 'Payments',
            icon: '/src/assets/icons/payment.png'
        },
        {
            path: '/instructor/analytics',
            label: 'Analytics',
            icon: '/src/assets/icons/analytics.png'
        },
        {
            path: '/instructor/reports',
            label: 'Analytics & Reports',
            icon: '/src/assets/icons/report.png'
        },
        {
            path: '/instructor/settings',
            label: 'Settings',
            icon: '/src/assets/icons/setting.png'
        }
    ];

    return (
        <nav className="p-4">
            <div className="space-y-2">
                {navItems.map((item) => (
                    <Link 
                        key={item.path}
                        to={item.path} 
                        className={`flex items-center p-2 rounded-lg ${
                            activePage === item.label.toLowerCase() 
                                ? 'bg-white font-bold text-[#5B42B7]' 
                                : 'text-gray-700 hover:bg-white hover:text-[#5B42B7]'
                        }`}
                    >
                        <img 
                            src={item.icon} 
                            alt={item.label}
                            className="w-5 h-5 mr-3"
                        />
                        {item.label}
                    </Link>
                ))}
            </div>
        </nav>
    );
};

export default InstructorNavigation; 