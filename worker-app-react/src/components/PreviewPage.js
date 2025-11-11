import React from 'react';
import { Box, Typography, Button, List, ListItem, ListItemText, Divider, Grid, CircularProgress, Paper, Stack } from '@mui/material';

const InfoListItem = ({ primary, secondary }) => (
  <>
    <ListItem>
      <ListItemText primary={primary} secondary={secondary || '未填寫'} />
    </ListItem>
    <Divider component="li" />
  </>
);

const PreviewPage = ({ formData, navigateTo, onSubmit, isSubmitting }) => {
  const { user, project, deliveryAddress, deliveryDate, userPhone, recipientName, recipientPhone, cart } = formData;

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom align="center">預覽與確認</Typography>
      
      <Paper variant="outlined" sx={{ mt: 3 }}>
        <List disablePadding>
          <InfoListItem primary="請購人員" secondary={user} />
          <InfoListItem primary="專案名稱" secondary={project} />
          <InfoListItem primary="送貨地點" secondary={deliveryAddress} />
          <InfoListItem primary="送貨日期" secondary={deliveryDate} />
          <InfoListItem primary="申請人電話" secondary={userPhone} />
          <InfoListItem primary="收件人姓名" secondary={recipientName} />
          <InfoListItem primary="收件人電話" secondary={recipientPhone} />
        </List>
      </Paper>

      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>請購品項</Typography>
      <Paper variant="outlined" sx={{ maxHeight: '30vh', overflowY: 'auto' }}>
        <List dense>
          {cart.length > 0 ? cart.map((item, index) => (
            <React.Fragment key={item.id}>
              <ListItem>
                <ListItemText
                  primary={`${item.subcategory} - ${item.size}`}
                  secondary={`分類: ${item.category}, 厚度: ${item.thickness}`}
                />
                <Typography variant="body1" fontWeight="500">{item.quantity} {item.unit}</Typography>
              </ListItem>
              {index < cart.length - 1 && <Divider />}
            </React.Fragment>
          )) : (
            <ListItem>
              <ListItemText primary="購物車是空的" sx={{ textAlign: 'center', color: 'text.secondary' }} />
            </ListItem>
          )}
        </List>
      </Paper>

      <Stack 
        direction={{ xs: 'column-reverse', sm: 'row' }} 
        spacing={2} 
        justifyContent="space-between" 
        sx={{ mt: 5 }}
      >
        <Button 
          variant="outlined" 
          onClick={() => navigateTo(3)} 
          disabled={isSubmitting}
          fullWidth={{ xs: true, sm: false }}
        >
          返回修改
        </Button>
        <Button
          variant="contained"
          color="success"
          size="large"
          onClick={onSubmit}
          disabled={isSubmitting || cart.length === 0}
          startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
          fullWidth={{ xs: true, sm: false }}
        >
          {isSubmitting ? '傳送中...' : '確認送出'}
        </Button>
      </Stack>
    </Box>
  );
};

export default PreviewPage;
