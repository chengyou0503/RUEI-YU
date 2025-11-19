import React from 'react';
import { Card, CardContent, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, CircularProgress } from '@mui/material';

function RequestCard({ request, onUpdateStatus, onUpdateItemStatus, updatingId }) {
  const isAllCompleted = request.items.every(item => item.status.trim() === '完成');

  const handleAllComplete = () => {
    onUpdateStatus(request.id, '完成');
  };

  const handleItemComplete = (item) => {
    onUpdateItemStatus({
      orderId: request.id,
      itemName: item.subcategory,
      thickness: item.thickness,
      size: item.size,
      newStatus: '完成'
    });
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Typography variant="h6">單號: {request.id}</Typography>
            <Typography color="textSecondary">申請人: {request.user} ({request.userPhone})</Typography>
            <Typography color="textSecondary">專案: {request.project} - {request.term}期 - {request.engineeringItem}</Typography>
            <Typography color="textSecondary">送貨地點: {request.deliveryAddress}</Typography>
            <Typography color="textSecondary">送貨日期: {request.deliveryDate}</Typography>
            <Typography color="textSecondary">收件人: {request.recipientName} ({request.recipientPhone})</Typography>
          </div>
          {!isAllCompleted && (
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleAllComplete}
              disabled={updatingId === request.id}
              sx={{ minWidth: '100px' }}
            >
              {updatingId === request.id ? <CircularProgress size={24} color="inherit" /> : '全部完成'}
            </Button>
          )}
        </Box>
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>品項</TableCell>
                <TableCell>厚度</TableCell>
                <TableCell>尺寸</TableCell>
                <TableCell align="right">數量</TableCell>
                <TableCell>單位</TableCell>
                <TableCell>狀態</TableCell>
                <TableCell>動作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {request.items.map((item, index) => {
                const uniqueItemId = `${request.id}-${item.subcategory}-${item.thickness}-${item.size}`;
                const isUpdating = updatingId === uniqueItemId;
                return (
                  <TableRow key={index}>
                    <TableCell>{item.category} - {item.subcategory}</TableCell>
                    <TableCell>{item.thickness}</TableCell>
                    <TableCell>{item.size}</TableCell>
                    <TableCell align="right">{item.quantity}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>{item.status}</TableCell>
                    <TableCell>
                      {item.status.trim() !== '完成' && (
                        <Button 
                          variant="outlined" 
                          size="small" 
                          onClick={() => handleItemComplete(item)}
                          disabled={isUpdating}
                          sx={{ minWidth: '60px' }}
                        >
                          {isUpdating ? <CircularProgress size={20} color="inherit" /> : '完成'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}

export default RequestCard;
