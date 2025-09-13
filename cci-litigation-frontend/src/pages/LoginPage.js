import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    Alert,
    CircularProgress,
    MenuItem,
    Link,
    Divider,
    IconButton,
    InputAdornment
} from '@mui/material';
import { Visibility, VisibilityOff, AccountBalance, Login as LoginIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { DEPARTMENT_OPTIONS } from '../utils/constants';
import { requiredRule, emailRules } from '../utils/validation';

const LoginPage = () => {
    const { login, isAuthenticated, isLoading, error, clearError } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [showPassword, setShowPassword] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [showForgotPassword, setShowForgotPassword] = useState(false);

    const {
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
        watch,
        reset
    } = useForm({
        defaultValues: {
            username: '',
            email: '',
            password: '',
            department_name: '',
            loginType: 'username' // 'username' or 'email'
        }
    });

    const loginType = watch('loginType');
    
    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            const from = location.state?.from?.pathname || '/dashboard';
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, location]);

    // Clear errors when component mounts or login type changes
    useEffect(() => {
        clearError();
        setLoginError('');
    }, [loginType]);

    const onSubmit = async (data) => {
        setLoginError('');
        clearError();

        try {
            const loginData = {
                loginType: data.loginType, // FIXED: Was 'oginType' (missing 'l')
                password: data.password,
                department_name: Array.isArray(data.department_name) ? data.department_name[0] : data.department_name,
            };

            // Add username or email based on login type
            if (data.loginType === 'email') {
                loginData.email = data.email;
            } else {
                loginData.username = data.username;
            }

            const result = await login(loginData);
            
            if (!result.success) {
                setLoginError(result.error);
            }
        } catch (error) {
            setLoginError('An unexpected error occurred. Please try again.');
        }
    };

    const handleForgotPassword = async (data) => {
        // This would typically send a password reset email
        console.log('Password reset requested for:', data.email);
        // You can implement the actual password reset logic here
        alert('Password reset instructions have been sent to your email.');
        setShowForgotPassword(false);
        reset();
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    if (isLoading) {
        return (
            <Box 
                className="login-container"
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh'
                }}
            >
                <CircularProgress size={60} sx={{ color: 'white' }} />
            </Box>
        );
    }

    return (
        <Box className="login-container">
            <Container maxWidth="sm">
                <Paper className="login-paper" elevation={8}>
                    <Box className="login-logo">
                        <AccountBalance 
                            sx={{ 
                                fontSize: 60, 
                                color: '#1976d2', 
                                mb: 2 
                            }} 
                        />
                        <Typography 
                            variant="h4" 
                            component="h1" 
                            gutterBottom
                            sx={{ 
                                color: '#1976d2', 
                                fontWeight: 700,
                                textAlign: 'center'
                            }}
                        >
                            CCI Litigation Platform
                        </Typography>
                        <Typography 
                            variant="subtitle1" 
                            color="text.secondary"
                            sx={{ textAlign: 'center', mb: 3 }}
                        >
                            {showForgotPassword ? 'Reset Your Password' : 'Sign in to your account'}
                        </Typography>
                    </Box>

                    {/* Error Messages */}
                    {(error || loginError) && (
                        <Alert 
                            severity="error" 
                            sx={{ mb: 3 }}
                            onClose={() => {
                                clearError();
                                setLoginError('');
                            }}
                        >
                            {error || loginError}
                        </Alert>
                    )}

                    {!showForgotPassword ? (
                        // Login Form
                        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
                            {/* Login Type Toggle */}
                            <Box sx={{ mb: 3 }}>
                                <Button
                                    variant={loginType === 'username' ? 'contained' : 'outlined'}
                                    onClick={() => reset({ ...watch(), loginType: 'username', email: '' })}
                                    sx={{ mr: 1 }}
                                    size="small"
                                >
                                    Username
                                </Button>
                                <Button
                                    variant={loginType === 'email' ? 'contained' : 'outlined'}
                                    onClick={() => reset({ ...watch(), loginType: 'email', username: '' })}
                                    size="small"
                                >
                                    Email
                                </Button>
                            </Box>

                            {/* Username/Email Field */}
                            {loginType === 'username' ? (
                                <Controller
                                    name="username"
                                    control={control}
                                    rules={{
                                        required: 'Username is required',
                                        validate: (value) => {
                                            if (!value || !value.trim()) {
                                                return 'Username is required';
                                            }
                                            // Check if user entered an email when username is expected
                                            if (value.includes('@')) {
                                                return 'Please enter your username, not email address. Click "Email" tab to login with email.';
                                            }
                                            // Basic username validation
                                            if (value.length < 3) {
                                                return 'Username must be at least 3 characters long';
                                            }
                                            if (!/^[a-zA-Z0-9_.-]+$/.test(value)) {
                                                return 'Username can only contain letters, numbers, dots, hyphens, and underscores';
                                            }
                                            return true;
                                        }
                                    }}
                                    render={({ field, fieldState: { error } }) => (
                                        <TextField
                                            {...field}
                                            label="Username"
                                            variant="outlined"
                                            fullWidth
                                            margin="normal"
                                            error={!!error}
                                            helperText={error?.message || 'Enter your username (not email address)'}
                                            autoComplete="username"
                                            autoFocus
                                            placeholder="Enter your username"
                                        />
                                    )}
                                />
                            ) : (
                                <Controller
                                    name="email"
                                    control={control}
                                    rules={{
                                        required: 'Email address is required',
                                        validate: (value) => {
                                            if (!value || !value.trim()) {
                                                return 'Email address is required';
                                            }
                                            // Check if user entered username when email is expected
                                            if (!value.includes('@')) {
                                                return 'Please enter a valid email address. Click "Username" tab to login with username.';
                                            }
                                            // Email format validation
                                            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                            if (!emailRegex.test(value)) {
                                                return 'Please enter a valid email address';
                                            }
                                            return true;
                                        }
                                    }}
                                    render={({ field, fieldState: { error } }) => (
                                        <TextField
                                            {...field}
                                            label="Email Address"
                                            type="email"
                                            variant="outlined"
                                            fullWidth
                                            margin="normal"
                                            error={!!error}
                                            helperText={error?.message || 'Enter your email address'}
                                            autoComplete="email"
                                            autoFocus
                                            placeholder="Enter your email address"
                                        />
                                    )}
                                />
                            )}

                            {/* Department Selection */}
                            <Controller
                                name="department_name"
                                control={control}
                                rules={requiredRule('Please select your department')}
                                render={({ field, fieldState: { error } }) => (
                                    <TextField
                                        {...field}
                                        select
                                        label="Department"
                                        variant="outlined"
                                        fullWidth
                                        margin="normal"
                                        error={!!error}
                                        helperText={error?.message || 'Select your department to continue'}
                                    >
                                        {DEPARTMENT_OPTIONS.map((option) => (
                                            <MenuItem key={option.value} value={option.value}>
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                )}
                            />

                            {/* Password Field */}
                            <Controller
                                name="password"
                                control={control}
                                rules={requiredRule('Password is required')}
                                render={({ field, fieldState: { error } }) => (
                                    <TextField
                                        {...field}
                                        label="Password"
                                        type={showPassword ? 'text' : 'password'}
                                        variant="outlined"
                                        fullWidth
                                        margin="normal"
                                        error={!!error}
                                        helperText={error?.message}
                                        autoComplete="current-password"
                                        InputLabelProps={{ shrink: true }}

                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        aria-label="toggle password visibility"
                                                        onClick={togglePasswordVisibility}
                                                        edge="end"
                                                    >
                                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                )}
                            />

                            {/* Login Button */}
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                disabled={isSubmitting}
                                className="login-button"
                                startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
                            >
                                {isSubmitting ? 'Signing In...' : 'Sign In'}
                            </Button>

                            {/* Forgot Password Link */}
                            <Box sx={{ textAlign: 'center', mt: 2 }}>
                                <Link
                                    component="button"
                                    type="button"
                                    variant="body2"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setShowForgotPassword(true);
                                        reset();
                                    }}
                                    sx={{ 
                                        textDecoration: 'none',
                                        '&:hover': { textDecoration: 'underline' }
                                    }}
                                >
                                    Forgot your password?
                                </Link>
                            </Box>
                        </form>
                    ) : (
                        // Forgot Password Form
                        <form onSubmit={handleSubmit(handleForgotPassword)} className="login-form">
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Enter your email address and we'll send you instructions to reset your password.
                            </Typography>

                            <Controller
                                name="email"
                                control={control}
                                rules={emailRules}
                                render={({ field, fieldState: { error } }) => (
                                    <TextField
                                        {...field}
                                        label="Email Address"
                                        type="email"
                                        variant="outlined"
                                        fullWidth
                                        margin="normal"
                                        error={!!error}
                                        helperText={error?.message}
                                        autoComplete="email"
                                        autoFocus
                                    />
                                )}
                            />

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                disabled={isSubmitting}
                                className="login-button"
                                startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
                            >
                                {isSubmitting ? 'Sending...' : 'Send Reset Instructions'}
                            </Button>

                            <Divider sx={{ my: 2 }} />

                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={() => {
                                    setShowForgotPassword(false);
                                    reset();
                                }}
                            >
                                Back to Sign In
                            </Button>
                        </form>
                    )}

                    {/* Footer */}
                    <Box sx={{ mt: 4, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                            © 2024 CCI. All rights reserved.
                        </Typography>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default LoginPage;