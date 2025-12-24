import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Minus, Plus } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import './ItemDetail.css';

const ItemDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart, products } = useShop();
    const [quantity, setQuantity] = useState(1);

    const product = products.find(p => p._id === id);

    if (!product) {
        return <div className="page center">Item not found</div>;
    }

    const handleDecrease = () => {
        if (quantity > 1) setQuantity(q => q - 1);
    };

    const handleIncrease = () => {
        setQuantity(q => q + 1);
    };

    const handleAddToCart = () => {
        addToCart(product, quantity);
        // Optional: show feedback or navigate to cart
        alert(`Added ${quantity} ${product.name} to cart`);
    };

    // Dynamic price calculation
    const currentPrice = (product.price * quantity).toFixed(2);

    return (
        <div className="page item-detail-page">
            <header className="detail-header">
                <button onClick={() => navigate(-1)} className="back-btn">
                    <ArrowLeft size={24} />
                </button>
                <span className="header-title">Product Detail</span>
                <button className="favorite-btn">{/* Heart icon optionally */}</button>
            </header>

            <div className="detail-image-container">
                <img src={product.image} alt={product.name} />
            </div>

            <div className="detail-content">
                <div className="detail-info">
                    <h1 className="detail-title">{product.name}</h1>
                    <p className="detail-brand">{product.brand}</p>

                    <div className="price-tag">
                        ${product.price.toFixed(2)}
                        {quantity > 1 && <span className="unit-price"> each</span>}
                    </div>

                    <p className="description">{product.description}</p>
                </div>

                <div className="action-area">
                    <div className="quantity-control">
                        <button onClick={handleDecrease} className="qty-btn"><Minus size={20} /></button>
                        <span className="qty-value">{quantity}</span>
                        <button onClick={handleIncrease} className="qty-btn"><Plus size={20} /></button>
                    </div>

                    <div className="total-display">
                        ${currentPrice}
                    </div>
                </div>

                <button className="main-add-btn" onClick={handleAddToCart}>
                    Add to Cart
                </button>

                {/* Related Items Section */}
                <div className="related-items-section" style={{ marginTop: '40px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>You might also like</h3>
                    <div className="related-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '16px'
                    }}>
                        {products
                            .filter(p => p.category === product.category && p._id !== product._id)
                            .slice(0, 2)
                            .map(related => (
                                <div key={related._id} className="related-item-card" onClick={() => {
                                    navigate(`/item/${related._id}`);
                                    window.scrollTo(0, 0);
                                }}>
                                    <div style={{
                                        borderRadius: '12px', overflow: 'hidden', marginBottom: '8px', aspectRatio: '1', background: '#f8f9fc'
                                    }}>
                                        <img src={related.image} alt={related.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                    <h4 style={{ fontSize: '14px', fontWeight: '600', margin: '0' }}>{related.name}</h4>
                                    <p style={{ fontSize: '14px', fontWeight: '700', marginTop: '4px' }}>${related.price.toFixed(2)}</p>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ItemDetail;
