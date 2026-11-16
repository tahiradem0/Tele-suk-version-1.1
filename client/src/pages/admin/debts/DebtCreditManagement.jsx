import React, { useState, useEffect } from 'react';
import {
    Receipt, UserMinus, UserPlus, Search, Plus, CheckCircle2,
    Clock, AlertCircle, RefreshCw, Calendar, Phone, DollarSign,
    History, Trash2, ArrowRight
} from 'lucide-react';
import { debtService } from '../../../services/api';

const DebtCreditManagement = () => {
    const [debts, setDebts] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    // Filters
    const [activeTab, setActiveTab] = useState('receivable'); // 'receivable' | 'payable' | 'all'
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'partially_paid' | 'settled'
    const [searchTerm, setSearchTerm] = useState('');

    // Modals
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [payModalOpen, setPayModalOpen] = useState(false);
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [selectedDebt, setSelectedDebt] = useState(null);

    // New Debt Form
    const [newDebtForm, setNewDebtForm] = useState({
        type: 'receivable',
        personName: '',
        phone: '',
        title: '',
        totalAmount: '',
        dueDate: '',
        notes: ''
    });

    // Payment Form
    const [payForm, setPayForm] = useState({
        amount: '',
        paymentMethod: 'Cash',
        note: '',
        syncCapital: true
    });

    useEffect(() => {
        loadData();
    }, [activeTab, statusFilter]);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await debtService.getDebts({
                type: activeTab !== 'all' ? activeTab : undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined
            });
            setDebts(res.data.debts || []);
            setSummary(res.data.summary);
        } catch (error) {
            console.error("Failed to load debts", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAddModal = (defaultType = 'receivable') => {
        setNewDebtForm({
            type: defaultType,
            personName: '',
            phone: '',
            title: '',
            totalAmount: '',
            dueDate: '',
            notes: ''
        });
        setAddModalOpen(true);
    };

    const handleCreateDebt = async (e) => {
        e.preventDefault();
        try {
            await debtService.create({
                ...newDebtForm,
                totalAmount: Number(newDebtForm.totalAmount),
                dueDate: newDebtForm.dueDate || undefined
            });
            alert('Record created successfully!');
            setAddModalOpen(false);
            loadData();
        } catch (error) {
            alert('Failed to create record: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleOpenPayModal = (debt) => {
        setSelectedDebt(debt);
        setPayForm({
            amount: debt.balance.toString(),
            paymentMethod: 'Cash',
            note: '',
            syncCapital: true
        });
        setPayModalOpen(true);
    };

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        try {
            await debtService.recordPayment(selectedDebt._id, {
                amount: Number(payForm.amount),
                paymentMethod: payForm.paymentMethod,
                note: payForm.note,
                syncCapital: payForm.syncCapital
            });
            alert('Payment recorded and synced successfully!');
            setPayModalOpen(false);
            loadData();
        } catch (error) {
            alert('Failed to record payment: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleOpenHistory = (debt) => {
        setSelectedDebt(debt);
        setHistoryModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this debt/credit record?')) {
            try {
                await debtService.delete(id);
                loadData();
            } catch (error) {
                alert('Failed to delete debt record');
            }
        }
    };

    const filteredDebts = debts.filter(d =>
        d.personName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.phone.includes(searchTerm) ||
        d.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const now = new Date();

    return (
        <div style={{ padding: '1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1a1b1e', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Receipt color="#228be6" size={28} />
                        Debt & Credit Ledger Management
                    </h1>
                    <p style={{ color: '#868e96', fontSize: '0.95rem' }}>
                        Customer receivables (ገንዘብ ያለባቸው ሰዎች) and supplier payables (የሱቁ ዕዳዎች)
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        onClick={() => handleOpenAddModal('receivable')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.2rem',
                            borderRadius: '12px',
                            background: '#1a1b1e',
                            color: 'white',
                            border: 'none',
                            fontWeight: '600',
                            cursor: 'pointer',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                        }}
                    >
                        <Plus size={18} />
                        + Add Customer Credit
                    </button>
                    <button
                        onClick={() => handleOpenAddModal('payable')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.2rem',
                            borderRadius: '12px',
                            background: '#495057',
                            color: 'white',
                            border: 'none',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        <Plus size={18} />
                        + Add Supplier Debt
                    </button>
                </div>
            </div>

            {/* Ledger Balance Metrics Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1.2rem',
                marginBottom: '2rem'
            }}>
                {/* Receivables */}
                <div style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '18px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    borderLeft: '6px solid #10b981'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#868e96', fontSize: '0.9rem' }}>
                        <span>Customer Credit (Receivables)</span>
                        <UserPlus size={20} color="#10b981" />
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: '800', color: '#10b981', marginTop: '0.5rem' }}>
                        ETB {(summary?.totalReceivableRemaining || 0).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#868e96', marginTop: '0.3rem' }}>
                        Customers owe to our store (Total: ETB {(summary?.totalReceivable || 0).toLocaleString()})
                    </div>
                </div>

                {/* Payables */}
                <div style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '18px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    borderLeft: '6px solid #fa5252'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#868e96', fontSize: '0.9rem' }}>
                        <span>Store Liabilities (Payables)</span>
                        <UserMinus size={20} color="#fa5252" />
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: '800', color: '#fa5252', marginTop: '0.5rem' }}>
                        ETB {(summary?.totalPayableRemaining || 0).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#868e96', marginTop: '0.3rem' }}>
                        Store owes to suppliers & lenders (Total: ETB {(summary?.totalPayable || 0).toLocaleString()})
                    </div>
                </div>

                {/* Net Position */}
                <div style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '18px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#868e96', fontSize: '0.9rem' }}>
                        <span>Net Credit Position</span>
                        <DollarSign size={20} color="#228be6" />
                    </div>
                    <div style={{
                        fontSize: '2rem',
                        fontWeight: '800',
                        color: (summary?.netCreditPosition || 0) >= 0 ? '#10b981' : '#fa5252',
                        marginTop: '0.5rem'
                    }}>
                        ETB {(summary?.netCreditPosition || 0).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#868e96', marginTop: '0.3rem' }}>
                        {(summary?.overdueCount || 0) > 0 ? (
                            <span style={{ color: '#e03131', fontWeight: '600' }}>⚠️ {summary.overdueCount} records overdue!</span>
                        ) : 'All due dates healthy'}
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #eee', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => setActiveTab('receivable')}
                    style={{
                        padding: '0.8rem 1.4rem',
                        fontWeight: '700',
                        fontSize: '0.95rem',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        color: activeTab === 'receivable' ? '#10b981' : '#868e96',
                        borderBottom: activeTab === 'receivable' ? '3px solid #10b981' : 'none',
                        marginBottom: '-2px'
                    }}
                >
                    Customer Credit (Receivables)
                </button>
                <button
                    onClick={() => setActiveTab('payable')}
                    style={{
                        padding: '0.8rem 1.4rem',
                        fontWeight: '700',
                        fontSize: '0.95rem',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        color: activeTab === 'payable' ? '#fa5252' : '#868e96',
                        borderBottom: activeTab === 'payable' ? '3px solid #fa5252' : 'none',
                        marginBottom: '-2px'
                    }}
                >
                    Store Debts (Payables to Suppliers)
                </button>
                <button
                    onClick={() => setActiveTab('all')}
                    style={{
                        padding: '0.8rem 1.4rem',
                        fontWeight: '700',
                        fontSize: '0.95rem',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        color: activeTab === 'all' ? '#1a1b1e' : '#868e96',
                        borderBottom: activeTab === 'all' ? '3px solid #1a1b1e' : 'none',
                        marginBottom: '-2px'
                    }}
                >
                    All Records
                </button>
            </div>

            {/* Search and Status Filter */}
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
                        placeholder="Search by name, phone number, or reason..."
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
                    <option value="all">All Payment Statuses</option>
                    <option value="pending">Pending Unpaid</option>
                    <option value="partially_paid">Partially Paid</option>
                    <option value="settled">Fully Settled</option>
                </select>
            </div>

            {/* Debt Table */}
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
                            <th style={{ padding: '1rem' }}>PERSON / CONTACT</th>
                            <th style={{ padding: '1rem' }}>TYPE</th>
                            <th style={{ padding: '1rem' }}>DETAILS / REASON</th>
                            <th style={{ padding: '1rem' }}>TOTAL / PAID</th>
                            <th style={{ padding: '1rem' }}>REMAINING BALANCE</th>
                            <th style={{ padding: '1rem' }}>DUE DATE</th>
                            <th style={{ padding: '1rem' }}>STATUS</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDebts.map(debt => {
                            const isOverdue = debt.dueDate && new Date(debt.dueDate) < now && debt.status !== 'settled';

                            return (
                                <tr key={debt._id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: '700', color: '#1a1b1e', fontSize: '0.95rem' }}>
                                            {debt.personName}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#868e96', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                            <Phone size={12} />
                                            {debt.phone}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            fontSize: '0.75rem',
                                            fontWeight: '700',
                                            background: debt.type === 'receivable' ? '#ebfbee' : '#fff5f5',
                                            color: debt.type === 'receivable' ? '#2b8a3e' : '#c92a2a'
                                        }}>
                                            {debt.type === 'receivable' ? 'RECEIVABLE (CUSTOMER)' : 'PAYABLE (SUPPLIER)'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', maxWidth: '200px' }}>
                                        <div style={{ fontWeight: '500', color: '#1a1b1e', fontSize: '0.9rem' }}>{debt.title}</div>
                                        {debt.notes && (
                                            <div style={{ fontSize: '0.8rem', color: '#868e96', marginTop: '2px' }}>{debt.notes}</div>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: '600', color: '#1a1b1e' }}>
                                            ETB {debt.totalAmount.toLocaleString()}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#10b981' }}>
                                            Paid: ETB {(debt.paidAmount || 0).toLocaleString()}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{
                                            fontWeight: '800',
                                            fontSize: '1.05rem',
                                            color: debt.balance === 0 ? '#10b981' : debt.type === 'receivable' ? '#10b981' : '#fa5252'
                                        }}>
                                            ETB {debt.balance.toLocaleString()}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {debt.dueDate ? (
                                            <div>
                                                <div style={{ fontSize: '0.85rem', color: isOverdue ? '#fa5252' : '#495057', fontWeight: isOverdue ? '700' : '500' }}>
                                                    {new Date(debt.dueDate).toLocaleDateString()}
                                                </div>
                                                {isOverdue && (
                                                    <span style={{ fontSize: '0.75rem', color: '#e03131', fontWeight: '700' }}>Overdue!</span>
                                                )}
                                            </div>
                                        ) : (
                                            <span style={{ color: '#ced4da', fontSize: '0.85rem' }}>No due date</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            fontSize: '0.8rem',
                                            fontWeight: '700',
                                            background: debt.status === 'settled' ? '#ebfbee' : debt.status === 'partially_paid' ? '#e7f5ff' : '#fff9db',
                                            color: debt.status === 'settled' ? '#2b8a3e' : debt.status === 'partially_paid' ? '#1c7ed6' : '#f08c00'
                                        }}>
                                            {debt.status === 'settled' ? 'SETTLED' : debt.status === 'partially_paid' ? 'PARTIAL' : 'PENDING'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                            {debt.status !== 'settled' && (
                                                <button
                                                    onClick={() => handleOpenPayModal(debt)}
                                                    style={{
                                                        background: '#10b981',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '0.45rem 0.85rem',
                                                        borderRadius: '8px',
                                                        fontSize: '0.85rem',
                                                        fontWeight: '600',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Record Repayment
                                                </button>
                                            )}
                                            {debt.paymentHistory?.length > 0 && (
                                                <button
                                                    onClick={() => handleOpenHistory(debt)}
                                                    title="View payment audit"
                                                    style={{
                                                        background: '#f1f3f5',
                                                        border: '1px solid #dee2e6',
                                                        padding: '0.45rem 0.65rem',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <History size={16} color="#495057" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(debt._id)}
                                                title="Delete record"
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: '#ced4da',
                                                    cursor: 'pointer',
                                                    padding: '0.45rem'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.color = '#fa5252'}
                                                onMouseLeave={(e) => e.currentTarget.style.color = '#ced4da'}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredDebts.length === 0 && (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#868e96' }}>
                                    No credit/debt records found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Record Modal */}
            {addModalOpen && (
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
                        maxWidth: '500px',
                        width: '100%',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                    }}>
                        <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '1.2rem' }}>
                            {newDebtForm.type === 'receivable' ? '+ New Customer Credit (Receivable)' : '+ New Store Debt (Payable)'}
                        </h2>

                        <form onSubmit={handleCreateDebt} style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                                    Record Type *
                                </label>
                                <select
                                    value={newDebtForm.type}
                                    onChange={(e) => setNewDebtForm({ ...newDebtForm, type: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #ced4da', background: 'white' }}
                                >
                                    <option value="receivable">Customer Credit (Customer owes our store)</option>
                                    <option value="payable">Store Liability (Store owes supplier/creditor)</option>
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                                        Person / Entity Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Abebe Kebede"
                                        value={newDebtForm.personName}
                                        onChange={(e) => setNewDebtForm({ ...newDebtForm, personName: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #ced4da' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                                        Phone Number *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="0911223344"
                                        value={newDebtForm.phone}
                                        onChange={(e) => setNewDebtForm({ ...newDebtForm, phone: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #ced4da' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                                    Reason / Items Purchased *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. 5x Coffee packs + Cooking Oil"
                                    value={newDebtForm.title}
                                    onChange={(e) => setNewDebtForm({ ...newDebtForm, title: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #ced4da' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                                        Total Amount in ETB *
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        step="any"
                                        required
                                        placeholder="e.g. 2400"
                                        value={newDebtForm.totalAmount}
                                        onChange={(e) => setNewDebtForm({ ...newDebtForm, totalAmount: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #ced4da' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                                        Due Date (Optional)
                                    </label>
                                    <input
                                        type="date"
                                        value={newDebtForm.dueDate}
                                        onChange={(e) => setNewDebtForm({ ...newDebtForm, dueDate: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #ced4da' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                                    Notes (Optional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Promised to pay by end of the week"
                                    value={newDebtForm.notes}
                                    onChange={(e) => setNewDebtForm({ ...newDebtForm, notes: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #ced4da' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setAddModalOpen(false)}
                                    style={{ flex: 1, padding: '0.8rem', borderRadius: '10px', border: '1px solid #ced4da', background: 'white', fontWeight: '600', cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{ flex: 1, padding: '0.8rem', borderRadius: '10px', border: 'none', background: '#1a1b1e', color: 'white', fontWeight: '600', cursor: 'pointer' }}
                                >
                                    Save Record
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Record Repayment Modal */}
            {payModalOpen && selectedDebt && (
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
                        maxWidth: '460px',
                        width: '100%',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                    }}>
                        <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '0.3rem' }}>
                            Record Payment: {selectedDebt.personName}
                        </h2>
                        <p style={{ color: '#868e96', fontSize: '0.85rem', marginBottom: '1.2rem' }}>
                            Remaining balance: <strong style={{ color: '#1a1b1e' }}>ETB {selectedDebt.balance.toLocaleString()}</strong>
                        </p>

                        <form onSubmit={handleRecordPayment} style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                                    Amount to Pay in ETB *
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max={selectedDebt.balance}
                                    step="any"
                                    required
                                    value={payForm.amount}
                                    onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #ced4da' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                                    Payment Method *
                                </label>
                                <select
                                    value={payForm.paymentMethod}
                                    onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #ced4da', background: 'white' }}
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Telebirr">Telebirr</option>
                                    <option value="CBEBirr">CBEBirr</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            {/* Auto Sync with Capital Treasury */}
                            <div style={{
                                background: '#f8f9fa',
                                padding: '1rem',
                                borderRadius: '12px',
                                border: '1px solid #dee2e6'
                            }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={payForm.syncCapital}
                                        onChange={(e) => setPayForm({ ...payForm, syncCapital: e.target.checked })}
                                    />
                                    Sync to Capital Management Treasury
                                </label>
                                <div style={{ fontSize: '0.8rem', color: '#868e96', marginTop: '0.3rem' }}>
                                    {selectedDebt.type === 'receivable'
                                        ? '✨ Will automatically record an INFLOW into your Capital treasury'
                                        : '✨ Will automatically record an OUTFLOW from your Capital treasury'}
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                                    Payment Reference / Note
                                </label>
                                <input
                                    type="text"
                                    placeholder="Optional note"
                                    value={payForm.note}
                                    onChange={(e) => setPayForm({ ...payForm, note: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #ced4da' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setPayModalOpen(false)}
                                    style={{ flex: 1, padding: '0.8rem', borderRadius: '10px', border: '1px solid #ced4da', background: 'white', fontWeight: '600', cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{ flex: 1, padding: '0.8rem', borderRadius: '10px', border: 'none', background: '#10b981', color: 'white', fontWeight: '600', cursor: 'pointer' }}
                                >
                                    Confirm Payment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Payment History Audit Modal */}
            {historyModalOpen && selectedDebt && (
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
                        maxWidth: '500px',
                        width: '100%',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                    }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.3rem' }}>
                            Payment Audit: {selectedDebt.personName}
                        </h2>
                        <p style={{ color: '#868e96', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                            Total: ETB {selectedDebt.totalAmount.toLocaleString()} | Paid: ETB {(selectedDebt.paidAmount || 0).toLocaleString()} | Balance: ETB {selectedDebt.balance.toLocaleString()}
                        </p>

                        <div style={{ display: 'grid', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
                            {(selectedDebt.paymentHistory || []).map((p, idx) => (
                                <div key={idx} style={{
                                    background: '#f8f9fa',
                                    padding: '0.85rem',
                                    borderRadius: '10px',
                                    border: '1px solid #e9ecef',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: '700', color: '#1a1b1e' }}>
                                            ETB {p.amount.toLocaleString()}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#868e96' }}>
                                            {p.paymentMethod} {p.note && `• ${p.note}`}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#868e96' }}>
                                        {new Date(p.date).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={() => setHistoryModalOpen(false)}
                            style={{
                                width: '100%',
                                marginTop: '1.5rem',
                                padding: '0.75rem',
                                borderRadius: '10px',
                                border: '1px solid #ced4da',
                                background: '#1a1b1e',
                                color: 'white',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DebtCreditManagement;
