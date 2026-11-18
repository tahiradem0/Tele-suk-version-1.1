import React from 'react';
import { Send, Share2, Users } from 'lucide-react';
import AdminHub from '../../../components/admin/layout/AdminHub';
import CustomerMarketing from '../crm/CustomerMarketing';
import AffiliateManager from '../affiliates/AffiliateManager';
import UserManager from '../users/UserManager';

const CustomersHub = () => (
    <AdminHub
        defaultTab="sms"
        tabs={[
            { id: 'sms', en: 'Customers & SMS', am: 'ደንበኞች እና SMS', icon: Send, component: CustomerMarketing },
            { id: 'promoters', en: 'Promoters', am: 'አስተዋዋቂዎች', icon: Share2, component: AffiliateManager },
            { id: 'accounts', en: 'Accounts', am: 'መለያዎች', icon: Users, component: UserManager },
        ]}
    />
);

export default CustomersHub;
