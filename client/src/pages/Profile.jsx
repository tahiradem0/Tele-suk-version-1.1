import React, { useState, useEffect, useCallback } from 'react';
import { User, History, Send, RefreshCw } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../services/api';
import './Profile.css';

const Profile = () => {
    const { user, logout } = useShop();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOrders = useCallback(async (showSpinner = false) => {
        if (!user) return;
        if (showSpinner) setRefreshing(true);
        try {
            const res = await orderService.getMyOrders();
            // Sort newest first (backend already sorts, but this is a safety net)
            const sorted = [...res.data].sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
            );
            setOrders(sorted);
        } catch (err) {
            console.error("Failed to fetch orders", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    // Initial fetch
    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // Auto-refresh every 15 seconds for real-time updates
    useEffect(() => {
        if (!user) return;
        const interval = setInterval(() => fetchOrders(), 15000);
        return () => clearInterval(interval);
    }, [user, fetchOrders]);

    // Refetch when window regains focus (e.g. user comes back from Chapa payment)
    useEffect(() => {
        const handleFocus = () => fetchOrders();
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [fetchOrders]);

    const memberSince = user?.createdAt 
        ? new Date(user.createdAt).getFullYear() 
        : new Date().getFullYear();

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
                    <span className="join-date">Member since {memberSince}</span>
                </div>
            </div>

            <div className="history-section">
                <div className="history-header">
                    <h3>Transaction History</h3>
                    <button 
                        className={`refresh-btn ${refreshing ? 'spinning' : ''}`} 
                        onClick={() => fetchOrders(true)}
                        disabled={refreshing}
                        title="Refresh orders"
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>
                <div className="history-list">
                    {loading ? (
                        <div className="no-history">
                            <p>Loading orders...</p>
                        </div>
                    ) : orders.length > 0 ? (
                        orders.map(order => (
                            <div key={order._id} className="history-item">
                                <div className="txn-icon">
                                    <History size={20} />
                                </div>
                                <div className="txn-details">
                                    <h4>{order.orderItems.map(i => i.name).join(', ')}</h4>
                                    <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className={`txn-status status-${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
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