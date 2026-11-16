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

    const stock = Number(
        product.stockQuantity !== undefined 
            ? product.stockQuantity 
            : (product.countInStock !== undefined ? product.countInStock : 0)
    );
    const isOutOfStock = stock <= 0;

    const handleDecrease = () => {
        if (!isOutOfStock && quantity > 1) setQuantity(q => q - 1);
    };

    const handleIncrease = () => {
        if (!isOutOfStock && quantity < stock) {
            setQuantity(q => q + 1);
        }
    };

    const handleAddToCart = () => {
        if (isOutOfStock) {
            alert('Sorry, this product is currently out of stock!');
            return;
        }
        addToCart(product, quantity);
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

            <div className="detail-image-container" style={{ position: 'relative' }}>
                <img 
                    src={product.image} 
                    alt={product.name} 
                    style={{ filter: isOutOfStock ? 'grayscale(70%) contrast(90%)' : 'none', transition: 'filter 0.3s' }}
                />
                {isOutOfStock && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'radial-gradient(circle, rgba(15,23,42,0.3) 0%, rgba(15,23,42,0.65) 100%)',
                        backdropFilter: 'blur(3px)'
                    }}>
                        <div style={{
                            background: 'rgba(225, 29, 72, 0.95)',
                            color: '#ffffff',
                            fontSize: '13px',
                            fontWeight: '800',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            padding: '8px 18px',
                            borderRadius: '24px',
                            boxShadow: '0 4px 18px rgba(225, 29, 72, 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <span style={{ width: '8px', height: '8px', background: 'white', borderRadius: '50%' }}></span>
                            Out of Stock
                        </div>
                    </div>
                )}
            </div>

            <div className="detail-content">
                <div className="detail-info">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                        <h1 className="detail-title">{product.name}</h1>
                        {isOutOfStock ? (
                            <span style={{ background: '#ffe4e6', color: '#e11d48', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase' }}>
                                ● Out of Stock
                            </span>
                        ) : (
                            <span style={{ background: '#e6fcf5', color: '#0ca678', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '700' }}>
                                ✓ In Stock ({stock} left)
                            </span>
                        )}
                    </div>
                    <p className="detail-brand">{product.brand}</p>

                    <div className="price-tag" style={{ color: isOutOfStock ? '#94a3b8' : undefined }}>
                        ${product.price.toFixed(2)}
                        {quantity > 1 && <span className="unit-price"> each</span>}
                    </div>

                    <p className="description">{product.description}</p>
                </div>

                <div className="action-area" style={{ opacity: isOutOfStock ? 0.6 : 1 }}>
                    <div className="quantity-control">
                        <button onClick={handleDecrease} className="qty-btn" disabled={isOutOfStock}><Minus size={20} /></button>
                        <span className="qty-value">{isOutOfStock ? 0 : quantity}</span>
                        <button onClick={handleIncrease} className="qty-btn" disabled={isOutOfStock || quantity >= stock} title={quantity >= stock ? `Max available stock is ${stock}` : ''}><Plus size={20} /></button>
                    </div>

                    <div className="total-display">
                        ${isOutOfStock ? '0.00' : currentPrice}
                    </div>
                </div>

                <button 
                    className="main-add-btn" 
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    style={{
                        background: isOutOfStock ? '#e2e8f0' : undefined,
                        color: isOutOfStock ? '#94a3b8' : undefined,
                        cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                        boxShadow: isOutOfStock ? 'none' : undefined
                    }}
                >
                    {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
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
