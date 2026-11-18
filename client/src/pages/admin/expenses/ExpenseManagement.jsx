import React, { useState, useEffect } from 'react';
import {
    Receipt,
    Plus,
    Search,
    Calendar,
    Users,
    Store,
    TrendingUp,
    TrendingDown,
    CheckCircle2,
    Copy,
    Check,
    Image as ImageIcon,
    Trash2,
    Edit2,
    Wallet,
    PieChart,
    RefreshCw,
    X,
    Sparkles,
    CreditCard,
    SlidersHorizontal
} from 'lucide-react';
import { expenseService, groupService } from '../../../services/api';
import { useAdminLanguage } from '../../../context/AdminLanguageContext';
import { toEthiopianDate } from '../../../utils/ethiopianDate';
import './ExpenseManagement.css';

const CATEGORY_PALETTE = [
    { color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.12)', border: 'rgba(6, 182, 212, 0.28)' },
    { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)', border: 'rgba(139, 92, 246, 0.28)' },
    { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.28)' },
    { color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.28)' },
    { color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.12)', border: 'rgba(244, 63, 94, 0.28)' },
    { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.28)' },
];

const getCategoryStyle = (name = '') => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return CATEGORY_PALETTE[Math.abs(hash) % CATEGORY_PALETTE.length];
};

const ExpenseManagement = () => {
    const { t, isAmharic } = useAdminLanguage();

    const [overview, setOverview] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [groups, setGroups] = useState([]);
    const [activeGroupId, setActiveGroupId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [justRefreshed, setJustRefreshed] = useState(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    // Modals
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [partnerModalOpen, setPartnerModalOpen] = useState(false);
    const [budgetModalOpen, setBudgetModalOpen] = useState(false);
    const [receiptPreviewUrl, setReceiptPreviewUrl] = useState(null);
    const [copied, setCopied] = useState(false);

    // Form States
    const [expenseForm, setExpenseForm] = useState({
        amount: '',
        reason: '',
        categoryName: 'Packaging & Bags',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'Cash',
        receiptUrl: '',
        syncCapital: true,
        notes: '',
    });

    const [joinConnectionId, setJoinConnectionId] = useState('');
    const [budgetLimitInput, setBudgetLimitInput] = useState('');

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (activeGroupId !== undefined && activeGroupId !== null) {
            loadExpenses();
            loadOverview();
        }
    }, [activeGroupId]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [grpRes, catRes] = await Promise.all([
                groupService.getGroups(),
                expenseService.getCategories(),
            ]);

            setGroups(grpRes.data || []);
            setCategories(catRes.data || []);

            if (grpRes.data && grpRes.data.length > 0) {
                const defaultGrp = grpRes.data[0];
                setActiveGroupId(defaultGrp._id);
                setBudgetLimitInput(defaultGrp.budgetLimit?.toString() || '25000');
            } else {
                setActiveGroupId('personal');
            }
        } catch (error) {
            console.error('Error loading initial Mezgeb data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadOverview = async () => {
        try {
            const res = await expenseService.getOverview({ groupId: activeGroupId });
            setOverview(res.data);
            if (res.data?.groupDetails?.budgetLimit) {
                setBudgetLimitInput(res.data.groupDetails.budgetLimit.toString());
            }
        } catch (error) {
            console.error('Error loading expense overview:', error);
        }
    };

    const loadExpenses = async () => {
        try {
            const res = await expenseService.getExpenses({ groupId: activeGroupId });
            setExpenses(res.data || []);
        } catch (error) {
            console.error('Error loading expenses:', error);
        }
    };

    const handleRefresh = async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        setJustRefreshed(false);
        try {
            await Promise.all([loadExpenses(), loadOverview()]);
            setJustRefreshed(true);
            setTimeout(() => setJustRefreshed(false), 2000);
        } catch (error) {
            console.error('Failed to refresh Mezgeb data:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleSaveExpense = async (e) => {
        e.preventDefault();
        try {
            if (editingExpense) {
                await expenseService.update(editingExpense._id, {
                    ...expenseForm,
                    amount: Number(expenseForm.amount),
                });
                alert(isAmharic ? 'ወጪው በትክክል ተስተካክሏል!' : 'Expense updated successfully!');
            } else {
                await expenseService.create({
                    ...expenseForm,
                    amount: Number(expenseForm.amount),
                    groupId: activeGroupId,
                });
                alert(isAmharic ? 'አዲስ ወጪ በተሳካ ሁኔታ ተመዝግቧል!' : 'Expense recorded successfully!');
            }

            setAddModalOpen(false);
            setEditingExpense(null);
            resetForm();
            loadExpenses();
            loadOverview();
        } catch (error) {
            alert('Failed to save expense: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDeleteExpense = async (id) => {
        if (window.confirm(isAmharic ? 'ይህን የወጪ መዝገብ መሰረዝ እርግጠኛ ነዎት?' : 'Are you sure you want to delete this expense record?')) {
            try {
                await expenseService.delete(id);
                loadExpenses();
                loadOverview();
            } catch (error) {
                alert('Failed to delete expense');
            }
        }
    };

    const handleOpenEdit = (exp) => {
        setEditingExpense(exp);
        setExpenseForm({
            amount: exp.amount?.toString() || '',
            reason: exp.reason || '',
            categoryName: exp.categoryName || 'General Overhead',
            date: exp.date ? new Date(exp.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            paymentMethod: exp.paymentMethod || 'Cash',
            receiptUrl: exp.receiptUrl || '',
            syncCapital: exp.syncCapital !== false,
            notes: exp.notes || '',
        });
        setAddModalOpen(true);
    };

    const resetForm = () => {
        setExpenseForm({
            amount: '',
            reason: '',
            categoryName: categories[0]?.name || 'Packaging & Bags',
            date: new Date().toISOString().split('T')[0],
            paymentMethod: 'Cash',
            receiptUrl: '',
            syncCapital: true,
            notes: '',
        });
    };

    const handleJoinGroup = async (e) => {
        e.preventDefault();
        if (!joinConnectionId.trim()) return;
        try {
            const res = await groupService.join({ connectionId: joinConnectionId.trim() });
            alert(res.data.message || 'Connected successfully!');
            setJoinConnectionId('');
            setPartnerModalOpen(false);
            loadInitialData();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to connect to partner');
        }
    };

    const handleUpdateBudget = async (e) => {
        e.preventDefault();
        if (!activeGroupId || activeGroupId === 'personal') return;
        try {
            await groupService.updateBudget(activeGroupId, {
                budgetLimit: Number(budgetLimitInput),
            });
            alert(isAmharic ? 'የበጀት ገደብ ተቀይሯል!' : 'Budget limit updated successfully!');
            setBudgetModalOpen(false);
            loadOverview();
        } catch (error) {
            alert('Failed to update budget limit');
        }
    };

    const copyCode = (code) => {
        if (!code) return;
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const activeGroup = groups.find((g) => g._id === activeGroupId);

    const filteredExpenses = expenses.filter((exp) => {
        const matchesCategory = selectedCategory === 'all' || exp.categoryName === selectedCategory;
        const matchesSearch =
            !searchTerm ||
            exp.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            exp.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            exp.userName?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const filteredTotal = filteredExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    const breakdownEntries = overview?.categoryBreakdown
        ? Object.entries(overview.categoryBreakdown).sort((a, b) => b[1] - a[1])
        : [];
    const breakdownTotal = breakdownEntries.reduce((sum, [, amt]) => sum + amt, 0);

    const budgetLimit = overview?.budgetLimit || 25000;
    const thisMonthSpend = overview?.thisMonthSpend || 0;
    const budgetRemaining = Math.max(0, budgetLimit - thisMonthSpend);
    const netProfit = overview?.netProfitThisMonth || 0;
    const todayEth = toEthiopianDate(new Date(), true);

    return (
        <div className="mezgeb-page">
            {/* 1. HERO COMMAND BANNER */}
            <div className="mezgeb-hero">
                <div className="mezgeb-hero-left">
                    <div className="mezgeb-store-badge">
                        <Store size={26} />
                    </div>
                    <div>
                        <div className="mezgeb-title-row">
                            <h1 className="mezgeb-title">
                                {activeGroup ? activeGroup.name : isAmharic ? 'የግል መዝገብ' : 'Personal Ledger'}
                            </h1>
                            <span className="mezgeb-type-pill">
                                {activeGroup?.type === 'online_shop' ? 'Online Shop' : 'Ledger'}
                            </span>
                        </div>
                        <div className="mezgeb-subtitle-row">
                            <span>
                                {activeGroup?.members?.length > 1
                                    ? isAmharic
                                        ? `ከ ${activeGroup.members.length} የንግድ አጋሮች ጋር የተገናኘ`
                                        : `Connected with ${activeGroup.members.length} business partners`
                                    : isAmharic
                                        ? 'የጋራ ሱቅ ወጪዎችና ገቢ መቆጣጠሪያ'
                                        : 'Shared store overheads & revenue tracking'}
                            </span>
                            <span className="mezgeb-eth-today">
                                <Calendar size={12} />
                                {todayEth}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Action Cluster */}
                <div className="mezgeb-hero-actions">
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className={`mezgeb-glass-btn ${justRefreshed ? 'refreshed' : ''}`}
                        title={isAmharic ? 'መረጃዎችን አድስ' : 'Refresh ledger data'}
                    >
                        {justRefreshed ? (
                            <>
                                <CheckCircle2 size={15} />
                                <span>{isAmharic ? 'ተዘምኗል' : 'Updated'}</span>
                            </>
                        ) : (
                            <>
                                <RefreshCw size={15} className={isRefreshing ? 'spinning-refresh-icon' : ''} />
                                <span>{isRefreshing ? (isAmharic ? 'በማደስ ላይ...' : 'Refreshing...') : t('refresh', 'Refresh')}</span>
                            </>
                        )}
                    </button>

                    {activeGroup?.connectionId && (
                        <button
                            onClick={() => copyCode(activeGroup.connectionId)}
                            title={isAmharic ? 'የአጋር ኮድ ቅዳ' : 'Copy partner connection code'}
                            className={`mezgeb-glass-btn ${copied ? 'copied' : ''}`}
                        >
                            <Users size={14} color="#67e8f9" />
                            <span className="mezgeb-code-text">{activeGroup.connectionId}</span>
                            {copied ? <Check size={14} /> : <Copy size={13} style={{ opacity: 0.75 }} />}
                        </button>
                    )}

                    <button onClick={() => setPartnerModalOpen(true)} className="mezgeb-glass-btn">
                        <Users size={15} />
                        <span>{isAmharic ? 'አጋር አገናኝ' : 'Connect Partner'}</span>
                    </button>

                    <button
                        onClick={() => {
                            setEditingExpense(null);
                            resetForm();
                            setAddModalOpen(true);
                        }}
                        className="mezgeb-primary-btn"
                    >
                        <Plus size={17} strokeWidth={2.6} />
                        <span>{isAmharic ? 'አዲስ ወጪ መዝግብ' : 'Record Expense'}</span>
                    </button>
                </div>
            </div>

            {/* 2. 4 FINTECH KPI METRIC CARDS */}
            <div className="mezgeb-kpi-grid">
                {/* Today's Spend */}
                <div className="mezgeb-kpi-card accent-cyan">
                    <div className="mezgeb-kpi-top">
                        <span className="mezgeb-kpi-label">
                            {isAmharic ? 'የዛሬ አጠቃላይ ወጪ' : "Today's Overhead Spend"}
                        </span>
                        <div className="mezgeb-kpi-icon cyan">
                            <Receipt size={19} />
                        </div>
                    </div>
                    <div className="mezgeb-kpi-value">
                        ETB {(overview?.todaySpend || 0).toLocaleString()}
                    </div>
                    <div className="mezgeb-kpi-foot">
                        <span>{isAmharic ? 'በዛሬው ዕለት የወጣ ወጪ' : 'Operational overhead today'}</span>
                    </div>
                </div>

                {/* This Month Spend */}
                <div className="mezgeb-kpi-card accent-rose">
                    <div className="mezgeb-kpi-top">
                        <span className="mezgeb-kpi-label">
                            {isAmharic ? 'የዚህ ወር አጠቃላይ ወጪ' : 'This Month Spend'}
                        </span>
                        <div className="mezgeb-kpi-icon rose">
                            <TrendingDown size={19} />
                        </div>
                    </div>
                    <div className="mezgeb-kpi-value negative">
                        -ETB {thisMonthSpend.toLocaleString()}
                    </div>
                    <div className="mezgeb-kpi-foot">
                        <span>
                            {isAmharic
                                ? `ያለፈው ወር: ETB ${(overview?.lastMonthSpend || 0).toLocaleString()}`
                                : `Last month: ETB ${(overview?.lastMonthSpend || 0).toLocaleString()}`}
                        </span>
                    </div>
                </div>

                {/* Monthly Budget Limit */}
                <div className="mezgeb-kpi-card accent-amber">
                    <div className="mezgeb-kpi-top">
                        <span className="mezgeb-kpi-label">
                            {isAmharic ? 'የወር በጀት ገደብ' : 'Monthly Budget Limit'}
                        </span>
                        <button onClick={() => setBudgetModalOpen(true)} className="mezgeb-edit-chip">
                            {isAmharic ? 'ቀይር' : 'Edit'}
                        </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                        <span
                            className={`mezgeb-kpi-value ${overview?.isBudgetExceeded ? 'negative' : ''}`}
                        >
                            {overview?.budgetPercent || 0}%
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--admin-subtext, #64748b)', fontWeight: 600 }}>
                            {thisMonthSpend.toLocaleString()} / {budgetLimit.toLocaleString()} ETB
                        </span>
                    </div>
                    <div className="mezgeb-budget-track">
                        <div
                            className="mezgeb-budget-fill"
                            style={{
                                width: `${Math.min(100, overview?.budgetPercent || 0)}%`,
                                background: overview?.isBudgetExceeded
                                    ? 'linear-gradient(90deg, #f43f5e, #fb7185)'
                                    : overview?.isBudgetWarning
                                        ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                                        : 'linear-gradient(90deg, #10b981, #06b6d4)',
                            }}
                        />
                    </div>
                    <div className="mezgeb-kpi-foot">
                        <span>
                            {isAmharic
                                ? `ቀሪ በጀት: ETB ${budgetRemaining.toLocaleString()}`
                                : `ETB ${budgetRemaining.toLocaleString()} remaining`}
                        </span>
                    </div>
                </div>

                {/* Live Net Store Profit */}
                <div className={`mezgeb-kpi-card ${netProfit >= 0 ? 'accent-emerald' : 'accent-rose'}`}>
                    <div className="mezgeb-kpi-top">
                        <span className="mezgeb-kpi-label">
                            {isAmharic ? 'የተጣራ የሱቅ ትርፍ' : 'Net Store Profit'}
                        </span>
                        <div className={`mezgeb-kpi-icon ${netProfit >= 0 ? 'emerald' : 'rose'}`}>
                            <TrendingUp size={19} />
                        </div>
                    </div>
                    <div className={`mezgeb-kpi-value ${netProfit >= 0 ? 'positive' : 'negative'}`}>
                        {netProfit >= 0 ? '+' : ''}ETB {netProfit.toLocaleString()}
                    </div>
                    <div className="mezgeb-kpi-foot">
                        <span>
                            {isAmharic
                                ? `የመስመር ላይ ሽያጭ: +ETB ${(overview?.storeRevenueThisMonth || 0).toLocaleString()}`
                                : `Online sales: +ETB ${(overview?.storeRevenueThisMonth || 0).toLocaleString()}`}
                        </span>
                    </div>
                </div>
            </div>

            {/* 3. CATEGORY BREAKDOWN WITH PROPORTIONAL VISUAL BAR */}
            {breakdownEntries.length > 0 && (
                <div className="mezgeb-breakdown-card">
                    <div className="mezgeb-breakdown-head">
                        <span className="mezgeb-section-eyebrow">
                            <PieChart size={15} color="#06b6d4" />
                            {isAmharic ? 'የወጪ ክፍፍል በምድብ' : 'Overhead Expenses By Category'}
                        </span>
                        {selectedCategory !== 'all' && (
                            <button
                                onClick={() => setSelectedCategory('all')}
                                className="mezgeb-edit-chip"
                            >
                                {isAmharic ? 'ሁሉንም አሳይ' : 'Show All Categories'}
                            </button>
                        )}
                    </div>

                    {/* Stacked Proportional Spend Bar */}
                    <div className="mezgeb-stacked-bar">
                        {breakdownEntries.map(([cat, amt]) => {
                            const palette = getCategoryStyle(cat);
                            const pct = breakdownTotal > 0 ? (amt / breakdownTotal) * 100 : 0;
                            return (
                                <div
                                    key={cat}
                                    className="mezgeb-stacked-segment"
                                    title={`${cat}: ETB ${amt.toLocaleString()} (${Math.round(pct)}%)`}
                                    onClick={() => setSelectedCategory(selectedCategory === cat ? 'all' : cat)}
                                    style={{
                                        width: `${pct}%`,
                                        background: palette.color,
                                        opacity: selectedCategory !== 'all' && selectedCategory !== cat ? 0.3 : 1,
                                    }}
                                />
                            );
                        })}
                    </div>

                    {/* Interactive Category Filter Pills */}
                    <div className="mezgeb-cat-pills">
                        {breakdownEntries.map(([cat, amt]) => {
                            const palette = getCategoryStyle(cat);
                            const pct = breakdownTotal > 0 ? Math.round((amt / breakdownTotal) * 100) : 0;
                            const isActive = selectedCategory === cat;
                            return (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setSelectedCategory(isActive ? 'all' : cat)}
                                    className={`mezgeb-cat-pill ${isActive ? 'active' : ''}`}
                                >
                                    <span className="mezgeb-cat-dot" style={{ background: palette.color }} />
                                    <span>{cat}</span>
                                    <strong>ETB {amt.toLocaleString()}</strong>
                                    <span className="mezgeb-cat-share">{pct}%</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 4. FILTER & SEARCH TOOLBAR */}
            <div className="mezgeb-toolbar">
                <div className="mezgeb-search-wrap">
                    <Search size={17} className="mezgeb-search-icon" />
                    <input
                        type="text"
                        className="mezgeb-search-input"
                        placeholder={
                            isAmharic
                                ? 'በምክንያት፣ በማስታወሻ ወይም በሰው ስም ፈልግ...'
                                : 'Search expenses by reason, partner name, or notes...'
                        }
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            className="mezgeb-clear-search"
                            onClick={() => setSearchTerm('')}
                            title="Clear search"
                        >
                            <X size={15} />
                        </button>
                    )}
                </div>

                <div className="mezgeb-toolbar-right">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <SlidersHorizontal size={15} color="var(--admin-subtext, #64748b)" />
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="mezgeb-select"
                        >
                            <option value="all">
                                {isAmharic ? 'ሁሉም የወጪ ምድቦች' : 'All Overhead Categories'}
                            </option>
                            {categories.map((c) => (
                                <option key={c._id} value={c.name}>
                                    {isAmharic ? c.nameAmharic : c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="mezgeb-summary-chip">
                        <Wallet size={14} color="#06b6d4" />
                        <span>
                            {filteredExpenses.length} {isAmharic ? 'መዝገብ' : filteredExpenses.length === 1 ? 'record' : 'records'}
                        </span>
                        <span style={{ opacity: 0.4 }}>•</span>
                        <span style={{ color: '#f43f5e' }}>ETB {filteredTotal.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* 5. EXPENSE LEDGER TABLE */}
            <div className="mezgeb-table-card">
                <div className="mezgeb-table-scroll">
                    <table className="mezgeb-table">
                        <thead>
                            <tr>
                                <th>{isAmharic ? 'ቀን (ግሪጎሪያን / ኢትዮጵያ)' : 'Date (Gregorian / Eth)'}</th>
                                <th>{isAmharic ? 'ምክንያት / ርዕስ' : 'Reason / Description'}</th>
                                <th>{isAmharic ? 'ምድብ' : 'Category'}</th>
                                <th>{isAmharic ? 'መጠን (ብር)' : 'Amount (ETB)'}</th>
                                <th>{isAmharic ? 'የመዘገበው' : 'Logged By'}</th>
                                <th>{isAmharic ? 'የክፍያ ዘዴ' : 'Payment Method'}</th>
                                <th>{isAmharic ? 'ደረሰኝ' : 'Receipt'}</th>
                                <th style={{ textAlign: 'right' }}>{isAmharic ? 'እርምጃዎች' : 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredExpenses.map((exp) => {
                                const catStyle = getCategoryStyle(exp.categoryName);
                                const loggerName = exp.userName || 'Store Partner';
                                const initial = loggerName.trim().charAt(0) || 'A';
                                return (
                                    <tr key={exp._id}>
                                        <td>
                                            <div className="mezgeb-date-greg">
                                                {new Date(exp.date).toLocaleDateString()}
                                            </div>
                                            <div className="mezgeb-date-eth">
                                                <Calendar size={11} />
                                                <span>{exp.dateEthiopian || toEthiopianDate(exp.date, true)}</span>
                                            </div>
                                        </td>
                                        <td style={{ maxWidth: '260px' }}>
                                            <div className="mezgeb-reason">{exp.reason}</div>
                                            {exp.notes && <div className="mezgeb-notes">{exp.notes}</div>}
                                        </td>
                                        <td>
                                            <span
                                                className="mezgeb-category-badge"
                                                style={{
                                                    background: catStyle.bg,
                                                    color: catStyle.color,
                                                    border: `1px solid ${catStyle.border}`,
                                                }}
                                            >
                                                <span
                                                    className="mezgeb-cat-dot"
                                                    style={{ background: catStyle.color, width: '7px', height: '7px' }}
                                                />
                                                {exp.categoryName}
                                            </span>
                                        </td>
                                        <td className="mezgeb-amount-cell">
                                            -ETB {(exp.amount || 0).toLocaleString()}
                                        </td>
                                        <td>
                                            <div className="mezgeb-user-cell">
                                                <span className="mezgeb-avatar">{initial}</span>
                                                <span>{loggerName}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="mezgeb-method-pill">
                                                <CreditCard size={12} color="#06b6d4" />
                                                {exp.paymentMethod || 'Cash'}
                                            </span>
                                        </td>
                                        <td>
                                            {exp.receiptUrl ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setReceiptPreviewUrl(exp.receiptUrl)}
                                                    className="mezgeb-receipt-btn"
                                                >
                                                    <ImageIcon size={13} />
                                                    <span>{isAmharic ? 'ደረሰኝ' : 'View'}</span>
                                                </button>
                                            ) : (
                                                <span style={{ color: 'var(--admin-subtext, #94a3b8)', fontSize: '0.82rem' }}>
                                                    —
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div className="mezgeb-action-group">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenEdit(exp)}
                                                    title={isAmharic ? 'አስተካክል' : 'Edit expense'}
                                                    className="mezgeb-icon-btn edit"
                                                >
                                                    <Edit2 size={15} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteExpense(exp._id)}
                                                    title={isAmharic ? 'ሰርዝ' : 'Delete expense'}
                                                    className="mezgeb-icon-btn delete"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {filteredExpenses.length === 0 && (
                        <div className="mezgeb-empty">
                            <div className="mezgeb-empty-icon">
                                <Receipt size={28} />
                            </div>
                            <h4>
                                {loading
                                    ? isAmharic
                                        ? 'መረጃዎችን በመጫን ላይ...'
                                        : 'Loading expense ledger...'
                                    : isAmharic
                                        ? 'ምንም የወጪ መዛግብት አልተገኙም'
                                        : 'No overhead expenses found'}
                            </h4>
                            <p>
                                {searchTerm || selectedCategory !== 'all'
                                    ? isAmharic
                                        ? 'የፍለጋ ማጣሪያዎን ይቀይሩ ወይም አዲስ ወጪ ይመዝግቡ።'
                                        : 'Try clearing your search or category filter, or record a new expense.'
                                    : isAmharic
                                        ? 'የሱቅዎን የዕለት ወጪዎች መመዝገብ ይጀምሩ።'
                                        : 'Start tracking your daily operational overheads & store profit.'}
                            </p>
                            {!loading && (
                                <button
                                    type="button"
                                    className="mezgeb-primary-btn"
                                    onClick={() => {
                                        setEditingExpense(null);
                                        resetForm();
                                        setAddModalOpen(true);
                                    }}
                                >
                                    <Plus size={16} />
                                    <span>{isAmharic ? 'አዲስ ወጪ መዝግብ' : 'Record First Expense'}</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ADD / EDIT EXPENSE MODAL */}
            {addModalOpen && (
                <div
                    className="mezgeb-modal-backdrop"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setAddModalOpen(false);
                    }}
                >
                    <div className="mezgeb-modal">
                        <div className="mezgeb-modal-header">
                            <h2 className="mezgeb-modal-title">
                                <Receipt size={20} color="#06b6d4" />
                                {editingExpense
                                    ? isAmharic
                                        ? 'የወጪ መዝገብ አስተካክል'
                                        : 'Edit Expense Record'
                                    : isAmharic
                                        ? 'አዲስ የሱቅ ወጪ መዝግብ'
                                        : 'Record New Store Overhead'}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setAddModalOpen(false)}
                                className="mezgeb-modal-close"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveExpense} style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label className="mezgeb-field-label">
                                    {isAmharic ? 'የወጪ መጠን በብር (ETB) *' : 'Expense Amount in ETB *'}
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    step="any"
                                    placeholder="0.00"
                                    value={expenseForm.amount}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                                    className="mezgeb-input"
                                    style={{ fontSize: '1.15rem', fontWeight: 800 }}
                                />
                            </div>

                            <div>
                                <label className="mezgeb-field-label">
                                    {isAmharic ? 'የወጪው ምክንያት / ለምን ወጣ? *' : 'Reason / What was this expense for? *'}
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder={isAmharic ? 'ለምሳሌ፡ የሱቅ ኪራይ ወይም 200 ፌስታል ማሸጊያ' : 'e.g. Shop Rent or 200 Delivery Bags'}
                                    value={expenseForm.reason}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, reason: e.target.value })}
                                    className="mezgeb-input"
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                                <div>
                                    <label className="mezgeb-field-label">
                                        {isAmharic ? 'የወጪ ምድብ *' : 'Category *'}
                                    </label>
                                    <select
                                        value={expenseForm.categoryName}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, categoryName: e.target.value })}
                                        className="mezgeb-input"
                                    >
                                        {categories.map((c) => (
                                            <option key={c._id} value={c.name}>
                                                {isAmharic ? c.nameAmharic : c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="mezgeb-field-label">
                                        {isAmharic ? 'የክፍያ ዘዴ *' : 'Payment Method *'}
                                    </label>
                                    <select
                                        value={expenseForm.paymentMethod}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
                                        className="mezgeb-input"
                                    >
                                        <option value="Cash">{isAmharic ? 'በእጅ ገንዘብ (Cash)' : 'Cash'}</option>
                                        <option value="Telebirr">Telebirr</option>
                                        <option value="CBEBirr">CBEBirr</option>
                                        <option value="Bank Transfer">{isAmharic ? 'የባንክ ማስተላለፍ' : 'Bank Transfer'}</option>
                                        <option value="Other">{isAmharic ? 'ሌላ' : 'Other'}</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="mezgeb-field-label">
                                    {isAmharic ? 'የወጣበት ቀን (Date)' : 'Expense Date'}
                                </label>
                                <input
                                    type="date"
                                    value={expenseForm.date}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                                    className="mezgeb-input"
                                />
                                <div className="mezgeb-date-eth" style={{ marginTop: '6px' }}>
                                    <Calendar size={12} />
                                    <span>
                                        {isAmharic ? 'የኢትዮጵያ ቀን አቆጣጠር:' : 'Ethiopian Calendar:'}{' '}
                                        {toEthiopianDate(expenseForm.date, true)}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="mezgeb-field-label">
                                    {isAmharic ? 'የደረሰኝ ፎቶ ማስፈንጠሪያ (Receipt URL)' : 'Receipt Image URL (Optional)'}
                                </label>
                                <input
                                    type="url"
                                    placeholder="https://.../receipt.jpg"
                                    value={expenseForm.receiptUrl}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, receiptUrl: e.target.value })}
                                    className="mezgeb-input"
                                />
                            </div>

                            <div
                                style={{
                                    background: 'var(--admin-inner-bg, #f8fafc)',
                                    padding: '0.95rem 1rem',
                                    borderRadius: '14px',
                                    border: '1px solid var(--admin-border, #e2e8f0)',
                                }}
                            >
                                <label
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.6rem',
                                        cursor: 'pointer',
                                        fontWeight: 700,
                                        fontSize: '0.88rem',
                                        color: 'var(--admin-text, #0f172a)',
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={expenseForm.syncCapital}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, syncCapital: e.target.checked })}
                                    />
                                    {isAmharic ? 'ከካፒታል ግምጃ ቤት ጋር አስተሳስር (Sync Capital)' : 'Sync to Store Capital Treasury as Outflow'}
                                </label>
                                <div style={{ fontSize: '0.78rem', color: 'var(--admin-subtext, #64748b)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <Sparkles size={13} color="#06b6d4" />
                                    {isAmharic
                                        ? 'በካፒታል መዝገብ ላይ እንደ ወጪ (OUTFLOW) በራስ-ሰር ይመዘገባል'
                                        : 'Automatically creates an OUTFLOW entry in Capital Treasury'}
                                </div>
                            </div>

                            <div>
                                <label className="mezgeb-field-label">
                                    {isAmharic ? 'ተጨማሪ ማስታወሻ (አማራጭ)' : 'Additional Notes (Optional)'}
                                </label>
                                <input
                                    type="text"
                                    placeholder={isAmharic ? 'ማስታወሻ...' : 'Any details...'}
                                    value={expenseForm.notes}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                                    className="mezgeb-input"
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '0.85rem', marginTop: '0.35rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setAddModalOpen(false)}
                                    style={{
                                        flex: 1,
                                        padding: '0.78rem',
                                        borderRadius: '12px',
                                        border: '1px solid var(--admin-border, #cbd5e1)',
                                        background: 'var(--admin-inner-bg, #f8fafc)',
                                        color: 'var(--admin-text, #0f172a)',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                    }}
                                >
                                    {isAmharic ? 'ይቅር' : 'Cancel'}
                                </button>
                                <button type="submit" className="mezgeb-primary-btn" style={{ flex: 1, justifyContent: 'center' }}>
                                    {editingExpense ? (isAmharic ? 'አስተካክል' : 'Update Expense') : isAmharic ? 'መዝግብ' : 'Save Expense'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* PARTNER CONNECTION MODAL */}
            {partnerModalOpen && (
                <div
                    className="mezgeb-modal-backdrop"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setPartnerModalOpen(false);
                    }}
                >
                    <div className="mezgeb-modal" style={{ maxWidth: '470px' }}>
                        <div className="mezgeb-modal-header">
                            <h2 className="mezgeb-modal-title">
                                <Users size={20} color="#06b6d4" />
                                {isAmharic ? 'የንግድ አጋር ማገናኛ' : 'Shop Partner Connections'}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setPartnerModalOpen(false)}
                                className="mezgeb-modal-close"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div
                            style={{
                                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(14, 116, 144, 0.92))',
                                color: '#ffffff',
                                padding: '1.35rem',
                                borderRadius: '16px',
                                textAlign: 'center',
                                marginBottom: '1.4rem',
                            }}
                        >
                            <div style={{ fontSize: '0.82rem', color: 'rgba(226, 232, 240, 0.85)', marginBottom: '0.45rem' }}>
                                {isAmharic ? 'ለአጋርዎ የሚሰጡት የሱቅ መለያ ኮድ' : 'Share this code with your business partner'}
                            </div>
                            <div
                                className="mezgeb-code-text"
                                style={{ fontSize: '1.75rem', letterSpacing: '3px', color: '#67e8f9', marginBottom: '0.75rem' }}
                            >
                                {activeGroup?.connectionId || 'CONN-4821'}
                            </div>
                            <button
                                type="button"
                                onClick={() => copyCode(activeGroup?.connectionId)}
                                className={`mezgeb-glass-btn ${copied ? 'copied' : ''}`}
                                style={{ margin: '0 auto' }}
                            >
                                {copied ? <Check size={15} /> : <Copy size={15} />}
                                <span>{copied ? (isAmharic ? 'ተቀድቷል!' : 'Copied!') : isAmharic ? 'ኮዱን ቅዳ' : 'Copy Code'}</span>
                            </button>
                        </div>

                        <form onSubmit={handleJoinGroup}>
                            <label className="mezgeb-field-label">
                                {isAmharic ? 'ከሌላ አጋር ሱቅ ጋር ተገናኝ' : 'Connect to another Partner Shop'}
                            </label>
                            <div style={{ display: 'flex', gap: '0.6rem' }}>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. CONN-1234"
                                    value={joinConnectionId}
                                    onChange={(e) => setJoinConnectionId(e.target.value.toUpperCase())}
                                    className="mezgeb-input"
                                    style={{ fontWeight: 700, letterSpacing: '1px' }}
                                />
                                <button type="submit" className="mezgeb-primary-btn">
                                    {isAmharic ? 'ተገናኝ' : 'Join'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT BUDGET MODAL */}
            {budgetModalOpen && (
                <div
                    className="mezgeb-modal-backdrop"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setBudgetModalOpen(false);
                    }}
                >
                    <div className="mezgeb-modal" style={{ maxWidth: '420px' }}>
                        <div className="mezgeb-modal-header">
                            <h2 className="mezgeb-modal-title">
                                <Wallet size={20} color="#06b6d4" />
                                {isAmharic ? 'የወር በጀት ገደብ ቀይር' : 'Edit Monthly Budget Limit'}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setBudgetModalOpen(false)}
                                className="mezgeb-modal-close"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateBudget} style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label className="mezgeb-field-label">
                                    {isAmharic ? 'ወርሃዊ ከፍተኛ የወጪ ገደብ (በብር)' : 'Monthly Maximum Overhead Limit (ETB)'}
                                </label>
                                <input
                                    type="number"
                                    min="1000"
                                    required
                                    value={budgetLimitInput}
                                    onChange={(e) => setBudgetLimitInput(e.target.value)}
                                    className="mezgeb-input"
                                    style={{ fontSize: '1.15rem', fontWeight: 800 }}
                                />
                            </div>

                            <button type="submit" className="mezgeb-primary-btn" style={{ justifyContent: 'center' }}>
                                {isAmharic ? 'በጀቱን አረጋግጥ' : 'Save Budget Limit'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* RECEIPT IMAGE PREVIEW MODAL */}
            {receiptPreviewUrl && (
                <div
                    className="mezgeb-modal-backdrop"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setReceiptPreviewUrl(null);
                    }}
                >
                    <div className="mezgeb-modal" style={{ maxWidth: '640px', padding: 0, overflow: 'hidden' }}>
                        <div className="mezgeb-modal-header" style={{ padding: '1.1rem 1.4rem', margin: 0 }}>
                            <span className="mezgeb-modal-title" style={{ fontSize: '1.05rem' }}>
                                <ImageIcon size={18} color="#06b6d4" />
                                {isAmharic ? 'የደረሰኝ ፎቶ (Receipt Voucher)' : 'Receipt Voucher Preview'}
                            </span>
                            <button
                                type="button"
                                onClick={() => setReceiptPreviewUrl(null)}
                                className="mezgeb-modal-close"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div style={{ padding: '1.5rem', textAlign: 'center', background: '#090e17' }}>
                            <img
                                src={receiptPreviewUrl}
                                alt="Expense Receipt"
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '60vh',
                                    borderRadius: '14px',
                                    boxShadow: '0 8px 28px rgba(0,0,0,0.45)',
                                }}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://placehold.co/600x400/png?text=Receipt+Image+Unavailable';
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExpenseManagement;
