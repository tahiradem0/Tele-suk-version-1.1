import React from 'react';
import { Link } from 'react-router-dom';
import {
    AlertCircle,
    Flame,
    Moon,
    CheckCircle2,
    PlusCircle,
    Sparkles,
    Tag,
    ShoppingBag,
} from 'lucide-react';
import './SmartStockAdvisor.css';

const SmartStockAdvisor = ({ insights, isAmharic, onQuickRestock }) => {
    if (!insights) {
        return (
            <div className="advisor-section" style={{ textAlign: 'center', padding: '2.5rem' }}>
                <p style={{ color: 'var(--admin-subtext, #64748b)', fontWeight: 600 }}>
                    {isAmharic ? 'የክምችት ምክር በመጫን ላይ...' : 'Loading your simple shop stock advice...'}
                </p>
            </div>
        );
    }

    const {
        summary = {},
        todayActions = [],
        buySoon = [],
        hotSellers = [],
        notSelling = [],
        goodStock = [],
    } = insights;

    return (
        <div className="advisor-wrap">
            {/* 1. 4 SIMPLE STATUS TILES (NO PERCENTAGES, PLAIN COUNTS) */}
            <div className="advisor-summary-grid">
                <div className="advisor-tile urgent">
                    <div className="advisor-tile-icon urgent">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <div className="advisor-tile-num">{summary.buySoonCount || 0}</div>
                        <div className="advisor-tile-title">
                            {isAmharic ? 'በቅርቡ ይግዙ' : 'Buy More Soon'}
                        </div>
                        <div className="advisor-tile-sub">
                            {isAmharic ? 'ያለቁ ወይም እያለቁ ያሉ' : 'Finished or running low'}
                        </div>
                    </div>
                </div>

                <div className="advisor-tile hot">
                    <div className="advisor-tile-icon hot">
                        <Flame size={24} />
                    </div>
                    <div>
                        <div className="advisor-tile-num">{summary.hotSellersCount || 0}</div>
                        <div className="advisor-tile-title">
                            {isAmharic ? 'በፍጥነት የሚሸጡ' : 'Selling Fast'}
                        </div>
                        <div className="advisor-tile-sub">
                            {isAmharic ? 'ደንበኞች የሚወዷቸው' : 'Popular with customers'}
                        </div>
                    </div>
                </div>

                <div className="advisor-tile sleep">
                    <div className="advisor-tile-icon sleep">
                        <Moon size={24} />
                    </div>
                    <div>
                        <div className="advisor-tile-num">{summary.notSellingCount || 0}</div>
                        <div className="advisor-tile-title">
                            {isAmharic ? 'ሳይሸጡ የቆሙ' : 'Not Selling'}
                        </div>
                        <div className="advisor-tile-sub">
                            {summary.moneyStuckOnShelf > 0
                                ? isAmharic
                                    ? `ETB ${summary.moneyStuckOnShelf.toLocaleString()} መደርደሪያ ላይ ቆሟል`
                                    : `ETB ${summary.moneyStuckOnShelf.toLocaleString()} sitting on shelf`
                                : isAmharic
                                    ? 'ሁሉም እየተንቀሳቀሱ ነው'
                                    : 'No cash stuck on shelf'}
                        </div>
                    </div>
                </div>

                <div className="advisor-tile good">
                    <div className="advisor-tile-icon good">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <div className="advisor-tile-num">{summary.goodStockCount || 0}</div>
                        <div className="advisor-tile-title">
                            {isAmharic ? 'በቂ ክምችት ያላቸው' : 'Good Stock'}
                        </div>
                        <div className="advisor-tile-sub">
                            {isAmharic ? 'አሁን መግዛት አያስፈልግም' : 'Healthy — no worry'}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. TODAY'S SIMPLE ACTION CHECKLIST */}
            <div className="advisor-checklist-card">
                <div className="advisor-checklist-head">
                    <h2 className="advisor-checklist-title">
                        <Sparkles size={20} color="#67e8f9" />
                        <span>{isAmharic ? 'ዛሬ ምን ማድረግ አለብዎት?' : 'What To Do Today'}</span>
                    </h2>
                    <span style={{ fontSize: '0.8rem', color: 'rgba(226, 232, 240, 0.85)', fontWeight: 600 }}>
                        {isAmharic ? 'ቀላል የሱቅ ምክር' : 'Simple Shop Checklist'}
                    </span>
                </div>

                <div className="advisor-action-list">
                    {todayActions.map((act, idx) => (
                        <div key={idx} className="advisor-action-row">
                            <div className="advisor-action-text">
                                <span className={`advisor-action-dot ${act.priority || 'info'}`} />
                                <span>{isAmharic ? act.textAm : act.textEn}</span>
                            </div>
                            {act.type === 'restock' && act.productId && onQuickRestock && (
                                <button
                                    type="button"
                                    className="advisor-restock-btn"
                                    onClick={() => {
                                        const found = buySoon.find((p) => p._id === act.productId);
                                        if (found) onQuickRestock(found, act.recommendedQty);
                                    }}
                                >
                                    <PlusCircle size={15} />
                                    <span>
                                        {isAmharic
                                            ? `+${act.recommendedQty} አሁን ሙላ`
                                            : `Buy +${act.recommendedQty} Now`}
                                    </span>
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. BUY SOON (FINISHED OR RUNNING OUT) */}
            <div className="advisor-section">
                <div className="advisor-section-head">
                    <div>
                        <h3 className="advisor-section-title">
                            <AlertCircle size={20} color="#f43f5e" />
                            <span>
                                {isAmharic ? 'እቃዎች እያለቁ ነው — በቅርቡ ይግዙ' : 'Buy More Soon — Running Low'}
                            </span>
                        </h3>
                        <p className="advisor-section-sub">
                            {isAmharic
                                ? 'እነዚህን እቃዎች ካልገዙ ደንበኞች ባዶ ሱቅ ያገኛሉ።'
                                : 'Restock these products first so customers never see "Out of Stock".'}
                        </p>
                    </div>
                </div>

                {buySoon.length === 0 ? (
                    <div className="advisor-empty-good">
                        {isAmharic
                            ? '👏 በጣም ጥሩ! ምንም እያለቀ ያለ እቃ የለም።'
                            : 'Great job! None of your products are running out right now.'}
                    </div>
                ) : (
                    <div className="advisor-cards-grid">
                        {buySoon.map((item) => (
                            <div key={item._id} className="advisor-item-card">
                                <div className="advisor-item-top">
                                    <img
                                        src={item.image || 'https://placehold.co/60'}
                                        alt={item.name}
                                        className="advisor-item-img"
                                    />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div className="advisor-item-name">{item.name}</div>
                                        <div className="advisor-item-meta">
                                            {isAmharic
                                                ? `ቀሪ ክምችት: ${item.stockQuantity} ፍሬ`
                                                : `Left in shop: ${item.stockQuantity} units`}
                                        </div>
                                    </div>
                                    <span className={`advisor-badge ${item.tag === 'finished' ? 'urgent' : 'warning'}`}>
                                        {isAmharic ? item.badgeAm : item.badgeEn}
                                    </span>
                                </div>

                                <div className="advisor-plain-advice">
                                    {isAmharic ? item.adviceAm : item.adviceEn}
                                </div>

                                <div className="advisor-item-footer">
                                    <span style={{ fontSize: '0.8rem', color: 'var(--admin-subtext, #64748b)', fontWeight: 600 }}>
                                        {isAmharic
                                            ? `የሚመከር: +${item.recommendedRestockQty} ፍሬ`
                                            : `Suggested: +${item.recommendedRestockQty} units`}
                                    </span>
                                    <button
                                        type="button"
                                        className="advisor-restock-btn"
                                        onClick={() => onQuickRestock && onQuickRestock(item, item.recommendedRestockQty)}
                                    >
                                        <PlusCircle size={15} />
                                        <span>{isAmharic ? 'አሁን ሙላ' : 'Restock Now'}</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 4. BEST SELLERS (WHAT CUSTOMERS LOVE) */}
            {hotSellers.length > 0 && (
                <div className="advisor-section">
                    <div className="advisor-section-head">
                        <div>
                            <h3 className="advisor-section-title">
                                <Flame size={20} color="#f59e0b" />
                                <span>
                                    {isAmharic ? 'በፍጥነት እየተሸጡ ያሉ እቃዎች' : 'Best Sellers — Customers Love These'}
                                </span>
                            </h3>
                            <p className="advisor-section-sub">
                                {isAmharic
                                    ? 'እነዚህ እቃዎች ብዙ ገንዘብ እያመጡልዎት ነው — ሁልጊዜ በመደብር ያኑሩ።'
                                    : 'These items bring the most sales — always keep plenty ready.'}
                            </p>
                        </div>
                    </div>

                    <div className="advisor-cards-grid">
                        {hotSellers.map((item) => (
                            <div key={item._id} className="advisor-item-card">
                                <div className="advisor-item-top">
                                    <img
                                        src={item.image || 'https://placehold.co/60'}
                                        alt={item.name}
                                        className="advisor-item-img"
                                    />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div className="advisor-item-name">{item.name}</div>
                                        <div className="advisor-item-meta">
                                            {isAmharic
                                                ? `በመደብር: ${item.stockQuantity} ፍሬ`
                                                : `In shop: ${item.stockQuantity} units`}
                                        </div>
                                    </div>
                                    <span className="advisor-badge hot">
                                        {isAmharic ? item.badgeAm : item.badgeEn}
                                    </span>
                                </div>

                                <div className="advisor-plain-advice">
                                    {isAmharic ? item.adviceAm : item.adviceEn}
                                </div>

                                <div className="advisor-item-footer">
                                    <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        <ShoppingBag size={14} />
                                        {isAmharic
                                            ? `በዚህ ወር ${item.soldLast30Days} ተሸጧል`
                                            : `${item.soldLast30Days} sold this month`}
                                    </span>
                                    <button
                                        type="button"
                                        className="advisor-restock-btn"
                                        onClick={() => onQuickRestock && onQuickRestock(item, item.recommendedRestockQty)}
                                    >
                                        <PlusCircle size={15} />
                                        <span>{isAmharic ? 'ተጨማሪ ጨምር' : 'Add More Stock'}</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 5. NOT SELLING / CASH STUCK ON SHELF */}
            <div className="advisor-section">
                <div className="advisor-section-head">
                    <div>
                        <h3 className="advisor-section-title">
                            <Moon size={20} color="#6366f1" />
                            <span>
                                {isAmharic ? 'ሳይሸጡ የቆሙ እቃዎች — ዋጋ ይቀንሱ ወይም ያስተዋውቁ' : 'Not Selling — Cash Sitting On Shelf'}
                            </span>
                        </h3>
                        <p className="advisor-section-sub">
                            {isAmharic
                                ? 'እነዚህ እቃዎች ሳይሸጡ ገንዘብዎን ይዘው ቆመዋል። ትንሽ ቅናሽ ያድርጉ ወይም ባነር ላይ ያስተዋውቁ።'
                                : 'Your money is waiting in these items. Lower the price slightly or promote them to turn stock back into cash.'}
                        </p>
                    </div>
                </div>

                {notSelling.length === 0 ? (
                    <div className="advisor-empty-good">
                        {isAmharic
                            ? '✅ ሁሉም እቃዎችዎ በጥሩ ሁኔታ ላይ ናቸው — ሳይሸጥ የቆመ እቃ የለም!'
                            : 'Everything looks healthy — no old unsold stock sitting on your shelf right now.'}
                    </div>
                ) : (
                    <div className="advisor-cards-grid">
                        {notSelling.map((item) => (
                            <div key={item._id} className="advisor-item-card">
                                <div className="advisor-item-top">
                                    <img
                                        src={item.image || 'https://placehold.co/60'}
                                        alt={item.name}
                                        className="advisor-item-img"
                                    />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div className="advisor-item-name">{item.name}</div>
                                        <div className="advisor-item-meta">
                                            {isAmharic
                                                ? `${item.stockQuantity} ፍሬ • ETB ${item.shelfValue.toLocaleString()} ዋጋ`
                                                : `${item.stockQuantity} units • ETB ${item.shelfValue.toLocaleString()} value`}
                                        </div>
                                    </div>
                                    <span className="advisor-badge sleep">
                                        {isAmharic ? item.badgeAm : item.badgeEn}
                                    </span>
                                </div>

                                <div className="advisor-plain-advice">
                                    {isAmharic ? item.adviceAm : item.adviceEn}
                                </div>

                                <div className="advisor-item-footer">
                                    <span style={{ fontSize: '0.8rem', color: 'var(--admin-subtext, #64748b)', fontWeight: 600 }}>
                                        {isAmharic ? `ዋጋ: ETB ${item.price}` : `Price: ETB ${item.price}`}
                                    </span>
                                    <Link to={`/admin/products/edit/${item._id}`} className="advisor-promote-link">
                                        <Tag size={14} />
                                        <span>{isAmharic ? 'ዋጋ ቀይር' : 'Adjust Price'}</span>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 6. HEALTHY STOCK (PEACE OF MIND) */}
            {goodStock.length > 0 && (
                <div className="advisor-section">
                    <div className="advisor-section-head">
                        <div>
                            <h3 className="advisor-section-title">
                                <CheckCircle2 size={20} color="#10b981" />
                                <span>
                                    {isAmharic ? 'በቂ ክምችት ያላቸው እቃዎች (አያሳስብም)' : 'Good Stock — Everything Looks Great'}
                                </span>
                            </h3>
                        </div>
                    </div>

                    <div className="advisor-cards-grid">
                        {goodStock.map((item) => (
                            <div key={item._id} className="advisor-item-card">
                                <div className="advisor-item-top">
                                    <img
                                        src={item.image || 'https://placehold.co/60'}
                                        alt={item.name}
                                        className="advisor-item-img"
                                    />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div className="advisor-item-name">{item.name}</div>
                                        <div className="advisor-item-meta">
                                            {isAmharic
                                                ? `${item.stockQuantity} ፍሬ በመደብር`
                                                : `${item.stockQuantity} units ready`}
                                        </div>
                                    </div>
                                    <span className="advisor-badge good">
                                        {isAmharic ? item.badgeAm : item.badgeEn}
                                    </span>
                                </div>
                                <div className="advisor-plain-advice">
                                    {isAmharic ? item.adviceAm : item.adviceEn}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SmartStockAdvisor;
