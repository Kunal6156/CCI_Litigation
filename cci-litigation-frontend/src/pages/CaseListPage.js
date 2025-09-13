import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box,
    Typography,
    Button,
    CircularProgress,
    Alert,
    Snackbar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Chip,
    Badge,
    Tooltip,
    IconButton,
    Paper,
    Grid,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow
} from '@mui/material';

// API imports - make sure these functions exist in your api.js
import {
    getCases,
    deleteCase,
    downloadExcelReport,
    advancedCaseSearch,
    sendHearingReminders,
    bulkPasteCases,
    previewBulkPaste
} from '../utils/api';

import { useNavigate } from 'react-router-dom';
import CaseTable from '../components/TableComponents/CaseTable';
import { useAuth } from '../contexts/AuthContext';

// Icons
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import WarningIcon from '@mui/icons-material/Warning';

function CaseListPage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    // EXISTING STATE (Preserved)
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [sortBy, setSortBy] = useState('date_of_filing');
    const [sortOrder, setSortOrder] = useState('desc');
    const [searchTerm, setSearchTerm] = useState('');

    // NEW STATE for enhanced features
    const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
    const [searchFilters, setSearchFilters] = useState({});
    const [searchFacets, setSearchFacets] = useState({});
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [refreshInterval, setRefreshInterval] = useState(30000);
    const [upcomingHearings, setUpcomingHearings] = useState([]);
    const [notificationCount, setNotificationCount] = useState(0);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [bulkPasteDialog, setBulkPasteDialog] = useState(false);
    const [pasteData, setPasteData] = useState('');
    const [pastePreview, setPastePreview] = useState(null);
    const [bulkOperationLoading, setBulkOperationLoading] = useState(false);
    const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);

    // REFs for auto-refresh
    const refreshIntervalRef = useRef(null);
    const abortControllerRef = useRef(null);

    // EXISTING fetchCases function (Enhanced)
    const fetchCases = useCallback(async (useAdvancedSearch = false, filters = {}) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();
        setLoading(true);
        setError('');

        try {
            let response;

            if (useAdvancedSearch && (searchTerm || Object.keys(filters).length > 0)) {
                const searchParams = {
                    q: searchTerm,
                    page: currentPage,
                    page_size: rowsPerPage,
                    sort_by: sortBy,
                    sort_order: sortOrder,
                    include_facets: true,
                    ...filters
                };

                response = await advancedCaseSearch(searchParams);

                if (response.data.facets) {
                    setSearchFacets(response.data.facets);
                }
            } else {
                const params = {
                    page: currentPage,
                    page_size: rowsPerPage,
                    sort_by: sortBy,
                    sort_order: sortOrder,
                    search: searchTerm,
                    signal: abortControllerRef.current.signal
                };
                response = await getCases(params);
            }

            setCases(response.data.results || []);
            setTotalCount(response.data.count || 0);

            // Check for upcoming hearings
            const upcoming = (response.data.results || []).filter(case_ => {
                if (!case_.next_hearing_date) return false;

                const hearingDate = new Date(case_.next_hearing_date);
                const today = new Date();
                const timeDiff = hearingDate.getTime() - today.getTime();
                const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

                return daysDiff >= 0 && daysDiff <= 3;
            });

            setUpcomingHearings(upcoming);
            setNotificationCount(upcoming.length);

        } catch (err) {
            if (err.name === 'AbortError') {
                console.log('Request was cancelled');
                return;
            }

            console.error("Error fetching cases:", err.response?.data || err.message);
            setError('Failed to load cases. Please try again.');
            showSnackbar('Failed to load cases', 'error');
        } finally {
            setLoading(false);
        }
    }, [currentPage, rowsPerPage, sortBy, sortOrder, searchTerm]);

    // Auto-refresh functionality
    const startAutoRefresh = useCallback(() => {
        if (refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current);
        }

        refreshIntervalRef.current = setInterval(() => {
            console.log('Auto-refreshing cases...');
            fetchCases(false, searchFilters);
        }, refreshInterval);
    }, [fetchCases, refreshInterval, searchFilters]);

    const stopAutoRefresh = useCallback(() => {
        if (refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current);
            refreshIntervalRef.current = null;
        }
    }, []);

    // Effects
    useEffect(() => {
        fetchCases(Object.keys(searchFilters).length > 0, searchFilters);
    }, [fetchCases, searchFilters]);

    useEffect(() => {
        if (autoRefresh) {
            startAutoRefresh();
        } else {
            stopAutoRefresh();
        }

        return () => stopAutoRefresh();
    }, [autoRefresh, startAutoRefresh, stopAutoRefresh]);

    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            stopAutoRefresh();
        };
    }, [stopAutoRefresh]);

    // Event handlers
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
        if (window.confirm('Are you sure you want to delete this case? This action cannot be undone.')) {
            setLoading(true);
            try {
                await deleteCase(caseId);
                showSnackbar('Case deleted successfully!', 'success');
                fetchCases(false, searchFilters);
            } catch (err) {
                console.error("Error deleting case:", err.response?.data || err.message);
                const errorMsg = err.response?.data?.detail || 'Failed to delete case';
                showSnackbar(errorMsg, 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleExportExcel = async () => {
        setLoading(true);
        try {
            const exportOptions = {
                sort_by: sortBy,
                sort_order: sortOrder,
                search: searchTerm,
                department: user?.is_admin ? undefined : user?.department_name,
                ...searchFilters
            };

            await downloadExcelReport(exportOptions);
            showSnackbar('Excel file downloaded successfully!', 'success');
        } catch (err) {
            console.error("Error exporting Excel:", err.response?.data || err.message);
            const errorMsg = err.response?.data?.detail || 'Failed to export Excel';
            showSnackbar(errorMsg, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Advanced search handlers
    const handleAdvancedSearch = async (filters) => {
        setSearchFilters(filters);
        setCurrentPage(1);
        setAdvancedSearchOpen(false);
        await fetchCases(true, filters);
    };

    const clearAdvancedSearch = () => {
        setSearchFilters({});
        setSearchFacets({});
        setSearchTerm('');
        setCurrentPage(1);
    };

    const handleSendHearingReminders = async () => {
        setLoading(true);
        try {
            const response = await sendHearingReminders({
                days_ahead: 1,
                departments: user?.is_admin ? undefined : [user?.department_name]
            });

            const count = response.data.notifications_sent || 0;
            showSnackbar(`Hearing reminders sent successfully! (${count} notifications)`, 'success');
        } catch (err) {
            console.error("Error sending reminders:", err.response?.data || err.message);
            showSnackbar('Failed to send hearing reminders', 'error');
        } finally {
            setLoading(false);
        }
    };

    // FIXED: Bulk paste handlers
    const handleBulkPasteOpen = () => {
        setBulkPasteDialog(true);
        setPasteData('');
        setPastePreview(null);
    };

    // FIXED: Enhanced paste data parsing
    const parseExcelData = (rawData) => {
        if (!rawData.trim()) return [];
        
        const lines = rawData.trim().split('\n');
        const parsedRows = lines.map(line => {
            // Split by tabs and clean each cell, handling quotes
            return line.split('\t').map(cell => {
                // Remove surrounding quotes and trim
                let cleanCell = cell.trim();
                if ((cleanCell.startsWith('"') && cleanCell.endsWith('"')) || 
                    (cleanCell.startsWith("'") && cleanCell.endsWith("'"))) {
                    cleanCell = cleanCell.slice(1, -1);
                }
                return cleanCell;
            });
        });
        
        console.log('Parsed Excel data:', parsedRows);
        return parsedRows;
    };

    const handleBulkPastePreview = async () => {
        if (!pasteData.trim()) {
            showSnackbar('Please paste some data first', 'warning');
            return;
        }

        setBulkOperationLoading(true);
        try {
            const parsedData = parseExcelData(pasteData);
            
            if (parsedData.length === 0) {
                showSnackbar('No valid data found. Please check your paste format.', 'warning');
                return;
            }

            console.log('Sending parsed data to preview:', parsedData);
            const response = await previewBulkPaste(parsedData);
            console.log('Preview response:', response.data);
            setPastePreview(response.data);

            if (response.data.errors && response.data.errors.length > 0) {
                showSnackbar(`Preview complete: ${response.data.valid_rows} valid rows, ${response.data.errors.length} errors`, 'warning');
            } else if (response.data.valid_rows > 0) {
                showSnackbar(`Preview successful: ${response.data.valid_rows} valid rows ready for import`, 'success');
            }
        } catch (err) {
            console.error("Error previewing paste:", err.response?.data || err.message);
            const errorMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to preview data';
            showSnackbar(errorMsg, 'error');
        } finally {
            setBulkOperationLoading(false);
        }
    };

    const handleBulkPasteSubmit = async () => {
        if (!pastePreview || pastePreview.valid_rows === 0) {
            showSnackbar('No valid data to import. Please preview first.', 'warning');
            return;
        }

        setBulkOperationLoading(true);
        try {
            const parsedData = parseExcelData(pasteData);
            const response = await bulkPasteCases(parsedData, {
                skip_duplicates: true,
                validate_only: false
            });

            const { created, errors, skipped } = response.data;
            setBulkPasteDialog(false);
            setPasteData('');
            setPastePreview(null);

            let message = '';
            let severity = 'success';

            if (created > 0) {
                message = `Successfully created ${created} cases!`;
                if (skipped > 0) {
                    message += ` (${skipped} duplicates skipped)`;
                }
                if (errors && errors.length > 0) {
                    message += ` (${errors.length} errors)`;
                    severity = 'warning';
                }
                
                showSnackbar(message, severity);
                fetchCases(false, searchFilters); // Refresh the list
            } else {
                showSnackbar('No cases were created. Check for errors.', 'warning');
            }

            if (errors && errors.length > 0) {
                console.warn('Bulk paste errors:', errors);
            }
        } catch (err) {
            console.error("Error bulk pasting:", err.response?.data || err.message);
            const errorMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to bulk paste cases';
            showSnackbar(errorMsg, 'error');
        } finally {
            setBulkOperationLoading(false);
        }
    };

    // Utility functions
    const showSnackbar = (message, severity = 'info') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleSnackbarClose = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <Box sx={{ flexGrow: 1, p: 1, transform: 'translateX(-230px)' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, px: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h4" component="h1">
                        Litigation Cases
                    </Typography>

                    {autoRefresh && (
                        <Chip
                            icon={<AutorenewIcon />}
                            label="Auto-refreshing"
                            color="primary"
                            size="small"
                            variant="outlined"
                        />
                    )}

                    {Object.keys(searchFilters).length > 0 && (
                        <Chip
                            icon={<FilterListIcon />}
                            label={`${Object.keys(searchFilters).length} filters active`}
                            color="secondary"
                            size="small"
                            onDelete={clearAdvancedSearch}
                        />
                    )}
                </Box>

                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Tooltip title="Notifications">
                        <Badge badgeContent={notificationCount} color="error">
                            <IconButton
                                color="primary"
                                onClick={() => setNotificationPanelOpen(true)}
                            >
                                <NotificationsIcon />
                            </IconButton>
                        </Badge>
                    </Tooltip>

                    <Tooltip title="Advanced Search & Filters">
                        <IconButton
                            color="primary"
                            onClick={() => setAdvancedSearchOpen(true)}
                        >
                            <SearchIcon />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Bulk Paste from Excel">
                        <IconButton
                            color="primary"
                            onClick={handleBulkPasteOpen}
                        >
                            <CloudUploadIcon />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title={autoRefresh ? "Disable auto-refresh" : "Enable auto-refresh"}>
                        <IconButton
                            color={autoRefresh ? "secondary" : "default"}
                            onClick={() => setAutoRefresh(!autoRefresh)}
                        >
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>

                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddCircleOutlineIcon />}
                        onClick={() => navigate('/cases/new')}
                    >
                        Add New Case
                    </Button>
                </Box>
            </Box>

            {/* Upcoming hearings alert */}
            {upcomingHearings.length > 0 && (
                <Alert
                    severity="warning"
                    sx={{ mb: 2, mx: 2 }}
                    icon={<WarningIcon />}
                    action={
                        <Button
                            color="inherit"
                            size="small"
                            onClick={handleSendHearingReminders}
                        >
                            Send Reminders
                        </Button>
                    }
                >
                    {upcomingHearings.length} case(s) have hearings in the next 3 days.
                    Click "Send Reminders" to notify relevant users.
                </Alert>
            )}

            {/* Search facets display */}
            {Object.keys(searchFacets).length > 0 && (
                <Paper sx={{ p: 2, mb: 2, mx: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Search Results Summary:
                    </Typography>
                    <Grid container spacing={2}>
                        {Object.entries(searchFacets).map(([key, facet]) => (
                            <Grid item xs={12} sm={6} md={3} key={key}>
                                <Card>
                                    <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                                        <Typography variant="caption" color="textSecondary">
                                            {key.replace('_', ' ').toUpperCase()}
                                        </Typography>
                                        <Typography variant="body2">
                                            {typeof facet === 'object' ? JSON.stringify(facet) : facet}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Paper>
            )}

            {/* Loading/Error/Content display */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Typography color="error" sx={{ textAlign: 'center', p: 2 }}>{error}</Typography>
            ) : (
                <CaseTable
                    user={user}
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

            {/* Advanced Search Dialog */}
            <Dialog
                open={advancedSearchOpen}
                onClose={() => setAdvancedSearchOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Advanced Search & Filters</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
                        <TextField
                            label="Search Term"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            fullWidth
                            placeholder="Search across all fields..."
                        />

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    select
                                    label="Department"
                                    value={searchFilters.department || ''}
                                    onChange={(e) => setSearchFilters({ ...searchFilters, department: e.target.value })}
                                    fullWidth
                                    SelectProps={{ native: true }}
                                    InputLabelProps={{ shrink: true }}
                                >
                                    <option value="">All Departments</option>
                                    <option value="Corporate Office">Corporate Office</option>
                                    <option value="Tandur">Tandur</option>
                                    <option value="Rajban">Rajban</option>
                                    <option value="Bokajan">Bokajan</option>
                                    <option value="Akaltara">Akaltara</option>
                                    <option value="Mandhar">Mandhar</option>
                                    <option value="Nayagaoun">Nayagaoun</option>
                                    <option value="Adilabad">Adilabad</option>
                                    <option value="Kurkunta">Kurkunta</option>
                                    <option value="Delhi Grinding">Delhi Grinding</option>
                                    <option value="Bhatinda Grinding">Bhatinda Grinding</option>
                                </TextField>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    select
                                    label="Case Type"
                                    value={searchFilters.case_type || ''}
                                    onChange={(e) => setSearchFilters({ ...searchFilters, case_type: e.target.value })}
                                    fullWidth
                                    SelectProps={{ native: true }}
                                    InputLabelProps={{ shrink: true }}
                                >
                                    <option value="">All Case Types</option>
                                    <option value="CS">CS - Civil Suit</option>
                                    <option value="CRP">CRP - Civil Revision Petition</option>
                                    <option value="CRA">CRA - Civil Revision Application</option>
                                    <option value="WP">WP - Writ Petition</option>
                                    <option value="SLP">SLP - Special Leave Petition</option>
                                    <option value="CC">CC - Contempt Case</option>
                                    <option value="MA">MA - Miscellaneous Application</option>
                                    <option value="CA">CA - Civil Appeal</option>
                                    <option value="Others">Others</option>
                                </TextField>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    select
                                    label="Nature of Claim"
                                    value={searchFilters.nature_of_claim || ''}
                                    onChange={(e) => setSearchFilters({ ...searchFilters, nature_of_claim: e.target.value })}
                                    fullWidth
                                    SelectProps={{ native: true }}
                                    InputLabelProps={{ shrink: true }}
                                >
                                    <option value="">All Claims</option>
                                    <option value="Service">Service</option>
                                    <option value="Labour">Labour</option>
                                    <option value="Contractual">Contractual</option>
                                    <option value="Property">Property</option>
                                    <option value="Land">Land</option>
                                    <option value="Criminal">Criminal</option>
                                    <option value="Arbitration">Arbitration</option>
                                    <option value="Others">Others</option>
                                </TextField>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Date From"
                                    type="date"
                                    value={searchFilters.date_from || ''}
                                    onChange={(e) => setSearchFilters({ ...searchFilters, date_from: e.target.value })}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Date To"
                                    type="date"
                                    value={searchFilters.date_to || ''}
                                    onChange={(e) => setSearchFilters({ ...searchFilters, date_to: e.target.value })}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={clearAdvancedSearch}>Clear All</Button>
                    <Button onClick={() => setAdvancedSearchOpen(false)}>Cancel</Button>
                    <Button
                        onClick={() => handleAdvancedSearch(searchFilters)}
                        variant="contained"
                    >
                        Search
                    </Button>
                </DialogActions>
            </Dialog>

            {/* FIXED: Bulk Paste Dialog */}
            <Dialog
                open={bulkPasteDialog}
                onClose={() => setBulkPasteDialog(false)}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>Bulk Paste Cases from Excel</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 1 }}>
                        <Alert severity="info" sx={{ mb: 2 }}>
                            <Typography variant="body2">
                                <strong>Instructions:</strong><br />
                                1. Copy data from Excel (select cells and Ctrl+C)<br />
                                2. Paste here (Ctrl+V) - each row should contain:<br />
                                   • Case Type | Case Number | Case Year | Department | Court | Petitioner | Respondent | Amount | Status<br />
                                3. Click "Preview" to validate the data<br />
                                4. Click "Import Cases" to create the cases
                            </Typography>
                        </Alert>

                        <TextField
                            multiline
                            rows={12}
                            fullWidth
                            placeholder="Paste your Excel data here... (Tab-separated format)&#10;&#10;Example:&#10;CS	123	2024	Corporate Office	Delhi High Court	ABC Corp	XYZ Ltd	100000	pending&#10;WP	456	2024	Tandur	Supreme Court	PQR Inc	DEF Co	500000	under_hearing"
                            value={pasteData}
                            onChange={(e) => setPasteData(e.target.value)}
                            sx={{ mt: 2, fontFamily: 'monospace', fontSize: '0.875rem' }}
                            helperText="Each row represents one case. Columns should be tab-separated (Tab key or copied from Excel)."
                        />

                        {pastePreview && (
                            <Box sx={{ mt: 3 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Preview Results:
                                </Typography>
                                
                                <Alert 
                                    severity={pastePreview.errors && pastePreview.errors.length > 0 ? "warning" : "success"}
                                    sx={{ mb: 2 }}
                                >
                                    <strong>Summary:</strong> {pastePreview.total_rows} total rows | {pastePreview.valid_rows} valid | {pastePreview.errors ? pastePreview.errors.length : 0} errors
                                </Alert>

                                {/* Show sample data preview */}
                                {pastePreview.sample_data && pastePreview.sample_data.length > 0 && (
                                    <TableContainer component={Paper} sx={{ mb: 2, maxHeight: 400 }}>
                                        <Table size="small" stickyHeader>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Row #</TableCell>
                                                    <TableCell>Case ID</TableCell>
                                                    <TableCell>Case Type</TableCell>
                                                    <TableCell>Department</TableCell>
                                                    <TableCell>Court</TableCell>
                                                    <TableCell>Status</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {pastePreview.sample_data.map((row, index) => (
                                                    <TableRow key={index} sx={{ backgroundColor: row.valid ? 'inherit' : 'error.light' }}>
                                                        <TableCell>{index + 1}</TableCell>
                                                        <TableCell>{row.case_id || 'N/A'}</TableCell>
                                                        <TableCell>{row.case_type || 'N/A'}</TableCell>
                                                        <TableCell>{row.department_name || 'N/A'}</TableCell>
                                                        <TableCell>{row.bench || 'N/A'}</TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={row.valid ? 'Valid' : 'Error'}
                                                                color={row.valid ? 'success' : 'error'}
                                                                size="small"
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}

                                {pastePreview.errors && pastePreview.errors.length > 0 && (
                                    <Box sx={{ mt: 2, maxHeight: 200, overflow: 'auto' }}>
                                        <Typography variant="subtitle2" color="error" gutterBottom>
                                            Errors found:
                                        </Typography>
                                        <Paper sx={{ p: 2, backgroundColor: 'error.light' }}>
                                            {pastePreview.errors.slice(0, 10).map((error, index) => (
                                                <Typography key={index} variant="body2" color="error">
                                                    • {error}
                                                </Typography>
                                            ))}
                                            {pastePreview.errors.length > 10 && (
                                                <Typography variant="caption" color="textSecondary">
                                                    ... and {pastePreview.errors.length - 10} more errors.
                                                </Typography>
                                            )}
                                        </Paper>
                                    </Box>
                                )}
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setBulkPasteDialog(false)}>Cancel</Button>
                    <Button
                        onClick={handleBulkPastePreview}
                        disabled={bulkOperationLoading || !pasteData.trim()}
                        startIcon={bulkOperationLoading ? <CircularProgress size={20} /> : null}
                    >
                        Preview Data
                    </Button>
                    <Button
                        onClick={handleBulkPasteSubmit}
                        variant="contained"
                        disabled={bulkOperationLoading || !pastePreview || (pastePreview.valid_rows === 0)}
                        startIcon={bulkOperationLoading ? <CircularProgress size={20} /> : null}
                    >
                        Import Cases ({pastePreview?.valid_rows || 0})
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Notification Panel Dialog */}
            <Dialog
                open={notificationPanelOpen}
                onClose={() => setNotificationPanelOpen(false)}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>Notifications & Hearing Alerts</DialogTitle>
                <DialogContent>
                    {upcomingHearings.length > 0 ? (
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                Upcoming Hearings ({upcomingHearings.length})
                            </Typography>
                            <TableContainer component={Paper}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Case Number</TableCell>
                                            <TableCell>Court</TableCell>
                                            <TableCell>Next Hearing</TableCell>
                                            <TableCell>Department</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {upcomingHearings.map((case_) => (
                                            <TableRow key={case_.id}>
                                                <TableCell>{case_.case_id}</TableCell>
                                                <TableCell>{case_.bench}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={new Date(case_.next_hearing_date).toLocaleDateString()}
                                                        color="warning"
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell>{case_.department_name}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    ) : (
                        <Typography>No upcoming hearings in the next 3 days.</Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setNotificationPanelOpen(false)}>Close</Button>
                    <Button
                        onClick={handleSendHearingReminders}
                        variant="contained"
                        disabled={upcomingHearings.length === 0}
                    >
                        Send Reminders
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
            >
                <Alert
                    onClose={handleSnackbarClose}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default CaseListPage;