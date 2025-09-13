import React, { useState, useCallback } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, TablePagination, TableSortLabel, Box, Button, TextField,
    InputAdornment, IconButton, Dialog, DialogTitle, DialogContent,
    DialogActions, Typography, Chip, Tooltip, Alert, Grid,
    Snackbar
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';

// Icons
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import GetAppIcon from '@mui/icons-material/GetApp';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import InfoIcon from '@mui/icons-material/Info';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import WarningIcon from '@mui/icons-material/Warning';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';

// Updated column structure to match EXACT Excel format from models.py
const EXCEL_FORMAT_COLUMNS = [
    // Excel Columns 1-3: Case Number Components
    { key: 'case_id', label: 'Case Number', sortable: true, width: 150, excel_cols: '1-3' },

    // Excel Column 4: Date of Filing
    { key: 'date_of_filing', label: 'Date of Filing/Intimation', sortable: true, width: 140, excel_cols: '4' },

    // Excel Column 5: Court/Tribunal
    { key: 'pending_before_court', label: 'Pending Before Court', sortable: true, width: 180, excel_cols: '5' },

    // Excel Columns 6-7: Party Details
    { key: 'party_petitioner', label: 'Petitioner Details', sortable: false, width: 200, truncate: true, excel_cols: '6' },
    { key: 'party_respondent', label: 'Respondent Details', sortable: false, width: 200, truncate: true, excel_cols: '7' },

    // Excel Column 8: Nature of Claim
    { key: 'nature_of_claim', label: 'Nature of Claim', sortable: true, width: 120, excel_cols: '8' },

    // Excel Columns 9-11: Advocate Details
    { key: 'advocate_name', label: 'Advocate Name', sortable: true, width: 150, excel_cols: '9' },
    { key: 'advocate_email', label: 'Advocate Email', sortable: false, width: 180, truncate: true, excel_cols: '10' },
    { key: 'advocate_mobile', label: 'Advocate Mobile', sortable: false, width: 120, excel_cols: '11' },

    // Excel Column 12: Financial Implications
    { key: 'financial_implications', label: 'Financial Implications', sortable: true, width: 150, excel_cols: '12', currency: true },

    // Excel Column 13: Internal Department
    { key: 'internal_department', label: 'Internal Department', sortable: true, width: 150, excel_cols: '13' },

    // Excel Columns 14-15: Hearing Dates
    { key: 'last_hearing_date', label: 'Last Hearing Date', sortable: true, width: 130, excel_cols: '14' },
    { key: 'next_hearing_date', label: 'Next Hearing Date', sortable: true, width: 130, excel_cols: '15', hearing_alert: true },

    // Excel Columns 16-19: Popup Fields
    { key: 'brief_description', label: 'Brief Description', sortable: false, width: 120, popup: true, excel_cols: '16', maxChars: 2500 },
    { key: 'relief_claimed', label: 'Relief Claimed', sortable: false, width: 120, popup: true, excel_cols: '17', maxChars: 500 },
    { key: 'present_status', label: 'Present Status', sortable: false, width: 120, popup: true, excel_cols: '18', maxChars: 500 },
    { key: 'case_remarks', label: 'Remarks', sortable: false, width: 120, popup: true, excel_cols: '19', maxChars: 500 },

    // System Fields
    { key: 'created_by', label: 'Created By', sortable: true, width: 120, system: true },
    { key: 'actions', label: 'Actions', sortable: false, width: 150, system: true }
];

function CaseTable({
    user,
    cases,
    totalCount,
    onPageChange,
    onRowsPerPageChange,
    onSort,
    onSearch,
    onEdit,
    onDelete,
    onExport,
    currentPage,
    rowsPerPage,
    autoSaveStatus = null,
    searchFilters = {},
    onClearFilters = () => { },
    onRefresh = () => { }
}) {
    // State management
    const [order, setOrder] = useState('desc');
    const [orderBy, setOrderBy] = useState('date_of_filing');
    const [searchTerm, setSearchTerm] = useState('');
    const [timeoutId, setTimeoutId] = useState(null);

    // Popup modal states
    const [popupOpen, setPopupOpen] = useState(false);
    const [popupContent, setPopupContent] = useState({
        title: '',
        content: '',
        maxChars: 0,
        currentChars: 0
    });

    // Notification states
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'info'
    });

    // Permission checks
    const canEditOrDelete = useCallback((caseItem) => {
        return user?.is_admin || caseItem.internal_department === user?.department_name;
    }, [user]);

    // Indian date formatter (DD-MM-YYYY) - as required by models.py
    const formatIndianDate = useCallback((dateString) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '-';

            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}-${month}-${year}`;
        } catch (error) {
            console.error('Date formatting error:', error);
            return '-';
        }
    }, []);

    // Indian currency formatter - as required by models.py
    const formatIndianCurrency = useCallback((amount) => {
        if (!amount || amount === 0) return 'Rs. 0.00';

        try {
            const num = parseFloat(amount);
            if (isNaN(num)) return 'Rs. 0.00';

            // Indian numbering system (lakhs, crores)
            const formatter = new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });

            return formatter.format(num);
        } catch (error) {
            console.error('Currency formatting error:', error);
            return 'Rs. 0.00';
        }
    }, []);

    // Check if hearing is approaching (within 2 days) - as per models.py logic
    const isHearingDueSoon = useCallback((hearingDate) => {
        if (!hearingDate) return false;

        try {
            const today = new Date();
            const hearing = new Date(hearingDate);
            const diffTime = hearing.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return diffDays <= 2 && diffDays >= 0;
        } catch (error) {
            console.error('Date comparison error:', error);
            return false;
        }
    }, []);

    // Handle table sorting
    const handleRequestSort = useCallback((property) => {
        const isAsc = orderBy === property && order === 'asc';
        const newOrder = isAsc ? 'desc' : 'asc';
        setOrder(newOrder);
        setOrderBy(property);
        onSort(property, newOrder);
    }, [orderBy, order, onSort]);

    // Handle search with debouncing
    const handleSearchChange = useCallback((event) => {
        const value = event.target.value;
        setSearchTerm(value);

        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        const newTimeoutId = setTimeout(() => {
            onSearch(value);
        }, 500);
        setTimeoutId(newTimeoutId);
    }, [timeoutId, onSearch]);

    const handleClearSearch = useCallback(() => {
        setSearchTerm('');
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        onSearch('');
    }, [timeoutId, onSearch]);

    // Handle popup modals for Excel columns 16-19
    const handlePopupOpen = useCallback((title, content, maxChars = 0) => {
        const cleanContent = content || 'No content available';
        const currentChars = cleanContent.replace(/<[^>]*>/g, '').length;

        setPopupContent({
            title,
            content: cleanContent,
            maxChars,
            currentChars
        });
        setPopupOpen(true);
    }, []);

    const handlePopupClose = useCallback(() => {
        setPopupOpen(false);
        setPopupContent({ title: '', content: '', maxChars: 0, currentChars: 0 });
    }, []);

    // Clipboard operations
    const copyToClipboard = useCallback(async (text, description = 'Content') => {
        try {
            await navigator.clipboard.writeText(text);
            setSnackbar({
                open: true,
                message: `${description} copied to clipboard!`,
                severity: 'success'
            });
        } catch (err) {
            console.error('Failed to copy:', err);
            setSnackbar({
                open: true,
                message: 'Failed to copy to clipboard',
                severity: 'error'
            });
        }
    }, []);

    const handleCopyCell = useCallback((content) => {
        copyToClipboard(String(content || ''), 'Cell content');
    }, [copyToClipboard]);

    const handleCopyRow = useCallback((row) => {
        if (!canEditOrDelete(row)) {
            setSnackbar({
                open: true,
                message: "You can only copy rows from your own department.",
                severity: 'warning'
            });
            return;
        }

        // Create tab-separated row data matching Excel format
        const rowData = EXCEL_FORMAT_COLUMNS
            .filter(col => !col.system)
            .map(col => {
                let value = getColumnValue(row, col.key);

                // Format according to column requirements
                if (col.key.includes('date_') && value && value !== '-') {
                    value = formatIndianDate(value);
                }
                if (col.currency) {
                    value = formatIndianCurrency(row[col.key]);
                }
                if (col.popup && typeof value === 'string' && value.includes('<')) {
                    const doc = new DOMParser().parseFromString(value, 'text/html');
                    value = doc.body.textContent || "";
                }

                return value || '';
            }).join('\t');

        copyToClipboard(rowData, 'Row data');
    }, [canEditOrDelete, copyToClipboard, formatIndianDate, formatIndianCurrency]);

    const handleCopyTable = useCallback(() => {
        if (!user?.is_admin) {
            setSnackbar({
                open: true,
                message: "Only administrators can copy the entire table.",
                severity: 'warning'
            });
            return;
        }

        // Create headers
        const headers = EXCEL_FORMAT_COLUMNS
            .filter(col => !col.system)
            .map(col => col.label)
            .join('\t');

        // Create data rows
        const dataRows = cases.map(row =>
            EXCEL_FORMAT_COLUMNS
                .filter(col => !col.system)
                .map(col => {
                    let value = getColumnValue(row, col.key);

                    if (col.key.includes('date_') && value && value !== '-') {
                        value = formatIndianDate(value);
                    }
                    if (col.currency) {
                        value = formatIndianCurrency(row[col.key]);
                    }
                    if (col.popup && typeof value === 'string' && value.includes('<')) {
                        const doc = new DOMParser().parseFromString(value, 'text/html');
                        value = doc.body.textContent || "";
                    }

                    return value || '';
                }).join('\t')
        ).join('\n');

        const fullTable = `${headers}\n${dataRows}`;
        copyToClipboard(fullTable, 'Table data');
    }, [user, cases, copyToClipboard, formatIndianDate, formatIndianCurrency]);

    // Get column value based on new model structure
    const getColumnValue = useCallback((row, columnKey) => {
        switch (columnKey) {
            case 'case_id':
                // Auto-generated case ID from models.py
                return row.case_id || `${row.case_type || 'N/A'}/${row.case_number || 'N/A'}/${row.case_year || 'N/A'}`;

            case 'party_petitioner':
                return row.party_petitioner || 'Not provided';

            case 'party_respondent':
                return row.party_respondent || 'Not provided';

            case 'advocate_name':
                return row.advocate_name || 'Not assigned';

            case 'advocate_email':
                return row.advocate_email || 'Not provided';

            case 'advocate_mobile':
                return row.advocate_mobile || 'Not provided';

            case 'financial_implications':
                return row.financial_implications;

            case 'internal_department':
                return row.internal_department || 'Not assigned';

            case 'created_by':
                return row.created_by_username || row.created_by?.username || 'System';

            default:
                return row[columnKey];
        }
    }, []);

    // Snackbar close handler
    const handleSnackbarClose = useCallback(() => {
        setSnackbar(prev => ({ ...prev, open: false }));
    }, []);

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', px: 2 }}>
            <Paper sx={{ width: '100%', maxWidth: '1800px', mb: 2 }}>
                {/* Enhanced Header */}
                <Box sx={{
                    p: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 2,
                    borderBottom: 1,
                    borderColor: 'divider'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        {/* Search Field */}
                        <TextField
                            label="Search Cases"
                            variant="outlined"
                            size="small"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    searchTerm && (
                                        <InputAdornment position="end">
                                            <IconButton onClick={handleClearSearch} size="small">
                                                <ClearIcon />
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                )
                            }}
                            sx={{ minWidth: 300 }}
                        />

                        {/* Status Indicators */}
                        {autoSaveStatus && (
                            <Chip
                                icon={<SaveAltIcon />}
                                label={autoSaveStatus}
                                color={autoSaveStatus.includes('saved') ? 'success' :
                                    autoSaveStatus.includes('saving') ? 'warning' : 'default'}
                                size="small"
                                variant="outlined"
                            />
                        )}

                        {Object.keys(searchFilters).length > 0 && (
                            <Chip
                                label={`${Object.keys(searchFilters).length} filters active`}
                                color="secondary"
                                size="small"
                                onDelete={onClearFilters}
                                variant="outlined"
                            />
                        )}
                    </Box>

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Tooltip title="Refresh data">
                            <IconButton onClick={onRefresh} size="small">
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Copy entire table (Admin only)">
                            <span>
                                <Button
                                    variant="outlined"
                                    startIcon={<ContentCopyIcon />}
                                    onClick={handleCopyTable}
                                    disabled={!user?.is_admin}
                                    size="small"
                                >
                                    Copy Table
                                </Button>
                            </span>
                        </Tooltip>

                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<GetAppIcon />}
                            onClick={onExport}
                            size="small"
                        >
                            Export Excel
                        </Button>
                    </Box>
                </Box>

                {/* Excel Format Table */}
                <TableContainer sx={{ maxHeight: 'calc(100vh - 350px)' }}>
                    <Table stickyHeader aria-label="excel format litigation cases table">
                        <TableHead>
                            <TableRow>
                                {EXCEL_FORMAT_COLUMNS.map((headCell) => (
                                    <TableCell
                                        key={headCell.key}
                                        align={headCell.numeric ? 'right' : 'left'}
                                        padding="normal"
                                        sortDirection={orderBy === headCell.key ? order : false}
                                        sx={{
                                            fontWeight: 'bold',
                                            fontSize: '14px',
                                            minWidth: headCell.width || 'auto',
                                            whiteSpace: 'nowrap',
                                            backgroundColor: '#f0f4f8',
                                            color: '#0d47a1',
                                            border: '1px solid #ccc',
                                            '& .MuiTableSortLabel-root': {
                                                color: '#0d47a1',
                                            },
                                            '& .MuiTableSortLabel-icon': {
                                                color: '#0d47a1 !important',
                                            }
                                        }}

                                    >
                                        {headCell.sortable ? (
                                            <TableSortLabel
                                                active={orderBy === headCell.key}
                                                direction={orderBy === headCell.key ? order : 'asc'}
                                                onClick={() => handleRequestSort(headCell.key)}
                                                sx={{
                                                    fontWeight: 'bold',
                                                    color: 'inherit'
                                                }}
                                            >
                                                {headCell.label}
                                                
                                                {orderBy === headCell.key ? (
                                                    <Box component="span" sx={visuallyHidden}>
                                                        {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                                                    </Box>
                                                ) : null}
                                            </TableSortLabel>
                                        ) : (
                                            <Box>
                                                {headCell.label}                                                
                                            </Box>
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {cases.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={EXCEL_FORMAT_COLUMNS.length} align="center">
                                        <Typography variant="body1" color="textSecondary" sx={{ py: 4 }}>
                                            No cases found matching your criteria.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                cases.map((row) => {
                                    const hearingAlert = isHearingDueSoon(row.next_hearing_date);

                                    return (
                                        <TableRow
                                            hover
                                            key={row.id}
                                            sx={{
                                                backgroundColor: hearingAlert ? 'warning.light' : 'inherit',
                                                '&:hover': {
                                                    backgroundColor: hearingAlert ? 'warning.main' : 'action.hover'
                                                }
                                            }}
                                        >
                                            {EXCEL_FORMAT_COLUMNS.map((column) => {
                                                let value = getColumnValue(row, column.key);

                                                // Apply formatting based on column type
                                                if (column.key.includes('date_') && value && value !== '-') {
                                                    value = formatIndianDate(value);
                                                }

                                                if (column.currency && value) {
                                                    value = formatIndianCurrency(value);
                                                }

                                                // Clean HTML content for display
                                                if (column.popup && typeof value === 'string' && value.includes('<')) {
                                                    const doc = new DOMParser().parseFromString(value, 'text/html');
                                                    const cleanText = doc.body.textContent || "";
                                                    value = cleanText.length > 50 ?
                                                        cleanText.substring(0, 47) + '...' :
                                                        cleanText || 'No content';
                                                }

                                                // Truncate long text
                                                if (column.truncate && typeof value === 'string' && value.length > 100) {
                                                    value = value.substring(0, 97) + '...';
                                                }

                                                // Render different cell types
                                                if (column.key === 'actions') {
                                                    return (
                                                        <TableCell key={column.key} sx={{ whiteSpace: 'nowrap' }}>
                                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                                {canEditOrDelete(row) && (
                                                                    <>
                                                                        <Tooltip title="Edit Case">
                                                                            <IconButton
                                                                                onClick={() => onEdit(row.id)}
                                                                                color="primary"
                                                                                size="small"
                                                                            >
                                                                                <EditIcon fontSize="small" />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                        <Tooltip title="Delete Case">
                                                                            <IconButton
                                                                                onClick={() => onDelete(row.id)}
                                                                                color="error"
                                                                                size="small"
                                                                            >
                                                                                <DeleteIcon fontSize="small" />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    </>
                                                                )}
                                                                <Tooltip title="Copy Row">
                                                                    <IconButton
                                                                        onClick={() => handleCopyRow(row)}
                                                                        size="small"
                                                                        color="default"
                                                                    >
                                                                        <ContentCopyIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                {hearingAlert && (
                                                                    <Tooltip title="Hearing due within 2 days!">
                                                                        <IconButton size="small" color="warning">
                                                                            <WarningIcon fontSize="small" />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                )}
                                                            </Box>
                                                        </TableCell>
                                                    );
                                                }
                                                // Popup columns (Excel columns 16-19)
                                                else if (column.popup) {
                                                    const originalValue = row[column.key] || 'No content available';
                                                    return (
                                                        <TableCell
                                                            key={column.key}
                                                            sx={{
                                                                cursor: 'pointer',
                                                                maxWidth: column.width || '120px',
                                                                textAlign: 'center',
                                                                '&:hover': {
                                                                    backgroundColor: 'action.hover'
                                                                }
                                                            }}
                                                            onClick={() => handlePopupOpen(
                                                                column.label,
                                                                originalValue,
                                                                column.maxChars
                                                            )}
                                                        >
                                                            <Tooltip title={`Click to view ${column.label} (Excel Col ${column.excel_cols})`}>
                                                                <Box sx={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    gap: 1
                                                                }}>
                                                                    <InfoIcon fontSize="small" color="primary" />
                                                                    <Typography variant="caption">
                                                                        View
                                                                    </Typography>
                                                                </Box>
                                                            </Tooltip>
                                                        </TableCell>
                                                    );
                                                }
                                                // Regular columns
                                                else {
                                                    return (
                                                        <TableCell
                                                            key={column.key}
                                                            onClick={() => handleCopyCell(String(value || ''))}
                                                            sx={{
                                                                cursor: 'pointer',
                                                                maxWidth: column.width || '200px',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: column.truncate ? 'nowrap' : 'normal',
                                                                border: '1px solid #e0e0e0',
                                                                '&:hover': {
                                                                    backgroundColor: 'action.hover'
                                                                },
                                                                fontWeight: column.key === 'case_id' ? 'bold' : 'normal',
                                                                color: column.currency ? 'success.dark' : 'inherit'
                                                            }}

                                                            title={`Excel Col ${column.excel_cols}: ${String(value || '')}`}
                                                        >
                                                            {column.hearing_alert && hearingAlert && (
                                                                <Chip
                                                                    icon={<NotificationsIcon />}
                                                                    label="Due Soon"
                                                                    size="small"
                                                                    color="warning"
                                                                    sx={{ mr: 1 }}
                                                                />
                                                            )}
                                                            {value || '-'}
                                                        </TableCell>
                                                    );
                                                }
                                            })}
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Enhanced Pagination */}
                <Box sx={{
                    borderTop: 1,
                    borderColor: 'divider',
                    p: 1
                }}>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25, 50, 100]}
                        component="div"
                        count={totalCount}
                        rowsPerPage={rowsPerPage}
                        page={currentPage - 1}
                        onPageChange={(event, newPage) => onPageChange(newPage + 1)}
                        onRowsPerPageChange={(event) => onRowsPerPageChange(parseInt(event.target.value, 10))}
                        labelRowsPerPage="Cases per page:"
                        labelDisplayedRows={({ from, to, count }) =>
                            `${from}-${to} of ${count !== -1 ? count : `more than ${to}`} cases (Excel Format)`
                        }
                        showFirstButton
                        showLastButton
                    />
                </Box>
            </Paper>

            {/* Popup Modal for Excel Columns 16-19 */}
            <Dialog
                open={popupOpen}
                onClose={handlePopupClose}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: { minHeight: '400px' }
                }}
            >
                <DialogTitle sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Box>
                        <Typography variant="h6">
                            {popupContent.title}
                        </Typography>
                        {popupContent.maxChars > 0 && (
                            <Typography variant="caption" color="textSecondary">
                                Character count: {popupContent.currentChars} / {popupContent.maxChars}
                            </Typography>
                        )}
                    </Box>
                    <Chip
                        label="Excel Format"
                        color="primary"
                        size="small"
                        variant="outlined"
                    />
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <Box sx={{
                        minHeight: '300px',
                        maxHeight: '400px',
                        overflow: 'auto',
                        p: 1,
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        backgroundColor: 'grey.50'
                    }}>
                        <Typography
                            component="div"
                            sx={{
                                whiteSpace: 'pre-wrap',
                                lineHeight: 1.6,
                                fontSize: '0.95rem'
                            }}
                            dangerouslySetInnerHTML={{
                                __html: popupContent.content || 'No content available'
                            }}
                        />
                    </Box>

                    {popupContent.maxChars > 0 && popupContent.currentChars > popupContent.maxChars && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                            Content exceeds maximum character limit of {popupContent.maxChars} characters.
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions sx={{ gap: 1, p: 2 }}>
                    <Button
                        onClick={() => copyToClipboard(
                            popupContent.content.replace(/<[^>]*>/g, ''),
                            popupContent.title
                        )}
                        startIcon={<ContentCopyIcon />}
                        variant="outlined"
                    >
                        Copy Content
                    </Button>
                    <Button
                        onClick={handlePopupClose}
                        color="primary"
                        variant="contained"
                        autoFocus
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Enhanced Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleSnackbarClose}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                    variant="filled"
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default CaseTable;