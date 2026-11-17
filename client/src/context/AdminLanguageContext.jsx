import React, { createContext, useContext, useState, useEffect } from 'react';

const AdminLanguageContext = createContext();

export const adminTranslations = {
    en: {
        // App & Navigation
        adminConsole: "Admin Console",
        dashboard: "Dashboard",
        storeAndStock: "Store & Stock",
        capitalTreasury: "Capital Treasury",
        debtAndCredit: "Debt & Credit",
        products: "Products",
        categories: "Categories",
        orders: "Orders",
        payments: "Payments",
        users: "Users",
        delivery: "Delivery",
        addresses: "Addresses",
        banners: "Banners",
        feedback: "Feedback",
        content: "Content",
        settings: "Settings",
        logout: "Logout",
        lightMode: "Light Mode",
        darkMode: "Dark Mode",
        language: "Language",
        english: "English",
        amharic: "Amharic",
        chapaLive: "CHAPA LIVE",
        chapaTest: "CHAPA TEST",

        // Dashboard
        welcomeBack: "Welcome back",
        dashboardOverview: "Here is your business performance at a glance.",
        totalRevenue: "Total Revenue",
        totalOrders: "Total Orders",
        totalProducts: "Total Products",
        totalUsers: "Total Users",
        recentOrders: "Recent Orders",
        topSellingProducts: "Top Selling Products",
        viewAll: "View All",
        quickSettings: "Quick Delivery Settings",
        standardDeliveryFee: "Standard Delivery Fee (ETB)",
        saveSettings: "Save Settings",
        netCapital: "Net Working Capital",
        totalStockUnits: "Total Stock Units",
        inventoryValue: "Total Inventory Value",
        lowStockAlerts: "Low Stock Alerts",
        totalReceivables: "Total Receivables (Customers Owe)",
        totalPayables: "Total Payables (You Owe Suppliers)",

        // Store & Stock
        storeManagement: "Store & Stock Management",
        manageStoreSubtitle: "Monitor inventory, restock goods, and manage warehouse products.",
        stockAlerts: "Stock Alerts",
        outOfStock: "Out of Stock",
        lowStock: "Low Stock",
        inStock: "In Stock",
        currentStock: "Current Stock",
        addStock: "Add Stock",
        reduceStock: "Reduce Stock",
        reorderLevel: "Reorder Level",
        itemsOut: "Items Out of Stock",
        itemsLow: "Items Running Low",
        batchRestock: "Batch Restock",
        searchProducts: "Search products by name or SKU...",

        // Delivery
        deliveryOperations: "Delivery Operations",
        deliverySubtitle: "Track active orders in transit, assign drivers, and manage fulfillment.",
        activeOrders: "Active Orders",
        preparing: "Preparing",
        onTheWay: "On the way",
        delivered: "Delivered",
        assignedDriver: "Assigned Driver",
        unassigned: "Unassigned",
        assign: "Assign",
        saveDriver: "Save Driver",
        customer: "Customer",
        destinationAddress: "Address",
        noActiveDeliveries: "No Active Deliveries",
        noDeliveriesDesc: "Orders marked as Preparing or On the way will appear here.",
        deliveryStatus: "Delivery Status",
        allActive: "All Active",

        // Addresses
        addressManagement: "Address Management",
        addressSubtitle: "Manage Gondar delivery locations, shortcuts, and areas for customer checkout autocomplete.",
        resetStandardLocations: "Reset Standard 14 Gondar Locations",
        addNewLocation: "Add New Gondar Delivery Location",
        addressName: "Address Name",
        shortCode: "Short Code / Shortcut",
        zoneLandmark: "Sub-city / Zone / Landmark",
        registeredLocations: "Registered Locations",
        editDeliveryAddress: "Edit Delivery Address",
        userShortcut: "User shortcut",
        identifiesArea: "Helps identify the area",
        noLocationsFound: "No Locations Found",
        updateDetailsForCustomer: "Update details for Gondar customer suggestions",

        // Capital & Debts
        capitalManagement: "Capital & Treasury",
        debtCreditManagement: "Debt & Credit Management",
        cashInflow: "Total Cash Inflow",
        cashOutflow: "Total Cash Outflow",
        addTransaction: "Add Transaction",
        customerDebts: "Customer Debts",
        supplierCredits: "Supplier Credits",

        // Common Actions & Form Fields
        add: "Add",
        edit: "Edit",
        delete: "Delete",
        save: "Save",
        saveChanges: "Save Changes",
        saving: "Saving...",
        cancel: "Cancel",
        search: "Search",
        searchPlaceholder: "Search...",
        filter: "Filter",
        all: "All",
        loading: "Loading...",
        confirmDelete: "Are you sure you want to delete",
        success: "Success",
        error: "Error",
        actions: "Actions",
        status: "Status",
        date: "Date",
        price: "Price",
        total: "Total",
        phone: "Phone",
        email: "Email",
        close: "Close",
        savedToDatabase: "Saved to Database!"
    },
    am: {
        // App & Navigation
        adminConsole: "የአስተዳዳሪ መቆጣጠሪያ",
        dashboard: "ዳሽቦርድ",
        storeAndStock: "መደብር እና ክምችት",
        capitalTreasury: "የካፒታል ግምጃ ቤት",
        debtAndCredit: "ብድር እና እዳ",
        products: "ምርቶች",
        categories: "ምድቦች",
        orders: "ትዕዛዞች",
        payments: "ክፍያዎች",
        users: "ተጠቃሚዎች",
        delivery: "የማድረስ አገልግሎት",
        addresses: "አድራሻዎች",
        banners: "ባነሮች",
        feedback: "አስተያየቶች",
        content: "ይዘት አስተዳደር",
        settings: "ቅንብሮች",
        logout: "ውጣ",
        lightMode: "ቀላል ሁነታ",
        darkMode: "ጨለማ ሁነታ",
        language: "ቋንቋ",
        english: "English",
        amharic: "አማርኛ",
        chapaLive: "ቻፓ ቀጥታ",
        chapaTest: "ቻፓ የሙከራ",

        // Dashboard
        welcomeBack: "እንኳን ደህና መጡ",
        dashboardOverview: "የንግድዎ አጠቃላይ አፈጻጸም በጨረፍታ።",
        totalRevenue: "ጠቅላላ ገቢ",
        totalOrders: "ጠቅላላ ትዕዛዞች",
        totalProducts: "ጠቅላላ ምርቶች",
        totalUsers: "ጠቅላላ ተጠቃሚዎች",
        recentOrders: "የቅርብ ጊዜ ትዕዛዞች",
        topSellingProducts: "ተወዳጅ ምርቶች",
        viewAll: "ሁሉንም ተመልከት",
        quickSettings: "የማድረሻ ክፍያ ፈጣን ቅንብር",
        standardDeliveryFee: "መደበኛ የማድረሻ ክፍያ (የኢትዮጵያ ብር)",
        saveSettings: "ቅንብሮችን መዝግብ",
        netCapital: "የተጣራ የስራ ካፒታል",
        totalStockUnits: "ጠቅላላ የክምችት ብዛት",
        inventoryValue: "ጠቅላላ የክምችት ዋጋ",
        lowStockAlerts: "የአነስተኛ ክምችት ማስጠንቀቂያዎች",
        totalReceivables: "የሚሰበሰብ ገንዘብ (ደንበኞች ያሉባቸው)",
        totalPayables: "የሚከፈል እዳ (ለአቅራቢዎች የሚከፈል)",

        // Store & Stock
        storeManagement: "የመደብር እና ክምችት አስተዳደር",
        manageStoreSubtitle: "የእቃ ክምችትን ይቆጣጠሩ፣ ያሟሉ እና የመጋዘን ምርቶችን ያስተዳድሩ።",
        stockAlerts: "የክምችት ማስጠንቀቂያዎች",
        outOfStock: "ያለቀ እቃ",
        lowStock: "አነስተኛ ክምችት",
        inStock: "በክምችት ላይ ያለ",
        currentStock: "የአሁኑ ክምችት",
        addStock: "ክምችት ጨምር",
        reduceStock: "ክምችት ቀንስ",
        reorderLevel: "የማዘዣ ደረጃ",
        itemsOut: "ያለቁ እቃዎች",
        itemsLow: "እያለቁ ያሉ እቃዎች",
        batchRestock: "በጅምላ ክምችት ሙላ",
        searchProducts: "ምርቶችን በስም ወይም በኮድ ይፈልጉ...",

        // Delivery
        deliveryOperations: "የማድረስ ስራዎች",
        deliverySubtitle: "በመንገድ ላይ ያሉ ትዕዛዞችን ይከታተሉ፣ አድራሾችን ይመድቡ እና አፈጻጸምን ያስተዳድሩ።",
        activeOrders: "ንቁ ትዕዛዞች",
        preparing: "በዝግጅት ላይ",
        onTheWay: "በመንገድ ላይ",
        delivered: "ደርሷል",
        assignedDriver: "የተመደበ አድራሽ",
        unassigned: "ያልተመደበ",
        assign: "መድብ",
        saveDriver: "አድራሽ መዝግብ",
        customer: "ደንበኛ",
        destinationAddress: "አድራሻ",
        noActiveDeliveries: "ምንም ንቁ ማድረስ የለም",
        noDeliveriesDesc: "በዝግጅት ላይ ወይም በመንገድ ላይ ያሉ ትዕዛዞች እዚህ ይታያሉ።",
        deliveryStatus: "የማድረስ ሁኔታ",
        allActive: "ሁሉም ንቁ",

        // Addresses
        addressManagement: "የአድራሻ አስተዳደር",
        addressSubtitle: "ለደንበኞች ክፍያ አድራሻ አውቶኮምፕሊት የጎንደር መዳረሻዎችን፣ አቋራጮችን እና ዞኖችን ያስተዳድሩ።",
        resetStandardLocations: "መደበኛ 14 የጎንደር ቦታዎችን መልስ",
        addNewLocation: "አዲስ የጎንደር ማድረሻ ቦታ ጨምር",
        addressName: "የአድራሻ ስም",
        shortCode: "አጭር ኮድ / አቋራጭ",
        zoneLandmark: "ክፍለ-ከተማ / ዞን / መለያ ቦታ",
        registeredLocations: "የተመዘገቡ ቦታዎች",
        editDeliveryAddress: "የማድረሻ አድራሻ አርትዕ",
        userShortcut: "የተጠቃሚ አቋራጭ",
        identifiesArea: "አካባቢውን ለመለየት ይረዳል",
        noLocationsFound: "ምንም ቦታ አልተገኘም",
        updateDetailsForCustomer: "ለጎንደር ደንበኞች ጥቆማ ዝርዝሮችን ያዘምኑ",

        // Capital & Debts
        capitalManagement: "ካፒታል እና ግምጃ ቤት",
        debtCreditManagement: "ብድር እና እዳ አስተዳደር",
        cashInflow: "ጠቅላላ የገንዘብ ገቢ",
        cashOutflow: "ጠቅላላ የገንዘብ ወጪ",
        addTransaction: "ዝውውር ጨምር",
        customerDebts: "የደንበኞች እዳ",
        supplierCredits: "የአቅራቢዎች ብድር",

        // Common Actions & Form Fields
        add: "ጨምር",
        edit: "አርትዕ",
        delete: "አጥፋ",
        save: "መዝግብ",
        saveChanges: "ለውጦችን መዝግብ",
        saving: "በመመዝገብ ላይ...",
        cancel: "ይቅር",
        search: "ፈልግ",
        searchPlaceholder: "ፈልግ...",
        filter: "አጣራ",
        all: "ሁሉም",
        loading: "በመጫን ላይ...",
        confirmDelete: "ማጥፋትዎን እርግጠኛ ነዎት",
        success: "ተሳክቷል",
        error: "ስህተት",
        actions: "እርምጃዎች",
        status: "ሁኔታ",
        date: "ቀን",
        price: "ዋጋ",
        total: "ጠቅላላ",
        phone: "ስልክ",
        email: "ኢሜይል",
        close: "ዝጋ",
        savedToDatabase: "ወደ ዳታቤዝ ተመዝግቧል!"
    }
};

export const useAdminLanguage = () => {
    const context = useContext(AdminLanguageContext);
    if (!context) {
        return {
            language: 'en',
            setLanguage: () => {},
            toggleLanguage: () => {},
            isAmharic: false,
            t: (key, fallback) => fallback || key
        };
    }
    return context;
};

export const AdminLanguageProvider = ({ children }) => {
    const [language, setLanguageState] = useState(() => {
        return localStorage.getItem('admin_language') || 'en';
    });

    const setLanguage = (lang) => {
        const target = lang === 'am' ? 'am' : 'en';
        setLanguageState(target);
        localStorage.setItem('admin_language', target);
    };

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'am' : 'en');
    };

    const isAmharic = language === 'am';

    const t = (key, fallback) => {
        const dict = adminTranslations[language] || adminTranslations.en;
        if (dict && dict[key] !== undefined) {
            return dict[key];
        }
        return fallback !== undefined ? fallback : (adminTranslations.en[key] || key);
    };

    useEffect(() => {
        localStorage.setItem('admin_language', language);
    }, [language]);

    return (
        <AdminLanguageContext.Provider value={{
            language,
            setLanguage,
            toggleLanguage,
            isAmharic,
            t
        }}>
            {children}
        </AdminLanguageContext.Provider>
    );
};

export default AdminLanguageContext;
