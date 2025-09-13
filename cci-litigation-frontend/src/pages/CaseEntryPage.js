import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
    Button, Box, Typography, Container, Paper, CircularProgress,
    TextField, Alert, Dialog, DialogTitle, DialogContent,
    DialogActions, Grid, Chip, IconButton, Tooltip
} from '@mui/material';

import {
    Save as SaveIcon,
    AccessTime as AutoSaveIcon,
    Info as InfoIcon,
    ContentCopy as CopyIcon,
    ContentPaste as PasteIcon
} from '@mui/icons-material';
import InputField from '../components/InputField';
import { Editor } from '@tinymce/tinymce-react';
import api from '../utils/api';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    CHAR_LIMITS,
    CASE_TYPE_OPTIONS,
    NATURE_OF_CLAIM_OPTIONS,
    DEPARTMENT_OPTIONS
} from '../utils/constants';
import {
    getCaseFormValidationRules,
    formatToDDMMYYYY,
    parseDDMMYYYY,
    requiredRule
} from '../utils/validation';
import { useAutoSave } from '../services/AutoSaveService';
import DraftRecovery from '../components/DraftRecovery';
import { formatIndianCurrency, formatIndianDate } from '../utils/formatters';
import { BriefDescriptionModal, ReliefClaimedModal } from '../components/modals/PopupModals';


function CaseEntryPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [submitError, setSubmitError] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState('');
    const [existingCases, setExistingCases] = useState([]);
    const [autoSaveStatus, setAutoSaveStatus] = useState(null);


    // Popup modals state
    const [popupModals, setPopupModals] = useState({
        briefDescription: false,
        reliefClaimed: false,
        presentStatus: false,
        caseRemarks: false
    });

    const {
        control,
        handleSubmit,
        setValue,
        reset,
        watch,
        getValues,
        trigger,
        formState: { errors, isSubmitting, isDirty }
    } = useForm({
        defaultValues: {
            unit_of_cci: '',
            // Excel Column 1-3: Case Number
            case_type: '',
            case_number: '',
            case_year: new Date().getFullYear(),

            // Excel Column 4: Date of Filing (DD-MM-YYYY)
            date_of_filing: '',

            // Excel Column 5: Court/Tribunal
            pending_before_court: '',

            // Excel Column 6-7: Party Details
            party_petitioner: '',
            party_respondent: '',

            // Excel Column 8: Nature of Claim
            nature_of_claim: '',

            // Excel Column 9-11: Advocate Details
            advocate_name: '',
            advocate_email: '',
            advocate_mobile: '',

            // Excel Column 12: Financial Implications
            financial_implications: '',

            // Excel Column 13: Internal Department
            internal_department: user?.department_name || '',

            // Excel Column 14-15: Hearing Dates
            last_hearing_date: '',
            next_hearing_date: '',

            // Excel Column 16-19: Popup Fields
            brief_description: '',
            relief_claimed: '',
            present_status: '',
            case_remarks: ''
        }
    });

    // const {
    //     isDirty: autoSaveIsDirty,
    //     isAutoSaving,
    //     lastSaveTime,
    //     availableDrafts,
    //     showDraftRecovery,
    //     setShowDraftRecovery,
    //     markDirty,
    //     markClean,
    //     forceSave,
    //     loadDraft,
    //     deleteDraft,
    //     saveManualDraft,
    //     clearCurrentDraft
    // } = useAutoSave(
    //     id ? `case_edit_${id}` : 'case_new',
    //     getValues,
    //     {
    //         draftType: 'case',
    //         caseId: id || null,
    //         title: id ? `Draft for Case ${id}` : 'New Case Draft',
    //         onAutoSave: (result) => {
    //             if (result.success) {
    //                 console.log('Auto-saved successfully at:', result.timestamp);
    //             } else {
    //                 console.error('Auto-save failed:', result.error);
    //             }
    //         },
    //         onError: (error) => {
    //             console.error('Auto-save error:', error);
    //         },
    //         onDraftRecovered: (draftInfo) => {
    //             console.log('Drafts available for recovery:', draftInfo.drafts.length);
    //         }
    //     }
    // );


    const tinymceApiKey = process.env.REACT_APP_TINYMCE_API_KEY;

    // Auto-save functionality


    // Load existing cases for uniqueness validation
    useEffect(() => {
        const fetchExistingCases = async () => {
            try {
                const response = await api.get('/cases/');
                setExistingCases(response.data.results || response.data || []);
            } catch (error) {
                console.error('Error fetching existing cases:', error);
            }
        };
        fetchExistingCases();
    }, []);

    // Load case data for editing
    useEffect(() => {
        if (id) {
            setLoading(true);
            const fetchCase = async () => {
                try {
                    const response = await api.get(`/cases/${id}/`);
                    const caseData = response.data;

                    // Format dates from backend to DD-MM-YYYY for display
                    if (caseData.date_of_filing) {
                        const date = new Date(caseData.date_of_filing);
                        caseData.date_of_filing = formatToDDMMYYYY(date);
                    }
                    if (caseData.last_hearing_date) {
                        const date = new Date(caseData.last_hearing_date);
                        caseData.last_hearing_date = formatToDDMMYYYY(date);
                    }
                    if (caseData.next_hearing_date) {
                        const date = new Date(caseData.next_hearing_date);
                        caseData.next_hearing_date = formatToDDMMYYYY(date);
                    }

                    reset(caseData);
                    setSubmitError('');
                } catch (error) {
                    console.error("Error fetching case:", error.response?.data || error.message);
                    setSubmitError('Failed to load case data for editing.');
                } finally {
                    setLoading(false);
                }
            };
            fetchCase();
        } else {
            // Set department for new cases if user is not admin
            if (!user?.is_admin) {
                setValue('internal_department', user?.department_name || '');
            }
            setLoading(false);
        }
    }, [id, reset, user, setValue]);

    const handleLoadDraft = async (draft) => {
        try {
            const draftData = await loadDraft(draft);
            if (draftData) {
                // Convert any date fields back to DD-MM-YYYY format for display
                if (draftData.date_of_filing) {
                    const date = new Date(draftData.date_of_filing);
                    if (!isNaN(date)) {
                        draftData.date_of_filing = formatToDDMMYYYY(date);
                    }
                }
                if (draftData.last_hearing_date) {
                    const date = new Date(draftData.last_hearing_date);
                    if (!isNaN(date)) {
                        draftData.last_hearing_date = formatToDDMMYYYY(date);
                    }
                }
                if (draftData.next_hearing_date) {
                    const date = new Date(draftData.next_hearing_date);
                    if (!isNaN(date)) {
                        draftData.next_hearing_date = formatToDDMMYYYY(date);
                    }
                }

                reset(draftData);
                markClean(); // Mark as clean after loading draft
                setSubmitSuccess('Draft loaded successfully!');
                setTimeout(() => setSubmitSuccess(''), 3000);
            }
        } catch (error) {
            console.error('Error loading draft:', error);
            setSubmitError('Failed to load draft. Please try again.');
        }
    };

    // Handle deleting a draft
    const handleDeleteDraft = async (draft) => {
        try {
            await deleteDraft(draft);
            console.log('Draft deleted successfully');
        } catch (error) {
            console.error('Error deleting draft:', error);
            throw error; // Re-throw so DraftRecovery component can handle it
        }
    };

    // Handle saving manual draft
    const handleSaveManualDraft = async (title, formData) => {
        try {
            const data = formData || getValues();
            await saveManualDraft(title, data);
            console.log('Manual draft saved successfully');
        } catch (error) {
            console.error('Error saving manual draft:', error);
            throw error; // Re-throw so DraftRecovery component can handle it
        }
    };


    // Auto-save function
    const memoizedGetValues = useCallback(() => getValues(), [getValues]);

    const autoSaveOptions = useMemo(() => ({
        draftType: 'case',
        caseId: id || null,
        title: id ? `Draft for Case ${id}` : 'New Case Draft',
        onAutoSave: (result) => {
            if (result.success) {
                console.log('Auto-saved successfully at:', result.timestamp);
            } else {
                console.error('Auto-save failed:', result.error);
            }
        },
        onError: (error) => {
            console.error('Auto-save error:', error);
        },
        onDraftRecovered: (draftInfo) => {
            console.log('Drafts available for recovery:', draftInfo.drafts.length);
        }
    }), [id]);

    const {
        isDirty: autoSaveIsDirty,
        isAutoSaving,
        lastSaveTime,
        availableDrafts,
        showDraftRecovery,
        setShowDraftRecovery,
        markDirty,
        markClean,
        forceSave,
        loadDraft,
        deleteDraft,
        saveManualDraft,
        clearCurrentDraft
    } = useAutoSave(
        id ? `case_edit_${id}` : 'case_new',
        memoizedGetValues,
        autoSaveOptions
    );

    useEffect(() => {
        const subscription = watch(() => {
            if (!loading && !isSubmitting) {
                markDirty();
            }
        });
        return () => subscription.unsubscribe();
    }, [watch, markDirty, loading, isSubmitting]);

    // Format Indian currency
    const formatIndianCurrency = (amount) => {
        if (!amount) return '';
        const num = parseFloat(amount);
        if (isNaN(num)) return amount;

        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
    };

    // Copy to clipboard functionality
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            setAutoSaveStatus('Copied to clipboard');
            setTimeout(() => setAutoSaveStatus(''), 2000);
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    };

    // Paste from clipboard functionality
    const pasteFromClipboard = async (fieldName) => {
        try {
            const text = await navigator.clipboard.readText();
            setValue(fieldName, text);
            setAutoSaveStatus('Pasted from clipboard');
            setTimeout(() => setAutoSaveStatus(''), 2000);
        } catch (err) {
            console.error('Failed to paste:', err);
        }
    };

    // Generate case ID preview
    const generateCaseIdPreview = () => {
        const caseType = watch('case_type');
        const caseNumber = watch('case_number');
        const caseYear = watch('case_year');

        if (caseType && caseNumber && caseYear) {
            return `${caseType}/${caseNumber}/${caseYear}`;
        }
        return 'Type/Number/Year';
    };

    // Handle popup modal open/close
    const handlePopupOpen = (modalName) => {
        setPopupModals(prev => ({ ...prev, [modalName]: true }));
    };

    const handlePopupClose = (modalName) => {
        setPopupModals(prev => ({ ...prev, [modalName]: false }));
    };

    // Form submission
    const onSubmit = async (data) => {
        console.log("=== EXCEL FORMAT FORM SUBMISSION ===");
        console.log("Form submitted with data:", data);

        // 1️⃣ Validate popup fields before submit
        const isValid = await trigger([
            'brief_description',
            'relief_claimed',
            'present_status',
            'case_remarks'
        ]);
        if (!isValid) {
            console.warn("Popup field validation failed");
            return;
        }

        setSubmitError('');
        setSubmitSuccess('');
        setLoading(true);

        try {
            // Ensure department is set for non-admin users
            if (!user?.is_admin) {
                data.internal_department = user.department_name;
            }

            // Convert DD-MM-YYYY dates to YYYY-MM-DD for backend
            const formatDateForBackend = (ddmmyyyy) => {
                if (!ddmmyyyy) return null;
                const date = parseDDMMYYYY(ddmmyyyy);
                if (date && !isNaN(date)) {
                    return date.toISOString().split('T')[0];
                }
                return null;
            };

            data.date_of_filing = formatDateForBackend(data.date_of_filing);
            data.last_hearing_date = formatDateForBackend(data.last_hearing_date);
            data.next_hearing_date = formatDateForBackend(data.next_hearing_date);

            // Format financial amount
            if (data.financial_implications) {
                data.financial_implications = parseFloat(data.financial_implications) || 0;
            }

            // Clean up HTML content from popup fields
            ['brief_description', 'relief_claimed', 'present_status', 'case_remarks'].forEach(field => {
                if (data[field]) {
                    data[field] = data[field].replace(/<p><br><\/p>/g, '').trim();
                }
            });

            let response;
            if (id) {
                response = await api.put(`/cases/${id}/`, data);
                setSubmitSuccess('Case updated successfully!');
            } else {
                response = await api.post('/cases/', data);
                setSubmitSuccess('Case created successfully!');
            }

            await clearCurrentDraft();
            markClean();

            // Clear auto-save data on successful submission
            if (!id) {
                // await api.delete('/cases/auto-save/', { data: { case_id: null } });
                await clearCurrentDraft();
            }

            // Navigate after a short delay to show success message
            setTimeout(() => {
                navigate('/cases');
            }, 2000);
        } catch (error) {
            console.error("Error submitting case:", error.response?.data || error.message);
            if (error.response?.data) {
                let errorMessage = 'Submission failed:\n';
                for (const key in error.response.data) {
                    if (Array.isArray(error.response.data[key])) {
                        errorMessage += `• ${key.replace(/_/g, ' ')}: ${error.response.data[key].join(', ')}\n`;
                    } else {
                        errorMessage += `• ${key.replace(/_/g, ' ')}: ${error.response.data[key]}\n`;
                    }
                }
                setSubmitError(errorMessage);
            } else {
                setSubmitError(`An unexpected error occurred: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    // Popup Modal Component
    const PopupModal = ({ open, onClose, title, fieldName, maxChars, minChars = 0 }) => (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                {title}
                <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                    {minChars > 0 ? `Minimum ${minChars} characters, ` : ''}Maximum {maxChars} characters
                </Typography>
            </DialogTitle>
            <DialogContent>
                <Controller
                    name={fieldName}
                    control={control}
                    rules={getCaseFormValidationRules(getValues, existingCases)[fieldName]}
                    render={({ field }) => (
                        <Editor
                            apiKey={tinymceApiKey}
                            initialValue={field.value} // ✅ use initialValue, not value
                            onEditorChange={(content) => {
                                const textContent = content.replace(/<[^>]*>/g, '');
                                if (textContent.length <= maxChars) {
                                    field.onChange(content);
                                }
                            }}
                            onBlur={field.onBlur}
                            init={{
                                plugins: 'advlist autolink lists link charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime table paste help wordcount',
                                toolbar: 'undo redo | formatselect | bold italic backcolor | ' +
                                    'alignleft aligncenter alignright alignjustify | ' +
                                    'bullist numlist outdent indent | removeformat | help | wordcount',
                                height: 400,
                                menubar: false,
                                statusbar: true,
                                browser_spellcheck: true, // ✅ keep only this for spellcheck
                                content_style:
                                    'body { font-family: -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif; font-size: 14px; }'
                            }}
                        />

                    )}
                />
                {errors[fieldName] && (
                    <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
                        {errors[fieldName].message}
                    </Typography>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );

    if (loading && !submitSuccess) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    const validationRules = getCaseFormValidationRules(getValues, existingCases);

    return (
        <Box
            sx={{
                width: '100%',
                overflowX: 'auto',
                px: 2,
                py: 4,
                transform: 'translateX(-230px)'

            }}
        >
            <Paper sx={{ p: 4, minWidth: 1200 }}>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" component="h1">
                        {id ? 'Edit Litigation Case' : 'Add New Litigation Case'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Chip
                            label={`Case ID Preview: ${generateCaseIdPreview()}`}
                            variant="outlined"
                            size="small"
                        />
                    </Box>
                </Box>

                {/* Success/Error Messages */}
                {submitSuccess && (
                    <Alert severity="success" sx={{ mb: 3 }}>
                        {submitSuccess}
                    </Alert>
                )}

                {submitError && (
                    <Alert severity="error" sx={{ mb: 3, whiteSpace: 'pre-line' }}>
                        {submitError}
                    </Alert>
                )}

                <form onSubmit={handleSubmit(onSubmit)}>
                    <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                        🏢 Unit of CCI
                    </Typography>
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} md={6}>
                            <InputField
                                name="unit_of_cci"  
                                label="Unit of CCI *"
                                control={control}
                                rules={requiredRule('Unit of CCI is mandatory.')}
                                disabled={!user?.is_admin}
                                helperText="CCI unit handling this case"
                            />
                        </Grid>
                    </Grid>
                    {/* SECTION 1: Case Number (Excel Columns 1-3) */}
                    <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                        📋 Case Identification
                    </Typography>
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} md={4}>
                            <InputField
                                name="case_type"
                                label="Case Type *"
                                control={control}
                                rules={requiredRule('Case Type is mandatory.')}
                                helperText="Enter case type (CS, WP, SLP, etc.)"
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <InputField
                                name="case_number"
                                label="Case Number *"
                                control={control}
                                type="number"
                                rules={validationRules.case_number}
                                helperText="Enter case number (1-999999)"
                                disabled={!!id}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <InputField
                                name="case_year"
                                label="Case Year *"
                                control={control}
                                type="number"
                                rules={validationRules.case_year}
                                helperText="Enter year (YYYY format)"
                                disabled={!!id}
                            />
                        </Grid>
                    </Grid>

                    {/* SECTION 2: Basic Case Information (Excel Columns 4-5) */}
                    <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                        📅 Basic Case Information
                    </Typography>
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} md={6}>
                            <InputField
                                name="date_of_filing"
                                label="Date of Filing/Intimation *"
                                control={control}
                                rules={validationRules.date_of_filing}
                                helperText="Enter date in DD-MM-YYYY format"
                                placeholder="DD-MM-YYYY"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <InputField
                                name="pending_before_court"
                                label="Pending Before Court/Tribunal *"
                                control={control}
                                rules={validationRules.pending_before_court}
                                charLimit={CHAR_LIMITS.COURT_TRIBUNAL}
                                helperText="Name of court/tribunal where case is pending"
                                endAdornment={
                                    <Tooltip title="Copy to clipboard">
                                        <IconButton
                                            size="small"
                                            onClick={() => copyToClipboard(watch('pending_before_court'))}
                                        >
                                            <CopyIcon />
                                        </IconButton>
                                    </Tooltip>
                                }
                            />
                        </Grid>
                    </Grid>

                    {/* SECTION 3: Party Details (Excel Columns 6-7) */}
                    <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                        👥 Party Details
                    </Typography>
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} md={6}>
                            <InputField
                                name="party_petitioner"
                                label="Petitioner/Applicant Details *"
                                control={control}
                                multiline
                                rows={3}
                                rules={validationRules.party_petitioner}
                                charLimit={CHAR_LIMITS.PARTY_PETITIONER}
                                helperText={`Max ${CHAR_LIMITS.PARTY_PETITIONER} characters`}
                                endAdornment={
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Tooltip title="Copy">
                                            <IconButton
                                                size="small"
                                                onClick={() => copyToClipboard(watch('party_petitioner'))}
                                            >
                                                <CopyIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Paste">
                                            <IconButton
                                                size="small"
                                                onClick={() => pasteFromClipboard('party_petitioner')}
                                            >
                                                <PasteIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                }
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <InputField
                                name="party_respondent"
                                label="Respondent Details *"
                                control={control}
                                multiline
                                rows={3}
                                rules={validationRules.party_respondent}
                                charLimit={CHAR_LIMITS.PARTY_RESPONDENT}
                                helperText={`Max ${CHAR_LIMITS.PARTY_RESPONDENT} characters`}
                                endAdornment={
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Tooltip title="Copy">
                                            <IconButton
                                                size="small"
                                                onClick={() => copyToClipboard(watch('party_respondent'))}
                                            >
                                                <CopyIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Paste">
                                            <IconButton
                                                size="small"
                                                onClick={() => pasteFromClipboard('party_respondent')}
                                            >
                                                <PasteIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                }
                            />
                        </Grid>
                    </Grid>

                    {/* SECTION 4: Claim & Advocate Details (Excel Columns 8-11) */}
                    <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                        ⚖️ Claim & Advocate Details
                    </Typography>
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} md={6}>
                            <InputField
                                name="nature_of_claim"
                                label="Nature of Claim *"
                                control={control}
                                select={true}
                                options={NATURE_OF_CLAIM_OPTIONS}
                                rules={validationRules.nature_of_claim}
                                helperText="Select the nature of legal claim"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <InputField
                                name="advocate_name"
                                label="Advocate Name *"
                                control={control}
                                rules={validationRules.advocate_name}
                                charLimit={CHAR_LIMITS.ADVOCATE_NAME}
                                helperText="Full name of the advocate"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <InputField
                                name="advocate_email"
                                label="Advocate Email *"
                                control={control}
                                type="email"
                                rules={validationRules.advocate_email}
                                charLimit={CHAR_LIMITS.ADVOCATE_EMAIL}
                                helperText="Advocate's email address"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <InputField
                                name="advocate_mobile"
                                label="Advocate Mobile *"
                                control={control}
                                rules={validationRules.advocate_mobile}
                                helperText="10-digit mobile number (6/7/8/9 start)"
                                placeholder="9876543210"
                            />
                        </Grid>
                    </Grid>

                    {/* SECTION 5: Financial & Department (Excel Columns 12-13) */}
                    <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                        💰 Financial & Department Information
                    </Typography>
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} md={6}>
                            <InputField
                                name="financial_implications"
                                label="Financial Implications"
                                control={control}
                                type="number"
                                rules={validationRules.financial_implications}
                                helperText={`Amount in Rs. ${watch('financial_implications') ? formatIndianCurrency(watch('financial_implications')) : ''}`}
                                placeholder="0.00"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <InputField
                                name="internal_department"
                                label="Internal Department of CCI *"
                                control={control}
                                rules={requiredRule('Internal Department is mandatory.')}
                                disabled={!user?.is_admin}
                                helperText="Department handling this case"
                            />
                        </Grid>
                    </Grid>

                    {/* SECTION 6: Hearing Dates (Excel Columns 14-15) */}
                    <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                        📆 Hearing Dates
                    </Typography>
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} md={6}>
                            <InputField
                                name="last_hearing_date"
                                label="Last Date of Hearing"
                                control={control}
                                rules={validationRules.last_hearing_date}
                                helperText="Enter date in DD-MM-YYYY format (optional)"
                                placeholder="DD-MM-YYYY"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <InputField
                                name="next_hearing_date"
                                label="Next Date of Hearing"
                                control={control}
                                rules={validationRules.next_hearing_date}
                                helperText="Enter date in DD-MM-YYYY format (optional)"
                                placeholder="DD-MM-YYYY"
                            />
                        </Grid>
                    </Grid>

                    {/* SECTION 7: Detailed Information */}
                    <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                        📝 Detailed Information
                    </Typography>
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} md={6}>
                            <InputField
                                name="brief_description"
                                label="Brief Description of Matter"
                                control={control}
                                multiline
                                rows={4}
                                rules={validationRules.brief_description}
                                charLimit={CHAR_LIMITS.BRIEF_DESCRIPTION}
                                spellCheck={true}
                                helperText={`Required field. Max ${CHAR_LIMITS.BRIEF_DESCRIPTION} characters`}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <InputField
                                name="relief_claimed"
                                label="Relief Claimed by Party"
                                control={control}
                                multiline
                                rows={4}
                                rules={validationRules.relief_claimed}
                                charLimit={CHAR_LIMITS.RELIEF_CLAIMED}
                                spellCheck={true}
                                helperText={`Required field. Max ${CHAR_LIMITS.RELIEF_CLAIMED} characters`}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <InputField
                                name="present_status"
                                label="Present Status"
                                control={control}
                                multiline
                                rows={4}
                                rules={validationRules.present_status}
                                charLimit={CHAR_LIMITS.PRESENT_STATUS}
                                spellCheck={true}
                                helperText={`Required field. Max ${CHAR_LIMITS.PRESENT_STATUS} characters`}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <InputField
                                name="case_remarks"
                                label="Remarks"
                                control={control}
                                multiline
                                rows={4}
                                rules={validationRules.case_remarks}
                                charLimit={CHAR_LIMITS.CASE_REMARKS}
                                spellCheck={true}
                                helperText={`Optional field. Max ${CHAR_LIMITS.CASE_REMARKS} characters`}
                            />
                        </Grid>
                    </Grid>

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4 }}>
                        <Box>
                            <Button
                                variant="outlined"
                                onClick={() => navigate('/cases')}
                                disabled={isSubmitting}
                                size="large"
                            >
                                Cancel
                            </Button>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            {/* Auto-save status indicator */}
                            {isAutoSaving && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CircularProgress size={16} />
                                    <Typography variant="caption" color="text.secondary">
                                        Auto-saving...
                                    </Typography>
                                </Box>
                            )}

                            {lastSaveTime && !isAutoSaving && (
                                <Typography variant="caption" color="text.secondary">
                                    Last saved: {lastSaveTime.toLocaleTimeString()}
                                </Typography>
                            )}

                            <Button
                                variant="outlined"
                                onClick={forceSave}
                                disabled={!autoSaveIsDirty || isSubmitting || isAutoSaving}
                                startIcon={<SaveIcon />}
                                size="large"
                            >
                                Save Draft
                            </Button>

                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                disabled={isSubmitting || loading}
                                startIcon={isSubmitting || loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                size="large"
                            >
                                {id ? 'Update Case' : 'Create Case'}
                            </Button>
                        </Box>
                    </Box>

                </form>

                {/* Popup Modals for Detailed Fields */}
                <PopupModal
                    open={popupModals.briefDescription}
                    onClose={() => handlePopupClose('briefDescription')}
                    title="Brief Description of Matter"
                    fieldName="brief_description"
                    maxChars={CHAR_LIMITS.BRIEF_DESCRIPTION}
                    minChars={10}
                />

                <PopupModal
                    open={popupModals.reliefClaimed}
                    onClose={() => handlePopupClose('reliefClaimed')}
                    title="Relief Claimed by Party"
                    fieldName="relief_claimed"
                    maxChars={CHAR_LIMITS.RELIEF_CLAIMED}
                    minChars={5}
                />

                <PopupModal
                    open={popupModals.presentStatus}
                    onClose={() => handlePopupClose('presentStatus')}
                    title="Present Status"
                    fieldName="present_status"
                    maxChars={CHAR_LIMITS.PRESENT_STATUS}
                    minChars={5}
                />

                <PopupModal
                    open={popupModals.caseRemarks}
                    onClose={() => handlePopupClose('caseRemarks')}
                    title="Remarks (Optional)"
                    fieldName="case_remarks"
                    maxChars={CHAR_LIMITS.CASE_REMARKS}
                    minChars={0}
                />


                <DraftRecovery
                    availableDrafts={availableDrafts}
                    showDraftRecovery={showDraftRecovery}
                    onClose={() => setShowDraftRecovery(false)}
                    onLoadDraft={handleLoadDraft}
                    onDeleteDraft={handleDeleteDraft}
                    onSaveManualDraft={handleSaveManualDraft}
                    currentFormData={getValues()}
                />

            </Paper>
        </Box>
    );
}

export default CaseEntryPage;
