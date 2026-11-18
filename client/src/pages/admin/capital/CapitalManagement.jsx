import React, { useState, useEffect } from 'react';
import {
    Coins, ArrowDownRight, ArrowUpRight, Plus, Minus, Search,
    Filter, RefreshCw, Wallet, TrendingUp, Calendar, Trash2, CheckCircle2
} from 'lucide-react';
import { capitalService, forceRefreshCache } from '../../../services/api';
import { useAdminLanguage } from '../../../context/AdminLanguageContext';
import CoolSelect from '../../../components/ui/CoolSelect';

const categoryLabels = {
    sale: 'Sales Revenue',
    owner_investment: 'Owner Capital Deposit',
    debt_collection: 'Customer Debt Collected',
    other_income: 'Other Income',
    stock_purchase: 'Stock / Inventory Purchase',
    expense: 'General Expense',
    owner_withdrawal: 'Owner Draw / Withdrawal',
    debt_payment: 'Supplier Debt Repaid',
    salary: 'Staff Salary',
    rent_utilities: 'Rent & Utilities'
};

const categoryLabelsAm = {
    sale: 'የሽያጭ ገቢ',
    owner_investment: 'የባለቤት ካፒታል ተቀማጭ',
    debt_collection: 'የተሰበሰበ የደንበኞች ብድር',
    other_income: 'ሌላ ገቢ',
    stock_purchase: 'የእቃ ክምችት ግዢ',
    expense: 'ጠቅላላ ወጪ',
    owner_withdrawal: 'የባለቤት ገንዘብ ማውጣት',
    debt_payment: 'የተከፈለ የአቅራቢ እዳ',
    salary: 'የሰራተኛ ደመወዝ',
    rent_utilities: 'ኪራይ እና መገልገያዎች'
};

const CapitalManagement = () => {
    const { t, isAmharic } = useAdminLanguage();
    const [overview, setOverview] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [justRefreshed, setJustRefreshed] = useState(false);

    // Filters
    const [typeFilter, setTypeFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [txType, setTxType] = useState('inflow'); // 'inflow' | 'outflow'
    const [formData, setFormData] = useState({
        category: 'owner_investment',
        amount: '',
        description: '',
        paymentMethod: 'Cash',
        date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadData();
    }, [typeFilter, categoryFilter]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [overviewRes, txRes] = await Promise.all([
                capitalService.getOverview(),
                capitalService.getTransactions({
                    type: typeFilter !== 'all' ? typeFilter : undefined,
                    category: categoryFilter !== 'all' ? categoryFilter : undefined,
                    limit: 100
                })
            ]);
            setOverview(overviewRes.data);
            setTransactions(txRes.data.transactions || []);
        } catch (error) {
            console.error("Failed to load capital data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        setJustRefreshed(false);
        try {
            forceRefreshCache();
            await loadData();
            setJustRefreshed(true);
            setTimeout(() => setJustRefreshed(false), 2000);
        } catch (error) {
            console.error("Failed to refresh capital data:", error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleOpenModal = (type) => {
        setTxType(type);
        setFormData({
            category: type === 'inflow' ? 'owner_investment' : 'expense',
            amount: '',
            description: '',
            paymentMethod: 'Cash',
            date: new Date().toISOString().split('T')[0]
        });
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await capitalService.createTransaction({
                type: txType,
                category: formData.category,
                amount: Number(formData.amount),
                description: formData.description,
                paymentMethod: formData.paymentMethod,
                date: formData.date
            });
            alert('Transaction recorded successfully!');
            setModalOpen(false);
            loadData();
        } catch (error) {
            alert('Failed to save transaction: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this capital entry?')) {
            try {
                await capitalService.deleteTransaction(id);
                loadData();
            } catch (error) {
                alert('Failed to delete transaction');
            }
        }
    };

    const filteredTransactions = transactions.filter(t =>
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const netCapital = overview?.netCapital || 0;
    const totalInflow = overview?.totalInflow || 0;
    const totalOutflow = overview?.totalOutflow || 0;

    return (
        <div style={{ padding: '1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1a1b1e', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Coins color="#fab005" size={28} />
                        {t('capitalTreasuryManagement', 'Capital & Treasury Management')}
                    </h1>
                    <p style={{ color: '#868e96', fontSize: '0.95rem' }}>
                        {t('capitalSubtitle', 'Live balance, cash flow tracking, sales revenue, and business expense ledger')}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className={`admin-refresh-btn ${justRefreshed ? 'refreshed-success' : ''}`}
                        title={isAmharic ? 'የካፒታል ሂሳቦችን እንደገና አድስ' : 'Refresh capital balances & transactions'}
                    >
                        {justRefreshed ? (
                            <>
                                <CheckCircle2 size={16} color="#10b981" />
                                <span>{isAmharic ? 'ተዘምኗል!' : 'Updated!'}</span>
                            </>
                        ) : (
                            <>
                                <RefreshCw size={16} className={isRefreshing ? 'spinning-refresh-icon' : ''} />
                                <span>{isRefreshing ? (isAmharic ? 'በማደስ ላይ...' : 'Refreshing...') : t('refresh', 'Refresh')}</span>
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => handleOpenModal('inflow')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.2rem',
                            borderRadius: '12px',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            fontWeight: '600',
                            cursor: 'pointer',
                            boxShadow: '0 4px 10px rgba(16,185,129,0.2)'
                        }}
                    >
                        <Plus size={18} />
                        {t('btnAddCapital', 'Add Capital / Inflow')}
                    </button>
                    <button
                        onClick={() => handleOpenModal('outflow')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.2rem',
                            borderRadius: '12px',
                            background: '#fa5252',
                            color: 'white',
                            border: 'none',
                            fontWeight: '600',
                            cursor: 'pointer',
                            boxShadow: '0 4px 10px rgba(250,82,82,0.2)'
                        }}
                    >
                        <Minus size={18} />
                        {t('btnRecordOutflow', 'Record Outflow / Expense')}
                    </button>
                </div>
            </div>

            {/* Treasury Metric Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1.2rem',
                marginBottom: '2rem'
            }}>
                {/* Available Capital */}
                <div style={{
                    background: 'var(--admin-card-bg, white)',
                    padding: '1.5rem',
                    borderRadius: '18px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    border: '1px solid var(--admin-border, #eee)',
                    borderLeft: `6px solid ${netCapital >= 0 ? '#10b981' : '#fa5252'}`
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--admin-subtext, #868e96)', fontSize: '0.9rem' }}>
                        <span>{t('currentAvailableCapital', 'Current Available Capital')}</span>
                        <Wallet size={20} color={netCapital >= 0 ? '#10b981' : '#fa5252'} />
                    </div>
                    <div style={{
                        fontSize: '2.2rem',
                        fontWeight: '800',
                        color: netCapital >= 0 ? '#10b981' : '#fa5252',
                        marginTop: '0.5rem'
                    }}>
                        ETB {netCapital.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--admin-subtext, #868e96)', marginTop: '0.3rem' }}>
                        {t('netLiquidTreasury', 'Net liquid treasury after all inflows & expenses')}
                    </div>
                </div>

                {/* Total Inflow */}
                <div style={{ background: 'var(--admin-card-bg, white)', border: '1px solid var(--admin-border, #eee)', padding: '1.5rem', borderRadius: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--admin-subtext, #868e96)', fontSize: '0.9rem' }}>
                        <span>{t('totalInflowLabel', 'Total Inflow (Capital + Sales)')}</span>
                        <ArrowDownRight size={20} color="#10b981" />
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--admin-text, #1a1b1e)', marginTop: '0.5rem' }}>
                        +ETB {totalInflow.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#10b981', marginTop: '0.3rem' }}>
                        {t('totalInflowSubtitle', 'Deposits, customer orders & debt collections')}
                    </div>
                </div>

                {/* Total Outflow */}
                <div style={{ background: 'var(--admin-card-bg, white)', border: '1px solid var(--admin-border, #eee)', padding: '1.5rem', borderRadius: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--admin-subtext, #868e96)', fontSize: '0.9rem' }}>
                        <span>{t('totalOutflowLabel', 'Total Outflow (Expenses + Restocks)')}</span>
                        <ArrowUpRight size={20} color="#fa5252" />
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--admin-text, #1a1b1e)', marginTop: '0.5rem' }}>
                        -ETB {totalOutflow.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#fa5252', marginTop: '0.3rem' }}>
                        {t('totalOutflowSubtitle', 'Stock procurement, overhead & debt payments')}
                    </div>
                </div>
            </div>

            {/* Inflow vs Outflow Category Breakdown Pill Bar */}
            {overview?.categoryTotals && Object.keys(overview.categoryTotals).length > 0 && (
                <div style={{
                    background: 'var(--admin-card-bg, white)',
                    border: '1px solid var(--admin-border, #eee)',
                    padding: '1.2rem',
                    borderRadius: '16px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    marginBottom: '2rem'
                }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--admin-subtext, #495057)', marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {t('capitalActivityByCategory', 'Capital Activity By Category')}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                        {Object.entries(overview.categoryTotals).map(([cat, amount]) => (
                            <div key={cat} style={{
                                background: '#f8f9fa',
                                border: '1px solid #e9ecef',
                                padding: '6px 14px',
                                borderRadius: '10px',
                                fontSize: '0.85rem'
                            }}>
                                <span style={{ color: '#868e96' }}>{(isAmharic ? categoryLabelsAm[cat] : categoryLabels[cat]) || cat}:</span>{' '}
                                <strong style={{ color: '#1a1b1e' }}>ETB {amount.toLocaleString()}</strong>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Filter and Search Bar */}
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
                        placeholder={t('searchTransactionsPlaceholder', 'Search transactions by note or payment method...')}
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

                <CoolSelect
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    style={{ width: 'auto', minWidth: '180px' }}
                >
                    <option value="all">{t('allTypes', 'All Types (+ & -)')}</option>
                    <option value="inflow">{t('inflowType', 'Inflows Only (+)')}</option>
                    <option value="outflow">{t('outflowType', 'Outflows Only (-)')}</option>
                </CoolSelect>

                <CoolSelect
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    style={{ width: 'auto', minWidth: '195px' }}
                >
                    <option value="all">{t('allCategories', 'All Categories')}</option>
                    <option value="sale">{isAmharic ? 'የሽያጭ ገቢ' : 'Sales Revenue'}</option>
                    <option value="owner_investment">{isAmharic ? 'የባለቤት ተቀማጭ' : 'Owner Deposits'}</option>
                    <option value="debt_collection">{isAmharic ? 'የተሰበሰበ ብድር' : 'Customer Debt Collections'}</option>
                    <option value="stock_purchase">{isAmharic ? 'የእቃ ግዢዎች' : 'Stock Purchases'}</option>
                    <option value="expense">{isAmharic ? 'ጠቅላላ ወጪዎች' : 'General Expenses'}</option>
                    <option value="debt_payment">{isAmharic ? 'የተከፈለ ዕዳ' : 'Debt Repayments'}</option>
                    <option value="salary">{isAmharic ? 'የሰራተኛ ደመወዝ' : 'Staff Salaries'}</option>
                    <option value="rent_utilities">{isAmharic ? 'ኪራይ እና መገልገያዎች' : 'Rent & Utilities'}</option>
                </CoolSelect>
            </div>

            {/* Transactions Ledger Table */}
            <div style={{
                background: 'var(--admin-card-bg, white)',
                border: '1px solid var(--admin-border, #eee)',
                borderRadius: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                overflow: 'hidden',
                overflowX: 'auto'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '750px' }}>
                    <thead>
                        <tr style={{ background: 'var(--admin-inner-bg, #f8f9fc)', borderBottom: '1px solid var(--admin-border, #eee)', color: 'var(--admin-subtext, #495057)', fontSize: '0.85rem' }}>
                            <th style={{ padding: '1rem' }}>{t('colDate', 'DATE')}</th>
                            <th style={{ padding: '1rem' }}>{t('colType', 'TYPE')}</th>
                            <th style={{ padding: '1rem' }}>{t('colCategory', 'CATEGORY')}</th>
                            <th style={{ padding: '1rem' }}>{t('colDescription', 'DESCRIPTION')}</th>
                            <th style={{ padding: '1rem' }}>{t('colPaymentMethod', 'PAYMENT METHOD')}</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>{t('colAmount', 'AMOUNT')}</th>
                            <th style={{ padding: '1rem', textAlign: 'center' }}>{t('colAction', 'ACTION')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTransactions.map(tx => (
                            <tr key={tx._id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#868e96' }}>
                                    {new Date(tx.date || tx.createdAt).toLocaleDateString()}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        fontSize: '0.8rem',
                                        fontWeight: '700',
                                        background: tx.type === 'inflow' ? '#ebfbee' : '#fff5f5',
                                        color: tx.type === 'inflow' ? '#2b8a3e' : '#c92a2a',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        {tx.type === 'inflow' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                                        {tx.type === 'inflow' ? t('badgeInflow', 'INFLOW') : t('badgeOutflow', 'OUTFLOW')}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#1a1b1e' }}>
                                        {(isAmharic ? categoryLabelsAm[tx.category] : categoryLabels[tx.category]) || tx.category}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', color: '#495057', fontSize: '0.9rem' }}>
                                    {tx.description}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        background: '#f1f3f5',
                                        padding: '3px 8px',
                                        borderRadius: '6px',
                                        fontSize: '0.8rem',
                                        fontWeight: '500'
                                    }}>
                                        {tx.paymentMethod}
                                    </span>
                                </td>
                                <td style={{
                                    padding: '1rem',
                                    textAlign: 'right',
                                    fontWeight: '700',
                                    fontSize: '1rem',
                                    color: tx.type === 'inflow' ? '#10b981' : '#fa5252'
                                }}>
                                    {tx.type === 'inflow' ? '+' : '-'}ETB {tx.amount.toLocaleString()}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    <button
                                        onClick={() => handleDelete(tx._id)}
                                        title="Delete entry"
                                        style={{
                                            border: 'none',
                                            background: 'none',
                                            color: '#ced4da',
                                            cursor: 'pointer',
                                            padding: '4px',
                                            transition: 'color 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = '#fa5252'}
                                        onMouseLeave={(e) => e.currentTarget.style.color = '#ced4da'}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredTransactions.length === 0 && (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#868e96' }}>
                                    {isAmharic ? 'ምንም የካፒታል ግብይት አልተገኘም።' : 'No capital transactions found.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Transaction Modal */}
            {modalOpen && (
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
                        <h2 style={{
                            fontSize: '1.3rem',
                            fontWeight: '700',
                            marginBottom: '1.2rem',
                            color: txType === 'inflow' ? '#10b981' : '#fa5252',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            {txType === 'inflow' ? <ArrowDownRight /> : <ArrowUpRight />}
                            {txType === 'inflow'
                                ? (isAmharic ? 'ካፒታል / ገቢ መዝግብ' : 'Add Capital / Inflow')
                                : (isAmharic ? 'ወጪ መዝግብ' : 'Record Outflow / Expense')}
                        </h2>

                        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                                    {isAmharic ? 'ምድብ *' : 'Category *'}
                                </label>
                                <CoolSelect
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    {txType === 'inflow' ? (
                                        <>
                                            <option value="owner_investment">{isAmharic ? 'የባለቤት ካፒታል ተቀማጭ' : 'Owner Capital Deposit / Injection'}</option>
                                            <option value="sale">{isAmharic ? 'ጥሬ ገንዘብ / የሽያጭ ገቢ' : 'Cash / Manual Sales Revenue'}</option>
                                            <option value="debt_collection">{isAmharic ? 'የተሰበሰበ የደንበኛ ብድር' : 'Customer Credit / Debt Collected'}</option>
                                            <option value="other_income">{isAmharic ? 'ሌላ ልዩ ልዩ ገቢ' : 'Other Miscellaneous Income'}</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="expense">{isAmharic ? 'አጠቃላይ የስራ ማስኬጃ ወጪ' : 'General Operational Expense'}</option>
                                            <option value="stock_purchase">{isAmharic ? 'የእቃ / የጅምላ ግዢ' : 'Stock / Wholesale Procurement'}</option>
                                            <option value="rent_utilities">{isAmharic ? 'ኪራይ፣ መብራት እና ኢንተርኔት' : 'Rent, Power & Internet'}</option>
                                            <option value="salary">{isAmharic ? 'የሰራተኛ ደመወዝ' : 'Staff Salary & Wages'}</option>
                                            <option value="debt_payment">{isAmharic ? 'የአቅራቢ እዳ / የብድር ክፍያ' : 'Supplier Debt / Loan Payment'}</option>
                                            <option value="owner_withdrawal">{isAmharic ? 'የባለቤት ካፒታል ማውጣት' : 'Owner Capital Withdrawal'}</option>
                                        </>
                                    )}
                                </CoolSelect>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                                    {isAmharic ? 'መጠን በብር *' : 'Amount in ETB *'}
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    step="any"
                                    required
                                    placeholder="e.g. 5000"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #ced4da' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                                    {isAmharic ? 'ዝርዝር ማብራሪያ *' : 'Description / Details *'}
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder={isAmharic ? 'ለምሳሌ፡ ተጨማሪ የንግድ ካፒታል ተቀማጭ' : 'e.g. Additional working capital injection'}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #ced4da' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                                        {isAmharic ? 'የክፍያ ዘዴ' : 'Payment Method'}
                                    </label>
                                    <CoolSelect
                                        value={formData.paymentMethod}
                                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                    >
                                        <option value="Cash">{isAmharic ? 'በእጅ ገንዘብ' : 'Cash on Hand'}</option>
                                        <option value="Telebirr">Telebirr</option>
                                        <option value="CBEBirr">CBEBirr</option>
                                        <option value="Bank Transfer">{isAmharic ? 'የባንክ ማስተላለፍ (ንግድ ባንክ/አዋሽ)' : 'Bank Transfer (CBE/Awash/etc.)'}</option>
                                        <option value="Other">{isAmharic ? 'ሌላ' : 'Other'}</option>
                                    </CoolSelect>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                                        {isAmharic ? 'ቀን' : 'Date'}
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #ced4da' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    style={{ flex: 1, padding: '0.8rem', borderRadius: '10px', border: '1px solid #ced4da', background: 'white', fontWeight: '600', cursor: 'pointer' }}
                                >
                                    {isAmharic ? 'ይቅር' : 'Cancel'}
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        flex: 1,
                                        padding: '0.8rem',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: txType === 'inflow' ? '#10b981' : '#fa5252',
                                        color: 'white',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {isAmharic ? 'ግብይቱን መዝግብ' : 'Save Transaction'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CapitalManagement;
