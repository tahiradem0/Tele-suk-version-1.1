import React, { useState, useEffect } from 'react';
import { Truck, Edit2, Check } from 'lucide-react';
import { orderService } from '../../../services/api';

const DELIVERY_STATUSES = ['Preparing', 'On the way', 'Delivered'];

const DeliveryManager = () => {
    const [deliveries, setDeliveries] = useState([]);
    const [driverEdits, setDriverEdits] = useState({}); // { orderId: 'DriverName' }
    const [editingDriverId, setEditingDriverId] = useState(null);

    useEffect(() => {
        loadDeliveries();
    }, []);

    const loadDeliveries = async () => {
        try {
            const { data } = await orderService.getAll();
            // Filter only relevant statuses
            const active = data.filter(d => ['Preparing', 'On the way'].includes(d.status));
            setDeliveries(active);
        } catch (error) {
            console.error("Failed to load deliveries", error);
        }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            const { data } = await orderService.updateStatus(id, newStatus);
            // If delivered, remove from list
            if (newStatus === 'Delivered') {
                setDeliveries(deliveries.filter(d => d._id !== id));
            } else {
                setDeliveries(deliveries.map(d => d._id === id ? data : d));
            }
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    const handleDriverSave = async (id) => {
        const driverName = driverEdits[id];
        if (driverName) {
            try {
                const { data } = await orderService.updateDriver(id, driverName);
                setDeliveries(deliveries.map(d => d._id === id ? data : d));
                setEditingDriverId(null);
            } catch (error) {
                console.error("Failed to update driver", error);
            }
        }
    };

    return (
        <div style={{ padding: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Delivery</h1>
                <p style={{ color: '#868e96' }}>Manage active deliveries</p>
            </header>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {deliveries.map(d => (
                    <div key={d._id} style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ fontWeight: '600', fontSize: '1.1rem' }}>#{d._id.slice(-6)}</h3>
                                <p style={{ color: '#868e96', fontSize: '0.9rem' }}>{d.user?.name}</p>
                                <p style={{ fontSize: '0.9rem', marginTop: '4px' }}>📍 {d.shippingAddress?.address || 'No Address'}</p>
                            </div>
                            <div style={{ padding: '8px', background: '#f8f9fc', borderRadius: '50%' }}>
                                <Truck size={24} color="#1a1b1e" />
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid #f1f3f5', paddingTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.8rem', color: '#868e96', display: 'block', marginBottom: '4px' }}>Status</label>
                                <select
                                    value={d.status}
                                    onChange={(e) => updateStatus(d._id, e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        borderRadius: '8px',
                                        border: '1px solid #eee',
                                        outline: 'none',
                                        fontWeight: '500'
                                    }}
                                >
                                    {DELIVERY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: '#868e96', display: 'block', marginBottom: '4px' }}>Driver</label>

                                {editingDriverId === d._id ? (
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input
                                            value={driverEdits[d._id] || d.driver || ''}
                                            onChange={(e) => setDriverEdits({ ...driverEdits, [d._id]: e.target.value })}
                                            style={{ padding: '4px', borderRadius: '4px', border: '1px solid #ddd', width: '100px' }}
                                        />
                                        <button onClick={() => handleDriverSave(d._id)} style={{ color: '#10b981' }}><Check size={16} /></button>
                                    </div>
                                ) : (
                                    <div style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {d.driver || 'Unassigned'}
                                        <button onClick={() => { setEditingDriverId(d._id); setDriverEdits({ ...driverEdits, [d._id]: d.driver || '' }) }} style={{ color: '#4dabf7' }}>
                                            <Edit2 size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DeliveryManager;
