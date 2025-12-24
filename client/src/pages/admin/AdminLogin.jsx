import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import '../../styles/global.css';

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
                    navigate('/admin/dashboard');
                } else {
                    console.error('❌ User is not an admin:', storedUser);
                    setError(`Access Denied: You do not have admin permissions. isAdmin: ${storedUser?.isAdmin}`);
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
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '1rem'
        }}>
            <div style={{
                background: 'white',
                padding: '2.5rem',
                borderRadius: '20px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                width: '100%',
                maxWidth: '400px'
            }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem', textAlign: 'center' }}>
                    Admin Login
                </h1>
                <p style={{ color: '#868e96', textAlign: 'center', marginBottom: '2rem' }}>
                    Enter your credentials to access the admin panel
                </p>

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

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#495057' }}>
                            Phone Number
                        </label>
                        <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Enter phone number"
                            required
                            style={{
                                width: '100%',
                                padding: '0.8rem',
                                borderRadius: '8px',
                                border: '1px solid #ddd',
                                fontSize: '1rem'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#495057' }}>
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            required
                            style={{
                                width: '100%',
                                padding: '0.8rem',
                                borderRadius: '8px',
                                border: '1px solid #ddd',
                                fontSize: '1rem'
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? 'Logging in...' : 'Access Dashboard'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
