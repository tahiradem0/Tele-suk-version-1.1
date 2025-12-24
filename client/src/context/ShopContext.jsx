import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, productService, categoryService, orderService, bannerService } from '../services/api';

const ShopContext = createContext();

export const useShop = () => useContext(ShopContext);

export const ShopProvider = ({ children }) => {
    // Global State
    const [cart, setCart] = useState([]);
    const [user, setUser] = useState(null);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [banners, setBanners] = useState([]);

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

                // Fetch Products, Categories & Banners
                const [prodRes, catRes, banRes] = await Promise.all([
                    productService.getAll(),
                    categoryService.getAll(),
                    bannerService.getActive()
                ]);

                if (prodRes.data) setProducts(prodRes.data);
                if (catRes.data) setCategories(catRes.data);
                if (banRes.data) setBanners(banRes.data);

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

    // --- Cart Actions ---
    const addToCart = (item, quantity = 1) => {
        setCart((prev) => {
            const existing = prev.find((i) => i._id === item._id); // Use _id from MongoDB
            if (existing) {
                return prev.map((i) =>
                    i._id === item._id ? { ...i, quantity: i.quantity + quantity } : i
                );
            }
            return [...prev, { ...item, quantity }];
        });
    };

    const removeFromCart = (itemId) => {
        setCart((prev) => prev.filter((i) => i._id !== itemId));
    };

    const updateQuantity = (itemId, delta) => {
        setCart((prev) =>
            prev.map((i) => {
                if (i._id === itemId) {
                    const newQty = Math.max(1, i.quantity + delta);
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
            const { data } = await authService.login({ phone, password });
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
                isLoading
            }}
        >
            {children}
        </ShopContext.Provider>
    );
};
