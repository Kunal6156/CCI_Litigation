import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Paper, CircularProgress, Alert } from '@mui/material';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import NotificationComponent from '../components/notifications/NotificationComponent';

function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState({ totalCases: 0, myDepartmentCases: 0, pendingCases: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            setError('');
            try {
                // Fetch all cases (backend will filter by department for non-admins)
                // We use page_size=1 to get the 'count' without fetching all data for performance
                const allCasesResponse = await api.get('/cases/', { params: { page_size: 1 } });
                const totalCases = allCasesResponse.data.count;

                // Fetch pending cases (backend will filter by department for non-admins)
                const pendingCasesResponse = await api.get('/cases/', { params: { status_of_case: 'Pending', page_size: 1 } });
                const pendingCases = pendingCasesResponse.data.count;

                let myDepartmentCases = 0;
                // If user is not admin, totalCases count obtained above IS their department's total
                if (!user.is_admin) {
                    myDepartmentCases = totalCases;
                } else {
                    // For admin, if they belong to a department, fetch their department's specific count
                    // (This assumes 'myDepartmentCases' is still relevant for an admin's assigned dept)
                    if (user.department_name) {
                        const deptCasesResponse = await api.get('/cases/', { params: { department_name: user.department_name, page_size: 1 } });
                        myDepartmentCases = deptCasesResponse.data.count;
                    } else {
                        // Admin might not have a specific department_name, so this stat might be irrelevant for them
                        myDepartmentCases = totalCases; // Or display N/A, depending on desired UX
                    }
                }

                setStats({
                    totalCases: totalCases,
                    myDepartmentCases: myDepartmentCases,
                    pendingCases: pendingCases,
                });

            } catch (err) {
                console.error("Failed to fetch dashboard stats:", err.response?.data || err.message);
                setError('Failed to load dashboard statistics. Please try refreshing.');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [user]); // Re-fetch if user changes (e.g., login/logout)

    return (
        <Box sx={{ flexGrow: 1, p: 3 ,transform: 'translateX(-110px)'}}>
            <Typography variant="h4" gutterBottom>
                Dashboard
            </Typography>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error">{error}</Alert>
            ) : (
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={4}>
                        <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#e3f2fd', borderLeft: '5px solid #2196f3' }}>
                            <Typography variant="h6" color="text.secondary">Total Cases</Typography>
                            <Typography variant="h4" color="primary">{stats.totalCases}</Typography>
                        </Paper>
                    </Grid>
                    {/* Only show 'My Department Cases' if user has a department assigned or is admin looking at a specific department */}
                    {user.department_name && (
                        <Grid item xs={12} sm={6} md={4}>
                            <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#e8f5e9', borderLeft: '5px solid #4caf50' }}>
                                <Typography variant="h6" color="text.secondary">{user.is_admin ? `Cases in ${user.department_name}` : 'My Department Cases'}</Typography>
                                <Typography variant="h4" sx={{ color: '#4caf50' }}>{stats.myDepartmentCases}</Typography>
                            </Paper>
                        </Grid>
                    )}
                    <Grid item xs={12} sm={6} md={4}>
                        <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#fff3e0', borderLeft: '5px solid #ff9800' }}>
                            <Typography variant="h6" color="text.secondary">Pending Cases</Typography>
                            <Typography variant="h4" sx={{ color: '#ff9800' }}>{stats.pendingCases}</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <NotificationComponent
                            variant="widget"
                            onNotificationSent={(data) => {
                                console.log('Notification sent:', data);
                                // Update dashboard counters
                            }}
                        />
                    </Grid>
                    {/* Add more stats or charts here */}
                </Grid>
            )}

            <Box sx={{ mt: 4 }}>
                <Typography variant="h5" gutterBottom>
                    Welcome, {user?.username}!
                </Typography>
                <Typography variant="body1">
                    Your department: {user?.department_name || 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {user?.is_admin ? "You have administrative access to manage all cases and users." : "You can manage litigation cases specific to your assigned department."}
                </Typography>
            </Box>
        </Box>
    );
}

export default DashboardPage;