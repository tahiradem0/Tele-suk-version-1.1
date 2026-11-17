import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../../context/ShopContext';
import { Eye, EyeOff, ShieldCheck, User, Lock, Phone, ArrowRight, Globe } from 'lucide-react';
import { useAdminLanguage } from '../../context/AdminLanguageContext';
import '../Auth.css';

const AdminLogin = () => {
    const { language, toggleLanguage, isAmharic } = useAdminLanguage();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useShop();

    const handleLogin = async (e) => {
        if (e) e.preventDefault();
        setError('');

        const trimmedId = identifier.trim();
        const trimmedPw = password.trim();

        if (!trimmedId || !trimmedPw) {
            setError(isAmharic ? 'እባክዎ ስልክ ቁጥር ወይም ኢሜይል እና የይለፍ ቃል ያስገቡ።' : 'Please enter both your phone/email and password.');
            return;
        }

        setLoading(true);

        try {
            console.log('🔐 Admin Login Attempt for:', trimmedId);
            const result = await login(trimmedId, trimmedPw);
            console.log('📡 Login result:', result);

            if (result.success) {
                const storedUser = JSON.parse(localStorage.getItem('user'));
                console.log('👤 Stored user session:', storedUser);

                if (storedUser && storedUser.isAdmin) {
                    console.log('✅ Admin verified! Navigating to dashboard...');
                    navigate('/admin/dashboard', { replace: true });
                } else {
                    console.error('❌ User is not an admin:', storedUser);
                    setError(isAmharic ? 'ፍቃድ ተከልክሏል፡ ይህ መለያ የአስተዳዳሪ ፍቃድ የለውም።' : 'Access Denied: This account does not have admin permissions.');
                    localStorage.removeItem('user');
                }
            } else {
                console.error('❌ Login failed:', result.error);
                setError(result.error || (isAmharic ? 'የተሳሳተ መረጃ። እባክዎ ስልክ ቁጥር ወይም የይለፍ ቃልዎን ያረጋግጡ።' : 'Invalid credentials. Please verify your phone number or password.'));
            }
        } catch (err) {
            console.error('💥 Login Exception:', err);
            if (err.message === 'Network Error') {
                setError(isAmharic ? 'የኔትወርክ ስህተት፡ ከአገልጋዩ ጋር መገናኘት አልተቻለም።' : 'Network Error: Cannot connect to backend server. Make sure the server on port 5000 is active.');
            } else {
                setError(`Error: ${err.message || (isAmharic ? 'ያልተጠበቀ ስህተት አጋጥሟል።' : 'An unexpected error occurred.')}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page auth-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: '#f8f9fa', position: 'relative' }}>
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
                        border: '1px solid #dee2e6',
                        background: 'white',
                        fontWeight: '700',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        color: '#1a1b1e',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                    }}
                >
                    <Globe size={15} color="#10b981" />
                    <span>{language === 'am' ? 'አማርኛ' : 'English'}</span>
                </button>
            </div>

            <div className="auth-container" style={{ maxWidth: '440px', width: '100%', background: '#ffffff', borderRadius: '20px', padding: '2.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', border: '1px solid #edf2f7' }}>
                <div className="auth-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'inline-flex', padding: '12px', background: '#e6fcf5', borderRadius: '50%', color: '#0ca678', marginBottom: '1rem' }}>
                        <ShieldCheck size={36} />
                    </div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1a1b1e', marginBottom: '0.4rem' }}>
                        {isAmharic ? 'የአስተዳዳሪ መግቢያ በር' : 'Admin Portal'}
                    </h1>
                    <p style={{ color: '#868e96', fontSize: '0.92rem' }}>
                        {isAmharic ? 'የቴሌ-ሱቅ አስተዳዳሪ ኮንሶልን ለመጠቀም መረጃዎን ያስገቡ' : 'Enter your credentials to access the Tele-Suk management console'}
                    </p>
                </div>

                {error && (
                    <div style={{
                        background: '#fff5f5',
                        border: '1px solid #ffc9c9',
                        color: '#e03131',
                        padding: '0.9rem 1.2rem',
                        borderRadius: '12px',
                        marginBottom: '1.5rem',
                        fontSize: '0.88rem',
                        lineHeight: '1.4'
                    }}>
                        <strong>{isAmharic ? 'ስህተት:' : 'Error:'}</strong> {error}
                    </div>
                )}

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.88rem', fontWeight: '600', color: '#343a40' }}>
                            {isAmharic ? 'ስልክ ቁጥር ወይም ኢሜይል' : 'Phone Number or Admin Email'}
                        </label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <div style={{ position: 'absolute', left: '12px', color: '#adb5bd', pointerEvents: 'none' }}>
                                <User size={18} />
                            </div>
                            <input
                                type="text"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder={isAmharic ? 'ስልክ ቁጥር ወይም ኢሜይል ያስገቡ' : 'Enter phone number or email'}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.8rem 0.8rem 0.8rem 2.5rem',
                                    borderRadius: '10px',
                                    border: '1px solid #ced4da',
                                    fontSize: '0.95rem',
                                    outline: 'none',
                                    transition: 'border 0.2s',
                                    background: '#f8f9fa'
                                }}
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.88rem', fontWeight: '600', color: '#343a40' }}>
                            {isAmharic ? 'የይለፍ ቃል' : 'Password'}
                        </label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <div style={{ position: 'absolute', left: '12px', color: '#adb5bd', pointerEvents: 'none' }}>
                                <Lock size={18} />
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={isAmharic ? 'የአስተዳዳሪ የይለፍ ቃል ያስገቡ' : 'Enter admin password'}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.8rem 2.6rem 0.8rem 2.5rem',
                                    borderRadius: '10px',
                                    border: '1px solid #ced4da',
                                    fontSize: '0.95rem',
                                    outline: 'none',
                                    transition: 'border 0.2s',
                                    background: '#f8f9fa'
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    background: 'none',
                                    border: 'none',
                                    color: '#868e96',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                            padding: '0.9rem',
                            borderRadius: '12px',
                            fontWeight: '700',
                            fontSize: '1rem',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                            marginTop: '0.5rem'
                        }}
                    >
                        {loading ? (isAmharic ? 'በማረጋገጥ ላይ...' : 'Authenticating...') : (isAmharic ? 'ዳሽቦርድ ግባ' : 'Access Dashboard')}
                        <ArrowRight size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
