import React, { useState, useEffect } from 'react';
import { Truck, Edit2, Check, MapPin, Plus, Trash2, Search, RotateCcw, Building2, CheckCircle2, X } from 'lucide-react';
import { orderService, deliveryLocationService } from '../../../services/api';
import { useShop } from '../../../context/ShopContext';

const DELIVERY_STATUSES = ['Preparing', 'On the way', 'Delivered'];

const DeliveryManager = () => {
    const { refreshDeliveryLocations } = useShop();

    // Active Tab: 'locations' or 'orders'
    const [activeTab, setActiveTab] = useState('locations');

    // Deliveries State
    const [deliveries, setDeliveries] = useState([]);
    const [driverEdits, setDriverEdits] = useState({});
    const [editingDriverId, setEditingDriverId] = useState(null);

    // Locations State
    const [locations, setLocations] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [newLocation, setNewLocation] = useState({ name: '', shortCode: '', zone: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Edit Location State
    const [editingLocation, setEditingLocation] = useState(null);
    const [editFormData, setEditFormData] = useState({ name: '', shortCode: '', zone: '' });
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        loadDeliveries();
        loadLocations();
    }, []);

    const loadDeliveries = async () => {
        try {
            const { data } = await orderService.getAll();
            const active = data.filter(d => ['Preparing', 'On the way'].includes(d.status));
            setDeliveries(active);
        } catch (error) {
            console.error("Failed to load deliveries", error);
        }
    };

    const loadLocations = async () => {
        try {
            const { data } = await deliveryLocationService.getAll();
            if (data) setLocations(data);
        } catch (error) {
            console.error("Failed to load locations", error);
        }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            const { data } = await orderService.updateStatus(id, newStatus);
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

    // Location Management
    const handleAddLocation = async (e) => {
        e.preventDefault();
        if (!newLocation.name.trim()) return;

        setIsSubmitting(true);
        try {
            const { data } = await deliveryLocationService.create(newLocation);
            setLocations(prev => [data, ...prev]);
            setNewLocation({ name: '', shortCode: '', zone: '' });
            setSuccessMessage(`Added "${data.name}" successfully!`);
            setTimeout(() => setSuccessMessage(''), 3000);
            if (refreshDeliveryLocations) refreshDeliveryLocations();
        } catch (error) {
            console.error("Failed to add location", error);
            alert("Failed to add location: " + (error.response?.data?.message || error.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteLocation = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

        try {
            await deliveryLocationService.delete(id);
            setLocations(prev => prev.filter(l => l._id !== id));
            if (refreshDeliveryLocations) refreshDeliveryLocations();
        } catch (error) {
            console.error("Failed to delete location", error);
            alert("Failed to delete location: " + (error.response?.data?.message || error.message));
        }
    };

    const handleResetDefaults = async () => {
        if (!window.confirm('Reset delivery addresses to the 14 standard Gondar sub-cities & districts?')) return;

        try {
            const { data } = await deliveryLocationService.resetDefaults();
            setLocations(data.locations || []);
            setSuccessMessage('Standard Gondar delivery locations restored successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
            if (refreshDeliveryLocations) refreshDeliveryLocations();
        } catch (error) {
            console.error("Failed to reset locations", error);
        }
    };

    const handleStartEdit = (loc) => {
        setEditingLocation(loc);
        setEditFormData({
            name: loc.name || '',
            shortCode: loc.shortCode || '',
            zone: loc.zone || ''
        });
    };

    const handleCancelEdit = () => {
        setEditingLocation(null);
        setEditFormData({ name: '', shortCode: '', zone: '' });
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        if (!editingLocation || !editFormData.name.trim()) return;

        setIsUpdating(true);
        try {
            const { data } = await deliveryLocationService.update(editingLocation._id, {
                name: editFormData.name.trim(),
                shortCode: editFormData.shortCode.trim().toUpperCase(),
                zone: editFormData.zone.trim()
            });
            setLocations(prev => prev.map(l => l._id === editingLocation._id ? data : l));
            setEditingLocation(null);
            setSuccessMessage(`Updated "${data.name}" successfully!`);
            setTimeout(() => setSuccessMessage(''), 3000);
            if (refreshDeliveryLocations) refreshDeliveryLocations();
        } catch (error) {
            console.error("Failed to update location", error);
            alert("Failed to update location: " + (error.response?.data?.message || error.message));
        } finally {
            setIsUpdating(false);
        }
    };

    // Filter locations by search
    const filteredLocations = locations.filter(loc => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return true;
        return (
            (loc.name && loc.name.toLowerCase().includes(q)) ||
            (loc.shortCode && loc.shortCode.toLowerCase().includes(q)) ||
            (loc.zone && loc.zone.toLowerCase().includes(q))
        );
    });

    return (
        <div style={{ padding: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
            <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--admin-text, #1a1b1e)', margin: 0 }}>
                        Delivery & Addresses
                    </h1>
                    <p style={{ color: 'var(--admin-subtext, #868e96)', margin: '4px 0 0' }}>
                        Manage Gondar delivery locations for checkout autocomplete and track active orders.
                    </p>
                </div>

                {/* Tab Switcher */}
                <div style={{ display: 'flex', background: 'var(--admin-border, #f1f3f5)', padding: '4px', borderRadius: '12px', gap: '4px' }}>
                    <button
                        onClick={() => setActiveTab('locations')}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            background: activeTab === 'locations' ? '#ffffff' : 'transparent',
                            color: activeTab === 'locations' ? '#1a1b1e' : '#868e96',
                            fontWeight: 700,
                            fontSize: '0.88rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: activeTab === 'locations' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                            transition: 'all 0.15s'
                        }}
                    >
                        <MapPin size={16} color={activeTab === 'locations' ? '#0ca678' : undefined} />
                        Gondar Addresses ({locations.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('orders')}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            background: activeTab === 'orders' ? '#ffffff' : 'transparent',
                            color: activeTab === 'orders' ? '#1a1b1e' : '#868e96',
                            fontWeight: 700,
                            fontSize: '0.88rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: activeTab === 'orders' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                            transition: 'all 0.15s'
                        }}
                    >
                        <Truck size={16} color={activeTab === 'orders' ? '#3b82f6' : undefined} />
                        Active Orders ({deliveries.length})
                    </button>
                </div>
            </header>

            {successMessage && (
                <div style={{
                    background: '#e6fcf5',
                    color: '#0ca678',
                    padding: '0.9rem 1.2rem',
                    borderRadius: '12px',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    boxShadow: '0 2px 8px rgba(12, 166, 120, 0.15)'
                }}>
                    <CheckCircle2 size={18} />
                    {successMessage}
                </div>
            )}

            {/* TAB 1: GONDAR DELIVERY ADDRESSES */}
            {activeTab === 'locations' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Add Address Form */}
                    <div style={{
                        background: 'var(--admin-card-bg, #ffffff)',
                        padding: '1.5rem',
                        borderRadius: '16px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                        border: '1px solid var(--admin-border, #edf2f7)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '8px' }}>
                            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Plus size={20} color="#0ca678" />
                                Add New Gondar Delivery Location
                            </h2>
                            <button
                                type="button"
                                onClick={handleResetDefaults}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid var(--admin-border, #dee2e6)',
                                    color: 'var(--admin-text, #495057)',
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <RotateCcw size={14} />
                                Reset Standard 14 Gondar Locations
                            </button>
                        </div>

                        <form onSubmit={handleAddLocation} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr)) 120px', gap: '1rem', alignItems: 'flex-end' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--admin-subtext, #495057)', marginBottom: '4px' }}>
                                    Address Name *
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Arada, Gondar"
                                    value={newLocation.name}
                                    onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '10px',
                                        border: '1px solid var(--admin-border, #ced4da)',
                                        background: 'var(--admin-input-bg, #f8f9fc)',
                                        color: 'var(--admin-text, #1a1b1e)',
                                        fontSize: '0.9rem'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--admin-subtext, #495057)', marginBottom: '4px' }}>
                                    Short Code / Shortcut (e.g. AR, PS)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. AR"
                                    value={newLocation.shortCode}
                                    onChange={(e) => setNewLocation({ ...newLocation, shortCode: e.target.value.toUpperCase() })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '10px',
                                        border: '1px solid var(--admin-border, #ced4da)',
                                        background: 'var(--admin-input-bg, #f8f9fc)',
                                        color: 'var(--admin-text, #1a1b1e)',
                                        fontSize: '0.9rem'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--admin-subtext, #495057)', marginBottom: '4px' }}>
                                    Sub-city / Zone / Landmark
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. City Center / Market"
                                    value={newLocation.zone}
                                    onChange={(e) => setNewLocation({ ...newLocation, zone: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '10px',
                                        border: '1px solid var(--admin-border, #ced4da)',
                                        background: 'var(--admin-input-bg, #f8f9fc)',
                                        color: 'var(--admin-text, #1a1b1e)',
                                        fontSize: '0.9rem'
                                    }}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || !newLocation.name.trim()}
                                style={{
                                    height: '42px',
                                    background: '#0ca678',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontWeight: 700,
                                    fontSize: '0.88rem',
                                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    opacity: (!newLocation.name.trim() || isSubmitting) ? 0.6 : 1
                                }}
                            >
                                <Plus size={16} />
                                {isSubmitting ? 'Adding...' : 'Add'}
                            </button>
                        </form>
                    </div>

                    {/* Locations List Header & Search */}
                    <div style={{
                        background: 'var(--admin-card-bg, #ffffff)',
                        padding: '1.2rem 1.5rem',
                        borderRadius: '16px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                        border: '1px solid var(--admin-border, #edf2f7)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '1rem',
                        flexWrap: 'wrap'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Building2 size={20} color="#3b82f6" />
                            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--admin-text, #1a1b1e)' }}>
                                Registered Locations ({filteredLocations.length})
                            </span>
                        </div>

                        <div style={{ position: 'relative', minWidth: '260px' }}>
                            <Search size={16} color="#868e96" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="text"
                                placeholder="Search location or code (e.g. Arada, PS)..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px 8px 36px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--admin-border, #ced4da)',
                                    background: 'var(--admin-input-bg, #f8f9fc)',
                                    color: 'var(--admin-text, #1a1b1e)',
                                    fontSize: '0.88rem',
                                    outline: 'none'
                                }}
                            />
                        </div>
                    </div>

                    {/* Locations Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1rem' }}>
                        {filteredLocations.map(loc => (
                            <div
                                key={loc._id}
                                style={{
                                    background: 'var(--admin-card-bg, #ffffff)',
                                    padding: '1.2rem',
                                    borderRadius: '14px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                                    border: '1px solid var(--admin-border, #edf2f7)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    transition: 'transform 0.15s, box-shadow 0.15s'
                                }}
                            >
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                    <div style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '10px',
                                        background: '#e6fcf5',
                                        color: '#0ca678',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        <MapPin size={18} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '0.98rem', fontWeight: '700', margin: '0 0 4px', color: 'var(--admin-text, #1a1b1e)' }}>
                                            {loc.name}
                                        </h3>
                                        {loc.zone && (
                                            <p style={{ margin: '0 0 6px', fontSize: '0.8rem', color: 'var(--admin-subtext, #868e96)' }}>
                                                {loc.zone}
                                            </p>
                                        )}
                                        {loc.shortCode && (
                                            <span style={{
                                                fontSize: '0.72rem',
                                                background: '#f1f5f9',
                                                color: '#475569',
                                                padding: '2px 8px',
                                                borderRadius: '6px',
                                                fontWeight: 800,
                                                letterSpacing: '0.5px'
                                            }}>
                                                Code: {loc.shortCode}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                    <button
                                        onClick={() => handleStartEdit(loc)}
                                        title="Edit Location"
                                        style={{
                                            background: '#f8f9fa',
                                            border: '1px solid #e9ecef',
                                            color: '#2b8a3e',
                                            cursor: 'pointer',
                                            padding: '6px 8px',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.15s'
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = '#e6fcf5'; e.currentTarget.style.borderColor = '#63e6be'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = '#f8f9fa'; e.currentTarget.style.borderColor = '#e9ecef'; }}
                                    >
                                        <Edit2 size={15} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteLocation(loc._id, loc.name)}
                                        title="Delete Location"
                                        style={{
                                            background: '#fff5f5',
                                            border: '1px solid #ffe3e3',
                                            color: '#fa5252',
                                            cursor: 'pointer',
                                            padding: '6px 8px',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.15s'
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = '#ffe3e3'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = '#fff5f5'; }}
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 2: ACTIVE DELIVERIES & DRIVERS */}
            {activeTab === 'orders' && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {deliveries.length === 0 ? (
                        <div style={{
                            background: 'var(--admin-card-bg, #ffffff)',
                            padding: '3rem 1.5rem',
                            borderRadius: '16px',
                            textAlign: 'center',
                            color: 'var(--admin-subtext, #868e96)',
                            border: '1px solid var(--admin-border, #edf2f7)'
                        }}>
                            <Truck size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                            <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', color: 'var(--admin-text, #1a1b1e)' }}>No Active Deliveries</h3>
                            <p style={{ margin: 0, fontSize: '0.9rem' }}>Orders that are preparing or on the way will appear here.</p>
                        </div>
                    ) : (
                        deliveries.map(d => (
                            <div key={d._id} style={{ background: 'var(--admin-card-bg, #ffffff)', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid var(--admin-border, #edf2f7)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3 style={{ fontWeight: '600', fontSize: '1.1rem', color: 'var(--admin-text, #1a1b1e)' }}>#{d._id.slice(-6).toUpperCase()}</h3>
                                        <p style={{ color: 'var(--admin-subtext, #868e96)', fontSize: '0.9rem' }}>Customer: {d.user?.name}</p>
                                        <p style={{ fontSize: '0.9rem', marginTop: '4px', color: 'var(--admin-text, #1a1b1e)' }}>📍 {d.shippingAddress?.address || 'No Address'}</p>
                                    </div>
                                    <div style={{ padding: '8px', background: '#f8f9fc', borderRadius: '50%' }}>
                                        <Truck size={24} color="#1a1b1e" />
                                    </div>
                                </div>

                                <div style={{ borderTop: '1px solid var(--admin-border, #f1f3f5)', paddingTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--admin-subtext, #868e96)', display: 'block', marginBottom: '4px' }}>Status</label>
                                        <select
                                            value={d.status}
                                            onChange={(e) => updateStatus(d._id, e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '8px',
                                                borderRadius: '8px',
                                                border: '1px solid var(--admin-border, #eee)',
                                                background: 'var(--admin-input-bg, #ffffff)',
                                                color: 'var(--admin-text, #1a1b1e)',
                                                outline: 'none',
                                                fontWeight: '500'
                                            }}
                                        >
                                            {DELIVERY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--admin-subtext, #868e96)', display: 'block', marginBottom: '4px' }}>Driver</label>

                                        {editingDriverId === d._id ? (
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <input
                                                    value={driverEdits[d._id] || d.driver || ''}
                                                    onChange={(e) => setDriverEdits({ ...driverEdits, [d._id]: e.target.value })}
                                                    style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd', width: '120px' }}
                                                />
                                                <button onClick={() => handleDriverSave(d._id)} style={{ color: '#10b981', border: 'none', background: 'none', cursor: 'pointer' }}><Check size={16} /></button>
                                            </div>
                                        ) : (
                                            <div style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {d.driver || 'Unassigned'}
                                                <button onClick={() => { setEditingDriverId(d._id); setDriverEdits({ ...driverEdits, [d._id]: d.driver || '' }) }} style={{ color: '#4dabf7', border: 'none', background: 'none', cursor: 'pointer' }}>
                                                    <Edit2 size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* EDIT LOCATION MODAL */}
            {editingLocation && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.55)',
                        backdropFilter: 'blur(3px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '1rem'
                    }}
                    onClick={handleCancelEdit}
                >
                    <div
                        style={{
                            background: 'var(--admin-card-bg, #ffffff)',
                            borderRadius: '18px',
                            maxWidth: '480px',
                            width: '100%',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                            border: '1px solid var(--admin-border, #edf2f7)',
                            overflow: 'hidden'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '1.25rem 1.5rem',
                            borderBottom: '1px solid var(--admin-border, #edf2f7)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '10px',
                                    background: '#e6fcf5',
                                    color: '#0ca678',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <MapPin size={18} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: 'var(--admin-text, #1a1b1e)' }}>
                                        Edit Delivery Address
                                    </h3>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--admin-subtext, #868e96)' }}>
                                        Update details for Gondar customer suggestions
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleCancelEdit}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--admin-subtext, #868e96)',
                                    cursor: 'pointer',
                                    padding: '6px',
                                    borderRadius: '8px',
                                    display: 'flex'
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSaveEdit} style={{ padding: '1.5rem' }}>
                            <div style={{ marginBottom: '1.1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--admin-text, #1a1b1e)', marginBottom: '6px' }}>
                                    Address / District Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editFormData.name}
                                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                    placeholder="e.g. Arada, Gondar"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        borderRadius: '10px',
                                        border: '1.5px solid var(--admin-border, #e2e8f0)',
                                        background: 'var(--admin-input-bg, #ffffff)',
                                        color: 'var(--admin-text, #1a1b1e)',
                                        fontSize: '0.95rem',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--admin-text, #1a1b1e)', marginBottom: '6px' }}>
                                        Short Code
                                    </label>
                                    <input
                                        type="text"
                                        maxLength="6"
                                        value={editFormData.shortCode}
                                        onChange={(e) => setEditFormData({ ...editFormData, shortCode: e.target.value.toUpperCase() })}
                                        placeholder="e.g. AR"
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            borderRadius: '10px',
                                            border: '1.5px solid var(--admin-border, #e2e8f0)',
                                            background: 'var(--admin-input-bg, #ffffff)',
                                            color: 'var(--admin-text, #1a1b1e)',
                                            fontSize: '0.95rem',
                                            fontWeight: '700',
                                            letterSpacing: '1px',
                                            outline: 'none',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                    <span style={{ fontSize: '0.72rem', color: 'var(--admin-subtext, #868e96)', marginTop: '4px', display: 'block' }}>
                                        User shortcut
                                    </span>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--admin-text, #1a1b1e)', marginBottom: '6px' }}>
                                        Zone / Landmark
                                    </label>
                                    <input
                                        type="text"
                                        value={editFormData.zone}
                                        onChange={(e) => setEditFormData({ ...editFormData, zone: e.target.value })}
                                        placeholder="e.g. Market & Commercial Area"
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            borderRadius: '10px',
                                            border: '1.5px solid var(--admin-border, #e2e8f0)',
                                            background: 'var(--admin-input-bg, #ffffff)',
                                            color: 'var(--admin-text, #1a1b1e)',
                                            fontSize: '0.95rem',
                                            outline: 'none',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                    <span style={{ fontSize: '0.72rem', color: 'var(--admin-subtext, #868e96)', marginTop: '4px', display: 'block' }}>
                                        Helps identify the area
                                    </span>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '10px', borderTop: '1px solid var(--admin-border, #f1f3f5)' }}>
                                <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    disabled={isUpdating}
                                    style={{
                                        padding: '10px 18px',
                                        borderRadius: '10px',
                                        border: '1px solid var(--admin-border, #e2e8f0)',
                                        background: 'var(--admin-btn-secondary, #f8f9fa)',
                                        color: 'var(--admin-text, #495057)',
                                        fontSize: '0.9rem',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUpdating || !editFormData.name.trim()}
                                    style={{
                                        padding: '10px 22px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: '#0ca678',
                                        color: '#ffffff',
                                        fontSize: '0.9rem',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        opacity: isUpdating ? 0.7 : 1
                                    }}
                                >
                                    {isUpdating ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeliveryManager;
