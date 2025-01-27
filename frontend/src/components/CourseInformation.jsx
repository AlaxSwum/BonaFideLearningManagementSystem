import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const CourseInformation = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        level_info: '',
        image: null,
        video: null
    });

    const handleSubmit = async (action) => {
        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('level_info', formData.level_info);
            if (formData.image) data.append('image', formData.image);
            if (formData.video) data.append('video', formData.video);
            data.append('action_type', action);

            console.log('Submitting to endpoint:', '/api/courses/');

            const response = await fetch('/api/courses/', {
                method: 'POST',
                body: data,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const result = await response.json();
            console.log('Response:', result);

            if (result.status === 'success') {
                toast.success(result.notification.message, {
                    position: result.notification.position,
                    autoClose: result.notification.duration
                });

                if (!result.stay_on_page && result.redirect) {
                    setTimeout(() => {
                        navigate(result.redirect.path);
                    }, result.redirect.delay);
                }
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('An error occurred while saving the course');
        }
    };

    return (
        <div>
            <form onSubmit={(e) => e.preventDefault()}>
                {/* Your form fields here */}
                
                <div className="button-group">
                    <button
                        type="button"
                        onClick={() => handleSubmit('save_continue')}
                        className="save-continue-btn"
                    >
                        Save & Continue
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSubmit('back')}
                        className="back-btn"
                    >
                        Back
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CourseInformation; 