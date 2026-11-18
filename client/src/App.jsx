import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ShopProvider } from './context/ShopContext'
import { ToastProvider } from './context/ToastContext'
import { AdminThemeProvider } from './context/AdminThemeContext'
import { AdminLanguageProvider } from './context/AdminLanguageContext'
import UserLayout from './components/layout/UserLayout'
import AdminLayout from './components/admin/layout/AdminLayout'
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import ProductForm from './pages/admin/products/ProductForm'
import VoiceAssistant from './pages/admin/ai/VoiceAssistant'

// Unified Admin Workspace Hubs (18 cluttered pages -> 7 clean 1-click hubs)
import SalesHub from './pages/admin/hubs/SalesHub'
import CatalogHub from './pages/admin/hubs/CatalogHub'
import FinanceHub from './pages/admin/hubs/FinanceHub'
import CustomersHub from './pages/admin/hubs/CustomersHub'
import SettingsHub from './pages/admin/hubs/SettingsHub'

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
                    <AdminLanguageProvider>
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

                                <Route
                                    path="/admin"
                                    element={
                                        <ProtectedAdminRoute>
                                            <AdminLayout />
                                        </ProtectedAdminRoute>
                                    }
                                >
                                    <Route index element={<Navigate to="dashboard" replace />} />
                                    <Route path="dashboard" element={<AdminDashboard />} />
                                    <Route path="ai-assistant" element={<VoiceAssistant />} />

                                    {/* 5 Unified Tabbed Hubs */}
                                    <Route path="sales" element={<SalesHub />} />
                                    <Route path="catalog" element={<CatalogHub />} />
                                    <Route path="finance" element={<FinanceHub />} />
                                    <Route path="customers" element={<CustomersHub />} />
                                    <Route path="settings" element={<SettingsHub />} />

                                    {/* Direct Product Create/Edit Forms */}
                                    <Route path="products/new" element={<ProductForm />} />
                                    <Route path="products/edit/:id" element={<ProductForm />} />

                                    {/* Seamless Redirects for All Legacy Admin URLs */}
                                    <Route path="orders" element={<Navigate to="/admin/sales?tab=orders" replace />} />
                                    <Route path="delivery" element={<Navigate to="/admin/sales?tab=delivery" replace />} />
                                    <Route path="payments" element={<Navigate to="/admin/sales?tab=payments" replace />} />
                                    <Route path="addresses" element={<Navigate to="/admin/sales?tab=areas" replace />} />

                                    <Route path="store" element={<Navigate to="/admin/catalog?tab=stock" replace />} />
                                    <Route path="products" element={<Navigate to="/admin/catalog?tab=products" replace />} />
                                    <Route path="categories" element={<Navigate to="/admin/catalog?tab=categories" replace />} />

                                    <Route path="reports" element={<Navigate to="/admin/finance?tab=report" replace />} />
                                    <Route path="capital" element={<Navigate to="/admin/finance?tab=cash" replace />} />
                                    <Route path="expenses" element={<Navigate to="/admin/finance?tab=expenses" replace />} />
                                    <Route path="debt-credit" element={<Navigate to="/admin/finance?tab=debts" replace />} />

                                    <Route path="crm" element={<Navigate to="/admin/customers?tab=sms" replace />} />
                                    <Route path="affiliates" element={<Navigate to="/admin/customers?tab=promoters" replace />} />
                                    <Route path="users" element={<Navigate to="/admin/customers?tab=accounts" replace />} />

                                    <Route path="banners" element={<Navigate to="/admin/settings?tab=banners" replace />} />
                                </Route>
                            </Routes>
                        </Router>
                    </AdminLanguageProvider>
                </AdminThemeProvider>
            </ToastProvider>
        </ShopProvider>
    )
}

export default App
