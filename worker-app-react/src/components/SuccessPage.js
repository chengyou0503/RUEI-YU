import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AddIcon from '@mui/icons-material/Add';

const SuccessPage = ({ onNewRequest, title = "操作成功！", buttonText = "完成" }) => {
  return (
    <Box sx={{ textAlign: 'center', py: { xs: 3, sm: 5 } }}>
      <CheckCircleOutlineIcon color="success" sx={{ fontSize: 80, mb: 2 }} />
      <Typography variant="h4" component="h2" gutterBottom sx={{ typography: { xs: 'h5', sm: 'h4' } }}>
        {title}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        後續處理進度將會更新於管理後台。
      </Typography>
      <Button
        variant="contained"
        size="large"
        startIcon={<AddIcon />}
        onClick={onNewRequest}
      >
        {buttonText}
      </Button>
    </Box>
  );
};

export default SuccessPage;