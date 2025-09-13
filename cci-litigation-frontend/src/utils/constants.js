// =============================================
// CCI LITIGATION SYSTEM - UPDATED CONSTANTS
// Excel Format Compatible (2024)
// =============================================

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
  CASE_AUTOSAVE: '/cases/autosave/',
  CASE_SEARCH: '/cases/search/',
  
  // Departments
  DEPARTMENTS: '/departments/',
  DEPARTMENT_CHOICES: '/departments/choices/',
  DEPARTMENT_STATS: '/departments/stats/',
  
  // Notifications
  NOTIFICATIONS: '/notifications/',
  SMS_NOTIFICATIONS: '/notifications/sms/',
  EMAIL_NOTIFICATIONS: '/notifications/email/',
};

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'cci_access_token',
  REFRESH_TOKEN: 'cci_refresh_token',
  USER_INFO: 'cci_user_info',
  THEME: 'cci_theme',
  LANGUAGE: 'cci_language',
  LAST_LOGIN: 'cci_last_login',
  AUTO_SAVE_DATA: 'cci_auto_save_data',
  DRAFT_CASE_DATA: 'cci_draft_case_data',
};

// User Roles and Permissions
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
};

export const USER_ROLE_OPTIONS = [
  { value: USER_ROLES.ADMIN, label: 'Administrator' },
  { value: USER_ROLES.USER, label: 'Regular User' },
];


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

// Department Options (Exact Match with Backend)
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

// ===== NEW EXCEL-FORMAT DROPDOWN OPTIONS =====

// Case Type Options (Excel Column 1)
export const CASE_TYPE_OPTIONS = [
  { value: 'CS', label: 'CS - Civil Suit' },
  { value: 'CRP', label: 'CRP - Civil Revision Petition' },
  { value: 'CRA', label: 'CRA - Civil Revision Application' },
  { value: 'WP', label: 'WP - Writ Petition' },
  { value: 'SLP', label: 'SLP - Special Leave Petition' },
  { value: 'CC', label: 'CC - Contempt Case' },
  { value: 'MA', label: 'MA - Miscellaneous Application' },
  { value: 'CA', label: 'CA - Civil Appeal' },
  { value: 'Others', label: 'Others' },
];

// Nature of Claim Options (Excel Column 8)
export const NATURE_OF_CLAIM_OPTIONS = [
  { value: 'Service', label: 'Service' },
  { value: 'Labour', label: 'Labour' },
  { value: 'Contractual', label: 'Contractual' },
  { value: 'Property', label: 'Property' },
  { value: 'Land', label: 'Land' },
  { value: 'Criminal', label: 'Criminal' },
  { value: 'Arbitration', label: 'Arbitration' },
  { value: 'Others', label: 'Others' },
];

// Status Options for Present Status (Excel Column 18)
export const PRESENT_STATUS_OPTIONS = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Under Hearing', label: 'Under Hearing' },
  { value: 'Admitted', label: 'Admitted' },
  { value: 'Disposed', label: 'Disposed' },
  { value: 'Closed', label: 'Closed' },
  { value: 'Dismissed', label: 'Dismissed' },
  { value: 'Settled', label: 'Settled' },
  { value: 'Withdrawn', label: 'Withdrawn' },
  { value: 'Stay Granted', label: 'Stay Granted' },
  { value: 'Interim Order', label: 'Interim Order' },
  { value: 'Final Order', label: 'Final Order' },
  { value: 'Appeal Filed', label: 'Appeal Filed' },
  { value: 'Execution', label: 'Execution' },
];

// Court/Tribunal Options (Excel Column 5)
export const COURT_OPTIONS = [
  { value: 'Supreme Court of India', label: 'Supreme Court of India' },
  { value: 'High Court', label: 'High Court' },
  { value: 'District Court', label: 'District Court' },
  { value: 'Sessions Court', label: 'Sessions Court' },
  { value: 'Magistrate Court', label: 'Magistrate Court' },
  { value: 'Civil Court', label: 'Civil Court' },
  { value: 'Labour Court', label: 'Labour Court' },
  { value: 'Industrial Tribunal', label: 'Industrial Tribunal' },
  { value: 'Consumer Forum', label: 'Consumer Forum' },
  { value: 'NCLT', label: 'NCLT - National Company Law Tribunal' },
  { value: 'NCLAT', label: 'NCLAT - National Company Law Appellate Tribunal' },
  { value: 'Central Administrative Tribunal', label: 'Central Administrative Tribunal' },
  { value: 'Competition Commission', label: 'Competition Commission of India' },
  { value: 'Debt Recovery Tribunal', label: 'Debt Recovery Tribunal' },
  { value: 'Arbitration Panel', label: 'Arbitration Panel' },
  { value: 'Others', label: 'Others' },
];

// Priority Options (for internal use)
export const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

// ===== UPDATED CASE TABLE COLUMNS (Excel Format) =====
export const CASE_TABLE_COLUMNS = [
  {
    key: 'case_id',
    label: 'Case Number',
    sortable: true,
    filterable: true,
    width: '140px',
    sticky: true,
  },
  {
    key: 'formatted_case_number',
    label: 'Case ID',
    sortable: true,
    filterable: true,
    width: '160px',
    sticky: true,
  },
  {
    key: 'date_of_filing_formatted',
    label: 'Date of Filing',
    sortable: true,
    filterable: true,
    width: '130px',
    type: 'date',
  },
  {
    key: 'pending_before_court',
    label: 'Court/Tribunal',
    sortable: true,
    filterable: true,
    width: '150px',
    truncate: true,
  },
  {
    key: 'party_petitioner',
    label: 'Petitioner',
    sortable: false,
    filterable: true,
    width: '180px',
    truncate: true,
  },
  {
    key: 'party_respondent',
    label: 'Respondent',
    sortable: false,
    filterable: true,
    width: '180px',
    truncate: true,
  },
  {
    key: 'nature_of_claim_display',
    label: 'Nature of Claim',
    sortable: true,
    filterable: true,
    width: '120px',
  },
  {
    key: 'advocate_name',
    label: 'Advocate',
    sortable: true,
    filterable: true,
    width: '150px',
    truncate: true,
  },
  {
    key: 'formatted_financial_amount',
    label: 'Financial Implications',
    sortable: true,
    filterable: true,
    width: '160px',
    type: 'currency',
  },
  {
    key: 'internal_department_display',
    label: 'Department',
    sortable: true,
    filterable: true,
    width: '120px',
  },
  {
    key: 'last_hearing_date_formatted',
    label: 'Last Hearing',
    sortable: true,
    filterable: true,
    width: '130px',
    type: 'date',
  },
  {
    key: 'next_hearing_date_formatted',
    label: 'Next Hearing',
    sortable: true,
    filterable: true,
    width: '130px',
    type: 'date',
    highlight: true, // Highlight upcoming hearings
  },
  {
    key: 'present_status',
    label: 'Status',
    sortable: true,
    filterable: true,
    width: '120px',
    type: 'badge',
    truncate: true,
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

// User Table Columns Configuration (unchanged)
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
    key: 'department_display',
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

// ===== DATE FORMATS (Updated for DD-MM-YYYY) =====
export const DATE_FORMATS = {
  DISPLAY: 'DD-MM-YYYY', // Changed to match Excel requirement
  API: 'YYYY-MM-DD',
  DATETIME_DISPLAY: 'DD-MM-YYYY HH:mm',
  DATETIME_API: 'YYYY-MM-DD HH:mm:ss',
  TIME_DISPLAY: 'HH:mm',
  INDIAN_SHORT: 'DD/MM/YY',
  INDIAN_LONG: 'DD/MM/YYYY',
};

// ===== VALIDATION MESSAGES (Updated for Excel Fields) =====
export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  EMAIL_INVALID: 'Please enter a valid email address',
  PASSWORD_MIN_LENGTH: 'Password must be at least 8 characters long',
  PASSWORD_MISMATCH: 'Passwords do not match',
  USERNAME_MIN_LENGTH: 'Username must be at least 3 characters long',
  PHONE_INVALID: 'Please enter a valid 10-digit mobile number',
  MOBILE_10_DIGITS: 'Mobile number must be exactly 10 digits',
  MOBILE_INDIAN_FORMAT: 'Mobile number must start with 6, 7, 8, or 9',
  DATE_INVALID: 'Please enter a valid date',
  DATE_FUTURE_REQUIRED: 'Date must be in the future',
  DATE_PAST_REQUIRED: 'Date cannot be in the future',
  DATE_DD_MM_YYYY: 'Please enter date in DD-MM-YYYY format',
  URL_INVALID: 'Please enter a valid URL',
  NUMBER_INVALID: 'Please enter a valid number',
  CASE_NUMBER_REQUIRED: 'Case number is required',
  CASE_NUMBER_POSITIVE: 'Case number must be a positive integer',
  CASE_YEAR_REQUIRED: 'Case year is required',
  CASE_YEAR_RANGE: 'Case year must be between 1947 and current year',
  CASE_TYPE_REQUIRED: 'Case type is required',
  NATURE_CLAIM_REQUIRED: 'Nature of claim is required',
  ADVOCATE_NAME_REQUIRED: 'Advocate name is required',
  ADVOCATE_EMAIL_REQUIRED: 'Advocate email is required',
  ADVOCATE_MOBILE_REQUIRED: 'Advocate mobile is required',
  COURT_REQUIRED: 'Court/Tribunal information is required',
  PETITIONER_REQUIRED: 'Petitioner details are required',
  RESPONDENT_REQUIRED: 'Respondent details are required',
  BRIEF_DESCRIPTION_REQUIRED: 'Brief description is required',
  RELIEF_CLAIMED_REQUIRED: 'Relief claimed is required',
  PRESENT_STATUS_REQUIRED: 'Present status is required',
  INTERNAL_DEPT_REQUIRED: 'Internal department is required',
  MAX_LENGTH_EXCEEDED: 'Maximum length exceeded',
  HEARING_DATE_LOGICAL: 'Next hearing date must be after last hearing date',
  FILING_DATE_LOGICAL: 'Hearing dates cannot be before filing date',
};

// ===== CHARACTER LIMITS (Updated for Excel Fields) =====
export const CHAR_LIMITS = {
  // User fields
  USERNAME: 150,
  FIRST_NAME: 30,
  LAST_NAME: 30,
  EMAIL: 254,
  PHONE: 15,
  EMPLOYEE_ID: 20,
  DESIGNATION: 100,
  
  // Excel Case fields (exact limits)
  CASE_TYPE: 10,
  CASE_NUMBER: 6, // Max 999999
  CASE_YEAR: 4, // YYYY format
  COURT_TRIBUNAL: 200, // pending_before_court
  PARTY_PETITIONER: 1000,
  PARTY_RESPONDENT: 1000,
  NATURE_OF_CLAIM: 50,
  ADVOCATE_NAME: 200,
  ADVOCATE_EMAIL: 254,
  ADVOCATE_MOBILE: 10, // Exactly 10 digits
  INTERNAL_DEPARTMENT: 50,
  
  // Popup fields (exact Excel requirements)
  BRIEF_DESCRIPTION: 2500, // Excel Column 16
  RELIEF_CLAIMED: 500, // Excel Column 17
  PRESENT_STATUS: 500, // Excel Column 18
  CASE_REMARKS: 500, // Excel Column 19 (optional)
  
  // Other fields
  URL: 500,
  NOTE_TITLE: 200,
  NOTE_CONTENT: 2000,
  CASE_ID_DISPLAY: 50, // Generated case ID
};

// ===== CURRENCY FORMATTING =====
export const CURRENCY_FORMATS = {
  INDIAN_RUPEE: {
    symbol: 'Rs.',
    decimal: 2,
    thousand: ',',
    precision: 2,
    format: 'Rs. %s', // Rs. 1,23,45,000.00
  },
  DISPLAY_FORMAT: 'indian', // Use Indian numbering system
  MAX_AMOUNT: 999999999999.99, // 1 trillion - 1 paisa
};

// ===== REGEX PATTERNS (Updated) =====
export const REGEX_PATTERNS = {
  USERNAME: /^[a-zA-Z0-9_.-]+$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  MOBILE_10_DIGITS: /^[6-9]\d{9}$/, // Exactly 10 digits, starts with 6-9
  MOBILE_INDIAN_FORMAT: /^(\+91)?[6-9]\d{9}$/, // With or without +91
  EMPLOYEE_ID: /^[A-Z0-9]{3,20}$/,
  CASE_NUMBER: /^\d{1,6}$/, // 1 to 6 digits
  CASE_YEAR: /^\d{4}$/, // Exactly 4 digits
  CASE_TYPE: /^[A-Z]{1,10}$/, // 1-10 uppercase letters
  URL: /^https?:\/\/.+/,
  NAME: /^[a-zA-Z\s\-'\.]+$/, // Allow dots for abbreviations like Sr., Jr.
  ADVOCATE_NAME: /^[a-zA-Z\s\-'\.]+$/, // Same as name pattern
  ALPHANUMERIC: /^[a-zA-Z0-9\s]+$/,
  NUMERIC: /^\d+$/,
  DECIMAL: /^\d+(\.\d{1,2})?$/,
  INDIAN_CURRENCY: /^[0-9,]+(\.[0-9]{1,2})?$/, // Indian format with commas
  DATE_DD_MM_YYYY: /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-(\d{4})$/,
};

// ===== APPLICATION SETTINGS (Updated) =====
export const APP_SETTINGS = {
  ITEMS_PER_PAGE: 25,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['xlsx', 'xls', 'csv'],
  AUTO_LOGOUT_TIME: 60 * 60 * 1000, // 1 hour in milliseconds
  DEBOUNCE_DELAY: 300, // milliseconds
  TOAST_DURATION: 5000, // milliseconds
  AUTO_SAVE_INTERVAL: 30000, // 30 seconds
  DRAFT_CLEANUP_DAYS: 7, // Clean drafts older than 7 days
  HEARING_REMINDER_DAYS: 1, // Send reminder 1 day before hearing
  MAX_SEARCH_RESULTS: 1000,
  BULK_IMPORT_MAX_ROWS: 5000,
};

// ===== TABLE SETTINGS (Updated) =====
export const TABLE_SETTINGS = {
  DEFAULT_PAGE_SIZE: 25,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  MAX_ROWS_EXPORT: 10000,
  STICKY_HEADER: true,
  DEFAULT_SORT: { field: 'date_of_filing', order: 'desc' }, // Changed to new field
  ENABLE_COLUMN_RESIZE: true,
  ENABLE_COLUMN_REORDER: true,
  SHOW_ROW_NUMBERS: true,
  HIGHLIGHT_OVERDUE: true, // Highlight overdue cases
  HEARING_DUE_THRESHOLD: 2, // Days before hearing to highlight
};

// ===== DASHBOARD SETTINGS (Updated) =====
export const DASHBOARD_SETTINGS = {
  RECENT_CASES_LIMIT: 10,
  CHART_COLORS: {
    PRIMARY: '#2563eb',
    SUCCESS: '#059669',
    WARNING: '#d97706',
    DANGER: '#dc2626',
    INFO: '#0891b2',
    PURPLE: '#7c3aed',
    PINK: '#db2777',
    INDIGO: '#4f46e5',
  },
  REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes
  HEARING_ALERTS_DAYS: 7, // Show hearings for next 7 days
  HIGH_VALUE_THRESHOLD: 1000000, // 10 Lakh INR
  OVERDUE_THRESHOLD: 30, // Cases older than 30 days without hearing
};

// ===== FORM FIELD TYPES =====
export const FIELD_TYPES = {
  TEXT: 'text',
  EMAIL: 'email',
  PASSWORD: 'password',
  NUMBER: 'number',
  DATE: 'date',
  DATETIME: 'datetime-local',
  SELECT: 'select',
  MULTI_SELECT: 'multiselect',
  TEXTAREA: 'textarea',
  RICH_TEXT: 'richtext',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  FILE: 'file',
  URL: 'url',
  TEL: 'tel',
  CURRENCY: 'currency',
  POPUP_TEXT: 'popup-text', // For popup modal fields
};

// ===== HTTP STATUS CODES =====
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
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
};

// ===== EXPORT FORMAT OPTIONS =====
export const EXPORT_FORMATS = [
  { value: 'excel', label: 'Excel (.xlsx)', icon: '📊', description: 'Excel format with formatting' },
  { value: 'csv', label: 'CSV (.csv)', icon: '📄', description: 'Comma-separated values' },
  { value: 'pdf', label: 'PDF (.pdf)', icon: '📋', description: 'PDF document' },
];

// ===== THEME COLORS (Updated) =====
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
  HEARING_DUE: '#f59e0b', // Orange for upcoming hearings
  OVERDUE: '#dc2626', // Red for overdue cases  
  HIGH_VALUE: '#7c3aed', // Purple for high-value cases
};

// ===== RESPONSIVE BREAKPOINTS =====
export const BREAKPOINTS = {
  SM: '640px',
  MD: '768px',
  LG: '1024px',
  XL: '1280px',
  '2XL': '1536px',
};

// ===== DEFAULT VALUES (Updated for Excel Format) =====
export const DEFAULT_VALUES = {
  USER: {
    user_type: 'user',
    is_active: true,
    department_name: '',
  },
  CASE: {
    // New Excel format defaults
    case_type: 'CS',
    case_year: new Date().getFullYear(),
    nature_of_claim: 'Service',
    internal_department: '',
    financial_implications: null,
    present_status: 'Pending',
    is_auto_saved: false,
  },
  PAGINATION: {
    page: 1,
    page_size: 25,
    total: 0,
  },
  FILTERS: {
    search: '',
    internal_department: '',
    case_type: '',
    nature_of_claim: '',
    present_status: '',
    date_from: null,
    date_to: null,
    sort_by: 'date_of_filing',
    sort_order: 'desc',
  },
};

// ===== ERROR MESSAGES (Updated) =====
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied. Insufficient permissions.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Internal server error. Please try again later.',
  VALIDATION_ERROR: 'Please correct the errors and try again.',
  DUPLICATE_ERROR: 'A record with this information already exists.',
  DUPLICATE_CASE: 'A case with this Case Type/Number/Year combination already exists.',
  DELETE_ERROR: 'Unable to delete. This record may be in use.',
  UPLOAD_ERROR: 'File upload failed. Please try again.',
  EXPORT_ERROR: 'Export failed. Please try again.',
  LOGIN_FAILED: 'Invalid credentials. Please try again.',
  SESSION_EXPIRED: 'Your session has expired. Please login again.',
  FORM_VALIDATION: 'Please fill in all required fields correctly.',
  PASSWORD_WEAK: 'Password must contain uppercase, lowercase, number and special character.',
  AUTO_SAVE_FAILED: 'Auto-save failed. Please save manually.',
  CASE_LIMIT_EXCEEDED: 'Case number cannot exceed 999999.',
  MOBILE_INVALID: 'Mobile number must be exactly 10 digits and start with 6, 7, 8, or 9.',
  CURRENCY_INVALID: 'Please enter a valid currency amount.',
  DATE_FORMAT_INVALID: 'Please enter date in DD-MM-YYYY format.',
  HEARING_DATE_LOGIC: 'Next hearing date cannot be before last hearing date.',
  FILING_DATE_LOGIC: 'Hearing dates cannot be before filing date.',
};

// ===== SUCCESS MESSAGES (Updated) =====
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
  AUTO_SAVED: 'Draft saved automatically!',
  MANUAL_SAVE: 'Case saved successfully!',
  BULK_IMPORT: 'Bulk import completed successfully!',
  NOTIFICATION_SENT: 'Notification sent successfully!',
};

// ===== LOADING STATES =====
export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
  AUTO_SAVING: 'auto_saving',
  UPLOADING: 'uploading',
  EXPORTING: 'exporting',
};

// ===== MODAL TYPES =====
export const MODAL_TYPES = {
  CONFIRM: 'confirm',
  ALERT: 'alert',
  FORM: 'form',
  INFO: 'info',
  POPUP_EDITOR: 'popup_editor', // For popup text fields
  HEARING_REMINDER: 'hearing_reminder',
  AUTO_SAVE_RECOVERY: 'auto_save_recovery',
  BULK_IMPORT: 'bulk_import',
};

// ===== POPUP FIELD CONFIGURATIONS =====
export const POPUP_FIELDS = {
  BRIEF_DESCRIPTION: {
    key: 'brief_description',
    title: 'Brief Description of Matter',
    maxLength: CHAR_LIMITS.BRIEF_DESCRIPTION,
    required: true,
    placeholder: 'Enter detailed description of the matter (max 2500 characters)',
    helpText: 'Provide a comprehensive description of the legal matter',
  },
  RELIEF_CLAIMED: {
    key: 'relief_claimed',
    title: 'Relief Claimed by Party',
    maxLength: CHAR_LIMITS.RELIEF_CLAIMED,
    required: true,
    placeholder: 'Enter relief claimed by the party (max 500 characters)',
    helpText: 'Specify what relief/remedy the party is seeking',
  },
  PRESENT_STATUS: {
    key: 'present_status',
    title: 'Present Status',
    maxLength: CHAR_LIMITS.PRESENT_STATUS,
    required: true,
    placeholder: 'Enter current status of the case (max 500 characters)',
    helpText: 'Describe the current status and recent developments',
  },
  CASE_REMARKS: {
    key: 'case_remarks',
    title: 'Remarks',
    maxLength: CHAR_LIMITS.CASE_REMARKS,
    required: false,
    placeholder: 'Enter any additional remarks (max 500 characters)',
    helpText: 'Any additional comments or observations (optional)',
  },
};

// ===== SEARCH CONFIGURATION =====
export const SEARCH_CONFIG = {
  MIN_SEARCH_LENGTH: 2,
  DEBOUNCE_DELAY: 300,
  MAX_RESULTS: 100,
  SEARCHABLE_FIELDS: [
    'case_id',
    'formatted_case_number',
    'party_petitioner',
    'party_respondent',
    'advocate_name',
    'pending_before_court',
    'brief_description',
    'present_status',
  ],
  ADVANCED_FILTERS: [
    'internal_department',
    'case_type',
    'nature_of_claim',
    'date_of_filing',
    'next_hearing_date',
    'financial_implications',
  ],
};

// ===== COPY-PASTE CONFIGURATION =====
export const COPY_PASTE_CONFIG = {
  ENABLED_FIELDS: [
    'party_petitioner',
    'party_respondent',
    'advocate_name',
    'advocate_email',
    'pending_before_court',
    'brief_description',
    'relief_claimed',
    'present_status',
    'case_remarks',
  ],
  MAX_PASTE_LENGTH: 5000,
  CLEAN_PASTE: true, // Remove formatting when pasting
  PRESERVE_LINE_BREAKS: true,
};

// ===== AUTO-SAVE CONFIGURATION =====
export const AUTO_SAVE_CONFIG = {
  INTERVAL: 30000, // 30 seconds
  ENABLED: true,
  SAVE_ON_BLUR: true,
  SAVE_ON_CHANGE: false, // Only save on interval or blur
  MAX_DRAFTS_PER_USER: 10,
  DRAFT_RETENTION_DAYS: 7,
  RECOVERY_TIMEOUT: 300000, // 5 minutes
};

// ===== NOTIFICATION CONFIGURATION =====
export const NOTIFICATION_CONFIG = {
  SMS_ENABLED: true,
  EMAIL_ENABLED: true,
  HEARING_REMINDER_DAYS: 1, // Send reminder 1 day before
  BATCH_SIZE: 50, // Process notifications in batches
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 60000, // 1 minute
  TEMPLATES: {
    HEARING_REMINDER: {
      SMS: 'Reminder: Court hearing for case {case_id} is scheduled on {hearing_date} at {court}. - CCI Litigation System',
      EMAIL: {
        SUBJECT: 'Court Hearing Reminder - Case {case_id}',
        BODY: 'This is a reminder that you have a court hearing scheduled for tomorrow.\n\nCase: {case_id}\nDate: {hearing_date}\nCourt: {court}\n\nPlease ensure you are prepared.\n\nRegards,\nCCI Litigation Team'
      }
    }
  },
};

// ===== IMPORT/EXPORT CONFIGURATION =====
export const IMPORT_EXPORT_CONFIG = {
  EXCEL_COLUMNS: [
    { key: 'case_type', header: 'Case Type', required: true },
    { key: 'case_number', header: 'Case Number', required: true },
    { key: 'case_year', header: 'Case Year', required: true },
    { key: 'date_of_filing', header: 'Date of Filing/Intimation', required: true },
    { key: 'pending_before_court', header: 'Pending Before Court', required: true },
    { key: 'party_petitioner', header: 'Party Details (Petitioner)', required: true },
    { key: 'party_respondent', header: 'Party Details (Respondent)', required: true },
    { key: 'nature_of_claim', header: 'Nature of Claim', required: true },
    { key: 'advocate_name', header: 'Advocate Name', required: true },
    { key: 'advocate_email', header: 'Advocate Email', required: true },
    { key: 'advocate_mobile', header: 'Advocate Mobile', required: true },
    { key: 'financial_implications', header: 'Financial Implications', required: false },
    { key: 'internal_department', header: 'Internal Department of CCI', required: true },
    { key: 'last_hearing_date', header: 'Last Date of Hearing', required: false },
    { key: 'next_hearing_date', header: 'Next Date of Hearing', required: false },
    { key: 'brief_description', header: 'Brief Description of Matter', required: true },
    { key: 'relief_claimed', header: 'Relief Claimed by Party', required: true },
    { key: 'present_status', header: 'Present Status', required: true },
    { key: 'case_remarks', header: 'Remarks', required: false },
  ],
  MAX_IMPORT_ROWS: 5000,
  SUPPORTED_FORMATS: ['xlsx', 'xls', 'csv'],
  VALIDATION_RULES: {
    case_number: { type: 'number', min: 1, max: 999999 },
    case_year: { type: 'number', min: 1947, max: new Date().getFullYear() + 1 },
    advocate_mobile: { type: 'string', pattern: REGEX_PATTERNS.MOBILE_10_DIGITS },
    advocate_email: { type: 'email' },
    financial_implications: { type: 'number', min: 0 },
  },
};

// ===== NAVIGATION MENU ITEMS (Updated) =====
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
      {
        key: 'case-search',
        label: 'Advanced Search',
        path: '/cases/search',
        permission: PERMISSIONS.CAN_VIEW_ALL_CASES,
      },
      {
        key: 'hearing-calendar',
        label: 'Hearing Calendar',
        path: '/cases/calendar',
        permission: PERMISSIONS.CAN_VIEW_ALL_CASES,
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
    label: 'Reports & Export',
    icon: '📈',
    path: '/reports',
    permission: PERMISSIONS.CAN_EXPORT_DATA,
    subItems: [
      {
        key: 'export-excel',
        label: 'Export to Excel',
        path: '/reports/export',
        permission: PERMISSIONS.CAN_EXPORT_DATA,
      },
      {
        key: 'bulk-import',
        label: 'Bulk Import',
        path: '/reports/import',
        permission: PERMISSIONS.CAN_BULK_IMPORT,
      },
      {
        key: 'analytics',
        label: 'Analytics',
        path: '/reports/analytics',
        permission: PERMISSIONS.CAN_VIEW_DASHBOARD,
      },
    ],
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: '⚙️',
    path: '/settings',
    permission: PERMISSIONS.CAN_MANAGE_USERS,
    subItems: [
      {
        key: 'notifications',
        label: 'Notifications',
        path: '/settings/notifications',
        permission: PERMISSIONS.CAN_MANAGE_USERS,
      },
      {
        key: 'auto-save',
        label: 'Auto-Save Settings',
        path: '/settings/autosave',
        permission: PERMISSIONS.CAN_VIEW_DASHBOARD,
      },
    ],
  },
];

// ===== UTILITY FUNCTIONS =====
export const UTILITY_FUNCTIONS = {
  // Format Indian currency
  formatIndianCurrency: (amount) => {
    if (!amount) return 'Rs. 0.00';
    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return formatter.format(amount).replace('₹', 'Rs.');
  },
  
  // Format date to DD-MM-YYYY
  formatDateDDMMYYYY: (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  },
  
  // Parse DD-MM-YYYY to ISO date
  parseDateDDMMYYYY: (dateStr) => {
    if (!dateStr) return null;
    const [day, month, year] = dateStr.split('-');
    return new Date(year, month - 1, day);
  },
  
  // Validate mobile number
  validateMobileNumber: (mobile) => {
    return REGEX_PATTERNS.MOBILE_10_DIGITS.test(mobile);
  },
  
  // Generate case ID
  generateCaseId: (caseType, caseNumber, caseYear) => {
    return `${caseType}/${caseNumber}/${caseYear}`;
  },
  
  // Calculate case age in days
  calculateCaseAge: (filingDate) => {
    if (!filingDate) return 0;
    const today = new Date();
    const filed = new Date(filingDate);
    const diffTime = Math.abs(today - filed);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },
  
  // Check if hearing is due soon
  isHearingDueSoon: (hearingDate, threshold = 2) => {
    if (!hearingDate) return false;
    const today = new Date();
    const hearing = new Date(hearingDate);
    const diffTime = hearing - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= threshold;
  },
  
  // Truncate text
  truncateText: (text, maxLength = 50) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  },
  
  // Clean HTML tags from text
  stripHtmlTags: (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
  },
  
  // Get initials from name
  getInitials: (name) => {
    if (!name) return '';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().substring(0, 2);
  },
};

// ===== KEYBOARD SHORTCUTS =====
export const KEYBOARD_SHORTCUTS = {
  SAVE_CASE: 'Ctrl+S',
  NEW_CASE: 'Ctrl+N',
  SEARCH: 'Ctrl+F',
  EXPORT: 'Ctrl+E',
  REFRESH: 'F5',
  CLOSE_MODAL: 'Escape',
  NEXT_PAGE: 'Ctrl+Right',
  PREV_PAGE: 'Ctrl+Left',
};

// ===== HELP TEXT =====
export const HELP_TEXT = {
  CASE_TYPE: 'Select the type of legal case (CS, WP, SLP, etc.)',
  CASE_NUMBER: 'Enter the case number assigned by the court (1-999999)',
  CASE_YEAR: 'Enter the year when the case was filed',
  DATE_FORMAT: 'Please enter date in DD-MM-YYYY format',
  ADVOCATE_MOBILE: 'Enter 10-digit mobile number starting with 6, 7, 8, or 9',
  FINANCIAL_AMOUNT: 'Enter amount in Indian Rupees (optional)',
  POPUP_FIELDS: 'Click the button next to the field to open a larger text editor',
  AUTO_SAVE: 'Your work is automatically saved every 30 seconds',
  SEARCH_HELP: 'Search across case ID, parties, advocate name, and court details',
  EXPORT_HELP: 'Export data in Excel format matching the original template',
  BULK_IMPORT: 'Import multiple cases using Excel template',
  HEARING_ALERTS: 'System sends SMS/Email reminders 1 day before hearings',
};

// Default export with all constants
export default {
  API_BASE_URL,
  API_ENDPOINTS,
  STORAGE_KEYS,
  USER_ROLES,
  PERMISSIONS,
  DEPARTMENT_OPTIONS,
  CASE_TYPE_OPTIONS,
  NATURE_OF_CLAIM_OPTIONS,
  PRESENT_STATUS_OPTIONS,
  COURT_OPTIONS,
  PRIORITY_OPTIONS,
  CASE_TABLE_COLUMNS,
  USER_TABLE_COLUMNS,
  DATE_FORMATS,
  VALIDATION_MESSAGES,
  CHAR_LIMITS,
  CURRENCY_FORMATS,
  REGEX_PATTERNS,
  APP_SETTINGS,
  TABLE_SETTINGS,
  DASHBOARD_SETTINGS,
  FIELD_TYPES,
  HTTP_STATUS,
  EXPORT_FORMATS,
  THEME_COLORS,
  BREAKPOINTS,
  DEFAULT_VALUES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  LOADING_STATES,
  MODAL_TYPES,
  POPUP_FIELDS,
  SEARCH_CONFIG,
  COPY_PASTE_CONFIG,
  AUTO_SAVE_CONFIG,
  NOTIFICATION_CONFIG,
  IMPORT_EXPORT_CONFIG,
  MENU_ITEMS,
  UTILITY_FUNCTIONS,
  KEYBOARD_SHORTCUTS,
  HELP_TEXT,
};