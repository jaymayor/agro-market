// API Client
const API = {
    // Request helper
    request: async (endpoint, options = {}) => {
        const url = `${API_URL}${endpoint}`;
        const token = Store.getToken();
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers,
            },
            ...options,
        };
        
        try {
            const response = await fetch(url, config);
            
            if (response.status === 401) {
                // Token expired, try refresh
                const refreshed = await API.refreshToken();
                if (refreshed) {
                    // Retry request
                    return API.request(endpoint, options);
                } else {
                    Store.clearAuth();
                    window.location.href = '/login.html';
                    return null;
                }
            }
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.detail || `HTTP error! status: ${response.status}`);
            }
            
            if (response.status === 204) {
                return null;
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    // Auth
    auth: {
        login: async (phone, password) => {
            const data = await API.request('/auth/login/', {
                method: 'POST',
                body: JSON.stringify({ phone, password }),
            });
            if (data) {
                Store.setAuth(data.user, data.access, data.refresh);
            }
            return data;
        },
        
        register: async (userData) => {
            return await API.request('/auth/register/', {
                method: 'POST',
                body: JSON.stringify(userData),
            });
        },
        
        sendOTP: async (phone) => {
            return await API.request('/auth/send-otp/', {
                method: 'POST',
                body: JSON.stringify({ phone }),
            });
        },
        
        verifyOTP: async (phone, code) => {
            return await API.request('/auth/verify-otp/', {
                method: 'POST',
                body: JSON.stringify({ phone, code }),
            });
        },
        
        refreshToken: async () => {
            const refresh = localStorage.getItem('refresh_token');
            if (!refresh) return false;
            
            try {
                const data = await API.request('/auth/token/refresh/', {
                    method: 'POST',
                    body: JSON.stringify({ refresh }),
                });
                if (data) {
                    localStorage.setItem('access_token', data.access);
                    return true;
                }
            } catch (e) {
                return false;
            }
        },
        
        logout: async () => {
            try {
                await API.request('/auth/logout/', { method: 'POST' });
            } catch (e) {}
            Store.clearAuth();
        },
        
        changePassword: async (oldPassword, newPassword) => {
            return await API.request('/auth/change-password/', {
                method: 'POST',
                body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
            });
        },
        
        getMe: async () => {
            return await API.request('/auth/me/');
        },
    },
    
    // Products
    products: {
        getList: async (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return await API.request(`/products/?${query}`);
        },
        
        getDetail: async (slug) => {
            return await API.request(`/products/${slug}/`);
        },
        
        getCategories: async () => {
            return await API.request('/products/categories/');
        },
        
        getCategory: async (slug) => {
            return await API.request(`/products/categories/${slug}/`);
        },
        
        getReviews: async (productId) => {
            return await API.request(`/reviews/?product=${productId}`);
        },
        
        createReview: async (reviewData) => {
            return await API.request('/reviews/', {
                method: 'POST',
                body: JSON.stringify(reviewData),
            });
        },
    },
    
    // Shops
    shops: {
        getList: async (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return await API.request(`/shops/?${query}`);
        },
        
        getDetail: async (slug) => {
            return await API.request(`/shops/${slug}/`);
        },
        
        getProducts: async (slug) => {
            return await API.request(`/shops/${slug}/products/`);
        },
        
        getMyShop: async () => {
            return await API.request('/shops/my-shop/');
        },
        
        create: async (data) => {
            return await API.request('/shops/', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },
        
        update: async (slug, data) => {
            return await API.request(`/shops/${slug}/`, {
                method: 'PATCH',
                body: JSON.stringify(data),
            });
        },
    },
    
    // Orders
    orders: {
        getList: async () => {
            return await API.request('/orders/');
        },
        
        getDetail: async (id) => {
            return await API.request(`/orders/${id}/`);
        },
        
        create: async (orderData) => {
            return await API.request('/orders/', {
                method: 'POST',
                body: JSON.stringify(orderData),
            });
        },
        
        updateStatus: async (id, status) => {
            return await API.request(`/orders/${id}/update-status/`, {
                method: 'PATCH',
                body: JSON.stringify({ status }),
            });
        },
        
        cancel: async (id) => {
            return await API.request(`/orders/${id}/cancel/`, { method: 'POST' });
        },
    },
    
    // Payments
    payments: {
        initiate: async (orderId, provider) => {
            return await API.request('/payments/initiate/', {
                method: 'POST',
                body: JSON.stringify({ order: orderId, provider }),
            });
        },
        
        getList: async () => {
            return await API.request('/payments/');
        },
    },
};
