import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import './Auth.css';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const { login, register } = useShop(); // Destructure register
    const navigate = useNavigate();
    const location = useLocation();

    const [formData, setFormData] = useState({
        username: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Simple mock validation
        if (!formData.phone || !formData.password) return;

        if (!isLogin) {
            if (formData.password !== formData.confirmPassword) {
                alert("Passwords do not match");
                return;
            }
        }

        let result;
        if (isLogin) {
            result = await login(formData.phone, formData.password);
        } else {
            result = await register({
                name: formData.username,
                phone: formData.phone,
                password: formData.password
            });
        }

        if (result.success) {
            if (location.search.includes('redirect=cart')) {
                navigate('/cart');
            } else {
                navigate('/profile');
            }
        } else {
            alert(result.error);
        }
    };

    return (
        <div className="page auth-page">
            <div className="auth-container">
                <div className="auth-header">
                    <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
                    <p>{isLogin ? 'Login to continue' : 'Sign up to get started'}</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className="form-group">
                            <label>Username</label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="e.g. Abebe Kebede"
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label>Phone Number</label>
                        <div className="phone-input">
                            <span className="country-code">+251</span>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="912 345 678"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                        />
                    </div>

                    {!isLogin && (
                        <div className="form-group">
                            <label>Confirm Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="••••••••"
                            />
                        </div>
                    )}

                    <button type="submit" className="auth-btn">
                        {isLogin ? 'Login' : 'Sign Up'}
                    </button>
                </form>

                <div className="auth-switch">
                    <p>
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button onClick={() => setIsLogin(!isLogin)}>
                            {isLogin ? 'Sign Up' : 'Login'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Auth;
