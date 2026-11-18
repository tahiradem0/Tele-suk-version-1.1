import React from 'react';
import { FileBarChart2, Coins, BookOpen, Receipt } from 'lucide-react';
import AdminHub from '../../../components/admin/layout/AdminHub';
import FinancialReport from '../reports/FinancialReport';
import CapitalManagement from '../capital/CapitalManagement';
import ExpenseManagement from '../expenses/ExpenseManagement';
import DebtCreditManagement from '../debts/DebtCreditManagement';

const FinanceHub = () => (
    <AdminHub
        defaultTab="report"
        tabs={[
            { id: 'report', en: 'Money Report', am: 'የገንዘብ ሪፖርት', icon: FileBarChart2, component: FinancialReport },
            { id: 'cash', en: 'Shop Cash', am: 'የሱቅ ካሽ', icon: Coins, component: CapitalManagement },
            { id: 'expenses', en: 'Expenses', am: 'ወጪዎች', icon: BookOpen, component: ExpenseManagement },
            { id: 'debts', en: 'Debts & Credit', am: 'ብድር እና እዳ', icon: Receipt, component: DebtCreditManagement },
        ]}
    />
);

export default FinanceHub;
