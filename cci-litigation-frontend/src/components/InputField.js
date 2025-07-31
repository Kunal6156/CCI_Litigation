import React from 'react';
import { Controller } from 'react-hook-form';
import { TextField, Typography, Box, MenuItem } from '@mui/material';

const InputField = ({
    name,
    label,
    control,
    rules = {},
    type = 'text',
    multiline = false,
    rows = 1,
    charLimit,
    disabled = false,
    select = false,
    options = [],
    spellCheck = false,
    ...props
}) => {
    // Check if field is required
    const isRequired = rules.required || (rules.validate && rules.validate.required);

    return (
        <Controller
            name={name}
            control={control}
            rules={rules}
            render={({ field, fieldState: { error } }) => (
                <Box sx={{ mb: 2 }}>
                    <TextField
                        {...field}
                        {...props}
                        select={select}
                        label={
                            typeof label === 'object' && 'min' in label && 'max' in label
                                ? `Range: ${label.min ?? ''} - ${label.max ?? ''}${isRequired ? ' *' : ''}`
                                : `${label}${isRequired ? ' *' : ''}`
                        }




                        type={type}
                        multiline={multiline}
                        rows={multiline ? rows : 1}
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        error={!!error}
                        helperText={error ? error.message : ''}
                        disabled={disabled}
                        inputProps={{
                            maxLength: charLimit,
                            spellCheck: spellCheck || (type === 'text' && multiline), // Enable spell check for text fields and multiline
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                '&.Mui-error': {
                                    '& fieldset': {
                                        borderColor: 'error.main',
                                        borderWidth: 2,
                                    },
                                },
                            },
                            '& .MuiInputLabel-root.Mui-required': {
                                '&::after': {
                                    content: '" *"',
                                    color: 'error.main',
                                },
                            },
                        }}
                    >
                        {select && options.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </TextField>
                    {charLimit && (
                        <Typography
                            variant="caption"
                            sx={{
                                display: 'block',
                                textAlign: 'right',
                                mt: 1,
                                color:
                                    (field.value?.length || 0) > charLimit * 0.9
                                        ? 'warning.main'
                                        : (field.value?.length || 0) === charLimit
                                            ? 'error.main'
                                            : 'text.secondary',
                            }}
                        >
                            {(field.value?.length || 0)}/{charLimit} characters
                        </Typography>
                    )}



                </Box>
            )}
        />
    );
};

export default InputField;