import React from 'react';
import { ShoppingCart, Truck, CreditCard, MapPin } from 'lucide-react';
import AdminHub from '../../../components/admin/layout/AdminHub';
import OrderList from '../orders/OrderList';
import DeliveryManager from '../delivery/DeliveryManager';
import PaymentViewer from '../payments/PaymentViewer';
import AddressManager from '../addresses/AddressManager';

const SalesHub = () => (
    <AdminHub
        defaultTab="orders"
        tabs={[
            { id: 'orders', en: 'Orders', am: 'ትዕዛዞች', icon: ShoppingCart, component: OrderList },
            { id: 'delivery', en: 'Delivery', am: 'ማድረስ', icon: Truck, component: DeliveryManager },
            { id: 'payments', en: 'Payments', am: 'ክፍያዎች', icon: CreditCard, component: PaymentViewer },
            { id: 'areas', en: 'Delivery Areas', am: 'የማድረሻ ቦታዎች', icon: MapPin, component: AddressManager },
        ]}
    />
);

export default SalesHub;
