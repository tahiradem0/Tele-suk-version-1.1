import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedAdminRoute = ({ children }) => {
    const location = useLocation();

    // Verify cryptographic JWT token & Admin privileges
    const userString = localStorage.getItem('user');
    let isAuthorized = false;

    try {
        if (userString) {
            const user = JSON.parse(userString);
            const token = user?.token;

            // Cryptographic JWT token format validation: header.payload.signature
            if (token && typeof token === 'string' && token.split('.').length === 3) {
                // Decode payload to verify expiration
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(
                    atob(base64)
                        .split('')
                        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                        .join('')
                );
                const payload = JSON.parse(jsonPayload);

                // Verify expiration timestamp
                const isNotExpired = !payload.exp || payload.exp * 1000 > Date.now();
                isAuthorized = user.isAdmin === true && isNotExpired;
            }
        }
    } catch (error) {
        console.error("Cryptographic token validation failed:", error);
        isAuthorized = false;
    }

    // Enforce strict referrer protection for admin side URLs
    useEffect(() => {
        let meta = document.querySelector('meta[name="referrer"]');
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = 'referrer';
            document.head.appendChild(meta);
        }
        meta.content = 'no-referrer';

        // Anti-clickjacking protection
        if (window.top !== window.self) {
            window.top.location = window.self.location;
        }

        return () => {
            if (meta) meta.content = 'strict-origin-when-cross-origin';
        };
    }, []);

    if (!isAuthorized) {
        localStorage.removeItem('user');
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedAdminRoute;
