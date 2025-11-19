import React from 'react';
import { Card, CardContent, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, CircularProgress, Select, MenuItem } from '@mui/material';

function RequestCard({ request, onUpdateStatus, onUpdateItemStatus, updatingId }) {
  const isAllCompleted = request.items.every(item => item.status.trim() === '完成');

  const handleAllComplete = () => {
    onUpdateStatus(request.id, '完成');
  };

  const handleItemStatusChange = (e, item) => {
    const newStatus = e.target.value;
    if (newStatus === '完成') {
      onUpdateItemStatus({
        orderId: request.id,
        itemName: item.subcategory,
        thickness: item.thickness,
        size: item.size,
        newStatus: '完成'
      });
    }
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
                    <TableCell>
                      {item.status.trim() === '完成' ? (
                        <Typography variant="body2" sx={{ color: 'success.main' }}>完成</Typography>
                      ) : (
                        <Select
                          value={item.status}
                          onChange={(e) => handleItemStatusChange(e, item)}
                          disabled={isUpdating}
                          size="small"
                          sx={{ minWidth: 120 }}
                        >
                          <MenuItem value="待處理">
                            {isUpdating ? <CircularProgress size={20} /> : '待處理'}
                          </MenuItem>
                          <MenuItem value="完成">完成</MenuItem>
                        </Select>
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
