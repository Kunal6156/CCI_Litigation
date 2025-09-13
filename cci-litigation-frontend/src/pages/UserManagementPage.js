import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Button, Paper, TextField, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, TablePagination, IconButton, Dialog,
    DialogTitle, DialogContent, DialogActions, FormControl, InputLabel,
    Select, MenuItem, Chip, Alert, CircularProgress, Tooltip, Card,
    CardContent, Grid, Switch, FormControlLabel, Divider, Avatar,
    InputAdornment, Tabs, Tab, Badge
} from '@mui/material';
import {
    Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
    Visibility as ViewIcon, Search as SearchIcon, Download as DownloadIcon,
    Person as PersonIcon, AdminPanelSettings as AdminIcon,
    Business as DepartmentIcon, History as HistoryIcon,
    Lock as LockIcon, LockOpen as UnlockIcon, Refresh as RefreshIcon,
    FilterList as FilterIcon, Clear as ClearIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { DEPARTMENT_OPTIONS } from '../utils/constants';

// User form dialog component
const UserFormDialog = ({ open, onClose, onSubmit, user, isEditing, loading }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        department_name: '',
        user_type: 'user',
        designation: '',
        employee_id: '',
        phone_number: '',
        is_active: true,
        password: '',
        confirm_password: ''
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (user && isEditing) {
            setFormData({
                ...user,
                password: '',
                confirm_password: ''
            });
        } else {
            setFormData({
                username: '',
                email: '',
                first_name: '',
                last_name: '',
                department_name: '',
                user_type: 'user',
                designation: '',
                employee_id: '',
                phone_number: '',
                is_active: true,
                password: '',
                confirm_password: ''
            });
        }
        setErrors({});
    }, [user, isEditing, open]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.username.trim()) newErrors.username = 'Username is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
        if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
        if (!formData.department_name) newErrors.department_name = 'Department is required';

        if (!isEditing) {
            if (!formData.password) newErrors.password = 'Password is required';
            if (!formData.confirm_password) newErrors.confirm_password = 'Confirm password is required';
            if (formData.password !== formData.confirm_password) {
                newErrors.confirm_password = 'Passwords do not match';
            }
        }

        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validateForm()) {
            const submitData = {
                username: formData.username.trim(),
                email: formData.email.trim(),
                first_name: formData.first_name.trim(),
                last_name: formData.last_name.trim(),
                department_name: formData.department_name,
                user_type: formData.user_type,
                designation: formData.designation.trim() || '',
                employee_id: formData.employee_id.trim() || '',
                phone_number: formData.phone_number.trim() || '',
                is_active: formData.is_active,
            };

            if (!isEditing) {
                submitData.password = formData.password.trim();
                submitData.confirm_password = formData.confirm_password.trim();
            }

            onSubmit(submitData);
        }
    };


    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                {isEditing ? 'Edit User' : 'Add New User'}
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    {/* Basic Information */}
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>Basic Information</Typography>
                        <Divider sx={{ mb: 2 }} />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Username"
                            value={formData.username}
                            onChange={(e) => handleChange('username', e.target.value)}
                            error={!!errors.username}
                            helperText={errors.username}
                            disabled={isEditing}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            error={!!errors.email}
                            helperText={errors.email}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="First Name"
                            value={formData.first_name}
                            onChange={(e) => handleChange('first_name', e.target.value)}
                            error={!!errors.first_name}
                            helperText={errors.first_name}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Last Name"
                            value={formData.last_name}
                            onChange={(e) => handleChange('last_name', e.target.value)}
                            error={!!errors.last_name}
                            helperText={errors.last_name}
                        />
                    </Grid>

                    {/* Role & Department */}
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Role & Department</Typography>
                        <Divider sx={{ mb: 2 }} />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth error={!!errors.department_name}>
                            <InputLabel>Department</InputLabel>
                            <Select
                                value={formData.department_name}
                                onChange={(e) => handleChange('department_name', e.target.value)}
                                label="Department"
                            >
                                {DEPARTMENT_OPTIONS.map(option => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors.department_name && (
                                <Typography variant="caption" color="error" sx={{ ml: 2 }}>
                                    {errors.department_name}
                                </Typography>
                            )}
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                            <InputLabel>User Type</InputLabel>
                            <Select
                                value={formData.user_type}
                                onChange={(e) => handleChange('user_type', e.target.value)}
                                label="User Type"
                            >
                                <MenuItem value="user">Regular User</MenuItem>
                                <MenuItem value="admin">Administrator</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Additional Information */}
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Additional Information</Typography>
                        <Divider sx={{ mb: 2 }} />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Designation"
                            value={formData.designation}
                            onChange={(e) => handleChange('designation', e.target.value)}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Employee ID"
                            value={formData.employee_id}
                            onChange={(e) => handleChange('employee_id', e.target.value)}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Phone Number"
                            value={formData.phone_number}
                            onChange={(e) => handleChange('phone_number', e.target.value)}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.is_active}
                                    onChange={(e) => handleChange('is_active', e.target.checked)}
                                />
                            }
                            label="Active User"
                        />
                    </Grid>

                    {/* Password Fields (only for new users) */}
                    {!isEditing && (
                        <>
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Password</Typography>
                                <Divider sx={{ mb: 2 }} />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Password"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => handleChange('password', e.target.value)}
                                    error={!!errors.password}
                                    helperText={errors.password}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Confirm Password"
                                    type="password"
                                    value={formData.confirm_password}
                                    onChange={(e) => handleChange('confirm_password', e.target.value)}
                                    error={!!errors.confirm_password}
                                    helperText={errors.confirm_password}
                                />
                            </Grid>
                        </>
                    )}
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                    {isEditing ? 'Update User' : 'Create User'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// Password reset dialog
const PasswordResetDialog = ({ open, onClose, onSubmit, user, loading }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = () => {
        if (!newPassword) {
            setError('Password is required');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }
        onSubmit(newPassword);
    };

    const handleClose = () => {
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Reset Password for {user?.username}</DialogTitle>
            <DialogContent>
                <TextField
                    fullWidth
                    label="New Password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                        setNewPassword(e.target.value);
                        setError('');
                    }}
                    sx={{ mt: 2, mb: 2 }}
                />
                <TextField
                    fullWidth
                    label="Confirm Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError('');
                    }}
                    sx={{ mb: 2 }}
                />
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                    Reset Password
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// Main UserManagementPage component
function UserManagementPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [userTypeFilter, setUserTypeFilter] = useState('');
    const [activeFilter, setActiveFilter] = useState('');

    // Dialogs
    const [userFormOpen, setUserFormOpen] = useState(false);
    const [passwordResetOpen, setPasswordResetOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [dialogLoading, setDialogLoading] = useState(false);

    // Statistics
    const [stats, setStats] = useState({
        total_users: 0,
        active_users: 0,
        total_admins: 0,
        total_regular_users: 0,
        department_stats: {}
    });

    // Tab state
    const [tabValue, setTabValue] = useState(0);

    // Fetch users
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = {
                page: page + 1,
                page_size: rowsPerPage,
            };

            if (searchTerm) params.search = searchTerm;
            if (departmentFilter) params.department = departmentFilter;
            if (userTypeFilter) params.user_type = userTypeFilter;
            if (activeFilter !== '') params.is_active = activeFilter;

            console.log('Fetching users with params:', params); // For debug

            const response = await api.get('/users/', { params });
            setUsers(response.data.results || []);
            setTotalCount(response.data.count || 0);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load users. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, searchTerm, departmentFilter, userTypeFilter, activeFilter]);


    // Fetch statistics
    const fetchStats = useCallback(async () => {
        try {
            const response = await api.get('/users/summary/');
            setStats(response.data);
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    }, []);

    useEffect(() => {
        if (currentUser?.is_admin) {
            fetchUsers();
            fetchStats();
        }
    }, [fetchUsers, fetchStats, currentUser]);

    // Handle user creation/update
    const handleUserSubmit = async (userData) => {
        setDialogLoading(true);
        setError('');
        setSuccess('');

        try {
            if (isEditing) {
                await api.put(`/users/${selectedUser.id}/`, userData);
                setSuccess('User updated successfully!');
            } else {
                await api.post('/users/', userData);
                setSuccess('User created successfully!');
            }

            setUserFormOpen(false);
            setSelectedUser(null);
            setIsEditing(false);
            fetchUsers();
            fetchStats();
        } catch (err) {
            console.error('Error submitting user:', err);
            const errorMsg = err.response?.data?.error ||
                Object.values(err.response?.data || {}).flat().join(', ') ||
                'Failed to save user. Please try again.';
            setError(errorMsg);
        } finally {
            setDialogLoading(false);
        }
    };

    // Handle password reset
    const handlePasswordReset = async (newPassword) => {
        setDialogLoading(true);
        setError('');
        setSuccess('');

        try {
            await api.post(`/users/${selectedUser.id}/reset_password/`, {
                new_password: newPassword
            });
            setSuccess('Password reset successfully!');
            setPasswordResetOpen(false);
            setSelectedUser(null);
        } catch (err) {
            console.error('Error resetting password:', err);
            setError('Failed to reset password. Please try again.');
        } finally {
            setDialogLoading(false);
        }
    };

    // Handle user deletion (deactivation)
    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to deactivate this user?')) {
            setLoading(true);
            try {
                await api.delete(`/users/${userId}/`);
                setSuccess('User deactivated successfully!');
                fetchUsers();
                fetchStats();
            } catch (err) {
                console.error('Error deleting user:', err);
                setError('Failed to deactivate user. Please try again.');
            } finally {
                setLoading(false);
            }
        }
    };

    // Handle export
    const handleExport = async () => {
        try {
            const response = await api.get('/users/export/', {
                responseType: 'blob',
                params: {
                    search: searchTerm,
                    department: departmentFilter,
                    user_type: userTypeFilter,
                    is_active: activeFilter
                }
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `cci_users_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            setSuccess('User data exported successfully!');
        } catch (err) {
            console.error('Error exporting users:', err);
            setError('Failed to export user data. Please try again.');
        }
    };

    // Clear filters
    const clearFilters = () => {
        setSearchTerm('');
        setDepartmentFilter('');
        setUserTypeFilter('');
        setActiveFilter('');
        setPage(0);
    };

    // Check if user is admin
    if (!currentUser?.is_admin) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Alert severity="warning">
                    Access Denied. Only administrators can access user management.
                </Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 ,transform: 'translateX(-110px)'}}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    User Management
                </Typography>
                <Box>
                    <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={handleExport}
                        sx={{ mr: 2 }}
                    >
                        Export Users
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => {
                            setIsEditing(false);
                            setSelectedUser(null);
                            setUserFormOpen(true);
                        }}
                    >
                        Add New User
                    </Button>
                </Box>
            </Box>

            {/* Success/Error Messages */}
            {success && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            )}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                    <Tab label="Users" />
                    <Tab label="Statistics" />
                </Tabs>
            </Box>

            {tabValue === 0 && (
                <>
                    {/* Filters */}
                    <Paper sx={{ p: 2, mb: 3 }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={3}>
                                <TextField
                                    fullWidth
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon />
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={2}>
                                <FormControl fullWidth>
                                    <InputLabel>Department</InputLabel>
                                    <Select
                                        value={departmentFilter}
                                        onChange={(e) => setDepartmentFilter(e.target.value)}
                                        label="Department"
                                    >
                                        <MenuItem value="">All Departments</MenuItem>
                                        {DEPARTMENT_OPTIONS.map(option => (
                                            <MenuItem key={option.value} value={option.value}>
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={2}>
                                <FormControl fullWidth>
                                    <InputLabel>User Type</InputLabel>
                                    <Select
                                        value={userTypeFilter}
                                        onChange={(e) => setUserTypeFilter(e.target.value)}
                                        label="User Type"
                                    >
                                        <MenuItem value="">All Types</MenuItem>
                                        <MenuItem value="admin">Administrator</MenuItem>
                                        <MenuItem value="user">Regular User</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={2}>
                                <FormControl fullWidth>
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        value={activeFilter}
                                        onChange={(e) => setActiveFilter(e.target.value)}
                                        label="Status"
                                    >
                                        <MenuItem value="">All Status</MenuItem>
                                        <MenuItem value="true">Active</MenuItem>
                                        <MenuItem value="false">Inactive</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={3}>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                        variant="outlined"
                                        startIcon={<FilterIcon />}
                                        onClick={fetchUsers}
                                    >
                                        Apply Filters
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        startIcon={<ClearIcon />}
                                        onClick={clearFilters}
                                    >
                                        Clear
                                    </Button>
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* Users Table */}
                    <Paper>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>User</TableCell>
                                                <TableCell>Department</TableCell>
                                                <TableCell>Role</TableCell>
                                                <TableCell>Status</TableCell>
                                                <TableCell>Last Login</TableCell>
                                                <TableCell>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {users.map((user) => (
                                                <TableRow key={user.id}>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                            <Avatar>
                                                                {(user?.first_name || user?.username || '?')[0]?.toUpperCase()}
                                                            </Avatar>
                                                            <Box>
                                                                <Typography variant="subtitle1">
                                                                    {user.first_name || user.username} {user.last_name || ''}
                                                                </Typography>
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {user.email || 'No email'}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    </TableCell>

                                                    <TableCell>
                                                        {user.department_name}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={user.user_type === 'admin' ? 'Administrator' : 'Regular User'}
                                                            color={user.user_type === 'admin' ? 'warning' : 'info'}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={user.is_active ? 'Active' : 'Inactive'}
                                                            color={user.is_active ? 'success' : 'default'}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Tooltip title="Edit">
                                                            <IconButton
                                                                onClick={() => {
                                                                    setIsEditing(true);
                                                                    setSelectedUser(user);
                                                                    setUserFormOpen(true);
                                                                }}
                                                                size="small"
                                                            >
                                                                <EditIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Reset Password">
                                                            <IconButton
                                                                onClick={() => {
                                                                    setSelectedUser(user);
                                                                    setPasswordResetOpen(true);
                                                                }}
                                                                size="small"
                                                            >
                                                                <LockIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title={user.is_active ? "Deactivate" : "Activate"}>
                                                            <IconButton
                                                                onClick={() => handleDeleteUser(user.id)}
                                                                size="small"
                                                            >
                                                                {user.is_active ? <DeleteIcon /> : <UnlockIcon />}
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {users.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={6} align="center">
                                                        No users found.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <TablePagination
                                    component="div"
                                    count={totalCount}
                                    page={page}
                                    onPageChange={(e, newPage) => setPage(newPage)}
                                    rowsPerPage={rowsPerPage}
                                    onRowsPerPageChange={(e) => {
                                        setRowsPerPage(parseInt(e.target.value, 10));
                                        setPage(0);
                                    }}
                                    rowsPerPageOptions={[5, 10, 25, 50]}
                                />
                            </>
                        )}
                    </Paper>
                </>
            )}

            {tabValue === 1 && (
                <Grid container spacing={3}>
                    {/* User Statistics */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    User Statistics
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="h4" color="primary.main">
                                                {stats.total_users}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Total Users
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="h4" color="success.main">
                                                {stats.active_users}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Active Users
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="h4" color="warning.main">
                                                {stats.total_admins}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Administrators
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="h4" color="info.main">
                                                {stats.total_regular_users}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Regular Users
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Department Statistics */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Department-wise Distribution
                                </Typography>
                                <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                                    {Object.entries(stats.department_stats || {}).map(([dept, deptStats]) => (
                                        <Box key={dept} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #eee' }}>
                                            <Typography variant="body2">{dept}</Typography>
                                            <Box sx={{ display: 'flex', gap: 2 }}>
                                                <Badge badgeContent={deptStats.total} color="primary">
                                                    <PersonIcon fontSize="small" />
                                                </Badge>
                                                <Badge badgeContent={deptStats.admins} color="warning">
                                                    <AdminIcon fontSize="small" />
                                                </Badge>
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Recent Activity */}
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Recent User Activity
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    This section can show recent user logins, account creations, and other activities.
                                    Implementation can be added based on UserLoginHistory model.
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* User Form Dialog */}
            <UserFormDialog
                open={userFormOpen}
                onClose={() => {
                    setUserFormOpen(false);
                    setSelectedUser(null);
                    setIsEditing(false);
                }}
                onSubmit={handleUserSubmit}
                user={selectedUser}
                isEditing={isEditing}
                loading={dialogLoading}
            />

            {/* Password Reset Dialog */}
            <PasswordResetDialog
                open={passwordResetOpen}
                onClose={() => {
                    setPasswordResetOpen(false);
                    setSelectedUser(null);
                }}
                onSubmit={handlePasswordReset}
                user={selectedUser}
                loading={dialogLoading}
            />
        </Box>
    );
}

export default UserManagementPage;