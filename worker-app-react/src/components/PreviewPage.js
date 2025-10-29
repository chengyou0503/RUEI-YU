import React from 'react';
import { Box, Typography, Button, List, ListItem, ListItemText, Divider, Grid, CircularProgress, Paper } from '@mui/material';

const InfoItem = ({ primary, secondary }) => (
  <Grid item xs={12} sm={6}>
    <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
      <Typography variant="subtitle2" color="text.secondary">{primary}</Typography>
      <Typography variant="body1" fontWeight="500">{secondary || '未填寫'}</Typography>
    </Paper>
  </Grid>
);

const PreviewPage = ({ formData, navigateTo, onSubmit, isSubmitting }) => {
  const { user, project, deliveryAddress, deliveryDate, userPhone, recipientName, recipientPhone, cart } = formData;

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom align="center">預覽與確認</Typography>
      
      <Grid container spacing={2} sx={{ mt: 3 }}>
        <InfoItem primary="請購人員" secondary={user} />
        <InfoItem primary="專案名稱" secondary={project} />
        <InfoItem primary="送貨地點" secondary={deliveryAddress} />
        <InfoItem primary="送貨日期" secondary={deliveryDate} />
        <InfoItem primary="申請人電話" secondary={userPhone} />
        <InfoItem primary="收件人姓名" secondary={recipientName} />
        <InfoItem primary="收件人電話" secondary={recipientPhone} />
      </Grid>

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

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 5 }}>
        <Button variant="outlined" onClick={() => navigateTo(3)} disabled={isSubmitting}>
          返回修改
        </Button>
        <Button
          variant="contained"
          color="success"
          size="large"
          onClick={onSubmit}
          disabled={isSubmitting || cart.length === 0}
          startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isSubmitting ? '傳送中...' : '確認送出'}
        </Button>
      </Box>
    </Box>
  );
};

export default PreviewPage;
