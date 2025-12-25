import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedAdminRoute = ({ children }) => {
    const location = useLocation();

    // Check for user object in localStorage and verify isAdmin property
    const userString = localStorage.getItem('user');
    let isAdmin = false;

    try {
        if (userString) {
            const user = JSON.parse(userString);
            isAdmin = user && user.isAdmin === true;
        }
    } catch (error) {
        console.error("Error parsing user from local storage in ProtectedAdminRoute", error);
        isAdmin = false;
    }

    if (!isAdmin) {
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedAdminRoute;
