import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const Loading = ({ text = 'Загрузка...' }) => (
  <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="40vh">
    <CircularProgress size={48} thickness={4} sx={{ mb: 2 }} />
    <Typography variant="h6" color="textSecondary">{text}</Typography>
  </Box>
);

export default Loading;
