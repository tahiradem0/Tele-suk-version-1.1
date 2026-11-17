import React, { useState, useEffect } from 'react';
import { Search, CreditCard, CheckCircle, XCircle } from 'lucide-react';
import { orderService } from '../../../services/api';
import { useAdminLanguage } from '../../../context/AdminLanguageContext';

const PaymentViewer = () => {
    const { isAmharic } = useAdminLanguage();
    const [payments, setPayments] = useState([]);

    useEffect(() => {
        loadPayments();
    }, []);

    const loadPayments = async () => {
        try {
            const { data } = await orderService.getAll();
            // Map orders to payment structure
            const mappedPayments = data.map(order => ({
                id: order.paymentResult?.id || `ORD-${order._id.slice(-6)}`,
                // _id: order._id, // Keep ref if needed
                provider: order.paymentMethod || (isAmharic ? 'ያልታወቀ' : 'Unknown'),
                amount: order.totalPrice,
                status: order.isPaid ? (isAmharic ? 'ተሳክቷል' : 'Success') : (isAmharic ? 'በመጠባበቅ ላይ' : 'Pending'),
                isPaid: order.isPaid,
                date: order.paidAt ? new Date(order.paidAt).toLocaleDateString() : new Date(order.createdAt).toLocaleDateString()
            }));
            setPayments(mappedPayments);
        } catch (error) {
            console.error("Failed to load payments", error);
        }
    };
    return (
        <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '700' }}>{isAmharic ? 'ክፍያዎች' : 'Payments'}</h1>
                <p style={{ color: '#868e96' }}>{isAmharic ? 'የግብይት ታሪክ (ለማየት ብቻ)' : 'Transaction history (Read-only)'}</p>
            </header>

            {/* Desktop Table */}
            <div className="desktop-table-container" style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden', display: 'none' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8f9fc', borderBottom: '1px solid #eee' }}>
                        <tr>
                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: '#868e96', fontWeight: '600' }}>{isAmharic ? 'የግብይት መለያ' : 'Transaction ID'}</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: '#868e96', fontWeight: '600' }}>{isAmharic ? 'አቅራቢ / ዘዴ' : 'Provider'}</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: '#868e96', fontWeight: '600' }}>{isAmharic ? 'መጠን' : 'Amount'}</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: '#868e96', fontWeight: '600' }}>{isAmharic ? 'ቀን' : 'Date'}</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: '#868e96', fontWeight: '600' }}>{isAmharic ? 'ሁኔታ' : 'Status'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.map((tx, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #f1f3f5' }}>
                                <td style={{ padding: '1rem', fontWeight: '500', fontFamily: 'monospace' }}>{tx.id}</td>
                                <td style={{ padding: '1rem' }}>{tx.provider}</td>
                                <td style={{ padding: '1rem', fontWeight: '600' }}>ETB {tx.amount}</td>
                                <td style={{ padding: '1rem', color: '#868e96' }}>{tx.date}</td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {tx.isPaid ? <CheckCircle size={16} color="#10b981" /> : <XCircle size={16} color="#f59e0b" />}
                                        <span style={{ color: tx.isPaid ? '#10b981' : '#f59e0b', fontWeight: '500' }}>{tx.status}</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile List */}
            <div className="mobile-grid" style={{ display: 'grid', gap: '1rem' }}>
                {payments.map((tx, idx) => (
                    <div key={idx} style={{ background: 'white', padding: '1rem', borderRadius: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>{tx.id}</span>
                            <span style={{ fontWeight: '600' }}>ETB {tx.amount}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '0.85rem', color: '#868e96' }}>{tx.provider} • {tx.date}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: tx.isPaid ? '#10b981' : '#f59e0b', fontWeight: '500' }}>
                                {tx.isPaid ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                {tx.status}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
        @media (min-width: 768px) {
            .desktop-table-container { display: block !important; }
            .mobile-grid { display: none !important; }
        }
      `}</style>

        </div>
    );
};

export default PaymentViewer;
