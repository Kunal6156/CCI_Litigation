import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material'; // Removed IconButton
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom'; // Keep this, as navigate might be used implicitly in logout logic
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import GavelIcon from '@mui/icons-material/Gavel';

function Header({ drawerWidth }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate(); // This is used by AuthContext's logout, so keep it.

    const handleLogout = () => {
        logout();
        // The AuthContext logout already handles redirect to login
        // navigate('/login'); // This line is technically redundant if AuthContext.logout already redirects
    };

    return (
        <AppBar
            position="fixed"
            sx={{
                width: `calc(100% - ${drawerWidth}px)`,
                ml: `${drawerWidth}px`,
                backgroundColor: (theme) => theme.palette.background.paper,
                color: (theme) => theme.palette.text.primary,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}
        >
            <Toolbar>
                <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                    <GavelIcon sx={{ fontSize: 32, mr: 1, color: (theme) => theme.palette.primary.main }} />
                    <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
                        CCI Litigation Platform
                    </Typography>
                </Box>
                
                {user && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AccountCircleIcon sx={{ mr: 1, color: (theme) => theme.palette.text.secondary }} />
                        <Typography variant="subtitle1" sx={{ mr: 2, color: (theme) => theme.palette.text.primary }}>
                            {user.username} ({user.is_admin ? 'Admin' : user.department_name})
                        </Typography>
                        <Button
                            color="inherit"
                            onClick={handleLogout}
                            startIcon={<ExitToAppIcon />}
                            sx={{
                                color: (theme) => theme.palette.text.secondary,
                                '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' }
                            }}
                        >
                            Logout
                        </Button>
                    </Box>
                )}
            </Toolbar>
        </AppBar>
    );
}

export default Header;