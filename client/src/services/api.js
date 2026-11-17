import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the auth token in every request
api.interceptors.request.use(
    (config) => {
        const user = localStorage.getItem('user');
        if (user) {
            const token = JSON.parse(user).token;
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle 401 (Unauthorized) and 403 (Forbidden) errors globally
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response) {
            const status = error.response.status;
            const isOnAdminRoute = window.location.pathname.startsWith('/admin');
            const isOnAdminLogin = window.location.pathname === '/admin/login';

            // Auto-recover from stale tokens or revoked permissions
            if (status === 401 || (status === 403 && isOnAdminRoute)) {
                localStorage.removeItem('user');
                localStorage.removeItem('admin_session');

                if (isOnAdminRoute && !isOnAdminLogin) {
                    window.location.href = '/admin/login';
                } else if (!isOnAdminRoute && status === 401 && window.location.pathname !== '/auth') {
                    window.location.href = '/auth';
                }
            }
        }
        return Promise.reject(error);
    }
);

export const authService = {
    register: (userData) => api.post('/auth/register', userData),
    login: (userData) => api.post('/auth/login', userData),
    getMe: () => api.get('/auth/me'),
    updatePassword: (data) => api.put('/auth/update-password', data),
};

export const productService = {
    getAll: (params) => api.get('/products', { params }), // supports { search, category }
    getById: (id) => api.get(`/products/${id}`),
    create: (formData) => api.post('/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    update: (id, formData) => api.put(`/products/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    delete: (id) => api.delete(`/products/${id}`),
};

export const categoryService = {
    getAll: () => api.get('/categories'),
    create: (data) => api.post('/categories', data),
    update: (id, data) => api.put(`/categories/${id}`, data),
    delete: (id) => api.delete(`/categories/${id}`),
};

export const orderService = {
    create: (orderData) => api.post('/orders', orderData),
    getMyOrders: () => api.get('/orders/myorders'),
    getAll: () => api.get('/orders'),
    getById: (id) => api.get(`/orders/${id}`),
    updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
    updateDriver: (id, driver) => api.put(`/orders/${id}/driver`, { driver }),
};

export const paymentService = {
    initialize: (orderId, returnUrl) => api.post('/payment/initialize', { orderId, returnUrl }),
    verify: (tx_ref) => api.get(`/payment/verify/${tx_ref}`),
};

export const bannerService = {
    getActive: () => api.get('/banners'),
    getAll: () => api.get('/banners/all'),
    create: (data) => api.post('/banners', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
    update: (id, data) => api.put(`/banners/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
    delete: (id) => api.delete(`/banners/${id}`)
};

// Settings
export const settingsService = {
    getSettings: () => api.get('/settings'),
    updateSettings: (data) => api.put('/settings', data)
};

export const userService = {
    getAll: () => api.get('/users'),
    delete: (id) => api.delete(`/users/${id}`),
};

export const adminService = {
    getStats: () => api.get('/admin/stats'),
};

export const capitalService = {
    getOverview: () => api.get('/capital/overview'),
    getTransactions: (params) => api.get('/capital/transactions', { params }),
    createTransaction: (data) => api.post('/capital/transactions', data),
    deleteTransaction: (id) => api.delete(`/capital/transactions/${id}`),
};

export const debtService = {
    getDebts: (params) => api.get('/debts', { params }),
    create: (data) => api.post('/debts', data),
    recordPayment: (id, data) => api.post(`/debts/${id}/pay`, data),
    update: (id, data) => api.put(`/debts/${id}`, data),
    delete: (id) => api.delete(`/debts/${id}`),
};

export const storeService = {
    getOverview: () => api.get('/store/overview'),
    restock: (data) => api.post('/store/restock', data),
    adjustStock: (data) => api.post('/store/adjust', data),
    getMovements: (params) => api.get('/store/movements', { params }),
};

export const deliveryLocationService = {
    getAll: () => api.get('/delivery-locations'),
    create: (data) => api.post('/delivery-locations', data),
    update: (id, data) => api.put(`/delivery-locations/${id}`, data),
    delete: (id) => api.delete(`/delivery-locations/${id}`),
    resetDefaults: () => api.post('/delivery-locations/reset-defaults'),
};

export const expenseService = {
    getOverview: (params) => api.get('/expenses/overview', { params }),
    getExpenses: (params) => api.get('/expenses', { params }),
    create: (data) => api.post('/expenses', data),
    update: (id, data) => api.put(`/expenses/${id}`, data),
    delete: (id) => api.delete(`/expenses/${id}`),
    getCategories: () => api.get('/expenses/categories'),
    createCategory: (data) => api.post('/expenses/categories', data),
};

export const groupService = {
    getGroups: () => api.get('/groups'),
    create: (data) => api.post('/groups', data),
    join: (data) => api.post('/groups/join', data),
    updateBudget: (id, data) => api.put(`/groups/${id}/budget`, data),
};

export default api;
