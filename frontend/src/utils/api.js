import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add CSRF token to requests
api.interceptors.request.use((config) => {
    const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];

    if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
    }
    return config;
});

// Initialize CSRF token
export const initCSRF = async () => {
    try {
        await api.get('/csrf/');
    } catch (err) {
        console.error('Failed to get CSRF token:', err);
    }
};

// Auth API
export const authAPI = {
    register: async (username, email, password) => {
        await initCSRF();
        return api.post('/auth/register/', { username, email, password });
    },

    login: async (username, password) => {
        await initCSRF();
        return api.post('/auth/login/', { username, password });
    },

    logout: () => api.post('/auth/logout/'),

    getCurrentUser: () => api.get('/auth/me/'),
};

// Posts API
export const postsAPI = {
    list: () => api.get('/posts/'),

    get: (id) => api.get(`/posts/${id}/`),

    create: (content) => api.post('/posts/', { content }),

    like: (id) => api.post(`/posts/${id}/like/`),

    unlike: (id) => api.post(`/posts/${id}/unlike/`),
};

// Comments API
export const commentsAPI = {
    create: (postId, content, parentId = null) =>
        api.post('/comments/', { post: postId, content, parent: parentId }),

    like: (id) => api.post(`/comments/${id}/like/`),

    unlike: (id) => api.post(`/comments/${id}/unlike/`),
};

// Leaderboard API
export const leaderboardAPI = {
    get: () => api.get('/leaderboard/'),
};

export default api;
