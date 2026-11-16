import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    TrendingUp, Users, ShoppingBag, DollarSign, Settings as SettingsIcon,
    Warehouse, Coins, Receipt, AlertTriangle, ArrowRight, Wallet, UserPlus, UserMinus
} from 'lucide-react';
import { settingsService, adminService } from '../../services/api';
import { useShop } from '../../context/ShopContext';

const StatCard = ({ title, value, change, icon: Icon, color, linkTo }) => {
    const cardContent = (
        <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            height: '100%',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: linkTo ? 'pointer' : 'default'
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
            <h3 style={{ fontSize: '1.7rem', fontWeight: '700', color: '#1a1b1e' }}>{value}</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                <span style={{ color: color, fontWeight: '600' }}>{change}</span>
                {linkTo && <ArrowRight size={14} color="#868e96" />}
            </div>
        </div>
    );

    if (linkTo) {
        return (
            <Link to={linkTo} style={{ textDecoration: 'none', color: 'inherit' }}>
                {cardContent}
            </Link>
        );
    }
    return cardContent;
};

const AdminDashboard = () => {
    const { refreshSettings } = useShop();
    const [stats, setStats] = useState({
        totalRevenue: 0,
        ordersCount: 0,
        usersCount: 0,
        productsCount: 0,
        netCapital: 0,
        totalInflow: 0,
        totalOutflow: 0,
        totalReceivables: 0,
        totalPayables: 0,
        totalStockUnits: 0,
        totalInventoryCost: 0,
        lowStockCount: 0,
    });
    const [deliveryFee, setDeliveryFee] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
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
            if (refreshSettings) await refreshSettings();
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
            const { data } = await adminService.getStats();
            setStats(data);
        } catch (error) {
            console.error("Failed to load stats", error);
        }
    };

    return (
        <div style={{ padding: '1.5rem', maxWidth: '1240px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Business Control Center</h1>
                <p style={{ color: '#868e96' }}>Comprehensive overview of store inventory, capital cash flow, orders, and credit debts.</p>
            </header>

            {/* Low Stock Warning Banner */}
            {stats.lowStockCount > 0 && (
                <div style={{
                    background: '#fff9db',
                    border: '1px solid #ffe066',
                    borderRadius: '14px',
                    padding: '1rem 1.4rem',
                    marginBottom: '2rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <AlertTriangle size={24} color="#f08c00" />
                        <div>
                            <strong style={{ color: '#d9480f', fontSize: '0.95rem' }}>Inventory Stock Alert:</strong>{' '}
                            <span style={{ color: '#495057', fontSize: '0.9rem' }}>
                                <strong>{stats.lowStockCount}</strong> product(s) have reached low stock or are completely out of stock.
                            </span>
                        </div>
                    </div>
                    <Link
                        to="/admin/store"
                        style={{
                            background: '#f08c00',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            fontWeight: '600',
                            fontSize: '0.85rem'
                        }}
                    >
                        Restock Inventory →
                    </Link>
                </div>
            )}

            {/* Top Stats Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.2rem',
                marginBottom: '2rem'
            }}>
                <StatCard
                    title="Available Capital Treasury"
                    value={`ETB ${(stats.netCapital || 0).toLocaleString()}`}
                    change="Net Liquid Cash"
                    icon={Wallet}
                    color="#10b981"
                    linkTo="/admin/capital"
                />
                <StatCard
                    title="Customer Credit (Receivable)"
                    value={`ETB ${(stats.totalReceivables || 0).toLocaleString()}`}
                    change="Owed To Store"
                    icon={UserPlus}
                    color="#228be6"
                    linkTo="/admin/debt-credit"
                />
                <StatCard
                    title="Store Liabilities (Payable)"
                    value={`ETB ${(stats.totalPayables || 0).toLocaleString()}`}
                    change="Store Owes Suppliers"
                    icon={UserMinus}
                    color="#fa5252"
                    linkTo="/admin/debt-credit"
                />
                <StatCard
                    title="Store Stock Valuation"
                    value={`ETB ${(stats.totalInventoryCost || 0).toLocaleString()}`}
                    change={`${(stats.totalStockUnits || 0).toLocaleString()} units in store`}
                    icon={Warehouse}
                    color="#f59f00"
                    linkTo="/admin/store"
                />
            </div>

            {/* Sales & Activity Stats */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.2rem',
                marginBottom: '2.5rem'
            }}>
                <StatCard
                    title="Total Sales Revenue"
                    value={`ETB ${(stats.totalRevenue || 0).toLocaleString()}`}
                    change="Orders Revenue"
                    icon={DollarSign}
                    color="#10b981"
                    linkTo="/admin/orders"
                />
                <StatCard
                    title="Total Orders"
                    value={stats.ordersCount || 0}
                    change="Customer Orders"
                    icon={ShoppingBag}
                    color="#3b82f6"
                    linkTo="/admin/orders"
                />
                <StatCard
                    title="Registered Users"
                    value={stats.usersCount || 0}
                    change="Active Customer Base"
                    icon={Users}
                    color="#8b5cf6"
                    linkTo="/admin/users"
                />
                <StatCard
                    title="Unique Products"
                    value={stats.productsCount || 0}
                    change="Catalog Items"
                    icon={TrendingUp}
                    color="#e8590c"
                    linkTo="/admin/products"
                />
            </div>

            {/* Quick Management Navigation Hub */}
            <div style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1rem', color: '#1a1b1e' }}>
                    Enterprise Management Hub
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.2rem' }}>
                    <Link
                        to="/admin/store"
                        style={{
                            background: 'white',
                            padding: '1.5rem',
                            borderRadius: '16px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                            textDecoration: 'none',
                            color: 'inherit',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.6rem',
                            border: '1px solid #eee'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ padding: '10px', borderRadius: '10px', background: '#fff4e6', color: '#d9480f' }}>
                                <Warehouse size={22} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1a1b1e' }}>Store & Stock Management</h3>
                                <div style={{ fontSize: '0.8rem', color: '#868e96' }}>Restock, count inventory & cost valuation</div>
                            </div>
                        </div>
                    </Link>

                    <Link
                        to="/admin/capital"
                        style={{
                            background: 'white',
                            padding: '1.5rem',
                            borderRadius: '16px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                            textDecoration: 'none',
                            color: 'inherit',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.6rem',
                            border: '1px solid #eee'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ padding: '10px', borderRadius: '10px', background: '#ebfbee', color: '#2b8a3e' }}>
                                <Coins size={22} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1a1b1e' }}>Capital Management</h3>
                                <div style={{ fontSize: '0.8rem', color: '#868e96' }}>Cash flow, owner equity & business expenses</div>
                            </div>
                        </div>
                    </Link>

                    <Link
                        to="/admin/debt-credit"
                        style={{
                            background: 'white',
                            padding: '1.5rem',
                            borderRadius: '16px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                            textDecoration: 'none',
                            color: 'inherit',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.6rem',
                            border: '1px solid #eee'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ padding: '10px', borderRadius: '10px', background: '#e7f5ff', color: '#1c7ed6' }}>
                                <Receipt size={22} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1a1b1e' }}>Debt & Credit Ledger</h3>
                                <div style={{ fontSize: '0.8rem', color: '#868e96' }}>Customer credit receivables & supplier payables</div>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Delivery Settings Section */}
            <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                marginBottom: '2rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <SettingsIcon size={24} color="#3b82f6" />
                    <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Store Delivery Settings</h2>
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
