// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/auth/token/',
  REFRESH_TOKEN: '/auth/token/refresh/',
  
  // Users
  USERS: '/users/',
  USER_PROFILE: '/users/profile/',
  USER_SUMMARY: '/users/summary/',
  RESET_PASSWORD: '/users/{id}/reset_password/',
  
  // Cases
  CASES: '/cases/',
  CASE_EXPORT: '/cases/export_excel/',
  CASE_DASHBOARD: '/cases/dashboard_stats/',
  
  // Departments
  DEPARTMENTS: '/departments/',
  DEPARTMENT_CHOICES: '/departments/choices/',
  DEPARTMENT_STATS: '/departments/stats/',
};

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'cci_access_token',
  REFRESH_TOKEN: 'cci_refresh_token',
  USER_INFO: 'cci_user_info',
  THEME: 'cci_theme',
  LANGUAGE: 'cci_language',
  LAST_LOGIN: 'cci_last_login',
};

// User Roles and Permissions
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
};

export const PERMISSIONS = {
  CAN_MANAGE_USERS: 'can_manage_users',
  CAN_CREATE_USERS: 'can_create_users',
  CAN_DELETE_USERS: 'can_delete_users',
  CAN_RESET_PASSWORDS: 'can_reset_passwords',
  CAN_EXPORT_DATA: 'can_export_data',
  CAN_VIEW_ALL_CASES: 'can_view_all_cases',
  CAN_EDIT_ALL_CASES: 'can_edit_all_cases',
  CAN_DELETE_ALL_CASES: 'can_delete_all_cases',
  CAN_EDIT_OWN_DEPT_CASES: 'can_edit_own_dept_cases',
  CAN_VIEW_DASHBOARD: 'can_view_dashboard',
  CAN_MANAGE_DEPARTMENTS: 'can_manage_departments',
  CAN_BULK_IMPORT: 'can_bulk_import',
  CAN_VIEW_AUDIT_LOGS: 'can_view_audit_logs',
};

// Department Options
export const DEPARTMENT_OPTIONS = [
  { value: 'Corporate Office', label: 'Corporate Office' },
  { value: 'Tandur', label: 'Tandur' },
  { value: 'Rajban', label: 'Rajban' },
  { value: 'Bokajan', label: 'Bokajan' },
  { value: 'Akaltara', label: 'Akaltara' },
  { value: 'Mandhar', label: 'Mandhar' },
  { value: 'Nayagaoun', label: 'Nayagaoun' },
  { value: 'Adilabad', label: 'Adilabad' },
  { value: 'Kurkunta', label: 'Kurkunta' },
  { value: 'Delhi Grinding', label: 'Delhi Grinding' },
  { value: 'Bhatinda Grinding', label: 'Bhatinda Grinding' },
];

// Case Status Options
export const CASE_STATUS_OPTIONS = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Under Hearing', label: 'Under Hearing' },
  { value: 'Admitted', label: 'Admitted' },
  { value: 'Disposed', label: 'Disposed' },
  { value: 'Closed', label: 'Closed' },
  { value: 'Dismissed', label: 'Dismissed' },
  { value: 'Settled', label: 'Settled' },
  { value: 'Withdrawn', label: 'Withdrawn' },
];

// Litigation Type Options
export const LITIGATION_TYPE_OPTIONS = [
  { value: 'Civil', label: 'Civil' },
  { value: 'Criminal', label: 'Criminal' },
  { value: 'Constitutional', label: 'Constitutional' },
  { value: 'Commercial', label: 'Commercial' },
  { value: 'Tax', label: 'Tax' },
  { value: 'Labor', label: 'Labor' },
  { value: 'Environmental', label: 'Environmental' },
  { value: 'Consumer', label: 'Consumer' },
  { value: 'Administrative', label: 'Administrative' },
  { value: 'Others', label: 'Others' },
];

// Bench Options
export const BENCH_OPTIONS = [
  { value: 'Supreme Court', label: 'Supreme Court' },
  { value: 'High Court', label: 'High Court' },
  { value: 'District Court', label: 'District Court' },
  { value: 'Sessions Court', label: 'Sessions Court' },
  { value: 'Magistrate Court', label: 'Magistrate Court' },
  { value: 'Tribunal', label: 'Tribunal' },
  { value: 'Commission', label: 'Commission' },
  { value: 'Authority', label: 'Authority' },
  { value: 'Others', label: 'Others' },
];

// Priority Options
export const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

// Case Table Columns Configuration
export const CASE_TABLE_COLUMNS = [
  {
    key: 'case_id',
    label: 'Case ID',
    sortable: true,
    filterable: true,
    width: '120px',
    sticky: true,
  },
  {
    key: 'case_name',
    label: 'Case Name',
    sortable: true,
    filterable: true,
    width: '200px',
    truncate: true,
  },
  {
    key: 'date_of_institution',
    label: 'Date of Institution',
    sortable: true,
    filterable: true,
    width: '130px',
    type: 'date',
  },
  {
    key: 'parties_involved_complainant',
    label: 'Complainant',
    sortable: false,
    filterable: true,
    width: '150px',
    truncate: true,
  },
  {
    key: 'parties_involved_opposite',
    label: 'Opposite Parties',
    sortable: false,
    filterable: true,
    width: '150px',
    truncate: true,
  },
  {
    key: 'bench',
    label: 'Bench',
    sortable: true,
    filterable: true,
    width: '120px',
  },
  {
    key: 'sections_involved',
    label: 'Sections',
    sortable: false,
    filterable: true,
    width: '100px',
    truncate: true,
  },
  {
    key: 'status_of_case',
    label: 'Status',
    sortable: true,
    filterable: true,
    width: '100px',
    type: 'badge',
  },
  {
    key: 'type_of_litigation',
    label: 'Type',
    sortable: true,
    filterable: true,
    width: '100px',
  },
  {
    key: 'date_of_next_hearing_order',
    label: 'Next Hearing',
    sortable: true,
    filterable: true,
    width: '130px',
    type: 'date',
  },
  {
    key: 'date_of_final_order',
    label: 'Final Order Date',
    sortable: true,
    filterable: true,
    width: '130px',
    type: 'date',
  },
  {
    key: 'department_name',
    label: 'Department',
    sortable: true,
    filterable: true,
    width: '120px',
  },
  {
    key: 'created_by_name',
    label: 'Created By',
    sortable: true,
    filterable: true,
    width: '120px',
  },
  {
    key: 'case_age_days',
    label: 'Age (Days)',
    sortable: true,
    filterable: false,
    width: '100px',
    type: 'number',
  },
  {
    key: 'actions',
    label: 'Actions',
    sortable: false,
    filterable: false,
    width: '120px',
    sticky: 'right',
  },
];

// User Table Columns Configuration
export const USER_TABLE_COLUMNS = [
  {
    key: 'username',
    label: 'Username',
    sortable: true,
    filterable: true,
    width: '120px',
  },
  {
    key: 'full_name',
    label: 'Full Name',
    sortable: true,
    filterable: true,
    width: '150px',
  },
  {
    key: 'email',
    label: 'Email',
    sortable: true,
    filterable: true,
    width: '180px',
  },
  {
    key: 'department_name',
    label: 'Department',
    sortable: true,
    filterable: true,
    width: '130px',
  },
  {
    key: 'user_type',
    label: 'Role',
    sortable: true,
    filterable: true,
    width: '80px',
    type: 'badge',
  },
  {
    key: 'is_active',
    label: 'Status',
    sortable: true,
    filterable: true,
    width: '80px',
    type: 'boolean',
  },
  {
    key: 'last_login_formatted',
    label: 'Last Login',
    sortable: true,
    filterable: false,
    width: '130px',
  },
  {
    key: 'actions',
    label: 'Actions',
    sortable: false,
    filterable: false,
    width: '120px',
    sticky: 'right',
  },
];

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY',
  API: 'YYYY-MM-DD',
  DATETIME_DISPLAY: 'DD/MM/YYYY HH:mm',
  DATETIME_API: 'YYYY-MM-DD HH:mm:ss',
  TIME_DISPLAY: 'HH:mm',
};

// Validation Messages
export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  EMAIL_INVALID: 'Please enter a valid email address',
  PASSWORD_MIN_LENGTH: 'Password must be at least 8 characters long',
  PASSWORD_MISMATCH: 'Passwords do not match',
  USERNAME_MIN_LENGTH: 'Username must be at least 3 characters long',
  PHONE_INVALID: 'Please enter a valid phone number',
  DATE_INVALID: 'Please enter a valid date',
  URL_INVALID: 'Please enter a valid URL',
  NUMBER_INVALID: 'Please enter a valid number',
  CASE_ID_REQUIRED: 'Case ID is required',
  CASE_NAME_REQUIRED: 'Case name is required',
  MAX_LENGTH_EXCEEDED: 'Maximum length exceeded',
};

// Character Limits
// Character Limits - changed to numbers only
export const CHAR_LIMITS = {
  USERNAME: 150,
  FIRST_NAME: 30,
  LAST_NAME: 30,
  EMAIL: 254,
  PHONE: 15,
  EMPLOYEE_ID: 20,
  DESIGNATION: 100,
  CASE_ID: 100,
  CASE_NAME: 500,
  PARTIES_COMPLAINANT: 1000,
  PARTIES_OPPOSITE: 1000,
  BENCH: 200,
  SECTIONS_INVOLVED: 500,  // Add this if missing
  STATUS: 100,
  LITIGATION_TYPE: 100,
  RELIEF_ORDERS_PRAYED: 2000,  // Make sure this matches your usage
  IMPORTANT_DIRECTIONS_ORDERS: 2000,  // Make sure this matches your usage
  OUTCOME: 1000,
  LINK_OF_ORDER_JUDGMENT: 500,  // Make sure this matches your usage
  URL: 500,
  NOTE_TITLE: 200,
  NOTE_CONTENT: 5000,
};

// Application Settings
export const APP_SETTINGS = {
  ITEMS_PER_PAGE: 25,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['xlsx', 'xls', 'csv'],
  AUTO_LOGOUT_TIME: 60 * 60 * 1000, // 1 hour in milliseconds
  DEBOUNCE_DELAY: 300, // milliseconds
  TOAST_DURATION: 5000, // milliseconds
};

// Table Settings
export const TABLE_SETTINGS = {
  DEFAULT_PAGE_SIZE: 25,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  MAX_ROWS_EXPORT: 10000,
  STICKY_HEADER: true,
  DEFAULT_SORT: { field: 'date_of_institution', order: 'desc' },
};

// Dashboard Settings
export const DASHBOARD_SETTINGS = {
  RECENT_CASES_LIMIT: 10,
  CHART_COLORS: {
    PRIMARY: '#2563eb',
    SUCCESS: '#059669',
    WARNING: '#d97706',
    DANGER: '#dc2626',
    INFO: '#0891b2',
  },
  REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes
};

// Form Field Types
export const FIELD_TYPES = {
  TEXT: 'text',
  EMAIL: 'email',
  PASSWORD: 'password',
  NUMBER: 'number',
  DATE: 'date',
  DATETIME: 'datetime-local',
  SELECT: 'select',
  TEXTAREA: 'textarea',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  FILE: 'file',
  URL: 'url',
  TEL: 'tel',
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
};

// Export Format Options
export const EXPORT_FORMATS = [
  { value: 'excel', label: 'Excel (.xlsx)', icon: '📊' },
  { value: 'csv', label: 'CSV (.csv)', icon: '📄' },
  { value: 'pdf', label: 'PDF (.pdf)', icon: '📋' },
];

// Theme Colors
export const THEME_COLORS = {
  PRIMARY: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  GRAY: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  SUCCESS: {
    50: '#ecfdf5',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
  },
  WARNING: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
  },
  ERROR: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  },
};

// Responsive Breakpoints
export const BREAKPOINTS = {
  SM: '640px',
  MD: '768px',
  LG: '1024px',
  XL: '1280px',
  '2XL': '1536px',
};

// Default Values
export const DEFAULT_VALUES = {
  USER: {
    user_type: 'user',
    is_active: true,
    department_name: '',
  },
  CASE: {
    status_of_case: 'Pending',
    type_of_litigation: 'Civil',
    priority: 'medium',
    case_value: 0,
  },
  PAGINATION: {
    page: 1,
    page_size: 25,
    total: 0,
  },
  FILTERS: {
    search: '',
    department: '',
    status: '',
    date_from: null,
    date_to: null,
    sort_by: 'date_of_institution',
    sort_order: 'desc',
  },
};

// Regex Patterns
export const REGEX_PATTERNS = {
  USERNAME: /^[a-zA-Z0-9_.-]+$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_INDIAN: /^(\+91)?[6-9]\d{9}$/,
  EMPLOYEE_ID: /^[A-Z0-9]{3,20}$/,
  CASE_ID: /^[A-Z0-9\/\-\(\)\s\.]+$/,
  URL: /^https?:\/\/.+/,
  NAME: /^[a-zA-Z\s\-']+$/,
  ALPHANUMERIC: /^[a-zA-Z0-9\s]+$/,
  NUMERIC: /^\d+$/,
  DECIMAL: /^\d+(\.\d{1,2})?$/,
};

// Error Messages for different scenarios
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied. Insufficient permissions.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Internal server error. Please try again later.',
  VALIDATION_ERROR: 'Please correct the errors and try again.',
  DUPLICATE_ERROR: 'A record with this information already exists.',
  DELETE_ERROR: 'Unable to delete. This record may be in use.',
  UPLOAD_ERROR: 'File upload failed. Please try again.',
  EXPORT_ERROR: 'Export failed. Please try again.',
  LOGIN_FAILED: 'Invalid credentials. Please try again.',
  SESSION_EXPIRED: 'Your session has expired. Please login again.',
  FORM_VALIDATION: 'Please fill in all required fields correctly.',
  PASSWORD_WEAK: 'Password must contain uppercase, lowercase, number and special character.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Successfully logged in!',
  LOGOUT: 'Successfully logged out!',
  USER_CREATED: 'User created successfully!',
  USER_UPDATED: 'User updated successfully!',
  USER_DELETED: 'User deactivated successfully!',
  CASE_CREATED: 'Case created successfully!',
  CASE_UPDATED: 'Case updated successfully!',
  CASE_DELETED: 'Case deleted successfully!',
  PASSWORD_RESET: 'Password reset successfully!',
  DATA_EXPORTED: 'Data exported successfully!',
  DATA_IMPORTED: 'Data imported successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!',
};

// Loading States
export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

// Modal Types
export const MODAL_TYPES = {
  CONFIRM: 'confirm',
  ALERT: 'alert',
  FORM: 'form',
  INFO: 'info',
};

// Navigation Menu Items
export const MENU_ITEMS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: '📊',
    path: '/dashboard',
    permission: PERMISSIONS.CAN_VIEW_DASHBOARD,
  },
  {
    key: 'cases',
    label: 'Cases',
    icon: '⚖️',
    path: '/cases',
    permission: PERMISSIONS.CAN_VIEW_ALL_CASES,
    subItems: [
      {
        key: 'case-list',
        label: 'View Cases',
        path: '/cases',
        permission: PERMISSIONS.CAN_VIEW_ALL_CASES,
      },
      {
        key: 'case-create',
        label: 'Add New Case',
        path: '/cases/new',
        permission: PERMISSIONS.CAN_EDIT_OWN_DEPT_CASES,
      },
    ],
  },
  {
    key: 'users',
    label: 'User Management',
    icon: '👥',
    path: '/users',
    permission: PERMISSIONS.CAN_MANAGE_USERS,
  },
  {
    key: 'reports',
    label: 'Reports',
    icon: '📈',
    path: '/reports',
    permission: PERMISSIONS.CAN_EXPORT_DATA,
  },
];

export default {
  API_ENDPOINTS,
  STORAGE_KEYS,
  USER_ROLES,
  PERMISSIONS,
  DEPARTMENT_OPTIONS,
  CASE_STATUS_OPTIONS,
  LITIGATION_TYPE_OPTIONS,
  BENCH_OPTIONS,
  PRIORITY_OPTIONS,
  CASE_TABLE_COLUMNS,
  USER_TABLE_COLUMNS,
  DATE_FORMATS,
  VALIDATION_MESSAGES,
  CHAR_LIMITS,
  APP_SETTINGS,
  TABLE_SETTINGS,
  DASHBOARD_SETTINGS,
  FIELD_TYPES,
  HTTP_STATUS,
  EXPORT_FORMATS,
  THEME_COLORS,
  BREAKPOINTS,
  DEFAULT_VALUES,
  REGEX_PATTERNS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  LOADING_STATES,
  MODAL_TYPES,
  MENU_ITEMS,
};