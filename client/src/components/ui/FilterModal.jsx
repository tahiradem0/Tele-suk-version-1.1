import React, { useState } from 'react';
import { X } from 'lucide-react';
import './FilterModal.css';

const FilterModal = ({ isOpen, onClose, onApply }) => {
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');

    if (!isOpen) return null;

    const handleApply = () => {
        onApply({ min: minPrice, max: maxPrice });
        onClose();
    };

    const handleReset = () => {
        setMinPrice('');
        setMaxPrice('');
        onApply(null);
        onClose();
    };

    return (
        <>
            <div className="filter-overlay" onClick={onClose}></div>
            <div className="filter-modal">
                <div className="filter-header">
                    <h3>Filter</h3>
                    <button onClick={onClose}><X size={24} /></button>
                </div>

                <div className="filter-content">
                    <div className="filter-section">
                        <label>Price Range</label>
                        <div className="price-inputs">
                            <div className="input-group">
                                <span>$</span>
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={minPrice}
                                    onChange={(e) => setMinPrice(e.target.value)}
                                />
                            </div>
                            <div className="divider">-</div>
                            <div className="input-group">
                                <span>$</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="filter-actions">
                    <button className="reset-btn" onClick={handleReset}>Reset</button>
                    <button className="apply-btn" onClick={handleApply}>Apply Filters</button>
                </div>
            </div>
        </>
    );
};

export default FilterModal;
