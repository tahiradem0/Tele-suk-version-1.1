import React, { useState, useEffect } from 'react';
import {
    Warehouse, Search, PlusCircle, AlertTriangle, ArrowUpDown,
    CheckCircle2, XCircle, RefreshCw, Layers, DollarSign, Package
} from 'lucide-react';
import { storeService, categoryService } from '../../../services/api';
import { useAdminLanguage } from '../../../context/AdminLanguageContext';

const StoreManagement = () => {
    const { t, isAmharic } = useAdminLanguage();
    const [overview, setOverview] = useState(null);
    const [movements, setMovements] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'movements'
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'low_stock' | 'out_of_stock' | 'in_stock'
    const [loading, setLoading] = useState(true);

    // Modals
    const [restockModalOpen, setRestockModalOpen] = useState(false);
    const [adjustModalOpen, setAdjustModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Restock form state
    const [restockForm, setRestockForm] = useState({
        quantity: '',
        costPrice: '',
        supplier: '',
        note: '',
        syncCapital: true,
        paymentMethod: 'Cash'
    });

    // Adjust form state
    const [adjustForm, setAdjustForm] = useState({
        newStockQuantity: '',
        type: 'adjustment',
        note: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [overviewRes, catRes, movementsRes] = await Promise.all([
                storeService.getOverview(),
                categoryService.getAll(),
                storeService.getMovements({ limit: 50 })
            ]);
            setOverview(overviewRes.data);
            setCategories(catRes.data);
            setMovements(movementsRes.data);
        } catch (error) {
            console.error("Failed to load store data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenRestock = (product) => {
        setSelectedProduct(product);
        setRestockForm({
            quantity: '',
            costPrice: product.costPrice || '',
            supplier: product.supplier || '',
            note: '',
            syncCapital: true,
            paymentMethod: 'Cash'
        });
        setRestockModalOpen(true);
    };

    const handleOpenAdjust = (product) => {
        setSelectedProduct(product);
        setAdjustForm({
            newStockQuantity: product.stockQuantity || 0,
            type: 'adjustment',
            note: ''
        });
        setAdjustModalOpen(true);
    };

    const handleRestockSubmit = async (e) => {
        e.preventDefault();
        try {
            await storeService.restock({
                productId: selectedProduct._id,
                quantity: Number(restockForm.quantity),
                costPrice: Number(restockForm.costPrice),
                supplier: restockForm.supplier,
                note: restockForm.note,
                syncCapital: restockForm.syncCapital,
                paymentMethod: restockForm.paymentMethod
            });
            alert('Stock added successfully!');
            setRestockModalOpen(false);
            loadData();
        } catch (error) {
            alert('Restock failed: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleAdjustSubmit = async (e) => {
        e.preventDefault();
        try {
            await storeService.adjustStock({
                productId: selectedProduct._id,
                newStockQuantity: Number(adjustForm.newStockQuantity),
                type: adjustForm.type,
                note: adjustForm.note
            });
            alert('Stock adjusted successfully!');
            setAdjustModalOpen(false);
            loadData();
        } catch (error) {
            alert('Adjustment failed: ' + (error.response?.data?.message || error.message));
        }
    };

    const summary = overview?.summary || {
        totalProducts: 0,
        totalStockUnits: 0,
        totalCostValuation: 0,
        totalRetailValuation: 0,
        potentialGrossProfit: 0,
        lowStockCount: 0,
        outOfStockCount: 0
    };

    const filteredInventory = (overview?.inventory || []).filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
        const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
        return matchesSearch && matchesCat && matchesStatus;
    });

    return (
        <div style={{ padding: '1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1a1b1e', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Warehouse color="#d4a373" size={28} />
                        {t('storeInventoryManagement', 'Store & Inventory Management')}
                    </h1>
                    <p style={{ color: '#868e96', fontSize: '0.95rem' }}>
                        {t('trackStockLevels', 'Track stock levels, store valuation, cost margins, and restock records')}
                    </p>
                </div>
                <button
                    onClick={loadData}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.65rem 1.2rem',
                        borderRadius: '10px',
                        background: 'white',
                        border: '1px solid #dee2e6',
                        cursor: 'pointer',
                        fontWeight: '600'
                    }}
                >
                    <RefreshCw size={16} />
                    {t('refresh', 'Refresh')}
                </button>
            </div>

            {/* Valuation & Stock Metrics */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '1.2rem',
                marginBottom: '2rem'
            }}>
                <div style={{ background: 'white', padding: '1.3rem', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#868e96', fontSize: '0.85rem' }}>
                        <span>{t('totalInventoryUnits', 'Total Inventory Units')}</span>
                        <Package size={18} color="#228be6" />
                    </div>
                    <div style={{ fontSize: '1.7rem', fontWeight: '700', marginTop: '0.4rem', color: '#1a1b1e' }}>
                        {summary.totalStockUnits.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#868e96', marginTop: '0.2rem' }}>
                        {isAmharic ? `በ ${summary.totalProducts} የተለያዩ ምርቶች ውስጥ` : `Across ${summary.totalProducts} unique products`}
                    </div>
                </div>

                <div style={{ background: 'white', padding: '1.3rem', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#868e96', fontSize: '0.85rem' }}>
                        <span>{t('costValuation', 'Cost Valuation')}</span>
                        <DollarSign size={18} color="#f59f00" />
                    </div>
                    <div style={{ fontSize: '1.7rem', fontWeight: '700', marginTop: '0.4rem', color: '#1a1b1e' }}>
                        ETB {summary.totalCostValuation.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#868e96', marginTop: '0.2rem' }}>
                        {t('capitalTiedInStore', 'Capital tied in store inventory')}
                    </div>
                </div>

                <div style={{ background: 'white', padding: '1.3rem', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#868e96', fontSize: '0.85rem' }}>
                        <span>{t('retailValuation', 'Retail Valuation')}</span>
                        <Layers size={18} color="#10b981" />
                    </div>
                    <div style={{ fontSize: '1.7rem', fontWeight: '700', marginTop: '0.4rem', color: '#10b981' }}>
                        ETB {summary.totalRetailValuation.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#868e96', marginTop: '0.2rem' }}>
                        {t('expectedGrossRevenue', 'Expected gross sales revenue')}
                    </div>
                </div>

                <div style={{ background: 'white', padding: '1.3rem', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#868e96', fontSize: '0.85rem' }}>
                        <span>{t('potentialProfit', 'Potential Profit')}</span>
                        <ArrowUpDown size={18} color="#20c997" />
                    </div>
                    <div style={{ fontSize: '1.7rem', fontWeight: '700', marginTop: '0.4rem', color: '#20c997' }}>
                        ETB {summary.potentialGrossProfit.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#868e96', marginTop: '0.2rem' }}>
                        {t('netStoreMarginIfSold', 'Net store margin if all sold')}
                    </div>
                </div>

                <div style={{ background: summary.lowStockCount > 0 ? '#fff5f5' : 'white', padding: '1.3rem', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: summary.lowStockCount > 0 ? '1px solid #ffa8a8' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: summary.lowStockCount > 0 ? '#e03131' : '#868e96', fontSize: '0.85rem' }}>
                        <span>{t('stockAlertsLabel', 'Stock Alerts')}</span>
                        <AlertTriangle size={18} color={summary.lowStockCount > 0 ? '#e03131' : '#868e96'} />
                    </div>
                    <div style={{ fontSize: '1.7rem', fontWeight: '700', marginTop: '0.4rem', color: summary.lowStockCount > 0 ? '#e03131' : '#1a1b1e' }}>
                        {isAmharic ? `${summary.lowStockCount} እቃዎች` : `${summary.lowStockCount} items`}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#868e96', marginTop: '0.2rem' }}>
                        {isAmharic ? `${summary.outOfStockCount} ሙሉ በሙሉ ያለቁ` : `${summary.outOfStockCount} completely out of stock`}
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #eee', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => setActiveTab('inventory')}
                    style={{
                        padding: '0.8rem 1.4rem',
                        fontWeight: '700',
                        fontSize: '0.95rem',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        color: activeTab === 'inventory' ? '#1a1b1e' : '#868e96',
                        borderBottom: activeTab === 'inventory' ? '3px solid #1a1b1e' : 'none',
                        marginBottom: '-2px'
                    }}
                >
                    {isAmharic ? `ክምችት እና እቃዎች (${filteredInventory.length})` : `Stock & Inventory (${filteredInventory.length})`}
                </button>
                <button
                    onClick={() => setActiveTab('movements')}
                    style={{
                        padding: '0.8rem 1.4rem',
                        fontWeight: '700',
                        fontSize: '0.95rem',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        color: activeTab === 'movements' ? '#1a1b1e' : '#868e96',
                        borderBottom: activeTab === 'movements' ? '3px solid #1a1b1e' : 'none',
                        marginBottom: '-2px'
                    }}
                >
                    {isAmharic ? `የክምችት እንቅስቃሴ መዝገብ (${movements.length})` : `Stock Movement Audit Trail (${movements.length})`}
                </button>
            </div>

            {activeTab === 'inventory' ? (
                <>
                    {/* Filters & Search */}
                    <div style={{
                        display: 'flex',
                        gap: '1rem',
                        marginBottom: '1.5rem',
                        flexWrap: 'wrap',
                        alignItems: 'center'
                    }}>
                        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#868e96' }} />
                            <input
                                type="text"
                                placeholder={t('searchInventoryPlaceholder', 'Search inventory by product name or SKU...')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem 0.75rem 2.6rem',
                                    borderRadius: '12px',
                                    border: '1px solid #dee2e6',
                                    outline: 'none',
                                    fontSize: '0.95rem'
                                }}
                            />
                        </div>

                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            style={{
                                padding: '0.75rem 1rem',
                                borderRadius: '12px',
                                border: '1px solid #dee2e6',
                                background: 'white',
                                fontSize: '0.95rem'
                            }}
                        >
                            <option value="All">{t('allCategories', 'All Categories')}</option>
                            {categories.map(c => (
                                <option key={c._id} value={c.name}>{c.name}</option>
                            ))}
                        </select>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{
                                padding: '0.75rem 1rem',
                                borderRadius: '12px',
                                border: '1px solid #dee2e6',
                                background: 'white',
                                fontSize: '0.95rem'
                            }}
                        >
                            <option value="All">{t('allStockStatuses', 'All Stock Statuses')}</option>
                            <option value="in_stock">{isAmharic ? 'በክምችት ላይ ያለ' : 'In Stock Healthy'}</option>
                            <option value="low_stock">{isAmharic ? 'አነስተኛ ክምችት' : 'Low Stock Alerts'}</option>
                            <option value="out_of_stock">{isAmharic ? 'ያለቀ እቃ' : 'Out of Stock'}</option>
                        </select>
                    </div>

                    {/* Inventory Table */}
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        overflow: 'hidden',
                        overflowX: 'auto'
                    }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
                            <thead>
                                <tr style={{ background: '#f8f9fc', borderBottom: '1px solid #eee', color: '#495057', fontSize: '0.85rem' }}>
                                    <th style={{ padding: '1rem' }}>{t('colProduct', 'PRODUCT')}</th>
                                    <th style={{ padding: '1rem' }}>{t('colCategorySku', 'CATEGORY / SKU')}</th>
                                    <th style={{ padding: '1rem' }}>{t('colCostRetail', 'COST / RETAIL')}</th>
                                    <th style={{ padding: '1rem' }}>{t('colMargin', 'MARGIN')}</th>
                                    <th style={{ padding: '1rem' }}>{t('colCurrentStock', 'CURRENT STOCK')}</th>
                                    <th style={{ padding: '1rem' }}>{t('colValuation', 'VALUATION')}</th>
                                    <th style={{ padding: '1rem', textAlign: 'right' }}>{t('colQuickActions', 'QUICK ACTIONS')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInventory.map(item => (
                                    <tr key={item._id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', background: '#f1f3f5' }}
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                            <div>
                                                <div style={{ fontWeight: '600', color: '#1a1b1e', fontSize: '0.95rem' }}>{item.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#868e96' }}>{item.brand}</div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ background: '#e9ecef', padding: '3px 8px', borderRadius: '6px', fontSize: '0.8rem' }}>
                                                {item.category}
                                            </span>
                                            {item.sku && (
                                                <div style={{ fontSize: '0.75rem', color: '#868e96', marginTop: '4px' }}>SKU: {item.sku}</div>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: '600', color: '#1a1b1e' }}>ETB {item.price}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#868e96' }}>
                                                {isAmharic ? 'መግዣ: ' : 'Cost: '}ETB {item.costPrice || 0}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                fontSize: '0.85rem',
                                                fontWeight: '600',
                                                color: Number(item.marginPercent) >= 20 ? '#10b981' : '#f59f00'
                                            }}>
                                                {item.marginPercent}%
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{
                                                    display: 'inline-block',
                                                    width: '8px',
                                                    height: '8px',
                                                    borderRadius: '50%',
                                                    background: item.status === 'out_of_stock' ? '#fa5252' : item.status === 'low_stock' ? '#fab005' : '#40c057'
                                                }}></span>
                                                <span style={{ fontWeight: '700', fontSize: '1rem', color: item.status === 'out_of_stock' ? '#fa5252' : '#1a1b1e' }}>
                                                    {item.stockQuantity}
                                                </span>
                                            </div>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                background: item.status === 'out_of_stock' ? '#ffe3e3' : item.status === 'low_stock' ? '#fff9db' : '#ebfbee',
                                                color: item.status === 'out_of_stock' ? '#e03131' : item.status === 'low_stock' ? '#f08c00' : '#2b8a3e',
                                                fontWeight: '600',
                                                display: 'inline-block',
                                                marginTop: '3px'
                                            }}>
                                                {item.status === 'out_of_stock' ? t('outOfStockBadge', 'Out of Stock') : item.status === 'low_stock' ? (isAmharic ? `አነስተኛ (≤${item.minStockLevel})` : `Low (≤${item.minStockLevel})`) : t('inStockBadge', 'In Stock')}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1a1b1e' }}>
                                                {isAmharic ? 'መግዣ: ' : 'Cost: '}ETB {item.costValue.toLocaleString()}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: '#10b981' }}>
                                                {isAmharic ? 'መሸጫ: ' : 'Retail: '}ETB {item.retailValue.toLocaleString()}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => handleOpenRestock(item)}
                                                    style={{
                                                        background: '#1a1b1e',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '0.45rem 0.85rem',
                                                        borderRadius: '8px',
                                                        fontSize: '0.85rem',
                                                        fontWeight: '600',
                                                        cursor: 'pointer',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}
                                                >
                                                    <PlusCircle size={14} />
                                                    {t('btnRestock', 'Restock')}
                                                </button>
                                                <button
                                                    onClick={() => handleOpenAdjust(item)}
                                                    style={{
                                                        background: '#f1f3f5',
                                                        color: '#495057',
                                                        border: '1px solid #ced4da',
                                                        padding: '0.45rem 0.85rem',
                                                        borderRadius: '8px',
                                                        fontSize: '0.85rem',
                                                        fontWeight: '600',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {t('btnAdjust', 'Adjust')}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredInventory.length === 0 && (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#868e96' }}>
                                            {isAmharic ? 'ከማጣሪያዎ ጋር የሚዛመድ የክምችት እቃ አልተገኘም።' : 'No inventory items matching your filter.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                /* Stock Movements Log Tab */
                <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    overflow: 'hidden',
                    overflowX: 'auto'
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                        <thead>
                            <tr style={{ background: '#f8f9fc', borderBottom: '1px solid #eee', color: '#495057', fontSize: '0.85rem' }}>
                                <th style={{ padding: '1rem' }}>{isAmharic ? 'ቀን' : 'DATE'}</th>
                                <th style={{ padding: '1rem' }}>{isAmharic ? 'ምርት' : 'PRODUCT'}</th>
                                <th style={{ padding: '1rem' }}>{isAmharic ? 'ዓይነት' : 'TYPE'}</th>
                                <th style={{ padding: '1rem' }}>{isAmharic ? 'መጠን' : 'QUANTITY'}</th>
                                <th style={{ padding: '1rem' }}>{isAmharic ? 'የነበረው → አዲሱ' : 'PREVIOUS → NEW'}</th>
                                <th style={{ padding: '1rem' }}>{isAmharic ? 'አቅራቢ / ማስታወሻ' : 'SUPPLIER / NOTE'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {movements.map(m => (
                                <tr key={m._id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#868e96' }}>
                                        {new Date(m.createdAt).toLocaleDateString()} {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: '600', color: '#1a1b1e' }}>
                                        {m.productName}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            fontSize: '0.8rem',
                                            fontWeight: '600',
                                            background: m.type === 'restock' ? '#ebfbee' : m.type === 'sale' ? '#e7f5ff' : '#fff5f5',
                                            color: m.type === 'restock' ? '#2b8a3e' : m.type === 'sale' ? '#1c7ed6' : '#c92a2a'
                                        }}>
                                            {m.type === 'restock'
                                                ? (isAmharic ? 'ግዢ/መሙላት' : 'RESTOCK')
                                                : m.type === 'sale'
                                                    ? (isAmharic ? 'ሽያጭ' : 'SALE')
                                                    : (isAmharic ? 'ማስተካከያ' : m.type.toUpperCase())}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: '700', color: m.type === 'restock' ? '#2b8a3e' : '#fa5252' }}>
                                        {m.type === 'restock' ? `+${m.quantity}` : `-${m.quantity}`}
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#495057' }}>
                                        {m.previousStock} → <strong>{m.newStock}</strong>
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#868e96' }}>
                                        {m.supplier && <span style={{ fontWeight: '600', color: '#1a1b1e' }}>[{m.supplier}] </span>}
                                        {m.note || '-'}
                                    </td>
                                </tr>
                            ))}
                            {movements.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#868e96' }}>
                                        {isAmharic ? 'ምንም የክምችት እንቅስቃሴ አልተመዘገበም።' : 'No stock movements recorded yet.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Restock Modal */}
            {restockModalOpen && selectedProduct && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 200,
                    padding: '1rem'
                }}>
                    <div style={{
                        background: 'white',
                        padding: '2rem',
                        borderRadius: '20px',
                        maxWidth: '480px',
                        width: '100%',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                    }}>
                        <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '0.3rem' }}>
                            {isAmharic ? `ክምችት ሙላ: ${selectedProduct.name}` : `Restock: ${selectedProduct.name}`}
                        </h2>
                        <p style={{ color: '#868e96', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                            {isAmharic ? `አሁን ያለው ክምችት: ` : `Current stock: `}
                            <strong>{selectedProduct.stockQuantity}</strong> {isAmharic ? 'እቃዎች' : 'units'}
                        </p>

                        <form onSubmit={handleRestockSubmit} style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                                    {isAmharic ? 'የሚጨመረው ብዛት *' : 'Quantity to Add *'}
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    placeholder="e.g. 50"
                                    value={restockForm.quantity}
                                    onChange={(e) => setRestockForm({ ...restockForm, quantity: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #ced4da' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                                        {isAmharic ? 'የአንድ እቃ መግዣ ዋጋ (በብር)' : 'Unit Cost Price (ETB)'}
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={restockForm.costPrice}
                                        onChange={(e) => setRestockForm({ ...restockForm, costPrice: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #ced4da' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                                        {isAmharic ? 'የአቅራቢ ስም' : 'Supplier Name'}
                                    </label>
                                    <input
                                        type="text"
                                        placeholder={isAmharic ? 'አቅራቢ' : 'Supplier'}
                                        value={restockForm.supplier}
                                        onChange={(e) => setRestockForm({ ...restockForm, supplier: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #ced4da' }}
                                    />
                                </div>
                            </div>

                            {/* Capital Integration Switch */}
                            <div style={{
                                background: '#f8f9fa',
                                padding: '1rem',
                                borderRadius: '12px',
                                border: '1px solid #dee2e6'
                            }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={restockForm.syncCapital}
                                        onChange={(e) => setRestockForm({ ...restockForm, syncCapital: e.target.checked })}
                                    />
                                    {isAmharic ? 'እንደ ካፒታል ወጪ (የዕቃ ግዢ) መዝግብ' : 'Record as Capital Outflow (Stock Purchase)'}
                                </label>
                                {restockForm.syncCapital && (
                                    <div style={{ marginTop: '0.8rem' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#495057', marginBottom: '0.3rem' }}>
                                            {isAmharic ? 'ጠቅላላ ወጪ:' : 'Total Cost:'} <strong>ETB {((Number(restockForm.quantity) || 0) * (Number(restockForm.costPrice) || 0)).toLocaleString()}</strong>
                                        </div>
                                        <select
                                            value={restockForm.paymentMethod}
                                            onChange={(e) => setRestockForm({ ...restockForm, paymentMethod: e.target.value })}
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '0.85rem', background: 'white' }}
                                        >
                                            <option value="Cash">{isAmharic ? 'በእጅ ገንዘብ የተከፈለ' : 'Paid with Cash'}</option>
                                            <option value="Telebirr">Paid with Telebirr</option>
                                            <option value="CBEBirr">Paid with CBEBirr</option>
                                            <option value="Bank Transfer">{isAmharic ? 'በባንክ የተከፈለ' : 'Paid with Bank Transfer'}</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                                    {isAmharic ? 'ማስታወሻ / ደረሰኝ ቁጥር' : 'Note / Receipt Reference'}
                                </label>
                                <input
                                    type="text"
                                    placeholder={isAmharic ? 'አማራጭ ማስታወሻ' : 'Optional note'}
                                    value={restockForm.note}
                                    onChange={(e) => setRestockForm({ ...restockForm, note: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #ced4da' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setRestockModalOpen(false)}
                                    style={{ flex: 1, padding: '0.8rem', borderRadius: '10px', border: '1px solid #ced4da', background: 'white', fontWeight: '600', cursor: 'pointer' }}
                                >
                                    {isAmharic ? 'ይቅር' : 'Cancel'}
                                </button>
                                <button
                                    type="submit"
                                    style={{ flex: 1, padding: '0.8rem', borderRadius: '10px', border: 'none', background: '#1a1b1e', color: 'white', fontWeight: '600', cursor: 'pointer' }}
                                >
                                    {isAmharic ? 'ክምችት መሙላትን አረጋግጥ' : 'Confirm Restock'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Adjust Modal */}
            {adjustModalOpen && selectedProduct && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 200,
                    padding: '1rem'
                }}>
                    <div style={{
                        background: 'white',
                        padding: '2rem',
                        borderRadius: '20px',
                        maxWidth: '440px',
                        width: '100%',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                    }}>
                        <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '0.3rem' }}>
                            {isAmharic ? `ክምችት አስተካክል: ${selectedProduct.name}` : `Adjust Stock: ${selectedProduct.name}`}
                        </h2>
                        <p style={{ color: '#868e96', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                            {isAmharic ? 'በመዝገብ ላይ ያለው ክምችት: ' : 'Current recorded stock: '}
                            <strong>{selectedProduct.stockQuantity}</strong>
                        </p>

                        <form onSubmit={handleAdjustSubmit} style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                                    {isAmharic ? 'አዲሱ ትክክለኛ የክምችት ቁጥር *' : 'New Actual Stock Count *'}
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    required
                                    value={adjustForm.newStockQuantity}
                                    onChange={(e) => setAdjustForm({ ...adjustForm, newStockQuantity: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #ced4da' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                                    {isAmharic ? 'የማስተካከያ ምክንያት *' : 'Reason for Adjustment *'}
                                </label>
                                <select
                                    value={adjustForm.type}
                                    onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #ced4da', background: 'white' }}
                                >
                                    <option value="adjustment">{isAmharic ? 'የአካል ቆጠራ ኦዲት' : 'Physical Inventory Audit Count'}</option>
                                    <option value="damage_loss">{isAmharic ? 'የተበላሸ / ጊዜው ያለፈበት እቃ' : 'Damaged / Expired Goods'}</option>
                                    <option value="return">{isAmharic ? 'በደንበኛ የተመለሰ' : 'Returned by Customer'}</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                                    {isAmharic ? 'የኦዲት ማስታወሻ' : 'Audit Note'}
                                </label>
                                <input
                                    type="text"
                                    placeholder={isAmharic ? 'የልዩነቱን ምክንያት ያብራሩ' : 'Explain the reason for discrepancy'}
                                    value={adjustForm.note}
                                    onChange={(e) => setAdjustForm({ ...adjustForm, note: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #ced4da' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setAdjustModalOpen(false)}
                                    style={{ flex: 1, padding: '0.8rem', borderRadius: '10px', border: '1px solid #ced4da', background: 'white', fontWeight: '600', cursor: 'pointer' }}
                                >
                                    {isAmharic ? 'ይቅር' : 'Cancel'}
                                </button>
                                <button
                                    type="submit"
                                    style={{ flex: 1, padding: '0.8rem', borderRadius: '10px', border: 'none', background: '#fa5252', color: 'white', fontWeight: '600', cursor: 'pointer' }}
                                >
                                    {isAmharic ? 'ቁጥሩን አድስ' : 'Update Count'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StoreManagement;
