// Create src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Alert, Box } from '@mui/material';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !user.is_admin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Access Denied. Administrator privileges required.
        </Alert>
      </Box>
    );
  }

  return children;
};

export default ProtectedRoute;