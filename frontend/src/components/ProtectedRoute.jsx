import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { jwtDecode } from "jwt-decode"
import api from "../api"
import { REFRESH_TOKEN } from "../constants"
import { useState , useEffect } from "react"

const ProtectedRoute = ({ requiredRole, children }) => {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('accessToken');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole && (!user?.role || user.role !== requiredRole)) {
        return <Navigate to="/home" replace />;
    }

    return children || <Outlet />;
};

export default ProtectedRoute;