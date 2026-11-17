import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, productService, categoryService, orderService, bannerService, settingsService, deliveryLocationService } from '../services/api';

const ShopContext = createContext();

const defaultShopContext = {
    storeName: 'Gondar ሱቅ',
    products: [],
    categories: [],
    banners: [],
    cart: [],
    language: 'en',
    user: null,
    settings: { storeName: 'Gondar ሱቅ', deliveryFee: 5.00 },
    addToCart: () => {},
    removeFromCart: () => {},
    updateQuantity: () => {},
    clearCart: () => {},
    login: async () => ({ success: false }),
    logout: () => {},
    register: async () => ({ success: false }),
    refreshProducts: async () => {},
    refreshSettings: async () => {},
};

export const useShop = () => {
    const context = useContext(ShopContext);
    return context || defaultShopContext;
};

export const ShopProvider = ({ children }) => {
    // Global State
    const [cart, setCart] = useState([]);
    const [user, setUser] = useState(null);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [banners, setBanners] = useState([]);
    const [deliveryFee, setDeliveryFee] = useState(5.00);
    const [deliveryLocations, setDeliveryLocations] = useState([]);
    const [settings, setSettings] = useState({
        storeName: 'Gondar ሱቅ',
        storePhone: '0978787960',
        storeEmail: 'admin@gondarsuk.com',
        deliveryFee: 5.00
    });
    const storeName = settings?.storeName || 'Gondar ሱቅ';

    // Global Language
    const [language, setLanguage] = useState('en');

    // UI State
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState("All");
    const [isLoading, setIsLoading] = useState(true);
    const [isCartLoaded, setIsCartLoaded] = useState(false);

    // Initial Load
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // Check for logged in user
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    setUser(parsedUser);
                }

                // Fetch Products, Categories, Banners, Settings & Delivery Locations
                const [prodRes, catRes, banRes, setRes, locRes] = await Promise.all([
                    productService.getAll(),
                    categoryService.getAll(),
                    bannerService.getActive(),
                    settingsService.getSettings(),
                    deliveryLocationService.getAll().catch(() => ({ data: [] }))
                ]);

                if (prodRes.data) setProducts(prodRes.data);
                if (catRes.data) setCategories(catRes.data);
                if (banRes.data) setBanners(banRes.data);
                if (locRes && locRes.data) setDeliveryLocations(locRes.data);
                if (setRes.data) {
                    setSettings(setRes.data);
                    if (setRes.data.deliveryFee !== undefined) setDeliveryFee(setRes.data.deliveryFee);
                    if (setRes.data.storeName) {
                        document.title = `${setRes.data.storeName} | Shop Online`;
                    }
                }

                // Load Cart
                const savedCart = localStorage.getItem('cart');
                if (savedCart) {
                    try {
                        setCart(JSON.parse(savedCart));
                    } catch (e) {
                        console.error("Failed to parse cart", e);
                    }
                }
                setIsCartLoaded(true);

            } catch (error) {
                console.error("Failed to load initial data:", error);
                setIsCartLoaded(true); // Ensure we eventually allow updates
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialData();
    }, []);

    // Persist Cart
    useEffect(() => {
        if (isCartLoaded) {
            localStorage.setItem('cart', JSON.stringify(cart));
        }
    }, [cart, isCartLoaded]);

    // Refresh products list from server
    const refreshProducts = async () => {
        try {
            const prodRes = await productService.getAll();
            if (prodRes && prodRes.data) {
                setProducts(prodRes.data);
                return prodRes.data;
            }
        } catch (e) {
            console.error("Failed to refresh products:", e);
        }
    };

    // Refresh store settings from server
    const refreshSettings = async () => {
        try {
            const { data } = await settingsService.getSettings();
            if (data) {
                setSettings(data);
                if (data.deliveryFee !== undefined) setDeliveryFee(data.deliveryFee);
                if (data.storeName) {
                    document.title = `${data.storeName} | Shop Online`;
                }
                return data;
            }
        } catch (e) {
            console.error("Failed to refresh settings:", e);
        }
    };

    // Refresh delivery locations from server
    const refreshDeliveryLocations = async () => {
        try {
            const { data } = await deliveryLocationService.getAll();
            if (data) {
                setDeliveryLocations(data);
                return data;
            }
        } catch (e) {
            console.error("Failed to refresh delivery locations:", e);
        }
    };

    // --- Cart Actions ---
    const addToCart = (item, quantity = 1) => {
        const freshProduct = products.find(p => p._id === item._id) || item;
        const availableStock = Number(
            freshProduct.stockQuantity !== undefined 
                ? freshProduct.stockQuantity 
                : (freshProduct.countInStock || 0)
        );

        if (availableStock <= 0) {
            return { success: false, message: 'Item is out of stock' };
        }

        let reachedMax = false;
        setCart((prev) => {
            const existing = prev.find((i) => i._id === item._id);
            const currentQty = existing ? existing.quantity : 0;
            const targetQty = currentQty + quantity;
            const finalQty = Math.min(availableStock, targetQty);

            if (finalQty < targetQty || currentQty >= availableStock) {
                reachedMax = true;
            }

            if (existing) {
                return prev.map((i) =>
                    i._id === item._id ? { ...i, quantity: finalQty } : i
                );
            }
            return [...prev, { ...item, quantity: finalQty }];
        });

        return { 
            success: true, 
            reachedMax,
            availableStock 
        };
    };

    const removeFromCart = (itemId) => {
        setCart((prev) => prev.filter((i) => i._id !== itemId));
    };

    const updateQuantity = (itemId, delta) => {
        const freshProduct = products.find(p => p._id === itemId);
        const availableStock = freshProduct 
            ? Number(freshProduct.stockQuantity !== undefined ? freshProduct.stockQuantity : (freshProduct.countInStock || 999))
            : 999;

        setCart((prev) =>
            prev.map((i) => {
                if (i._id === itemId) {
                    const targetQty = i.quantity + delta;
                    const newQty = Math.max(1, Math.min(availableStock, targetQty));
                    return { ...i, quantity: newQty };
                }
                return i;
            })
        );
    };

    const clearCart = () => setCart([]);

    // --- Auth Actions ---
    const login = async (phone, password) => {
        try {
            const payload = phone ? { phone, password } : { password };
            const { data } = await authService.login(payload);
            setUser(data);
            localStorage.setItem('user', JSON.stringify(data));
            return { success: true };
        } catch (error) {
            console.error("Login failed:", error.response?.data?.message || error.message);
            return { success: false, error: error.response?.data?.message || 'Login failed' };
        }
    };

    const register = async (userData) => {
        try {
            const { data } = await authService.register(userData);
            setUser(data);
            localStorage.setItem('user', JSON.stringify(data));
            return { success: true };
        } catch (error) {
            console.error("Register failed:", error.response?.data?.message || error.message);
            return { success: false, error: error.response?.data?.message || 'Registration failed' };
        }
    }

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        // Optional: clear cart on logout
    };

    // --- Orders ---
    // Note: addTransaction in mock was doing logic, here we should probably call API.
    // But usually order creation happens at checkout. 
    // We can expose the orderService for components to use directly, or wrap it here.

    return (
        <ShopContext.Provider
            value={{
                cart,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                user,
                login,
                register,
                logout,
                isFilterOpen,
                setIsFilterOpen,
                activeCategory,
                setActiveCategory,
                products,
                categories,
                banners,
                isLoading,
                language,
                setLanguage,
                deliveryFee,
                setDeliveryFee,
                refreshProducts,
                settings,
                storeName,
                storePhone: settings?.storePhone || '0978787960',
                storeEmail: settings?.storeEmail || 'admin@gondarsuk.com',
                refreshSettings,
                deliveryLocations,
                refreshDeliveryLocations
            }}
        >
            {children}
        </ShopContext.Provider>
    );
};
