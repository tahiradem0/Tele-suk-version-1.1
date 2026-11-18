import React, { useState, useEffect } from 'react';
import { Truck, Edit2, Check, Search, PackageCheck, Clock, User, MapPin } from 'lucide-react';
import { orderService } from '../../../services/api';
import { useAdminLanguage } from '../../../context/AdminLanguageContext';
import CoolSelect from '../../../components/ui/CoolSelect';

const DELIVERY_STATUSES = ['Preparing', 'On the way', 'Delivered'];

const DeliveryManager = () => {
    const { t, isAmharic } = useAdminLanguage();

    // Deliveries State
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [driverEdits, setDriverEdits] = useState({}); // { orderId: 'DriverName' }
    const [editingDriverId, setEditingDriverId] = useState(null);

    useEffect(() => {
        loadDeliveries();
    }, []);

    const loadDeliveries = async () => {
        setLoading(true);
        try {
            const { data } = await orderService.getAll();
            // Filter only active delivery statuses
            const active = data.filter(d => ['Preparing', 'On the way'].includes(d.status));
            setDeliveries(active);
        } catch (error) {
            console.error("Failed to load deliveries", error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            const { data } = await orderService.updateStatus(id, newStatus);
            // If marked as Delivered, remove from active list
            if (newStatus === 'Delivered') {
                setDeliveries(deliveries.filter(d => d._id !== id));
            } else {
                setDeliveries(deliveries.map(d => d._id === id ? data : d));
            }
        } catch (error) {
            console.error("Failed to update delivery status", error);
        }
    };

    const handleDriverSave = async (id) => {
        const driverName = driverEdits[id];
        if (driverName !== undefined) {
            try {
                const { data } = await orderService.updateDriver(id, driverName);
                setDeliveries(deliveries.map(d => d._id === id ? data : d));
                setEditingDriverId(null);
            } catch (error) {
                console.error("Failed to update driver", error);
            }
        }
    };

    // Filter deliveries
    const filteredDeliveries = deliveries.filter(d => {
        if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
        const q = searchQuery.toLowerCase().trim();
        if (!q) return true;
        const orderId = d._id ? d._id.toLowerCase() : '';
        const customer = d.user?.name ? d.user.name.toLowerCase() : '';
        const address = d.shippingAddress?.address ? d.shippingAddress.address.toLowerCase() : '';
        const driver = d.driver ? d.driver.toLowerCase() : '';
        return orderId.includes(q) || customer.includes(q) || address.includes(q) || driver.includes(q);
    });

    const preparingCount = deliveries.filter(d => d.status === 'Preparing').length;
    const onTheWayCount = deliveries.filter(d => d.status === 'On the way').length;

    return (
        <div style={{ padding: '1.5rem', maxWidth: '1000px', margin: '0 auto', color: 'var(--admin-text, #1a1b1e)' }}>
            {/* Header */}
            <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0 0 0.4rem', color: 'var(--admin-text, #1a1b1e)', letterSpacing: '-0.5px' }}>
                        {t('deliveryOperations', 'Delivery Operations')}
                    </h1>
                    <p style={{ color: 'var(--admin-subtext, #868e96)', margin: 0, fontSize: '0.95rem' }}>
                        {t('deliverySubtitle', 'Track active orders in transit, assign drivers, and manage fulfillment.')}
                    </p>
                </div>
            </header>

            {/* Quick Metrics Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{
                    background: 'var(--admin-card-bg, #ffffff)',
                    padding: '1.1rem 1.3rem',
                    borderRadius: '14px',
                    border: '1px solid var(--admin-border, #edf2f7)',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#e7f5ff', color: '#1c7ed6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Truck size={22} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--admin-subtext, #868e96)', fontWeight: '600' }}>
                            {t('activeOrders', 'Active Orders')}
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--admin-text, #1a1b1e)' }}>{deliveries.length}</div>
                    </div>
                </div>

                <div style={{
                    background: 'var(--admin-card-bg, #ffffff)',
                    padding: '1.1rem 1.3rem',
                    borderRadius: '14px',
                    border: '1px solid var(--admin-border, #edf2f7)',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#fff9db', color: '#f59f00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Clock size={22} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--admin-subtext, #868e96)', fontWeight: '600' }}>
                            {t('preparing', 'Preparing')}
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--admin-text, #1a1b1e)' }}>{preparingCount}</div>
                    </div>
                </div>

                <div style={{
                    background: 'var(--admin-card-bg, #ffffff)',
                    padding: '1.1rem 1.3rem',
                    borderRadius: '14px',
                    border: '1px solid var(--admin-border, #edf2f7)',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#e6fcf5', color: '#0ca678', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <PackageCheck size={22} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--admin-subtext, #868e96)', fontWeight: '600' }}>
                            {t('onTheWay', 'On the Way')}
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--admin-text, #1a1b1e)' }}>{onTheWayCount}</div>
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div style={{
                background: 'var(--admin-card-bg, #ffffff)',
                padding: '1rem 1.25rem',
                borderRadius: '14px',
                border: '1px solid var(--admin-border, #edf2f7)',
                marginBottom: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.85rem'
            }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {['ALL', 'Preparing', 'On the way'].map(st => {
                        const label = st === 'ALL'
                            ? t('allActive', 'All Active')
                            : (st === 'Preparing' ? t('preparing', 'Preparing') : t('onTheWay', 'On the way'));
                        return (
                            <button
                                key={st}
                                onClick={() => setStatusFilter(st)}
                                style={{
                                    padding: '6px 14px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: statusFilter === st ? '#1a1b1e' : 'var(--admin-btn-secondary, #f1f3f5)',
                                    color: statusFilter === st ? '#ffffff' : 'var(--admin-text, #495057)',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s'
                                }}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>

                <div style={{ position: 'relative', width: '280px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#adb5bd' }} />
                    <input
                        type="text"
                        placeholder={isAmharic ? 'የትዕዛዝ ቁጥር፣ ደንበኛ፣ አድራሻ፣ አድራሽ ፈልግ...' : 'Search order #, customer, address, driver...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px 12px 8px 36px',
                            borderRadius: '10px',
                            border: '1px solid var(--admin-border, #e2e8f0)',
                            background: 'var(--admin-input-bg, #ffffff)',
                            color: 'var(--admin-text, #1a1b1e)',
                            fontSize: '0.88rem',
                            outline: 'none',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>
            </div>

            {/* DELIVERIES LIST */}
            {loading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--admin-subtext, #868e96)' }}>
                    {t('loading', 'Loading deliveries...')}
                </div>
            ) : filteredDeliveries.length === 0 ? (
                <div style={{
                    background: 'var(--admin-card-bg, #ffffff)',
                    padding: '3.5rem 1.5rem',
                    borderRadius: '16px',
                    textAlign: 'center',
                    color: 'var(--admin-subtext, #868e96)',
                    border: '1px solid var(--admin-border, #edf2f7)'
                }}>
                    <Truck size={42} style={{ margin: '0 auto 14px', opacity: 0.35 }} />
                    <h3 style={{ margin: '0 0 6px', fontSize: '1.15rem', color: 'var(--admin-text, #1a1b1e)' }}>
                        {t('noActiveDeliveries', 'No Active Deliveries')}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>
                        {searchQuery || statusFilter !== 'ALL'
                            ? (isAmharic ? 'ከተመረጠው ማጣሪያ ጋር የሚዛመድ ማድረስ አልተገኘም።' : 'No deliveries match the selected filters.')
                            : t('noDeliveriesDesc', 'Orders marked as "Preparing" or "On the way" will appear here for driver assignment and tracking.')}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {filteredDeliveries.map(d => {
                        const statusBadgeText = d.status === 'Preparing'
                            ? t('preparing', 'Preparing')
                            : (d.status === 'On the way' ? t('onTheWay', 'On the way') : t('delivered', 'Delivered'));

                        return (
                            <div
                                key={d._id}
                                style={{
                                    background: 'var(--admin-card-bg, #ffffff)',
                                    padding: '1.4rem',
                                    borderRadius: '16px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                                    border: '1px solid var(--admin-border, #edf2f7)',
                                    transition: 'transform 0.15s, box-shadow 0.15s'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <h3 style={{ fontWeight: '800', fontSize: '1.15rem', margin: 0, color: 'var(--admin-text, #1a1b1e)' }}>
                                                #{d._id.slice(-6).toUpperCase()}
                                            </h3>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                padding: '2px 8px',
                                                borderRadius: '6px',
                                                fontWeight: '700',
                                                background: d.status === 'On the way' ? '#e6fcf5' : '#fff9db',
                                                color: d.status === 'On the way' ? '#0ca678' : '#f59f00'
                                            }}>
                                                {statusBadgeText}
                                            </span>
                                        </div>
                                        <p style={{ color: 'var(--admin-subtext, #868e96)', fontSize: '0.9rem', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <User size={15} /> {t('customer', 'Customer')}: <strong style={{ color: 'var(--admin-text, #1a1b1e)' }}>{d.user?.name || (isAmharic ? 'ደንበኛ' : 'Customer')}</strong>
                                            {d.user?.phone && ` (${d.user.phone})`}
                                        </p>
                                        <p style={{ fontSize: '0.92rem', margin: 0, color: 'var(--admin-text, #1a1b1e)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <MapPin size={16} color="#0ca678" />
                                            <strong>{t('destinationAddress', 'Address')}:</strong> {d.shippingAddress?.address || (isAmharic ? 'ምንም አድራሻ አልተሰጠም' : 'No specific address provided')}
                                        </p>
                                    </div>

                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--admin-text, #1a1b1e)' }}>
                                            ETB {d.totalPrice?.toFixed(2) || '0.00'}
                                        </div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--admin-subtext, #868e96)', marginTop: '2px' }}>
                                            {new Date(d.createdAt).toLocaleDateString()} {new Date(d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ borderTop: '1px solid var(--admin-border, #f1f3f5)', paddingTop: '1rem', display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <div style={{ flex: '1 1 200px' }}>
                                        <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--admin-subtext, #868e96)', display: 'block', marginBottom: '5px' }}>
                                            {t('deliveryStatus', 'Delivery Status')}
                                        </label>
                                        <CoolSelect
                                            value={d.status}
                                            onChange={(e) => updateStatus(d._id, e.target.value)}
                                        >
                                            <option value="Preparing">{t('preparing', 'Preparing')}</option>
                                            <option value="On the way">{t('onTheWay', 'On the way')}</option>
                                            <option value="Delivered">{t('delivered', 'Delivered')}</option>
                                        </CoolSelect>
                                    </div>

                                    <div style={{ flex: '1 1 200px' }}>
                                        <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--admin-subtext, #868e96)', display: 'block', marginBottom: '5px' }}>
                                            {t('assignedDriver', 'Assigned Driver')}
                                        </label>

                                        {editingDriverId === d._id ? (
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <input
                                                    value={driverEdits[d._id] !== undefined ? driverEdits[d._id] : (d.driver || '')}
                                                    onChange={(e) => setDriverEdits({ ...driverEdits, [d._id]: e.target.value })}
                                                    placeholder={isAmharic ? 'የአድራሽ ስም...' : 'Driver Name...'}
                                                    style={{
                                                        padding: '7px 10px',
                                                        borderRadius: '8px',
                                                        border: '1.5px solid var(--admin-border, #e2e8f0)',
                                                        background: 'var(--admin-input-bg, #ffffff)',
                                                        color: 'var(--admin-text, #1a1b1e)',
                                                        fontSize: '0.88rem',
                                                        flex: 1
                                                    }}
                                                />
                                                <button
                                                    onClick={() => handleDriverSave(d._id)}
                                                    style={{
                                                        background: '#e6fcf5',
                                                        color: '#0ca678',
                                                        border: '1px solid #63e6be',
                                                        padding: '7px 10px',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center'
                                                    }}
                                                    title={t('saveDriver', 'Save Driver')}
                                                >
                                                    <Check size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{
                                                fontWeight: '600',
                                                fontSize: '0.9rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '7px 12px',
                                                borderRadius: '8px',
                                                background: 'var(--admin-inner-bg, #f8f9fa)',
                                                border: '1px solid var(--admin-border, #e9ecef)'
                                            }}>
                                                <span>{d.driver || <span style={{ color: '#adb5bd', fontWeight: 'normal' }}>{t('unassigned', 'Unassigned')}</span>}</span>
                                                <button
                                                    onClick={() => {
                                                        setEditingDriverId(d._id);
                                                        setDriverEdits({ ...driverEdits, [d._id]: d.driver || '' });
                                                    }}
                                                    style={{
                                                        color: '#1c7ed6',
                                                        border: 'none',
                                                        background: 'none',
                                                        cursor: 'pointer',
                                                        padding: '2px 6px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        fontSize: '0.8rem'
                                                    }}
                                                >
                                                    <Edit2 size={14} /> {t('assign', 'Assign')}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default DeliveryManager;
