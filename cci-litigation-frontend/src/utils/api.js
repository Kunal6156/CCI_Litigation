import axios from 'axios';

// Access API_BASE_URL from environment variables - FIXED URL
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/';
console.log('API_BASE_URL:', API_BASE_URL);

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    // Add timeout to prevent hanging requests
    timeout: 15000, // Increased timeout
    // Ensure credentials are included for CORS
    withCredentials: false, // Set to false since we're using JWT tokens
});

// Request interceptor to add JWT access token to headers
api.interceptors.request.use(
    (config) => {
        // Add debug logging
        console.log(`Making ${config.method?.toUpperCase()} request to:`, config.url);
        console.log('Request data:', config.data);
        
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor to handle token expiration and refresh
api.interceptors.response.use(
    (response) => {
        console.log(`Response from ${response.config.url}:`, response.status, response.data);
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Enhanced error logging
        console.error('API Error Details:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            url: originalRequest?.url,
            method: originalRequest?.method,
            headers: originalRequest?.headers
        });

        // If it's a 401 Unauthorized error and not a retry already
        if (error.response?.status === 401 && !originalRequest._retry && 
            !originalRequest.url.includes('/auth/refresh/') && 
            !originalRequest.url.includes('/token/refresh/') &&
            !originalRequest.url.includes('/auth/login/')) {
            
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('refresh_token');

            if (refreshToken) {
                try {
                    console.log('Attempting token refresh...');
                    const response = await axios.post(`${API_BASE_URL}auth/refresh/`, {
                        refresh: refreshToken,
                    }, {
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    });

                    console.log('Token refresh successful');
                    
                    // Update tokens in localStorage
                    localStorage.setItem('access_token', response.data.access);
                    if (response.data.refresh) {
                        localStorage.setItem('refresh_token', response.data.refresh);
                    }

                    // Update the Authorization header
                    api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
                    originalRequest.headers['Authorization'] = `Bearer ${response.data.access}`;

                    // Retry the original request
                    return api(originalRequest);
                } catch (refreshError) {
                    console.error("Token refresh failed:", refreshError.response?.data || refreshError.message);
                    
                    // Clear all tokens and redirect to login
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    localStorage.removeItem('user_data');
                    delete api.defaults.headers.common['Authorization'];
                    
                    // Only redirect if not already on login page
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login';
                    }
                    
                    return Promise.reject(refreshError);
                }
            } else {
                // No refresh token available
                console.log('No refresh token available, redirecting to login');
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user_data');
                delete api.defaults.headers.common['Authorization'];
                
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
        }

        // Handle specific error cases
        if (error.response?.status === 400) {
            console.error('Bad Request (400):', error.response.data);
        } else if (error.response?.status === 403) {
            console.error('Forbidden (403):', error.response.data);
        } else if (error.response?.status === 404) {
            console.error('Not Found (404):', error.response.data);
        } else if (error.response?.status >= 500) {
            console.error('Server Error (5xx):', error.response.data);
        }

        // Handle network errors
        if (!error.response) {
            console.error('Network error or request timeout:', error.message);
        }

        return Promise.reject(error);
    }
);

export default api;