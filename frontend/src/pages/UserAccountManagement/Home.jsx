import React from 'react';
import { Link } from 'react-router-dom';
import { useCountUp } from '../../hooks/useCountUp';
// import logo from '../../assets/logo.png'; // Uncomment and update path when logo is available

const Home = () => {
    const courses = [
        {
            id: 1,
            title: "Fundamental Drawing Class",
            instructor: "Instructor War Pu",
            lessons: "20 Lesson",
            rating: 4.8,
            reviews: "33,400",
            price: "100,000 MMK",
            image: "../../src/assets/photos/Fundamental.jpg",
            startDate: "2.DEC.2023",
            duration: "2 MONTHS",
            time: "8:00 PM",
            days: "SAT, SUN"
        },
        {
            id: 2,
            title: "Portrait Drawing Class",
            instructor: "Thin Yati Hsu",
            lessons: "20 Lesson",
            rating: 4.8,
            reviews: "44,500",
            price: "80,000 MMK",
            image: "/path-to-image.jpg",
            startDate: "17 August 2024",
            duration: "8 weeks",
            time: "8:00 PM",
            days: "Sat & Sun"
        },
        {
            id: 3,
            title: "Java Programming Class",
            instructor: "Swum Pyae Sone",
            lessons: "20 Lesson",
            rating: 4.8,
            reviews: "2.4k Reviews",
            price: "150,000 MMK",
            image: "/path-to-image.jpg",
            startDate: "10. 1. 2023",
            duration: "6 months",
            time: "7 p.m - 8:30 p.m",
            days: "Tuesday & Wednesday"
        }
    ];

    const stats = [
        { number: 500, label: "Student", suffix: " +" },
        { number: 40, label: "Classes", suffix: " +" },
        { number: 30, label: "Instructor", suffix: "+" },
        { number: 99, label: "Success Rate", suffix: "%" }
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Top Navigation */}
            <nav className="bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo and Search */}
                        <div className="flex items-center space-x-4 flex-1">
                            <Link to="/" className="text-2xl font-bold shrink-0">Logo</Link>
                            <div className="relative hidden md:block w-full max-w-[500px]">
                                <input
                                    type="search"
                                    placeholder="Search"
                                    className="w-full pl-10 pr-4 py-2 border rounded-full bg-gray-50"
                                />
                                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Links */}
                        <div className="hidden md:flex items-center space-x-6">
                            <Link to="/" className="text-gray-700 hover:text-[#FF7F0E] bg-[#FFF5F0] px-4 py-2 rounded-full">Home</Link>
                            <Link to="/my-learning" className="text-gray-700">My Learning</Link>
                            <Link to="/about-us" className="text-gray-700">About Us</Link>
                            <Link to="/blogs" className="text-gray-700">Blogs</Link>
                            <Link to="/signin" className="text-gray-700">Sign In</Link>
                            <Link to="/register" className="bg-[#FF7F0E] text-white px-6 py-2 rounded-full hover:bg-[#E67200] transition-colors">
                                Register
                            </Link>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden">
                            <button className="p-2 text-gray-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Category Navigation */}
            <div className="bg-[#8E56FF] text-white py-3 overflow-x-auto">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-start md:justify-center space-x-8 min-w-max md:min-w-0">
                        {["Business", "IT", "Art and Creation", "Health & Fitness", "Music", 
                          "Personal Development", "Media & Production", "Office Productivity"].map((category) => (
                            <Link 
                                key={category}
                                to={`/${category.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                                className="hover:text-gray-200 transition-colors whitespace-nowrap text-sm md:text-base"
                            >
                                {category}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Hero Section */}
            <div className="relative bg-white py-12 md:py-20">
                {/* Decorative Elements - Hide on mobile */}
                <div className="hidden md:block">
                    <div className="absolute left-10 top-10">
                        <div className="text-[#8E56FF] text-4xl">*</div>
                    </div>
                    <div className="absolute right-10 top-10">
                        <div className="text-yellow-400 text-4xl">*</div>
                    </div>
                    <div className="absolute left-20 bottom-20">
                        <div className="grid grid-cols-5 gap-1">
                            {[...Array(25)].map((_, i) => (
                                <div key={i} className="w-1 h-1 bg-blue-600 rounded-full"></div>
                            ))}
                        </div>
                    </div>
                    <div className="absolute right-20 bottom-20">
                        <div className="grid grid-cols-5 gap-1">
                            {[...Array(25)].map((_, i) => (
                                <div key={i} className="w-1 h-1 bg-gray-200 rounded-full"></div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-4xl mx-auto text-center px-4">
                    <h1 className="text-4xl md:text-6xl font-bold mb-4">
                        <span className="text-[#1E1E1E]">Unlocking </span>
                        <span className="text-[#FF7F0E]">Potential</span>
                        <span className="text-[#1E1E1E]">,</span>
                    </h1>
                    <h2 className="text-4xl md:text-6xl font-bold mb-8">
                        <span className="text-[#1E1E1E]">Inspiring </span>
                        <span className="text-[#FF7F0E]">Brilliance</span>
                    </h2>
                    <p className="text-gray-600 text-base md:text-lg mb-8 max-w-2xl mx-auto px-4">
                        At <span className="text-[#FF7F0E]">Bona Fide Facilitators</span>, we are dedicated to guiding students on their true path, 
                        empowering them with the tools, knowledge, and confidence to achieve greatness. Together, we create a future where 
                        every learner shines.
                    </p>
                    <button className="bg-[#FF7F0E] text-white px-6 md:px-8 py-3 rounded-full hover:bg-[#E67200] transition-colors">
                        Get Started
                    </button>
                </div>
            </div>

            {/* Stats Section */}
            <div className="bg-white py-20 md:py-24">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="bg-[#FFF5F0] rounded-[40px] shadow-2xl p-12 md:p-16 
                                  transform hover:scale-[1.02] transition-all duration-700 ease-out
                                  hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]
                                  relative overflow-hidden">
                        {/* Background Animation */}
                        <div className="absolute inset-0 opacity-50">
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent 
                                          animate-shimmer"></div>
                        </div>

                        <h2 className="text-[#1E1E1E] text-4xl md:text-5xl font-bold text-center mb-16
                                     animate-fadeIn relative">
                            Celebrating Our Journey of Excellence
                            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 
                                          w-24 h-1 bg-[#FF7F0E] rounded-full"></div>
                        </h2>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                            {stats.map((stat, index) => {
                                const count = useCountUp(stat.number);
                                return (
                                    <div 
                                        key={index} 
                                        className="text-center group"
                                        style={{
                                            animation: `fadeInUp 0.8s ease-out ${index * 0.15}s both`
                                        }}
                                    >
                                        <div className="relative transform transition-all duration-500
                                                      hover:-translate-y-2 hover:scale-110">
                                            <div className="relative">
                                                {/* Decorative circle */}
                                                <div className="absolute -inset-4 bg-[#FF7F0E]/5 rounded-full 
                                                              scale-0 group-hover:scale-100 transition-transform duration-500 ease-out"></div>
                                                
                                                {/* Number */}
                                                <div className="relative text-[#FF7F0E] text-4xl md:text-6xl font-bold mb-4
                                                              transition-all duration-500 group-hover:text-[#E67200]
                                                              flex items-center justify-center">
                                                    <span className="inline-block transform group-hover:scale-110 
                                                                   transition-transform duration-500">
                                                        {count}
                                                    </span>
                                                    <span className="inline-block ml-1 transform group-hover:translate-x-1 
                                                                   transition-transform duration-500">
                                                        {stat.suffix}
                                                    </span>
                                                    
                                                    {/* Animated dots */}
                                                    <div className="absolute -top-1 -right-1 flex space-x-1">
                                                        <div className="w-2 h-2 bg-[#FF7F0E] rounded-full 
                                                                      opacity-0 group-hover:opacity-100 transition-all duration-300 
                                                                      animate-ping"></div>
                                                    </div>
                                                </div>

                                                {/* Label */}
                                                <div className="text-[#1E1E1E] text-xl md:text-2xl font-medium
                                                              transition-all duration-500 group-hover:text-[#FF7F0E]
                                                              relative">
                                                    {stat.label}
                                                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2
                                                                  w-0 h-0.5 bg-[#FF7F0E] group-hover:w-full
                                                                  transition-all duration-500 ease-out"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Popular Courses Section */}
            <div className="bg-white py-20">
                <div className="max-w-7xl mx-auto px-4">
                    {/* Section Header */}
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4 relative inline-block">
                            Our Most Popular Course
                            <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-[#FF7F0E] to-[#FFB37E] rounded-full"></div>
                        </h2>
                        <p className="text-gray-600 text-lg">
                            Providing amazing online courses, having the best professional experts to teach you.
                        </p>
                    </div>

                    {/* Courses Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {courses.map((course, index) => (
                            <div 
                                key={course.id}
                                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl 
                                         transform hover:-translate-y-2 transition-all duration-300
                                         group relative"
                                style={{
                                    animation: `fadeInUp 0.6s ease-out ${index * 0.2}s both`
                                }}
                            >
                                {/* Course Header */}
                                <div className="relative overflow-hidden">
                                    <div className="aspect-w-16 aspect-h-9 bg-gradient-to-br from-[#FF7F0E] to-[#FFB37E]
                                                  p-6 text-white">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-2xl font-bold mb-2">{course.title}</h3>
                                                <div className="flex items-center space-x-2 text-sm">
                                                    <span>{course.days}</span>
                                                    <span>•</span>
                                                    <span>{course.time}</span>
                                                </div>
                                            </div>
                                            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                                                <img 
                                                    src={course.image} 
                                                    alt={course.instructor}
                                                    className="w-12 h-12 rounded-lg object-cover"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Course Details */}
                                <div className="p-6 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center space-x-2">
                                            <svg className="w-5 h-5 text-[#FF7F0E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                            </svg>
                                            <span>{course.lessons}</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            {[...Array(5)].map((_, i) => (
                                                <svg 
                                                    key={i}
                                                    className={`w-4 h-4 ${i < Math.floor(course.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            ))}
                                            <span className="text-sm text-gray-600">({course.reviews})</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-sm text-gray-600">
                                        <div className="flex items-center space-x-2">
                                            <svg className="w-5 h-5 text-[#FF7F0E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            <span>{course.instructor}</span>
                                        </div>
                                        <div className="font-bold text-[#FF7F0E]">{course.price}</div>
                                    </div>

                                    <div className="pt-4 border-t">
                                        <button className="w-full bg-[#FF7F0E] text-white py-3 rounded-xl
                                                       hover:bg-[#E67200] transition-colors duration-300
                                                       transform group-hover:scale-105">
                                            Enroll Now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Explore More Button */}
                    <div className="text-center mt-12">
                        <button className="bg-white text-[#FF7F0E] px-8 py-3 rounded-full
                                         border-2 border-[#FF7F0E] hover:bg-[#FF7F0E] hover:text-white
                                         transition-all duration-300 transform hover:scale-105">
                            Explore More
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-800 text-white">
                <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div>
                            <h3 className="text-xl font-bold mb-4">Bona Fide</h3>
                            <p className="text-gray-400">Empowering learners worldwide with quality education</p>
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
                            <ul className="space-y-2">
                                <li><Link to="/courses" className="text-gray-400 hover:text-white">Courses</Link></li>
                                <li><Link to="/about" className="text-gray-400 hover:text-white">About Us</Link></li>
                                <li><Link to="/contact" className="text-gray-400 hover:text-white">Contact</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold mb-4">Support</h4>
                            <ul className="space-y-2">
                                <li><Link to="/help" className="text-gray-400 hover:text-white">Help Center</Link></li>
                                <li><Link to="/terms" className="text-gray-400 hover:text-white">Terms of Service</Link></li>
                                <li><Link to="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold mb-4">Connect With Us</h4>
                            <div className="flex space-x-4">
                                {/* Add social media icons here */}
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 border-t border-gray-700 pt-8 text-center">
                        <p className="text-gray-400 text-sm md:text-base">© 2024 Bona Fide. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;