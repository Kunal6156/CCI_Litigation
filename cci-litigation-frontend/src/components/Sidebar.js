import React from 'react';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, Divider, Box } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ListAltIcon from '@mui/icons-material/ListAlt';
import PeopleIcon from '@mui/icons-material/People';
import GavelIcon from '@mui/icons-material/Gavel'; // For CCI Logo/Icon
import { useAuth } from '../contexts/AuthContext'; // To get user role
import NotificationsIcon from '@mui/icons-material/Notifications';


function Sidebar({ drawerWidth }) {
    const location = useLocation();
    const { user } = useAuth(); // Get user from context

    const menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', adminOnly: false },
        { text: 'Add New Case', icon: <AddCircleOutlineIcon />, path: '/cases/new', adminOnly: false },
        { text: 'View All Cases', icon: <ListAltIcon />, path: '/cases', adminOnly: false },
        {text: 'Notifications', icon: <NotificationsIcon />, path: '/notifications', adminOnly: false },
        // Only show User Management for Admins
        ...(user?.is_admin ? [{ text: 'User Management', icon: <PeopleIcon />, path: '/users', adminOnly: true }] : []),
    ];

    return (
        <Drawer
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                    backgroundColor: (theme) => theme.palette.primary.dark, // Darker primary for sidebar
                    color: '#FFFFFF',
                    boxShadow: '3px 0 10px rgba(0,0,0,0.15)'
                },
            }}
            variant="permanent"
            anchor="left"
        >
            <Toolbar sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                backgroundColor: (theme) => theme.palette.primary.dark, // Keep consistent background
                borderBottom: '1px solid rgba(255,255,255,0.1)' // Subtle separator
            }}>
                <GavelIcon sx={{ fontSize: 40, mr: 1, color: (theme) => theme.palette.secondary.light }} /> {/* Accent color gavel icon */}
                <Typography variant="h6" noWrap component="div" sx={{ color: 'white', fontWeight: 600 }}>
                    CCI Platform
                </Typography>
            </Toolbar>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />
            <List>
                {menuItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                        <ListItemButton
                            component={RouterLink}
                            to={item.path}
                            selected={location.pathname === item.path}
                            sx={{
                                '&.Mui-selected': {
                                    backgroundColor: (theme) => theme.palette.primary.main, // Selected item background
                                    '&:hover': {
                                        backgroundColor: (theme) => theme.palette.primary.main,
                                    },
                                },
                                '&:hover': {
                                    backgroundColor: 'rgba(255,255,255,0.08)', // Subtle hover
                                },
                            }}
                        >
                            <ListItemIcon sx={{ color: 'rgba(255,255,255,0.8)' }}>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} sx={{ color: 'white' }} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />
            {/* You can add more menu items or user info here */}
            <Box sx={{ p: 2, mt: 'auto', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
                <Typography variant="caption">© 2024 CCI</Typography>
            </Box>
        </Drawer>
    );
}

export default Sidebar;