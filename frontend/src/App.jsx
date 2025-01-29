import React from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import Login from "./pages/UserAccountManagement/Login";
import Register from "./pages/UserAccountManagement/Register";
import Home from "./pages/UserAccountManagement/Home";
import NotFound from "./pages/UserAccountManagement/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import ForgotPassword from "./pages/UserAccountManagement/ForgotPassword";
import ResetPassword from "./pages/UserAccountManagement/ResetPassword";
import ResetPasswordConfirm from './pages/UserAccountManagement/ResetPasswordConfirm';
import InstructorDashboard from "./pages/Instructor/CourseManagement/InstructorCourses";
import InstructorCourses from "./pages/Instructor/CourseManagement/InstructorCourses";
import CourseManagement from "./pages/Instructor/CourseManagement/CourseManagement";
import CourseDetails from "./pages/Instructor/CourseManagement/CourseDetails";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CourseProvider } from './contexts/CourseContext';

function Logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
}

function RegisterAndLogout() {
    localStorage.clear(); // Clear storage when registering
    return <Register />;
}

function App() {
    return (
        <CourseProvider>
            <BrowserRouter>
                <ToastContainer />
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<RegisterAndLogout />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />
                    <Route path="/reset-password-confirm/:uid/:token" element={<ResetPasswordConfirm />} />
                    <Route path="/logout" element={<Logout />} />
                    
                    {/* Protected Routes */}
                    <Route path="/home" element={
                        <ProtectedRoute>
                            <Home />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="/instructor" element={<ProtectedRoute requiredRole="Instructor" />}>
                        <Route path="dashboard" element={<InstructorDashboard />} />
                        <Route path="courses" element={<InstructorCourses />} />
                        <Route path="course-management/*" element={<CourseManagement />} />
                        <Route path="course-management/details" element={<CourseDetails />} />
                    </Route>
                    
                    {/* Default route */}
                    <Route path="/" element={<Navigate to="/home" replace />} />
                    
                    {/* 404 route */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </BrowserRouter>
        </CourseProvider>
    );
}

export default App;
