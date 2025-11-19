import React from 'react';
import { Box, Typography } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';

const EmptyState = ({ message }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        color: 'text.secondary',
      }}
    >
      <InboxIcon sx={{ fontSize: 64, mb: 2 }} />
      <Typography variant="h6">{message}</Typography>
    </Box>
  );
};

export default EmptyState;
