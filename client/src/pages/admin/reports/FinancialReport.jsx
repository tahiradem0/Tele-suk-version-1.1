import React, { useState, useEffect } from 'react';
import {
    FileBarChart2,
    Printer,
    RefreshCw,
    CheckCircle2,
    ArrowDownLeft,
    ArrowUpRight,
    Wallet,
    Package,
    Users,
    Receipt,
    ShoppingBag,
    Calendar,
    Sparkles,
    Phone,
    Building2,
} from 'lucide-react';
import { adminService, forceRefreshCache } from '../../../services/api';
import { useAdminLanguage } from '../../../context/AdminLanguageContext';
import { toEthiopianDate } from '../../../utils/ethiopianDate';
import './FinancialReport.css';

const PERIODS = [
    { key: 'today', en: 'Today', am: 'ዛሬ' },
    { key: 'week', en: 'This Week', am: 'በዚህ ሳምንት' },
    { key: 'month', en: 'This Month', am: 'በዚህ ወር' },
    { key: 'all', en: 'All Time', am: 'ሁሉም ጊዜ' },
];

const FinancialReport = () => {
    const { isAmharic } = useAdminLanguage();
    const [period, setPeriod] = useState('month');
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [justRefreshed, setJustRefreshed] = useState(false);

    useEffect(() => {
        loadReport(period);
    }, [period]);

    const loadReport = async (selectedPeriod = period) => {
        setLoading(true);
        try {
            const { data } = await adminService.getFinancialReport(selectedPeriod);
            setReport(data);
        } catch (error) {
            console.error('Failed to load financial report:', error);
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
            await loadReport(period);
            setJustRefreshed(true);
            setTimeout(() => setJustRefreshed(false), 2000);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const todayEth = toEthiopianDate(new Date(), true);
    const activePeriodObj = PERIODS.find((p) => p.key === period) || PERIODS[2];

    const moneyFlow = report?.moneyFlow || {
        salesRevenue: 0,
        totalOrdersCount: 0,
        paidOrdersCount: 0,
        shopExpensesTotal: 0,
        stockPurchasesTotal: 0,
        totalMoneyOut: 0,
        simpleProfit: 0,
    };

    const snapshot = report?.shopSnapshot || {
        cashInHand: 0,
        totalStockUnits: 0,
        stockCostValue: 0,
        stockRetailValue: 0,
        moneyCustomersOweYou: 0,
        moneyYouOweSuppliers: 0,
        totalShopWorth: 0,
    };

    const topExpenses = report?.topExpenseCategories || [];
    const maxExpense = topExpenses.length > 0 ? topExpenses[0].amount : 1;

    const topProducts = report?.topProducts || [];
    const maxProductRev = topProducts.length > 0 ? topProducts[0].moneyEarned : 1;

    const unpaidCustomers = report?.unpaidCustomers || [];
    const unpaidSuppliers = report?.unpaidSuppliers || [];
    const plainAdvice = report?.plainAdvice || [];

    return (
        <div className="report-page">
            {/* Printable Clean Paper Header (only visible when Printing / Saving PDF) */}
            <div className="print-only-header">
                <h1 style={{ margin: 0, fontSize: '1.6rem' }}>
                    {report?.storeName || 'Gondar ሱቅ'} — {isAmharic ? 'ቀላል የገንዘብ ሪፖርት' : 'Simple Money Report'}
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: '#475569' }}>
                    {isAmharic ? 'ጊዜ:' : 'Period:'} <strong>{isAmharic ? activePeriodObj.am : activePeriodObj.en}</strong>
                    {'  •  '}
                    {new Date().toLocaleDateString()} ({todayEth})
                </p>
            </div>

            {/* 1. HERO HEADER */}
            <div className="report-hero no-print">
                <div className="report-hero-left">
                    <div className="report-hero-icon">
                        <FileBarChart2 size={26} />
                    </div>
                    <div>
                        <h1 className="report-hero-title">
                            {isAmharic ? 'ቀላል የገንዘብ ሪፖርት' : 'Simple Money Report'}
                        </h1>
                        <div className="report-hero-sub">
                            <span>
                                {isAmharic
                                    ? 'የገባ ገንዘብ፣ የወጣ ወጪ፣ የተረፈ ትርፍ እና የብድር ሂሳብ በአንድ ገጽ'
                                    : 'Money in, money out, profit left, and shop debts in plain language'}
                            </span>
                            <span className="report-date-pill">
                                <Calendar size={12} />
                                {todayEth}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="report-hero-actions">
                    <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className={`admin-refresh-btn ${justRefreshed ? 'refreshed-success' : ''}`}
                    >
                        {justRefreshed ? (
                            <>
                                <CheckCircle2 size={16} color="#10b981" />
                                <span>{isAmharic ? 'ተዘምኗል!' : 'Updated!'}</span>
                            </>
                        ) : (
                            <>
                                <RefreshCw size={16} className={isRefreshing ? 'spinning-refresh-icon' : ''} />
                                <span>{isRefreshing ? (isAmharic ? 'በማደስ ላይ...' : 'Refreshing...') : isAmharic ? 'አድስ' : 'Refresh'}</span>
                            </>
                        )}
                    </button>

                    <button type="button" onClick={handlePrint} className="report-print-btn">
                        <Printer size={17} />
                        <span>{isAmharic ? 'አትም / PDF አውርድ' : 'Print / Save PDF'}</span>
                    </button>
                </div>
            </div>

            {/* PERIOD SWITCHER */}
            <div className="report-period-bar no-print">
                <div className="report-period-pills">
                    {PERIODS.map((p) => (
                        <button
                            key={p.key}
                            type="button"
                            onClick={() => setPeriod(p.key)}
                            className={`report-period-pill ${period === p.key ? 'active' : ''}`}
                        >
                            {isAmharic ? p.am : p.en}
                        </button>
                    ))}
                </div>

                {loading && (
                    <span style={{ fontSize: '0.85rem', color: 'var(--admin-subtext, #64748b)', fontWeight: 600 }}>
                        {isAmharic ? 'ሪፖርት በመስራት ላይ...' : 'Preparing your report...'}
                    </span>
                )}
            </div>

            {/* 2. THE 3 BIG SIMPLE NUMBERS (MONEY IN / MONEY OUT / PROFIT LEFT) */}
            <div className="report-big3-grid">
                <div className="report-big-card money-in">
                    <div className="report-big-top">
                        <span className="report-big-label">
                            {isAmharic ? 'ከሽያጭ የገባ ገንዘብ' : 'Money Came In (Sales)'}
                        </span>
                        <div className="report-big-icon in">
                            <ArrowDownLeft size={22} />
                        </div>
                    </div>
                    <div className="report-big-amount green">
                        ETB {moneyFlow.salesRevenue.toLocaleString()}
                    </div>
                    <div className="report-big-sub">
                        {isAmharic
                            ? `ከ ${moneyFlow.totalOrdersCount} ትዕዛዞች (${moneyFlow.paidOrdersCount} የተከፈሉ)`
                            : `From ${moneyFlow.totalOrdersCount} orders (${moneyFlow.paidOrdersCount} paid)`}
                    </div>
                </div>

                <div className="report-big-card money-out">
                    <div className="report-big-top">
                        <span className="report-big-label">
                            {isAmharic ? 'ለወጪ የወጣ ገንዘብ' : 'Money Went Out (Expenses)'}
                        </span>
                        <div className="report-big-icon out">
                            <ArrowUpRight size={22} />
                        </div>
                    </div>
                    <div className="report-big-amount red">
                        ETB {moneyFlow.shopExpensesTotal.toLocaleString()}
                    </div>
                    <div className="report-big-sub">
                        {moneyFlow.stockPurchasesTotal > 0
                            ? isAmharic
                                ? `ተጨማሪ ለእቃ ግዢ: ETB ${moneyFlow.stockPurchasesTotal.toLocaleString()}`
                                : `Plus ETB ${moneyFlow.stockPurchasesTotal.toLocaleString()} spent buying stock`
                            : isAmharic
                                ? 'የሱቅ የዕለት ወጪዎች ድምር'
                                : 'Total shop overhead expenses'}
                    </div>
                </div>

                <div className={`report-big-card ${moneyFlow.simpleProfit >= 0 ? 'profit-pos' : 'profit-neg'}`}>
                    <div className="report-big-top">
                        <span className="report-big-label">
                            {moneyFlow.simpleProfit >= 0
                                ? isAmharic ? 'የተረፈልዎት ትርፍ' : 'Profit Left For You'
                                : isAmharic ? 'ወጪ ከሽያጭ በልጧል' : 'Expenses Above Sales'}
                        </span>
                        <div className={`report-big-icon ${moneyFlow.simpleProfit >= 0 ? 'profit' : 'loss'}`}>
                            <Wallet size={22} />
                        </div>
                    </div>
                    <div className={`report-big-amount ${moneyFlow.simpleProfit >= 0 ? 'cyan' : 'red'}`}>
                        {moneyFlow.simpleProfit >= 0 ? '+' : '-'}ETB {Math.abs(moneyFlow.simpleProfit).toLocaleString()}
                    </div>
                    <div className="report-big-sub">
                        {isAmharic
                            ? 'ሽያጭ ሲቀነስ የሱቅ ወጪ'
                            : 'Sales minus shop expenses'}
                    </div>
                </div>
            </div>

            {/* 3. IN SIMPLE WORDS (PLAIN MERCHANT STORY) */}
            {plainAdvice.length > 0 && (
                <div className="report-story-card">
                    <h2 className="report-section-heading">
                        <Sparkles size={20} color="#06b6d4" />
                        <span>{isAmharic ? 'የገንዘብዎ ሁኔታ በቀላል ቋንቋ' : 'Your Shop Money — In Simple Words'}</span>
                    </h2>
                    <div className="report-story-list">
                        {plainAdvice.map((item, index) => (
                            <div key={index} className="report-story-item">
                                <span className={`report-story-dot ${item.tone || 'info'}`} />
                                <span>{isAmharic ? item.am : item.en}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 4. YOUR SHOP RIGHT NOW (4 SIMPLE SNAPSHOT TILES) */}
            <div className="report-snapshot-grid">
                <div className="report-snap-tile">
                    <div className="report-snap-label">
                        <span>{isAmharic ? 'በእጅ ያለ ጥሬ ገንዘብ' : 'Cash Ready In Shop'}</span>
                        <Wallet size={17} color="#10b981" />
                    </div>
                    <div className="report-snap-val">ETB {snapshot.cashInHand.toLocaleString()}</div>
                    <div className="report-snap-sub">
                        {isAmharic ? 'የካፒታል ግምጃ ቤት ቀሪ' : 'Available treasury balance'}
                    </div>
                </div>

                <div className="report-snap-tile">
                    <div className="report-snap-label">
                        <span>{isAmharic ? 'መደብር ውስጥ ያሉ እቃዎች' : 'Goods In Your Shop'}</span>
                        <Package size={17} color="#f59e0b" />
                    </div>
                    <div className="report-snap-val">ETB {snapshot.stockRetailValue.toLocaleString()}</div>
                    <div className="report-snap-sub">
                        {isAmharic
                            ? `${snapshot.totalStockUnits.toLocaleString()} ፍሬ (መግዣ ዋጋ: ETB ${snapshot.stockCostValue.toLocaleString()})`
                            : `${snapshot.totalStockUnits.toLocaleString()} items (cost: ETB ${snapshot.stockCostValue.toLocaleString()})`}
                    </div>
                </div>

                <div className="report-snap-tile">
                    <div className="report-snap-label">
                        <span>{isAmharic ? 'ደንበኞች የሚከፍሉዎት' : 'Customers Owe You'}</span>
                        <Users size={17} color="#0284c7" />
                    </div>
                    <div className="report-snap-val" style={{ color: '#0284c7' }}>
                        ETB {snapshot.moneyCustomersOweYou.toLocaleString()}
                    </div>
                    <div className="report-snap-sub">
                        {isAmharic ? 'መሰብሰብ ያለበት የብድር ገንዘብ' : 'Money waiting to be collected'}
                    </div>
                </div>

                <div className="report-snap-tile">
                    <div className="report-snap-label">
                        <span>{isAmharic ? 'ለአቅራቢዎች የሚከፍሉት' : 'You Owe Suppliers'}</span>
                        <Building2 size={17} color="#f43f5e" />
                    </div>
                    <div className="report-snap-val" style={{ color: snapshot.moneyYouOweSuppliers > 0 ? '#f43f5e' : 'var(--admin-text, #0f172a)' }}>
                        ETB {snapshot.moneyYouOweSuppliers.toLocaleString()}
                    </div>
                    <div className="report-snap-sub">
                        {isAmharic ? 'ለአቅራቢዎች መከፈል ያለበት' : 'Bills to pay suppliers'}
                    </div>
                </div>
            </div>

            {/* 5. WHERE YOUR MONEY WENT + WHAT EARNED YOU MONEY */}
            <div className="report-two-col">
                <div className="report-panel">
                    <h3 className="report-section-heading">
                        <Receipt size={19} color="#f43f5e" />
                        <span>{isAmharic ? 'ገንዘብዎ የት ሄደ? (ዋና ወጪዎች)' : 'Where Your Money Went'}</span>
                    </h3>
                    {topExpenses.length === 0 ? (
                        <div className="report-empty-note">
                            {isAmharic ? 'በዚህ ጊዜ የተመዘገበ ወጪ የለም።' : 'No expenses recorded in this period.'}
                        </div>
                    ) : (
                        topExpenses.map((e) => (
                            <div key={e.category} className="report-bar-row">
                                <div className="report-bar-head">
                                    <span>{e.category}</span>
                                    <span style={{ color: '#f43f5e' }}>ETB {e.amount.toLocaleString()}</span>
                                </div>
                                <div className="report-bar-track">
                                    <div
                                        className="report-bar-fill"
                                        style={{ width: `${Math.max(6, (e.amount / maxExpense) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="report-panel">
                    <h3 className="report-section-heading">
                        <ShoppingBag size={19} color="#10b981" />
                        <span>{isAmharic ? 'ብዙ ገንዘብ ያስገኙ እቃዎች' : 'Products Bringing The Most Money'}</span>
                    </h3>
                    {topProducts.length === 0 ? (
                        <div className="report-empty-note">
                            {isAmharic ? 'በዚህ ጊዜ የተሸጠ እቃ የለም።' : 'No product sales recorded in this period yet.'}
                        </div>
                    ) : (
                        topProducts.map((p) => (
                            <div key={p.name} className="report-bar-row">
                                <div className="report-bar-head">
                                    <span>
                                        {p.name}{' '}
                                        <span style={{ fontWeight: 500, color: 'var(--admin-subtext, #64748b)', fontSize: '0.8rem' }}>
                                            ({p.unitsSold} {isAmharic ? 'ፍሬ' : 'sold'})
                                        </span>
                                    </span>
                                    <span style={{ color: '#10b981' }}>ETB {p.moneyEarned.toLocaleString()}</span>
                                </div>
                                <div className="report-bar-track">
                                    <div
                                        className="report-bar-fill sales"
                                        style={{ width: `${Math.max(6, (p.moneyEarned / maxProductRev) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* 6. WHO OWES YOU & WHO YOU OWE (QUICK CONTACT LIST) */}
            {(unpaidCustomers.length > 0 || unpaidSuppliers.length > 0) && (
                <div className="report-two-col">
                    <div className="report-panel">
                        <h3 className="report-section-heading">
                            <Users size={19} color="#0284c7" />
                            <span>{isAmharic ? 'ገንዘብ መሰብሰብ ያለብዎት ሰዎች' : 'People To Collect Money From'}</span>
                        </h3>
                        {unpaidCustomers.length === 0 ? (
                            <div className="report-empty-note">
                                {isAmharic ? 'ማንም ደንበኛ ብድር የለበትም።' : 'No customers owe you money right now.'}
                            </div>
                        ) : (
                            unpaidCustomers.map((c) => (
                                <div key={c._id} className="report-person-row">
                                    <div>
                                        <div style={{ fontWeight: 700, color: 'var(--admin-text, #0f172a)' }}>{c.personName}</div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--admin-subtext, #64748b)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                            <Phone size={12} />
                                            <span>{c.phone}</span>
                                        </div>
                                    </div>
                                    <strong style={{ color: '#0284c7', fontSize: '0.98rem' }}>
                                        ETB {c.balance.toLocaleString()}
                                    </strong>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="report-panel">
                        <h3 className="report-section-heading">
                            <Building2 size={19} color="#f43f5e" />
                            <span>{isAmharic ? 'መክፈል ያለብዎት አቅራቢዎች' : 'Suppliers You Need To Pay'}</span>
                        </h3>
                        {unpaidSuppliers.length === 0 ? (
                            <div className="report-empty-note">
                                {isAmharic ? 'ለአቅራቢዎች የሚከፈል እዳ የለም።' : 'You have zero unpaid supplier bills!'}
                            </div>
                        ) : (
                            unpaidSuppliers.map((s) => (
                                <div key={s._id} className="report-person-row">
                                    <div>
                                        <div style={{ fontWeight: 700, color: 'var(--admin-text, #0f172a)' }}>{s.personName}</div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--admin-subtext, #64748b)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                            <Phone size={12} />
                                            <span>{s.phone}</span>
                                        </div>
                                    </div>
                                    <strong style={{ color: '#f43f5e', fontSize: '0.98rem' }}>
                                        ETB {s.balance.toLocaleString()}
                                    </strong>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinancialReport;
