import React, { useState, useEffect } from 'react';
import SearchBar from '../components/ui/SearchBar';
import ItemCard from '../components/ui/ItemCard';
import FilterModal from '../components/ui/FilterModal';
import { useShop } from '../context/ShopContext';
import './Home.css'; // Reusing Home styles for consistency

const SearchPage = () => {
    const { isFilterOpen, setIsFilterOpen, products, categories } = useShop();
    const [searchTerm, setSearchTerm] = useState("");
    const [priceRange, setPriceRange] = useState(null);
    const [activeCategory, setActiveCategory] = useState("All");

    // Auto-focus logic can be added here if needed

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const productCat = product.category.toLowerCase();
        const activeCat = activeCategory.toLowerCase();
        const isCategoryMatch = activeCat === 'all' || productCat === activeCat;

        let matchesPrice = true;
        if (priceRange) {
            const min = priceRange.min ? parseFloat(priceRange.min) : 0;
            const max = priceRange.max ? parseFloat(priceRange.max) : Infinity;
            matchesPrice = product.price >= min && product.price <= max;
        }

        return matchesSearch && isCategoryMatch && matchesPrice;
    });

    return (
        <div className="page home-page">
            <FilterModal
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                onApply={setPriceRange}
            />

            <Header />

            <div className="content-container">
                <SearchBar onSearch={setSearchTerm} onFilterClick={() => setIsFilterOpen(true)} />

                {/* Categories - simplified used for filter context in search page too */}
                <div className="categories-scroll hide-scrollbar">
                    <button
                        className={`category-chip ${activeCategory === 'All' ? 'active' : ''}`}
                        onClick={() => setActiveCategory('All')}
                    >
                        All
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat._id || cat.id}
                            className={`category-chip ${activeCategory === cat.name ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat.name)}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                <div className="product-grid" style={{ marginTop: 20 }}>
                    {filteredProducts.length > 0 ? (
                        filteredProducts.map(product => (
                            <ItemCard key={product._id} item={product} />
                        ))
                    ) : (
                        <div className="empty-search">
                            <p>No results found for "{searchTerm}"</p>
                        </div>
                    )}
                </div>
            </div>
            <div style={{ height: '80px' }}></div>
        </div>
    );
};

const Header = () => (
    <header className="home-header">
        <div className="brand">
            <h1 className="brand-title">Search</h1>
        </div>
    </header>
);

export default SearchPage;
