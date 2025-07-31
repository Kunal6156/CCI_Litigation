import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Button, CircularProgress, Paper,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
    Alert, Checkbox, FormControlLabel
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useForm, Controller } from 'react-hook-form';
import api from '../utils/api'; // Corrected Import Path (relative from pages)
import { DEPARTMENT_OPTIONS } from '../utils/constants'; // Corrected Import Path (relative from pages)
import { requiredRule, emailRules, passwordRules } from '../utils/validation'; // Corrected Import Path (relative from pages)
import InputField from '../components/InputField'; // Corrected Import Path


function UserManagementPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [dialogError, setDialogError] = useState('');

    const { control, handleSubmit, reset, watch, register, formState: { errors, isSubmitting } } = useForm({
        defaultValues: {
            username: '',
            email: '',
            department_name: '',
            is_admin: false,
            password: '',
            confirm_password: ''
        }
    });

    const watchPassword = watch('password');
    const watchIsAdmin = watch('is_admin');

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get('/users/');
            setUsers(response.data);
        } catch (err) {
            console.error("Error fetching users:", err.response?.data || err.message);
            setError('Failed to load users. Please ensure you have admin privileges.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleOpenDialog = (user = null) => {
        setEditingUser(user);
        setDialogError('');
        if (user) {
            reset({
                username: user.username,
                email: user.email,
                department_name: user.department_name || '',
                is_admin: user.is_admin,
                password: '',
                confirm_password: ''
            });
        } else {
            reset({
                username: '',
                email: '',
                department_name: '',
                is_admin: false,
                password: '',
                confirm_password: ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingUser(null);
        reset();
        setDialogError('');
    };

    const onSubmit = async (data) => {
        setDialogError('');
        if (data.password !== data.confirm_password) {
            setDialogError('Passwords do not match.');
            return;
        }

        const { confirm_password, ...payload } = data;

        if (editingUser && !payload.password) {
            delete payload.password;
        }

        try {
            if (editingUser) {
                await api.put(`/users/${editingUser.id}/`, payload);
                alert('User updated successfully!');
            } else {
                await api.post('/users/', payload);
                alert('User created successfully!');
            }
            handleCloseDialog();
            fetchUsers();
        } catch (err) {
            console.error("Error submitting user:", err.response?.data || err.message);
            let errorMessage = 'Failed to save user:';
            if (err.response?.data) {
                for (const key in err.response.data) {
                    if (Array.isArray(err.response.data[key])) {
                        errorMessage += `\n- ${key}: ${error.response.data[key].join(', ')}`;
                    } else {
                        errorMessage += `\n- ${key}: ${error.response.data[key]}`;
                    }
                }
            } else {
                errorMessage += `\n${err.message}`;
            }
            setDialogError(errorMessage);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            setLoading(true);
            try {
                await api.delete(`/users/${userId}/`);
                alert('User deleted successfully!');
                fetchUsers();
            } catch (err) {
                console.error("Error deleting user:", err.response?.data || err.message);
                alert(`Failed to delete user: ${err.response?.data?.detail || 'An error occurred.'}`);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <Box sx={{ flexGrow: 1, p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    User Management
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddCircleOutlineIcon />}
                    onClick={() => handleOpenDialog()}
                >
                    Add New User
                </Button>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error">{error}</Alert>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Username</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Department</TableCell>
                                <TableCell>Role</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">No users found.</TableCell>
                                </TableRow>
                            ) : (
                                users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>{user.username}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{user.department_name || 'N/A'}</TableCell>
                                        <TableCell>{user.is_admin ? 'Admin' : 'Employee'}</TableCell>
                                        <TableCell align="right">
                                            <IconButton onClick={() => handleOpenDialog(user)} color="primary" size="small">
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton onClick={() => handleDeleteUser(user.id)} color="secondary" size="small">
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
                <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
                <DialogContent>
                    {dialogError && <Alert severity="error" sx={{ mb: 2 }}>{dialogError}</Alert>}
                    <form id="user-form" onSubmit={handleSubmit(onSubmit)}>
                        <InputField
                            name="username" label="Username" control={control}
                            rules={{
                                ...requiredRule('Username is required.'),
                                maxLength: { value: 150, message: 'Username cannot exceed 150 characters.' }
                            }}
                            autoFocus
                        />
                        <InputField
                            name="email" label="Email" control={control}
                            rules={emailRules}
                            type="email"
                        />
                        <Controller
                            name="department_name"
                            control={control}
                            rules={requiredRule('Department is required.')}
                            render={({ field, fieldState: { error } }) => (
                                <TextField
                                    {...field}
                                    select
                                    label="Department"
                                    variant="outlined"
                                    fullWidth
                                    margin="normal"
                                    error={!!error}
                                    helperText={error ? error.message : ''}
                                >
                                    {DEPARTMENT_OPTIONS.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            )}
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    {...register("is_admin")}
                                    checked={watchIsAdmin}
                                    color="primary"
                                />
                            }
                            label="Is Admin?"
                            sx={{ mt: 2, mb: 1 }}
                        />
                        <InputField
                            name="password" label="Password" control={control}
                            rules={editingUser ? {} : passwordRules}
                            type="password"
                            helperText={editingUser ? "Leave blank to keep current password" : errors.password?.message || ''}
                        />
                        <InputField
                            name="confirm_password" label="Confirm Password" control={control}
                            rules={editingUser ? {} : {
                                ...requiredRule('Confirm password is required.'),
                                validate: value => value === watchPassword || 'Passwords do not match.'
                            }}
                            type="password"
                            helperText={editingUser ? "" : errors.confirm_password?.message || ''}
                        />
                    </form>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} disabled={isSubmitting}>Cancel</Button>
                    <Button
                        type="submit"
                        form="user-form"
                        variant="contained"
                        color="primary"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? <CircularProgress size={24} color="inherit" /> : (editingUser ? 'Update' : 'Add User')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default UserManagementPage;