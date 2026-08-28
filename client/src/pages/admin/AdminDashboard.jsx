import React from 'react';
import { TrendingUp, Users, ShoppingBag, DollarSign, Settings as SettingsIcon } from 'lucide-react';
import { settingsService } from '../../services/api';

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
    const [deliveryFee, setDeliveryFee] = React.useState('');
    const [isSaving, setIsSaving] = React.useState(false);

    React.useEffect(() => {
        loadStats();
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const { data } = await settingsService.getSettings();
            if (data) setDeliveryFee(data.deliveryFee.toString());
        } catch (error) {
            console.error("Failed to load settings", error);
        }
    };

    const handleSaveSettings = async () => {
        try {
            setIsSaving(true);
            await settingsService.updateSettings({ deliveryFee: Number(deliveryFee) });
            alert('Settings saved successfully!');
        } catch (error) {
            console.error('Failed to save settings', error);
            alert('Error saving settings');
        } finally {
            setIsSaving(false);
        }
    };

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

            {/* Store Settings Section */}
            <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                marginBottom: '3rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <SettingsIcon size={24} color="#3b82f6" />
                    <h2 style={{ fontSize: '1.3rem', fontWeight: '700' }}>Store Settings</h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', color: '#495057', marginBottom: '0.5rem', fontWeight: '500' }}>
                            Standard Delivery Fee (ETB)
                        </label>
                        <input 
                            type="number" 
                            value={deliveryFee}
                            onChange={(e) => setDeliveryFee(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                border: '1px solid #ced4da',
                                borderRadius: '8px',
                                outline: 'none',
                                fontSize: '1rem'
                            }}
                        />
                    </div>
                    <button 
                        onClick={handleSaveSettings}
                        disabled={isSaving}
                        style={{
                            background: '#212529',
                            color: 'white',
                            padding: '12px',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: isSaving ? 'not-allowed' : 'pointer',
                            opacity: isSaving ? 0.7 : 1
                        }}
                    >
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
