import React from 'react';
import { Box, Typography, Button, Grid, Card, CardActionArea, CardContent } from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import ReplayIcon from '@mui/icons-material/Replay';
import EditNoteIcon from '@mui/icons-material/EditNote';
import LogoutIcon from '@mui/icons-material/Logout';

const MainMenu = ({ formData, navigateTo }) => {
  const menuItems = [
    { title: '工地請料', icon: <AddShoppingCartIcon sx={{ fontSize: 40 }} color="primary" />, step: 2, disabled: false },
    { title: '退貨申請', icon: <ReplayIcon sx={{ fontSize: 40 }} color="secondary" />, step: 10, disabled: false },
    { title: '工作日誌', icon: <EditNoteIcon sx={{ fontSize: 40 }} color="disabled" />, step: -1, disabled: true },
  ];

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="h5" component="h2" gutterBottom>主選單</Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        歡迎，<Box component="span" fontWeight="bold" color="primary.main">{formData.user}</Box>！請選擇您要執行的作業。
      </Typography>
      <Grid container spacing={3}>
        {menuItems.map((item) => (
          <Grid item xs={12} sm={4} key={item.title}>
            <Card sx={{ height: '100%' }}>
              <CardActionArea
                onClick={() => navigateTo(item.step)}
                disabled={item.disabled}
                sx={{
                  display: 'flex', flexDirection: 'column',
                  justifyContent: 'center', p: 3, height: '100%'
                }}
              >
                {item.icon}
                <CardContent>
                  <Typography variant="h6" component="div">{item.title}</Typography>
                  {item.disabled && <Typography variant="caption" color="text.secondary">(開發中)</Typography>}
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Button
        variant="text"
        startIcon={<LogoutIcon />}
        onClick={() => navigateTo(0)}
        sx={{ mt: 5 }}
      >
        登出
      </Button>
    </Box>
  );
};

export default MainMenu;