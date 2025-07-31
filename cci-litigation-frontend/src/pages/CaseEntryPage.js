import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button, Box, Typography, Container, Paper, CircularProgress, MenuItem, TextField, Alert } from '@mui/material';
import InputField from '../components/InputField';
import { Editor } from '@tinymce/tinymce-react';
import api from '../utils/api';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    CHAR_LIMITS,
    DEPARTMENT_OPTIONS,
    CASE_STATUS_OPTIONS,
    LITIGATION_TYPE_OPTIONS,
    BENCH_OPTIONS
} from '../utils/constants';
import {
    requiredRule,
    charLimitRule,
    urlRule,
    dateMandatoryRules,
    dateOptionalRules,
    finalOrderDateRules
} from '../utils/validation';

function CaseEntryPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [submitError, setSubmitError] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState('');

    const {
        control,
        handleSubmit,
        setValue,
        reset,
        watch,
        formState: { errors, isSubmitting, isDirty }
    } = useForm({
        defaultValues: {
            case_id: '',
            case_name: '',
            date_of_institution: '',
            parties_involved_complainant: '',
            parties_involved_opposite: '',
            bench: '',
            sections_involved: '',
            status_of_case: '',
            type_of_litigation: '',
            relief_orders_prayed: '',
            important_directions_orders: '',
            date_of_next_hearing_order: '',
            outcome: '',
            date_of_final_order: '',
            link_of_order_judgment: '',
            department_name: user?.department_name || '',
        }
    });

    const getValues = watch();
    const tinymceApiKey = process.env.REACT_APP_TINYMCE_API_KEY;

    useEffect(() => {
        if (id) {
            setLoading(true);
            const fetchCase = async () => {
                try {
                    const response = await api.get(`/cases/${id}/`);
                    const caseData = response.data;

                    // Format dates for input fields
                    if (caseData.date_of_institution) caseData.date_of_institution = caseData.date_of_institution.split('T')[0];
                    if (caseData.date_of_next_hearing_order) caseData.date_of_next_hearing_order = caseData.date_of_next_hearing_order.split('T')[0];
                    if (caseData.date_of_final_order) caseData.date_of_final_order = caseData.date_of_final_order.split('T')[0];

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
                setValue('department_name', user?.department_name || '');
            }
            setLoading(false);
        }
    }, [id, reset, user, setValue]);

    const onSubmit = async (data) => {
        console.log("=== FORM SUBMISSION DEBUG ===");
        console.log("Form submitted with data:", data);

        console.log("Form errors:", errors);
        console.log("Form is valid:", Object.keys(errors).length === 0);
        setSubmitError('');
        setSubmitSuccess('');
        setLoading(true);

        try {
            // Ensure department is set for non-admin users
            if (!user?.is_admin) {
                data.department_name = user.department_name;
            }

            // Clean up HTML content from TinyMCE (remove empty tags)
            if (data.relief_orders_prayed) {
                data.relief_orders_prayed = data.relief_orders_prayed.replace(/<p><br><\/p>/g, '').trim();
            }
            if (data.important_directions_orders) {
                data.important_directions_orders = data.important_directions_orders.replace(/<p><br><\/p>/g, '').trim();
            }

            let response;
            if (id) {
                response = await api.put(`/cases/${id}/`, data);
                setSubmitSuccess('Case updated successfully!');
            } else {
                response = await api.post('/cases/', data);
                setSubmitSuccess('Case created successfully!');
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
                        errorMessage += `• ${key}: ${error.response.data[key].join(', ')}\n`;
                    } else {
                        errorMessage += `• ${key}: ${error.response.data[key]}\n`;
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

    if (loading && !submitSuccess) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg">
            <Paper sx={{ p: 4, mt: 4, mb: 4 }}>
                <Typography variant="h5" component="h1" gutterBottom align="center" sx={{ mb: 3 }}>
                    {id ? 'Edit Litigation Case' : 'Add New Litigation Case'}
                </Typography>

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
                <pre style={{ fontSize: 12, background: '#f5f5f5', padding: 10 }}>
                    isSubmitting: {JSON.stringify(isSubmitting)}{'\n'}
                    loading: {JSON.stringify(loading)}{'\n'}
                    form errors: {JSON.stringify(errors, null, 2)}
                </pre>


                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* Basic Information */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', mb: 3 }}>
                        <InputField
                            name="case_id"
                            label="Case ID"
                            control={control}
                            charLimit={CHAR_LIMITS.CASE_ID}
                            spellCheck={false}
                            rules={{
                                ...requiredRule('Case ID is mandatory.'),
                                ...charLimitRule(CHAR_LIMITS.CASE_ID, `Case ID cannot exceed ${CHAR_LIMITS.CASE_ID} characters.`),
                                validate: {
                                    isNotChanged: value => !id || value === getValues().case_id || 'Case ID cannot be changed.'
                                }
                            }}
                            disabled={!!id}
                        />
                        <InputField
                            name="case_name"
                            label="Case Name"
                            control={control}
                            charLimit={CHAR_LIMITS.CASE_NAME}
                            spellCheck={true}
                            rules={{
                                ...requiredRule('Case Name is mandatory.'),
                                ...charLimitRule(CHAR_LIMITS.CASE_NAME, `Case Name cannot exceed ${CHAR_LIMITS.CASE_NAME} characters.`),
                            }}
                        />
                        <InputField
                            name="date_of_institution"
                            label="Date of Institution"
                            control={control}
                            type="date"
                            rules={dateMandatoryRules}
                        />
                        <InputField
                            name="department_name"
                            label="Department"
                            control={control}
                            select={true}
                            options={DEPARTMENT_OPTIONS}
                            rules={requiredRule('Department is mandatory.')}
                            disabled={!user?.is_admin}
                        />
                    </Box>

                    {/* Parties Information */}
                    <Typography variant="h6" sx={{ mb: 2, mt: 3 }}>Parties Information</Typography>
                    <InputField
                        name="parties_involved_complainant"
                        label="Parties Involved (Complainant/Applicant)"
                        control={control}
                        charLimit={CHAR_LIMITS.PARTIES_COMPLAINANT}
                        spellCheck={true}
                        rules={{
                            ...requiredRule('Complainant parties are mandatory.'),
                            ...charLimitRule(CHAR_LIMITS.PARTIES_COMPLAINANT, `This field cannot exceed ${CHAR_LIMITS.PARTIES_COMPLAINANT} characters.`),
                        }}
                        multiline
                        rows={2}
                    />
                    <InputField
                        name="parties_involved_opposite"
                        label="Parties Involved (Opposite Parties/Respondents)"
                        control={control}
                        charLimit={CHAR_LIMITS.PARTIES_OPPOSITE}
                        spellCheck={true}
                        rules={{
                            ...requiredRule('Opposite parties are mandatory.'),
                            ...charLimitRule(CHAR_LIMITS.PARTIES_OPPOSITE, `This field cannot exceed ${CHAR_LIMITS.PARTIES_OPPOSITE} characters.`),
                        }}
                        multiline
                        rows={2}
                    />

                    {/* Case Details */}
                    <Typography variant="h6" sx={{ mb: 2, mt: 3 }}>Case Details</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', mb: 3 }}>
                        <InputField
                            name="bench"
                            label="Bench"
                            control={control}
                            select={true}
                            options={BENCH_OPTIONS}
                            rules={requiredRule('Bench is mandatory.')}
                        />
                        <InputField
                            name="sections_involved"
                            label="Section(s) Involved"
                            control={control}
                            charLimit={CHAR_LIMITS.SECTIONS_INVOLVED}
                            spellCheck={true}
                            rules={{
                                ...requiredRule('Section(s) Involved are mandatory.'),
                                ...charLimitRule(CHAR_LIMITS.SECTIONS_INVOLVED, `This field cannot exceed ${CHAR_LIMITS.SECTIONS_INVOLVED} characters.`),
                            }}
                        />
                        <InputField
                            name="status_of_case"
                            label="Status of Case"
                            control={control}
                            select={true}
                            options={CASE_STATUS_OPTIONS}
                            rules={requiredRule('Status of Case is mandatory.')}
                        />
                        <InputField
                            name="type_of_litigation"
                            label="Type of Litigation"
                            control={control}
                            select={true}
                            options={LITIGATION_TYPE_OPTIONS}
                            rules={requiredRule('Type of Litigation is mandatory.')}
                        />
                    </Box>

                    {/* Important Dates */}
                    <Typography variant="h6" sx={{ mb: 2, mt: 3 }}>Important Dates</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', mb: 3 }}>
                        <InputField
                            name="date_of_next_hearing_order"
                            label="Date of Next Hearing/Order"
                            control={control}
                            type="date"
                            rules={dateOptionalRules}
                        />
                        <InputField
                            name="date_of_final_order"
                            label="Date of Final Order"
                            control={control}
                            type="date"
                            rules={finalOrderDateRules(getValues)}
                        />
                    </Box>

                    {/* Rich Text Fields */}
                    <Typography variant="h6" sx={{ mb: 2, mt: 3 }}>Detailed Information</Typography>

                    {/* Relief/Orders Prayed */}
                    <Box sx={{ mt: 2, mb: 2 }}>
                        <Typography variant="body2" sx={{ mb: 1, color: errors.relief_orders_prayed ? 'error.main' : 'text.secondary' }}>
                            Relief/Orders Prayed <span style={{ color: 'red' }}>*</span>
                            {errors.relief_orders_prayed && <span style={{ color: 'red' }}> ({errors.relief_orders_prayed.message})</span>}
                        </Typography>
                        <Controller
                            name="relief_orders_prayed"
                            control={control}
                            rules={{
                                ...requiredRule('Relief/Orders Prayed is mandatory.'),
                                validate: {
                                    notEmpty: value => {
                                        const textContent = value?.replace(/<[^>]*>/g, '').trim();
                                        return textContent && textContent.length > 0 || 'Relief/Orders Prayed cannot be empty.';
                                    },
                                    charLimit: value => {
                                        const textContent = value?.replace(/<[^>]*>/g, '').trim();
                                        return !textContent || textContent.length <= CHAR_LIMITS.RELIEF_ORDERS_PRAYED ||
                                            `This field cannot exceed ${CHAR_LIMITS.RELIEF_ORDERS_PRAYED} characters.`;
                                    }
                                }
                            }}
                            render={({ field }) => (
                                <Editor
                                    apiKey={tinymceApiKey}
                                    init={{
                                        plugins: 'advlist autolink lists link charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime table paste help wordcount',
                                        toolbar: 'undo redo | formatselect | bold italic backcolor | ' +
                                            'alignleft aligncenter alignright alignjustify | ' +
                                            'bullist numlist outdent indent | removeformat | help',
                                        height: 300,
                                        menubar: false,
                                        statusbar: true,
                                        browser_spellcheck: true,
                                        gecko_spellcheck: true,
                                        spellchecker_language: 'en',
                                        content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif; font-size: 14px; }',
                                    }}
                                    onEditorChange={(content) => field.onChange(content)}
                                    value={field.value}
                                    onBlur={field.onBlur}
                                />
                            )}
                        />
                    </Box>

                    {/* Important Directions/Orders */}
                    <Box sx={{ mt: 2, mb: 2 }}>
                        <Typography variant="body2" sx={{ mb: 1, color: errors.important_directions_orders ? 'error.main' : 'text.secondary' }}>
                            Important Directions/Orders <span style={{ color: 'red' }}>*</span>
                            {errors.important_directions_orders && <span style={{ color: 'red' }}> ({errors.important_directions_orders.message})</span>}
                        </Typography>
                        <Controller
                            name="important_directions_orders"
                            control={control}
                            rules={{
                                ...requiredRule('Important Directions/Orders is mandatory.'),
                                validate: {
                                    notEmpty: value => {
                                        const textContent = value?.replace(/<[^>]*>/g, '').trim();
                                        return textContent && textContent.length > 0 || 'Important Directions/Orders cannot be empty.';
                                    },
                                    charLimit: value => {
                                        const textContent = value?.replace(/<[^>]*>/g, '').trim();
                                        return !textContent || textContent.length <= CHAR_LIMITS.IMPORTANT_DIRECTIONS_ORDERS ||
                                            `This field cannot exceed ${CHAR_LIMITS.IMPORTANT_DIRECTIONS_ORDERS} characters.`;
                                    }
                                }
                            }}
                            render={({ field }) => (
                                <Editor
                                    apiKey={tinymceApiKey}
                                    init={{
                                        plugins: 'advlist autolink lists link charmap preview anchor ' +
                                            'searchreplace visualblocks code fullscreen insertdatetime table paste code help wordcount spellchecker',
                                        toolbar: 'undo redo | formatselect | bold italic backcolor | ' +
                                            'alignleft aligncenter alignright alignjustify | ' +
                                            'bullist numlist outdent indent | removeformat | help',
                                        height: 300,
                                        menubar: false,
                                        statusbar: true,
                                        browser_spellcheck: true,
                                        gecko_spellcheck: true,
                                        spellchecker_language: 'en',
                                        content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif; font-size: 14px; }',
                                    }}
                                    onEditorChange={(content) => field.onChange(content)}
                                    value={field.value}
                                    onBlur={field.onBlur}
                                />
                            )}
                        />
                    </Box>

                    {/* Additional Information */}
                    <Typography variant="h6" sx={{ mb: 2, mt: 3 }}>Additional Information</Typography>
                    <InputField
                        name="outcome"
                        label="Outcome"
                        control={control}
                        multiline
                        rows={3}
                        charLimit={CHAR_LIMITS.OUTCOME}
                        spellCheck={true}
                        rules={{
                            ...requiredRule('Outcome is mandatory.'),
                            ...charLimitRule(CHAR_LIMITS.OUTCOME, `Outcome cannot exceed ${CHAR_LIMITS.OUTCOME} characters.`)
                        }}
                    />
                    <InputField
                        name="link_of_order_judgment"
                        label="Link of Order/Judgment"
                        control={control}
                        charLimit={CHAR_LIMITS.LINK_OF_ORDER_JUDGMENT}
                        spellCheck={false}
                        rules={urlRule('Please enter a valid URL for the order/judgment (e.g., https://example.com).')}
                    />

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
                        <Button
                            variant="outlined"
                            onClick={() => navigate('/cases')}
                            disabled={isSubmitting}
                            size="large"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={isSubmitting || loading}
                            startIcon={isSubmitting || loading ? <CircularProgress size={20} color="inherit" /> : null}
                            size="large"
                        >
                            {id ? 'Update Case' : 'Add Case'}
                        </Button>
                    </Box>
                </form>
            </Paper>
        </Container>
    );
}

export default CaseEntryPage;