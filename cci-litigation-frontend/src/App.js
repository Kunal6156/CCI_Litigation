import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CaseEntryPage from './pages/CaseEntryPage';
import CaseListPage from './pages/CaseListPage';
import UserManagementPage from './pages/UserManagementPage';
import NotFoundPage from './pages/NotFoundPage';
import Header from './components/Header';
import Sidebar from './components/Sidebar';

// Material-UI components for basic layout
import { Box, CssBaseline, ThemeProvider, createTheme, CircularProgress } from '@mui/material';
import NotificationComponent from './components/notifications/NotificationComponent';



// Define an eye-catching, professional theme
const theme = createTheme({
    palette: {
        primary: {
            main: '#00796B', // Deep Teal
            light: '#48A999',
            dark: '#004C40',
            contrastText: '#FFFFFF',
        },
        secondary: {
            main: '#FF5722', // Deep Orange
            light: '#FF8A50',
            dark: '#C41C00',
            contrastText: '#FFFFFF',
        },
        error: {
            main: '#D32F2F',
        },
        background: {
            default: '#F5F8FA', // Light grey-blue for main background, airy
            paper: '#FFFFFF',   // Pure white for cards, forms, and elevated surfaces
        },
        text: {
            primary: '#333333', // Dark grey for main text
            secondary: '#666666', // Lighter grey for subtle text
            disabled: '#999999',
        },
        action: {
            hover: 'rgba(0, 121, 107, 0.08)', // Light hover for primary
            selected: 'rgba(0, 121, 107, 0.12)', // Light selected state
        },
    },
    typography: {
        fontFamily: "'Inter', 'Roboto', 'Arial', sans-serif",
        h4: {
            fontWeight: 700,
            color: '#333333',
            fontSize: '1.8rem',
            '@media (min-width:600px)': {
                fontSize: '2.2rem',
            },
        },
        h5: {
            fontWeight: 600,
            color: '#444444',
            fontSize: '1.5rem',
        },
        h6: {
            fontWeight: 500,
            color: '#555555',
            fontSize: '1.2rem',
        },
        body1: {
            fontSize: '1rem',
            lineHeight: 1.6,
        },
        body2: {
            fontSize: '0.875rem',
            lineHeight: 1.5,
        },
        button: {
            textTransform: 'none',
            fontWeight: 600,
        },
    },
    spacing: 8,
    shape: {
        borderRadius: 8,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    boxShadow: '0px 3px 6px rgba(0, 0, 0, 0.1)',
                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0px 5px 10px rgba(0, 0, 0, 0.15)',
                    },
                },
                containedPrimary: {
                    backgroundColor: '#00796B',
                    '&:hover': {
                        backgroundColor: '#004C40',
                    },
                },
                containedSecondary: {
                    backgroundColor: '#FF5722',
                    '&:hover': {
                        backgroundColor: '#C41C00',
                    },
                },
                outlinedPrimary: {
                    borderColor: '#00796B',
                    color: '#00796B',
                    '&:hover': {
                        backgroundColor: 'rgba(0, 121, 107, 0.04)',
                        borderColor: '#004C40',
                        color: '#004C40',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.08)',
                    borderRadius: 12,
                },
            },
        },
        MuiTextField: {
            defaultProps: {
                variant: 'outlined',
                size: 'medium',
                fullWidth: true,
            },
            styleOverrides: {
                // Corrected: Use a callback function for properties that reference `theme` itself
                root: ({ theme }) => ({
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 8,
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        transition: 'background-color 0.2s ease-in-out',
                        '&.Mui-focused': {
                            backgroundColor: '#FFFFFF',
                        },
                    },
                    '& .MuiInputLabel-root': {
                        color: theme.palette.text.secondary,
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(0, 0, 0, 0.15)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(0, 0, 0, 0.3)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                        borderWidth: '2px',
                    },
                }),
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: ({ theme }) => ({ // Changed to callback as it uses theme.zIndex
                    zIndex: theme.zIndex.drawer + 1,
                    backgroundColor: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }),
            },
        },
        MuiToolbar: {
            styleOverrides: {
                root: {
                    minHeight: 64,
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: ({ theme }) => ({ // Changed to callback as it uses theme.palette
                    backgroundColor: theme.palette.primary.dark,
                    color: '#FFFFFF',
                    boxShadow: '3px 0 10px rgba(0,0,0,0.15)',
                }),
            },
        },
        MuiListItemButton: {
            styleOverrides: {
                root: ({ theme }) => ({ // Changed to callback as it uses theme.palette
                    '&.Mui-selected': {
                        backgroundColor: theme.palette.primary.main,
                        '&:hover': {
                            backgroundColor: theme.palette.primary.main,
                        },
                    },
                    '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.08)',
                    },
                }),
            },
        },
        MuiListItemIcon: {
            styleOverrides: {
                root: {
                    color: 'rgba(255,255,255,0.8)',
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                head: ({ theme }) => ({ // Changed to callback as it uses theme.palette
                    backgroundColor: '#E0F2F1',
                    color: theme.palette.text.primary,
                    fontWeight: 600,
                    fontSize: '0.9rem',
                }),
                body: ({ theme }) => ({ // Changed to callback as it uses theme.palette
                    fontSize: '0.875rem',
                    color: theme.palette.text.primary,
                    borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                }),
            },
        },
        MuiTableContainer: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                },
            },
        },
    },
});

const drawerWidth = 240;

const PrivateRoute = ({ children, adminOnly = false }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: theme.palette.background.default }}>
                <CircularProgress color="primary" />
            </Box>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (adminOnly && !user.is_admin) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Router 
                future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true
                }}
            >
                <AuthProvider>
                    <AppContent />
                </AuthProvider>
            </Router>
        </ThemeProvider>
    );
}

function AppContent() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: theme.palette.background.default }}>
                <CircularProgress color="primary" />
            </Box>
        );
    }

    return (
        <>
            {user && <Header drawerWidth={drawerWidth} />}
            <Box sx={{ display: 'flex' }}>
                {user && <Sidebar drawerWidth={drawerWidth} />}
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        p: 3,
                        width: user ? `calc(100% - ${drawerWidth}px)` : '100%',
                        ml: user ? `${drawerWidth}px` : '0',
                        mt: user ? '64px' : '0',
                        backgroundColor: (theme) => theme.palette.background.default,
                        minHeight: '100vh',
                    }}
                >
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
                        <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
                        <Route path="/cases/new" element={<PrivateRoute><CaseEntryPage /></PrivateRoute>} />
                        <Route path="/cases" element={<PrivateRoute><CaseListPage /></PrivateRoute>} />
                        <Route path="/cases/edit/:id" element={<PrivateRoute><CaseEntryPage /></PrivateRoute>} />
                        <Route path="/users" element={<PrivateRoute adminOnly><UserManagementPage /></PrivateRoute>} />
                        <Route path="/notifications" element={<PrivateRoute><NotificationComponent /></PrivateRoute>} />
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </Box>
            </Box>
        </>
    );
}

export default App;