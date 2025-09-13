// utils/formatters.js - Indian Currency & Date Formatting for CCI Litigation System

/**
 * Format currency in Indian Rupee format
 * Example: 1000000 -> Rs. 10,00,000.00
 * @param {number|string} amount - Amount to format
 * @param {boolean} includePaisa - Include paisa (decimal) or not
 * @returns {string} Formatted currency string
 */
export const formatIndianCurrency = (amount, includePaisa = true) => {
  if (!amount && amount !== 0) return 'Rs. 0.00';
  
  const num = parseFloat(amount);
  if (isNaN(num)) return 'Rs. 0.00';
  
  // Convert to Indian numbering system
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: includePaisa ? 2 : 0,
    maximumFractionDigits: includePaisa ? 2 : 0,
  });
  
  return formatter.format(num).replace('₹', 'Rs.');
};

/**
 * Format date to DD-MM-YYYY format
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatIndianDate = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}-${month}-${year}`;
};

/**
 * Format date for API (YYYY-MM-DD)
 * @param {string|Date} date - Date to format
 * @returns {string} API formatted date string
 */
export const formatApiDate = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  return d.toISOString().split('T')[0];
};

/**
 * Parse DD-MM-YYYY to Date object
 * @param {string} dateString - Date string in DD-MM-YYYY format
 * @returns {Date|null} Date object or null if invalid
 */
export const parseIndianDate = (dateString) => {
  if (!dateString) return null;
  
  const parts = dateString.split('-');
  if (parts.length !== 3) return null;
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
  const year = parseInt(parts[2], 10);
  
  const date = new Date(year, month, day);
  if (isNaN(date.getTime())) return null;
  
  return date;
};

/**
 * Format mobile number to 10-digit Indian format
 * @param {string} mobile - Mobile number
 * @returns {string} Formatted mobile number
 */
export const formatIndianMobile = (mobile) => {
  if (!mobile) return '';
  
  // Remove all non-digits
  const cleaned = mobile.replace(/\D/g, '');
  
  // Remove country code if present
  let formatted = cleaned;
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    formatted = cleaned.substring(2);
  } else if (cleaned.startsWith('+91') && cleaned.length === 13) {
    formatted = cleaned.substring(3);
  }
  
  // Return only if it's 10 digits starting with 6-9
  if (formatted.length === 10 && /^[6-9]/.test(formatted)) {
    return formatted;
  }
  
  return mobile; // Return original if can't format
};

/**
 * Validate Indian mobile number
 * @param {string} mobile - Mobile number to validate
 * @returns {boolean} True if valid Indian mobile number
 */
export const validateIndianMobile = (mobile) => {
  const formatted = formatIndianMobile(mobile);
  return /^[6-9]\d{9}$/.test(formatted);
};

/**
 * Format case number (Type/Number/Year)
 * @param {string} caseType - Case type (e.g., 'CRL', 'CIV')
 * @param {number} caseNumber - Case number
 * @param {number} caseYear - Case year
 * @returns {string} Formatted case number
 */
export const formatCaseNumber = (caseType, caseNumber, caseYear) => {
  if (!caseType || !caseNumber || !caseYear) return '';
  return `${caseType}/${caseNumber}/${caseYear}`;
};

/**
 * Parse case number string to components
 * @param {string} caseId - Case ID string (Type/Number/Year)
 * @returns {object} Object with caseType, caseNumber, caseYear
 */
export const parseCaseNumber = (caseId) => {
  if (!caseId) return { caseType: '', caseNumber: '', caseYear: '' };
  
  const parts = caseId.split('/');
  return {
    caseType: parts[0] || '',
    caseNumber: parts[1] || '',
    caseYear: parts[2] || ''
  };
};

/**
 * Format text for display (truncate with ellipsis)
 * @param {string} text - Text to format
 * @param {number} maxLength - Maximum length
 * @returns {string} Formatted text
 */
export const formatDisplayText = (text, maxLength = 100) => {
  if (!text) return '';
  
  // Remove HTML tags if present
  const cleanText = text.replace(/<[^>]*>/g, '').trim();
  
  if (cleanText.length <= maxLength) return cleanText;
  return cleanText.substring(0, maxLength - 3) + '...';
};

/**
 * Format HTML content for display
 * @param {string} htmlContent - HTML content
 * @returns {string} Plain text content
 */
export const formatHtmlToText = (htmlContent) => {
  if (!htmlContent) return '';
  
  const doc = new DOMParser().parseFromString(htmlContent, 'text/html');
  return doc.body.textContent || '';
};

/**
 * Format file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (!bytes) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Format relative time (e.g., "2 days ago")
 * @param {string|Date} date - Date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  } else {
    return 'Just now';
  }
};

/**
 * Format case age in human readable format
 * @param {string|Date} institutionDate - Date of institution
 * @returns {string} Case age string
 */
export const formatCaseAge = (institutionDate) => {
  if (!institutionDate) return '';
  
  const d = new Date(institutionDate);
  if (isNaN(d.getTime())) return '';
  
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffYears = Math.floor(diffDays / 365);
  const remainingDays = diffDays % 365;
  const diffMonths = Math.floor(remainingDays / 30);
  
  if (diffYears > 0) {
    if (diffMonths > 0) {
      return `${diffYears} year${diffYears === 1 ? '' : 's'}, ${diffMonths} month${diffMonths === 1 ? '' : 's'}`;
    }
    return `${diffYears} year${diffYears === 1 ? '' : 's'}`;
  } else if (diffMonths > 0) {
    return `${diffMonths} month${diffMonths === 1 ? '' : 's'}`;
  } else {
    return `${diffDays} day${diffDays === 1 ? '' : 's'}`;
  }
};

/**
 * Format status badge color
 * @param {string} status - Case status
 * @returns {string} Material-UI color
 */
export const getStatusColor = (status) => {
  const statusColors = {
    'pending': 'warning',
    'under_hearing': 'info',
    'admitted': 'primary',
    'disposed': 'success',
    'closed': 'success',
    'dismissed': 'error',
    'settled': 'success',
    'withdrawn': 'default'
  };
  
  return statusColors[status] || 'default';
};

/**
 * Format priority badge color
 * @param {string} priority - Case priority
 * @returns {string} Material-UI color
 */
export const getPriorityColor = (priority) => {
  const priorityColors = {
    'low': 'default',
    'medium': 'info',
    'high': 'warning',
    'urgent': 'error'
  };
  
  return priorityColors[priority] || 'default';
};

/**
 * Check if hearing date is approaching (within 7 days)
 * @param {string|Date} hearingDate - Next hearing date
 * @returns {boolean} True if hearing is approaching
 */
export const isHearingApproaching = (hearingDate) => {
  if (!hearingDate) return false;
  
  const d = new Date(hearingDate);
  if (isNaN(d.getTime())) return false;
  
  const now = new Date();
  const diffMs = d - now;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  return diffDays >= 0 && diffDays <= 7;
};

/**
 * Check if hearing date is overdue
 * @param {string|Date} hearingDate - Next hearing date
 * @returns {boolean} True if hearing is overdue
 */
export const isHearingOverdue = (hearingDate) => {
  if (!hearingDate) return false;
  
  const d = new Date(hearingDate);
  if (isNaN(d.getTime())) return false;
  
  const now = new Date();
  return d < now;
};

/**
 * Generate initials from full name
 * @param {string} fullName - Full name
 * @returns {string} Initials
 */
export const generateInitials = (fullName) => {
  if (!fullName) return '';
  
  return fullName
    .split(' ')
    .map(name => name.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
};

// Export default object with all formatters
export default {
  formatIndianCurrency,
  formatIndianDate,
  formatApiDate,
  parseIndianDate,
  formatIndianMobile,
  validateIndianMobile,
  formatCaseNumber,
  parseCaseNumber,
  formatDisplayText,
  formatHtmlToText,
  formatFileSize,
  formatRelativeTime,
  formatCaseAge,
  getStatusColor,
  getPriorityColor,
  isHearingApproaching,
  isHearingOverdue,
  generateInitials
};