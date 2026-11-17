import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../../context/ShopContext';
import { Eye, EyeOff, ShieldCheck, Lock, ArrowRight, Globe, KeyRound } from 'lucide-react';
import { useAdminLanguage } from '../../context/AdminLanguageContext';
import '../Auth.css';

const AdminLogin = () => {
    const { language, toggleLanguage, isAmharic } = useAdminLanguage();
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useShop();

    const handleLogin = async (e) => {
        if (e) e.preventDefault();
        setError('');

        const trimmedPw = password.trim();

        if (!trimmedPw) {
            setError(isAmharic ? 'እባክዎ የአስተዳዳሪ የይለፍ ቃል ያስገቡ።' : 'Please enter the admin password.');
            return;
        }

        setLoading(true);

        try {
            console.log('🔐 Authenticating admin password access...');
            // Single password login - no username needed
            const result = await login(null, trimmedPw);

            if (result.success) {
                const storedUser = JSON.parse(localStorage.getItem('user'));

                if (storedUser && storedUser.isAdmin) {
                    console.log('✅ Admin verified! Navigating to dashboard...');
                    navigate('/admin/dashboard', { replace: true });
                } else {
                    setError(isAmharic ? 'ፍቃድ ተከልክሏል፡ ይህ መለያ የአስተዳዳሪ ፍቃድ የለውም።' : 'Access Denied: Admin authorization required.');
                    localStorage.removeItem('user');
                }
            } else {
                setError(result.error || (isAmharic ? 'የተሳሳተ የይለፍ ቃል። እባክዎ እንደገና ይሞክሩ።' : 'Invalid admin password. Please try again.'));
            }
        } catch (err) {
            console.error('💥 Login Exception:', err);
            if (err.message === 'Network Error') {
                setError(isAmharic ? 'የኔትወርክ ስህተት፡ ከአገልጋዩ ጋር መገናኘት አልተቻለም።' : 'Network Error: Cannot connect to backend server. Make sure the server is active.');
            } else {
                setError(`Error: ${err.message || (isAmharic ? 'ያልተጠበቀ ስህተት አጋጥሟል።' : 'An unexpected error occurred.')}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page auth-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: '#0f172a', position: 'relative' }}>
            {/* Top Language Toggle */}
            <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}>
                <button
                    onClick={toggleLanguage}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        border: '1px solid rgba(255,255,255,0.15)',
                        background: 'rgba(30, 41, 59, 0.8)',
                        fontWeight: '700',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        color: '#f8fafc',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                    }}
                >
                    <Globe size={15} color="#10b981" />
                    <span>{language === 'am' ? 'አማርኛ' : 'English'}</span>
                </button>
            </div>

            <div className="auth-container" style={{ maxWidth: '420px', width: '100%', background: '#1e293b', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="auth-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(16, 185, 129, 0.12)', borderRadius: '50%', color: '#10b981', marginBottom: '1.2rem', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                        <ShieldCheck size={40} />
                    </div>
                    <h1 style={{ fontSize: '1.7rem', fontWeight: '800', color: '#f8fafc', marginBottom: '0.4rem', letterSpacing: '-0.5px' }}>
                        {isAmharic ? 'የአስተዳዳሪ ደህንነት በር' : 'Admin Security Access'}
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.4' }}>
                        {isAmharic ? 'የአስተዳዳሪ ዳሽቦርድ ለመክፈት የይለፍ ቃልዎን ያስገቡ' : 'Enter master password to decrypt and unlock the management console'}
                    </p>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        color: '#fca5a5',
                        padding: '0.85rem 1.1rem',
                        borderRadius: '12px',
                        marginBottom: '1.5rem',
                        fontSize: '0.88rem',
                        lineHeight: '1.4'
                    }}>
                        <strong>{isAmharic ? 'ስህተት:' : 'Error:'}</strong> {error}
                    </div>
                )}

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <KeyRound size={15} color="#10b981" />
                            {isAmharic ? 'የአስተዳዳሪ የይለፍ ቃል' : 'Admin Password'}
                        </label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <div style={{ position: 'absolute', left: '14px', color: '#64748b', pointerEvents: 'none' }}>
                                <Lock size={18} />
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={isAmharic ? 'የይለፍ ቃልዎን ያስገቡ...' : 'Enter admin password...'}
                                autoFocus
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.9rem 2.8rem 0.9rem 2.8rem',
                                    borderRadius: '12px',
                                    border: '1px solid #334155',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    background: '#0f172a',
                                    color: '#f8fafc',
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    background: 'none',
                                    border: 'none',
                                    color: '#64748b',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                {showPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            padding: '0.95rem',
                            borderRadius: '12px',
                            fontWeight: '700',
                            fontSize: '1rem',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35)',
                        }}
                    >
                        {loading ? (isAmharic ? 'በማረጋገጥ ላይ...' : 'Verifying...') : (isAmharic ? 'ዳሽቦርድ ክፈት' : 'Unlock Admin Console')}
                        <ArrowRight size={18} />
                    </button>
                </form>

                {/* Encrypted Session Footer */}
                <div style={{ marginTop: '2rem', paddingTop: '1.2rem', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#64748b' }}>
                        <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} />
                        {isAmharic ? '256-ቢት የተመሰጠረ ደህንነቱ የተጠበቀ ክፍለ ጊዜ' : '256-Bit Encrypted Secure Admin Session'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
