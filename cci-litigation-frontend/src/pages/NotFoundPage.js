import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '80vh',
                textAlign: 'center',
                p: 3,
                backgroundColor: (theme) => theme.palette.background.default, // Consistent background
            }}
        >
            <Typography variant="h1" component="h1" sx={{ fontSize: '7rem', fontWeight: 700, color: (theme) => theme.palette.text.secondary, mb: 2 }}>
                404
            </Typography>
            <Typography variant="h4" component="h2" gutterBottom>
                Page Not Found
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: '500px' }}>
                The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </Typography>
            <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/dashboard')}
                sx={{ py: 1.2 }}
            >
                Go to Dashboard
            </Button>
        </Box>
    );
}

export default NotFoundPage;