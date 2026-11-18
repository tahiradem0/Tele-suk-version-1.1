import React from 'react';
import { Settings, Image } from 'lucide-react';
import AdminHub from '../../../components/admin/layout/AdminHub';
import AdminSettings from '../settings/AdminSettings';
import BannerManager from '../banners/BannerManager';

const SettingsHub = () => (
    <AdminHub
        defaultTab="shop"
        tabs={[
            { id: 'shop', en: 'Shop & Payments', am: 'ሱቅ እና ክፍያ', icon: Settings, component: AdminSettings },
            { id: 'banners', en: 'Home Banners', am: 'የመነሻ ባነሮች', icon: Image, component: BannerManager },
        ]}
    />
);

export default SettingsHub;
