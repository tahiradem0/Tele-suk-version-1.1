import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Users,
    Star,
    Moon,
    CreditCard,
    Send,
    Sparkles,
    Phone,
    MessageSquare,
    Search,
    RefreshCw,
    CheckCircle2,
    Settings,
    Loader2,
    AlertCircle,
    Clock,
} from 'lucide-react';
import { crmService } from '../../../services/api';
import { useAdminLanguage } from '../../../context/AdminLanguageContext';
import './CustomerMarketing.css';

const CustomerMarketing = () => {
    const { isAmharic } = useAdminLanguage();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [justRefreshed, setJustRefreshed] = useState(false);

    const [activeTab, setActiveTab] = useState('customers'); // 'customers' | 'sms'
    const [selectedGroup, setSelectedGroup] = useState('all'); // 'all' | 'vip' | 'inactive' | 'debtors'
    const [searchTerm, setSearchTerm] = useState('');

    // SMS Composer State
    const [smsTitle, setSmsTitle] = useState('');
    const [smsAudience, setSmsAudience] = useState('all'); // 'all' | 'vip' | 'inactive' | 'debtors' | 'single'
    const [singlePhone, setSinglePhone] = useState('');
    const [singleName, setSingleName] = useState('');
    const [smsMessage, setSmsMessage] = useState('');
    const [isWritingAi, setIsWritingAi] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [sendFeedback, setSendFeedback] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        loadCrm();
    }, []);

    const loadCrm = async () => {
        setLoading(true);
        try {
            const res = await crmService.getOverview();
            setData(res.data);
        } catch (err) {
            console.error('Failed to load CRM data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        setJustRefreshed(false);
        try {
            await loadCrm();
            setJustRefreshed(true);
            setTimeout(() => setJustRefreshed(false), 2000);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleQuickSmsCustomer = (customer) => {
        setSmsAudience('single');
        setSinglePhone(customer.phone || '');
        setSingleName(customer.name || '');
        setSmsTitle(
            customer.unpaidDebt > 0
                ? isAmharic ? `የብድር ማስታወሻ - ${customer.name}` : `Balance Reminder - ${customer.name}`
                : isAmharic ? `መልእክት ለ${customer.name}` : `Message for ${customer.name}`
        );
        if (customer.unpaidDebt > 0) {
            setSmsMessage(
                isAmharic
                    ? `ሰላም ${customer.name}፣ በ${data?.storeName || 'ሱቃችን'} ያለብዎትን ETB ${customer.unpaidDebt.toLocaleString()} ቀሪ ሂሳብ ሲመችዎት እንዲከፍሉ በአክብሮት እናስታውሳለን።`
                    : `Hello ${customer.name}, a friendly reminder from ${data?.storeName || 'our shop'} about your remaining balance of ETB ${customer.unpaidDebt.toLocaleString()}. Thank you!`
            );
        }
        setSendFeedback(null);
        setErrorMsg('');
        setActiveTab('sms');
    };

    const handleAiWriteSms = async (goal, lang) => {
        setIsWritingAi(true);
        setErrorMsg('');
        try {
            const res = await crmService.aiWriteSms({
                goal,
                language: lang,
                topic: smsTitle,
            });
            if (res.data?.message) {
                setSmsMessage(res.data.message);
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Could not generate SMS text.');
        } finally {
            setIsWritingAi(false);
        }
    };

    const handleSendCampaign = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSendFeedback(null);
        setIsSending(true);
        try {
            const res = await crmService.sendSms({
                title: smsTitle || (isAmharic ? 'የሱቅ ማስታወቂያ' : 'Shop Promo'),
                message: smsMessage,
                audience: smsAudience,
                singlePhone,
                singleName,
            });
            setSendFeedback(res.data);
            setSmsMessage('');
            setSmsTitle('');
            await loadCrm();
        } catch (err) {
            setErrorMsg(err.response?.data?.message || err.message || 'Failed to send SMS campaign.');
        } finally {
            setIsSending(false);
        }
    };

    const summary = data?.summary || { totalCustomers: 0, vipCount: 0, inactiveCount: 0, debtorCount: 0 };
    const customers = data?.customers || [];
    const campaigns = data?.campaigns || [];
    const smsStatus = data?.smsStatus || { provider: 'simulation', configured: false };

    const filteredCustomers = customers.filter((c) => {
        const matchesGroup = selectedGroup === 'all' || (c.tags || []).includes(selectedGroup);
        const q = searchTerm.trim().toLowerCase();
        const matchesSearch =
            !q ||
            (c.name || '').toLowerCase().includes(q) ||
            (c.phone || '').toLowerCase().includes(q) ||
            (c.favoriteItem || '').toLowerCase().includes(q);
        return matchesGroup && matchesSearch;
    });

    const getAudienceCount = (aud) => {
        if (aud === 'single') return singlePhone.trim().length >= 9 ? 1 : 0;
        if (aud === 'all') return customers.filter((c) => c.phone && c.phone.length >= 9).length;
        return customers.filter((c) => (c.tags || []).includes(aud) && c.phone && c.phone.length >= 9).length;
    };

    return (
        <div className="crm-page">
            {/* 1. HERO BANNER */}
            <div className="crm-hero">
                <div className="crm-hero-left">
                    <div className="crm-hero-icon">
                        <Users size={26} />
                    </div>
                    <div>
                        <h1 className="crm-hero-title">
                            {isAmharic ? 'ደንበኞች እና የSMS ማስታወቂያ' : 'Customers & SMS Promos'}
                        </h1>
                        <p className="crm-hero-sub">
                            {isAmharic
                                ? 'ምርጥ ደንበኞችዎን ይወቁ፣ የብድር ማስታወሻ ይላኩ እና በአንድ ጊዜ የSMS ቅናሽ ያስተዋውቁ'
                                : 'Know your best buyers, remind people who owe you, and send bulk SMS promos in 1 tap'}
                        </p>
                    </div>
                </div>

                <div className="crm-hero-actions">
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

                    <button
                        type="button"
                        onClick={() => {
                            setSmsAudience(selectedGroup);
                            setActiveTab('sms');
                        }}
                        className="mezgeb-primary-btn"
                    >
                        <Send size={16} />
                        <span>{isAmharic ? 'አዲስ SMS ላክ' : 'Send SMS Promo'}</span>
                    </button>
                </div>
            </div>

            {/* 2. 4 SIMPLE CLICKABLE CUSTOMER GROUP TILES */}
            <div className="crm-groups-grid">
                <button
                    type="button"
                    onClick={() => { setSelectedGroup('all'); setActiveTab('customers'); }}
                    className={`crm-group-tile ${selectedGroup === 'all' ? 'active' : ''}`}
                >
                    <div className="crm-tile-icon cyan"><Users size={22} /></div>
                    <div>
                        <div className="crm-tile-num">{summary.totalCustomers}</div>
                        <div className="crm-tile-label">{isAmharic ? 'ሁሉም ደንበኞች' : 'All Customers'}</div>
                        <div className="crm-tile-hint">{isAmharic ? 'የተመዘገቡና የብድር ደንበኞች' : 'Registered & credit buyers'}</div>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => { setSelectedGroup('vip'); setActiveTab('customers'); }}
                    className={`crm-group-tile ${selectedGroup === 'vip' ? 'active' : ''}`}
                >
                    <div className="crm-tile-icon amber"><Star size={22} /></div>
                    <div>
                        <div className="crm-tile-num">{summary.vipCount}</div>
                        <div className="crm-tile-label">{isAmharic ? 'ምርጥ ደንበኞች (VIP)' : 'Best Customers'}</div>
                        <div className="crm-tile-hint">{isAmharic ? 'በተደጋጋሚ የሚገዙ' : 'Buy most often'}</div>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => { setSelectedGroup('inactive'); setActiveTab('customers'); }}
                    className={`crm-group-tile ${selectedGroup === 'inactive' ? 'active' : ''}`}
                >
                    <div className="crm-tile-icon indigo"><Moon size={22} /></div>
                    <div>
                        <div className="crm-tile-num">{summary.inactiveCount}</div>
                        <div className="crm-tile-label">{isAmharic ? 'በቅርቡ ያልገዙ' : 'Quiet Customers'}</div>
                        <div className="crm-tile-hint">{isAmharic ? 'ቅናሽ ልከው ይመልሷቸው' : 'Send an offer to bring back'}</div>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => { setSelectedGroup('debtors'); setActiveTab('customers'); }}
                    className={`crm-group-tile ${selectedGroup === 'debtors' ? 'active' : ''}`}
                >
                    <div className="crm-tile-icon rose"><CreditCard size={22} /></div>
                    <div>
                        <div className="crm-tile-num">{summary.debtorCount}</div>
                        <div className="crm-tile-label">{isAmharic ? 'ብድር ያለባቸው' : 'Has Unpaid Debt'}</div>
                        <div className="crm-tile-hint">{isAmharic ? 'የብድር ማስታወሻ ይላኩ' : 'Send polite reminder'}</div>
                    </div>
                </button>
            </div>

            {/* 3. TABS */}
            <div className="crm-tabs">
                <button
                    type="button"
                    onClick={() => setActiveTab('customers')}
                    className={`crm-tab-btn ${activeTab === 'customers' ? 'active' : ''}`}
                >
                    <Users size={17} />
                    <span>
                        {isAmharic ? `ደንበኞቼ (${filteredCustomers.length})` : `My Customers (${filteredCustomers.length})`}
                    </span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('sms')}
                    className={`crm-tab-btn ${activeTab === 'sms' ? 'active' : ''}`}
                >
                    <MessageSquare size={17} />
                    <span>
                        {isAmharic ? `የSMS ማስታወቂያ ላክ (${campaigns.length})` : `Bulk SMS Promos (${campaigns.length})`}
                    </span>
                </button>
            </div>

            {/* TAB 1: CUSTOMER CARDS */}
            {activeTab === 'customers' ? (
                <div>
                    <div className="mezgeb-toolbar" style={{ marginBottom: '1.25rem' }}>
                        <div className="mezgeb-search-wrap">
                            <Search size={17} className="mezgeb-search-icon" />
                            <input
                                type="text"
                                className="mezgeb-search-input"
                                placeholder={isAmharic ? 'በስም ወይም በስልክ ቁጥር ፈልግ...' : 'Search customers by name or phone...'}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setSmsAudience(selectedGroup);
                                setActiveTab('sms');
                            }}
                            className="mezgeb-primary-btn"
                        >
                            <Send size={15} />
                            <span>
                                {isAmharic
                                    ? `ለዚህ ቡድን SMS ላክ (${filteredCustomers.length})`
                                    : `SMS This Group (${filteredCustomers.length})`}
                            </span>
                        </button>
                    </div>

                    {loading ? (
                        <div className="crm-panel" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--admin-subtext, #64748b)' }}>
                            {isAmharic ? 'የደንበኞች ዝርዝር በመጫን ላይ...' : 'Loading customers...'}
                        </div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="crm-panel" style={{ textAlign: 'center', padding: '3rem' }}>
                            <p style={{ margin: 0, fontWeight: 700, color: 'var(--admin-text, #0f172a)' }}>
                                {isAmharic ? 'በዚህ ቡድን ውስጥ ደንበኛ አልተገኘም።' : 'No customers found in this group yet.'}
                            </p>
                            <p style={{ margin: '6px 0 0', fontSize: '0.86rem', color: 'var(--admin-subtext, #64748b)' }}>
                                {isAmharic
                                    ? 'ደንበኞች ሲመዘገቡ ወይም ብድር ሲመዘግቡ እዚህ በራስ-ሰር ይታያሉ።'
                                    : 'As customers sign up, order, or take credit, they appear automatically here.'}
                            </p>
                        </div>
                    ) : (
                        <div className="crm-customers-grid">
                            {filteredCustomers.map((c) => (
                                <div key={c.id} className="crm-customer-card">
                                    <div className="crm-cust-top">
                                        <div className="crm-avatar">{(c.name || 'C').charAt(0)}</div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 800, fontSize: '0.96rem', color: 'var(--admin-text, #0f172a)' }}>
                                                {c.name}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--admin-subtext, #64748b)', marginTop: '2px' }}>
                                                {c.phone || (isAmharic ? 'ስልክ የለም' : 'No phone')}
                                            </div>
                                        </div>
                                        <span className={`crm-badge ${c.badgeTone || 'cyan'}`}>
                                            {isAmharic ? c.simpleLabelAm : c.simpleLabelEn}
                                        </span>
                                    </div>

                                    <div className="crm-stats-strip">
                                        <div>
                                            <div style={{ fontSize: '0.73rem', color: 'var(--admin-subtext, #64748b)', fontWeight: 700 }}>
                                                {isAmharic ? 'ጠቅላላ ግዢ' : 'Total Spent'}
                                            </div>
                                            <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
                                                ETB {(c.totalSpent || 0).toLocaleString()}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.73rem', color: 'var(--admin-subtext, #64748b)', fontWeight: 700 }}>
                                                {isAmharic ? 'የገዙበት ጊዜ' : 'Orders Placed'}
                                            </div>
                                            <div style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--admin-text, #0f172a)', marginTop: '2px' }}>
                                                {c.totalOrders} {isAmharic ? 'ጊዜ' : c.totalOrders === 1 ? 'order' : 'orders'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="crm-cust-actions">
                                        {c.phone && (
                                            <a href={`tel:${c.phone}`} className="crm-call-btn">
                                                <Phone size={14} />
                                                <span>{isAmharic ? 'ደውል' : 'Call'}</span>
                                            </a>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => handleQuickSmsCustomer(c)}
                                            className="crm-sms-btn"
                                        >
                                            <MessageSquare size={14} />
                                            <span>{isAmharic ? 'SMS ላክ' : 'Send SMS'}</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                /* TAB 2: BULK SMS CAMPAIGN COMPOSER & HISTORY */
                <div className="crm-sms-grid">
                    <div className="crm-panel">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--admin-text, #0f172a)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Send size={19} color="#06b6d4" />
                                <span>{isAmharic ? 'የSMS መልእክት ጻፍና ላክ' : 'Write & Send SMS Promo'}</span>
                            </h2>
                            <Link
                                to="/admin/settings"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    color: smsStatus.configured ? '#10b981' : '#f59e0b',
                                    textDecoration: 'none',
                                    background: smsStatus.configured ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.14)',
                                    padding: '4px 10px',
                                    borderRadius: '999px',
                                }}
                            >
                                <Settings size={13} />
                                <span>
                                    {smsStatus.configured
                                        ? `${smsStatus.provider.toUpperCase()} LIVE`
                                        : isAmharic ? 'የሙከራ ሞድ (ቁልፍ አስገባ)' : 'Free Preview Mode (Add SMS Key)'}
                                </span>
                            </Link>
                        </div>

                        {sendFeedback && (
                            <div
                                style={{
                                    background: 'rgba(16, 185, 129, 0.12)',
                                    border: '1px solid rgba(16, 185, 129, 0.35)',
                                    color: '#10b981',
                                    padding: '0.9rem 1rem',
                                    borderRadius: '12px',
                                    fontWeight: 700,
                                    fontSize: '0.88rem',
                                    marginBottom: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                }}
                            >
                                <CheckCircle2 size={18} />
                                <span>{isAmharic ? sendFeedback.messageAm : sendFeedback.messageEn}</span>
                            </div>
                        )}

                        {errorMsg && (
                            <div className="voice-error-banner">
                                <AlertCircle size={18} />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        <form onSubmit={handleSendCampaign}>
                            <label className="mezgeb-field-label">
                                {isAmharic ? '1. ለማን ይላክ?' : '1. Who Should Receive This SMS?'}
                            </label>
                            <div className="crm-audience-grid">
                                {[
                                    { key: 'all', en: 'All Customers', am: 'ሁሉም ደንበኞች' },
                                    { key: 'vip', en: 'Best Customers (VIP)', am: 'ምርጥ ደንበኞች' },
                                    { key: 'inactive', en: 'Quiet Customers', am: 'በቅርቡ ያልገዙ' },
                                    { key: 'debtors', en: 'Unpaid Debt List', am: 'ብድር ያለባቸው' },
                                    { key: 'single', en: 'One Phone Number', am: 'ለአንድ ስልክ ቁጥር' },
                                ].map((opt) => (
                                    <button
                                        key={opt.key}
                                        type="button"
                                        onClick={() => setSmsAudience(opt.key)}
                                        className={`crm-audience-pill ${smsAudience === opt.key ? 'active' : ''}`}
                                    >
                                        <span>{isAmharic ? opt.am : opt.en}</span>
                                        {opt.key !== 'single' && (
                                            <span style={{ opacity: 0.75 }}>{getAudienceCount(opt.key)}</span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {smsAudience === 'single' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                                    <div>
                                        <label className="mezgeb-field-label">
                                            {isAmharic ? 'ስልክ ቁጥር *' : 'Phone Number *'}
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="0911223344"
                                            value={singlePhone}
                                            onChange={(e) => setSinglePhone(e.target.value)}
                                            className="mezgeb-input"
                                        />
                                    </div>
                                    <div>
                                        <label className="mezgeb-field-label">
                                            {isAmharic ? 'ስም (አማራጭ)' : 'Name (Optional)'}
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Abebe"
                                            value={singleName}
                                            onChange={(e) => setSingleName(e.target.value)}
                                            className="mezgeb-input"
                                        />
                                    </div>
                                </div>
                            )}

                            <div style={{ marginBottom: '1rem' }}>
                                <label className="mezgeb-field-label">
                                    {isAmharic ? '2. የዘመቻው ርዕስ (ለማስታወሻ)' : '2. Campaign Name (For Your Records)'}
                                </label>
                                <input
                                    type="text"
                                    placeholder={isAmharic ? 'ለምሳሌ፡ የሳምንቱ ቅናሽ' : 'e.g. Weekend Coffee Discount'}
                                    value={smsTitle}
                                    onChange={(e) => setSmsTitle(e.target.value)}
                                    className="mezgeb-input"
                                />
                            </div>

                            {/* AI 1-Tap SMS Writer */}
                            <label className="mezgeb-field-label">
                                {isAmharic ? '3. AI መልእክቱን እንዲጽፍልዎት ይጫኑ (አማራጭ)' : '3. Let AI Write The SMS For You (Optional)'}
                            </label>
                            <div className="crm-ai-row">
                                <button
                                    type="button"
                                    disabled={isWritingAi}
                                    onClick={() => handleAiWriteSms('promo', 'am')}
                                    className="crm-ai-btn"
                                >
                                    <Sparkles size={13} />
                                    <span>{isAmharic ? 'የቅናሽ SMS (አማርኛ)' : 'Promo SMS (Amharic)'}</span>
                                </button>
                                <button
                                    type="button"
                                    disabled={isWritingAi}
                                    onClick={() => handleAiWriteSms('promo', 'en')}
                                    className="crm-ai-btn"
                                >
                                    <Sparkles size={13} />
                                    <span>{isAmharic ? 'የቅናሽ SMS (English)' : 'Promo SMS (English)'}</span>
                                </button>
                                <button
                                    type="button"
                                    disabled={isWritingAi}
                                    onClick={() => handleAiWriteSms('comeback', isAmharic ? 'am' : 'en')}
                                    className="crm-ai-btn"
                                >
                                    <Sparkles size={13} />
                                    <span>{isAmharic ? 'ተመለሱ መልእክት' : 'Bring Back Offer'}</span>
                                </button>
                                <button
                                    type="button"
                                    disabled={isWritingAi}
                                    onClick={() => handleAiWriteSms('debt', isAmharic ? 'am' : 'en')}
                                    className="crm-ai-btn"
                                >
                                    <Sparkles size={13} />
                                    <span>{isAmharic ? 'የብድር ማስታወሻ' : 'Polite Debt Reminder'}</span>
                                </button>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <textarea
                                    required
                                    className="voice-textarea"
                                    style={{ minHeight: '110px' }}
                                    placeholder={
                                        isAmharic
                                            ? 'የሚላከውን SMS መልእክት እዚህ ይጻፉ...'
                                            : 'Write your SMS message here (or click an AI button above)...'
                                    }
                                    value={smsMessage}
                                    onChange={(e) => setSmsMessage(e.target.value)}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--admin-subtext, #64748b)', marginTop: '4px' }}>
                                    <span>
                                        {isAmharic
                                            ? `የሚደርሳቸው ሰዎች: ${getAudienceCount(smsAudience)}`
                                            : `Sending to: ${getAudienceCount(smsAudience)} customer(s)`}
                                    </span>
                                    <span>{smsMessage.length} chars</span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSending || !smsMessage.trim()}
                                className="voice-save-btn"
                                style={{ width: '100%' }}
                            >
                                {isSending ? <Loader2 size={18} className="spinning-refresh-icon" /> : <Send size={18} />}
                                <span>
                                    {isSending
                                        ? isAmharic ? 'በመላክ ላይ...' : 'Sending...'
                                        : smsStatus.configured
                                            ? isAmharic ? 'SMS አሁን ላክ' : 'Send SMS Now'
                                            : isAmharic ? 'የሙከራ SMS ቅድመ-እይታ ላክ (ነፃ)' : 'Send Free Test Preview'}
                                </span>
                            </button>
                        </form>
                    </div>

                    {/* RIGHT: RECENT SMS CAMPAIGN HISTORY */}
                    <div className="crm-panel">
                        <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 800, color: 'var(--admin-text, #0f172a)', display: 'flex', alignItems: 'center', gap: '7px' }}>
                            <Clock size={18} color="#06b6d4" />
                            <span>{isAmharic ? 'የተላኩ SMS መልእክቶች ታሪክ' : 'Sent SMS History'}</span>
                        </h3>

                        {campaigns.length === 0 ? (
                            <div className="report-empty-note">
                                {isAmharic
                                    ? 'እስካሁን የተላከ የSMS ዘመቻ የለም። የመጀመሪያውን ማስታወቂያዎን ይላኩ!'
                                    : 'No SMS campaigns sent yet. Send your first promo on the left!'}
                            </div>
                        ) : (
                            campaigns.map((camp) => (
                                <div key={camp._id} className="crm-history-item">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '6px' }}>
                                        <strong style={{ fontSize: '0.9rem', color: 'var(--admin-text, #0f172a)' }}>
                                            {camp.title}
                                        </strong>
                                        <span className={`crm-badge ${camp.mode === 'live' ? 'emerald' : 'amber'}`}>
                                            {camp.mode === 'live'
                                                ? `${camp.deliveredCount} Sent`
                                                : `Preview (${camp.recipientCount})`}
                                        </span>
                                    </div>
                                    <p style={{ margin: '0 0 6px', fontSize: '0.84rem', color: 'var(--admin-text, #334155)', lineHeight: 1.4 }}>
                                        {camp.message}
                                    </p>
                                    <div style={{ fontSize: '0.74rem', color: 'var(--admin-subtext, #64748b)' }}>
                                        {new Date(camp.createdAt).toLocaleString()} • {camp.audience.toUpperCase()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerMarketing;
