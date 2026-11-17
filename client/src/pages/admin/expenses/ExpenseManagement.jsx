import React, { useState, useEffect } from 'react';
import {
    Receipt,
    Plus,
    Search,
    Calendar,
    Users,
    Store,
    DollarSign,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle,
    Copy,
    Check,
    Image as ImageIcon,
    Trash2,
    Edit2,
    Wallet,
    Layers,
    Clock,
    X,
    ExternalLink
} from 'lucide-react';
import { expenseService, groupService } from '../../../services/api';
import { useAdminLanguage } from '../../../context/AdminLanguageContext';
import { toEthiopianDate } from '../../../utils/ethiopianDate';

const ExpenseManagement = () => {
    const { t, isAmharic } = useAdminLanguage();

    const [overview, setOverview] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [groups, setGroups] = useState([]);
    const [activeGroupId, setActiveGroupId] = useState(null);
    const [loading, setLoading] = useState(true);

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
        if (activeGroupId !== undefined) {
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

    const activeGroup = groups.find(g => g._id === activeGroupId);

    const filteredExpenses = expenses.filter(exp => {
        const matchesCategory = selectedCategory === 'all' || exp.categoryName === selectedCategory;
        const matchesSearch = !searchTerm ||
            exp.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            exp.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            exp.userName?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '3rem' }}>
            {/* Top Store / Group & Partner Banner */}
            <div style={{
                background: 'var(--admin-card-bg, white)',
                padding: '1.2rem 1.6rem',
                borderRadius: '20px',
                border: '1px solid var(--admin-border, #eee)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        boxShadow: '0 4px 12px rgba(6, 182, 212, 0.35)'
                    }}>
                        <Store size={24} />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--admin-text, #1a1b1e)' }}>
                                {activeGroup ? activeGroup.name : (isAmharic ? 'የግል መዝገብ' : 'Personal Ledger')}
                            </span>
                            <span style={{
                                padding: '2px 8px',
                                borderRadius: '8px',
                                fontSize: '0.72rem',
                                fontWeight: '700',
                                background: 'rgba(6, 182, 212, 0.15)',
                                color: '#06b6d4',
                                border: '1px solid rgba(6, 182, 212, 0.3)'
                            }}>
                                {activeGroup?.type === 'online_shop' ? 'ONLINE SHOP' : 'LEDGER'}
                            </span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--admin-subtext, #868e96)', marginTop: '2px' }}>
                            {activeGroup?.members?.length > 1
                                ? (isAmharic ? `ከ ${activeGroup.members.length} የንግድ አጋሮች ጋር የተገናኘ` : `Connected with ${activeGroup.members.length} business partners`)
                                : (isAmharic ? 'የጋራ ሱቅ ወጪዎችና ገቢ መቆጣጠሪያ' : 'Shared store overheads & revenue tracking')}
                        </div>
                    </div>
                </div>

                {/* Switcher & Partner Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                    {/* Active Connection Code Pill */}
                    {activeGroup?.connectionId && (
                        <button
                            onClick={() => copyCode(activeGroup.connectionId)}
                            title="Click to copy connection code for your partner"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: 'var(--admin-inner-bg, #f8f9fa)',
                                border: '1px solid var(--admin-border, #dee2e6)',
                                padding: '7px 14px',
                                borderRadius: '12px',
                                fontSize: '0.82rem',
                                fontWeight: '700',
                                color: 'var(--admin-text, #1a1b1e)',
                                cursor: 'pointer'
                            }}
                        >
                            <Users size={14} color="#06b6d4" />
                            <span>{activeGroup.connectionId}</span>
                            {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} color="var(--admin-subtext, #868e96)" />}
                        </button>
                    )}

                    {/* Partner Connection Button */}
                    <button
                        onClick={() => setPartnerModalOpen(true)}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'var(--admin-inner-bg, #f8f9fa)',
                            border: '1px solid var(--admin-border, #dee2e6)',
                            padding: '8px 14px',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            color: 'var(--admin-text, #1a1b1e)',
                            cursor: 'pointer'
                        }}
                    >
                        <Users size={16} />
                        <span>{isAmharic ? 'አጋር አገናኝ (Partners)' : 'Connect Partner'}</span>
                    </button>

                    {/* Add Expense Button */}
                    <button
                        onClick={() => {
                            setEditingExpense(null);
                            resetForm();
                            setAddModalOpen(true);
                        }}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '12px',
                            fontSize: '0.9rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            boxShadow: '0 4px 14px rgba(6, 182, 212, 0.35)'
                        }}
                    >
                        <Plus size={18} />
                        <span>{isAmharic ? '+ አዲስ ወጪ መዝግብ' : '+ Record Expense'}</span>
                    </button>
                </div>
            </div>

            {/* 4 Summary KPI Metric Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.2rem',
                marginBottom: '1.8rem'
            }}>
                {/* 1. Today's Spend */}
                <div style={{
                    background: 'var(--admin-card-bg, white)',
                    padding: '1.4rem',
                    borderRadius: '18px',
                    border: '1px solid var(--admin-border, #eee)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--admin-subtext, #868e96)', fontSize: '0.85rem' }}>
                        <span>{isAmharic ? 'የዛሬ አጠቃላይ ወጪ' : "Today's Overhead Spend"}</span>
                        <Receipt size={18} color="#06b6d4" />
                    </div>
                    <div style={{ fontSize: '1.9rem', fontWeight: '800', color: 'var(--admin-text, #1a1b1e)', marginTop: '0.4rem' }}>
                        ETB {(overview?.todaySpend || 0).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--admin-subtext, #868e96)', marginTop: '0.2rem' }}>
                        {isAmharic ? 'በዛሬው ዕለት የወጣ አጠቃላይ ወጪ' : 'Operational overhead today'}
                    </div>
                </div>

                {/* 2. This Month Spend */}
                <div style={{
                    background: 'var(--admin-card-bg, white)',
                    padding: '1.4rem',
                    borderRadius: '18px',
                    border: '1px solid var(--admin-border, #eee)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--admin-subtext, #868e96)', fontSize: '0.85rem' }}>
                        <span>{isAmharic ? 'የዚህ ወር አጠቃላይ ወጪ' : 'This Month Spend'}</span>
                        <TrendingDown size={18} color="#fa5252" />
                    </div>
                    <div style={{ fontSize: '1.9rem', fontWeight: '800', color: '#fa5252', marginTop: '0.4rem' }}>
                        -ETB {(overview?.thisMonthSpend || 0).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--admin-subtext, #868e96)', marginTop: '0.2rem' }}>
                        {isAmharic
                            ? `ያለፈው ወር: ETB ${(overview?.lastMonthSpend || 0).toLocaleString()}`
                            : `Last month: ETB ${(overview?.lastMonthSpend || 0).toLocaleString()}`}
                    </div>
                </div>

                {/* 3. Monthly Budget Limit & Gauge */}
                <div style={{
                    background: 'var(--admin-card-bg, white)',
                    padding: '1.4rem',
                    borderRadius: '18px',
                    border: '1px solid var(--admin-border, #eee)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--admin-subtext, #868e96)' }}>
                            {isAmharic ? 'የወር በጀት ገደብ' : 'Monthly Budget Limit'}
                        </span>
                        <button
                            onClick={() => setBudgetModalOpen(true)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#06b6d4',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                cursor: 'pointer'
                            }}
                        >
                            {isAmharic ? 'ቀይር' : 'Edit'}
                        </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '0.4rem' }}>
                        <span style={{ fontSize: '1.8rem', fontWeight: '800', color: overview?.isBudgetExceeded ? '#fa5252' : 'var(--admin-text, #1a1b1e)' }}>
                            {overview?.budgetPercent || 0}%
                        </span>
                        <span style={{ fontSize: '0.82rem', color: 'var(--admin-subtext, #868e96)' }}>
                            ({(overview?.thisMonthSpend || 0).toLocaleString()} / {(overview?.budgetLimit || 25000).toLocaleString()} ETB)
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{
                        width: '100%',
                        height: '7px',
                        background: 'var(--admin-inner-bg, #e9ecef)',
                        borderRadius: '10px',
                        marginTop: '0.6rem',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${Math.min(100, overview?.budgetPercent || 0)}%`,
                            height: '100%',
                            background: overview?.isBudgetExceeded
                                ? '#fa5252'
                                : overview?.isBudgetWarning
                                    ? '#f59f00'
                                    : 'linear-gradient(90deg, #10b981, #06b6d4)',
                            transition: 'width 0.3s ease'
                        }} />
                    </div>
                </div>

                {/* 4. Live Net Store Profit */}
                <div style={{
                    background: 'var(--admin-card-bg, white)',
                    padding: '1.4rem',
                    borderRadius: '18px',
                    border: '1px solid var(--admin-border, #eee)',
                    borderLeft: `6px solid ${(overview?.netProfitThisMonth || 0) >= 0 ? '#10b981' : '#fa5252'}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--admin-subtext, #868e96)', fontSize: '0.85rem' }}>
                        <span>{isAmharic ? 'የተጣራ የሱቅ ትርፍ (ሽያጭ - ወጪ)' : 'Net Store Profit (Sales - Expenses)'}</span>
                        <TrendingUp size={18} color={(overview?.netProfitThisMonth || 0) >= 0 ? '#10b981' : '#fa5252'} />
                    </div>
                    <div style={{
                        fontSize: '1.9rem',
                        fontWeight: '800',
                        color: (overview?.netProfitThisMonth || 0) >= 0 ? '#10b981' : '#fa5252',
                        marginTop: '0.4rem'
                    }}>
                        ETB {(overview?.netProfitThisMonth || 0).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--admin-subtext, #868e96)', marginTop: '0.2rem' }}>
                        {isAmharic
                            ? `የመስመር ላይ ሽያጭ ገቢ: +ETB ${(overview?.storeRevenueThisMonth || 0).toLocaleString()}`
                            : `Store online sales: +ETB ${(overview?.storeRevenueThisMonth || 0).toLocaleString()}`}
                    </div>
                </div>
            </div>

            {/* Category Breakdown Pill Bar */}
            {overview?.categoryBreakdown && Object.keys(overview.categoryBreakdown).length > 0 && (
                <div style={{
                    background: 'var(--admin-card-bg, white)',
                    padding: '1.2rem 1.5rem',
                    borderRadius: '18px',
                    border: '1px solid var(--admin-border, #eee)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    marginBottom: '1.8rem'
                }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--admin-subtext, #495057)', marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {isAmharic ? 'የወጪ ክፍፍል በምድብ (Category Breakdown)' : 'Overhead Expenses By Category'}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                        {Object.entries(overview.categoryBreakdown).map(([cat, amt]) => (
                            <div
                                key={cat}
                                onClick={() => setSelectedCategory(selectedCategory === cat ? 'all' : cat)}
                                style={{
                                    padding: '6px 14px',
                                    borderRadius: '20px',
                                    background: selectedCategory === cat ? 'linear-gradient(135deg, #0284c7, #06b6d4)' : 'var(--admin-inner-bg, #f1f3f5)',
                                    color: selectedCategory === cat ? 'white' : 'var(--admin-text, #1a1b1e)',
                                    border: '1px solid var(--admin-border, #dee2e6)',
                                    fontSize: '0.82rem',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s'
                                }}
                            >
                                {cat}: ETB {amt.toLocaleString()}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Filters Bar */}
            <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1.5rem',
                flexWrap: 'wrap',
                alignItems: 'center'
            }}>
                <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-subtext, #868e96)' }} />
                    <input
                        type="text"
                        placeholder={isAmharic ? 'በምክንያት፣ በማስታወሻ ወይም በሰው ስም ፈልግ...' : 'Search expenses by reason, partner name, or notes...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.75rem 1rem 0.75rem 2.6rem',
                            borderRadius: '12px',
                            border: '1px solid var(--admin-border, #dee2e6)',
                            background: 'var(--admin-input-bg, white)',
                            color: 'var(--admin-text, #1a1b1e)',
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
                        border: '1px solid var(--admin-border, #dee2e6)',
                        background: 'var(--admin-input-bg, white)',
                        color: 'var(--admin-text, #1a1b1e)',
                        fontSize: '0.95rem'
                    }}
                >
                    <option value="all">{isAmharic ? 'ሁሉም የወጪ ምድቦች' : 'All Overhead Categories'}</option>
                    {categories.map(c => (
                        <option key={c._id} value={c.name}>
                            {isAmharic ? c.nameAmharic : c.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Expense Ledger Table */}
            <div style={{
                background: 'var(--admin-card-bg, white)',
                borderRadius: '16px',
                border: '1px solid var(--admin-border, #eee)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                overflow: 'hidden',
                overflowX: 'auto'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
                    <thead>
                        <tr style={{ background: 'var(--admin-inner-bg, #f8f9fc)', borderBottom: '1px solid var(--admin-border, #eee)', color: 'var(--admin-subtext, #495057)', fontSize: '0.85rem' }}>
                            <th style={{ padding: '1rem' }}>{isAmharic ? 'ቀን (ግሪጎሪያን / ኢትዮጵያ)' : 'DATE (GREGORIAN / ETH)'}</th>
                            <th style={{ padding: '1rem' }}>{isAmharic ? 'ምክንያት / የወጪ ርዕስ' : 'REASON / DESCRIPTION'}</th>
                            <th style={{ padding: '1rem' }}>{isAmharic ? 'ምድብ' : 'CATEGORY'}</th>
                            <th style={{ padding: '1rem' }}>{isAmharic ? 'መጠን በብር' : 'AMOUNT (ETB)'}</th>
                            <th style={{ padding: '1rem' }}>{isAmharic ? 'የመዘገበው ሰው' : 'LOGGED BY'}</th>
                            <th style={{ padding: '1rem' }}>{isAmharic ? 'የክፍያ ዘዴ' : 'PAYMENT METHOD'}</th>
                            <th style={{ padding: '1rem' }}>{isAmharic ? 'ደረሰኝ' : 'RECEIPT'}</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>{isAmharic ? 'እርምጃዎች' : 'ACTIONS'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredExpenses.map(exp => (
                            <tr key={exp._id} style={{ borderBottom: '1px solid var(--admin-border, #eee)' }}>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: '700', color: 'var(--admin-text, #1a1b1e)', fontSize: '0.9rem' }}>
                                        {new Date(exp.date).toLocaleDateString()}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#06b6d4', marginTop: '2px', fontWeight: '600' }}>
                                        🇪🇹 {exp.dateEthiopian || toEthiopianDate(exp.date, true)}
                                    </div>
                                </td>
                                <td style={{ padding: '1rem', maxWidth: '240px' }}>
                                    <div style={{ fontWeight: '600', color: 'var(--admin-text, #1a1b1e)', fontSize: '0.95rem' }}>
                                        {exp.reason}
                                    </div>
                                    {exp.notes && (
                                        <div style={{ fontSize: '0.8rem', color: 'var(--admin-subtext, #868e96)', marginTop: '2px' }}>
                                            {exp.notes}
                                        </div>
                                    )}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '8px',
                                        fontSize: '0.75rem',
                                        fontWeight: '700',
                                        background: 'rgba(6, 182, 212, 0.12)',
                                        color: '#06b6d4',
                                        border: '1px solid rgba(6, 182, 212, 0.25)'
                                    }}>
                                        {exp.categoryName}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: '800', fontSize: '1.05rem', color: '#fa5252' }}>
                                        -ETB {exp.amount.toLocaleString()}
                                    </div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--admin-text, #1a1b1e)', fontWeight: '600' }}>
                                        <Users size={14} color="#06b6d4" />
                                        <span>{exp.userName || 'Store Partner'}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        fontSize: '0.8rem',
                                        fontWeight: '600',
                                        color: 'var(--admin-subtext, #495057)',
                                        background: 'var(--admin-inner-bg, #f1f3f5)',
                                        padding: '3px 8px',
                                        borderRadius: '6px'
                                    }}>
                                        {exp.paymentMethod || 'Cash'}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    {exp.receiptUrl ? (
                                        <button
                                            onClick={() => setReceiptPreviewUrl(exp.receiptUrl)}
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                background: 'rgba(16, 185, 129, 0.12)',
                                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                                color: '#10b981',
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                fontSize: '0.78rem',
                                                fontWeight: '700',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <ImageIcon size={14} />
                                            <span>{isAmharic ? 'ደረሰኝ' : 'View'}</span>
                                        </button>
                                    ) : (
                                        <span style={{ color: 'var(--admin-subtext, #adb5bd)', fontSize: '0.8rem' }}>
                                            —
                                        </span>
                                    )}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                                        <button
                                            onClick={() => handleOpenEdit(exp)}
                                            title="Edit expense"
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: 'var(--admin-subtext, #868e96)',
                                                cursor: 'pointer',
                                                padding: '4px'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.color = '#06b6d4'}
                                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--admin-subtext, #868e96)'}
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteExpense(exp._id)}
                                            title="Delete expense"
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: 'var(--admin-subtext, #ced4da)',
                                                cursor: 'pointer',
                                                padding: '4px'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.color = '#fa5252'}
                                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--admin-subtext, #ced4da)'}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredExpenses.length === 0 && (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--admin-subtext, #868e96)' }}>
                                    {isAmharic ? 'ምንም የወጪ መዛግብት አልተገኙም። "+ አዲስ ወጪ መዝግብ" የሚለውን ይጫኑ!' : 'No overhead expenses found. Click "+ Record Expense" to start!'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ADD / EDIT EXPENSE MODAL */}
            {addModalOpen && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(3, 7, 18, 0.75)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 200,
                    padding: '1rem'
                }}>
                    <div style={{
                        background: 'var(--admin-card-bg, white)',
                        color: 'var(--admin-text, #1a1b1e)',
                        border: '1px solid var(--admin-border, #eee)',
                        padding: '2rem',
                        borderRadius: '20px',
                        maxWidth: '520px',
                        width: '100%',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                            <h2 style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--admin-text, #1a1b1e)', margin: 0 }}>
                                {editingExpense
                                    ? (isAmharic ? 'የወጪ መዝገብ አስተካክል' : 'Edit Expense Record')
                                    : (isAmharic ? '+ አዲስ የሱቅ ወጪ መዝግብ' : '+ Record New Store Overhead')}
                            </h2>
                            <button
                                onClick={() => setAddModalOpen(false)}
                                style={{ background: 'none', border: 'none', color: 'var(--admin-subtext, #868e96)', cursor: 'pointer' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveExpense} style={{ display: 'grid', gap: '1rem' }}>
                            {/* Amount & Quick Ethiopian Date Preview */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--admin-subtext, #495057)' }}>
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
                                    style={{
                                        width: '100%',
                                        padding: '0.8rem',
                                        borderRadius: '12px',
                                        border: '1px solid var(--admin-border, #ced4da)',
                                        background: 'var(--admin-input-bg, white)',
                                        color: 'var(--admin-text, #1a1b1e)',
                                        fontSize: '1.1rem',
                                        fontWeight: '700'
                                    }}
                                />
                            </div>

                            {/* Reason */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--admin-subtext, #495057)' }}>
                                    {isAmharic ? 'የወጪው ምክንያት / ለምን ወጣ? *' : 'Reason / What was this expense for? *'}
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder={isAmharic ? 'ለምሳሌ፡ የሱቅ ኪራይ ወይም 200 ፌስታል ማሸጊያ' : 'e.g. Shop Rent or 200 Delivery Bags'}
                                    value={expenseForm.reason}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, reason: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '10px',
                                        border: '1px solid var(--admin-border, #ced4da)',
                                        background: 'var(--admin-input-bg, white)',
                                        color: 'var(--admin-text, #1a1b1e)'
                                    }}
                                />
                            </div>

                            {/* Category & Payment Method */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--admin-subtext, #495057)' }}>
                                        {isAmharic ? 'የወጪ ምድብ *' : 'Category *'}
                                    </label>
                                    <select
                                        value={expenseForm.categoryName}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, categoryName: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--admin-border, #ced4da)', background: 'var(--admin-input-bg, white)', color: 'var(--admin-text, #1a1b1e)' }}
                                    >
                                        {categories.map(c => (
                                            <option key={c._id} value={c.name}>
                                                {isAmharic ? c.nameAmharic : c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--admin-subtext, #495057)' }}>
                                        {isAmharic ? 'የክፍያ ዘዴ *' : 'Payment Method *'}
                                    </label>
                                    <select
                                        value={expenseForm.paymentMethod}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--admin-border, #ced4da)', background: 'var(--admin-input-bg, white)', color: 'var(--admin-text, #1a1b1e)' }}
                                    >
                                        <option value="Cash">{isAmharic ? 'በእጅ ገንዘብ (Cash)' : 'Cash'}</option>
                                        <option value="Telebirr">Telebirr</option>
                                        <option value="CBEBirr">CBEBirr</option>
                                        <option value="Bank Transfer">{isAmharic ? 'የባንክ ማስተላለፍ' : 'Bank Transfer'}</option>
                                        <option value="Other">{isAmharic ? 'ሌላ' : 'Other'}</option>
                                    </select>
                                </div>
                            </div>

                            {/* Date Picker with Ethiopian Calendar Preview */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--admin-subtext, #495057)' }}>
                                    {isAmharic ? 'የወጣበት ቀን (Date)' : 'Expense Date'}
                                </label>
                                <input
                                    type="date"
                                    value={expenseForm.date}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--admin-border, #ced4da)', background: 'var(--admin-input-bg, white)', color: 'var(--admin-text, #1a1b1e)' }}
                                />
                                <div style={{ fontSize: '0.8rem', color: '#06b6d4', marginTop: '4px', fontWeight: '600' }}>
                                    🇪🇹 {isAmharic ? 'የኢትዮጵያ ቀን አቆጣጠር:' : 'Ethiopian Calendar:'} {toEthiopianDate(expenseForm.date, true)}
                                </div>
                            </div>

                            {/* Receipt Image URL / Attachment */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--admin-subtext, #495057)' }}>
                                    {isAmharic ? 'የደረሰኝ ፎቶ ማስፈንጠሪያ (Receipt URL / Cloud Image)' : 'Receipt Image URL'}
                                </label>
                                <input
                                    type="url"
                                    placeholder="https://.../receipt.jpg"
                                    value={expenseForm.receiptUrl}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, receiptUrl: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--admin-border, #ced4da)', background: 'var(--admin-input-bg, white)', color: 'var(--admin-text, #1a1b1e)' }}
                                />
                            </div>

                            {/* Capital Auto Sync Checkbox */}
                            <div style={{
                                background: 'var(--admin-inner-bg, #f8f9fa)',
                                padding: '1rem',
                                borderRadius: '12px',
                                border: '1px solid var(--admin-border, #dee2e6)'
                            }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', color: 'var(--admin-text, #1a1b1e)' }}>
                                    <input
                                        type="checkbox"
                                        checked={expenseForm.syncCapital}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, syncCapital: e.target.checked })}
                                    />
                                    {isAmharic ? 'ከካፒታል ግምጃ ቤት ጋር አስተሳስር (Sync Capital)' : 'Sync to Store Capital Treasury as Outflow'}
                                </label>
                                <div style={{ fontSize: '0.8rem', color: 'var(--admin-subtext, #868e96)', marginTop: '0.3rem' }}>
                                    {isAmharic
                                        ? '✨ በካፒታል መዝገብ ላይ እንደ ወጪ (OUTFLOW) በራስ-ሰር ይመዘገባል'
                                        : '✨ Automatically creates an OUTFLOW entry in Capital Treasury'}
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--admin-subtext, #495057)' }}>
                                    {isAmharic ? 'ተጨማሪ ማስታወሻ (አማራጭ)' : 'Additional Notes (Optional)'}
                                </label>
                                <input
                                    type="text"
                                    placeholder={isAmharic ? 'ማስታወሻ...' : 'Any details...'}
                                    value={expenseForm.notes}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--admin-border, #ced4da)', background: 'var(--admin-input-bg, white)', color: 'var(--admin-text, #1a1b1e)' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setAddModalOpen(false)}
                                    style={{ flex: 1, padding: '0.8rem', borderRadius: '10px', border: '1px solid var(--admin-border, #ced4da)', background: 'var(--admin-input-bg, white)', color: 'var(--admin-text, #1a1b1e)', fontWeight: '600', cursor: 'pointer' }}
                                >
                                    {isAmharic ? 'ይቅር' : 'Cancel'}
                                </button>
                                <button
                                    type="submit"
                                    style={{ flex: 1, padding: '0.8rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)', color: 'white', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 14px rgba(6, 182, 212, 0.35)' }}
                                >
                                    {editingExpense ? (isAmharic ? 'አስተካክል' : 'Update') : (isAmharic ? 'መዝግብ' : 'Save Expense')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* PARTNER CONNECTION MODAL */}
            {partnerModalOpen && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(3, 7, 18, 0.75)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 200,
                    padding: '1rem'
                }}>
                    <div style={{
                        background: 'var(--admin-card-bg, white)',
                        color: 'var(--admin-text, #1a1b1e)',
                        border: '1px solid var(--admin-border, #eee)',
                        padding: '2rem',
                        borderRadius: '20px',
                        maxWidth: '480px',
                        width: '100%',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0, color: 'var(--admin-text, #1a1b1e)' }}>
                                {isAmharic ? 'የንግድ አጋር ማገናኛ (Partner Connections)' : 'Shop Partner Connections'}
                            </h2>
                            <button onClick={() => setPartnerModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--admin-subtext, #868e96)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Current Shop Code */}
                        <div style={{
                            background: 'var(--admin-inner-bg, #f8f9fa)',
                            padding: '1.2rem',
                            borderRadius: '14px',
                            border: '1px solid var(--admin-border, #dee2e6)',
                            textAlign: 'center',
                            marginBottom: '1.5rem'
                        }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--admin-subtext, #868e96)', marginBottom: '0.4rem' }}>
                                {isAmharic ? 'ለአጋርዎ የሚሰጡት የሱቅ መለያ ኮድ (Your Shop Code)' : 'Share this code with your business partner'}
                            </div>
                            <div style={{ fontSize: '1.6rem', fontWeight: '800', letterSpacing: '2px', color: '#06b6d4' }}>
                                {activeGroup?.connectionId || 'CONN-4821'}
                            </div>
                            <button
                                onClick={() => copyCode(activeGroup?.connectionId)}
                                style={{
                                    marginTop: '0.6rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 14px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
                                    color: 'white',
                                    border: 'none',
                                    fontWeight: '700',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer'
                                }}
                            >
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                                <span>{copied ? (isAmharic ? 'ተቀድቷል!' : 'Copied!') : (isAmharic ? 'ኮዱን ቅዳ' : 'Copy Code')}</span>
                            </button>
                        </div>

                        {/* Join Another Partner Shop */}
                        <form onSubmit={handleJoinGroup}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--admin-subtext, #495057)' }}>
                                {isAmharic ? 'ከሌላ አጋር ሱቅ ጋር ተገናኝ (Connect to Partner)' : 'Connect to another Partner Shop'}
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. CONN-1234"
                                    value={joinConnectionId}
                                    onChange={(e) => setJoinConnectionId(e.target.value.toUpperCase())}
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        borderRadius: '10px',
                                        border: '1px solid var(--admin-border, #ced4da)',
                                        background: 'var(--admin-input-bg, white)',
                                        color: 'var(--admin-text, #1a1b1e)',
                                        fontWeight: '700'
                                    }}
                                />
                                <button
                                    type="submit"
                                    style={{
                                        padding: '0.75rem 1.2rem',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: '#10b981',
                                        color: 'white',
                                        fontWeight: '700',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {isAmharic ? 'ተገናኝ' : 'Join'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT BUDGET MODAL */}
            {budgetModalOpen && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(3, 7, 18, 0.75)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 200,
                    padding: '1rem'
                }}>
                    <div style={{
                        background: 'var(--admin-card-bg, white)',
                        color: 'var(--admin-text, #1a1b1e)',
                        border: '1px solid var(--admin-border, #eee)',
                        padding: '2rem',
                        borderRadius: '20px',
                        maxWidth: '420px',
                        width: '100%',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0, color: 'var(--admin-text, #1a1b1e)' }}>
                                {isAmharic ? 'የወር በጀት ገደብ ቀይር' : 'Edit Monthly Budget Limit'}
                            </h2>
                            <button onClick={() => setBudgetModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--admin-subtext, #868e96)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateBudget} style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--admin-subtext, #495057)' }}>
                                    {isAmharic ? 'ወርሃዊ ከፍተኛ የወጪ ገደብ (በብር)' : 'Monthly Maximum Overhead Limit (ETB)'}
                                </label>
                                <input
                                    type="number"
                                    min="1000"
                                    required
                                    value={budgetLimitInput}
                                    onChange={(e) => setBudgetLimitInput(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '10px',
                                        border: '1px solid var(--admin-border, #ced4da)',
                                        background: 'var(--admin-input-bg, white)',
                                        color: 'var(--admin-text, #1a1b1e)',
                                        fontSize: '1.1rem',
                                        fontWeight: '700'
                                    }}
                                />
                            </div>

                            <button
                                type="submit"
                                style={{
                                    padding: '0.8rem',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
                                    color: 'white',
                                    fontWeight: '700',
                                    cursor: 'pointer'
                                }}
                            >
                                {isAmharic ? 'በጀቱን አረጋግጥ' : 'Save Budget Limit'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* RECEIPT IMAGE PREVIEW MODAL */}
            {receiptPreviewUrl && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(3, 7, 18, 0.85)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 220,
                    padding: '1.5rem'
                }}>
                    <div style={{
                        position: 'relative',
                        maxWidth: '650px',
                        width: '100%',
                        background: 'var(--admin-card-bg, white)',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
                    }}>
                        <div style={{
                            padding: '1rem 1.4rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: '1px solid var(--admin-border, #eee)'
                        }}>
                            <span style={{ fontWeight: '700', color: 'var(--admin-text, #1a1b1e)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <ImageIcon size={18} color="#06b6d4" />
                                {isAmharic ? 'የደረሰኝ ፎቶ (Receipt Voucher)' : 'Receipt Voucher Preview'}
                            </span>
                            <button
                                onClick={() => setReceiptPreviewUrl(null)}
                                style={{ background: 'none', border: 'none', color: 'var(--admin-subtext, #868e96)', cursor: 'pointer' }}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div style={{ padding: '1.5rem', textAlign: 'center', background: '#090e17' }}>
                            <img
                                src={receiptPreviewUrl}
                                alt="Expense Receipt"
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '60vh',
                                    borderRadius: '12px',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
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
