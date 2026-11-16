import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Menu, Sun, Moon, ShieldAlert, ShieldCheck } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { useAdminTheme } from '../../../context/AdminThemeContext';
import { settingsService } from '../../../services/api';
import './AdminLayout.css';

const AdminLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { theme, toggleTheme, isDark } = useAdminTheme();
    const [paymentMode, setPaymentMode] = useState('test');

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
                        <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--admin-text, #1a1b1e)' }}>
                            Admin Console
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
                            <span>{isLive ? 'CHAPA LIVE' : 'CHAPA TEST'}</span>
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
                                color: isDark ? '#fab005' : '#495057',
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
