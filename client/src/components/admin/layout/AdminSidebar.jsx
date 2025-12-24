import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard, ShoppingBag, FolderTree, ShoppingCart,
    CreditCard, Users, Truck, Image, MessageSquare,
    FileText, Settings, LogOut, X
} from 'lucide-react';

const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: ShoppingBag, label: 'Products', path: '/admin/products' },
    { icon: FolderTree, label: 'Categories', path: '/admin/categories' },
    { icon: ShoppingCart, label: 'Orders', path: '/admin/orders' },
    { icon: CreditCard, label: 'Payments', path: '/admin/payments' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: Truck, label: 'Delivery', path: '/admin/delivery' },
    { icon: Image, label: 'Banners', path: '/admin/banners' },
    { icon: MessageSquare, label: 'Feedback', path: '/admin/feedback' },
    { icon: FileText, label: 'Content', path: '/admin/content' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
];

const AdminSidebar = ({ isOpen, onClose }) => {
    const sidebarStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        width: '260px',
        background: '#ffffff',
        borderRight: '1px solid #eee',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.3s ease',
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)', // Logic handled by parent for mobile usually, but simpler: desktop always visible, mobile toggles
        zIndex: 100,
        '@media (min-width: 1024px)': {
            transform: 'translateX(0)',
            position: 'sticky'
        }
    };

    // Inline styles for responsiveness are tricky without CSS modules or styled-components.
    // I'll make this work by assuming it's wrapped in a layout that manages the "show/hide" on mobile via class or prop.
    // For now, let's just build the structure.

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        zIndex: 99,
                    }}
                    className="lg:hidden" // Use logic instead of tailwind class if not available
                />
            )}

            <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>TELE-SUK<span style={{ color: '#d4a373' }}>.</span></h2>
                    <button onClick={onClose} className="mobile-close-btn" style={{ display: 'none' }}>
                        <X size={24} />
                    </button>
                </div>

                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }} className="hide-scrollbar">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
                            onClick={onClose} // Close on mobile click
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem', marginTop: '1rem' }}>
                    <button style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        color: '#ff4444',
                        padding: '0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.95rem'
                    }}
                        onClick={() => {
                            localStorage.removeItem('admin_session');
                            window.location.href = '/admin/login';
                        }}>
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default AdminSidebar;
