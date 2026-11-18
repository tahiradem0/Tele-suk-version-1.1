import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Mic,
    ShoppingCart,
    Warehouse,
    Wallet,
    Users,
    Settings,
    LogOut,
    X,
} from 'lucide-react';
import { useAdminLanguage } from '../../../context/AdminLanguageContext';
import { useShop } from '../../../context/ShopContext';
import { clearClientCache } from '../../../services/api';

const AdminSidebar = ({ isOpen, onClose }) => {
    const { isAmharic, t } = useAdminLanguage();
    const { storeName = 'Gondar ሱቅ' } = useShop() || {};

    // Clean, 7-item grouped navigation (zero scrolling, zero duplicate pages)
    const menuItems = [
        {
            icon: LayoutDashboard,
            label: isAmharic ? 'መነሻ' : 'Home',
            path: '/admin/dashboard',
        },
        {
            icon: Mic,
            label: isAmharic ? 'ድምፅ እና ደረሰኝ AI' : 'Voice & Receipt AI',
            path: '/admin/ai-assistant',
        },
        {
            icon: ShoppingCart,
            label: isAmharic ? 'ትዕዛዞች እና ማድረስ' : 'Orders & Delivery',
            path: '/admin/sales',
        },
        {
            icon: Warehouse,
            label: isAmharic ? 'ምርቶች እና ክምችት' : 'Products & Stock',
            path: '/admin/catalog',
        },
        {
            icon: Wallet,
            label: isAmharic ? 'ገንዘብ እና መዝገብ' : 'Money & Books',
            path: '/admin/finance',
        },
        {
            icon: Users,
            label: isAmharic ? 'ደንበኞች' : 'Customers',
            path: '/admin/customers',
        },
        {
            icon: Settings,
            label: isAmharic ? 'ቅንብሮች' : 'Settings',
            path: '/admin/settings',
        },
    ];

    const handleLogout = () => {
        clearClientCache();
        localStorage.removeItem('user');
        localStorage.removeItem('admin_session');
        window.location.href = '/admin/login';
    };

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
                />
            )}

            <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--admin-text, #1a1b1e)', margin: 0, letterSpacing: '-0.5px', lineHeight: 1.2 }}>
                        {storeName ? storeName.toUpperCase() : 'STORE'}
                        <span style={{ color: '#06b6d4' }}>.</span>
                    </h2>
                    <button
                        onClick={onClose}
                        className="mobile-close-btn"
                        style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-text)' }}
                    >
                        <X size={24} />
                    </button>
                </div>

                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem', overflowY: 'auto' }} className="hide-scrollbar">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
                            onClick={onClose}
                        >
                            <item.icon size={19} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Clean Logout Footer (Language & Theme live in Top Bar — zero duplication!) */}
                <div style={{ borderTop: '1px solid var(--admin-border, #eee)', paddingTop: '0.85rem', marginTop: '1rem' }}>
                    <button
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.7rem',
                            color: '#f43f5e',
                            background: 'rgba(244, 63, 94, 0.06)',
                            border: '1px solid rgba(244, 63, 94, 0.16)',
                            padding: '0.72rem 0.95rem',
                            borderRadius: '12px',
                            fontSize: '0.92rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                        }}
                        onClick={handleLogout}
                    >
                        <LogOut size={18} />
                        <span>{t('logout', 'Logout')}</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default AdminSidebar;
