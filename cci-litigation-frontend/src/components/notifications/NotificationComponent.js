import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Switch,
    FormControlLabel,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Chip,
    Card,
    CardContent,
    Grid,
    Divider,
    IconButton,
    Tooltip,
    Badge,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemSecondaryAction,
    Snackbar,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material';

// Icons
import NotificationsIcon from '@mui/icons-material/Notifications';
import SmsIcon from '@mui/icons-material/Sms';
import EmailIcon from '@mui/icons-material/Email';
import SettingsIcon from '@mui/icons-material/Settings';
import SendIcon from '@mui/icons-material/Send';
import HistoryIcon from '@mui/icons-material/History';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ClearIcon from '@mui/icons-material/Clear';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';

import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { formatIndianDate } from '../../utils/formatters';


/**
 * NotificationComponent - Comprehensive SMS/Email notification system
 * 
 * Features:
 * 1. Hearing reminder notifications (1 day before)
 * 2. Manual notification sending
 * 3. Notification preferences/settings
 * 4. Notification history tracking
 * 5. SMS and Email templates
 * 6. Department-wise notifications
 * 7. Bulk notifications
 * 8. Auto-notification scheduling
 */
function NotificationComponent({
    variant = 'full',
    hearingAlerts = [],
    onNotificationSent = () => { },
    showSettings = true
}) {
    const { user } = useAuth();

    // Main state
    const [loading, setLoading] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [notificationHistory, setNotificationHistory] = useState([]);
    const [upcomingHearings, setUpcomingHearings] = useState([]);

    // Settings state
    const [settings, setSettings] = useState({
        sms_enabled: true,
        email_enabled: true,
        auto_reminders: true,
        reminder_days_before: 1,
        notification_time: '09:00',
        include_departments: user?.is_admin ? [] : [user?.department_name],
        sms_template: 'Dear {advocate_name}, Your case {case_id} has a hearing scheduled on {hearing_date} at {court_name}. Please be prepared. - CCI Legal Team',
        email_template: `Dear {advocate_name},

This is a reminder that your case {case_id} ({case_type}) has a hearing scheduled on {hearing_date}.

Case Details:
- Petitioner: {party_petitioner}
- Respondent: {party_respondent}
- Court/Tribunal: {pending_before_court}
- Financial Implications: {financial_implications}

Please ensure you are well-prepared for the hearing.

Best regards,
CCI Legal Team
Internal Department: {internal_department}`
    });

    // Dialog states
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [manualSendOpen, setManualSendOpen] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [bulkSendOpen, setBulkSendOpen] = useState(false);

    // Manual send state
    const [manualSendData, setManualSendData] = useState({
        case_id: '',
        message_type: 'both',
        custom_message: '',
        recipient_phone: '',
        recipient_email: '',
        use_template: true
    });

    // Snackbar state
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'info'
    });

    // Load notifications and data
    useEffect(() => {
        if (variant === 'full') {
            loadNotificationData();
            loadSettings();
        }
    }, [variant]);

    // Auto-refresh notifications every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            if (variant === 'full') {
                loadNotificationData();
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [variant]);

    // Load notification data
    const loadNotificationData = useCallback(async () => {
        setLoading(true);
        try {
            const [upcomingResponse, historyResponse] = await Promise.all([
                api.get('/notifications/upcoming-hearings/'),
                api.get('/notifications/history/', {
                    params: {
                        limit: 50,
                        department: user?.is_admin ? undefined : user?.department_name
                    }
                })
            ]);

            setUpcomingHearings(upcomingResponse.data.results || []);
            setNotificationHistory(historyResponse.data.results || []);
        } catch (error) {
            console.error('Error loading notification data:', error);
            showSnackbar('Failed to load notification data', 'error');
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Load user notification settings
    const loadSettings = useCallback(async () => {
        try {
            const response = await api.get('/notifications/settings/');
            if (response.data) {
                setSettings(prev => ({ ...prev, ...response.data }));
            }
        } catch (error) {
            console.error('Error loading notification settings:', error);
        }
    }, []);

    // Save notification settings
    const saveSettings = useCallback(async () => {
        setLoading(true);
        try {
            await api.post('/notifications/settings/', settings);
            showSnackbar('Notification settings saved successfully!', 'success');
            setSettingsOpen(false);
        } catch (error) {
            console.error('Error saving notification settings:', error);
            showSnackbar('Failed to save notification settings', 'error');
        } finally {
            setLoading(false);
        }
    }, [settings]);

    // Send hearing reminders
    const sendHearingReminders = useCallback(async (hearingIds = null) => {
        setLoading(true);
        try {
            const payload = {
                hearing_ids: hearingIds,
                days_ahead: settings.reminder_days_before,
                departments: settings.include_departments,
                sms_enabled: settings.sms_enabled,
                email_enabled: settings.email_enabled,
                custom_templates: {
                    sms: settings.sms_template,
                    email: settings.email_template
                }
            };

            const response = await api.post('/notifications/send-hearing-reminders/', payload);

            const { notifications_sent, errors } = response.data;

            if (notifications_sent > 0) {
                showSnackbar(`${notifications_sent} hearing reminders sent successfully!`, 'success');
                onNotificationSent({ count: notifications_sent, type: 'hearing_reminder' });
                loadNotificationData(); // Refresh data
            }

            if (errors && errors.length > 0) {
                console.warn('Notification errors:', errors);
                showSnackbar(`Sent ${notifications_sent} reminders, ${errors.length} failed`, 'warning');
            }

        } catch (error) {
            console.error('Error sending hearing reminders:', error);
            showSnackbar('Failed to send hearing reminders', 'error');
        } finally {
            setLoading(false);
        }
    }, [settings, onNotificationSent]);

    // Send manual notification
    const sendManualNotification = useCallback(async () => {
        if (!manualSendData.case_id) {
            showSnackbar('Please select a case', 'warning');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                case_id: manualSendData.case_id,
                message_type: manualSendData.message_type,
                custom_message: manualSendData.use_template ? null : manualSendData.custom_message,
                recipient_phone: manualSendData.recipient_phone,
                recipient_email: manualSendData.recipient_email,
                use_template: manualSendData.use_template,
                templates: manualSendData.use_template ? {
                    sms: settings.sms_template,
                    email: settings.email_template
                } : null
            };

            const response = await api.post('/notifications/send-manual/', payload);

            showSnackbar('Manual notification sent successfully!', 'success');
            setManualSendOpen(false);
            setManualSendData({
                case_id: '',
                message_type: 'both',
                custom_message: '',
                recipient_phone: '',
                recipient_email: '',
                use_template: true
            });

            onNotificationSent({ count: 1, type: 'manual' });
            loadNotificationData();

        } catch (error) {
            console.error('Error sending manual notification:', error);
            const errorMsg = error.response?.data?.detail || 'Failed to send notification';
            showSnackbar(errorMsg, 'error');
        } finally {
            setLoading(false);
        }
    }, [manualSendData, settings, onNotificationSent]);

    // Bulk send notifications
    const sendBulkNotifications = useCallback(async (caseIds) => {
        setLoading(true);
        try {
            const payload = {
                case_ids: caseIds,
                message_type: 'both',
                sms_enabled: settings.sms_enabled,
                email_enabled: settings.email_enabled,
                templates: {
                    sms: settings.sms_template,
                    email: settings.email_template
                }
            };

            const response = await api.post('/notifications/send-bulk/', payload);

            const { notifications_sent, errors } = response.data;

            if (notifications_sent > 0) {
                showSnackbar(`${notifications_sent} bulk notifications sent successfully!`, 'success');
                onNotificationSent({ count: notifications_sent, type: 'bulk' });
            }

            if (errors && errors.length > 0) {
                showSnackbar(`Sent ${notifications_sent} notifications, ${errors.length} failed`, 'warning');
            }

            setBulkSendOpen(false);
            loadNotificationData();

        } catch (error) {
            console.error('Error sending bulk notifications:', error);
            showSnackbar('Failed to send bulk notifications', 'error');
        } finally {
            setLoading(false);
        }
    }, [settings, onNotificationSent]);

    // Utility functions
    const showSnackbar = useCallback((message, severity = 'info') => {
        setSnackbar({ open: true, message, severity });
    }, []);

    const handleSnackbarClose = useCallback(() => {
        setSnackbar(prev => ({ ...prev, open: false }));
    }, []);

    const getNotificationIcon = (type, status) => {
        if (status === 'failed') return <ErrorIcon color="error" />;
        if (status === 'sent') return <CheckCircleIcon color="success" />;
        if (status === 'pending') return <ScheduleIcon color="warning" />;

        return type === 'sms' ? <SmsIcon color="primary" /> : <EmailIcon color="primary" />;
    };

    const getNotificationStatusColor = (status) => {
        switch (status) {
            case 'sent': return 'success';
            case 'failed': return 'error';
            case 'pending': return 'warning';
            default: return 'default';
        }
    };

    // Compact widget variant
    if (variant === 'widget') {
        return (
            <Card sx={{ minWidth: 300 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">
                            Notifications
                        </Typography>
                        <Badge badgeContent={upcomingHearings.length} color="error">
                            <NotificationsIcon />
                        </Badge>
                    </Box>

                    {upcomingHearings.length > 0 ? (
                        <Box>
                            <Alert severity="warning" sx={{ mb: 2 }}>
                                {upcomingHearings.length} hearing(s) due within {settings.reminder_days_before} day(s)
                            </Alert>
                            <Button
                                variant="contained"
                                startIcon={<SendIcon />}
                                onClick={() => sendHearingReminders()}
                                disabled={loading}
                                fullWidth
                                size="small"
                            >
                                Send Reminders
                            </Button>
                        </Box>
                    ) : (
                        <Typography variant="body2" color="textSecondary">
                            No upcoming hearings requiring reminders
                        </Typography>
                    )}
                </CardContent>
            </Card>
        );
    }

    // Full component variant
    return (
        <Box sx={{ p: 3 ,transform: 'translateX(-110px)'}}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Notification Center
                </Typography>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Refresh data">
                        <IconButton onClick={loadNotificationData} disabled={loading}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>

                    {showSettings && (
                        <Button
                            variant="outlined"
                            startIcon={<SettingsIcon />}
                            onClick={() => setSettingsOpen(true)}
                        >
                            Settings
                        </Button>
                    )}

                    <Button
                        variant="outlined"
                        startIcon={<HistoryIcon />}
                        onClick={() => setHistoryOpen(true)}
                    >
                        History
                    </Button>

                    <Button
                        variant="contained"
                        startIcon={<SendIcon />}
                        onClick={() => setManualSendOpen(true)}
                        color="primary"
                    >
                        Send Manual
                    </Button>
                </Box>
            </Box>

            {/* Upcoming Hearings Alert */}
            {upcomingHearings.length > 0 && (
                <Paper sx={{ p: 3, mb: 3, backgroundColor: 'warning.light' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <WarningIcon color="warning" sx={{ mr: 1 }} />
                        <Typography variant="h6">
                            Upcoming Hearings Requiring Reminders
                        </Typography>
                        <Chip
                            label={upcomingHearings.length}
                            color="warning"
                            size="small"
                            sx={{ ml: 2 }}
                        />
                    </Box>

                    <Grid container spacing={2} sx={{ mb: 2 }}>
                        {upcomingHearings.slice(0, 3).map((hearing) => (
                            <Grid item xs={12} md={4} key={hearing.id}>
                                <Card>
                                    <CardContent sx={{ p: 2 }}>
                                        <Typography variant="subtitle2" noWrap>
                                            <strong>{hearing.case_id}</strong>
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            {formatIndianDate(hearing.next_hearing_date)}
                                        </Typography>
                                        <Typography variant="caption" display="block">
                                            {hearing.advocate_name}
                                        </Typography>
                                        <Typography variant="caption" display="block">
                                            {hearing.advocate_mobile} | {hearing.advocate_email}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<SendIcon />}
                            onClick={() => sendHearingReminders()}
                            disabled={loading}
                            color="warning"
                        >
                            {loading ? <CircularProgress size={20} /> : 'Send All Reminders'}
                        </Button>

                        <Button
                            variant="outlined"
                            onClick={() => setBulkSendOpen(true)}
                        >
                            Bulk Send
                        </Button>

                        {upcomingHearings.length > 3 && (
                            <Typography variant="body2" sx={{ alignSelf: 'center', ml: 2 }}>
                                +{upcomingHearings.length - 3} more cases
                            </Typography>
                        )}
                    </Box>
                </Paper>
            )}

            {/* Notification Overview */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <SmsIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="h6">SMS Enabled</Typography>
                            <Switch
                                checked={settings.sms_enabled}
                                onChange={(e) => setSettings(prev => ({ ...prev, sms_enabled: e.target.checked }))}
                            />
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <EmailIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="h6">Email Enabled</Typography>
                            <Switch
                                checked={settings.email_enabled}
                                onChange={(e) => setSettings(prev => ({ ...prev, email_enabled: e.target.checked }))}
                            />
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <ScheduleIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="h6">Auto Reminders</Typography>
                            <Switch
                                checked={settings.auto_reminders}
                                onChange={(e) => setSettings(prev => ({ ...prev, auto_reminders: e.target.checked }))}
                            />
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="primary">
                                {notificationHistory.filter(n => n.status === 'sent').length}
                            </Typography>
                            <Typography variant="h6">Sent Today</Typography>
                            <Typography variant="caption" color="textSecondary">
                                Total notifications
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Recent Notification History */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    Recent Notifications
                </Typography>

                {notificationHistory.length === 0 ? (
                    <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
                        No notifications sent yet
                    </Typography>
                ) : (
                    <List>
                        {notificationHistory.slice(0, 5).map((notification) => (
                            <ListItem key={notification.id} divider>
                                <ListItemIcon>
                                    {getNotificationIcon(notification.notification_type, notification.status)}
                                </ListItemIcon>
                                <ListItemText
                                    primary={`${notification.case?.case_id || 'Unknown Case'} - ${notification.notification_type.toUpperCase()}`}
                                    secondary={`To: ${notification.recipient} | ${formatIndianDate(notification.created_at)}`}
                                />
                                <ListItemSecondaryAction>
                                    <Chip
                                        label={notification.status}
                                        color={getNotificationStatusColor(notification.status)}
                                        size="small"
                                    />
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                )}
            </Paper>

            {/* Settings Dialog */}
            <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Notification Settings</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <Accordion defaultExpanded>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="h6">General Settings</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={settings.sms_enabled}
                                                    onChange={(e) => setSettings(prev => ({ ...prev, sms_enabled: e.target.checked }))}
                                                />
                                            }
                                            label="Enable SMS Notifications"
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={settings.email_enabled}
                                                    onChange={(e) => setSettings(prev => ({ ...prev, email_enabled: e.target.checked }))}
                                                />
                                            }
                                            label="Enable Email Notifications"
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={settings.auto_reminders}
                                                    onChange={(e) => setSettings(prev => ({ ...prev, auto_reminders: e.target.checked }))}
                                                />
                                            }
                                            label="Auto Hearing Reminders"
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Reminder Days Before"
                                            type="number"
                                            value={settings.reminder_days_before}
                                            onChange={(e) => setSettings(prev => ({ ...prev, reminder_days_before: parseInt(e.target.value) }))}
                                            inputProps={{ min: 1, max: 7 }}
                                            fullWidth
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Notification Time"
                                            type="time"
                                            value={settings.notification_time}
                                            onChange={(e) => setSettings(prev => ({ ...prev, notification_time: e.target.value }))}
                                            InputLabelProps={{ shrink: true }}
                                            fullWidth
                                        />
                                    </Grid>
                                </Grid>
                            </AccordionDetails>
                        </Accordion>

                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="h6">Message Templates</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Grid container spacing={3}>
                                    <Grid item xs={12}>
                                        <TextField
                                            label="SMS Template"
                                            multiline
                                            rows={4}
                                            value={settings.sms_template}
                                            onChange={(e) => setSettings(prev => ({ ...prev, sms_template: e.target.value }))}
                                            fullWidth
                                            helperText="Available placeholders: {advocate_name}, {case_id}, {hearing_date}, {court_name}, {case_type}"
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            label="Email Template"
                                            multiline
                                            rows={8}
                                            value={settings.email_template}
                                            onChange={(e) => setSettings(prev => ({ ...prev, email_template: e.target.value }))}
                                            fullWidth
                                            helperText="Available placeholders: {advocate_name}, {case_id}, {case_type}, {hearing_date}, {party_petitioner}, {party_respondent}, {pending_before_court}, {financial_implications}, {internal_department}"
                                        />
                                    </Grid>
                                </Grid>
                            </AccordionDetails>
                        </Accordion>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSettingsOpen(false)}>Cancel</Button>
                    <Button onClick={saveSettings} variant="contained" disabled={loading}>
                        {loading ? <CircularProgress size={20} /> : 'Save Settings'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Manual Send Dialog */}
            <Dialog open={manualSendOpen} onClose={() => setManualSendOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Send Manual Notification</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <TextField
                                    label="Case ID"
                                    value={manualSendData.case_id}
                                    onChange={(e) => setManualSendData(prev => ({ ...prev, case_id: e.target.value }))}
                                    fullWidth
                                    required
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <InputLabel>Message Type</InputLabel>
                                    <Select
                                        value={manualSendData.message_type}
                                        onChange={(e) => setManualSendData(prev => ({ ...prev, message_type: e.target.value }))}
                                    >
                                        <MenuItem value="sms">SMS Only</MenuItem>
                                        <MenuItem value="email">Email Only</MenuItem>
                                        <MenuItem value="both">Both SMS & Email</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Recipient Phone"
                                    value={manualSendData.recipient_phone}
                                    onChange={(e) => setManualSendData(prev => ({ ...prev, recipient_phone: e.target.value }))}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Recipient Email"
                                    value={manualSendData.recipient_email}
                                    onChange={(e) => setManualSendData(prev => ({ ...prev, recipient_email: e.target.value }))}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={manualSendData.use_template}
                                            onChange={(e) => setManualSendData(prev => ({ ...prev, use_template: e.target.checked }))}
                                        />
                                    }
                                    label="Use Template"
                                />
                            </Grid>
                            {!manualSendData.use_template && (
                                <Grid item xs={12}>
                                    <TextField
                                        label="Custom Message"
                                        multiline
                                        rows={4}
                                        value={manualSendData.custom_message}
                                        onChange={(e) => setManualSendData(prev => ({ ...prev, custom_message: e.target.value }))}
                                        fullWidth
                                        required
                                    />
                                </Grid>
                            )}
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setManualSendOpen(false)}>Cancel</Button>
                    <Button onClick={sendManualNotification} variant="contained" disabled={loading}>
                        {loading ? <CircularProgress size={20} /> : 'Send Notification'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Notification History Dialog */}
            <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Notification History</DialogTitle>
                <DialogContent>
                    <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                        {notificationHistory.map((notification) => (
                            <ListItem key={notification.id} divider>
                                <ListItemIcon>
                                    {getNotificationIcon(notification.notification_type, notification.status)}
                                </ListItemIcon>
                                <ListItemText
                                    primary={`${notification.case?.case_id || 'Unknown Case'} - ${notification.notification_type.toUpperCase()}`}
                                    secondary={
                                        <>
                                            <Typography variant="body2" component="span">
                                                To: {notification.recipient}
                                            </Typography><br />
                                            <Typography variant="caption" component="span">
                                                {formatIndianDate(notification.created_at)} | {notification.status}
                                            </Typography>
                                            {notification.error_message && (
                                                <Typography variant="caption" color="error" component="span" display="block">
                                                    Error: {notification.error_message}
                                                </Typography>
                                            )}
                                        </>
                                    }

                                />
                                <ListItemSecondaryAction>
                                    <Chip
                                        label={notification.status}
                                        color={getNotificationStatusColor(notification.status)}
                                        size="small"
                                    />
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setHistoryOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
            >
                <Alert
                    onClose={handleSnackbarClose}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default NotificationComponent;