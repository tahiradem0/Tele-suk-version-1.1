import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../../context/ShopContext';
import '../Auth.css';

const AdminLogin = () => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useShop();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        console.log('🔐 Admin Login Attempt:', { phone, passwordLength: password.length });

        try {
            const result = await login(phone, password);
            console.log('📡 Login API Response:', result);


            if (result.success) {
                const storedUser = JSON.parse(localStorage.getItem('user'));
                console.log('👤 Stored User:', storedUser);

                if (storedUser && storedUser.isAdmin) {
                    console.log('✅ Admin verified, redirecting to dashboard...');
                    // Use window.location for more reliable redirect in production
                    window.location.href = '/admin/dashboard';
                } else {
                    console.error('❌ User is not an admin:', storedUser);
                    setError(`Access Denied: You do not have admin permissions.`);
                    localStorage.removeItem('user');
                }
            } else {
                console.error('❌ Login failed:', result.error);
                setError(result.error || 'Login failed. Please check your credentials.');
            }
        } catch (error) {
            console.error('💥 Login Exception:', error);
            if (error.message === 'Network Error') {
                setError('Network Error: Cannot connect to server. Please check if the backend is running.');
            } else {
                setError(`Error: ${error.message || 'An unexpected error occurred'}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page auth-page">
            <div className="auth-container">
                <div className="auth-header">
                    <h1>Admin Login</h1>
                    <p>Enter your credentials to access the admin panel</p>
                </div>

                {error && (
                    <div style={{
                        background: '#fee',
                        border: '1px solid #fcc',
                        color: '#c33',
                        padding: '1rem',
                        borderRadius: '8px',
                        marginBottom: '1.5rem',
                        fontSize: '0.9rem',
                        wordBreak: 'break-word'
                    }}>
                        <strong>Error:</strong> {error}
                    </div>
                )}

                <form className="auth-form" onSubmit={handleLogin}>
                    <div className="form-group">
                        <label>Phone Number</label>
                        <div className="phone-input">
                            {/* Assuming country code is fixed as per Auth.jsx, or we can make it part of input if needed. 
                                 Auth.jsx hardcodes +251. Sticking to consistency. */}
                            <span className="country-code">+251</span>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="912 345 678"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="auth-btn"
                        disabled={loading}
                        style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                    >
                        {loading ? 'Logging in...' : 'Access Dashboard'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
