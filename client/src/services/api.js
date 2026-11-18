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

// Fast Client-Side In-Memory GET Cache (0ms instant navigation across pages, auto-cleared on any write)
const CLIENT_GET_CACHE = new Map();
const CLIENT_CACHE_TTL_MS = 15000;
const CLIENT_CACHE_MAX_ENTRIES = 100;
let bypassServerCacheUntil = 0;

export const clearClientCache = () => {
    CLIENT_GET_CACHE.clear();
};

export const forceRefreshCache = () => {
    CLIENT_GET_CACHE.clear();
    bypassServerCacheUntil = Date.now() + 2000;
};

const isReadOnlyAiPost = (url = '') =>
    url.includes('/ai/parse-voice') ||
    url.includes('/ai/scan-receipt') ||
    url.includes('/crm/ai-write-sms');

const isCacheableGet = (url = '') =>
    !url.includes('/payment/verify') && !url.includes('/auth/me');

// Add a request interceptor to include auth token + serve/invalidate fast memory cache
api.interceptors.request.use(
    (config) => {
        let tokenScope = 'public';
        const user = localStorage.getItem('user');
        if (user) {
            try {
                const token = JSON.parse(user)?.token;
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                    tokenScope = token.length > 16 ? token.slice(-16) : token;
                }
            } catch {
                localStorage.removeItem('user');
            }
        }

        const method = (config.method || 'get').toLowerCase();
        const url = config.url || '';

        // Any mutation immediately invalidates client cache so subsequent reads are 100% fresh
        if (['post', 'put', 'patch', 'delete'].includes(method)) {
            if (!isReadOnlyAiPost(url) && !url.includes('/auth/login')) {
                clearClientCache();
            }
            return config;
        }

        // Serve fresh GET from RAM cache in 0ms unless explicitly bypassed
        if (method === 'get' && isCacheableGet(url)) {
            const isManualRefresh = Date.now() < bypassServerCacheUntil;
            if (isManualRefresh) {
                config.headers['X-Bypass-Cache'] = '1';
            }

            const bypass =
                isManualRefresh ||
                config.headers?.['X-Bypass-Cache'] === '1' ||
                config.headers?.['x-bypass-cache'] === '1' ||
                config.params?._nocache === '1';

            if (!bypass) {
                const paramsKey = config.params ? JSON.stringify(config.params) : '';
                const cacheKey = `${tokenScope}::${url}::${paramsKey}`;
                const cached = CLIENT_GET_CACHE.get(cacheKey);
                if (cached && Date.now() < cached.expiresAt) {
                    config.adapter = () =>
                        Promise.resolve({
                            data: cached.data,
                            status: 200,
                            statusText: 'OK',
                            headers: { 'x-cache': 'CLIENT-HIT' },
                            config,
                        });
                    return config;
                }
                config._clientCacheKey = cacheKey;
            }
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor for fast cache storage + Render cold-start retry + 401/403 recovery
api.interceptors.response.use(
    (response) => {
        const cacheKey = response.config?._clientCacheKey;
        if (cacheKey && response.status >= 200 && response.status < 300) {
            if (CLIENT_GET_CACHE.size >= CLIENT_CACHE_MAX_ENTRIES) {
                const oldestKey = CLIENT_GET_CACHE.keys().next().value;
                if (oldestKey !== undefined) CLIENT_GET_CACHE.delete(oldestKey);
            }
            CLIENT_GET_CACHE.set(cacheKey, {
                data: response.data,
                expiresAt: Date.now() + CLIENT_CACHE_TTL_MS,
            });
        }
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
                clearClientCache();
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
