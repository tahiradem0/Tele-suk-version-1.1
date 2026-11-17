import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard, ShoppingBag, FolderTree, ShoppingCart,
    CreditCard, Users, Truck, Image, Settings, LogOut, X,
    Warehouse, Coins, Receipt, Sun, Moon, MapPin, Languages, BookOpen
} from 'lucide-react';
import { useAdminTheme } from '../../../context/AdminThemeContext';
import { useAdminLanguage } from '../../../context/AdminLanguageContext';
import { useShop } from '../../../context/ShopContext';

const AdminSidebar = ({ isOpen, onClose }) => {
    const { theme, toggleTheme, isDark } = useAdminTheme();
    const { language, toggleLanguage, isAmharic, t } = useAdminLanguage();
    const { storeName } = useShop();

    const menuItems = [
        { icon: LayoutDashboard, label: t('dashboard', 'Dashboard'), path: '/admin/dashboard' },
        { icon: Warehouse, label: t('storeAndStock', 'Store & Stock'), path: '/admin/store' },
        { icon: Coins, label: t('capitalTreasury', 'Capital Treasury'), path: '/admin/capital' },
        { icon: Receipt, label: t('debtAndCredit', 'Debt & Credit'), path: '/admin/debt-credit' },
        { icon: BookOpen, label: t('expensesAndMezgeb', 'Expenses & Mezgeb'), path: '/admin/expenses' },
        { icon: ShoppingBag, label: t('products', 'Products'), path: '/admin/products' },
        { icon: FolderTree, label: t('categories', 'Categories'), path: '/admin/categories' },
        { icon: ShoppingCart, label: t('orders', 'Orders'), path: '/admin/orders' },
        { icon: CreditCard, label: t('payments', 'Payments'), path: '/admin/payments' },
        { icon: Users, label: t('users', 'Users'), path: '/admin/users' },
        { icon: Truck, label: t('delivery', 'Delivery'), path: '/admin/delivery' },
        { icon: MapPin, label: t('addresses', 'Addresses'), path: '/admin/addresses' },
        { icon: Image, label: t('banners', 'Banners'), path: '/admin/banners' },
        { icon: Settings, label: t('settings', 'Settings'), path: '/admin/settings' },
    ];

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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--admin-text, #1a1b1e)', margin: 0, letterSpacing: '-0.5px' }}>
                        {storeName ? storeName.toUpperCase() : 'STORE'}<span style={{ color: '#d4a373' }}>.</span>
                    </h2>
                    <button
                        onClick={onClose}
                        className="mobile-close-btn"
                        style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-text)' }}
                    >
                        <X size={24} />
                    </button>
                </div>

                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem', overflowY: 'auto' }} className="hide-scrollbar">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
                            onClick={onClose}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div style={{ borderTop: '1px solid var(--admin-border, #eee)', paddingTop: '1rem', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {/* Language Switch Button */}
                    <button
                        onClick={toggleLanguage}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'var(--admin-inner-bg, #f8f9fa)',
                            border: '1px solid var(--admin-border, #eee)',
                            padding: '0.7rem 0.85rem',
                            borderRadius: '12px',
                            color: 'var(--admin-text, #1a1b1e)',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '600'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <Languages size={18} color="#0ca678" />
                            <span>{t('language', 'Language')}</span>
                        </div>
                        <span style={{
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '0.75rem',
                            background: isAmharic ? '#0ca678' : 'var(--admin-text, #1a1b1e)',
                            color: '#ffffff',
                            fontWeight: '700'
                        }}>
                            {isAmharic ? 'አማርኛ' : 'ENGLISH'}
                        </span>
                    </button>

                    {/* Theme Toggle Button in Sidebar */}
                    <button
                        onClick={toggleTheme}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'var(--admin-inner-bg, #f8f9fa)',
                            border: '1px solid var(--admin-border, #eee)',
                            padding: '0.7rem 0.85rem',
                            borderRadius: '12px',
                            color: 'var(--admin-text, #1a1b1e)',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '600'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            {isDark ? <Moon size={18} color="#38bdf8" /> : <Sun size={18} color="#f59f00" />}
                            <span>{isDark ? t('darkMode', 'Dark Mode') : t('lightMode', 'Light Mode')}</span>
                        </div>
                        <span style={{
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '0.75rem',
                            background: isDark ? 'linear-gradient(135deg, #0284c7, #06b6d4)' : '#1a1b1e',
                            color: '#ffffff',
                            fontWeight: '700',
                            boxShadow: isDark ? '0 2px 8px rgba(6, 182, 212, 0.4)' : 'none'
                        }}>
                            {isDark ? 'DARK' : 'LIGHT'}
                        </span>
                    </button>

                    {/* Logout Button */}
                    <button
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            color: '#ff4444',
                            background: 'none',
                            border: 'none',
                            padding: '0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.95rem',
                            cursor: 'pointer'
                        }}
                        onClick={() => {
                            localStorage.removeItem('user');
                            localStorage.removeItem('admin_session');
                            window.location.href = '/admin/login';
                        }}
                    >
                        <LogOut size={20} />
                        <span>{t('logout', 'Logout')}</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default AdminSidebar;
