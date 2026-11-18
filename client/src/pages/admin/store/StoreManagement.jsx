import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Warehouse,
    Search,
    Plus,
    Minus,
    AlertTriangle,
    TrendingUp,
    CheckCircle2,
    RefreshCw,
    Wallet,
    Package,
    Sparkles,
    History,
    SlidersHorizontal,
    X,
    ArrowRight,
    Loader2,
    ClipboardList,
    PackageX,
    RotateCcw,
    Banknote,
    Smartphone,
    Landmark,
} from 'lucide-react';
import { storeService, categoryService, forceRefreshCache } from '../../../services/api';
import { useAdminLanguage } from '../../../context/AdminLanguageContext';
import { useShop } from '../../../context/ShopContext';
import { toEthiopianDate } from '../../../utils/ethiopianDate';
import SmartStockAdvisor from './SmartStockAdvisor';
import CoolSelect from '../../../components/ui/CoolSelect';
import VoiceInput from '../../../components/ui/VoiceInput';
import './StoreManagement.css';

const QUICK_ADD_AMOUNTS = [5, 10, 20, 50, 100];

const PAYMENT_OPTIONS = [
    { value: 'Cash', en: 'Cash', am: 'በእጅ (ካሽ)', icon: Banknote },
    { value: 'Telebirr', en: 'Telebirr', am: 'ቴሌብር', icon: Smartphone },
    { value: 'CBEBirr', en: 'CBEBirr', am: 'ሲቢኢ ብር', icon: Smartphone },
    { value: 'Bank Transfer', en: 'Bank', am: 'በባንክ', icon: Landmark },
];

const StoreManagement = ({ initialTab } = {}) => {
    const { isAmharic } = useAdminLanguage();
    const { refreshProducts } = useShop();
    const [searchParams] = useSearchParams();

    const [overview, setOverview] = useState(null);
    const [insights, setInsights] = useState(null);
    const [movements, setMovements] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activeTab, setActiveTab] = useState(
        initialTab || (searchParams.get('view') === 'advisor' || searchParams.get('tab') === 'advisor' ? 'advisor' : 'inventory')
    );
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'in_stock' | 'low_stock' | 'out_of_stock'
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [justRefreshed, setJustRefreshed] = useState(false);

    // Inline Toast (no jarring browser alert()!)
    const [toast, setToast] = useState(null);
    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3200);
    }, []);

    // Modals
    const [restockModalOpen, setRestockModalOpen] = useState(false);
    const [adjustModalOpen, setAdjustModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Restock form state
    const [restockForm, setRestockForm] = useState({
        quantity: '10',
        costPrice: '',
        supplier: '',
        note: '',
        syncCapital: true,
        paymentMethod: 'Cash',
    });

    // Adjust form state
    const [adjustForm, setAdjustForm] = useState({
        newStockQuantity: '0',
        type: 'adjustment',
        note: '',
    });

    const loadData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [overviewRes, catRes, movementsRes, insightsRes] = await Promise.all([
                storeService.getOverview(),
                categoryService.getAll(),
                storeService.getMovements({ limit: 50 }),
                storeService.getInsights().catch(() => ({ data: null })),
            ]);
            setOverview(overviewRes.data);
            setCategories(catRes.data || []);
            setMovements(movementsRes.data || []);
            if (insightsRes?.data) setInsights(insightsRes.data);
        } catch (error) {
            console.error('Failed to load store data', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Close modal smoothly on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setRestockModalOpen(false);
                setAdjustModalOpen(false);
            }
        };
        if (restockModalOpen || adjustModalOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [restockModalOpen, adjustModalOpen]);

    const handleRefresh = async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        setJustRefreshed(false);
        try {
            forceRefreshCache();
            await loadData(true);
            if (refreshProducts) {
                await refreshProducts();
            }
            setJustRefreshed(true);
            setTimeout(() => setJustRefreshed(false), 2000);
        } catch (error) {
            console.error('Failed to refresh store data:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleOpenRestock = (product, suggestedQty = '') => {
        setSelectedProduct(product);
        setRestockForm({
            quantity: suggestedQty ? String(suggestedQty) : '10',
            costPrice: product.costPrice !== undefined ? String(product.costPrice) : '',
            supplier: product.supplier || '',
            note: '',
            syncCapital: true,
            paymentMethod: 'Cash',
        });
        setRestockModalOpen(true);
    };

    const handleOpenAdjust = (product) => {
        setSelectedProduct(product);
        setAdjustForm({
            newStockQuantity: String(product.stockQuantity || 0),
            type: 'adjustment',
            note: '',
        });
        setAdjustModalOpen(true);
    };

    const adjustRestockQty = (delta) => {
        setRestockForm((prev) => {
            const current = Math.max(0, Number(prev.quantity) || 0);
            const next = Math.max(1, current + delta);
            return { ...prev, quantity: String(next) };
        });
    };

    const setQuickRestockQty = (amount) => {
        setRestockForm((prev) => ({ ...prev, quantity: String(amount) }));
    };

    const adjustCountStepper = (delta) => {
        setAdjustForm((prev) => {
            const current = Math.max(0, Number(prev.newStockQuantity) || 0);
            const next = Math.max(0, current + delta);
            return { ...prev, newStockQuantity: String(next) };
        });
    };

    const handleRestockSubmit = async (e) => {
        e.preventDefault();
        const qty = Number(restockForm.quantity);
        if (!qty || qty <= 0) {
            showToast(isAmharic ? 'እባክዎ ትክክለኛ ብዛት ያስገቡ' : 'Please enter a quantity greater than 0', 'error');
            return;
        }
        setSubmitting(true);
        try {
            await storeService.restock({
                productId: selectedProduct._id,
                quantity: qty,
                costPrice: Number(restockForm.costPrice) || 0,
                supplier: restockForm.supplier.trim(),
                note: restockForm.note.trim(),
                syncCapital: restockForm.syncCapital,
                paymentMethod: restockForm.paymentMethod,
            });
            setRestockModalOpen(false);
            showToast(
                isAmharic
                    ? `+${qty} ${selectedProduct.name} ወደ ክምችት ተጨምሯል!`
                    : `Added +${qty} ${selectedProduct.name} to your shop!`,
                'success'
            );
            await loadData(true);
            if (refreshProducts) refreshProducts();
        } catch (error) {
            showToast(
                error.response?.data?.message || (isAmharic ? 'ክምችት መጨመር አልተቻለም' : 'Could not add stock'),
                'error'
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleAdjustSubmit = async (e) => {
        e.preventDefault();
        const target = Number(adjustForm.newStockQuantity);
        if (isNaN(target) || target < 0) {
            showToast(isAmharic ? 'እባክዎ ትክክለኛ ቁጥር ያስገቡ' : 'Please enter 0 or more', 'error');
            return;
        }
        setSubmitting(true);
        try {
            await storeService.adjustStock({
                productId: selectedProduct._id,
                newStockQuantity: target,
                type: adjustForm.type,
                note: adjustForm.note.trim(),
            });
            setAdjustModalOpen(false);
            showToast(
                isAmharic
                    ? `የ${selectedProduct.name} ክምችት ወደ ${target} ተስተካክሏል!`
                    : `${selectedProduct.name} count updated to ${target}!`,
                'success'
            );
            await loadData(true);
            if (refreshProducts) refreshProducts();
        } catch (error) {
            showToast(
                error.response?.data?.message || (isAmharic ? 'ማስተካከል አልተቻለም' : 'Could not update count'),
                'error'
            );
        } finally {
            setSubmitting(false);
        }
    };

    const summary = overview?.summary || {
        totalProducts: 0,
        totalStockUnits: 0,
        totalCostValuation: 0,
        totalRetailValuation: 0,
        potentialGrossProfit: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
    };

    const inventory = overview?.inventory || [];
    const alertTotal = summary.lowStockCount + summary.outOfStockCount;
    const goodCount = inventory.filter((i) => i.status === 'in_stock').length;

    const filteredInventory = inventory.filter((item) => {
        const q = searchTerm.trim().toLowerCase();
        const matchesSearch =
            !q ||
            item.name.toLowerCase().includes(q) ||
            (item.brand && item.brand.toLowerCase().includes(q)) ||
            (item.category && item.category.toLowerCase().includes(q));
        const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
        const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
        return matchesSearch && matchesCat && matchesStatus;
    });

    // Live Restock Modal Math
    const addQtyNum = Math.max(0, Number(restockForm.quantity) || 0);
    const unitCostNum = Math.max(0, Number(restockForm.costPrice) || 0);
    const totalRestockCost = addQtyNum * unitCostNum;
    const currentModalStock = selectedProduct?.stockQuantity || 0;
    const nextRestockTotal = currentModalStock + addQtyNum;
    const profitPerUnit = selectedProduct ? (Number(selectedProduct.price) || 0) - unitCostNum : 0;

    // Live Adjust Modal Math
    const nextAdjustQty = Math.max(0, Number(adjustForm.newStockQuantity) || 0);
    const adjustDelta = nextAdjustQty - currentModalStock;

    return (
        <div className="sm-page">
            {/* Header */}
            <div className="sm-header">
                <div className="sm-title-wrap">
                    <div className="sm-title-icon">
                        <Warehouse size={23} />
                    </div>
                    <div>
                        <h1 className="sm-title">
                            {isAmharic ? 'የሱቄ እቃ እና ክምችት' : 'My Shop Stock'}
                        </h1>
                        <p className="sm-subtitle">
                            {isAmharic
                                ? 'በሱቅዎ ውስጥ ያሉ እቃዎችን ይመልከቱ፣ አዲስ እቃ ይጨምሩ እና ቆጠራ ያስተካክሉ።'
                                : 'See what is on your shelves, add new stock, and fix counts in seconds.'}
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className={`admin-refresh-btn ${justRefreshed ? 'refreshed-success' : ''}`}
                    title={isAmharic ? 'የመደብር ክምችትን አድስ' : 'Refresh shop stock'}
                >
                    {justRefreshed ? (
                        <>
                            <CheckCircle2 size={16} color="#10b981" />
                            <span>{isAmharic ? 'ተዘምኗል!' : 'Updated!'}</span>
                        </>
                    ) : (
                        <>
                            <RefreshCw size={16} className={isRefreshing ? 'spinning-refresh-icon' : ''} />
                            <span>
                                {isRefreshing
                                    ? isAmharic ? 'በማደስ ላይ...' : 'Refreshing...'
                                    : isAmharic ? 'አድስ' : 'Refresh'}
                            </span>
                        </>
                    )}
                </button>
            </div>

            {/* 4 Plain-Language KPI Cards */}
            <div className="sm-kpi-grid">
                <div className="sm-kpi-card">
                    <div>
                        <div className="sm-kpi-label">
                            {isAmharic ? 'በሱቅ ውስጥ ያሉ እቃዎች' : 'Items In Shop'}
                        </div>
                        <div className="sm-kpi-value">{summary.totalStockUnits.toLocaleString()}</div>
                        <div className="sm-kpi-sub">
                            {isAmharic
                                ? `${summary.totalProducts} የተለያዩ ምርቶች`
                                : `Across ${summary.totalProducts} products`}
                        </div>
                    </div>
                    <div className="sm-kpi-icon cyan">
                        <Package size={20} />
                    </div>
                </div>

                <div className="sm-kpi-card">
                    <div>
                        <div className="sm-kpi-label">
                            {isAmharic ? 'ለእቃ የወጣ ገንዘብ' : 'Money Paid for Stock'}
                        </div>
                        <div className="sm-kpi-value">ETB {summary.totalCostValuation.toLocaleString()}</div>
                        <div className="sm-kpi-sub">
                            {isAmharic
                                ? `ሲሸጥ ዋጋው: ETB ${summary.totalRetailValuation.toLocaleString()}`
                                : `Sell value: ETB ${summary.totalRetailValuation.toLocaleString()}`}
                        </div>
                    </div>
                    <div className="sm-kpi-icon amber">
                        <Wallet size={20} />
                    </div>
                </div>

                <div className="sm-kpi-card">
                    <div>
                        <div className="sm-kpi-label">
                            {isAmharic ? 'ሁሉም ሲሸጥ የሚገኝ ትርፍ' : 'Profit When Sold'}
                        </div>
                        <div className="sm-kpi-value green">
                            +ETB {summary.potentialGrossProfit.toLocaleString()}
                        </div>
                        <div className="sm-kpi-sub">
                            {isAmharic ? 'ከአሁኑ ክምችት የሚጠበቅ ትርፍ' : 'Expected profit from current shelves'}
                        </div>
                    </div>
                    <div className="sm-kpi-icon emerald">
                        <TrendingUp size={20} />
                    </div>
                </div>

                <div
                    className={`sm-kpi-card clickable ${alertTotal > 0 ? 'alert-active' : ''}`}
                    onClick={() => {
                        setActiveTab('inventory');
                        setStatusFilter(summary.outOfStockCount > 0 ? 'out_of_stock' : alertTotal > 0 ? 'low_stock' : 'All');
                    }}
                    title={isAmharic ? 'ለማጣራት ይጫኑ' : 'Click to view items needing attention'}
                >
                    <div>
                        <div className="sm-kpi-label">
                            {isAmharic ? 'በቅርቡ መገዛት ያለባቸው' : 'Need To Buy Soon'}
                        </div>
                        <div className={`sm-kpi-value ${alertTotal > 0 ? 'rose' : ''}`}>
                            {isAmharic ? `${alertTotal} እቃዎች` : `${alertTotal} items`}
                        </div>
                        <div className="sm-kpi-sub">
                            {alertTotal === 0
                                ? isAmharic ? 'ሁሉም እቃዎች ጥሩ ክምችት አላቸው' : 'All shelves look healthy'
                                : isAmharic
                                    ? `${summary.outOfStockCount} ያለቁ • ${summary.lowStockCount} እያለቁ ያሉ`
                                    : `${summary.outOfStockCount} finished • ${summary.lowStockCount} running low`}
                        </div>
                    </div>
                    <div className={`sm-kpi-icon ${alertTotal > 0 ? 'rose' : 'slate'}`}>
                        <AlertTriangle size={20} />
                    </div>
                </div>
            </div>

            {/* Clean Segmented Tabs */}
            <div className="sm-tabs">
                <button
                    className={`sm-tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
                    onClick={() => setActiveTab('inventory')}
                >
                    <Package size={15} />
                    <span>{isAmharic ? 'ሁሉም እቃዎቼ' : 'All My Stock'}</span>
                    <span className="sm-tab-count">{inventory.length}</span>
                </button>

                <button
                    className={`sm-tab-btn ${activeTab === 'advisor' ? 'active' : ''}`}
                    onClick={() => setActiveTab('advisor')}
                >
                    <Sparkles size={15} />
                    <span>{isAmharic ? 'ቀላል ምክር' : 'Smart Advice'}</span>
                    {(insights?.summary?.buySoonCount || 0) > 0 && (
                        <span className="sm-tab-badge-alert">{insights.summary.buySoonCount}</span>
                    )}
                </button>

                <button
                    className={`sm-tab-btn ${activeTab === 'movements' ? 'active' : ''}`}
                    onClick={() => setActiveTab('movements')}
                >
                    <History size={15} />
                    <span>{isAmharic ? 'የክምችት ታሪክ' : 'Stock History'}</span>
                    <span className="sm-tab-count">{movements.length}</span>
                </button>
            </div>

            {/* TAB CONTENT */}
            {activeTab === 'advisor' ? (
                <SmartStockAdvisor
                    insights={insights}
                    isAmharic={isAmharic}
                    onQuickRestock={(product, suggestedQty) => handleOpenRestock(product, suggestedQty)}
                />
            ) : activeTab === 'inventory' ? (
                <>
                    {/* Search + Quick Status Pills */}
                    <div className="sm-toolbar">
                        <div className="sm-search-box">
                            <Search size={17} className="sm-search-icon" />
                            <input
                                type="text"
                                className="sm-search-input"
                                placeholder={isAmharic ? 'የእቃ ስም ይፈልጉ...' : 'Search product name...'}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    className="sm-search-clear"
                                    onClick={() => setSearchTerm('')}
                                    aria-label="Clear search"
                                >
                                    <X size={15} />
                                </button>
                            )}
                        </div>

                        <div className="sm-filter-group">
                            <button
                                type="button"
                                className={`sm-pill ${statusFilter === 'All' ? 'active' : ''}`}
                                onClick={() => setStatusFilter('All')}
                            >
                                {isAmharic ? 'ሁሉም' : 'All'} ({inventory.length})
                            </button>
                            <button
                                type="button"
                                className={`sm-pill ${statusFilter === 'in_stock' ? 'active good' : ''}`}
                                onClick={() => setStatusFilter('in_stock')}
                            >
                                {isAmharic ? 'ጥሩ ክምችት' : 'Good'} ({goodCount})
                            </button>
                            <button
                                type="button"
                                className={`sm-pill ${statusFilter === 'low_stock' ? 'active low' : ''}`}
                                onClick={() => setStatusFilter('low_stock')}
                            >
                                {isAmharic ? 'እያለቀ ያለ' : 'Low'} ({summary.lowStockCount})
                            </button>
                            <button
                                type="button"
                                className={`sm-pill ${statusFilter === 'out_of_stock' ? 'active out' : ''}`}
                                onClick={() => setStatusFilter('out_of_stock')}
                            >
                                {isAmharic ? 'ያለቀ' : 'Finished'} ({summary.outOfStockCount})
                            </button>

                            {categories.length > 0 && (
                                <CoolSelect
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    style={{ width: 'auto', minWidth: '155px', minHeight: '36px', padding: '0.42rem 0.85rem', borderRadius: '999px', fontSize: '0.82rem' }}
                                >
                                    <option value="All">{isAmharic ? 'ሁሉም ምድቦች' : 'All Categories'}</option>
                                    {categories.map((c) => (
                                        <option key={c._id} value={c.name}>
                                            {c.name}
                                        </option>
                                    ))}
                                </CoolSelect>
                            )}
                        </div>
                    </div>

                    {/* Clean Stock Table */}
                    <div className="sm-table-card">
                        <div className="sm-table-scroll">
                            <table className="sm-table">
                                <thead>
                                    <tr>
                                        <th>{isAmharic ? 'ምርት' : 'Product'}</th>
                                        <th>{isAmharic ? 'ዋጋ እና ትርፍ' : 'Price & Profit'}</th>
                                        <th>{isAmharic ? 'አሁን ያለ ክምችት' : 'In Shop Now'}</th>
                                        <th>{isAmharic ? 'ጠቅላላ ዋጋ' : 'Stock Worth'}</th>
                                        <th style={{ textAlign: 'right' }}>{isAmharic ? 'እርምጃ' : 'Actions'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading && inventory.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="sm-empty">
                                                <Loader2 size={24} className="sm-spinner" style={{ marginBottom: '0.5rem' }} />
                                                <div>{isAmharic ? 'ክምችት በመጫን ላይ...' : 'Loading your shop stock...'}</div>
                                            </td>
                                        </tr>
                                    ) : filteredInventory.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="sm-empty">
                                                {isAmharic
                                                    ? 'ከፍለጋዎ ጋር የሚዛመድ እቃ አልተገኘም።'
                                                    : 'No products match this filter.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredInventory.map((item) => {
                                            const eachProfit = (Number(item.price) || 0) - (Number(item.costPrice) || 0);
                                            const minTarget = Math.max(10, (item.minStockLevel || 5) * 3);
                                            const fillPct = Math.min(100, Math.round(((item.stockQuantity || 0) / minTarget) * 100));
                                            const barColor =
                                                item.status === 'out_of_stock'
                                                    ? '#f43f5e'
                                                    : item.status === 'low_stock'
                                                        ? '#f59e0b'
                                                        : '#10b981';

                                            return (
                                                <tr key={item._id}>
                                                    <td>
                                                        <div className="sm-product-cell">
                                                            {item.image ? (
                                                                <img
                                                                    src={item.image}
                                                                    alt={item.name}
                                                                    className="sm-product-thumb"
                                                                    onError={(e) => {
                                                                        e.target.style.display = 'none';
                                                                    }}
                                                                />
                                                            ) : (
                                                                <div className="sm-product-thumb-fallback">
                                                                    <Package size={20} />
                                                                </div>
                                                            )}
                                                            <div>
                                                                <div className="sm-product-name">{item.name}</div>
                                                                <div className="sm-product-meta">
                                                                    <span className="sm-cat-tag">{item.category}</span>
                                                                    {item.brand && (
                                                                        <span className="sm-brand-text">{item.brand}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td>
                                                        <div className="sm-price-main">
                                                            {isAmharic ? 'መሸጫ: ' : 'Sell: '}ETB {Number(item.price || 0).toLocaleString()}
                                                        </div>
                                                        <div className="sm-price-sub">
                                                            {isAmharic ? 'መግዣ: ' : 'Buy: '}ETB {Number(item.costPrice || 0).toLocaleString()}
                                                        </div>
                                                        <span className={`sm-profit-chip ${eachProfit <= 0 ? 'warn' : ''}`}>
                                                            {eachProfit >= 0 ? `+ETB ${eachProfit.toLocaleString()}` : `-ETB ${Math.abs(eachProfit).toLocaleString()}`}{' '}
                                                            {isAmharic ? 'ትርፍ' : 'profit each'}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <div className="sm-stock-row">
                                                            <span
                                                                className={`sm-stock-num ${
                                                                    item.status === 'out_of_stock'
                                                                        ? 'out'
                                                                        : item.status === 'low_stock'
                                                                            ? 'low'
                                                                            : ''
                                                                }`}
                                                            >
                                                                {item.stockQuantity}
                                                            </span>
                                                            <span
                                                                className={`sm-status-pill ${
                                                                    item.status === 'out_of_stock'
                                                                        ? 'out'
                                                                        : item.status === 'low_stock'
                                                                            ? 'low'
                                                                            : 'good'
                                                                }`}
                                                            >
                                                                {item.status === 'out_of_stock'
                                                                    ? isAmharic ? 'ያለቀ' : 'Finished'
                                                                    : item.status === 'low_stock'
                                                                        ? isAmharic ? 'እያለቀ' : 'Running Low'
                                                                        : isAmharic ? 'ጥሩ ክምችት' : 'Good Stock'}
                                                            </span>
                                                        </div>
                                                        <div className="sm-stock-bar-track">
                                                            <div
                                                                className="sm-stock-bar-fill"
                                                                style={{ width: `${Math.max(item.stockQuantity > 0 ? 12 : 0, fillPct)}%`, background: barColor }}
                                                            />
                                                        </div>
                                                    </td>

                                                    <td>
                                                        <div className="sm-price-main">
                                                            ETB {item.retailValue.toLocaleString()}
                                                        </div>
                                                        <div className="sm-price-sub">
                                                            {isAmharic ? 'የተገዛበት: ' : 'Paid: '}ETB {item.costValue.toLocaleString()}
                                                        </div>
                                                    </td>

                                                    <td>
                                                        <div className="sm-actions">
                                                            <button
                                                                type="button"
                                                                className="sm-btn-add"
                                                                onClick={() => handleOpenRestock(item)}
                                                            >
                                                                <Plus size={14} />
                                                                <span>{isAmharic ? 'እቃ ጨምር' : 'Add Stock'}</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="sm-btn-fix"
                                                                onClick={() => handleOpenAdjust(item)}
                                                            >
                                                                <SlidersHorizontal size={13} />
                                                                <span>{isAmharic ? 'ቆጠራ' : 'Fix Count'}</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                /* Clean Stock History Tab */
                <div className="sm-table-card">
                    <div className="sm-table-scroll">
                        <table className="sm-table">
                            <thead>
                                <tr>
                                    <th>{isAmharic ? 'ቀን' : 'Date'}</th>
                                    <th>{isAmharic ? 'ምርት' : 'Product'}</th>
                                    <th>{isAmharic ? 'ምን ተደረገ' : 'What Happened'}</th>
                                    <th>{isAmharic ? 'ለውጥ' : 'Change'}</th>
                                    <th>{isAmharic ? 'ከ → ወደ' : 'Before → After'}</th>
                                    <th>{isAmharic ? 'ማስታወሻ' : 'Note'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {movements.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="sm-empty">
                                            {isAmharic
                                                ? 'እስካሁን ምንም የክምችት ታሪክ አልተመዘገበም።'
                                                : 'No stock history recorded yet.'}
                                        </td>
                                    </tr>
                                ) : (
                                    movements.map((m) => {
                                        const diff = m.newStock - m.previousStock;
                                        const isPositive = diff >= 0;
                                        const badgeClass =
                                            m.type === 'restock'
                                                ? 'restock'
                                                : m.type === 'sale'
                                                    ? 'sale'
                                                    : m.type === 'return'
                                                        ? 'return'
                                                        : m.type === 'damage_loss'
                                                            ? 'damage'
                                                            : 'adjust';
                                        const badgeLabel =
                                            m.type === 'restock'
                                                ? isAmharic ? 'እቃ ተጨመረ' : 'Added Stock'
                                                : m.type === 'sale'
                                                    ? isAmharic ? 'ተሸጠ' : 'Sold'
                                                    : m.type === 'return'
                                                        ? isAmharic ? 'ተመለሰ' : 'Returned'
                                                        : m.type === 'damage_loss'
                                                            ? isAmharic ? 'ተበላሸ / ጠፋ' : 'Damaged'
                                                            : isAmharic ? 'ቆጠራ ተስተካከለ' : 'Count Fixed';

                                        return (
                                            <tr key={m._id}>
                                                <td>
                                                    <div className="sm-price-main" style={{ fontSize: '0.84rem' }}>
                                                        {new Date(m.createdAt).toLocaleDateString()}
                                                    </div>
                                                    <div className="sm-price-sub" style={{ fontSize: '0.73rem' }}>
                                                        {toEthiopianDate(m.createdAt)} •{' '}
                                                        {new Date(m.createdAt).toLocaleTimeString([], {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="sm-product-name">{m.productName}</div>
                                                </td>
                                                <td>
                                                    <span className={`sm-move-badge ${badgeClass}`}>
                                                        {badgeLabel}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span
                                                        style={{
                                                            fontWeight: 800,
                                                            color: isPositive ? '#10b981' : '#f43f5e',
                                                        }}
                                                    >
                                                        {isPositive ? `+${Math.abs(diff)}` : `-${Math.abs(diff)}`}
                                                    </span>
                                                </td>
                                                <td style={{ fontSize: '0.88rem', color: 'var(--admin-subtext, #64748b)' }}>
                                                    {m.previousStock} → <strong style={{ color: 'var(--admin-text, #0f172a)' }}>{m.newStock}</strong>
                                                </td>
                                                <td style={{ fontSize: '0.82rem', color: 'var(--admin-subtext, #64748b)' }}>
                                                    {m.supplier && (
                                                        <strong style={{ color: 'var(--admin-text, #0f172a)' }}>
                                                            {m.supplier}:{' '}
                                                        </strong>
                                                    )}
                                                    {m.note || '—'}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* =====================================================
                ENHANCED SIMPLE ADD STOCK (RESTOCK) MODAL
               ===================================================== */}
            {restockModalOpen && selectedProduct && (
                <div
                    className="sm-modal-backdrop"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setRestockModalOpen(false);
                    }}
                >
                    <div className="sm-modal" role="dialog" aria-modal="true">
                        <div className="sm-modal-top">
                            <div className="sm-modal-product">
                                {selectedProduct.image ? (
                                    <img
                                        src={selectedProduct.image}
                                        alt={selectedProduct.name}
                                        className="sm-product-thumb"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <div className="sm-product-thumb-fallback">
                                        <Package size={20} />
                                    </div>
                                )}
                                <div>
                                    <div className="sm-preview-label">
                                        {isAmharic ? 'አዲስ እቃ መጨመሪያ' : 'Add New Stock'}
                                    </div>
                                    <h2 className="sm-modal-title">{selectedProduct.name}</h2>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="sm-modal-close"
                                onClick={() => setRestockModalOpen(false)}
                                aria-label="Close"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Live Before -> After Stock Strip */}
                        <div className="sm-stock-preview">
                            <div className="sm-preview-col">
                                <span className="sm-preview-label">
                                    {isAmharic ? 'አሁን ያለው' : 'In Shop Now'}
                                </span>
                                <span className="sm-preview-val">{currentModalStock}</span>
                            </div>

                            <div className={`sm-preview-arrow ${addQtyNum === 0 ? 'neutral' : ''}`}>
                                <span>+{addQtyNum}</span>
                                <ArrowRight size={14} />
                            </div>

                            <div className="sm-preview-col right">
                                <span className="sm-preview-label">
                                    {isAmharic ? 'አዲሱ ክምችት' : 'After Adding'}
                                </span>
                                <span className="sm-preview-val after-good">{nextRestockTotal}</span>
                            </div>
                        </div>

                        <form onSubmit={handleRestockSubmit} className="sm-form">
                            {/* Step 1: Quantity with Stepper + Quick Chips */}
                            <div>
                                <label className="sm-label">
                                    {isAmharic ? 'ስንት ፍሬ አመጡ? *' : 'How many pieces to add? *'}
                                </label>
                                <div className="sm-stepper">
                                    <button
                                        type="button"
                                        className="sm-step-btn"
                                        onClick={() => adjustRestockQty(-1)}
                                        aria-label="Decrease quantity"
                                    >
                                        <Minus size={18} />
                                    </button>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        className="sm-qty-input"
                                        value={restockForm.quantity}
                                        onChange={(e) =>
                                            setRestockForm({ ...restockForm, quantity: e.target.value })
                                        }
                                        placeholder="10"
                                    />
                                    <button
                                        type="button"
                                        className="sm-step-btn"
                                        onClick={() => adjustRestockQty(1)}
                                        aria-label="Increase quantity"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                                <div className="sm-quick-chips">
                                    {QUICK_ADD_AMOUNTS.map((amt) => (
                                        <button
                                            key={amt}
                                            type="button"
                                            className="sm-quick-chip"
                                            onClick={() => setQuickRestockQty(amt)}
                                        >
                                            +{amt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Step 2: Buying Price & Supplier */}
                            <div className="sm-two-col">
                                <div>
                                    <label className="sm-label">
                                        {isAmharic ? 'የ1 ፍሬ መግዣ (ETB)' : 'Buying Price (1 piece)'}
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        className="sm-input"
                                        value={restockForm.costPrice}
                                        onChange={(e) =>
                                            setRestockForm({ ...restockForm, costPrice: e.target.value })
                                        }
                                        placeholder="0"
                                    />
                                    <div className="sm-field-hint">
                                        {isAmharic
                                            ? `መሸጫ: ETB ${selectedProduct.price} • ትርፍ: ${profitPerUnit >= 0 ? '+' : ''}ETB ${profitPerUnit}`
                                            : `Sell: ETB ${selectedProduct.price} • Profit: ${profitPerUnit >= 0 ? '+' : ''}ETB ${profitPerUnit}`}
                                    </div>
                                </div>

                                <div>
                                    <label className="sm-label">
                                        {isAmharic ? 'አቅራቢ (አማራጭ)' : 'Supplier (optional)'}
                                    </label>
                                    <input
                                        type="text"
                                        className="sm-input"
                                        value={restockForm.supplier}
                                        onChange={(e) =>
                                            setRestockForm({ ...restockForm, supplier: e.target.value })
                                        }
                                        placeholder={isAmharic ? 'የአቅራቢ ስም' : 'e.g. Wholesale'}
                                    />
                                </div>
                            </div>

                            {/* Step 3: Plain-Language Shop Cash Toggle + One-Tap Payment Pills */}
                            <div className={`sm-cash-box ${restockForm.syncCapital ? 'active' : ''}`}>
                                <div
                                    className="sm-toggle-row"
                                    onClick={() =>
                                        setRestockForm((prev) => ({
                                            ...prev,
                                            syncCapital: !prev.syncCapital,
                                        }))
                                    }
                                    role="switch"
                                    aria-checked={restockForm.syncCapital}
                                    tabIndex={0}
                                >
                                    <div>
                                        <div className="sm-toggle-title">
                                            {isAmharic ? 'ገንዘቡን ከሱቅ ካሽ ይቀንስ?' : 'Pay from Shop Cash?'}
                                        </div>
                                        <div className="sm-toggle-sub">
                                            {restockForm.syncCapital
                                                ? isAmharic
                                                    ? 'ወጪው በራስ-ሰር ከካፒታል ላይ ይቀነሳል'
                                                    : 'Automatically recorded in Capital Treasury'
                                                : isAmharic
                                                    ? 'ክምችቱ ብቻ ይጨምራል (ካሽ አይቀንስም)'
                                                    : 'Only updates shelf count (no cash deducted)'}
                                        </div>
                                    </div>
                                    <div className={`sm-switch ${restockForm.syncCapital ? 'on' : ''}`}>
                                        <div className="sm-switch-knob" />
                                    </div>
                                </div>

                                {restockForm.syncCapital && (
                                    <>
                                        <div className="sm-total-banner">
                                            <span>{isAmharic ? 'ጠቅላላ የሚከፈል:' : 'Total Cost:'}</span>
                                            <strong>ETB {totalRestockCost.toLocaleString()}</strong>
                                        </div>
                                        <div className="sm-pay-pills">
                                            {PAYMENT_OPTIONS.map((opt) => {
                                                const Icon = opt.icon;
                                                const active = restockForm.paymentMethod === opt.value;
                                                return (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        className={`sm-pay-pill ${active ? 'selected' : ''}`}
                                                        onClick={() =>
                                                            setRestockForm({ ...restockForm, paymentMethod: opt.value })
                                                        }
                                                    >
                                                        <Icon size={14} />
                                                        <span>{isAmharic ? opt.am : opt.en}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Optional Short Note */}
                            <div>
                                <label className="sm-label">
                                    {isAmharic ? 'አጭር ማስታወሻ (አማራጭ)' : 'Short Note (optional)'}
                                </label>
                                <VoiceInput
                                    fieldHint="Stock purchase short note"
                                    placeholder={isAmharic ? 'ለምሳሌ፡ አዲስ ጭነት ደረሰ' : 'e.g. Morning delivery'}
                                    value={restockForm.note}
                                    onChange={(e) =>
                                        setRestockForm({ ...restockForm, note: e.target.value })
                                    }
                                />
                            </div>

                            {/* Actions */}
                            <div className="sm-modal-footer">
                                <button
                                    type="button"
                                    className="sm-btn-cancel"
                                    onClick={() => setRestockModalOpen(false)}
                                >
                                    {isAmharic ? 'ይቅር' : 'Cancel'}
                                </button>
                                <button
                                    type="submit"
                                    className="sm-btn-submit cyan"
                                    disabled={submitting || addQtyNum <= 0}
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 size={16} className="sm-spinner" />
                                            <span>{isAmharic ? 'በመመዝገብ ላይ...' : 'Saving...'}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Plus size={16} />
                                            <span>
                                                {isAmharic
                                                    ? `+${addQtyNum} እቃ ጨምር`
                                                    : `Add +${addQtyNum} Items`}
                                            </span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* =====================================================
                ENHANCED SIMPLE FIX COUNT (ADJUST) MODAL
               ===================================================== */}
            {adjustModalOpen && selectedProduct && (
                <div
                    className="sm-modal-backdrop"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setAdjustModalOpen(false);
                    }}
                >
                    <div className="sm-modal" role="dialog" aria-modal="true">
                        <div className="sm-modal-top">
                            <div className="sm-modal-product">
                                {selectedProduct.image ? (
                                    <img
                                        src={selectedProduct.image}
                                        alt={selectedProduct.name}
                                        className="sm-product-thumb"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <div className="sm-product-thumb-fallback">
                                        <Package size={20} />
                                    </div>
                                )}
                                <div>
                                    <div className="sm-preview-label">
                                        {isAmharic ? 'የእቃ ቆጠራ ማስተካከያ' : 'Fix Shelf Count'}
                                    </div>
                                    <h2 className="sm-modal-title">{selectedProduct.name}</h2>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="sm-modal-close"
                                onClick={() => setAdjustModalOpen(false)}
                                aria-label="Close"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Live Count Difference Strip */}
                        <div className="sm-stock-preview">
                            <div className="sm-preview-col">
                                <span className="sm-preview-label">
                                    {isAmharic ? 'በመዝገብ ያለው' : 'Recorded'}
                                </span>
                                <span className="sm-preview-val">{currentModalStock}</span>
                            </div>

                            <div
                                className={`sm-preview-arrow ${
                                    adjustDelta < 0 ? 'drop' : adjustDelta === 0 ? 'neutral' : ''
                                }`}
                            >
                                <span>
                                    {adjustDelta > 0
                                        ? `+${adjustDelta}`
                                        : adjustDelta < 0
                                            ? `${adjustDelta}`
                                            : 'No change'}
                                </span>
                                <ArrowRight size={14} />
                            </div>

                            <div className="sm-preview-col right">
                                <span className="sm-preview-label">
                                    {isAmharic ? 'አዲሱ ቆጠራ' : 'Real Count'}
                                </span>
                                <span
                                    className={`sm-preview-val ${
                                        adjustDelta < 0
                                            ? 'after-drop'
                                            : adjustDelta > 0
                                                ? 'after-good'
                                                : ''
                                    }`}
                                >
                                    {nextAdjustQty}
                                </span>
                            </div>
                        </div>

                        <form onSubmit={handleAdjustSubmit} className="sm-form">
                            <div>
                                <label className="sm-label">
                                    {isAmharic ? 'አሁን በመደርደሪያ ላይ ያለው ትክክለኛ ብዛት *' : 'Actual count on your shelf right now *'}
                                </label>
                                <div className="sm-stepper">
                                    <button
                                        type="button"
                                        className="sm-step-btn"
                                        onClick={() => adjustCountStepper(-1)}
                                        aria-label="Decrease count"
                                    >
                                        <Minus size={18} />
                                    </button>
                                    <input
                                        type="number"
                                        min="0"
                                        required
                                        className="sm-qty-input"
                                        value={adjustForm.newStockQuantity}
                                        onChange={(e) =>
                                            setAdjustForm({ ...adjustForm, newStockQuantity: e.target.value })
                                        }
                                    />
                                    <button
                                        type="button"
                                        className="sm-step-btn"
                                        onClick={() => adjustCountStepper(1)}
                                        aria-label="Increase count"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="sm-label">
                                    {isAmharic ? 'ለምን ተቀየረ?' : 'Why did the count change?'}
                                </label>
                                <div className="sm-reason-grid">
                                    <button
                                        type="button"
                                        className={`sm-reason-card ${adjustForm.type === 'adjustment' ? 'selected' : ''}`}
                                        onClick={() => setAdjustForm({ ...adjustForm, type: 'adjustment' })}
                                    >
                                        <ClipboardList size={18} />
                                        <span>{isAmharic ? 'እንደገና ተቆጠረ' : 'Recounted'}</span>
                                    </button>
                                    <button
                                        type="button"
                                        className={`sm-reason-card ${adjustForm.type === 'damage_loss' ? 'selected danger' : ''}`}
                                        onClick={() => setAdjustForm({ ...adjustForm, type: 'damage_loss' })}
                                    >
                                        <PackageX size={18} />
                                        <span>{isAmharic ? 'ተበላሸ / ጠፋ' : 'Damaged'}</span>
                                    </button>
                                    <button
                                        type="button"
                                        className={`sm-reason-card ${adjustForm.type === 'return' ? 'selected' : ''}`}
                                        onClick={() => setAdjustForm({ ...adjustForm, type: 'return' })}
                                    >
                                        <RotateCcw size={18} />
                                        <span>{isAmharic ? 'ተመለሰ' : 'Returned'}</span>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="sm-label">
                                    {isAmharic ? 'አጭር ማስታወሻ (አማራጭ)' : 'Short Note (optional)'}
                                </label>
                                <VoiceInput
                                    fieldHint="Stock count adjustment note"
                                    placeholder={isAmharic ? 'ለምሳሌ፡ 2 ፍሬ ተሰበረ' : 'e.g. 2 expired pieces removed'}
                                    value={adjustForm.note}
                                    onChange={(e) => setAdjustForm({ ...adjustForm, note: e.target.value })}
                                />
                            </div>

                            <div className="sm-modal-footer">
                                <button
                                    type="button"
                                    className="sm-btn-cancel"
                                    onClick={() => setAdjustModalOpen(false)}
                                >
                                    {isAmharic ? 'ይቅር' : 'Cancel'}
                                </button>
                                <button
                                    type="submit"
                                    className={`sm-btn-submit ${adjustForm.type === 'damage_loss' ? 'danger' : 'cyan'}`}
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 size={16} className="sm-spinner" />
                                            <span>{isAmharic ? 'በማስቀመጥ ላይ...' : 'Saving...'}</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 size={16} />
                                            <span>{isAmharic ? 'አዲሱን ቆጠራ አስቀምጥ' : 'Save New Count'}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Floating Toast Notification */}
            {toast && (
                <div className={`sm-toast ${toast.type}`}>
                    {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                    <span>{toast.message}</span>
                </div>
            )}
        </div>
    );
};

export default StoreManagement;
