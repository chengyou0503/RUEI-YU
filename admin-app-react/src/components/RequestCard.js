import React, { useState } from 'react';
import { Card, CardContent, Typography, Box, Table, TableBody, TableCell, TableHead, TableRow, Select, MenuItem, Button, CircularProgress } from '@mui/material';

const RequestCard = ({ request, onUpdateStatus, onUpdateItemStatus }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleItemStatusChange = (e, item) => {
    const newStatus = e.target.value;
    onUpdateItemStatus({
      orderId: request.id,
      itemName: item.subcategory,
      thickness: item.thickness,
      size: item.size,
      newStatus: newStatus,
    });
  };

  const handleUpdateAll = async () => {
    setIsUpdating(true);
    try {
      await onUpdateStatus(request.id, '完成');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="div">
            <Box component="span" sx={{ fontWeight: 'bold', color: 'primary.main' }}>#{request.id}</Box> - {request.project}
          </Typography>
          <Button 
            variant="contained" 
            size="small"
            onClick={handleUpdateAll}
            disabled={isUpdating}
            startIcon={isUpdating ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {isUpdating ? '更新中...' : '全部完成'}
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          申請人: {request.user} ({request.userPhone}) | 時間: {request.timestamp}
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>運送資訊</Typography>
          <Typography variant="body2">地點: {request.deliveryAddress}</Typography>
          <Typography variant="body2">日期: {request.deliveryDate}</Typography>
          <Typography variant="body2">收件人: {request.recipientName} ({request.recipientPhone})</Typography>
        </Box>

        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>品項狀態管理</Typography>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>大分類</TableCell>
                <TableCell>小分類</TableCell>
                <TableCell>厚度</TableCell>
                <TableCell>尺寸</TableCell>
                <TableCell>數量</TableCell>
                <TableCell>狀態</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {request.items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.subcategory}</TableCell>
                  <TableCell>{item.thickness}</TableCell>
                  <TableCell>{item.size}</TableCell>
                  <TableCell>{item.quantity} {item.unit}</TableCell>
                  <TableCell>
                    <Select
                      value={item.status}
                      onChange={(e) => handleItemStatusChange(e, item)}
                      size="small"
                      sx={{ 
                        backgroundColor: item.status.trim() === '完成' ? '#e8f5e9' : 'inherit',
                        color: item.status.trim() === '完成' ? '#2e7d32' : 'inherit'
                      }}
                    >
                      <MenuItem value="待處理">待處理</MenuItem>
                      <MenuItem value="完成">完成</MenuItem>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </CardContent>
    </Card>
  );
};

export default RequestCard;
