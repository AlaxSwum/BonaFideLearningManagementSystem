/**
 * Login Component
 * Handles user authentication and login functionality
 */
import '../../styles/Form.css'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import Modal from '../../components/Modal'
import { toast } from 'react-toastify'
import axiosInstance from '../../config/axios'  // Update import

function Login() {
    // State management for form inputs and UI controls
    const [email, setEmail] = useState('')           
    const [password, setPassword] = useState('')     
    const [keepSignedIn, setKeepSignedIn] = useState(false) 
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [showErrorModal, setShowErrorModal] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [userRole, setUserRole] = useState('')
    const navigate = useNavigate()

    /**
     * Handles form submission and user authentication
     * @param {Event} e - Form submission event
     */
    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setShowErrorModal(false)

        try {
            console.log('Attempting login with:', { email });
            
            const response = await axiosInstance.post('/api/login/', {
                email: email,
                password: password
            })
            
            console.log('Login response:', response.data);
            
            // Check if login was successful
            if (response.data.status === 'success') {
                // Store tokens
                const { access, refresh } = response.data.tokens;
                localStorage.setItem('accessToken', access)
                localStorage.setItem('refreshToken', refresh)
                
                // Store user info
                const userData = response.data.user;
                localStorage.setItem('user', JSON.stringify(userData))
                
                // Set user role for the modal
                setUserRole(userData.role)
                
                // Show success modal
                setShowSuccessModal(true)
                
                // Navigate to appropriate dashboard
                setTimeout(() => {
                    setShowSuccessModal(false)
                    if (userData.is_instructor) {
                        navigate('/instructor/courses')
                    } else {
                        navigate('/home')
                    }
                }, 2000)
            } else {
                throw new Error(response.data.error || 'Login failed')
            }
        } catch (error) {
            console.error('Login error:', error.response?.data || error)
            const errorMsg = error.response?.data?.error || error.message || 'Login failed. Please try again.'
            setErrorMessage(errorMsg)
            setShowErrorModal(true)
            setPassword('')
            toast.error(errorMsg)
        } finally {
            setLoading(false)
        }
    }

    /**
     * Toggles password visibility
     */
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword)
    }

    return (
        <>
            <div className="form-container">
                <div className="form-box">
                    {/* Left side - Image */}
                    <div className="form-left">
                        <img
                            src="/src/assets/photos/LearningSystem.png"
                            alt="Learning illustration"
                            className="form-illustration"
                        />
                    </div>

                    {/* Right side - Login Form */}
                    <div className="form-right">
                        <h1 className="text-[32px] font-bold mb-6 text-center text-[#E73F19]">
                            Log in to Bona Fide
                        </h1>

                        <form onSubmit={handleSubmit}>
                            {/* Email input field */}
                            <div className="mb-6">
                                <label className="block text-gray-600 text-[16px] mb-2">
                                    Email address*
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:border-[#8E56FF] bg-[#FFEDE2] text-[16px]"
                                    placeholder="name@gmail.com"
                                    required
                                />
                            </div>

                            {/* Password input field with visibility toggle */}
                            <div className="mb-6">
                                <label className="block text-gray-600 text-[16px] mb-2">
                                    Password*
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:border-[#8E56FF] bg-[#FFEDE2] text-[16px]"
                                        placeholder="•••••••"
                                        required
                                    />
                                    <img
                                        src={showPassword 
                                            ? '/src/assets/icons/visibilityoff.png'
                                            : '/src/assets/icons/visibility.png'
                                        }
                                        onClick={togglePasswordVisibility}
                                        className="pass-icon absolute right-3 top-1/2 transform cursor-pointer"
                                        alt="Toggle password visibility"
                                    />
                                </div>
                            </div>

                            {/* Additional options */}
                            <div className="flex items-center justify-between mb-6">
                                {/* Keep signed in checkbox */}
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={keepSignedIn}
                                        onChange={(e) => setKeepSignedIn(e.target.checked)}
                                        className="h-5 w-5 mr-2 border-gray-300 rounded bg-white focus:ring-0 accent-[#8E56FF] cursor-pointer text-slate-950"
                                    />
                                    <span className="text-[16px] text-gray-600">Keep me signed in</span>
                                </label>

                                {/* Forgot password link */}
                                <Link to="/forgot-password" className="text-[16px] text-[#7453EC] underline">
                                    Forgot password
                                </Link>
                            </div>

                            {/* Submit button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-orange-500 text-white font-bold text-[16px] py-2 rounded-lg hover:bg-orange-600 transition-colors shadow-lg"
                            >
                                {loading ? 'Logging in...' : 'LOGIN'}
                            </button>

                            {/* Alternative login options */}
                            <div className="text-center my-4 text-gray-500">OR</div>
                            {/* Google login button */}
                            <button
                                type="button"
                                className="w-full border-2 border-gray-300 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
                            >
                                <img src="/src/assets/icons/google.png" alt="Google" className="w-5 h-5" />
                                Sign in with Google
                            </button>
                            
                            {/* Registration link */}
                            <p className="text-center mt-6 text-gray-600 text-[16px]">
                                First time here?{' '}
                                <Link to="/register" className="text-[#7453EC] text-[16px] underline font-bold">
                                    Register
                                </Link>
                            </p>
                        </form>
                    </div>
                </div>
            </div>

            {/* Success Modal */}
            {showSuccessModal && (
                <Modal
                    isOpen={showSuccessModal}
                    onClose={() => setShowSuccessModal(false)}
                >
                    <div className="text-center p-6">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                            <svg
                                className="h-6 w-6 text-green-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                            Login Successful!
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">
                            Welcome back to Bona Fide Learning Platform
                        </p>
                        {userRole && (
                            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium 
                                ${userRole === 'Instructor' ? 'bg-blue-100 text-blue-800' : 
                                  userRole === 'Administration' ? 'bg-purple-100 text-purple-800' : 
                                  'bg-green-100 text-green-800'}`}
                            >
                                {userRole}
                            </div>
                        )}
                    </div>
                </Modal>
            )}

            {/* Error Modal */}
            {showErrorModal && (
                <Modal
                    isOpen={showErrorModal}
                    onClose={() => setShowErrorModal(false)}
                >
                    <div className="text-center p-6">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                            <svg
                                className="h-6 w-6 text-red-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                            Login Failed
                        </h3>
                        <p className="text-sm text-gray-500">
                            {errorMessage}
                        </p>
                        <button
                            onClick={() => setShowErrorModal(false)}
                            className="mt-4 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:text-sm"
                        >
                            Try Again
                        </button>
                    </div>
                </Modal>
            )}
        </>
    )
}

export default Login
