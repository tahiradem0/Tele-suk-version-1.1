import React, { useState } from 'react';
import { Minus, Plus, X, Truck, CreditCard } from 'lucide-react'; // Using icons for UI
import { useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { useToast } from '../context/ToastContext';
import { orderService, paymentService } from '../services/api';
import './Cart.css';

const Cart = () => {
    const { cart, updateQuantity, removeFromCart, user } = useShop();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = subtotal > 0 ? 5.00 : 0; // Flat fee
    const total = subtotal + deliveryFee;

    const [address, setAddress] = useState('');

    const { showToast } = useToast();

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
                totalPrice: total
            };

            const { data: order } = await orderService.create(orderData);

            // 2. Initialize Payment
            const { data: paymentResponse } = await paymentService.initialize(order._id);

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
                    <h2>Your Cart is Empty</h2>
                    <p>Looks like you haven't added anything yet.</p>
                    <button className="browse-btn" onClick={() => navigate('/')}>Start Shopping</button>
                </div>
            </div>
        );
    }

    return (
        <div className="page cart-page">
            <header className="cart-header">
                <h1>Your Cart</h1>
                <span className="item-count">{cart.length} items</span>
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
                            <div className="qty-actions">
                                <button onClick={() => updateQuantity(item._id, -1)} disabled={item.quantity <= 1}>
                                    <Minus size={16} />
                                </button>
                                <span>{item.quantity}</span>
                                <button onClick={() => updateQuantity(item._id, 1)}>
                                    <Plus size={16} />
                                </button>
                            </div>
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
                    <p className="delivery-title">Estimated Delivery</p>
                    <p className="delivery-time">30 - 45 mins</p>
                    <div className="progress-bar">
                        <div className="progress-fill"></div>
                    </div>
                </div>
            </div>

            <div className="cart-summary">
                <div className="summary-row">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                    <span>Delivery</span>
                    <span>${deliveryFee.toFixed(2)}</span>
                </div>
                <div className="summary-total">
                    <span>Total</span>
                    <span>ETB {total.toFixed(2)}</span>
                </div>

                <div style={{ margin: '1rem 0' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#495057' }}>Delivery Address</label>
                    <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Enter specific location (e.g. Bole, Friendship Building, 3rd Floor)"
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', minHeight: '80px', fontFamily: 'inherit' }}
                    />
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
