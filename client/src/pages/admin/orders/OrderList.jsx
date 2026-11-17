import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, ChevronDown, X } from 'lucide-react';
import { orderService } from '../../../services/api';
import { useAdminLanguage } from '../../../context/AdminLanguageContext';

const STATUS_COLORS = {
    'Pending': '#f59e0b',
    'Confirmed': '#3b82f6',
    'Preparing': '#8b5cf6',
    'On the way': '#8b5cf6',
    'Delivered': '#10b981',
    'Cancelled': '#ef4444',
};

const STATUS_AMHARIC = {
    'Pending': 'በመጠባበቅ ላይ',
    'Confirmed': 'የተረጋገጠ',
    'Preparing': 'በመዘጋጀት ላይ',
    'On the way': 'በመንገድ ላይ',
    'Delivered': 'የደረሰ',
    'Cancelled': 'የተሰረዘ',
};

const OrderList = () => {
    const { isAmharic } = useAdminLanguage();
    const [orders, setOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [checkedOrders, setCheckedOrders] = useState({});

    useEffect(() => {
        loadOrders();
        // Load checked orders from localStorage
        const saved = localStorage.getItem('checkedOrders');
        if (saved) {
            try {
                setCheckedOrders(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse checked orders', e);
            }
        }
    }, []);

    const loadOrders = async () => {
        try {
            const { data } = await orderService.getAll();
            setOrders(data);
        } catch (error) {
            console.error("Failed to load orders", error);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            const { data } = await orderService.updateStatus(id, newStatus);
            setOrders(orders.map(o => o._id === id ? data : o));
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    const handleCheckOrder = (orderId) => {
        const newChecked = { ...checkedOrders, [orderId]: !checkedOrders[orderId] };
        setCheckedOrders(newChecked);
        localStorage.setItem('checkedOrders', JSON.stringify(newChecked));
    };

    const filteredOrders = orders.filter(o => {
        const orderId = o._id.toLowerCase();
        const userName = o.user?.name?.toLowerCase() || '';
        return orderId.includes(searchTerm.toLowerCase()) || userName.includes(searchTerm.toLowerCase());
    });

    const getStatusLabel = (s) => (isAmharic && STATUS_AMHARIC[s]) ? STATUS_AMHARIC[s] : s;

    return (
        <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '700' }}>{isAmharic ? 'ትዕዛዞች' : 'Orders'}</h1>
                <p style={{ color: '#868e96' }}>{isAmharic ? 'የደንበኞችን ትዕዛዞች ይከታተሉ እና ያስተዳድሩ' : 'Track and manage customer orders'}</p>
            </header>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px', position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Search size={20} style={{ position: 'absolute', left: '1rem', color: '#868e96' }} />
                    <input
                        type="text"
                        placeholder={isAmharic ? 'ትዕዛዞችን ፈልግ...' : 'Search orders...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem', borderRadius: '12px', border: '1px solid #eee', outline: 'none' }}
                    />
                </div>
            </div>

            {/* Desktop Table */}
            <div className="desktop-table-container" style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden', display: 'none' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8f9fc', borderBottom: '1px solid #eee' }}>
                        <tr>
                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: '#868e96', fontWeight: '600' }}>✓</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: '#868e96', fontWeight: '600' }}>{isAmharic ? 'የትዕዛዝ ቁጥር' : 'Order ID'}</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: '#868e96', fontWeight: '600' }}>{isAmharic ? 'ደንበኛ' : 'Customer'}</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: '#868e96', fontWeight: '600' }}>{isAmharic ? 'ዕቃዎች' : 'Items'}</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: '#868e96', fontWeight: '600' }}>{isAmharic ? 'ጠቅላላ' : 'Total'}</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: '#868e96', fontWeight: '600' }}>{isAmharic ? 'ቀን' : 'Date'}</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: '#868e96', fontWeight: '600' }}>{isAmharic ? 'ሁኔታ' : 'Status'}</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: '#868e96', fontWeight: '600' }}>{isAmharic ? 'እርምጃዎች' : 'Actions'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.map(order => (
                            <tr key={order._id} style={{ borderBottom: '1px solid #f1f3f5' }}>
                                <td style={{ padding: '1rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={!!checkedOrders[order._id]}
                                        onChange={() => handleCheckOrder(order._id)}
                                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                    />
                                </td>
                                <td style={{ padding: '1rem', fontWeight: '500', cursor: 'pointer' }} onClick={() => setSelectedOrder(order)}>#{order._id.slice(-6)}</td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: '500' }}>{order.user?.name || (isAmharic ? 'ያልታወቀ' : 'Unknown')}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#868e96' }}>{order.user?.phone || 'N/A'}</div>
                                </td>
                                <td style={{ padding: '1rem', cursor: 'pointer', color: '#3b82f6' }} onClick={() => setSelectedOrder(order)}>
                                    <Eye size={16} style={{ display: 'inline', marginRight: '4px' }} />
                                    {order.orderItems?.length || 0} {isAmharic ? 'ዕቃዎች' : 'items'}
                                </td>
                                <td style={{ padding: '1rem', fontWeight: '600' }}>ETB {order.totalPrice}</td>
                                <td style={{ padding: '1rem', color: '#868e96', fontSize: '0.9rem' }}>
                                    {new Date(order.createdAt).toLocaleDateString()}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        background: `${STATUS_COLORS[order.status] || '#eee'}15`,
                                        color: STATUS_COLORS[order.status] || '#333',
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        fontSize: '0.85rem',
                                        fontWeight: '600',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {getStatusLabel(order.status)}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ position: 'relative', display: 'inline-block' }}>
                                        <select
                                            value=""
                                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                            style={{
                                                padding: '6px',
                                                borderRadius: '8px',
                                                border: '1px solid #eee',
                                                outline: 'none',
                                                cursor: 'pointer',
                                                color: '#1a1b1e',
                                                fontSize: '0.85rem'
                                            }}
                                        >
                                            <option value="" disabled>{isAmharic ? 'ሁኔታ ቀይር' : 'Update Status'}</option>
                                            {Object.keys(STATUS_COLORS).map(s => (
                                                <option key={s} value={s}>{getStatusLabel(s)}</option>
                                            ))}
                                        </select>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Order Details Modal */}
            {selectedOrder && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1rem'
                }} onClick={() => setSelectedOrder(null)}>
                    <div style={{
                        background: 'white',
                        borderRadius: '20px',
                        maxWidth: '600px',
                        width: '100%',
                        maxHeight: '80vh',
                        overflow: 'auto',
                        padding: '2rem'
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                                {isAmharic ? `ትዕዛዝ #${selectedOrder._id.slice(-6)}` : `Order #${selectedOrder._id.slice(-6)}`}
                            </h2>
                            <button onClick={() => setSelectedOrder(null)} style={{ padding: '8px', cursor: 'pointer', background: 'none', border: 'none' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <p style={{ color: '#868e96', marginBottom: '0.5rem' }}>{isAmharic ? 'ደንበኛ:' : 'Customer:'} <strong>{selectedOrder.user?.name}</strong></p>
                            <p style={{ color: '#868e96', marginBottom: '0.5rem' }}>{isAmharic ? 'ስልክ:' : 'Phone:'} <strong>{selectedOrder.user?.phone}</strong></p>
                            <p style={{ color: '#868e96', marginBottom: '0.5rem' }}>{isAmharic ? 'ጠቅላላ:' : 'Total:'} <strong>ETB {selectedOrder.totalPrice}</strong></p>
                            <p style={{ color: '#868e96' }}>{isAmharic ? 'ቀን:' : 'Date:'} <strong>{new Date(selectedOrder.createdAt).toLocaleString()}</strong></p>
                        </div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem' }}>{isAmharic ? 'የትዕዛዝ ዕቃዎች' : 'Order Items'}</h3>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {selectedOrder.orderItems?.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '1rem', padding: '1rem', background: '#f8f9fc', borderRadius: '12px' }}>
                                    <img src={item.image} alt={item.name} style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover' }} />
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{item.name}</h4>
                                        <p style={{ fontSize: '0.9rem', color: '#868e96', marginBottom: '0.5rem' }}>{isAmharic ? 'ብዛት:' : 'Qty:'} {item.qty}</p>
                                        <p style={{ fontWeight: '600', color: '#10b981' }}>ETB {item.price}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Cards */}
            <div className="mobile-grid" style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr' }}>
                {filteredOrders.map(order => (
                    <div key={order._id} style={{ background: 'white', padding: '1rem', borderRadius: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <input
                                    type="checkbox"
                                    checked={!!checkedOrders[order._id]}
                                    onChange={() => handleCheckOrder(order._id)}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                <span style={{ fontWeight: '600', cursor: 'pointer' }} onClick={() => setSelectedOrder(order)}>#{order._id.slice(-6)}</span>
                            </div>
                            <span style={{ fontSize: '0.85rem', color: '#868e96' }}>{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <span style={{
                                background: `${STATUS_COLORS[order.status] || '#eee'}15`,
                                color: STATUS_COLORS[order.status] || '#333',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: '600'
                            }}>
                                {getStatusLabel(order.status)}
                            </span>
                            <span style={{ fontSize: '0.85rem', color: '#868e96' }}>• ETB {order.totalPrice}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }} onClick={() => setSelectedOrder(order)}>
                                <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{order.user?.name || (isAmharic ? 'ያልታወቀ' : 'Unknown')}</span>
                                <span style={{ fontSize: '0.8rem', color: '#3b82f6' }}>
                                    <Eye size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                    {order.orderItems?.length || 0} {isAmharic ? 'ዕቃዎች' : 'Items'}
                                </span>
                            </div>
                            <select
                                value={order.status}
                                onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                style={{
                                    padding: '8px',
                                    borderRadius: '8px',
                                    border: '1px solid #eee',
                                    background: '#f8f9fc',
                                    outline: 'none',
                                    fontSize: '0.85rem'
                                }}
                            >
                                {Object.keys(STATUS_COLORS).map(s => (
                                    <option key={s} value={s}>{getStatusLabel(s)}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
        @media (min-width: 768px) {
            .desktop-table-container { display: block !important; }
            .mobile-grid { display: none !important; }
        }
      `}</style>
        </div>
    );
};

export default OrderList;
