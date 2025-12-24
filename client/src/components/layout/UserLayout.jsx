import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const UserLayout = () => {
    return (
        <div className="app-container">
            <Outlet />
            <Navbar />
        </div>
    );
};

export default UserLayout;
