// components/modals/PopupModals.js - Popup Components for Case Details


import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Typography,
    Box,
    IconButton,
    Chip
} from '@mui/material';
import {
    Close as CloseIcon,
    Save as SaveIcon,
    Cancel as CancelIcon
} from '@mui/icons-material';
import { Editor } from '@tinymce/tinymce-react';
import React, { useState, useEffect } from 'react';


/**
 * Brief Description Popup Modal (Max 2500 characters)
 */
export const BriefDescriptionModal = ({
    open,
    onClose,
    onSave,
    initialValue = '',
    readOnly = false,
    title = "Brief Description of Matter"
}) => {
    const [value, setValue] = useState(initialValue);
    const [charCount, setCharCount] = useState(initialValue.length);
    const maxChars = 2500;
    useEffect(() => {
        setValue(initialValue);
        setCharCount(initialValue.replace(/<[^>]*>/g, '').length);
    }, [initialValue, open]);

    const handleSave = () => {
        onSave(value);
        onClose();
    };

    const handleEditorChange = (content) => {
        const textContent = content.replace(/<[^>]*>/g, '');

        setValue(content);
        setCharCount(textContent.length);

    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{ sx: { minHeight: '500px' } }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">{title}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                        label={`${charCount}/${maxChars}`}
                        color={charCount > maxChars * 0.9 ? 'error' : charCount > maxChars * 0.7 ? 'warning' : 'primary'}
                        size="small"
                    />
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 2 }}>
                {readOnly ? (
                    <Box sx={{
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                        p: 2,
                        minHeight: '300px',
                        backgroundColor: '#f9f9f9'
                    }}>
                        <div dangerouslySetInnerHTML={{ __html: value || 'No description available.' }} />
                    </Box>
                ) : (
                    <Editor
                        apiKey={process.env.REACT_APP_TINYMCE_API_KEY}
                        init={{
                            plugins: 'advlist autolink lists link charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime table help wordcount spellchecker',
                            toolbar: 'undo redo | formatselect | bold italic underline | alignleft aligncenter alignright | bullist numlist | link | code | help',
                            height: 350, // or 300 for the second modal
                            menubar: false,
                            statusbar: false,
                            browser_spellcheck: true, // keep only this
                            content_style:
                                'body { font-family: -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif; font-size: 14px; }'
                        }}

                        onEditorChange={handleEditorChange}
                        value={value}
                    />
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button onClick={onClose} startIcon={<CancelIcon />}>
                    Cancel
                </Button>
                {!readOnly && (
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        startIcon={<SaveIcon />}
                        disabled={charCount > maxChars}
                    >
                        Save
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

/**
 * Relief Claimed Popup Modal (Max 500 characters)
 */
export const ReliefClaimedModal = ({
    open,
    onClose,
    onSave,
    initialValue = '',
    readOnly = false,
    title = "Relief Claimed by Party"
}) => {
    const [value, setValue] = useState(initialValue);
    const maxChars = 500;

    const handleSave = () => {
        onSave(value);
        onClose();
    };

    const handleChange = (event) => {
        const newValue = event.target.value;
        if (newValue.length <= maxChars) {
            setValue(newValue);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">{title}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                        label={`${value.length}/${maxChars}`}
                        color={value.length > maxChars * 0.9 ? 'error' : value.length > maxChars * 0.7 ? 'warning' : 'primary'}
                        size="small"
                    />
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 2 }}>
                <TextField
                    fullWidth
                    multiline
                    rows={8}
                    value={value}
                    onChange={handleChange}
                    placeholder="Enter relief claimed by the party..."
                    variant="outlined"
                    InputProps={{
                        readOnly: readOnly,
                        sx: readOnly ? { backgroundColor: '#f9f9f9' } : {}
                    }}
                />
            </DialogContent>

            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button onClick={onClose} startIcon={<CancelIcon />}>
                    Cancel
                </Button>
                {!readOnly && (
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        startIcon={<SaveIcon />}
                        disabled={value.length > maxChars}
                    >
                        Save
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

/**
 * Present Status Popup Modal (Max 500 characters)
 */
export const PresentStatusModal = ({
    open,
    onClose,
    onSave,
    initialValue = '',
    readOnly = false,
    title = "Present Status of Case"
}) => {
    const [value, setValue] = useState(initialValue);
    const maxChars = 500;

    const handleSave = () => {
        onSave(value);
        onClose();
    };

    const handleChange = (event) => {
        const newValue = event.target.value;
        if (newValue.length <= maxChars) {
            setValue(newValue);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">{title}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                        label={`${value.length}/${maxChars}`}
                        color={value.length > maxChars * 0.9 ? 'error' : value.length > maxChars * 0.7 ? 'warning' : 'primary'}
                        size="small"
                    />
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 2 }}>
                <TextField
                    fullWidth
                    multiline
                    rows={8}
                    value={value}
                    onChange={handleChange}
                    placeholder="Enter current status of the case..."
                    variant="outlined"
                    InputProps={{
                        readOnly: readOnly,
                        sx: readOnly ? { backgroundColor: '#f9f9f9' } : {}
                    }}
                />
            </DialogContent>

            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button onClick={onClose} startIcon={<CancelIcon />}>
                    Cancel
                </Button>
                {!readOnly && (
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        startIcon={<SaveIcon />}
                        disabled={value.length > maxChars}
                    >
                        Save
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

/**
 * Remarks Popup Modal (Max 500 characters)
 */
export const RemarksModal = ({
    open,
    onClose,
    onSave,
    initialValue = '',
    readOnly = false,
    title = "Remarks"
}) => {
    const [value, setValue] = useState(initialValue);
    const maxChars = 500;

    const handleSave = () => {
        onSave(value);
        onClose();
    };

    const handleChange = (event) => {
        const newValue = event.target.value;
        if (newValue.length <= maxChars) {
            setValue(newValue);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">{title}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                        label={`${value.length}/${maxChars}`}
                        color={value.length > maxChars * 0.9 ? 'error' : value.length > maxChars * 0.7 ? 'warning' : 'primary'}
                        size="small"
                    />
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 2 }}>
                <TextField
                    fullWidth
                    multiline
                    rows={8}
                    value={value}
                    onChange={handleChange}
                    placeholder="Enter any additional remarks..."
                    variant="outlined"
                    InputProps={{
                        readOnly: readOnly,
                        sx: readOnly ? { backgroundColor: '#f9f9f9' } : {}
                    }}
                />
            </DialogContent>

            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button onClick={onClose} startIcon={<CancelIcon />}>
                    Cancel
                </Button>
                {!readOnly && (
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        startIcon={<SaveIcon />}
                        disabled={value.length > maxChars}
                    >
                        Save
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

/**
 * Generic Text Popup Modal
 */
export const TextPopupModal = ({
    open,
    onClose,
    onSave,
    initialValue = '',
    readOnly = false,
    title = "Text Content",
    maxChars = 1000,
    placeholder = "Enter text...",
    useRichText = false
}) => {
    const [value, setValue] = useState(initialValue);
    const [charCount, setCharCount] = useState(
        useRichText
            ? initialValue.replace(/<[^>]*>/g, '').length
            : initialValue.length
    );

    const handleSave = () => {
        onSave(value);
        onClose();
    };

    const handleChange = (event) => {
        const newValue = event.target.value;
        if (newValue.length <= maxChars) {
            setValue(newValue);
            setCharCount(newValue.length);
        }
    };

    const handleEditorChange = (content) => {
        const textContent = content.replace(/<[^>]*>/g, '');
        if (textContent.length <= maxChars) {
            setValue(content);
            setCharCount(textContent.length);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth={useRichText ? "md" : "sm"}
            fullWidth
            PaperProps={{ sx: useRichText ? { minHeight: '500px' } : {} }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">{title}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                        label={`${charCount}/${maxChars}`}
                        color={charCount > maxChars * 0.9 ? 'error' : charCount > maxChars * 0.7 ? 'warning' : 'primary'}
                        size="small"
                    />
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 2 }}>
                {readOnly ? (
                    <Box sx={{
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                        p: 2,
                        minHeight: useRichText ? '300px' : '150px',
                        backgroundColor: '#f9f9f9'
                    }}>
                        {useRichText ? (
                            <div dangerouslySetInnerHTML={{ __html: value || 'No content available.' }} />
                        ) : (
                            <Typography>{value || 'No content available.'}</Typography>
                        )}
                    </Box>
                ) : useRichText ? (
                    <Editor
                        apiKey={process.env.REACT_APP_TINYMCE_API_KEY}
                        init={{
                            plugins: 'advlist autolink lists link charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime table help wordcount spellchecker',
                            toolbar: 'undo redo | formatselect | bold italic underline | alignleft aligncenter alignright | bullist numlist | link | code | help',
                            height: 350, // or 300 for the second modal
                            menubar: false,
                            statusbar: false,
                            browser_spellcheck: true, // keep only this
                            content_style:
                                'body { font-family: -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif; font-size: 14px; }'
                        }}

                        onEditorChange={handleEditorChange}
                        value={value}
                    />
                ) : (
                    <TextField
                        fullWidth
                        multiline
                        rows={8}
                        value={value}
                        onChange={handleChange}
                        placeholder={placeholder}
                        variant="outlined"
                    />
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button onClick={onClose} startIcon={<CancelIcon />}>
                    Cancel
                </Button>
                {!readOnly && (
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        startIcon={<SaveIcon />}
                        disabled={charCount > maxChars}
                    >
                        Save
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};



// Export default object with all modals
export default {
    BriefDescriptionModal,
    ReliefClaimedModal,
    PresentStatusModal,
    RemarksModal,
    TextPopupModal
};