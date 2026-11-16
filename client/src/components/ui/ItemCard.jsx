import React from 'react';
import { Plus, Slash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../../context/ShopContext';
import { useToast } from '../../context/ToastContext';
import './ItemCard.css';

const ItemCard = ({ item }) => {
    const navigate = useNavigate();
    const { addToCart, language } = useShop();
    const toastContext = useToast();
    const showToast = toastContext?.showToast;

    // Check stock level safely
    const stock = Number(
        item.stockQuantity !== undefined 
            ? item.stockQuantity 
            : (item.countInStock !== undefined ? item.countInStock : 0)
    );
    const isOutOfStock = stock <= 0;

    const handleAdd = (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (isOutOfStock) {
            if (showToast) {
                showToast(
                    language === 'am' ? 'ይቅርታ፣ ይህ እቃ በአሁኑ ወቅት አልቋል!' : 'Sorry, this item is currently out of stock!',
                    'warning'
                );
            }
            return;
        }
        const res = addToCart(item, 1);
        if (res && res.reachedMax && showToast) {
            showToast(
                language === 'am' ? `ከፍተኛው ዕቃ መጠን ደርሷል (${stock} ዕቃ)` : `Max available quantity reached (${stock} in stock)`,
                'info'
            );
        }
    };

    return (
        <div
            className={`item-card ${isOutOfStock ? 'is-out-of-stock' : ''}`}
            onClick={() => navigate(`/item/${item._id}`)}
        >
            <div className="image-container">
                <img src={item.image} alt={item.name} loading="lazy" />

                {/* Cool Frosted Glass Out of Stock Overlay */}
                {isOutOfStock && (
                    <div className="out-of-stock-overlay">
                        <div className="out-of-stock-pill">
                            <span className="out-of-stock-dot"></span>
                            <span>{language === 'am' ? 'አልቋል' : 'Out of Stock'}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="card-content">
                <h3 className="item-name">{item.name}</h3>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <p className="item-category" style={{ margin: 0 }}>{item.category}</p>
                    {isOutOfStock && (
                        <span className="out-of-stock-tag">
                            {language === 'am' ? 'የተሟጠጠ' : 'Sold Out'}
                        </span>
                    )}
                </div>

                <div className="price-row">
                    <span className={`price ${isOutOfStock ? 'price-dimmed' : ''}`}>
                        ${item.price?.toFixed(2)}
                    </span>
                    <button
                        className={`add-btn ${isOutOfStock ? 'add-btn-disabled' : ''}`}
                        onClick={handleAdd}
                        title={isOutOfStock ? (language === 'am' ? 'እቃው አልቋል' : 'Out of Stock') : 'Add to Cart'}
                    >
                        {isOutOfStock ? (
                            <Slash size={14} color="#94a3b8" />
                        ) : (
                            <Plus size={16} color="white" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ItemCard;
