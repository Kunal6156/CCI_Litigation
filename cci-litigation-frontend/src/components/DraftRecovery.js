// components/DraftRecovery.js - Enhanced Material-UI version
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemSecondaryAction,
    IconButton,
    Chip,
    Alert,
    AlertTitle,
    Card,
    CardContent,
    TextField,
    Collapse,
    Divider,
    Grid,
    Paper,
    CircularProgress,
    Tooltip,
    useTheme,
    alpha
} from '@mui/material';
import {
    Warning as WarningIcon,
    AccessTime as TimeIcon,
    Save as SaveIcon,
    Delete as DeleteIcon,
    Download as DownloadIcon,
    Close as CloseIcon,
    Storage as ServerIcon,
    Computer as LocalIcon,
    Description as FileIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Schedule as RecentIcon
} from '@mui/icons-material';

const DraftRecovery = ({
    availableDrafts,
    showDraftRecovery,
    onClose,
    onLoadDraft,
    onDeleteDraft,
    onSaveManualDraft,
    currentFormData
}) => {
    const theme = useTheme();
    const [selectedDraft, setSelectedDraft] = useState(null);
    const [showManualSave, setShowManualSave] = useState(false);
    const [manualDraftTitle, setManualDraftTitle] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingAction, setLoadingAction] = useState('');

    useEffect(() => {
        if (availableDrafts.length > 0) {
            setSelectedDraft(availableDrafts[0]);
        }
    }, [availableDrafts]);

    const handleLoadDraft = async () => {
        if (!selectedDraft) return;

        setIsLoading(true);
        setLoadingAction('loading');
        try {
            await onLoadDraft(selectedDraft);
            onClose();
        } catch (error) {
            console.error('Error loading draft:', error);
            alert('Failed to load draft. Please try again.');
        } finally {
            setIsLoading(false);
            setLoadingAction('');
        }
    };

    const handleDeleteDraft = async (draft, event) => {
        event.stopPropagation();
        
        if (!window.confirm(`Are you sure you want to delete "${draft.title || 'Untitled Draft'}"?`)) {
            return;
        }

        setIsLoading(true);
        setLoadingAction('deleting');
        try {
            await onDeleteDraft(draft);

            // Remove from local state
            const updatedDrafts = availableDrafts.filter(d =>
                d.source !== draft.source || d.id !== draft.id
            );

            if (updatedDrafts.length === 0) {
                onClose();
            } else if (selectedDraft === draft) {
                setSelectedDraft(updatedDrafts[0]);
            }
        } catch (error) {
            console.error('Error deleting draft:', error);
            alert('Failed to delete draft. Please try again.');
        } finally {
            setIsLoading(false);
            setLoadingAction('');
        }
    };

    const handleSaveManualDraft = async () => {
        if (!manualDraftTitle.trim()) {
            alert('Please enter a title for the draft.');
            return;
        }

        setIsLoading(true);
        setLoadingAction('saving');
        try {
            await onSaveManualDraft(manualDraftTitle, currentFormData);
            setShowManualSave(false);
            setManualDraftTitle('');
            alert('Draft saved successfully!');
        } catch (error) {
            console.error('Error saving manual draft:', error);
            alert('Failed to save draft. Please try again.');
        } finally {
            setIsLoading(false);
            setLoadingAction('');
        }
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffMinutes < 1) {
            return 'Just now';
        } else if (diffMinutes < 60) {
            return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
        } else if (diffMinutes < 1440) {
            const hours = Math.floor(diffMinutes / 60);
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
    };

    const getSourceIcon = (source) => {
        switch (source) {
            case 'server':
                return <ServerIcon sx={{ color: 'primary.main' }} />;
            case 'local_backup':
                return <LocalIcon sx={{ color: 'success.main' }} />;
            default:
                return <FileIcon sx={{ color: 'text.secondary' }} />;
        }
    };

    const getSourceLabel = (source) => {
        switch (source) {
            case 'server':
                return 'Server';
            case 'local_backup':
                return 'Local Backup';
            default:
                return 'Unknown';
        }
    };

    const getSourceChipColor = (source) => {
        switch (source) {
            case 'server':
                return 'primary';
            case 'local_backup':
                return 'success';
            default:
                return 'default';
        }
    };

    if (!showDraftRecovery) return null;

    return (
        <Dialog
            open={showDraftRecovery}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    boxShadow: theme.shadows[24]
                }
            }}
        >
            <DialogTitle sx={{ 
                bgcolor: alpha(theme.palette.warning.main, 0.1),
                borderBottom: `1px solid ${theme.palette.divider}`
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <WarningIcon sx={{ color: 'warning.main', mr: 2 }} />
                        <Box>
                            <Typography variant="h6" component="div">
                                Draft Recovery
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Manage your saved drafts and recover unsaved work
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 3 }}>
                {/* Alert Message */}
                <Alert 
                    severity="warning" 
                    sx={{ mb: 3 }}
                    icon={<WarningIcon />}
                >
                    <AlertTitle>Unsaved drafts found</AlertTitle>
                    We found {availableDrafts.length} draft{availableDrafts.length !== 1 ? 's' : ''} that you can recover. 
                    Would you like to load one of them?
                </Alert>

                <Grid container spacing={3}>
                    {/* Draft List */}
                    <Grid item xs={12} md={6}>
                        <Typography variant="h6" gutterBottom>
                            Available Drafts ({availableDrafts.length})
                        </Typography>

                        <Paper 
                            variant="outlined" 
                            sx={{ 
                                maxHeight: 400, 
                                overflow: 'auto',
                                bgcolor: 'grey.50'
                            }}
                        >
                            <List disablePadding>
                                {availableDrafts.map((draft, index) => (
                                    <ListItem
                                        key={`${draft.source}-${draft.id || index}`}
                                        button
                                        selected={selectedDraft === draft}
                                        onClick={() => setSelectedDraft(draft)}
                                        sx={{
                                            borderBottom: index < availableDrafts.length - 1 ? 
                                                `1px solid ${theme.palette.divider}` : 'none',
                                            '&.Mui-selected': {
                                                bgcolor: alpha(theme.palette.primary.main, 0.12),
                                                '&:hover': {
                                                    bgcolor: alpha(theme.palette.primary.main, 0.18),
                                                }
                                            }
                                        }}
                                    >
                                        <ListItemIcon>
                                            {getSourceIcon(draft.source)}
                                        </ListItemIcon>
                                        
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="subtitle2" noWrap>
                                                        {draft.title || 'Untitled Draft'}
                                                    </Typography>
                                                    {draft.is_recent && (
                                                        <Chip
                                                            label="Recent"
                                                            size="small"
                                                            color="success"
                                                            variant="outlined"
                                                            icon={<RecentIcon />}
                                                        />
                                                    )}
                                                </Box>
                                            }
                                            secondary={
                                                <Box sx={{ mt: 0.5 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                        <TimeIcon sx={{ fontSize: 14 }} />
                                                        <Typography variant="caption">
                                                            {formatTimestamp(draft.timestamp)}
                                                        </Typography>
                                                    </Box>
                                                    <Chip
                                                        label={getSourceLabel(draft.source)}
                                                        size="small"
                                                        color={getSourceChipColor(draft.source)}
                                                        variant="outlined"
                                                    />
                                                    {draft.case_id && (
                                                        <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                                            Case: {draft.case_id}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            }
                                        />
                                        
                                        <ListItemSecondaryAction>
                                            <Tooltip title="Delete draft">
                                                <IconButton
                                                    edge="end"
                                                    onClick={(e) => handleDeleteDraft(draft, e)}
                                                    size="small"
                                                    disabled={isLoading}
                                                    sx={{ 
                                                        color: 'text.secondary',
                                                        '&:hover': { color: 'error.main' }
                                                    }}
                                                >
                                                    {isLoading && loadingAction === 'deleting' ? 
                                                        <CircularProgress size={20} /> : 
                                                        <DeleteIcon />
                                                    }
                                                </IconButton>
                                            </Tooltip>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>
                    </Grid>

                    {/* Draft Preview */}
                    <Grid item xs={12} md={6}>
                        <Typography variant="h6" gutterBottom>
                            Draft Preview
                        </Typography>

                        {selectedDraft ? (
                            <Card variant="outlined" sx={{ maxHeight: 400, overflow: 'auto' }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        {getSourceIcon(selectedDraft.source)}
                                        <Typography variant="h6" sx={{ ml: 1, flex: 1 }}>
                                            {selectedDraft.title || 'Untitled Draft'}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            LAST MODIFIED
                                        </Typography>
                                        <Typography variant="body1">
                                            {formatTimestamp(selectedDraft.timestamp)}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            SOURCE
                                        </Typography>
                                        <Chip
                                            label={getSourceLabel(selectedDraft.source)}
                                            color={getSourceChipColor(selectedDraft.source)}
                                            variant="outlined"
                                            icon={getSourceIcon(selectedDraft.source)}
                                        />
                                    </Box>

                                    {selectedDraft.case_id && (
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                CASE ID
                                            </Typography>
                                            <Typography variant="body1">
                                                {selectedDraft.case_id}
                                            </Typography>
                                        </Box>
                                    )}

                                    {selectedDraft.data && (
                                        <Box>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                FORM FIELDS
                                            </Typography>
                                            <Typography variant="body1">
                                                {Object.keys(selectedDraft.data).length} field{Object.keys(selectedDraft.data).length !== 1 ? 's' : ''} saved
                                            </Typography>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <Card variant="outlined" sx={{ height: 400 }}>
                                <CardContent sx={{ 
                                    height: '100%', 
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    color: 'text.secondary'
                                }}>
                                    <FileIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                                    <Typography variant="body1">
                                        Select a draft to preview
                                    </Typography>
                                </CardContent>
                            </Card>
                        )}
                    </Grid>
                </Grid>

                {/* Manual Save Section */}
                <Box sx={{ mt: 3 }}>
                    <Button
                        variant="outlined"
                        startIcon={showManualSave ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        onClick={() => setShowManualSave(!showManualSave)}
                        sx={{ mb: 2 }}
                    >
                        Save Current Form as Draft
                    </Button>

                    <Collapse in={showManualSave}>
                        <Paper 
                            variant="outlined" 
                            sx={{ 
                                p: 3, 
                                bgcolor: alpha(theme.palette.primary.main, 0.04),
                                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                            }}
                        >
                            <Typography variant="subtitle1" gutterBottom sx={{ color: 'primary.main' }}>
                                Save Current Form as Draft
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                                <TextField
                                    fullWidth
                                    label="Draft Title"
                                    value={manualDraftTitle}
                                    onChange={(e) => setManualDraftTitle(e.target.value)}
                                    placeholder="Enter a descriptive title for your draft..."
                                    variant="outlined"
                                    size="small"
                                />
                                <Button
                                    variant="contained"
                                    onClick={handleSaveManualDraft}
                                    disabled={isLoading || !manualDraftTitle.trim()}
                                    startIcon={isLoading && loadingAction === 'saving' ? 
                                        <CircularProgress size={16} color="inherit" /> : 
                                        <SaveIcon />
                                    }
                                >
                                    {isLoading && loadingAction === 'saving' ? 'Saving...' : 'Save'}
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={() => {
                                        setShowManualSave(false);
                                        setManualDraftTitle('');
                                    }}
                                >
                                    Cancel
                                </Button>
                            </Box>
                        </Paper>
                    </Collapse>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3, bgcolor: 'grey.50' }}>
                <Button
                    onClick={onClose}
                    color="inherit"
                    size="large"
                >
                    Continue Without Loading
                </Button>
                
                <Button
                    onClick={handleLoadDraft}
                    disabled={!selectedDraft || isLoading}
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={isLoading && loadingAction === 'loading' ? 
                        <CircularProgress size={20} color="inherit" /> : 
                        <DownloadIcon />
                    }
                >
                    {isLoading && loadingAction === 'loading' ? 'Loading...' : 'Load Selected Draft'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DraftRecovery;