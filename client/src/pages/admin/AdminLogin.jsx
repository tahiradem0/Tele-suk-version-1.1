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

        const result = await login(phone, password);

        if (result.success) {
            // Check if user is actually admin
            // The login function in context updates the user state
            // We can check the localstorage or the returned data
            const storedUser = JSON.parse(localStorage.getItem('user'));
            if (storedUser && storedUser.isAdmin) {
                navigate('/admin/dashboard');
            } else {
                setError('Access Denied: You do not have admin permissions.');
                // Optional: logout if they are not admin
            }
        } else {
            setError(result.error || 'Login failed');
        }
        setLoading(false);
    };

    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8f9fc'
        }}>
            <div style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '24px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                width: '100%',
                maxWidth: '400px',
                textAlign: 'center'
            }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    background: '#1a1b1e',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem auto'
                }}>
                    <Lock color="white" size={32} />
                </div>

                <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>Admin Access</h1>
                <p style={{ color: '#868e96', marginBottom: '2rem' }}>Login with your admin credentials</p>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input
                        type="tel"
                        placeholder="Phone Number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        style={{
                            padding: '1rem',
                            borderRadius: '12px',
                            border: '1px solid #eee',
                            fontSize: '1rem',
                            outline: 'none',
                            background: '#f8f9fc',
                            transition: 'border 0.2s',
                        }}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{
                            padding: '1rem',
                            borderRadius: '12px',
                            border: '1px solid #eee',
                            fontSize: '1rem',
                            outline: 'none',
                            background: '#f8f9fc',
                            transition: 'border 0.2s',
                        }}
                    />

                    {error && <p style={{ color: '#ff4444', fontSize: '0.9rem', textAlign: 'left' }}>{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            background: '#1a1b1e',
                            color: 'white',
                            padding: '1rem',
                            borderRadius: '12px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            marginTop: '0.5rem',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Verifying...' : 'Access Dashboard'} <ArrowRight size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
