import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import CaseTable from '../components/TableComponents/CaseTable';
import { useAuth } from '../contexts/AuthContext';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

function CaseListPage() {
    const navigate = useNavigate();
    const { user } = useAuth(); // 'user' is now used implicitly in JSX and logic where access is controlled.
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [sortBy, setSortBy] = useState('date_of_institution');
    const [sortOrder, setSortOrder] = useState('desc');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchCases = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = {
                page: currentPage,
                page_size: rowsPerPage,
                sort_by: sortBy,
                sort_order: sortOrder,
                search: searchTerm,
            };
            const response = await api.get('/cases/', { params });
            setCases(response.data.results);
            setTotalCount(response.data.count);
        } catch (err) {
            console.error("Error fetching cases:", err.response?.data || err.message);
            setError('Failed to load cases. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [currentPage, rowsPerPage, sortBy, sortOrder, searchTerm]);

    useEffect(() => {
        fetchCases();
    }, [fetchCases]);

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const handleRowsPerPageChange = (newRowsPerPage) => {
        setRowsPerPage(newRowsPerPage);
        setCurrentPage(1);
    };

    const handleSort = (property, order) => {
        setSortBy(property);
        setSortOrder(order);
        setCurrentPage(1);
    };

    const handleSearch = (term) => {
        setSearchTerm(term);
        setCurrentPage(1);
    };

    const handleEditCase = (caseId) => {
        navigate(`/cases/edit/${caseId}`);
    };

    const handleDeleteCase = async (caseId) => {
        if (window.confirm('Are you sure you want to delete this case?')) {
            setLoading(true);
            try {
                await api.delete(`/cases/${caseId}/`);
                alert('Case deleted successfully!');
                fetchCases();
            } catch (err) {
                console.error("Error deleting case:", err.response?.data || err.message);
                alert(`Failed to delete case: ${err.response?.data?.detail || 'An error occurred.'}`);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleExportExcel = async () => {
        setLoading(true);
        try {
            const params = {
                sort_by: sortBy,
                sort_order: sortOrder,
                search: searchTerm,
            };
            const response = await api.get('/cases/export_excel/', {
                params: params,
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const contentDisposition = response.headers['content-disposition'];
            let filename = 'cci_litigation_cases.xlsx';
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1];
                }
            }
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            alert('Excel file downloaded successfully!');
        } catch (err) {
            console.error("Error exporting Excel:", err.response?.data || err.message);
            alert(`Failed to export Excel: ${err.response?.data?.detail || 'An error occurred.'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ flexGrow: 1, p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Litigation Cases
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddCircleOutlineIcon />}
                    onClick={() => navigate('/cases/new')}
                >
                    Add New Case
                </Button>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Typography color="error">{error}</Typography>
            ) : (
                <CaseTable
                    cases={cases}
                    totalCount={totalCount}
                    currentPage={currentPage}
                    rowsPerPage={rowsPerPage}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    onSort={handleSort}
                    onSearch={handleSearch}
                    onEdit={handleEditCase}
                    onDelete={handleDeleteCase}
                    onExport={handleExportExcel}
                />
            )}
        </Box>
    );
}

export default CaseListPage;