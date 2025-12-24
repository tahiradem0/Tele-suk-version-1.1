import React from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ItemCard.css';

const ItemCard = ({ item }) => {
    const navigate = useNavigate();

    return (
        <div className="item-card" onClick={() => navigate(`/item/${item._id}`)}>
            <div className="image-container">
                <img src={item.image} alt={item.name} loading="lazy" />
            </div>
            <div className="card-content">
                <h3 className="item-name">{item.name}</h3>
                <p className="item-category">{item.category}</p>
                <div className="price-row">
                    <span className="price">${item.price.toFixed(2)}</span>
                    <button className="add-btn">
                        <Plus size={16} color="white" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ItemCard;
