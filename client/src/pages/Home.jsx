import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import SearchBar from '../components/ui/SearchBar';
import ItemCard from '../components/ui/ItemCard';
import FilterModal from '../components/ui/FilterModal';
import { useShop } from '../context/ShopContext';
import './Home.css';

const Home = () => {
    const { isFilterOpen, setIsFilterOpen, activeCategory, setActiveCategory, products, categories, banners, isLoading, language, setLanguage, refreshProducts, storeName } = useShop();
    const [searchTerm, setSearchTerm] = useState("");
    const [priceRange, setPriceRange] = useState(null);

    // Refresh products on mount to ensure latest stock levels are displayed
    useEffect(() => {
        if (refreshProducts) {
            refreshProducts();
        }
    }, []);

    // Loading State
    if (isLoading) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>Loading products...</div>;
    }

    const filteredProducts = products.filter(product => {
        // Search
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());

        // Category (Case insensitive check)
        const productCat = product.category.toLowerCase();
        const activeCat = activeCategory.toLowerCase();
        const isCategoryMatch = activeCat === 'all' || productCat === activeCat;

        // Price
        let matchesPrice = true;
        if (priceRange) {
            const min = priceRange.min ? parseFloat(priceRange.min) : 0;
            const max = priceRange.max ? parseFloat(priceRange.max) : Infinity;
            matchesPrice = product.price >= min && product.price <= max;
        }

        return matchesSearch && isCategoryMatch && matchesPrice;
    }).sort((a, b) => {
        // Prioritize in-stock products at the top of the list
        const stockA = Number(a.stockQuantity !== undefined ? a.stockQuantity : (a.countInStock || 0));
        const stockB = Number(b.stockQuantity !== undefined ? b.stockQuantity : (b.countInStock || 0));
        const isOutA = stockA <= 0;
        const isOutB = stockB <= 0;

        if (!isOutA && isOutB) return -1; // a is in stock, move up
        if (isOutA && !isOutB) return 1;  // b is in stock, move up
        return stockB - stockA;           // higher stock first if both in stock
    });

    return (
        <div className="page home-page">
            <FilterModal
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                onApply={setPriceRange}
            />

            <header className="home-header">
                <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                    <img src="/logo.svg" alt={`${storeName} Logo`} style={{ width: '30px', height: '30px' }} />
                    <h1 className="brand-title">{storeName}</h1>
                </div>
                <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className="language-toggle" onClick={() => setLanguage(lang => lang === 'en' ? 'am' : 'en')}>
                        <span className={language === 'en' ? 'active' : ''}>En</span>
                        <div className={`toggle-switch ${language}`}>
                            <div className="toggle-knob"></div>
                        </div>
                        <span className={language === 'am' ? 'active' : ''}>አማ</span>
                    </div>
                </div>
            </header>

            <div className="content-container">
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', marginTop: '1rem' }}>
                    {language === 'en' ? 'Find anything you want today' : 'ዛሬ የሚፈልጉትን ማንኛውንም ነገር ያግኙ'}
                </h2>

                <SearchBar onSearch={setSearchTerm} onFilterClick={() => setIsFilterOpen(!isFilterOpen)} />

                {/* Categories */}
                <div className="categories-scroll hide-scrollbar">
                    {/* Add 'All' option manually if not in DB, or handle in Context */}
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

                {/* Dynamic Banners */}
                <div className="banners-container">
                    {banners.length > 0 ? (
                        banners.map(banner => (
                            <div 
                                key={banner._id} 
                                className="cool-hero-banner" 
                                style={{ backgroundImage: `url(${banner.image})` }}
                            >
                                <div className="banner-gradient-overlay" />
                                <div className="banner-inner-content">
                                    <div className="banner-pill-badge">
                                        <Sparkles size={13} className="badge-sparkle-icon" />
                                        <span>{language === 'en' ? 'Fast Local Delivery' : 'ፈጣን የቤት አቅርቦት'}</span>
                                    </div>
                                    <div className="banner-text-block">
                                        <h2>{banner.title}</h2>
                                        <p>{banner.subtitle}</p>
                                    </div>
                                    <a href={banner.buttonLink || '#'} className="banner-cool-btn">
                                        <span>{banner.buttonText || (language === 'en' ? 'Shop Now' : 'አሁን ይግዙ')}</span>
                                        <ArrowRight size={15} className="banner-arrow-icon" />
                                    </a>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="cool-hero-banner fallback-banner-bg">
                            <div className="banner-gradient-overlay" />
                            <div className="banner-inner-content">
                                <div className="banner-pill-badge">
                                    <Sparkles size={13} className="badge-sparkle-icon" />
                                    <span>{language === 'en' ? 'Welcome' : 'እንኳን ደህና መጡ'}</span>
                                </div>
                                <div className="banner-text-block">
                                    <h2>{language === 'en' ? `Welcome to ${storeName}` : `እንኳን ወደ ${storeName} በደህና መጡ`}</h2>
                                    <p>{language === 'en' ? 'Your one stop shop for everyday essentials.' : 'የእርስዎ አንድ ማቆሚያ ሱቅ።'}</p>
                                </div>
                                <button className="banner-cool-btn" onClick={() => window.location.href = '/'}>
                                    <span>{language === 'en' ? 'Shop Now' : 'አሁን ይግዙ'}</span>
                                    <ArrowRight size={15} className="banner-arrow-icon" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Product Grid */}
                <h3 className="section-title">
                    {language === 'en' ? 'New Arrivals' : 'አዲስ የገቡ እቃዎች'}
                </h3>
                <div className="product-grid">
                    {filteredProducts.length > 0 ? (
                        filteredProducts.map(product => (
                            <ItemCard key={product._id} item={product} />
                        ))
                    ) : (
                        <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#888', marginTop: '20px' }}>
                            No items found.
                        </p>
                    )}
                </div>
            </div>

            {/* Spacer for bottom nav */}
            <div style={{ height: '20px' }}></div>
        </div>
    );
};

export default Home;
