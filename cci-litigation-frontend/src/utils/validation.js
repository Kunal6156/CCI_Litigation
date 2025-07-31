import { CHAR_LIMITS } from './constants';
import { isBefore, isPast, parseISO, isValid } from 'date-fns';

// Helper function for required rule with better validation
export const requiredRule = (message = 'This field is required.') => ({
    required: message,
    validate: {
        required: value => {
            if (typeof value === 'string') {
                // Remove HTML tags and check if content exists
                const textContent = value.replace(/<[^>]*>/g, '').trim();
                return textContent !== '' || message;
            }
            return (value !== null && value !== undefined && value !== '') || message;
        }
    }
});

// Helper function for character limit rule
export const charLimitRule = (limit, message) => ({
    maxLength: {
        value: limit,
        message: message || `This field cannot exceed ${limit} characters.`,
    },
    validate: {
        charLimit: value => {
            if (!value) return true;
            // For HTML content, check text content length
            if (typeof value === 'string' && value.includes('<')) {
                const textContent = value.replace(/<[^>]*>/g, '').trim();
                return textContent.length <= limit || message || `This field cannot exceed ${limit} characters.`;
            }
            // For regular text
            return value.length <= limit || message || `This field cannot exceed ${limit} characters.`;
        }
    }
});

// Helper for URL validation (optional field)
export const urlRule = (message = 'Please enter a valid URL.') => ({
    validate: {
        isValidUrl: value => {
            if (!value || value.trim() === '') return true; // Optional field
            // Regex for basic URL validation, allows http/https and various domain formats
            const urlRegex = /^(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|[a-zA-Z0-9]+\.[^\s]{2,})$/i;
            return urlRegex.test(value.trim()) || message;
        }
    }
});

// Date validation helper for mandatory dates
export const dateMandatoryRules = {
    ...requiredRule('This date is required.'),
    validate: {
        required: value => {
            return (value && value.trim() !== '') || 'This date is required.';
        },
        isValidDate: value => {
            if (!value) return 'This date is required.';
            const date = parseISO(value);
            return isValid(date) || 'Invalid date format.';
        },
        isNotFutureDate: value => {
            if (!value) return true;
            const date = parseISO(value);
            if (!isValid(date)) return true; // Let other validation handle invalid dates
            
            const today = new Date();
            today.setHours(23, 59, 59, 999); // End of today
            return date <= today || 'Date cannot be in the future.';
        }
    },
};

// Date validation helper for optional dates
export const dateOptionalRules = {
    validate: {
        isValidDate: value => {
            if (!value || value.trim() === '') return true; // Optional, so null/empty is fine
            const date = parseISO(value);
            return isValid(date) || 'Invalid date format.';
        },
        isNotTooFarInFuture: value => {
            if (!value || value.trim() === '') return true;
            const date = parseISO(value);
            if (!isValid(date)) return true;
            
            const oneYearFromNow = new Date();
            oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
            return date <= oneYearFromNow || 'Date cannot be more than one year in the future.';
        }
    },
};

// Specific date validation: Date of Final Order cannot be before Date of Institution
export const finalOrderDateRules = (getValues) => ({
    ...dateOptionalRules, // It's optional, but if provided, validate
    validate: {
        ...dateOptionalRules.validate, // Keep basic date format validation
        isNotBeforeInstitutionDate: value => {
            if (!value || value.trim() === '') return true;
            const institutionDateStr = getValues.date_of_institution;
            if (!institutionDateStr || institutionDateStr.trim() === '') return true; // Can't compare if institution date isn't set

            const finalOrderDate = parseISO(value);
            const institutionDate = parseISO(institutionDateStr);

            if (isValid(finalOrderDate) && isValid(institutionDate)) {
                return !isBefore(finalOrderDate, institutionDate) || 'Date of Final Order cannot be before Date of Institution.';
            }
            return true; // If dates are invalid, other rules will catch it
        },
        isNotTooFarInPast: value => {
            if (!value || value.trim() === '') return true;
            const date = parseISO(value);
            if (!isValid(date)) return true;
            
            const fiftyYearsAgo = new Date();
            fiftyYearsAgo.setFullYear(fiftyYearsAgo.getFullYear() - 50);
            return date >= fiftyYearsAgo || 'Date cannot be more than 50 years in the past.';
        }
    },
});

// Password rules for user management
export const passwordRules = {
    ...requiredRule('Password is required.'),
    minLength: {
        value: 8,
        message: 'Password must be at least 8 characters long.',
    },
    validate: {
        hasUpperCase: value => {
            if (!value) return true;
            return /[A-Z]/.test(value) || 'Password must contain at least one uppercase letter.';
        },
        hasLowerCase: value => {
            if (!value) return true;
            return /[a-z]/.test(value) || 'Password must contain at least one lowercase letter.';
        },
        hasNumber: value => {
            if (!value) return true;
            return /\d/.test(value) || 'Password must contain at least one number.';
        },
        hasSpecialChar: value => {
            if (!value) return true;
            return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value) || 'Password must contain at least one special character.';
        }
    }
};

// Confirm password rules
export const confirmPasswordRules = (getValues) => ({
    ...requiredRule('Please confirm your password.'),
    validate: {
        matches: value => {
            const password = getValues('password');
            return value === password || 'Passwords do not match.';
        }
    }
});

// Email rules
export const emailRules = {
    ...requiredRule('Email is required.'),
    validate: {
        isValidEmail: value => {
            if (!value) return 'Email is required.';
            const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
            return emailRegex.test(value) || 'Invalid email address.';
        },
        isNotTooLong: value => {
            return !value || value.length <= 254 || 'Email address is too long.';
        }
    }
};

// Username rules
export const usernameRules = {
    ...requiredRule('Username is required.'),
    minLength: {
        value: 3,
        message: 'Username must be at least 3 characters long.',
    },
    maxLength: {
        value: 30,
        message: 'Username cannot exceed 30 characters.',
    },
    validate: {
        isValidFormat: value => {
            if (!value) return true;
            const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
            return usernameRegex.test(value) || 'Username can only contain letters, numbers, dots, hyphens, and underscores.';
        },
        noSpaces: value => {
            if (!value) return true;
            return !/\s/.test(value) || 'Username cannot contain spaces.';
        }
    }
};

// Phone number rules (optional)
export const phoneRules = {
    validate: {
        isValidPhone: value => {
            if (!value || value.trim() === '') return true; // Optional field
            const phoneRegex = /^[+]?[\d\s\-\(\)]{10,15}$/;
            return phoneRegex.test(value) || 'Invalid phone number format.';
        }
    }
};

// Text content validation for rich text editors
export const richTextRules = (isRequired = false, charLimit = null) => {
    const rules = {
        validate: {}
    };

    if (isRequired) {
        rules.validate.notEmpty = value => {
            if (!value) return 'This field is required.';
            const textContent = value.replace(/<[^>]*>/g, '').trim();
            return textContent.length > 0 || 'This field cannot be empty.';
        };
    }

    if (charLimit) {
        rules.validate.charLimit = value => {
            if (!value) return true;
            const textContent = value.replace(/<[^>]*>/g, '').trim();
            return textContent.length <= charLimit || `This field cannot exceed ${charLimit} characters.`;
        };
    }

    return rules;
};

// Case ID validation (specific format if needed)
export const caseIdRules = {
    ...requiredRule('Case ID is required.'),
    ...charLimitRule(CHAR_LIMITS.CASE_ID, `Case ID cannot exceed ${CHAR_LIMITS.CASE_ID} characters.`),
    validate: {
        isValidFormat: value => {
            if (!value) return true;
            // Add specific case ID format validation if required
            // Example: CCI/2024/001 format
            // const caseIdRegex = /^CCI\/\d{4}\/\d{3}$/;
            // return caseIdRegex.test(value) || 'Case ID must be in format CCI/YYYY/XXX';
            return true; // For now, accept any format
        },
        noSpecialChars: value => {
            if (!value) return true;
            // Allow only alphanumeric, hyphens, slashes, and underscores
            const validCharsRegex = /^[a-zA-Z0-9\-/_\s]+$/;
            return validCharsRegex.test(value) || 'Case ID contains invalid characters.';
        }
    }
};