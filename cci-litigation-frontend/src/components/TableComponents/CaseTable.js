import React, { useState } from 'react'; // Removed useEffect
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, TablePagination, TableSortLabel, Box, Button, TextField, InputAdornment, IconButton
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import GetAppIcon from '@mui/icons-material/GetApp';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import { CASE_TABLE_COLUMNS } from '../../utils/constants';
import { format } from 'date-fns';

/**
 * Advanced Case Table component with:
 * - Pagination
 * - Sorting
 * - Global Search
 * - Actions (Edit/Delete)
 * - Copy to clipboard (Cell, Row, All Filtered Table Data)
 * - Export to Excel
 */
function CaseTable({ cases, totalCount, onPageChange, onRowsPerPageChange, onSort, onSearch, onEdit, onDelete, onExport, currentPage, rowsPerPage }) {
    const [order, setOrder] = useState('desc');
    const [orderBy, setOrderBy] = useState('date_of_institution');
    const [searchTerm, setSearchTerm] = useState('');
    const [timeoutId, setTimeoutId] = useState(null);

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        const newOrder = isAsc ? 'desc' : 'asc';
        setOrder(newOrder);
        setOrderBy(property);
        onSort(property, newOrder);
    };

    const handleSearchChange = (event) => {
        const value = event.target.value;
        setSearchTerm(value);

        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        const newTimeoutId = setTimeout(() => {
            onSearch(value);
        }, 500);
        setTimeoutId(newTimeoutId);
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        onSearch('');
    };

    const copyToClipboard = async (text, message) => {
        try {
            await navigator.clipboard.writeText(text);
            alert(`${message || 'Content'} copied to clipboard!`);
        } catch (err) {
            console.error('Failed to copy: ', err);
            alert('Failed to copy to clipboard. Please copy manually.');
        }
    };

    const handleCopyCell = (content) => {
        copyToClipboard(content, 'Cell content');
    };

    const handleCopyRow = (row) => {
        const rowData = CASE_TABLE_COLUMNS.filter(col => col.key !== 'actions').map(col => {
            let value;
            if (col.key === 'created_by_username') {
                value = row.created_by_username;
            } else {
                value = row[col.key];
            }
            if (col.key.startsWith('date_') && value) {
                value = format(new Date(value), 'yyyy-MM-dd');
            }
            if (col.key === 'relief_orders_prayed' || col.key === 'important_directions_orders' || col.key === 'outcome') {
                const doc = new DOMParser().parseFromString(value, 'text/html');
                value = doc.body.textContent || "";
            }
            return value || '';
        }).join('\t');
        copyToClipboard(rowData, 'Row');
    };

    const handleCopyTable = () => {
        const headers = CASE_TABLE_COLUMNS.filter(col => col.key !== 'actions').map(col => col.label).join('\t');
        
        const dataRows = cases.map(row => 
            CASE_TABLE_COLUMNS.filter(col => col.key !== 'actions').map(col => {
                let value;
                if (col.key === 'created_by_username') {
                    value = row.created_by_username;
                } else {
                    value = row[col.key];
                }
                if (col.key.startsWith('date_') && value) {
                    value = format(new Date(value), 'yyyy-MM-dd');
                }
                if (col.key === 'relief_orders_prayed' || col.key === 'important_directions_orders' || col.key === 'outcome') {
                    const doc = new DOMParser().parseFromString(value, 'text/html');
                    value = doc.body.textContent || "";
                }
                return value || '';
            }).join('\t')
        ).join('\n');

        copyToClipboard(`${headers}\n${dataRows}`, 'Table data');
    };

    return (
        <Paper sx={{ width: '100%', mb: 2 }}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
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
                    sx={{ minWidth: 250 }}
                />
                <Box>
                    <Button
                        variant="outlined"
                        startIcon={<ContentCopyIcon />}
                        onClick={handleCopyTable}
                        sx={{ mr: 1 }}
                    >
                        Copy Table
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<GetAppIcon />}
                        onClick={onExport}
                    >
                        Export to Excel
                    </Button>
                </Box>
            </Box>
            <TableContainer>
                <Table stickyHeader aria-label="litigation cases table">
                    <TableHead>
                        <TableRow>
                            {CASE_TABLE_COLUMNS.map((headCell) => (
                                <TableCell
                                    key={headCell.key}
                                    align={headCell.numeric ? 'right' : 'left'}
                                    padding={headCell.disablePadding ? 'none' : 'normal'}
                                    sortDirection={orderBy === headCell.key ? order : false}
                                >
                                    {headCell.sortable ? (
                                        <TableSortLabel
                                            active={orderBy === headCell.key}
                                            direction={orderBy === headCell.key ? order : 'asc'}
                                            onClick={() => handleRequestSort(headCell.key)}
                                            sx={{fontWeight: 'bold'}}
                                        >
                                            {headCell.label}
                                            {orderBy === headCell.key ? (
                                                <Box component="span" sx={visuallyHidden}>
                                                    {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                                                </Box>
                                            ) : null}
                                        </TableSortLabel>
                                    ) : (
                                        headCell.label
                                    )}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {cases.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={CASE_TABLE_COLUMNS.length} align="center">
                                    No cases found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            cases.map((row) => (
                                <TableRow hover key={row.id}>
                                    {CASE_TABLE_COLUMNS.map((column) => {
                                        let value;
                                        if (column.key === 'created_by_username') {
                                            value = row.created_by_username;
                                        } else {
                                            value = row[column.key];
                                        }

                                        if (typeof column.key === 'string' && column.key.startsWith('date_') && value) {
                                            value = format(new Date(value), 'yyyy-MM-dd');
                                        }
                                        if (column.key === 'relief_orders_prayed' || column.key === 'important_directions_orders' || column.key === 'outcome') {
                                            const doc = new DOMParser().parseFromString(value, 'text/html');
                                            value = doc.body.textContent || "";
                                            if (value.length > 100) value = value.substring(0, 97) + '...';
                                        }

                                        if (column.key === 'actions') {
                                            return (
                                                <TableCell key={column.key}>
                                                    <IconButton onClick={() => onEdit(row.id)} color="primary" size="small">
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton onClick={() => onDelete(row.id)} color="secondary" size="small">
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton onClick={() => handleCopyRow(row)} color="default" size="small">
                                                        <ContentCopyIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            );
                                        } else {
                                            return (
                                                <TableCell key={column.key} onClick={() => handleCopyCell(value || '')} sx={{ cursor: 'pointer' }}>
                                                    {value}
                                                </TableCell>
                                            );
                                        }
                                    })}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={totalCount}
                rowsPerPage={rowsPerPage}
                page={currentPage - 1}
                onPageChange={(event, newPage) => onPageChange(newPage + 1)}
                onRowsPerPageChange={(event) => onRowsPerPageChange(parseInt(event.target.value, 10))}
            />
        </Paper>
    );
}

export default CaseTable;