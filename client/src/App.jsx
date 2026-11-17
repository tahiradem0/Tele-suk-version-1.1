import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ShopProvider } from './context/ShopContext'
import { ToastProvider } from './context/ToastContext'
import { AdminThemeProvider } from './context/AdminThemeContext'
import UserLayout from './components/layout/UserLayout'
import AdminLayout from './components/admin/layout/AdminLayout'
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import ProductList from './pages/admin/products/ProductList'
import ProductForm from './pages/admin/products/ProductForm'
import CategoryManager from './pages/admin/categories/CategoryManager'
import OrderList from './pages/admin/orders/OrderList'
import PaymentViewer from './pages/admin/payments/PaymentViewer'
import UserManager from './pages/admin/users/UserManager'
import DeliveryManager from './pages/admin/delivery/DeliveryManager'
import AddressManager from './pages/admin/addresses/AddressManager'
import BannerManager from './pages/admin/banners/BannerManager'
import StoreManagement from './pages/admin/store/StoreManagement'
import CapitalManagement from './pages/admin/capital/CapitalManagement'
import DebtCreditManagement from './pages/admin/debts/DebtCreditManagement'
import AdminSettings from './pages/admin/settings/AdminSettings'

// User Pages
import Home from './pages/Home'
import SearchPage from './pages/SearchPage'
import ItemDetail from './pages/ItemDetail'
import Cart from './pages/Cart'
import Profile from './pages/Profile'
import Auth from './pages/Auth'
import PaymentResult from './pages/PaymentResult'
import AboutUs from './pages/AboutUs'

function App() {
    return (
        <ShopProvider>
            <ToastProvider>
                <AdminThemeProvider>
                    <Router>
                        <Routes>
                            {/* User Application Routes */}
                            <Route element={<UserLayout />}>
                                <Route path="/" element={<Home />} />
                                <Route path="/search" element={<SearchPage />} />
                                <Route path="/item/:id" element={<ItemDetail />} />
                                <Route path="/cart" element={<Cart />} />
                                <Route path="/profile" element={<Profile />} />
                                <Route path="/auth" element={<Auth />} />
                                <Route path="/payment-result" element={<PaymentResult />} />
                                <Route path="/about" element={<AboutUs />} />
                            </Route>

                            {/* Admin Application Routes */}
                            <Route path="/admin/login" element={<AdminLogin />} />

                            <Route path="/admin" element={
                                <ProtectedAdminRoute>
                                    <AdminLayout />
                                </ProtectedAdminRoute>
                            }>
                                <Route index element={<Navigate to="dashboard" replace />} />
                                <Route path="dashboard" element={<AdminDashboard />} />

                                {/* Store, Capital & Debt Management */}
                                <Route path="store" element={<StoreManagement />} />
                                <Route path="capital" element={<CapitalManagement />} />
                                <Route path="debt-credit" element={<DebtCreditManagement />} />

                                {/* Product & Order Management */}
                                <Route path="products" element={<ProductList />} />
                                <Route path="products/new" element={<ProductForm />} />
                                <Route path="products/edit/:id" element={<ProductForm />} />
                                <Route path="categories" element={<CategoryManager />} />
                                <Route path="orders" element={<OrderList />} />
                                <Route path="payments" element={<PaymentViewer />} />
                                <Route path="users" element={<UserManager />} />
                                <Route path="delivery" element={<DeliveryManager />} />
                                <Route path="addresses" element={<AddressManager />} />
                                <Route path="banners" element={<BannerManager />} />
                                <Route path="feedback" element={<div style={{ padding: '2rem' }}><h1>Feedback</h1><p>Coming soon...</p></div>} />
                                <Route path="content" element={<div style={{ padding: '2rem' }}><h1>Content Manager</h1><p>Coming soon...</p></div>} />
                                <Route path="settings" element={<AdminSettings />} />
                            </Route>
                        </Routes>
                    </Router>
                </AdminThemeProvider>
            </ToastProvider>
        </ShopProvider>
    )
}

export default App
