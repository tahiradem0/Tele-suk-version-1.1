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

// Add a response interceptor to handle 401 (Unauthorized) errors globally
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token is invalid or expired
            localStorage.removeItem('user');
            // Redirect to login to reset state
            window.location.href = '/auth';
        }
        return Promise.reject(error);
    }
);

export const authService = {
    register: (userData) => api.post('/auth/register', userData),
    login: (userData) => api.post('/auth/login', userData),
    getMe: () => api.get('/auth/me'),
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
    initialize: (orderId) => api.post('/payment/initialize', { orderId }),
    verify: (tx_ref) => api.get(`/payment/verify/${tx_ref}`),
};

export const bannerService = {
    getActive: () => api.get('/banners'),
    getAll: () => api.get('/banners/all'),
    create: (formData) => api.post('/banners', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    update: (id, formData) => api.put(`/banners/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    delete: (id) => api.delete(`/banners/${id}`),
};

export const userService = {
    getAll: () => api.get('/users'),
    delete: (id) => api.delete(`/users/${id}`),
};

export const adminService = {
    getStats: () => api.get('/admin/stats'),
};

export default api;
