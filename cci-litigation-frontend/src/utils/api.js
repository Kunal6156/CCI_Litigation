import axios from 'axios';
import { STORAGE_KEYS } from './constants';

// Access API_BASE_URL from environment variables - FIXED URL
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/';
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

api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            // Clear invalid tokens
            localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.USER_DATA);
            // Redirect to login
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

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

// ============================================================================
// API FUNCTIONS - ENHANCED WITH NEW FEATURES
// ============================================================================

// ============================================================================
// AUTHENTICATION FUNCTIONS (Existing - Commented for preservation)
// ============================================================================

/**
 * Login user
 * @param {Object} credentials - Username and password
 * @returns {Promise} API response
 */
export const login = async (credentials) => {
    try {
        const response = await api.post('api/auth/login', credentials);
        
        // Store tokens
        if (response.data.access) {
            localStorage.setItem('access_token', response.data.access);
            api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
        }
        if (response.data.refresh) {
            localStorage.setItem('refresh_token', response.data.refresh);
        }
        if (response.data.user) {
            localStorage.setItem('user_data', JSON.stringify(response.data.user));
        }
        
        return response;
    } catch (error) {
        console.error('Login error:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Logout user
 * @returns {Promise} API response
 */
export const logout = async () => {
    try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
            await api.post('auth/logout/', { refresh: refreshToken });
        }
    } catch (error) {
        console.error('Logout error:', error.response?.data || error.message);
    } finally {
        // Clear tokens regardless of API call success
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
        delete api.defaults.headers.common['Authorization'];
    }
};

/**
 * Refresh access token
 * @returns {Promise} API response
 */
export const refreshToken = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
        throw new Error('No refresh token available');
    }
    
    try {
        const response = await api.post('auth/refresh/', { refresh: refreshToken });
        
        localStorage.setItem('access_token', response.data.access);
        if (response.data.refresh) {
            localStorage.setItem('refresh_token', response.data.refresh);
        }
        
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
        return response;
    } catch (error) {
        console.error('Token refresh error:', error.response?.data || error.message);
        throw error;
    }
};

// ============================================================================
// CASE MANAGEMENT FUNCTIONS (Enhanced)
// ============================================================================

/**
 * Get all cases with pagination, filtering, and search
 * @param {Object} params - Query parameters
 * @returns {Promise} API response
 */
export const getCases = async (params = {}) => {
    try {
        const response = await api.get('cases/', { params });
        return response;
    } catch (error) {
        console.error('Get cases error:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Get a single case by ID
 * @param {string|number} id - Case ID
 * @returns {Promise} API response
 */
export const getCase = async (id) => {
    try {
        const response = await api.get(`cases/${id}/`);
        return response;
    } catch (error) {
        console.error('Get case error:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Create a new case
 * @param {Object} caseData - Case data
 * @returns {Promise} API response
 */
export const createCase = async (caseData) => {
    try {
        const response = await api.post('cases/', caseData);
        return response;
    } catch (error) {
        console.error('Create case error:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Update an existing case
 * @param {string|number} id - Case ID
 * @param {Object} caseData - Updated case data
 * @returns {Promise} API response
 */
export const updateCase = async (id, caseData) => {
    try {
        const response = await api.put(`cases/${id}/`, caseData);
        return response;
    } catch (error) {
        console.error('Update case error:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Delete a case
 * @param {string|number} id - Case ID
 * @returns {Promise} API response
 */
export const deleteCase = async (id) => {
    try {
        const response = await api.delete(`cases/${id}/`);
        return response;
    } catch (error) {
        console.error('Delete case error:', error.response?.data || error.message);
        throw error;
    }
};

// ============================================================================
// NEW FEATURES - AUTO-SAVE FUNCTIONALITY
// ============================================================================

/**
 * Auto-save case data (NEW FEATURE)
 * @param {string} autoSaveKey - Unique key for auto-save
 * @param {Object} caseData - Case data to save
 * @returns {Promise} API response
 */
export const autoSaveCase = async (autoSaveKey, caseData) => {
    try {
        const response = await api.post('cases/auto_save/', {
            auto_save_key: autoSaveKey,
            data: caseData
        });
        console.log('Auto-save successful:', response.data);
        return response;
    } catch (error) {
        console.error('Auto-save error:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Get auto-saved case data (NEW FEATURE)
 * @param {string} autoSaveKey - Unique key for auto-save
 * @returns {Promise} API response
 */
export const getAutoSavedCase = async (autoSaveKey) => {
    try {
        const response = await api.get('cases/get_auto_save/', {
            params: { auto_save_key: autoSaveKey }
        });
        return response;
    } catch (error) {
        console.error('Get auto-save error:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Clear auto-saved case data (NEW FEATURE)
 * @param {string} autoSaveKey - Unique key for auto-save
 * @returns {Promise} API response
 */
export const clearAutoSavedCase = async (autoSaveKey) => {
    try {
        const response = await api.delete('cases/clear_auto_save/', {
            params: { auto_save_key: autoSaveKey }
        });
        return response;
    } catch (error) {
        console.error('Clear auto-save error:', error.response?.data || error.message);
        throw error;
    }
};

// ============================================================================
// NEW FEATURES - ADVANCED SEARCH FUNCTIONALITY
// ============================================================================

/**
 * Advanced search across all case fields (NEW FEATURE)
 * @param {Object} searchParams - Search parameters
 * @returns {Promise} API response
 */
export const advancedCaseSearch = async (searchParams) => {
    try {
        const response = await api.get('/cases/', {
            params: {
                search: searchParams.q || '',
                page: searchParams.page || 1,
                page_size: searchParams.page_size || 10,
                sort_by: searchParams.sort_by || 'date_of_filing',
                sort_order: searchParams.sort_order || 'desc',
                department: searchParams.department || '',
                case_type: searchParams.case_type || '',
                nature_of_claim: searchParams.nature_of_claim || '',
                date_from: searchParams.date_from || '',
                date_to: searchParams.date_to || '',
                status: searchParams.status || '',
                include_facets: searchParams.include_facets || false
            }
        });
        return response;
    } catch (error) {
        console.error('Advanced search failed:', error.response?.data || error.message);
        throw error;
    }
};


/**
 * Search cases with faceted results (NEW FEATURE)
 * @param {string} query - Search query
 * @param {Object} filters - Additional filters
 * @returns {Promise} API response
 */
export const searchCasesWithFacets = async (query, filters = {}) => {
    try {
        const params = {
            q: query,
            include_facets: true,
            ...filters
        };
        const response = await api.get('cases/advanced_search/', { params });
        return response;
    } catch (error) {
        console.error('Faceted search error:', error.response?.data || error.message);
        throw error;
    }
};

// ============================================================================
// NEW FEATURES - BULK OPERATIONS & COPY-PASTE
// ============================================================================

/**
 * Bulk paste cases from Excel/CSV format (NEW FEATURE)
 * @param {Array|string} data - Array of case objects or tab-separated string
 * @param {Object} options - Paste options
 * @returns {Promise} API response
 */
export const bulkPasteCases = async (pasteData, options = {}) => {
    try {
        const response = await api.post('/cases/bulk-paste/', {
            paste_data: pasteData,
            options: {
                skip_duplicates: options.skip_duplicates ?? true,
                validate_only: options.validate_only ?? false,
                ...options
            }
        });
        return response;
    } catch (error) {
        console.error('Bulk paste cases failed:', error.response?.data || error.message);
        throw error;
    }
};


/**
 * Preview bulk paste operation (NEW FEATURE)
 * @param {Array|string} data - Data to preview
 * @returns {Promise} API response
 */
export const previewBulkPaste = async (pasteData) => {
    try {
        const response = await api.post('/cases/preview-bulk-paste/', {
            paste_data: pasteData
        });
        return response;
    } catch (error) {
        console.error('Preview bulk paste failed:', error.response?.data || error.message);
        throw error;
    }
};


// ============================================================================
// NEW FEATURES - NOTIFICATIONS & ALERTS
// ============================================================================

/**
 * Send SMS/Email notifications for hearing reminders (NEW FEATURE)
 * @param {Object} notificationData - Notification parameters
 * @returns {Promise} API response
 */
export const sendCaseNotification = async (notificationData) => {
    try {
        const response = await api.post('cases/send_notification/', notificationData);
        return response;
    } catch (error) {
        console.error('Send notification error:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Send hearing reminders for upcoming cases (NEW FEATURE)
 * @param {Object} reminderOptions - Reminder options
 * @returns {Promise} API response
 */
export const sendHearingReminders = async (options = {}) => {
    try {
        const response = await api.post('/notifications/send-hearing-reminders/', {
            hearing_ids: options.hearing_ids || null,
            days_ahead: options.days_ahead || 1,
            departments: options.departments || [],
            sms_enabled: options.sms_enabled !== false,
            email_enabled: options.email_enabled !== false,
            custom_templates: options.custom_templates || {}
        });
        return response;
    } catch (error) {
        console.error('Send hearing reminders failed:', error.response?.data || error.message);
        throw error;
    }
};


// ============================================================================
// NEW FEATURES - ENHANCED EXCEL EXPORT
// ============================================================================

/**
 * Export cases to Excel with Indian formatting (NEW FEATURE)
 * @param {Object} exportOptions - Export parameters
 * @returns {Promise} Blob response for download
 */
export const exportCasesToExcel = async (exportOptions = {}) => {
    try {
        const response = await api.get('cases/export_excel/', {
            params: exportOptions,
            responseType: 'blob'
        });
        
        // Create blob URL for download
        const blob = new Blob([response.data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        
        return blob;
    } catch (error) {
        console.error('Excel export error:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Download Excel file with proper filename (NEW FEATURE)
 * @param {Object} exportOptions - Export parameters
 * @returns {Promise} File download
 */
export const downloadExcelReport = async (exportOptions = {}) => {
    try {
        const blob = await exportCasesToExcel(exportOptions);
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().split('T')[0];
        const department = exportOptions.department || 'All';
        link.download = `CCI_Litigation_Cases_${department}_${timestamp}.xlsx`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        return { success: true, message: 'Excel file downloaded successfully' };
    } catch (error) {
        console.error('Excel download error:', error.response?.data || error.message);
        throw error;
    }
};

// ============================================================================
// NEW FEATURES - REAL-TIME VALIDATION
// ============================================================================

/**
 * Validate case ID uniqueness (NEW FEATURE)
 * @param {string} caseId - Case ID to validate
 * @param {string} excludeId - ID to exclude from validation (for updates)
 * @returns {Promise} API response
 */
export const validateCaseId = async (caseId, excludeId = null) => {
    try {
        const response = await api.post('case-validation/validate_case_id/', {
            case_id: caseId,
            exclude_id: excludeId
        });
        return response;
    } catch (error) {
        console.error('Case ID validation error:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Validate mobile number format (10 digits) (NEW FEATURE)
 * @param {string} mobile - Mobile number to validate
 * @returns {Promise} API response
 */
export const validateMobileNumber = async (mobile) => {
    try {
        const response = await api.post('case-validation/validate_mobile/', {
            mobile: mobile
        });
        return response;
    } catch (error) {
        console.error('Mobile validation error:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Format currency in Indian format (NEW FEATURE)
 * @param {number|string} amount - Amount to format
 * @returns {Promise} API response
 */
export const formatIndianCurrency = async (amount) => {
    try {
        const response = await api.post('case-validation/format_currency/', {
            amount: amount
        });
        return response;
    } catch (error) {
        console.error('Currency formatting error:', error.response?.data || error.message);
        throw error;
    }
};

// ============================================================================
// HELPER FUNCTIONS & UTILITIES (NEW FEATURE)
// ============================================================================

/**
 * Get formatting helpers and constants (NEW FEATURE)
 * @returns {Promise} API response
 */
export const getFormatHelpers = async () => {
    try {
        const response = await api.get('cases/format_helpers/');
        return response;
    } catch (error) {
        console.error('Get format helpers error:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Get validation rules for frontend (NEW FEATURE)
 * @returns {Promise} API response
 */
export const getValidationRules = async () => {
    try {
        const response = await api.get('cases/validation_rules/');
        return response;
    } catch (error) {
        console.error('Get validation rules error:', error.response?.data || error.message);
        throw error;
    }
};

// ============================================================================
// USER MANAGEMENT FUNCTIONS (Existing - Commented for preservation)
// ============================================================================

/**
 * Get all users (admin only)
 * @param {Object} params - Query parameters
 * @returns {Promise} API response
 */
export const getUsers = async (params = {}) => {
    try {
        const response = await api.get('users/', { params });
        return response;
    } catch (error) {
        console.error('Get users error:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Create a new user (admin only)
 * @param {Object} userData - User data
 * @returns {Promise} API response
 */
export const createUser = async (userData) => {
    try {
        const response = await api.post('users/', userData);
        return response;
    } catch (error) {
        console.error('Create user error:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Update user (admin only)
 * @param {string|number} id - User ID
 * @param {Object} userData - Updated user data
 * @returns {Promise} API response
 */
export const updateUser = async (id, userData) => {
    try {
        const response = await api.put(`users/${id}/`, userData);
        return response;
    } catch (error) {
        console.error('Update user error:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Delete user (admin only)
 * @param {string|number} id - User ID
 * @returns {Promise} API response
 */
export const deleteUser = async (id) => {
    try {
        const response = await api.delete(`users/${id}/`);
        return response;
    } catch (error) {
        console.error('Delete user error:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Reset user password (admin only)
 * @param {string|number} id - User ID
 * @param {string} newPassword - New password
 * @returns {Promise} API response
 */
export const resetUserPassword = async (id, newPassword) => {
    try {
        const response = await api.post(`users/${id}/reset_password/`, {
            new_password: newPassword
        });
        return response;
    } catch (error) {
        console.error('Reset password error:', error.response?.data || error.message);
        throw error;
    }
};

// ============================================================================
// UTILITY FUNCTIONS FOR AUTO-SAVE
// ============================================================================

/**
 * Generate auto-save key based on user and form context
 * @param {string} userId - User ID
 * @param {string} formType - Type of form (e.g., 'case_entry')
 * @param {string} caseId - Case ID (optional, for editing)
 * @returns {string} Auto-save key
 */
export const generateAutoSaveKey = (userId, formType = 'case_entry', caseId = null) => {
    const timestamp = Date.now();
    const baseKey = `${userId}_${formType}`;
    return caseId ? `${baseKey}_${caseId}` : `${baseKey}_new_${timestamp}`;
};

/**
 * Check if auto-save data exists for a key
 * @param {string} autoSaveKey - Auto-save key
 * @returns {Promise<boolean>} Whether auto-save data exists
 */
export const hasAutoSaveData = async (autoSaveKey) => {
    try {
        const response = await getAutoSavedCase(autoSaveKey);
        return response.data && response.data.data !== null;
    } catch (error) {
        // If 404 or other error, assume no auto-save data exists
        return false;
    }
};

// ============================================================================
// UTILITY FUNCTIONS FOR SEARCH
// ============================================================================

/**
 * Build search query parameters
 * @param {string} searchTerm - Main search term
 * @param {Object} filters - Additional filters
 * @returns {Object} Query parameters
 */
export const buildSearchParams = (searchTerm, filters = {}) => {
    const params = {};
    
    if (searchTerm && searchTerm.trim()) {
        params.q = searchTerm.trim();
    }
    
    // Add filters
    Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
            params[key] = filters[key];
        }
    });
    
    return params;
};

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

/**
 * Extract error message from API response
 * @param {Error} error - API error object
 * @returns {string} Human-readable error message
 */
export const extractErrorMessage = (error) => {
    if (error.response?.data) {
        const data = error.response.data;
        
        // Handle validation errors
        if (typeof data === 'object' && data.constructor === Object) {
            const messages = [];
            Object.keys(data).forEach(key => {
                if (Array.isArray(data[key])) {
                    messages.push(`${key}: ${data[key].join(', ')}`);
                } else if (typeof data[key] === 'string') {
                    messages.push(`${key}: ${data[key]}`);
                }
            });
            return messages.length > 0 ? messages.join('; ') : 'Validation error occurred';
        }
        
        // Handle string error messages
        if (typeof data === 'string') {
            return data;
        }
        
        // Handle detail field
        if (data.detail) {
            return data.detail;
        }
        
        // Handle message field
        if (data.message) {
            return data.message;
        }
    }
    
    // Fallback to error message
    return error.message || 'An unexpected error occurred';
};
export default api;



