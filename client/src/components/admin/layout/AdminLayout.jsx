import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import './AdminLayout.css';

const AdminLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="admin-layout">
            <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main className="admin-content">
                {/* Mobile Header (Visible only on mobile/tablet via CSS) */}
                <div className="mobile-header">
                    <button onClick={() => setIsSidebarOpen(true)}>
                        <Menu size={24} color="#1a1b1e" />
                    </button>
                    <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Admin Panel</span>
                </div>

                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
