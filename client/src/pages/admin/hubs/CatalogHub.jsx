import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Warehouse, ShoppingBag, FolderTree } from 'lucide-react';
import AdminHub from '../../../components/admin/layout/AdminHub';
import StoreManagement from '../store/StoreManagement';
import ProductList from '../products/ProductList';
import CategoryManager from '../categories/CategoryManager';

const CatalogHub = () => {
    const [searchParams] = useSearchParams();
    const initialStoreSubTab = searchParams.get('view') === 'advisor' ? 'advisor' : undefined;

    return (
        <AdminHub
            defaultTab="stock"
            tabs={[
                {
                    id: 'stock',
                    en: 'Stock & Advice',
                    am: 'ክምችት እና ምክር',
                    icon: Warehouse,
                    render: () => <StoreManagement initialTab={initialStoreSubTab} />,
                },
                { id: 'products', en: 'Products', am: 'ምርቶች', icon: ShoppingBag, component: ProductList },
                { id: 'categories', en: 'Categories', am: 'ምድቦች', icon: FolderTree, component: CategoryManager },
            ]}
        />
    );
};

export default CatalogHub;
