import axios from 'axios';

// Normalize VITE_API_URL so both "https://app.onrender.com" and "https://app.onrender.com/api/" work seamlessly
const rawApiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').trim().replace(/\/+$/, '');
const API_BASE_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000, // 60s timeout to accommodate Render cold starts
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the auth token in every request
api.interceptors.request.use(
    (config) => {
        const user = localStorage.getItem('user');
        if (user) {
            try {
                const token = JSON.parse(user)?.token;
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            } catch {
                localStorage.removeItem('user');
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor for Render cold-start retry + 401/403 recovery
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const config = error.config;
        const status = error.response?.status;

        // Auto-retry idempotent GET requests once if Render is waking up (502/503/504 or transient network error)
        const isTransientColdStart = !error.response || [502, 503, 504].includes(status);
        if (config && config.method?.toLowerCase() === 'get' && isTransientColdStart && !config._retried) {
            config._retried = true;
            await new Promise((resolve) => setTimeout(resolve, 2500));
            return api(config);
        }

        if (error.response) {
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
    getFinancialReport: (period = 'month') => api.get('/admin/financial-report', { params: { period } }),
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
    getInsights: () => api.get('/store/insights'),
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

export const aiService = {
    getStatus: () => api.get('/ai/status'),
    parseVoice: (data) => api.post('/ai/parse-voice', data),
    scanReceipt: (data) => api.post('/ai/scan-receipt', data),
    commitAction: (data) => api.post('/ai/commit', data),
};

export const crmService = {
    getOverview: () => api.get('/crm/overview'),
    aiWriteSms: (data) => api.post('/crm/ai-write-sms', data),
    sendSms: (data) => api.post('/crm/send-sms', data),
};

export const affiliateService = {
    trackClick: (code) => api.post('/affiliates/track-click', { code }),
    getAll: () => api.get('/affiliates'),
    create: (data) => api.post('/affiliates', data),
    update: (id, data) => api.put(`/affiliates/${id}`, data),
    payout: (id, data) => api.post(`/affiliates/${id}/payout`, data),
    delete: (id) => api.delete(`/affiliates/${id}`),
};

export default api;
