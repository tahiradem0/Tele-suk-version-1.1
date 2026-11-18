import React, { useState, useRef, useEffect } from 'react';
import { Minus, Plus, X, Truck, CreditCard, MapPin, Navigation } from 'lucide-react'; // Using icons for UI
import { useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { useToast } from '../context/ToastContext';
import { orderService, paymentService } from '../services/api';
import './Cart.css';

const Cart = () => {
    const { cart, updateQuantity, removeFromCart, user, language, deliveryFee: globalDeliveryFee, products, deliveryLocations } = useShop();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [address, setAddress] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close autocomplete dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = subtotal > 0 ? globalDeliveryFee : 0;
    const total = subtotal + deliveryFee;

    const { showToast } = useToast();

    // Filter matching delivery locations based on query or abbreviations
    const q = address.trim().toLowerCase();
    const allLocations = (deliveryLocations && deliveryLocations.length > 0) ? deliveryLocations : [
        { name: 'Arada, Gondar', shortCode: 'AR', zone: 'Market Area' },
        { name: 'Piassa, Gondar', shortCode: 'PS', zone: 'City Center' },
        { name: 'Maraki, Gondar', shortCode: 'MK', zone: 'University Campus' },
        { name: 'Azezo, Gondar', shortCode: 'AZ', zone: 'Airport Area' },
        { name: 'Lideta, Gondar', shortCode: 'LD', zone: 'Residential' },
        { name: 'Chechela, Gondar', shortCode: 'CH', zone: 'Hospital Area' },
        { name: 'Kebele 18, Gondar', shortCode: 'K18', zone: 'Sub-city' },
        { name: 'Kebele 16, Gondar', shortCode: 'K16', zone: 'Sub-city' },
        { name: 'Fasil Ghebbi, Gondar', shortCode: 'FS', zone: 'Castle Area' },
        { name: 'Posta Bet, Gondar', shortCode: 'PB', zone: 'Postal Area' },
        { name: 'Autopark, Gondar', shortCode: 'AP', zone: 'Bus Station' },
    ];

    const matchingLocations = allLocations.filter(loc => {
        if (!q) return true;
        const name = (loc.name || '').toLowerCase();
        const code = (loc.shortCode || '').toLowerCase();
        const zone = (loc.zone || '').toLowerCase();

        // Exact abbreviation or code match (e.g. "ar" -> Arada, "ps" -> Piassa)
        if (code === q || code.startsWith(q)) return true;

        // Substring match in name or zone
        if (name.includes(q) || zone.includes(q)) return true;

        // Acronym match (e.g. "ps" for "piassa gondar")
        const initials = name.replace(/[^a-z0-9 ]/g, '').split(' ').map(w => w[0]).join('');
        if (initials.startsWith(q) || initials === q) return true;

        return false;
    }).slice(0, 6);

    const popularLocations = allLocations.slice(0, 5);

    const handleSelectLocation = (loc) => {
        setAddress(loc.name);
        setIsDropdownOpen(false);
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;

        if (!user) {
            navigate('/auth?redirect=cart');
            return;
        }

        if (!address.trim()) {
            showToast('Please enter a delivery address', 'warning');
            return;
        }

        setIsProcessing(true);

        try {
            // 1. Create Order
            const orderItems = cart.map(item => ({
                product: item._id,
                name: item.name,
                image: item.image,
                price: item.price,
                qty: item.quantity
            }));

            const orderData = {
                orderItems,
                shippingAddress: { address },
                paymentMethod: 'Chapa',
                itemsPrice: subtotal,
                shippingPrice: deliveryFee,
                totalPrice: total,
                referralCode: localStorage.getItem('ref_code') || ''
            };

            const { data: order } = await orderService.create(orderData);

            // 2. Initialize Payment with current client origin so Chapa redirects back to the active environment
            const { data: paymentResponse } = await paymentService.initialize(order._id, window.location.origin);

            // Log for debugging
            console.log("Payment Init Response:", paymentResponse);

            if (paymentResponse && paymentResponse.checkout_url) {
                // 3. Redirect to Chapa
                window.location.href = paymentResponse.checkout_url;
            } else {
                console.error("No checkout URL in response", paymentResponse);
                showToast("Payment initialization failed", "error");
                setIsProcessing(false);
            }

        } catch (error) {
            console.error("Checkout failed", error);
            showToast("Checkout failed. Please try again.", "error");
            setIsProcessing(false);
        }
    };

    if (cart.length === 0) {
        return (
            <div className="page cart-page empty-state">
                <div className="empty-content">
                    <h2>{language === 'en' ? 'Your Cart is Empty' : 'የእርስዎ ጋሪ ባዶ ነው'}</h2>
                    <p>{language === 'en' ? "Looks like you haven't added anything yet." : "እስካሁን ምንም ያከሉ አይመስልም።"}</p>
                    <button className="browse-btn" onClick={() => navigate('/')}>
                        {language === 'en' ? 'Start Shopping' : 'ግብይት ይጀምሩ'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="page cart-page">
            <header className="cart-header">
                <h1>{language === 'en' ? 'Your Cart' : 'የእርስዎ ጋሪ'}</h1>
                <span className="item-count">{cart.length} {language === 'en' ? 'items' : 'ዕቃዎች'}</span>
            </header>

            <div className="cart-items">
                {cart.map((item) => (
                    <div key={item._id} className="cart-item">
                        <div className="item-img">
                            <img src={item.image} alt={item.name} />
                        </div>
                        <div className="item-details">
                            <h3>{item.name}</h3>
                            <p className="item-price">ETB {item.price.toFixed(2)}</p>
                            {(() => {
                                const prodRef = products.find(p => p._id === item._id);
                                const availableStock = prodRef ? Number(prodRef.stockQuantity !== undefined ? prodRef.stockQuantity : (prodRef.countInStock || 999)) : 999;
                                const isAtMax = item.quantity >= availableStock;
                                return (
                                    <>
                                        <div className="qty-actions">
                                            <button onClick={() => updateQuantity(item._id, -1)} disabled={item.quantity <= 1}>
                                                <Minus size={16} />
                                            </button>
                                            <span>{item.quantity}</span>
                                            <button 
                                                onClick={() => {
                                                    if (isAtMax) {
                                                        showToast(`Only ${availableStock} in stock`, 'info');
                                                    } else {
                                                        updateQuantity(item._id, 1);
                                                    }
                                                }}
                                                disabled={isAtMax}
                                                style={{ opacity: isAtMax ? 0.4 : 1, cursor: isAtMax ? 'not-allowed' : 'pointer' }}
                                                title={isAtMax ? `Max stock available: ${availableStock}` : 'Increase quantity'}
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                        {availableStock <= 3 && availableStock > 0 && (
                                            <span style={{ fontSize: '0.72rem', color: '#e11d48', marginTop: '3px', display: 'block', fontWeight: 600 }}>
                                                {language === 'en' ? `Only ${availableStock} left in stock!` : `${availableStock} ብቻ ቀርቷል!`}
                                            </span>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                        <button className="remove-btn" onClick={() => removeFromCart(item._id)}>
                            <X size={20} />
                        </button>
                    </div>
                ))}
            </div>

            <div className="delivery-section">
                <div className="truck-icon">
                    <Truck size={24} />
                </div>
                <div className="delivery-info">
                    <p className="delivery-title">{language === 'en' ? 'Estimated Delivery' : 'የሚገመተው መላኪያ'}</p>
                    <p className="delivery-time">30 - 45 {language === 'en' ? 'mins' : 'ደቂቃዎች'}</p>
                    <div className="progress-bar">
                        <div className="progress-fill"></div>
                    </div>
                </div>
            </div>

            <div className="cart-summary">
                <div className="summary-row">
                    <span>{language === 'en' ? 'Subtotal' : 'ንዑስ ድምር'}</span>
                    <span>ETB {subtotal.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                    <span>{language === 'en' ? 'Delivery' : 'መላኪያ'}</span>
                    <span>ETB {deliveryFee.toFixed(2)}</span>
                </div>
                <div className="summary-total">
                    <span>{language === 'en' ? 'Total' : 'ድምር'}</span>
                    <span>ETB {total.toFixed(2)}</span>
                </div>

                {/* Interactive Delivery Address with Gondar Locations Autocomplete */}
                <div ref={dropdownRef} style={{ margin: '1.2rem 0', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                        <label style={{ fontSize: '0.88rem', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <MapPin size={16} color="#0ca678" />
                            {language === 'am' ? 'የማድረሻ አድራሻ (ጎንደር)' : 'Delivery Address (Gondar)'}
                        </label>
                        {address && (
                            <button
                                type="button"
                                onClick={() => setAddress('')}
                                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                            >
                                {language === 'am' ? 'አጽዳ' : 'Clear'}
                            </button>
                        )}
                    </div>

                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            value={address}
                            onChange={(e) => {
                                setAddress(e.target.value);
                                setIsDropdownOpen(true);
                            }}
                            onFocus={() => setIsDropdownOpen(true)}
                            placeholder={language === 'am' ? 'የጎንደር አድራሻ ያስገቡ (ምሳሌ: አራዳ፣ ፒያሳ፣ ማራኪ...)' : 'Type Gondar location or any address (e.g. Arada, Piassa...)'}
                            style={{
                                width: '100%',
                                padding: '0.85rem 2.4rem 0.85rem 0.95rem',
                                borderRadius: '12px',
                                border: isDropdownOpen ? '2px solid #0ca678' : '1px solid #cbd5e1',
                                fontSize: '0.92rem',
                                outline: 'none',
                                transition: 'all 0.2s',
                                background: '#ffffff',
                                boxShadow: isDropdownOpen ? '0 0 0 3px rgba(12, 166, 120, 0.12)' : 'none'
                            }}
                        />
                        <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }}>
                            <Navigation size={18} />
                        </div>
                    </div>

                    {/* Autocomplete Dropdown Popover */}
                    {isDropdownOpen && matchingLocations.length > 0 && (
                        <div style={{
                            position: 'absolute',
                            top: 'calc(100% + 4px)',
                            left: 0,
                            right: 0,
                            background: 'white',
                            borderRadius: '14px',
                            boxShadow: '0 12px 32px rgba(15, 23, 42, 0.16)',
                            border: '1px solid #e2e8f0',
                            zIndex: 100,
                            maxHeight: '230px',
                            overflowY: 'auto',
                            padding: '6px'
                        }}>
                            <div style={{ padding: '6px 10px', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {language === 'am' ? 'የተጠቆሙ የጎንደር አድራሻዎች' : 'Suggested Gondar Locations'}
                            </div>
                            {matchingLocations.map(loc => (
                                <div
                                    key={loc._id || loc.name}
                                    onClick={() => handleSelectLocation(loc)}
                                    style={{
                                        padding: '9px 12px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '8px',
                                        transition: 'background 0.15s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: '#e6fcf5', color: '#0ca678', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <MapPin size={14} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600', fontSize: '0.88rem', color: '#1e293b' }}>
                                                {loc.name}
                                            </div>
                                            {loc.zone && (
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                    {loc.zone}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {loc.shortCode && (
                                        <span style={{ fontSize: '0.7rem', background: '#f1f5f9', color: '#475569', padding: '2px 7px', borderRadius: '6px', fontWeight: 700 }}>
                                            {loc.shortCode}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Quick Popular Location Chips */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                        {popularLocations.map(loc => {
                            const shortLabel = loc.name.split(',')[0];
                            const isSelected = address.includes(shortLabel);
                            return (
                                <button
                                    key={loc._id || loc.name}
                                    type="button"
                                    onClick={() => handleSelectLocation(loc)}
                                    style={{
                                        background: isSelected ? '#e6fcf5' : '#f8f9fc',
                                        border: isSelected ? '1px solid #0ca678' : '1px solid #e2e8f0',
                                        color: isSelected ? '#0ca678' : '#475569',
                                        fontSize: '0.74rem',
                                        fontWeight: 600,
                                        padding: '4px 9px',
                                        borderRadius: '16px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        transition: 'all 0.15s'
                                    }}
                                >
                                    <MapPin size={11} />
                                    {shortLabel}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <button
                    className={`checkout-btn ${isProcessing ? 'scanning' : ''}`}
                    onClick={handleCheckout}
                    disabled={isProcessing}
                >
                    {isProcessing ? 'Processing...' : (
                        <>
                            <span>Pay with Chapa</span>
                            <div className="btn-icon">
                                <CreditCard size={18} />
                            </div>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default Cart;
