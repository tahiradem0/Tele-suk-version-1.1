import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, Sun, Moon, ShieldAlert, ShieldCheck } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { useAdminTheme } from '../../../context/AdminThemeContext';
import { useAdminLanguage } from '../../../context/AdminLanguageContext';
import { settingsService } from '../../../services/api';
import './AdminLayout.css';

const WORKSPACE_TITLES = [
    { prefix: '/admin/dashboard', en: 'Home', am: 'መነሻ' },
    { prefix: '/admin/ai-assistant', en: 'Voice & Receipt AI', am: 'ድምፅ እና ደረሰኝ AI' },
    { prefix: '/admin/sales', en: 'Orders & Delivery', am: 'ትዕዛዞች እና ማድረስ' },
    { prefix: '/admin/catalog', en: 'Products & Stock', am: 'ምርቶች እና ክምችት' },
    { prefix: '/admin/products', en: 'Products & Stock', am: 'ምርቶች እና ክምችት' },
    { prefix: '/admin/finance', en: 'Money & Books', am: 'ገንዘብ እና መዝገብ' },
    { prefix: '/admin/customers', en: 'Customers', am: 'ደንበኞች' },
    { prefix: '/admin/settings', en: 'Settings', am: 'ቅንብሮች' },
];

const AdminLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { toggleTheme, isDark } = useAdminTheme();
    const { language, setLanguage, isAmharic, t } = useAdminLanguage();
    const [paymentMode, setPaymentMode] = useState('test');
    const location = useLocation();

    const currentTitleObj = WORKSPACE_TITLES.find((w) => location.pathname.startsWith(w.prefix));
    const currentPageTitle = currentTitleObj
        ? (isAmharic ? currentTitleObj.am : currentTitleObj.en)
        : t('adminConsole', 'Admin Console');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await settingsService.getSettings();
                if (data && data.paymentMode) {
                    setPaymentMode(data.paymentMode);
                }
            } catch (err) {
                console.error("Failed to load header settings", err);
            }
        };
        fetchSettings();
    }, []);

    const isLive = paymentMode === 'live';

    return (
        <div className={`admin-layout ${isDark ? 'dark' : ''}`}>
            <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main className="admin-content">
                {/* Admin Top Bar */}
                <header className="admin-topbar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="mobile-menu-btn"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'none' }}
                        >
                            <Menu size={24} color="var(--admin-text, #1a1b1e)" />
                        </button>
                        <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--admin-text, #1a1b1e)' }}>
                            {currentPageTitle}
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        {/* Language Changing Mode Pill Switcher */}
                        <div
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                background: 'var(--admin-card-bg, #ffffff)',
                                borderRadius: '24px',
                                padding: '2px 3px',
                                border: '1px solid var(--admin-border, #dee2e6)',
                                gap: '2px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                            }}
                            title={isAmharic ? 'ቋንቋ ቀይር (English / አማርኛ)' : 'Change Language (English / አማርኛ)'}
                        >
                            <button
                                onClick={() => setLanguage('en')}
                                style={{
                                    border: 'none',
                                    background: language === 'en' ? 'var(--admin-text, #1a1b1e)' : 'transparent',
                                    color: language === 'en' ? 'var(--admin-card-bg, #ffffff)' : 'var(--admin-subtext, #868e96)',
                                    padding: '4px 10px',
                                    borderRadius: '20px',
                                    fontSize: '0.76rem',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s'
                                }}
                            >
                                EN
                            </button>
                            <button
                                onClick={() => setLanguage('am')}
                                style={{
                                    border: 'none',
                                    background: language === 'am' ? '#0ca678' : 'transparent',
                                    color: language === 'am' ? '#ffffff' : 'var(--admin-subtext, #868e96)',
                                    padding: '4px 10px',
                                    borderRadius: '20px',
                                    fontSize: '0.76rem',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s'
                                }}
                            >
                                አማ
                            </button>
                        </div>

                        {/* Live vs Test Mode Pill Indicator */}
                        <Link
                            to="/admin/settings"
                            title="Click to change payment mode in Settings"
                            style={{
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '5px 12px',
                                borderRadius: '20px',
                                fontSize: '0.75rem',
                                fontWeight: '800',
                                letterSpacing: '0.4px',
                                background: isLive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 159, 0, 0.15)',
                                color: isLive ? '#10b981' : '#f59f00',
                                border: isLive ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 159, 0, 0.3)'
                            }}
                        >
                            {isLive ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                            <span>{isLive ? t('chapaLive', 'CHAPA LIVE') : t('chapaTest', 'CHAPA TEST')}</span>
                        </Link>

                        {/* Quick Theme Toggle Button */}
                        <button
                            onClick={toggleTheme}
                            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '38px',
                                height: '38px',
                                borderRadius: '10px',
                                border: '1px solid var(--admin-border, #dee2e6)',
                                background: 'var(--admin-card-bg, #ffffff)',
                                color: isDark ? '#38bdf8' : '#495057',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {isDark ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                    </div>
                </header>

                <div className="admin-page-container">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
