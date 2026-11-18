import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Users,
    DollarSign,
    Warehouse,
    AlertTriangle,
    ArrowRight,
    Wallet,
    UserPlus,
    UserMinus,
    Sparkles,
    Flame,
    Moon,
    CheckCircle2,
    FileBarChart2,
    Mic,
    Plus,
    Receipt,
    Send,
} from 'lucide-react';
import { adminService, storeService } from '../../services/api';
import { useAdminLanguage } from '../../context/AdminLanguageContext';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const { isAmharic } = useAdminLanguage();
    const [stats, setStats] = useState({
        totalRevenue: 0,
        ordersCount: 0,
        usersCount: 0,
        productsCount: 0,
        netCapital: 0,
        totalReceivables: 0,
        totalPayables: 0,
        totalStockUnits: 0,
        totalInventoryCost: 0,
        lowStockCount: 0,
    });
    const [stockInsights, setStockInsights] = useState(null);

    useEffect(() => {
        Promise.all([
            adminService.getStats().then((r) => setStats(r.data)).catch(() => {}),
            storeService.getInsights().then((r) => setStockInsights(r.data)).catch(() => {}),
        ]);
    }, []);

    const statCards = [
        {
            title: isAmharic ? 'በእጅ ያለ የሱቅ ካሽ' : 'Shop Cash Now',
            value: `ETB ${(stats.netCapital || 0).toLocaleString()}`,
            sub: isAmharic ? 'የተጣራ ገንዘብ' : 'Available cash in shop',
            icon: Wallet,
            color: '#10b981',
            to: '/admin/finance?tab=cash',
        },
        {
            title: isAmharic ? 'ጠቅላላ ሽያጭ' : 'Total Sales',
            value: `ETB ${(stats.totalRevenue || 0).toLocaleString()}`,
            sub: isAmharic ? `${stats.ordersCount || 0} ትዕዛዞች` : `${stats.ordersCount || 0} customer orders`,
            icon: DollarSign,
            color: '#06b6d4',
            to: '/admin/sales?tab=orders',
        },
        {
            title: isAmharic ? 'በሱቅ ውስጥ ያለ እቃ' : 'Stock In Shop',
            value: `ETB ${(stats.totalInventoryCost || 0).toLocaleString()}`,
            sub: isAmharic
                ? `${(stats.totalStockUnits || 0).toLocaleString()} ፍሬ • ${stats.productsCount || 0} ምርቶች`
                : `${(stats.totalStockUnits || 0).toLocaleString()} items • ${stats.productsCount || 0} products`,
            icon: Warehouse,
            color: '#f59e0b',
            to: '/admin/catalog?tab=stock',
        },
        {
            title: isAmharic ? 'ደንበኞች የሚከፍሉኝ' : 'Customers Owe Me',
            value: `ETB ${(stats.totalReceivables || 0).toLocaleString()}`,
            sub: isAmharic ? 'የደንበኛ ብድር' : 'Unpaid customer credit',
            icon: UserPlus,
            color: '#3b82f6',
            to: '/admin/finance?tab=debts',
        },
        {
            title: isAmharic ? 'ለአቅራቢ የምከፍለው' : 'I Owe Suppliers',
            value: `ETB ${(stats.totalPayables || 0).toLocaleString()}`,
            sub: isAmharic ? 'የአቅራቢ እዳ' : 'Remaining supplier bills',
            icon: UserMinus,
            color: '#f43f5e',
            to: '/admin/finance?tab=debts',
        },
        {
            title: isAmharic ? 'ደንበኞች' : 'Customers',
            value: (stats.usersCount || 0).toLocaleString(),
            sub: isAmharic ? 'የተመዘገቡ ደንበኞች እና SMS' : 'View profiles & send SMS',
            icon: Users,
            color: '#8b5cf6',
            to: '/admin/customers?tab=sms',
        },
    ];

    return (
        <div className="dash-page">
            {/* Clean Header */}
            <header className="dash-header">
                <div>
                    <h1 className="dash-title">
                        {isAmharic ? 'የሱቄ ጠቅላላ እይታ' : 'My Shop Overview'}
                    </h1>
                    <p className="dash-subtitle">
                        {isAmharic
                            ? 'ገንዘብዎን፣ እቃዎን እና ትዕዛዞችዎን በአንድ ገጽ ይቆጣጠሩ።'
                            : 'Everything in your shop at a glance — tap any card to open.'}
                    </p>
                </div>

                <div className="dash-header-actions">
                    <Link to="/admin/ai-assistant" className="dash-cta-primary">
                        <Mic size={17} />
                        <span>{isAmharic ? 'በድምፅ መዝግብ' : 'Voice Record'}</span>
                    </Link>
                    <Link to="/admin/finance?tab=report" className="dash-cta-secondary">
                        <FileBarChart2 size={17} />
                        <span>{isAmharic ? 'የገንዘብ ሪፖርት' : 'Money Report'}</span>
                    </Link>
                </div>
            </header>

            {/* 1-Tap Everyday Shortcuts */}
            <div className="dash-quick-bar">
                <Link to="/admin/catalog?tab=stock" className="dash-quick-chip">
                    <div className="dash-quick-icon cyan">
                        <Plus size={17} />
                    </div>
                    <span>{isAmharic ? 'ክምችት ጨምር' : 'Add Stock'}</span>
                </Link>

                <Link to="/admin/finance?tab=expenses" className="dash-quick-chip">
                    <div className="dash-quick-icon amber">
                        <Receipt size={17} />
                    </div>
                    <span>{isAmharic ? 'ወጪ መዝግብ' : 'Record Expense'}</span>
                </Link>

                <Link to="/admin/products/new" className="dash-quick-chip">
                    <div className="dash-quick-icon emerald">
                        <Plus size={17} />
                    </div>
                    <span>{isAmharic ? 'አዲስ ምርት ጨምር' : 'New Product'}</span>
                </Link>

                <Link to="/admin/customers?tab=sms" className="dash-quick-chip">
                    <div className="dash-quick-icon violet">
                        <Send size={16} />
                    </div>
                    <span>{isAmharic ? 'SMS ላክ' : 'Send SMS Promo'}</span>
                </Link>
            </div>

            {/* Single Unified Shop Advice Strip */}
            {stockInsights && (
                <section className="dash-advice">
                    <div className="dash-advice-top">
                        <h2 className="dash-advice-title">
                            <Sparkles size={18} color="#67e8f9" />
                            <span>
                                {isAmharic ? 'ዛሬ ምን ማድረግ አለብዎት?' : 'What To Do Today'}
                            </span>
                        </h2>
                        <Link to="/admin/catalog?tab=stock&view=advisor" className="dash-advice-link">
                            <span>{isAmharic ? 'ሙሉ ምክር ክፈት' : 'Open Stock Advice'}</span>
                            <ArrowRight size={14} />
                        </Link>
                    </div>

                    <div className="dash-advice-pills">
                        <span className="dash-advice-pill urgent">
                            <AlertTriangle size={13} />
                            {isAmharic
                                ? `በቅርቡ ይግዙ: ${stockInsights.summary?.buySoonCount || 0}`
                                : `Buy Soon: ${stockInsights.summary?.buySoonCount || 0}`}
                        </span>
                        <span className="dash-advice-pill hot">
                            <Flame size={13} />
                            {isAmharic
                                ? `በፍጥነት የሚሸጡ: ${stockInsights.summary?.hotSellersCount || 0}`
                                : `Selling Fast: ${stockInsights.summary?.hotSellersCount || 0}`}
                        </span>
                        <span className="dash-advice-pill idle">
                            <Moon size={13} />
                            {isAmharic
                                ? `ሳይሸጡ የቆሙ: ${stockInsights.summary?.notSellingCount || 0}`
                                : `Not Selling: ${stockInsights.summary?.notSellingCount || 0}`}
                        </span>
                        <span className="dash-advice-pill good">
                            <CheckCircle2 size={13} />
                            {isAmharic
                                ? `ጥሩ ክምችት: ${stockInsights.summary?.goodStockCount || 0}`
                                : `Good Stock: ${stockInsights.summary?.goodStockCount || 0}`}
                        </span>
                    </div>

                    <div className="dash-advice-list">
                        {(stockInsights.todayActions || []).slice(0, 2).map((act, idx) => (
                            <div key={idx} className="dash-advice-item">
                                <span
                                    style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        flexShrink: 0,
                                        background:
                                            act.priority === 'urgent'
                                                ? '#fb7185'
                                                : act.priority === 'warning'
                                                    ? '#fbbf24'
                                                    : act.priority === 'good'
                                                        ? '#34d399'
                                                        : '#818cf8',
                                    }}
                                />
                                <span>{isAmharic ? act.textAm : act.textEn}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* 6 Clean Clickable Numbers (Zero Duplicate Cards!) */}
            <div className="dash-stats-grid">
                {statCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Link key={card.title} to={card.to} className="dash-stat-card">
                            <div className="dash-stat-top">
                                <span className="dash-stat-label">{card.title}</span>
                                <div
                                    className="dash-stat-icon"
                                    style={{ background: `${card.color}18`, color: card.color }}
                                >
                                    <Icon size={19} />
                                </div>
                            </div>
                            <div className="dash-stat-value">{card.value}</div>
                            <div className="dash-stat-foot">
                                <span style={{ color: card.color }}>{card.sub}</span>
                                <ArrowRight size={14} color="var(--admin-subtext, #94a3b8)" />
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default AdminDashboard;
