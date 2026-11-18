import React, { useState, useEffect } from 'react';
import {
    Share2,
    Plus,
    Copy,
    Check,
    Phone,
    Wallet,
    Users,
    DollarSign,
    CheckCircle2,
    RefreshCw,
    Trash2,
    PauseCircle,
    PlayCircle,
    X,
} from 'lucide-react';
import { affiliateService } from '../../../services/api';
import { useAdminLanguage } from '../../../context/AdminLanguageContext';
import './AffiliateManager.css';

const AffiliateManager = () => {
    const { isAmharic } = useAdminLanguage();

    const [summary, setSummary] = useState({
        totalPromoters: 0,
        activePromoters: 0,
        totalSalesBrought: 0,
        totalPendingPayout: 0,
        totalPaidOut: 0,
    });
    const [affiliates, setAffiliates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [justRefreshed, setJustRefreshed] = useState(false);
    const [copiedCode, setCopiedCode] = useState('');

    // Modals
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [payoutTarget, setPayoutTarget] = useState(null);

    const [newForm, setNewForm] = useState({
        name: '',
        phone: '',
        code: '',
        commissionRate: '5',
        notes: '',
    });

    const [payoutForm, setPayoutForm] = useState({
        amount: '',
        paymentMethod: 'Telebirr',
        note: '',
        syncCapital: true,
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const { data } = await affiliateService.getAll();
            setSummary(data.summary || summary);
            setAffiliates(data.affiliates || []);
        } catch (err) {
            console.error('Failed to load affiliates', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        setJustRefreshed(false);
        try {
            await loadData();
            setJustRefreshed(true);
            setTimeout(() => setJustRefreshed(false), 2000);
        } finally {
            setIsRefreshing(false);
        }
    };

    const getShareLink = (code) => `${window.location.origin}/?ref=${code}`;

    const handleCopyLink = (code) => {
        navigator.clipboard.writeText(getShareLink(code));
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(''), 2000);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await affiliateService.create({
                ...newForm,
                commissionRate: Number(newForm.commissionRate) || 5,
            });
            setAddModalOpen(false);
            setNewForm({ name: '', phone: '', code: '', commissionRate: '5', notes: '' });
            await loadData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add promoter');
        }
    };

    const handleToggleActive = async (aff) => {
        try {
            await affiliateService.update(aff._id, { active: !aff.active });
            await loadData();
        } catch {
            alert('Failed to update status');
        }
    };

    const handleOpenPayout = (aff) => {
        setPayoutTarget(aff);
        setPayoutForm({
            amount: aff.pendingBalance > 0 ? String(aff.pendingBalance) : '',
            paymentMethod: 'Telebirr',
            note: '',
            syncCapital: true,
        });
    };

    const handleRecordPayout = async (e) => {
        e.preventDefault();
        if (!payoutTarget) return;
        try {
            const { data } = await affiliateService.payout(payoutTarget._id, {
                ...payoutForm,
                amount: Number(payoutForm.amount),
            });
            alert(data.message || 'Payout recorded!');
            setPayoutTarget(null);
            await loadData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to record payout');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(isAmharic ? 'ይህን አስተዋዋቂ መሰረዝ እርግጠኛ ነዎት?' : 'Remove this promoter?')) return;
        try {
            await affiliateService.delete(id);
            await loadData();
        } catch {
            alert('Failed to delete promoter');
        }
    };

    return (
        <div className="aff-page">
            {/* 1. HERO BANNER */}
            <div className="aff-hero">
                <div className="aff-hero-left">
                    <div className="aff-hero-icon">
                        <Share2 size={26} />
                    </div>
                    <div>
                        <h1 className="aff-hero-title">
                            {isAmharic ? 'አስተዋዋቂዎች እና የኮሚሽን ሊንክ (Affiliates)' : 'Promoters & Referral Links'}
                        </h1>
                        <p className="aff-hero-sub">
                            {isAmharic
                                ? 'ለጓደኞች ወይም ለTikTok አስተዋዋቂዎች ሊንክ ይስጡ — ሽያጭ ሲያመጡ ብቻ ኮሚሽን ይክፈሉ!'
                                : 'Give friends or TikTokers a share link — you only pay them after they bring real sales!'}
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
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

                    <button type="button" onClick={() => setAddModalOpen(true)} className="mezgeb-primary-btn">
                        <Plus size={17} />
                        <span>{isAmharic ? 'አዲስ አስተዋዋቂ ጨምር' : 'Add Promoter'}</span>
                    </button>
                </div>
            </div>

            {/* 2. 4 SIMPLE SUMMARY CARDS */}
            <div className="aff-summary-grid">
                <div className="aff-stat-card">
                    <div className="aff-stat-label">
                        <span>{isAmharic ? 'ንቁ አስተዋዋቂዎች' : 'Active Promoters'}</span>
                        <Users size={18} color="#8b5cf6" />
                    </div>
                    <div className="aff-stat-val">{summary.activePromoters}</div>
                </div>

                <div className="aff-stat-card">
                    <div className="aff-stat-label">
                        <span>{isAmharic ? 'ያመጡት ጠቅላላ ሽያጭ' : 'Sales They Brought'}</span>
                        <DollarSign size={18} color="#10b981" />
                    </div>
                    <div className="aff-stat-val" style={{ color: '#10b981' }}>
                        ETB {(summary.totalSalesBrought || 0).toLocaleString()}
                    </div>
                </div>

                <div className="aff-stat-card">
                    <div className="aff-stat-label">
                        <span>{isAmharic ? 'ለእነሱ የሚከፈል ቀሪ' : 'Commission To Pay'}</span>
                        <Wallet size={18} color="#f59e0b" />
                    </div>
                    <div className="aff-stat-val" style={{ color: '#f59e0b' }}>
                        ETB {(summary.totalPendingPayout || 0).toLocaleString()}
                    </div>
                </div>

                <div className="aff-stat-card">
                    <div className="aff-stat-label">
                        <span>{isAmharic ? 'እስካሁን የተከፈለ' : 'Already Paid Out'}</span>
                        <CheckCircle2 size={18} color="#06b6d4" />
                    </div>
                    <div className="aff-stat-val">
                        ETB {(summary.totalPaidOut || 0).toLocaleString()}
                    </div>
                </div>
            </div>

            {/* 3. PROMOTER CARDS */}
            {loading ? (
                <div className="crm-panel" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--admin-subtext, #64748b)' }}>
                    {isAmharic ? 'በመጫን ላይ...' : 'Loading promoters...'}
                </div>
            ) : affiliates.length === 0 ? (
                <div className="crm-panel" style={{ textAlign: 'center', padding: '3.2rem' }}>
                    <h3 style={{ margin: '0 0 0.4rem', color: 'var(--admin-text, #0f172a)' }}>
                        {isAmharic ? 'እስካሁን የተመዘገበ አስተዋዋቂ የለም' : 'No Promoters Added Yet'}
                    </h3>
                    <p style={{ margin: '0 0 1.2rem', color: 'var(--admin-subtext, #64748b)', fontSize: '0.9rem' }}>
                        {isAmharic
                            ? 'የመጀመሪያውን አስተዋዋቂ ይጨምሩና ሊንኩን ይላኩለት — ሰዎች በሊንኩ ሲገዙ ኮሚሽኑ በራስ-ሰር ይቆጠራል!'
                            : 'Add your first promoter and share their link — every sale they bring is tracked automatically!'}
                    </p>
                    <button type="button" onClick={() => setAddModalOpen(true)} className="mezgeb-primary-btn">
                        <Plus size={17} />
                        <span>{isAmharic ? 'የመጀመሪያ አስተዋዋቂ ጨምር' : 'Add Your First Promoter'}</span>
                    </button>
                </div>
            ) : (
                <div className="aff-cards-grid">
                    {affiliates.map((aff) => (
                        <div key={aff._id} className="aff-card">
                            {/* Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                                    <div className="crm-avatar">{(aff.name || 'P').charAt(0)}</div>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--admin-text, #0f172a)' }}>
                                            {aff.name}
                                        </div>
                                        <a
                                            href={`tel:${aff.phone}`}
                                            style={{ fontSize: '0.8rem', color: 'var(--admin-subtext, #64748b)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                        >
                                            <Phone size={12} />
                                            <span>{aff.phone}</span>
                                        </a>
                                    </div>
                                </div>
                                <span className={`crm-badge ${aff.active ? 'emerald' : 'rose'}`}>
                                    {aff.active ? (isAmharic ? 'ንቁ' : 'Active') : (isAmharic ? 'ቆሟል' : 'Paused')}
                                </span>
                            </div>

                            {/* Simple Commission Explanation */}
                            <div style={{ fontSize: '0.8rem', color: 'var(--admin-subtext, #64748b)', fontWeight: 600 }}>
                                {isAmharic
                                    ? `ኮሚሽን: ከእያንዳንዱ 100 ብር ሽያጭ ETB ${aff.commissionRate} ያገኛል`
                                    : `Earns ETB ${aff.commissionRate} for every ETB 100 sold`}
                            </div>

                            {/* 1-Tap Copy Share Link */}
                            <div className="aff-link-box">
                                <span className="aff-link-text">{getShareLink(aff.code)}</span>
                                <button
                                    type="button"
                                    onClick={() => handleCopyLink(aff.code)}
                                    className={`aff-copy-btn ${copiedCode === aff.code ? 'copied' : ''}`}
                                >
                                    {copiedCode === aff.code ? <Check size={13} /> : <Copy size={13} />}
                                    <span>{copiedCode === aff.code ? (isAmharic ? 'ተቀዳ!' : 'Copied!') : isAmharic ? 'ቅዳ' : 'Copy'}</span>
                                </button>
                            </div>

                            {/* Simple Metrics */}
                            <div className="aff-metrics-row">
                                <div className="aff-metric-box">
                                    <div className="aff-metric-num">{aff.clicks || 0}</div>
                                    <div className="aff-metric-lbl">{isAmharic ? 'ክሊኮች' : 'Clicks'}</div>
                                </div>
                                <div className="aff-metric-box">
                                    <div className="aff-metric-num">{aff.totalOrders || 0}</div>
                                    <div className="aff-metric-lbl">{isAmharic ? 'ትዕዛዞች' : 'Orders'}</div>
                                </div>
                                <div className="aff-metric-box">
                                    <div className="aff-metric-num" style={{ color: '#10b981' }}>
                                        {(aff.totalSalesAmount || 0).toLocaleString()}
                                    </div>
                                    <div className="aff-metric-lbl">{isAmharic ? 'ሽያጭ (ETB)' : 'Sales (ETB)'}</div>
                                </div>
                            </div>

                            {/* Payout Bar */}
                            <div className="aff-payout-bar">
                                <div>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--admin-subtext, #64748b)' }}>
                                        {isAmharic ? 'መከፈል ያለበት' : 'Owed To Promoter'}
                                    </div>
                                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#10b981' }}>
                                        ETB {(aff.pendingBalance || 0).toLocaleString()}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleOpenPayout(aff)}
                                    className="advisor-restock-btn"
                                >
                                    <Wallet size={14} />
                                    <span>{isAmharic ? 'ክፍያ ፈጽም' : 'Pay Now'}</span>
                                </button>
                            </div>

                            {/* Footer Controls */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--admin-border, #f1f5f9)', paddingTop: '0.75rem' }}>
                                <button
                                    type="button"
                                    onClick={() => handleToggleActive(aff)}
                                    style={{ background: 'none', border: 'none', color: 'var(--admin-subtext, #64748b)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', fontWeight: 700 }}
                                >
                                    {aff.active ? <PauseCircle size={15} /> : <PlayCircle size={15} />}
                                    <span>{aff.active ? (isAmharic ? 'ለጊዜው አቁም' : 'Pause Link') : isAmharic ? 'አስጀምር' : 'Resume Link'}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(aff._id)}
                                    className="mezgeb-icon-btn delete"
                                    title="Delete"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ADD PROMOTER MODAL */}
            {addModalOpen && (
                <div className="mezgeb-modal-backdrop" onClick={(e) => e.target === e.currentTarget && setAddModalOpen(false)}>
                    <div className="mezgeb-modal" style={{ maxWidth: '460px' }}>
                        <div className="mezgeb-modal-header">
                            <h2 className="mezgeb-modal-title">
                                <Share2 size={20} color="#06b6d4" />
                                <span>{isAmharic ? 'አዲስ አስተዋዋቂ ጨምር' : 'Add New Promoter'}</span>
                            </h2>
                            <button type="button" onClick={() => setAddModalOpen(false)} className="mezgeb-modal-close">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} style={{ display: 'grid', gap: '0.95rem' }}>
                            <div>
                                <label className="mezgeb-field-label">{isAmharic ? 'የአስተዋዋቂው ስም *' : 'Promoter Name *'}</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Abebe TikTok"
                                    value={newForm.name}
                                    onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                                    className="mezgeb-input"
                                />
                            </div>
                            <div>
                                <label className="mezgeb-field-label">{isAmharic ? 'ስልክ ቁጥር (ለTelebirr ክፍያ) *' : 'Phone Number (for Telebirr payout) *'}</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="0911223344"
                                    value={newForm.phone}
                                    onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })}
                                    className="mezgeb-input"
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                                <div>
                                    <label className="mezgeb-field-label">{isAmharic ? 'የሊንክ ኮድ (አማራጭ)' : 'Referral Code (Optional)'}</label>
                                    <input
                                        type="text"
                                        placeholder="ABEBE10"
                                        value={newForm.code}
                                        onChange={(e) => setNewForm({ ...newForm, code: e.target.value.toUpperCase() })}
                                        className="mezgeb-input"
                                    />
                                </div>
                                <div>
                                    <label className="mezgeb-field-label">{isAmharic ? 'ከ100 ብር ስንት ብር ያግኝ?' : 'ETB Earned Per 100 ETB Sold'}</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="50"
                                        required
                                        value={newForm.commissionRate}
                                        onChange={(e) => setNewForm({ ...newForm, commissionRate: e.target.value })}
                                        className="mezgeb-input"
                                    />
                                </div>
                            </div>
                            <button type="submit" className="mezgeb-primary-btn" style={{ justifyContent: 'center', marginTop: '0.3rem' }}>
                                {isAmharic ? 'አስተዋዋቂውን መዝግብ' : 'Create Promoter & Link'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* PAYOUT MODAL */}
            {payoutTarget && (
                <div className="mezgeb-modal-backdrop" onClick={(e) => e.target === e.currentTarget && setPayoutTarget(null)}>
                    <div className="mezgeb-modal" style={{ maxWidth: '440px' }}>
                        <div className="mezgeb-modal-header">
                            <h2 className="mezgeb-modal-title">
                                <Wallet size={20} color="#10b981" />
                                <span>{isAmharic ? `ለ${payoutTarget.name} ክፍያ ፈጽም` : `Pay ${payoutTarget.name}`}</span>
                            </h2>
                            <button type="button" onClick={() => setPayoutTarget(null)} className="mezgeb-modal-close">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleRecordPayout} style={{ display: 'grid', gap: '0.95rem' }}>
                            <div>
                                <label className="mezgeb-field-label">{isAmharic ? 'የሚከፈለው ብር (ETB) *' : 'Amount To Pay (ETB) *'}</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    step="any"
                                    value={payoutForm.amount}
                                    onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                                    className="mezgeb-input"
                                    style={{ fontSize: '1.15rem', fontWeight: 800 }}
                                />
                            </div>
                            <div>
                                <label className="mezgeb-field-label">{isAmharic ? 'የክፍያ ዘዴ' : 'Payment Method'}</label>
                                <select
                                    value={payoutForm.paymentMethod}
                                    onChange={(e) => setPayoutForm({ ...payoutForm, paymentMethod: e.target.value })}
                                    className="mezgeb-input"
                                >
                                    <option value="Telebirr">Telebirr</option>
                                    <option value="CBEBirr">CBEBirr</option>
                                    <option value="Cash">Cash</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                </select>
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', fontWeight: 600, color: 'var(--admin-text, #0f172a)', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={payoutForm.syncCapital}
                                    onChange={(e) => setPayoutForm({ ...payoutForm, syncCapital: e.target.checked })}
                                />
                                <span>{isAmharic ? 'ከካፒታል ግምጃ ቤት በራስ-ሰር ቀንስ' : 'Automatically record outflow in Capital Treasury'}</span>
                            </label>
                            <button type="submit" className="voice-save-btn" style={{ width: '100%' }}>
                                {isAmharic ? 'ክፍያውን አረጋግጥ' : 'Confirm Payout'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AffiliateManager;
