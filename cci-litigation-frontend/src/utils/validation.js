// =============================================
// CCI LITIGATION SYSTEM - UPDATED VALIDATION
// Excel Format Compatible (2024)
// =============================================

import {
  CHAR_LIMITS,
  REGEX_PATTERNS,
  VALIDATION_MESSAGES,
  CASE_TYPE_OPTIONS,
  NATURE_OF_CLAIM_OPTIONS,
  PRESENT_STATUS_OPTIONS,
  DEPARTMENT_OPTIONS
} from './constants';
import { isBefore, isPast, parseISO, isValid, parse, format } from 'date-fns';

// ===== HELPER FUNCTIONS =====

// Helper function for required rule with better validation
export const requiredRule = (message = VALIDATION_MESSAGES.REQUIRED) => ({
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

// Helper for dropdown validation
export const dropdownRule = (options, fieldName, message) => ({
  ...requiredRule(message || `${fieldName} is required.`),
  validate: {
    isValidOption: value => {
      if (!value) return message || `${fieldName} is required.`;
      const validValues = options.map(opt => opt.value);
      return validValues.includes(value) || `Please select a valid ${fieldName.toLowerCase()}.`;
    }
  }
});
// Add this new rule
export const unitOfCciRules = {
  ...requiredRule('Unit of CCI is mandatory.'),
  ...charLimitRule(100, 'Unit of CCI cannot exceed 100 characters.')
};

// Helper for DD-MM-YYYY date validation
export const parseDDMMYYYY = (dateStr) => {
  if (!dateStr) return null;
  try {
    // Parse DD-MM-YYYY format
    return parse(dateStr, 'dd-MM-yyyy', new Date());
  } catch {
    return null;
  }
};

// Helper to format date to DD-MM-YYYY
export const formatToDDMMYYYY = (date) => {
  if (!date || !isValid(date)) return '';
  return format(date, 'dd-MM-yyyy');
};

// ===== EXCEL-FORMAT FIELD VALIDATIONS =====

// Case Type validation (Excel Column 1)
export const caseTypeRules = dropdownRule(
  CASE_TYPE_OPTIONS,
  'Case Type',
  VALIDATION_MESSAGES.CASE_TYPE_REQUIRED
);

// Case Number validation (Excel Column 2)
export const caseNumberRules = {
  ...requiredRule(VALIDATION_MESSAGES.CASE_NUMBER_REQUIRED),
  validate: {
    isNumber: value => {
      if (!value) return VALIDATION_MESSAGES.CASE_NUMBER_REQUIRED;
      const num = parseInt(value);
      return !isNaN(num) || VALIDATION_MESSAGES.NUMBER_INVALID;
    },
    isPositive: value => {
      if (!value) return true;
      const num = parseInt(value);
      return num > 0 || VALIDATION_MESSAGES.CASE_NUMBER_POSITIVE;
    },
    withinRange: value => {
      if (!value) return true;
      const num = parseInt(value);
      return (num >= 1 && num <= 999999) || VALIDATION_MESSAGES.CASE_LIMIT_EXCEEDED;
    },
    isInteger: value => {
      if (!value) return true;
      return Number.isInteger(Number(value)) || 'Case number must be a whole number.';
    }
  }
};

// Case Year validation (Excel Column 3)
export const caseYearRules = {
  ...requiredRule(VALIDATION_MESSAGES.CASE_YEAR_REQUIRED),
  validate: {
    isNumber: value => {
      if (!value) return VALIDATION_MESSAGES.CASE_YEAR_REQUIRED;
      const num = parseInt(value);
      return !isNaN(num) || VALIDATION_MESSAGES.NUMBER_INVALID;
    },
    isValidYear: value => {
      if (!value) return true;
      const num = parseInt(value);
      const currentYear = new Date().getFullYear();
      return (num >= 1947 && num <= currentYear + 1) || VALIDATION_MESSAGES.CASE_YEAR_RANGE;
    },
    isFourDigits: value => {
      if (!value) return true;
      const str = value.toString();
      return str.length === 4 || 'Case year must be 4 digits (YYYY format).';
    }
  }
};

// Date of Filing validation (Excel Column 4) - DD-MM-YYYY format
export const dateOfFilingRules = {
  ...requiredRule('Date of filing is required.'),
  validate: {
    isValidFormat: value => {
      if (!value) return 'Date of filing is required.';
      return REGEX_PATTERNS.DATE_DD_MM_YYYY.test(value) || VALIDATION_MESSAGES.DATE_DD_MM_YYYY;
    },
    isValidDate: value => {
      if (!value) return true;
      const date = parseDDMMYYYY(value);
      return (date && isValid(date)) || VALIDATION_MESSAGES.DATE_INVALID;
    },
    isNotFutureDate: value => {
      if (!value) return true;
      const date = parseDDMMYYYY(value);
      if (!date || !isValid(date)) return true;

      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return date <= today || VALIDATION_MESSAGES.DATE_PAST_REQUIRED;
    },
    isReasonableDate: value => {
      if (!value) return true;
      const date = parseDDMMYYYY(value);
      if (!date || !isValid(date)) return true;

      // Allow dates from 1947 onwards (Indian independence)
      const minDate = new Date(1947, 0, 1);
      return date >= minDate || 'Filing date cannot be before 1947.';
    }
  }
};

// Court/Tribunal validation (Excel Column 5)
export const pendingBeforeCourtRules = {
  ...requiredRule(VALIDATION_MESSAGES.COURT_REQUIRED),
  ...charLimitRule(CHAR_LIMITS.COURT_TRIBUNAL, `Court name cannot exceed ${CHAR_LIMITS.COURT_TRIBUNAL} characters.`)
};

// Party Details validation (Excel Columns 6-7)
export const partyPetitionerRules = {
  ...requiredRule(VALIDATION_MESSAGES.PETITIONER_REQUIRED),
  ...charLimitRule(CHAR_LIMITS.PARTY_PETITIONER, `Petitioner details cannot exceed ${CHAR_LIMITS.PARTY_PETITIONER} characters.`)
};

export const partyRespondentRules = {
  ...requiredRule(VALIDATION_MESSAGES.RESPONDENT_REQUIRED),
  ...charLimitRule(CHAR_LIMITS.PARTY_RESPONDENT, `Respondent details cannot exceed ${CHAR_LIMITS.PARTY_RESPONDENT} characters.`)
};

// Nature of Claim validation (Excel Column 8)
export const natureOfClaimRules = dropdownRule(
  NATURE_OF_CLAIM_OPTIONS,
  'Nature of Claim',
  VALIDATION_MESSAGES.NATURE_CLAIM_REQUIRED
);

// Advocate Details validation (Excel Columns 9-11)
export const advocateNameRules = {
  ...requiredRule(VALIDATION_MESSAGES.ADVOCATE_NAME_REQUIRED),
  ...charLimitRule(CHAR_LIMITS.ADVOCATE_NAME, `Advocate name cannot exceed ${CHAR_LIMITS.ADVOCATE_NAME} characters.`),
  validate: {
    isValidName: value => {
      if (!value) return true;
      return REGEX_PATTERNS.ADVOCATE_NAME.test(value) || 'Advocate name contains invalid characters.';
    }
  }
};

export const advocateEmailRules = {
  ...requiredRule(VALIDATION_MESSAGES.ADVOCATE_EMAIL_REQUIRED),
  ...charLimitRule(CHAR_LIMITS.ADVOCATE_EMAIL, `Email cannot exceed ${CHAR_LIMITS.ADVOCATE_EMAIL} characters.`),
  validate: {
    isValidEmail: value => {
      if (!value) return VALIDATION_MESSAGES.ADVOCATE_EMAIL_REQUIRED;
      return REGEX_PATTERNS.EMAIL.test(value) || VALIDATION_MESSAGES.EMAIL_INVALID;
    }
  }
};

export const advocateMobileRules = {
  ...requiredRule(VALIDATION_MESSAGES.ADVOCATE_MOBILE_REQUIRED),
  validate: {
    isExactly10Digits: value => {
      if (!value) return VALIDATION_MESSAGES.ADVOCATE_MOBILE_REQUIRED;
      const cleaned = value.replace(/\D/g, ''); // Remove non-digits
      return cleaned.length === 10 || VALIDATION_MESSAGES.MOBILE_10_DIGITS;
    },
    isValidIndianMobile: value => {
      if (!value) return true;
      const cleaned = value.replace(/\D/g, '');
      return REGEX_PATTERNS.MOBILE_10_DIGITS.test(cleaned) || VALIDATION_MESSAGES.MOBILE_INDIAN_FORMAT;
    },
    noSpecialChars: value => {
      if (!value) return true;
      return /^\d{10}$/.test(value.replace(/\D/g, '')) || 'Mobile number should contain only digits.';
    }
  }
};

// Financial Implications validation (Excel Column 12)
export const financialImplicationsRules = {
  validate: {
    isValidAmount: value => {
      if (!value || value === '') return true; // Optional field
      const num = parseFloat(value);
      return !isNaN(num) || VALIDATION_MESSAGES.CURRENCY_INVALID;
    },
    isPositive: value => {
      if (!value || value === '') return true;
      const num = parseFloat(value);
      return num >= 0 || 'Financial amount cannot be negative.';
    },
    withinLimit: value => {
      if (!value || value === '') return true;
      const num = parseFloat(value);
      return num <= 999999999999.99 || 'Amount is too large.';
    },
    validDecimalPlaces: value => {
      if (!value || value === '') return true;
      const str = value.toString();
      const decimalPart = str.split('.')[1];
      return !decimalPart || decimalPart.length <= 2 || 'Amount can have maximum 2 decimal places.';
    }
  }
};

// Internal Department validation (Excel Column 13)
export const internalDepartmentRules = dropdownRule(
  DEPARTMENT_OPTIONS,
  'Internal Department',
  VALIDATION_MESSAGES.INTERNAL_DEPT_REQUIRED
);

// Date validations for hearing dates (Excel Columns 14-15)
export const lastHearingDateRules = (getValues) => ({
  validate: {
    isValidFormat: value => {
      if (!value || value.trim() === '') return true; // Optional field
      return REGEX_PATTERNS.DATE_DD_MM_YYYY.test(value) || VALIDATION_MESSAGES.DATE_DD_MM_YYYY;
    },
    isValidDate: value => {
      if (!value || value.trim() === '') return true;
      const date = parseDDMMYYYY(value);
      return (date && isValid(date)) || VALIDATION_MESSAGES.DATE_INVALID;
    },
    isNotBeforeFilingDate: value => {
      if (!value || value.trim() === '') return true;
      const filingDateStr = getValues?.date_of_filing;
      if (!filingDateStr) return true;

      const lastHearingDate = parseDDMMYYYY(value);
      const filingDate = parseDDMMYYYY(filingDateStr);

      if (lastHearingDate && filingDate && isValid(lastHearingDate) && isValid(filingDate)) {
        return !isBefore(lastHearingDate, filingDate) || VALIDATION_MESSAGES.FILING_DATE_LOGICAL;
      }
      return true;
    },
    isNotTooFarInPast: value => {
      if (!value || value.trim() === '') return true;
      const date = parseDDMMYYYY(value);
      if (!date || !isValid(date)) return true;

      const fiftyYearsAgo = new Date();
      fiftyYearsAgo.setFullYear(fiftyYearsAgo.getFullYear() - 50);
      return date >= fiftyYearsAgo || 'Date cannot be more than 50 years in the past.';
    }
  }
});

// Replace your current nextHearingDateRules with this:
export const nextHearingDateRules = (getValues) => ({
  ...requiredRule('Next hearing date is required'), // Make it required
  validate: {
    isValidFormat: value => {
      if (!value) return 'Next hearing date is required';
      return REGEX_PATTERNS.DATE_DD_MM_YYYY.test(value) || VALIDATION_MESSAGES.DATE_DD_MM_YYYY;
    },
    isValidDate: value => {
      if (!value) return true;
      const date = parseDDMMYYYY(value);
      return (date && isValid(date)) || VALIDATION_MESSAGES.DATE_INVALID;
    },
    isNotPast: value => {
      if (!value) return true;
      const date = parseDDMMYYYY(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today || 'Next hearing date cannot be in the past';
    },
    isNotBeforeFilingDate: value => {
      if (!value) return true;
      const filingDateStr = getValues?.date_of_filing;
      if (!filingDateStr) return true;

      const nextHearingDate = parseDDMMYYYY(value);
      const filingDate = parseDDMMYYYY(filingDateStr);

      if (nextHearingDate && filingDate && isValid(nextHearingDate) && isValid(filingDate)) {
        return !isBefore(nextHearingDate, filingDate) || VALIDATION_MESSAGES.FILING_DATE_LOGICAL;
      }
      return true;
    },
    isNotBeforeLastHearing: value => {
      if (!value) return true;
      const lastHearingDateStr = getValues?.last_hearing_date;
      if (!lastHearingDateStr) return true;

      const nextHearingDate = parseDDMMYYYY(value);
      const lastHearingDate = parseDDMMYYYY(lastHearingDateStr);

      if (nextHearingDate && lastHearingDate && isValid(nextHearingDate) && isValid(lastHearingDate)) {
        return !isBefore(nextHearingDate, lastHearingDate) || VALIDATION_MESSAGES.HEARING_DATE_LOGICAL;
      }
      return true;
    },
    isNotTooFarInFuture: value => {
      if (!value) return true;
      const date = parseDDMMYYYY(value);
      if (!date || !isValid(date)) return true;

      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 5); // 5 years ahead
      return date <= maxDate || 'Next hearing date cannot be more than 5 years in the future';
    }
  }
});

// ===== POPUP FIELD VALIDATIONS (Excel Columns 16-19) =====

// Brief Description validation (Excel Column 16)
export const briefDescriptionRules = {
  ...requiredRule(VALIDATION_MESSAGES.BRIEF_DESCRIPTION_REQUIRED),
  ...charLimitRule(CHAR_LIMITS.BRIEF_DESCRIPTION, `Brief description cannot exceed ${CHAR_LIMITS.BRIEF_DESCRIPTION} characters.`),
  validate: {
    hasContent: value => {
      if (!value) return VALIDATION_MESSAGES.BRIEF_DESCRIPTION_REQUIRED;
      const textContent = value.replace(/<[^>]*>/g, '').trim();
      return textContent.length >= 10 || 'Brief description must be at least 10 characters long.';
    }
  }
};

// Relief Claimed validation (Excel Column 17)
export const reliefClaimedRules = {
  ...requiredRule(VALIDATION_MESSAGES.RELIEF_CLAIMED_REQUIRED),
  ...charLimitRule(CHAR_LIMITS.RELIEF_CLAIMED, `Relief claimed cannot exceed ${CHAR_LIMITS.RELIEF_CLAIMED} characters.`),
  validate: {
    hasContent: value => {
      if (!value) return VALIDATION_MESSAGES.RELIEF_CLAIMED_REQUIRED;
      const textContent = value.replace(/<[^>]*>/g, '').trim();
      return textContent.length >= 5 || 'Relief claimed must be at least 5 characters long.';
    }
  }
};

// Present Status validation (Excel Column 18)
export const presentStatusRules = {
  ...requiredRule(VALIDATION_MESSAGES.PRESENT_STATUS_REQUIRED),
  ...charLimitRule(CHAR_LIMITS.PRESENT_STATUS, `Present status cannot exceed ${CHAR_LIMITS.PRESENT_STATUS} characters.`),
  validate: {
    hasContent: value => {
      if (!value) return VALIDATION_MESSAGES.PRESENT_STATUS_REQUIRED;
      const textContent = value.replace(/<[^>]*>/g, '').trim();
      return textContent.length >= 5 || 'Present status must be at least 5 characters long.';
    }
  }
};

// Case Remarks validation (Excel Column 19) - Optional
export const caseRemarksRules = {
  ...charLimitRule(CHAR_LIMITS.CASE_REMARKS, `Remarks cannot exceed ${CHAR_LIMITS.CASE_REMARKS} characters.`)
};

// ===== USER MANAGEMENT VALIDATIONS (Unchanged) =====

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

// Email rules for users
export const emailRules = {
  ...requiredRule('Email is required.'),
  validate: {
    isValidEmail: value => {
      if (!value) return 'Email is required.';
      return REGEX_PATTERNS.EMAIL.test(value) || VALIDATION_MESSAGES.EMAIL_INVALID;
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
    value: CHAR_LIMITS.USERNAME,
    message: `Username cannot exceed ${CHAR_LIMITS.USERNAME} characters.`,
  },
  validate: {
    isValidFormat: value => {
      if (!value) return true;
      return REGEX_PATTERNS.USERNAME.test(value) || 'Username can only contain letters, numbers, dots, hyphens, and underscores.';
    },
    noSpaces: value => {
      if (!value) return true;
      return !/\s/.test(value) || 'Username cannot contain spaces.';
    }
  }
};

// Phone number rules (optional for users)
export const phoneRules = {
  validate: {
    isValidPhone: value => {
      if (!value || value.trim() === '') return true; // Optional field
      const phoneRegex = /^[+]?[\d\s\-\(\)]{10,15}$/;
      return phoneRegex.test(value) || 'Invalid phone number format.';
    }
  }
};

// Name validation rules
export const firstNameRules = {
  ...requiredRule('First name is required.'),
  ...charLimitRule(CHAR_LIMITS.FIRST_NAME, `First name cannot exceed ${CHAR_LIMITS.FIRST_NAME} characters.`),
  validate: {
    isValidName: value => {
      if (!value) return true;
      return REGEX_PATTERNS.NAME.test(value) || 'First name contains invalid characters.';
    }
  }
};

export const lastNameRules = {
  ...requiredRule('Last name is required.'),
  ...charLimitRule(CHAR_LIMITS.LAST_NAME, `Last name cannot exceed ${CHAR_LIMITS.LAST_NAME} characters.`),
  validate: {
    isValidName: value => {
      if (!value) return true;
      return REGEX_PATTERNS.NAME.test(value) || 'Last name contains invalid characters.';
    }
  }
};

// Department selection for users
export const userDepartmentRules = dropdownRule(
  DEPARTMENT_OPTIONS,
  'Department',
  'Department is required.'
);

// ===== UTILITY VALIDATION FUNCTIONS =====

// Rich text validation for popup fields
export const richTextRules = (isRequired = false, charLimit = null, minLength = 0) => {
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

  if (minLength > 0) {
    rules.validate.minLength = value => {
      if (!value && !isRequired) return true;
      const textContent = value ? value.replace(/<[^>]*>/g, '').trim() : '';
      return textContent.length >= minLength || `This field must be at least ${minLength} characters long.`;
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

// URL validation helper (optional field)
export const urlRule = (message = 'Please enter a valid URL.') => ({
  validate: {
    isValidUrl: value => {
      if (!value || value.trim() === '') return true; // Optional field
      return REGEX_PATTERNS.URL.test(value.trim()) || message;
    }
  }
});

// Custom validation for case uniqueness
export const caseUniquenessRules = (getValues, existingCases = []) => ({
  validate: {
    isUnique: () => {
      const caseType = getValues('case_type');
      const caseNumber = getValues('case_number');
      const caseYear = getValues('case_year');

      if (!caseType || !caseNumber || !caseYear) return true;

      const caseId = `${caseType}/${caseNumber}/${caseYear}`;
      const isDuplicate = existingCases.some(existingCase =>
        existingCase.case_id === caseId
      );

      return !isDuplicate || VALIDATION_MESSAGES.DUPLICATE_CASE;
    }
  }
});

// ===== FORM-LEVEL VALIDATION RULES =====

// Complete case form validation
export const getCaseFormValidationRules = (getValues, existingCases = []) => ({
  // Excel Column 1-3: Case Number components
  unit_of_cci: unitOfCciRules,
  
  // Update these to remove dropdown validation
  case_type: {
    ...requiredRule('Case Type is mandatory.'),
    ...charLimitRule(50, 'Case Type cannot exceed 50 characters.')
  },
  case_number: {
    ...caseNumberRules,
    ...caseUniquenessRules(getValues, existingCases)
  },
  case_year: caseYearRules,

  // Excel Column 4: Date of Filing
  date_of_filing: dateOfFilingRules,

  // Excel Column 5: Court/Tribunal
  pending_before_court: pendingBeforeCourtRules,

  // Excel Columns 6-7: Party Details
  party_petitioner: partyPetitionerRules,
  party_respondent: partyRespondentRules,

  // Excel Column 8: Nature of Claim
  nature_of_claim: natureOfClaimRules,

  // Excel Columns 9-11: Advocate Details
  advocate_name: advocateNameRules,
  advocate_email: advocateEmailRules,
  advocate_mobile: advocateMobileRules,

  // Excel Column 12: Financial Implications
  financial_implications: financialImplicationsRules,

  // Excel Column 13: Internal Department
  internal_department: {
    ...requiredRule('Internal Department is mandatory.'),
    ...charLimitRule(100, 'Internal Department cannot exceed 100 characters.')
  },

  // Excel Columns 14-15: Hearing Dates
  last_hearing_date: lastHearingDateRules(getValues),
  next_hearing_date: nextHearingDateRules(getValues),

  // Excel Columns 16-19: Popup Fields
  brief_description: briefDescriptionRules,
  relief_claimed: reliefClaimedRules,
  present_status: presentStatusRules,
  case_remarks: caseRemarksRules
});

// User form validation rules
export const getUserFormValidationRules = (getValues) => ({
  username: usernameRules,
  first_name: firstNameRules,
  last_name: lastNameRules,
  email: emailRules,
  password: passwordRules,
  confirm_password: confirmPasswordRules(getValues),
  department_name: userDepartmentRules,
  phone_number: phoneRules
});

// ===== BULK VALIDATION HELPERS =====

// Validate entire case data object
export const validateCaseData = (caseData, existingCases = []) => {
  const errors = {};

  // Required field validations
  const requiredFields = [
    'case_type', 'case_number', 'case_year', 'date_of_filing',
    'pending_before_court', 'party_petitioner', 'party_respondent',
    'nature_of_claim', 'advocate_name', 'advocate_email', 'advocate_mobile',
    'internal_department', 'brief_description', 'relief_claimed', 'present_status'
  ];

  requiredFields.forEach(field => {
    if (!caseData[field] || caseData[field].toString().trim() === '') {
      errors[field] = `${field.replace(/_/g, ' ')} is required.`;
    }
  });

  // Specific validations
  if (caseData.case_number) {
    const num = parseInt(caseData.case_number);
    if (isNaN(num) || num <= 0 || num > 999999) {
      errors.case_number = VALIDATION_MESSAGES.CASE_LIMIT_EXCEEDED;
    }
  }

  if (caseData.advocate_mobile) {
    const cleaned = caseData.advocate_mobile.replace(/\D/g, '');
    if (!REGEX_PATTERNS.MOBILE_10_DIGITS.test(cleaned)) {
      errors.advocate_mobile = VALIDATION_MESSAGES.MOBILE_INVALID;
    }
  }

  if (caseData.advocate_email) {
    if (!REGEX_PATTERNS.EMAIL.test(caseData.advocate_email)) {
      errors.advocate_email = VALIDATION_MESSAGES.EMAIL_INVALID;
    }
  }

  // Date format validation
  if (caseData.date_of_filing) {
    if (!REGEX_PATTERNS.DATE_DD_MM_YYYY.test(caseData.date_of_filing)) {
      errors.date_of_filing = VALIDATION_MESSAGES.DATE_DD_MM_YYYY;
    }
  }

  // Check case uniqueness
  if (caseData.case_type && caseData.case_number && caseData.case_year) {
    const caseId = `${caseData.case_type}/${caseData.case_number}/${caseData.case_year}`;
    const isDuplicate = existingCases.some(existing => existing.case_id === caseId);
    if (isDuplicate) {
      errors.case_id = VALIDATION_MESSAGES.DUPLICATE_CASE;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Export validation summary
export const VALIDATION_SUMMARY = {
  // Required fields count
  REQUIRED_FIELDS_COUNT: 14,

  // Optional fields
  OPTIONAL_FIELDS: ['financial_implications', 'last_hearing_date', 'next_hearing_date', 'case_remarks'],

  // Popup fields
  POPUP_FIELDS: ['brief_description', 'relief_claimed', 'present_status', 'case_remarks'],

  // Date fields
  DATE_FIELDS: ['date_of_filing', 'last_hearing_date', 'next_hearing_date'],

  // Dropdown fields
  DROPDOWN_FIELDS: ['case_type', 'nature_of_claim', 'internal_department'],

  // Character limits
  CHARACTER_LIMITS: {
    BRIEF_DESCRIPTION: CHAR_LIMITS.BRIEF_DESCRIPTION,
    RELIEF_CLAIMED: CHAR_LIMITS.RELIEF_CLAIMED,
    PRESENT_STATUS: CHAR_LIMITS.PRESENT_STATUS,
    CASE_REMARKS: CHAR_LIMITS.CASE_REMARKS,
    PARTY_PETITIONER: CHAR_LIMITS.PARTY_PETITIONER,
    PARTY_RESPONDENT: CHAR_LIMITS.PARTY_RESPONDENT,
    ADVOCATE_NAME: CHAR_LIMITS.ADVOCATE_NAME,
    ADVOCATE_MOBILE: CHAR_LIMITS.ADVOCATE_MOBILE,
    COURT_TRIBUNAL: CHAR_LIMITS.COURT_TRIBUNAL
  },

  // Validation patterns
  PATTERNS: {
    MOBILE_10_DIGITS: REGEX_PATTERNS.MOBILE_10_DIGITS,
    EMAIL: REGEX_PATTERNS.EMAIL,
    DATE_DD_MM_YYYY: REGEX_PATTERNS.DATE_DD_MM_YYYY,
    CASE_NUMBER: REGEX_PATTERNS.CASE_NUMBER,
    CASE_YEAR: REGEX_PATTERNS.CASE_YEAR,
    ADVOCATE_NAME: REGEX_PATTERNS.ADVOCATE_NAME
  }
};

// ===== EXPORT DEFAULT VALIDATION RULES =====
export default {
  // Excel format case validation rules
  getCaseFormValidationRules,
  validateCaseData,

  // Individual field rules
  caseTypeRules,
  caseNumberRules,
  caseYearRules,
  dateOfFilingRules,
  pendingBeforeCourtRules,
  partyPetitionerRules,
  partyRespondentRules,
  natureOfClaimRules,
  advocateNameRules,
  advocateEmailRules,
  advocateMobileRules,
  financialImplicationsRules,
  internalDepartmentRules,
  lastHearingDateRules,
  nextHearingDateRules,
  briefDescriptionRules,
  reliefClaimedRules,
  presentStatusRules,
  caseRemarksRules,

  // User validation rules
  getUserFormValidationRules,
  usernameRules,
  emailRules,
  passwordRules,
  confirmPasswordRules,
  firstNameRules,
  lastNameRules,
  userDepartmentRules,
  phoneRules,

  // Utility functions
  requiredRule,
  charLimitRule,
  dropdownRule,
  richTextRules,
  urlRule,
  caseUniquenessRules,
  parseDDMMYYYY,
  formatToDDMMYYYY,

  // Validation summary
  VALIDATION_SUMMARY
};