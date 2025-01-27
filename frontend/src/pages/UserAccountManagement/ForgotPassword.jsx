/**
 * ForgotPassword Component
 * Handles password reset request functionality
 */
import '../../styles/Form.css'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import axiosInstance from '../../config/axios'
import Modal from '../../components/Modal'

function ForgotPassword() {
    // State management
    const [email, setEmail] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [modalMessage, setModalMessage] = useState('')
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    /**
     * Handles password reset request submission
     * @param {Event} e - Form submission event
     */
    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setMessage('')
        setError('')

        try {
            const response = await axiosInstance.post('/api/password-reset/', { email })
            setMessage('Password reset email sent. Please check your inbox.')
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to send reset email')
        } finally {
            setLoading(false)
        }
    }

    return (
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

                {/* Right side - Forgot Password Form */}
                <div className="form-right">
                    <h1 className="text-[32px] font-bold mb-6 text-[#ff5722] text-center">
                        Reset Your Password
                    </h1>
                    
                    <p className="text-gray-600 text-center mb-8">
                        Enter your email address and we'll send you reset instructions.
                    </p>

                    {message && <div className="mb-4 text-green-600">{message}</div>}
                    {error && <div className="mb-4 text-red-600">{error}</div>}

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
                                placeholder="Enter your email address"
                                required
                            />
                        </div>

                        {/* Submit button */}
                        <button
                            type="submit"
                            className="w-full bg-orange-500 text-white font-bold text-[16px] py-2 rounded-lg hover:bg-orange-600 transition-colors shadow-lg mb-6"
                            disabled={loading}
                        >
                            {loading ? 'Sending...' : 'Reset Password'}
                        </button>

                        {/* Back to login link */}
                        <p className="text-center text-gray-600 text-[16px]">
                            Remember your password?{' '}
                            <Link to="/login" className="text-[#7453EC] text-[16px] underline font-bold">
                                Back to Login
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
            
            {/* Success/Error Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                message={modalMessage}
            />
        </div>
    )
}

export default ForgotPassword 