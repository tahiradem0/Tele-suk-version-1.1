import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Search, RotateCcw, Edit2, CheckCircle2, X, Building2 } from 'lucide-react';
import { deliveryLocationService } from '../../../services/api';
import { useShop } from '../../../context/ShopContext';

const AddressManager = () => {
    const { refreshDeliveryLocations } = useShop();

    // Locations State
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [newLocation, setNewLocation] = useState({ name: '', shortCode: '', zone: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Edit Location State
    const [editingLocation, setEditingLocation] = useState(null);
    const [editFormData, setEditFormData] = useState({ name: '', shortCode: '', zone: '' });
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        loadLocations();
    }, []);

    const loadLocations = async () => {
        setLoading(true);
        try {
            const { data } = await deliveryLocationService.getAll();
            if (data) setLocations(data);
        } catch (error) {
            console.error("Failed to load delivery locations", error);
        } finally {
            setLoading(false);
        }
    };

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
            setSuccessMessage(`Deleted "${name}"`);
            setTimeout(() => setSuccessMessage(''), 3000);
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
            alert("Failed to reset locations: " + (error.response?.data?.message || error.message));
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
        <div style={{ padding: '1.5rem', maxWidth: '1100px', margin: '0 auto', color: 'var(--admin-text, #1a1b1e)' }}>
            {/* Header */}
            <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0 0 0.4rem', color: 'var(--admin-text, #1a1b1e)', letterSpacing: '-0.5px' }}>
                        Address Management
                    </h1>
                    <p style={{ color: 'var(--admin-subtext, #868e96)', margin: 0, fontSize: '0.95rem' }}>
                        Manage Gondar delivery locations, shortcuts, and areas for customer checkout autocomplete.
                    </p>
                </div>

                <button
                    onClick={handleResetDefaults}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        borderRadius: '12px',
                        background: 'var(--admin-card-bg, #ffffff)',
                        border: '1px solid var(--admin-border, #e9ecef)',
                        color: 'var(--admin-text, #495057)',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f8f9fa'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--admin-card-bg, #ffffff)'; }}
                    title="Restore original 14 standard Gondar sub-cities & districts"
                >
                    <RotateCcw size={15} />
                    Reset Standard 14 Gondar Locations
                </button>
            </header>

            {/* Success notification banner */}
            {successMessage && (
                <div style={{
                    marginBottom: '1.5rem',
                    padding: '0.85rem 1.25rem',
                    borderRadius: '12px',
                    background: '#e6fcf5',
                    border: '1px solid #63e6be',
                    color: '#0ca678',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '0.92rem',
                    fontWeight: '600',
                    animation: 'fadeIn 0.2s ease-in-out'
                }}>
                    <CheckCircle2 size={18} />
                    {successMessage}
                </div>
            )}

            {/* ADD NEW LOCATION CARD */}
            <div style={{
                background: 'var(--admin-card-bg, #ffffff)',
                padding: '1.5rem',
                borderRadius: '16px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                border: '1px solid var(--admin-border, #edf2f7)',
                marginBottom: '1.5rem'
            }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--admin-text, #1a1b1e)' }}>
                    <Plus size={20} color="#0ca678" /> Add New Gondar Delivery Location
                </h3>
                <form onSubmit={handleAddLocation} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr)) 110px', gap: '0.85rem', alignItems: 'end' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--admin-subtext, #868e96)', marginBottom: '5px' }}>
                            Address Name *
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Arada, Gondar"
                            value={newLocation.name}
                            onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                border: '1.5px solid var(--admin-border, #e2e8f0)',
                                background: 'var(--admin-input-bg, #ffffff)',
                                color: 'var(--admin-text, #1a1b1e)',
                                fontSize: '0.92rem',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--admin-subtext, #868e96)', marginBottom: '5px' }}>
                            Short Code / Shortcut (e.g. AR, PS)
                        </label>
                        <input
                            type="text"
                            maxLength="6"
                            placeholder="e.g. AR"
                            value={newLocation.shortCode}
                            onChange={(e) => setNewLocation({ ...newLocation, shortCode: e.target.value.toUpperCase() })}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                border: '1.5px solid var(--admin-border, #e2e8f0)',
                                background: 'var(--admin-input-bg, #ffffff)',
                                color: 'var(--admin-text, #1a1b1e)',
                                fontSize: '0.92rem',
                                fontWeight: '700',
                                letterSpacing: '1px',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--admin-subtext, #868e96)', marginBottom: '5px' }}>
                            Sub-city / Zone / Landmark
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. City Center / Market"
                            value={newLocation.zone}
                            onChange={(e) => setNewLocation({ ...newLocation, zone: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                border: '1.5px solid var(--admin-border, #e2e8f0)',
                                background: 'var(--admin-input-bg, #ffffff)',
                                color: 'var(--admin-text, #1a1b1e)',
                                fontSize: '0.92rem',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || !newLocation.name.trim()}
                        style={{
                            padding: '10px 18px',
                            background: '#0ca678',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            height: '42px',
                            transition: 'background 0.15s',
                            opacity: isSubmitting ? 0.7 : 1
                        }}
                    >
                        <Plus size={18} /> {isSubmitting ? 'Adding...' : 'Add'}
                    </button>
                </form>
            </div>

            {/* SEARCH & TITLE BAR */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--admin-text, #1a1b1e)' }}>
                    <Building2 size={20} color="#0ca678" /> Registered Locations ({filteredLocations.length})
                </h3>

                <div style={{ position: 'relative', width: '280px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#adb5bd' }} />
                    <input
                        type="text"
                        placeholder="Search location or code (e.g. Arada, AR)..."
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

            {/* LOCATIONS GRID */}
            {loading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--admin-subtext, #868e96)' }}>
                    Loading locations...
                </div>
            ) : filteredLocations.length === 0 ? (
                <div style={{
                    background: 'var(--admin-card-bg, #ffffff)',
                    padding: '3rem 1.5rem',
                    borderRadius: '16px',
                    textAlign: 'center',
                    color: 'var(--admin-subtext, #868e96)',
                    border: '1px solid var(--admin-border, #edf2f7)'
                }}>
                    <MapPin size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                    <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', color: 'var(--admin-text, #1a1b1e)' }}>No Locations Found</h3>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>
                        {searchQuery ? `No locations match "${searchQuery}".` : 'No delivery locations registered yet.'}
                    </p>
                </div>
            ) : (
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

export default AddressManager;
