import React, { useState, useEffect } from 'react';
import { User, History, Send } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../services/api';
import './Profile.css';

const Profile = () => {
    const { user, logout } = useShop();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        if (user) {
            orderService.getMyOrders()
                .then(res => setOrders(res.data))
                .catch(err => console.error("Failed to fetch orders", err));
        }
    }, [user]);

    if (!user) {
        return (
            <div className="page profile-page guest">
                <div className="guest-content">
                    <User size={64} className="guest-icon" />
                    <h2>Guest Mode</h2>
                    <p>Login to view your history and profile.</p>
                    <button className="login-btn" onClick={() => navigate('/auth')}>Login / Signup</button>
                </div>
            </div>
        );
    }

    return (
        <div className="page profile-page">
            <header className="profile-header">
                <h1>Your Profile</h1>
                <button className="logout-btn" onClick={() => { logout(); navigate('/'); }}>Logout</button>
            </header>

            <div className="profile-card">
                <div className="avatar">
                    <span>{user.name.charAt(0)}</span>
                </div>
                <div className="info">
                    <h2>{user.name}</h2>
                    <p>+251 {user.phone}</p>
                    <span className="join-date">Member since 2024</span>
                </div>
            </div>

            <div className="history-section">
                <h3>Transaction History</h3>
                <div className="history-list">
                    {orders.length > 0 ? (
                        orders.map(order => (
                            <div key={order._id} className="history-item">
                                <div className="txn-icon">
                                    <History size={20} />
                                </div>
                                <div className="txn-details">
                                    <h4>{order.orderItems.map(i => i.name).join(', ')}</h4>
                                    <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className={`txn-status status-${order.status.toLowerCase()}`}>
                                    {order.status}
                                </div>
                                <div className="txn-amount">
                                    ETB {order.totalPrice.toFixed(2)}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-history">
                            <p>No transactions yet.</p>
                        </div>
                    )}
                </div>
            </div>

            <button className="feedback-btn">
                <Send size={18} />
                <span>Send Feedback (Telegram)</span>
            </button>

            <div style={{ height: 100 }}></div>
        </div>
    );
};

export default Profile;
