import React from 'react';
import { TrendingUp, Users, ShoppingBag, DollarSign } from 'lucide-react';

const StatCard = ({ title, value, change, icon: Icon, color }) => (
    <div style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#868e96', fontSize: '0.9rem' }}>{title}</span>
            <div style={{
                padding: '8px',
                borderRadius: '10px',
                background: `${color}15`,
                color: color
            }}>
                <Icon size={20} />
            </div>
        </div>
        <h3 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#1a1b1e' }}>{value}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
            <span style={{ color: '#10b981', fontWeight: '500' }}>{change}</span>
            <span style={{ color: '#868e96' }}>from last month</span>
        </div>
    </div>
);

const AdminDashboard = () => {
    const [stats, setStats] = React.useState({
        totalRevenue: 0,
        ordersCount: 0,
        usersCount: 0,
        productsCount: 0
    });

    React.useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const { data } = await import('../../services/api').then(m => m.adminService.getStats());
            setStats(data);
        } catch (error) {
            console.error("Failed to load stats", error);
        }
    };

    return (
        <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Dashboard</h1>
                <p style={{ color: '#868e96' }}>Welcome back to your control room.</p>
            </header>

            {/* Stats Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.5rem',
                marginBottom: '3rem'
            }}>
                <StatCard
                    title="Total Revenue"
                    value={`ETB ${stats.totalRevenue.toLocaleString()}`}
                    change="Verified"
                    icon={DollarSign}
                    color="#10b981"
                />
                <StatCard
                    title="Total Orders"
                    value={stats.ordersCount}
                    change="Active"
                    icon={ShoppingBag}
                    color="#3b82f6"
                />
                <StatCard
                    title="Total Users"
                    value={stats.usersCount}
                    change="Registered"
                    icon={Users}
                    color="#8b5cf6"
                />
                <StatCard
                    title="Total Products"
                    value={stats.productsCount}
                    change="In Inventory"
                    icon={TrendingUp}
                    color="#f59e0b"
                />
            </div>
        </div>
    );
};

export default AdminDashboard;
