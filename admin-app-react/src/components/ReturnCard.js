import React, { useState } from 'react';
import { Card, CardContent, Typography, Box, Table, TableBody, TableCell, TableHead, TableRow, Select, MenuItem, Button, CircularProgress } from '@mui/material';

const ReturnCard = ({ ret, onUpdateStatus, onUpdateItemStatus }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleItemStatusChange = (e, item) => {
    const newStatus = e.target.value;
    onUpdateItemStatus({
      returnId: ret.id,
      itemName: item.name,
      newStatus: newStatus,
    });
  };

  const handleUpdateAll = async () => {
    setIsUpdating(true);
    try {
      await onUpdateStatus(ret.id, '完成');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="div">
            <Box component="span" sx={{ fontWeight: 'bold', color: 'primary.main' }}>#{ret.id}</Box> - {ret.project}
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
          申請人: {ret.user} | 時間: {ret.timestamp}
        </Typography>

        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>品項狀態管理</Typography>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>品項名稱</TableCell>
                <TableCell>數量</TableCell>
                <TableCell>原因</TableCell>
                <TableCell>狀態</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ret.items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.reason || '無'}</TableCell>
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

export default ReturnCard;
