import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../config/axios';

function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const { token } = useParams();  // Get token from URL

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            console.log('Attempting reset with token:', token);
            
            const response = await axiosInstance.post('/api/password-reset-confirm/', {
                token: token,
                new_password: password
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('Reset response:', response.data);

            if (response.data.message) {
                alert('Password reset successful! Please login with your new password.');
                navigate('/login');
            }
        } catch (error) {
            console.error('Reset error:', error.response?.data);
            setError(error.response?.data?.error || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container">
            <div className="form-box">
                <div className="form-left">
                    <img
                        src="/src/assets/photos/LearningSystem.png"
                        alt="Learning illustration"
                        className="form-illustration"
                    />
                </div>

                <div className="form-right">
                    <h1 className="text-[32px] font-bold mb-6 text-[#ff5722] text-center">
                        Set New Password
                    </h1>

                    {error && (
                        <div className="mb-4 text-red-600 text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label className="block text-gray-600 text-[16px] mb-2">
                                New Password*
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:border-[#8E56FF] bg-[#FFEDE2] text-[16px]"
                                    placeholder="Enter new password"
                                    required
                                />
                                <img
                                    src={showPassword ? '/src/assets/icons/visibilityoff.png' : '/src/assets/icons/visibility.png'}
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="pass-icon absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                                    alt="Toggle password visibility"
                                />
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-gray-600 text-[16px] mb-2">
                                Confirm Password*
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:border-[#8E56FF] bg-[#FFEDE2] text-[16px]"
                                placeholder="Confirm new password"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-orange-500 text-white font-bold text-[16px] py-2 rounded-lg hover:bg-orange-600 transition-colors shadow-lg"
                        >
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default ResetPassword; 