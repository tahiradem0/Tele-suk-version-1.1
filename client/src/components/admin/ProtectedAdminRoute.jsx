import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedAdminRoute = ({ children }) => {
    const isAdmin = localStorage.getItem('admin_session') === 'true';
    const location = useLocation();

    if (!isAdmin) {
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedAdminRoute;
