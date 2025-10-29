import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const ReturnSuccessPage = ({ onBackToMenu }) => {
  return (
    <Box sx={{ textAlign: 'center', py: { xs: 3, sm: 5 } }}>
      <CheckCircleOutlineIcon color="success" sx={{ fontSize: 80, mb: 2 }} />
      <Typography variant="h4" component="h2" gutterBottom sx={{ typography: { xs: 'h5', sm: 'h4' } }}>
        退貨申請已送出！
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        後續處理進度將會更新於管理後台。
      </Typography>
      <Button
        variant="contained"
        size="large"
        startIcon={<ArrowBackIcon />}
        onClick={onBackToMenu}
      >
        返回主選單
      </Button>
    </Box>
  );
};

export default ReturnSuccessPage;