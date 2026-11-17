import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Settings as SettingsIcon, CreditCard, Moon, Sun, Save,
    ShieldAlert, ShieldCheck, CheckCircle2, RefreshCw, Key,
    Store, Truck, Mail, Phone, Lock, Eye, EyeOff, MapPin, Languages
} from 'lucide-react';
import { settingsService } from '../../../services/api';
import { useAdminTheme } from '../../../context/AdminThemeContext';
import { useAdminLanguage } from '../../../context/AdminLanguageContext';
import { useShop } from '../../../context/ShopContext';

const AdminSettings = () => {
    const { theme, setTheme, toggleTheme, isDark } = useAdminTheme();
    const { language, setLanguage, isAmharic, t } = useAdminLanguage();
    const { refreshSettings } = useShop();

    const [settings, setSettings] = useState({
        paymentMode: 'test',
        themeMode: 'light',
        chapaTestSecretKey: '',
        chapaTestPublicKey: '',
        chapaLiveSecretKey: '',
        chapaLivePublicKey: '',
        storeName: 'Gondar ሱቅ',
        storePhone: '0978787960',
        storeEmail: 'admin@gondarsuk.com',
        deliveryFee: 5.00,
        allowMockCheckout: true
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savedSuccess, setSavedSuccess] = useState(false);
    const [showKeys, setShowKeys] = useState(true);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const { data } = await settingsService.getSettings();
            if (data) {
                setSettings({
                    paymentMode: data.paymentMode || 'test',
                    themeMode: data.themeMode || 'light',
                    chapaTestSecretKey: data.chapaTestSecretKey || '',
                    chapaTestPublicKey: data.chapaTestPublicKey || '',
                    chapaLiveSecretKey: data.chapaLiveSecretKey || '',
                    chapaLivePublicKey: data.chapaLivePublicKey || '',
                    storeName: data.storeName || 'Gondar ሱቅ',
                    storePhone: data.storePhone || '0978787960',
                    storeEmail: data.storeEmail || 'admin@gondarsuk.com',
                    deliveryFee: data.deliveryFee !== undefined ? data.deliveryFee : 5.00,
                    allowMockCheckout: data.allowMockCheckout !== false
                });
            }
        } catch (error) {
            console.error("Failed to load settings", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleThemeChange = (newTheme) => {
        setSettings(prev => ({ ...prev, themeMode: newTheme }));
        setTheme(newTheme, false); // Local change, full save on submit or instant
    };

    const handleTogglePaymentMode = () => {
        const nextMode = settings.paymentMode === 'test' ? 'live' : 'test';
        setSettings(prev => ({ ...prev, paymentMode: nextMode }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSavedSuccess(false);

        try {
            await settingsService.updateSettings({
                ...settings,
                deliveryFee: Number(settings.deliveryFee)
            });

            // Ensure theme context is synced
            setTheme(settings.themeMode, false);

            // Dynamically refresh global store settings across app
            if (refreshSettings) {
                await refreshSettings();
            }

            setSavedSuccess(true);
            setTimeout(() => setSavedSuccess(false), 4000);
        } catch (error) {
            console.error("Failed to update settings", error);
            alert("Failed to save settings: " + (error.response?.data?.message || error.message));
        } finally {
            setSaving(false);
        }
    };

    const isLive = settings.paymentMode === 'live';

    return (
        <div style={{ padding: '1.5rem', maxWidth: '1080px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--admin-text, #1a1b1e)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <SettingsIcon size={28} color="#3b82f6" />
                        Admin & System Settings
                    </h1>
                    <p style={{ color: 'var(--admin-subtext, #868e96)', fontSize: '0.95rem' }}>
                        Configure live/test payment modes, visual dark mode, and store preferences
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {savedSuccess && (
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: '#10b981',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            background: '#e6fcf5',
                            padding: '6px 14px',
                            borderRadius: '10px'
                        }}>
                            <CheckCircle2 size={16} /> Saved to Database!
                        </span>
                    )}

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={saving}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.4rem',
                            borderRadius: '12px',
                            background: '#1a1b1e',
                            color: 'white',
                            border: 'none',
                            fontWeight: '600',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                    >
                        <Save size={18} />
                        {saving ? 'Saving Changes...' : 'Save Settings'}
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '2rem' }}>
                {/* 1. PAYMENT GATEWAY (CHAPA LIVE vs TEST MODE) */}
                <div style={{
                    background: 'var(--admin-card-bg, white)',
                    padding: '1.8rem',
                    borderRadius: '20px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    border: isLive ? '2px solid #10b981' : '2px solid #fcc419'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <CreditCard size={24} color={isLive ? '#10b981' : '#f59f00'} />
                                <h2 style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--admin-text, #1a1b1e)' }}>
                                    Chapa Payment Gateway
                                </h2>
                            </div>
                            <p style={{ color: 'var(--admin-subtext, #868e96)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
                                Choose between sandbox testing and live production transactions.
                            </p>
                        </div>

                        {/* Mode Status Pill Badge */}
                        <div style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            fontWeight: '800',
                            fontSize: '0.85rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: isLive ? '#e6fcf5' : '#fff9db',
                            color: isLive ? '#0ca678' : '#f08c00',
                            border: isLive ? '1px solid #63e6be' : '1px solid #ffe066'
                        }}>
                            {isLive ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
                            {isLive ? 'LIVE PRODUCTION MODE' : 'TEST SANDBOX MODE'}
                        </div>
                    </div>

                    {/* Toggle Switch */}
                    <div style={{
                        background: 'var(--admin-inner-bg, #f8f9fc)',
                        padding: '1.2rem',
                        borderRadius: '16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '1rem',
                        marginBottom: '1.5rem',
                        border: '1px solid var(--admin-border, #eee)'
                    }}>
                        <div>
                            <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--admin-text, #1a1b1e)' }}>
                                Payment Environment
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--admin-subtext, #868e96)' }}>
                                {isLive
                                    ? '⚠️ LIVE MODE: Orders will initiate real payments charging customers via Telebirr, CBEBirr, or Bank Cards.'
                                    : '🛡️ TEST MODE: Safe sandbox transactions for testing checkouts without real money deduction.'}
                            </div>
                        </div>

                        {/* Switch Buttons */}
                        <div style={{
                            display: 'flex',
                            background: '#e9ecef',
                            borderRadius: '12px',
                            padding: '4px',
                            gap: '4px'
                        }}>
                            <button
                                type="button"
                                onClick={() => setSettings(prev => ({ ...prev, paymentMode: 'test' }))}
                                style={{
                                    padding: '8px 18px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    fontWeight: '700',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    background: !isLive ? '#f59f00' : 'transparent',
                                    color: !isLive ? 'white' : '#495057',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Test Mode
                            </button>
                            <button
                                type="button"
                                onClick={() => setSettings(prev => ({ ...prev, paymentMode: 'live' }))}
                                style={{
                                    padding: '8px 18px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    fontWeight: '700',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    background: isLive ? '#10b981' : 'transparent',
                                    color: isLive ? 'white' : '#495057',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Live Mode
                            </button>
                        </div>
                    </div>

                    {/* API Keys Configuration - Shows Both Live & Test Keys with Active Environment Highlighted */}
                    <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <span style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--admin-text, #1a1b1e)' }}>
                                Gateway API Credentials
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSettings(prev => ({
                                            ...prev,
                                            chapaTestSecretKey: 'CHASECK_TEST-IXvdkCmyuUbnyrFMtC2K6y8maSbXgrV5',
                                            chapaTestPublicKey: 'CHAPUBK-ako9ciwIHZCGi1GiV9CzQdknSMBb1wby',
                                            chapaLiveSecretKey: 'CHASECK-zUKTw15FI5pNaH1MEntujn63Mmw5IgXR',
                                            chapaLivePublicKey: 'CHAPUBK-ako9ciwIHZCGi1GiV9CzQdknSMBb1wby'
                                        }));
                                    }}
                                    style={{
                                        background: 'none',
                                        border: '1px solid var(--admin-border, #ced4da)',
                                        borderRadius: '6px',
                                        padding: '4px 10px',
                                        color: 'var(--admin-subtext, #495057)',
                                        fontSize: '0.78rem',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                    }}
                                >
                                    ↻ Restore Verified Keys
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowKeys(!showKeys)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#4dabf7',
                                        fontSize: '0.85rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                >
                                    {showKeys ? <EyeOff size={16} /> : <Eye size={16} />}
                                    {showKeys ? 'Hide Secret Keys' : 'Show Secret Keys'}
                                </button>
                            </div>
                        </div>

                        {/* LIVE PRODUCTION KEYS CARD */}
                        <div style={{
                            padding: '1.2rem',
                            borderRadius: '14px',
                            background: isLive ? (isDark ? 'rgba(16, 185, 129, 0.1)' : '#f0fdf4') : 'var(--admin-inner-bg, #f8f9fc)',
                            border: isLive ? '2px solid #10b981' : '1px solid var(--admin-border, #eee)',
                            transition: 'all 0.2s ease'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontWeight: '700', fontSize: '0.9rem', color: isLive ? '#0ca678' : 'var(--admin-text, #495057)' }}>
                                        🟢 Live Production Keys
                                    </span>
                                    {isLive && (
                                        <span style={{ fontSize: '0.75rem', fontWeight: '800', background: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '12px' }}>
                                            CURRENTLY ACTIVE
                                        </span>
                                    )}
                                </div>
                                <span style={{ fontSize: '0.78rem', color: 'var(--admin-subtext, #868e96)' }}>
                                    Charges real money (Telebirr, CBEBirr, Cards)
                                </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                        <label style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--admin-text, #495057)' }}>
                                            Chapa Live Secret Key
                                        </label>
                                        {settings.chapaLiveSecretKey && !settings.chapaLiveSecretKey.includes('_TEST') ? (
                                            <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#0ca678', background: '#e6fcf5', padding: '2px 8px', borderRadius: '6px' }}>
                                                ✓ Connected (Live)
                                            </span>
                                        ) : (
                                            <span style={{ fontSize: '0.72rem', color: '#fa5252' }}>
                                                {settings.chapaLiveSecretKey?.includes('_TEST') ? '⚠️ Invalid Live Key' : 'Not set'}
                                            </span>
                                        )}
                                    </div>
                                    <input
                                        type={showKeys ? 'text' : 'password'}
                                        name="chapaLiveSecretKey"
                                        value={settings.chapaLiveSecretKey}
                                        onChange={handleChange}
                                        placeholder="CHASECK-..."
                                        style={{
                                            width: '100%',
                                            padding: '0.7rem',
                                            borderRadius: '8px',
                                            border: settings.chapaLiveSecretKey?.includes('_TEST') ? '1px solid #fa5252' : '1px solid var(--admin-border, #ced4da)',
                                            background: 'var(--admin-card-bg, #ffffff)',
                                            color: 'var(--admin-text, #1a1b1e)',
                                            fontFamily: 'monospace',
                                            fontSize: '0.85rem'
                                        }}
                                    />
                                    {settings.chapaLiveSecretKey?.includes('_TEST') && (
                                        <div style={{ marginTop: '0.3rem', fontSize: '0.75rem', color: '#fa5252', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Cannot use a test key in Live mode!</span>
                                            <button
                                                type="button"
                                                onClick={() => setSettings(p => ({ ...p, chapaLiveSecretKey: 'CHASECK-zUKTw15FI5pNaH1MEntujn63Mmw5IgXR' }))}
                                                style={{ border: 'none', background: 'none', color: '#1971c2', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}
                                            >
                                                Fix Live Key
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                        <label style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--admin-text, #495057)' }}>
                                            Chapa Live Public Key
                                        </label>
                                        {settings.chapaLivePublicKey ? (
                                            <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#0ca678', background: '#e6fcf5', padding: '2px 8px', borderRadius: '6px' }}>
                                                ✓ Connected
                                            </span>
                                        ) : (
                                            <span style={{ fontSize: '0.72rem', color: '#fa5252' }}>Not set</span>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        name="chapaLivePublicKey"
                                        value={settings.chapaLivePublicKey}
                                        onChange={handleChange}
                                        placeholder="CHAPUBK-..."
                                        style={{
                                            width: '100%',
                                            padding: '0.7rem',
                                            borderRadius: '8px',
                                            border: '1px solid var(--admin-border, #ced4da)',
                                            background: 'var(--admin-card-bg, #ffffff)',
                                            color: 'var(--admin-text, #1a1b1e)',
                                            fontFamily: 'monospace',
                                            fontSize: '0.85rem'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* TEST SANDBOX KEYS CARD */}
                        <div style={{
                            padding: '1.2rem',
                            borderRadius: '14px',
                            background: !isLive ? (isDark ? 'rgba(245, 159, 0, 0.1)' : '#fffdf5') : 'var(--admin-inner-bg, #f8f9fc)',
                            border: !isLive ? '2px solid #f59f00' : '1px solid var(--admin-border, #eee)',
                            transition: 'all 0.2s ease'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontWeight: '700', fontSize: '0.9rem', color: !isLive ? '#f59f00' : 'var(--admin-text, #495057)' }}>
                                        🟡 Test Sandbox Keys
                                    </span>
                                    {!isLive && (
                                        <span style={{ fontSize: '0.75rem', fontWeight: '800', background: '#f59f00', color: 'white', padding: '2px 8px', borderRadius: '12px' }}>
                                            CURRENTLY ACTIVE
                                        </span>
                                    )}
                                </div>
                                <span style={{ fontSize: '0.78rem', color: 'var(--admin-subtext, #868e96)' }}>
                                    Safe testing without real payments
                                </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                        <label style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--admin-text, #495057)' }}>
                                            Chapa Test Secret Key
                                        </label>
                                        {settings.chapaTestSecretKey && settings.chapaTestSecretKey.startsWith('CHASECK_TEST-') ? (
                                            <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#f59f00', background: '#fff9db', padding: '2px 8px', borderRadius: '6px' }}>
                                                ✓ Connected (Sandbox)
                                            </span>
                                        ) : (
                                            <span style={{ fontSize: '0.72rem', color: '#fa5252', background: '#fff5f5', padding: '2px 8px', borderRadius: '6px' }}>
                                                ⚠️ Live Key Detected
                                            </span>
                                        )}
                                    </div>
                                    <input
                                        type={showKeys ? 'text' : 'password'}
                                        name="chapaTestSecretKey"
                                        value={settings.chapaTestSecretKey}
                                        onChange={handleChange}
                                        placeholder="CHASECK_TEST-..."
                                        style={{
                                            width: '100%',
                                            padding: '0.7rem',
                                            borderRadius: '8px',
                                            border: (settings.chapaTestSecretKey && !settings.chapaTestSecretKey.startsWith('CHASECK_TEST-')) ? '1px solid #fa5252' : '1px solid var(--admin-border, #ced4da)',
                                            background: 'var(--admin-card-bg, #ffffff)',
                                            color: 'var(--admin-text, #1a1b1e)',
                                            fontFamily: 'monospace',
                                            fontSize: '0.85rem'
                                        }}
                                    />
                                    {settings.chapaTestSecretKey && !settings.chapaTestSecretKey.startsWith('CHASECK_TEST-') && (
                                        <div style={{ marginTop: '0.35rem', fontSize: '0.74rem', color: '#fa5252', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span>⚠️ Key must start with <strong>CHASECK_TEST-</strong> or Chapa treats it as Live!</span>
                                            <button
                                                type="button"
                                                onClick={() => setSettings(p => ({ ...p, chapaTestSecretKey: 'CHASECK_TEST-IXvdkCmyuUbnyrFMtC2K6y8maSbXgrV5' }))}
                                                style={{ border: 'none', background: 'none', color: '#1971c2', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}
                                            >
                                                Fix Test Key
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                        <label style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--admin-text, #495057)' }}>
                                            Chapa Test Public Key
                                        </label>
                                        {settings.chapaTestPublicKey ? (
                                            <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#f59f00', background: '#fff9db', padding: '2px 8px', borderRadius: '6px' }}>
                                                ✓ Connected
                                            </span>
                                        ) : (
                                            <span style={{ fontSize: '0.72rem', color: '#fa5252' }}>Not set</span>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        name="chapaTestPublicKey"
                                        value={settings.chapaTestPublicKey}
                                        onChange={handleChange}
                                        placeholder="CHAPUBK-..."
                                        style={{
                                            width: '100%',
                                            padding: '0.7rem',
                                            borderRadius: '8px',
                                            border: '1px solid var(--admin-border, #ced4da)',
                                            background: 'var(--admin-card-bg, #ffffff)',
                                            color: 'var(--admin-text, #1a1b1e)',
                                            fontFamily: 'monospace',
                                            fontSize: '0.85rem'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Developer Mock Checkout Toggle */}
                    {!isLive && (
                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--admin-border, #eee)' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--admin-text, #495057)' }}>
                                <input
                                    type="checkbox"
                                    name="allowMockCheckout"
                                    checked={settings.allowMockCheckout}
                                    onChange={handleChange}
                                />
                                <strong>Enable Fallback Test Checkout Simulation:</strong> Allows successful payment testing even when external banking networks are offline.
                            </label>
                        </div>
                    )}
                </div>

                {/* 2. ADMIN APPEARANCE (LIGHT vs DARK MODE) */}
                <div style={{
                    background: 'var(--admin-card-bg, white)',
                    padding: '1.8rem',
                    borderRadius: '20px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    border: '1px solid var(--admin-border, #eee)'
                }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--admin-text, #1a1b1e)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            {isDark ? <Moon size={24} color="#38bdf8" /> : <Sun size={24} color="#f59f00" />}
                            Admin Panel Theme & Appearance
                        </h2>
                        <p style={{ color: 'var(--admin-subtext, #868e96)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
                            Switch between Light and Dark interface modes. This preference is saved to your account and database.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                        {/* Light Mode Card */}
                        <div
                            onClick={() => handleThemeChange('light')}
                            style={{
                                border: settings.themeMode === 'light' ? '3px solid #1a1b1e' : '1px solid var(--admin-border, #dee2e6)',
                                borderRadius: '16px',
                                padding: '1.5rem',
                                cursor: 'pointer',
                                background: '#ffffff',
                                boxShadow: settings.themeMode === 'light' ? '0 6px 20px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.2s',
                                position: 'relative'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <Sun size={24} color="#f59f00" />
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1a1b1e' }}>Light Theme</h3>
                                </div>
                                {settings.themeMode === 'light' && (
                                    <span style={{ color: '#10b981', fontWeight: '700', fontSize: '0.85rem' }}>● Active</span>
                                )}
                            </div>
                            <p style={{ fontSize: '0.85rem', color: '#868e96', margin: 0 }}>
                                Crisp, clean daytime interface with high readability and white contrast cards.
                            </p>
                        </div>

                        {/* Dark Mode Card */}
                        <div
                            onClick={() => handleThemeChange('dark')}
                            style={{
                                border: settings.themeMode === 'dark' ? '3px solid #06b6d4' : '1px solid var(--admin-border, #dee2e6)',
                                borderRadius: '16px',
                                padding: '1.5rem',
                                cursor: 'pointer',
                                background: '#111c30',
                                boxShadow: settings.themeMode === 'dark' ? '0 6px 20px rgba(6, 182, 212, 0.25)' : 'none',
                                transition: 'all 0.2s',
                                position: 'relative'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <Moon size={24} color="#38bdf8" />
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f8fafc' }}>Cool Dark Theme</h3>
                                </div>
                                {settings.themeMode === 'dark' && (
                                    <span style={{ color: '#06b6d4', fontWeight: '700', fontSize: '0.85rem' }}>● Active</span>
                                )}
                            </div>
                            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>
                                Modern high-contrast cool obsidian slate mode with electric cyan and ice accents to reduce eye strain.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2.5. ADMIN LANGUAGE CONFIGURATION */}
                <div style={{
                    background: 'var(--admin-card-bg, white)',
                    padding: '1.8rem',
                    borderRadius: '20px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    border: '1px solid var(--admin-border, #eee)'
                }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--admin-text, #1a1b1e)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <Languages size={24} color="#0ca678" />
                            {isAmharic ? 'የአስተዳዳሪ ቋንቋ ቅንብር (Language Mode)' : 'Admin Language Mode'}
                        </h2>
                        <p style={{ color: 'var(--admin-subtext, #868e96)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
                            {isAmharic
                                ? 'ለመላው የአስተዳዳሪ መቆጣጠሪያ የሚመርጡትን ቋንቋ ይምረጡ (እንግሊዝኛ ወይም አማርኛ)።'
                                : 'Select your preferred interface language for the administrative control console.'}
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                        {/* English Card */}
                        <div
                            onClick={() => setLanguage('en')}
                            style={{
                                border: language === 'en' ? '3px solid #1a1b1e' : '1px solid var(--admin-border, #dee2e6)',
                                borderRadius: '16px',
                                padding: '1.5rem',
                                cursor: 'pointer',
                                background: 'var(--admin-input-bg, #ffffff)',
                                boxShadow: language === 'en' ? '0 6px 20px rgba(0,0,0,0.08)' : 'none',
                                transition: 'all 0.2s',
                                position: 'relative'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <span style={{ fontSize: '1.5rem' }}>🇬🇧</span>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0, color: 'var(--admin-text, #1a1b1e)' }}>English</h3>
                                </div>
                                {language === 'en' && (
                                    <span style={{ color: '#10b981', fontWeight: '700', fontSize: '0.85rem' }}>● Active</span>
                                )}
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--admin-subtext, #868e96)', margin: 0 }}>
                                Standard international English interface for menus, metrics, orders, and products.
                            </p>
                        </div>

                        {/* Amharic Card */}
                        <div
                            onClick={() => setLanguage('am')}
                            style={{
                                border: language === 'am' ? '3px solid #0ca678' : '1px solid var(--admin-border, #dee2e6)',
                                borderRadius: '16px',
                                padding: '1.5rem',
                                cursor: 'pointer',
                                background: 'var(--admin-input-bg, #ffffff)',
                                boxShadow: language === 'am' ? '0 6px 20px rgba(12,166,120,0.15)' : 'none',
                                transition: 'all 0.2s',
                                position: 'relative'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <span style={{ fontSize: '1.5rem' }}>🇪🇹</span>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0, color: 'var(--admin-text, #1a1b1e)' }}>አማርኛ (Amharic)</h3>
                                </div>
                                {language === 'am' && (
                                    <span style={{ color: '#0ca678', fontWeight: '700', fontSize: '0.85rem' }}>● ንቁ (Active)</span>
                                )}
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--admin-subtext, #868e96)', margin: 0 }}>
                                የተሟላ የአማርኛ ቋንቋ ቅንብር ለዳሽቦርድ፣ መደብር፣ ትዕዛዞች፣ የማድረስ ስራ እና አድራሻዎች።
                            </p>
                        </div>
                    </div>
                </div>

                {/* 3. STORE & DELIVERY CONFIGURATION */}
                <div style={{
                    background: 'var(--admin-card-bg, white)',
                    padding: '1.8rem',
                    borderRadius: '20px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    border: '1px solid var(--admin-border, #eee)'
                }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--admin-text, #1a1b1e)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <Store size={24} color="#10b981" />
                            Store Details & Delivery Fees
                        </h2>
                        <p style={{ color: 'var(--admin-subtext, #868e96)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
                            Update store contact details shown on customer receipts and delivery charges.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.2rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--admin-text, #495057)' }}>
                                Store Name
                            </label>
                            <input
                                type="text"
                                name="storeName"
                                value={settings.storeName}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '10px',
                                    border: '1px solid var(--admin-border, #ced4da)',
                                    background: 'var(--admin-input-bg, #f8f9fc)',
                                    color: 'var(--admin-text, #1a1b1e)'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--admin-text, #495057)' }}>
                                Standard Delivery Fee (ETB)
                            </label>
                            <input
                                type="number"
                                name="deliveryFee"
                                min="0"
                                step="any"
                                value={settings.deliveryFee}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '10px',
                                    border: '1px solid var(--admin-border, #ced4da)',
                                    background: 'var(--admin-input-bg, #f8f9fc)',
                                    color: 'var(--admin-text, #1a1b1e)'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--admin-text, #495057)' }}>
                                Support Phone Number
                            </label>
                            <input
                                type="text"
                                name="storePhone"
                                value={settings.storePhone}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '10px',
                                    border: '1px solid var(--admin-border, #ced4da)',
                                    background: 'var(--admin-input-bg, #f8f9fc)',
                                    color: 'var(--admin-text, #1a1b1e)'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--admin-text, #495057)' }}>
                                Support Email
                            </label>
                            <input
                                type="email"
                                name="storeEmail"
                                value={settings.storeEmail}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '10px',
                                    border: '1px solid var(--admin-border, #ced4da)',
                                    background: 'var(--admin-input-bg, #f8f9fc)',
                                    color: 'var(--admin-text, #1a1b1e)'
                                }}
                            />
                        </div>

                        {/* Link to Delivery Addresses Management */}
                        <div style={{
                            gridColumn: '1 / -1',
                            padding: '1.2rem',
                            background: 'var(--admin-input-bg, #f8f9fc)',
                            borderRadius: '12px',
                            border: '1px dashed var(--admin-border, #ced4da)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '0.8rem',
                            marginTop: '0.5rem'
                        }}>
                            <div>
                                <h4 style={{ margin: '0 0 4px', fontSize: '0.94rem', fontWeight: 700, color: 'var(--admin-text, #1a1b1e)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <MapPin size={17} color="#0ca678" />
                                    Gondar Delivery Addresses & Autocomplete Management
                                </h4>
                                <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--admin-subtext, #868e96)' }}>
                                    Add, edit, or remove suggested locations (Arada, Piassa, Maraki, Azezo, etc.) to help customer checkout.
                                </p>
                            </div>
                            <Link
                                to="/admin/addresses"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '9px 16px',
                                    background: '#0ca678',
                                    color: 'white',
                                    borderRadius: '8px',
                                    textDecoration: 'none',
                                    fontSize: '0.84rem',
                                    fontWeight: 700
                                }}
                            >
                                Manage Delivery Addresses →
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Bottom Save Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button
                        type="submit"
                        disabled={saving}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            padding: '1rem 2.5rem',
                            borderRadius: '12px',
                            background: '#1a1b1e',
                            color: 'white',
                            border: 'none',
                            fontSize: '1rem',
                            fontWeight: '700',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                        }}
                    >
                        <Save size={20} />
                        {saving ? 'Saving...' : 'Save All Settings'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminSettings;
