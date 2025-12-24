import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import './SearchBar.css';

const SearchBar = ({ onSearch, onFilterClick }) => {
    return (
        <div className="search-container">
            <div className="search-bar">
                <Search className="search-icon" size={20} />
                <input
                    type="text"
                    placeholder="Search items..."
                    onChange={(e) => onSearch(e.target.value)}
                />
            </div>
            <button className="filter-btn" onClick={onFilterClick}>
                <SlidersHorizontal size={20} />
            </button>
        </div>
    );
};

export default SearchBar;
