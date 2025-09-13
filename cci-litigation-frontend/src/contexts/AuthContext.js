import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../utils/api';
import { STORAGE_KEYS, USER_ROLES, PERMISSIONS } from '../utils/constants';

// Initial state
const initialState = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
};

// Action types
const AUTH_ACTIONS = {
    LOGIN_START: 'LOGIN_START',
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILURE: 'LOGIN_FAILURE',
    LOGOUT: 'LOGOUT',
    SET_LOADING: 'SET_LOADING',
    CLEAR_ERROR: 'CLEAR_ERROR',
    UPDATE_USER: 'UPDATE_USER',
    SET_USER: 'SET_USER',
};

// Reducer
const authReducer = (state, action) => {
    switch (action.type) {
        case AUTH_ACTIONS.LOGIN_START:
            return {
                ...state,
                isLoading: true,
                error: null,
            };
        case AUTH_ACTIONS.LOGIN_SUCCESS:
            return {
                ...state,
                user: action.payload,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            };
        case AUTH_ACTIONS.LOGIN_FAILURE:
            return {
                ...state,
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: action.payload,
            };
        case AUTH_ACTIONS.LOGOUT:
            return {
                ...state,
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
            };
        case AUTH_ACTIONS.SET_LOADING:
            return {
                ...state,
                isLoading: action.payload,
            };
        case AUTH_ACTIONS.CLEAR_ERROR:
            return {
                ...state,
                error: null,
            };
        case AUTH_ACTIONS.UPDATE_USER:
            return {
                ...state,
                user: { ...state.user, ...action.payload },
            };
        case AUTH_ACTIONS.SET_USER:
            return {
                ...state,
                user: action.payload,
                isAuthenticated: !!action.payload,
                isLoading: false,
            };
        default:
            return state;
    }
};

// Create context
const AuthContext = createContext();

// Helper function to get user permissions based on role and department
const getUserPermissions = (user) => {
    if (!user) return [];

    const permissions = [];

    if (user.is_admin) {
        // Admin has all permissions
        permissions.push(
            PERMISSIONS.VIEW_ALL_CASES,
            PERMISSIONS.EDIT_ALL_CASES,
            PERMISSIONS.DELETE_CASES,
            PERMISSIONS.MANAGE_USERS
        );
    } else {
        // Regular users can view all but only edit their own department
        permissions.push(
            PERMISSIONS.VIEW_ALL_CASES,
            PERMISSIONS.VIEW_OWN_DEPARTMENT,
            PERMISSIONS.EDIT_OWN_DEPARTMENT
        );
    }

    return permissions;
};

// Helper function to check if user has specific permission
const hasPermission = (user, permission) => {
    const permissions = getUserPermissions(user);
    return permissions.includes(permission);
};

// Helper function to check if user can edit a specific case
const canEditCase = (user, caseData) => {
    if (!user || !caseData) return false;

    // Admin can edit all cases
    if (user.is_admin) return true;

    // Regular users can only edit cases from their department
    return user.department_name === caseData.department_name;
};

// Helper function to check if user can view a specific case
const canViewCase = (user, caseData) => {
    if (!user) return false;

    // All authenticated users can view all cases
    return true;
};

// AuthProvider component
export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    // Check for existing token on app load
    useEffect(() => {
        const initializeAuth = async () => {
            const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
            const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);

            if (token && userData) {
                try {
                    // Set the token in API headers
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                    // Parse user data
                    const user = JSON.parse(userData);

                    // For now, just use stored user data (you can add profile verification later)
                    dispatch({
                        type: AUTH_ACTIONS.SET_USER,
                        payload: {
                            ...user,
                            permissions: getUserPermissions(user)
                        }
                    });
                } catch (error) {
                    console.error('Token validation failed:', error);
                    // Clear invalid token
                    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
                    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
                    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
                    delete api.defaults.headers.common['Authorization'];
                    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
                }
            } else {
                dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
            }
        };

        initializeAuth();
    }, []);

    // Login function - FIXED with proper request format
    // Login function - FIXED with proper request format
    // Login function - Enhanced with frontend validation
    const login = async (credentials) => {
        dispatch({ type: AUTH_ACTIONS.LOGIN_START });

        try {
            // Frontend validation before sending request
            const { loginType, username, email, password, department_name } = credentials;

            // Validate login type and corresponding field
            if (loginType === 'email') {
                if (!email || !email.trim()) {
                    throw new Error('Email address is required for email login');
                }
                if (!email.includes('@')) {
                    throw new Error('Please enter a valid email address');
                }
                // Check if user accidentally entered username in email field
                if (email && !email.includes('@') && email.length < 50) {
                    throw new Error('Please enter a valid email address, not username');
                }
            } else {
                if (!username || !username.trim()) {
                    throw new Error('Username is required for username login');
                }
                if (username.includes('@')) {
                    throw new Error('Please enter your username, not email address. Switch to Email login to use email.');
                }
            }

            if (!password || !password.trim()) {
                throw new Error('Password is required');
            }

            if (!department_name) {
                throw new Error('Please select your department');
            }

            console.log('Attempting login with credentials:', {
                username: credentials.username || credentials.email,
                department: credentials.department_name,
                loginType: credentials.loginType
            });

            // Prepare the login data according to your backend serializer
            const loginData = {
                password: credentials.password,
                department_name: credentials.department_name,
            };

            // The backend serializer expects either 'username' OR 'email' field, not both
            // Based on your serializer, it uses 'username' as the main field for both types
            if (credentials.loginType === 'email') {
                // For email login, send email as username (serializer handles both)
                loginData.username = credentials.email;
                loginData.email = credentials.email; // Also send email field for serializer validation
            } else {
                // For username login
                loginData.username = credentials.username;
            }

            console.log('Sending login request with data:', loginData);

            const response = await api.post('/auth/login/', loginData);
            console.log('Login response:', response.data);

            const { access, refresh, user_info } = response.data;

            if (!access) {
                throw new Error('No access token received from server');
            }

            // Store tokens and user data
            localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
            if (refresh) {
                localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh);
            }
            localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user_info));

            // Set authorization header
            api.defaults.headers.common['Authorization'] = `Bearer ${access}`;

            // Add permissions to user object
            const userWithPermissions = {
                ...user_info,
                permissions: getUserPermissions(user_info)
            };

            dispatch({
                type: AUTH_ACTIONS.LOGIN_SUCCESS,
                payload: userWithPermissions
            });

            return { success: true };
        } catch (error) {
            console.error('Login error:', error);

            let errorMessage = 'Login failed. Please try again.';

            // Handle custom frontend validation errors
            if (error.message && !error.response) {
                errorMessage = error.message;
            } else if (error.response?.data) {
                // Handle different error response formats from backend
                if (error.response.data.detail) {
                    errorMessage = error.response.data.detail;
                } else if (error.response.data.non_field_errors) {
                    errorMessage = Array.isArray(error.response.data.non_field_errors)
                        ? error.response.data.non_field_errors[0]
                        : error.response.data.non_field_errors;
                } else if (error.response.data.error) {
                    errorMessage = error.response.data.error;
                } else if (error.response.data.message) {
                    errorMessage = error.response.data.message;
                } else if (typeof error.response.data === 'string') {
                    errorMessage = error.response.data;
                } else {
                    // Handle field-specific errors
                    const fieldErrors = [];
                    Object.keys(error.response.data).forEach(field => {
                        const fieldError = error.response.data[field];
                        if (Array.isArray(fieldError)) {
                            fieldErrors.push(`${field}: ${fieldError[0]}`);
                        } else {
                            fieldErrors.push(`${field}: ${fieldError}`);
                        }
                    });
                    if (fieldErrors.length > 0) {
                        errorMessage = fieldErrors.join(', ');
                    }
                }
            } else if (error.message) {
                if (error.message.includes('timeout')) {
                    errorMessage = 'Request timeout. Please check your connection and try again.';
                } else if (error.message.includes('Network Error')) {
                    errorMessage = 'Network error. Please check your connection and try again.';
                } else {
                    errorMessage = `Error: ${error.message}`;
                }
            }

            dispatch({
                type: AUTH_ACTIONS.LOGIN_FAILURE,
                payload: errorMessage
            });

            return { success: false, error: errorMessage };
        }
    };
    // Logout function
    const logout = async () => {
        try {
            // Attempt to logout on server (if endpoint exists)
            await api.post('/auth/logout/');
        } catch (error) {
            console.error('Server logout failed:', error);
        } finally {
            // Clear local storage and state regardless of server response
            localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.USER_DATA);
            delete api.defaults.headers.common['Authorization'];

            dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
    };

    // Update user profile
    const updateProfile = async (profileData) => {
        try {
            const response = await api.put('/auth/profile/', profileData);
            const updatedUser = {
                ...state.user,
                ...response.data,
                permissions: getUserPermissions(response.data)
            };

            // Update local storage
            localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));

            dispatch({
                type: AUTH_ACTIONS.UPDATE_USER,
                payload: updatedUser
            });

            return { success: true, data: updatedUser };
        } catch (error) {
            const errorMessage = error.response?.data?.detail ||
                error.response?.data?.message ||
                'Profile update failed.';
            return { success: false, error: errorMessage };
        }
    };

    // Change password
    const changePassword = async (passwordData) => {
        try {
            await api.post('/auth/change-password/', passwordData);
            return { success: true };
        } catch (error) {
            const errorMessage = error.response?.data?.detail ||
                error.response?.data?.message ||
                'Password change failed.';
            return { success: false, error: errorMessage };
        }
    };

    // Request password reset
    const requestPasswordReset = async (email) => {
        try {
            await api.post('/auth/password-reset/', { email });
            return { success: true };
        } catch (error) {
            const errorMessage = error.response?.data?.detail ||
                error.response?.data?.message ||
                'Password reset request failed.';
            return { success: false, error: errorMessage };
        }
    };

    // Clear error
    const clearError = () => {
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
    };

    // Context value
    const contextValue = {
        // State
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isLoading: state.isLoading,
        error: state.error,

        // Actions
        login,
        logout,
        updateProfile,
        changePassword,
        requestPasswordReset,
        clearError,

        // Permission helpers
        hasPermission: (permission) => hasPermission(state.user, permission),
        canEditCase: (caseData) => canEditCase(state.user, caseData),
        canViewCase: (caseData) => canViewCase(state.user, caseData),
        getUserPermissions: () => getUserPermissions(state.user),

        // User role checks
        isAdmin: state.user?.is_admin || false,
        isUser: state.user && !state.user.is_admin,
        userDepartment: state.user?.department_name || null,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// HOC for protecting routes
export const withAuth = (Component) => {
    return (props) => {
        const { isAuthenticated, isLoading } = useAuth();

        if (isLoading) {
            return <div>Loading...</div>; // Or your loading component
        }

        if (!isAuthenticated) {
            // Redirect to login or show login form
            return null;
        }

        return <Component {...props} />;
    };
};

// HOC for admin-only routes
export const withAdminAuth = (Component) => {
    return (props) => {
        const { isAuthenticated, isAdmin, isLoading } = useAuth();

        if (isLoading) {
            return <div>Loading...</div>;
        }

        if (!isAuthenticated || !isAdmin) {
            return <div>Access Denied: Admin privileges required</div>;
        }

        return <Component {...props} />;
    };
};

export default AuthContext;