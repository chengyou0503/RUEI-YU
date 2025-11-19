import React from 'react';
import { Card, CardContent, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, CircularProgress, Select, MenuItem } from '@mui/material';

function ReturnCard({ ret, onUpdateStatus, onUpdateItemStatus, updatingId }) {
  const isAllCompleted = ret.items.every(item => item.status.trim() === '完成');

  const handleAllComplete = () => {
    onUpdateStatus(ret.id, '完成');
  };

  const handleItemStatusChange = (e, item) => {
    const newStatus = e.target.value;
    onUpdateItemStatus({
      returnId: ret.id,
      itemName: item.name,
      newStatus: newStatus
    });
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Typography variant="h6">退貨單號: {ret.id}</Typography>
            <Typography color="textSecondary">申請人: {ret.user}</Typography>
            <Typography color="textSecondary">專案: {ret.project}</Typography>
          </div>
          {!isAllCompleted && (
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleAllComplete}
              disabled={updatingId === `return-${ret.id}`}
              sx={{ minWidth: '100px' }}
            >
              {updatingId === `return-${ret.id}` ? <CircularProgress size={24} color="inherit" /> : '全部完成'}
            </Button>
          )}
        </Box>
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell align="center">品項</TableCell>
                <TableCell align="center">數量</TableCell>
                <TableCell align="center">退貨原因</TableCell>
                <TableCell align="center">狀態</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ret.items.map((item, index) => {
                const uniqueItemId = `return-${ret.id}-${item.name}`;
                const isUpdating = updatingId === uniqueItemId;
                return (
                  <TableRow key={index}>
                    <TableCell align="center">{item.name}</TableCell>
                    <TableCell align="center">{item.quantity}</TableCell>
                    <TableCell align="center">{item.reason}</TableCell>
                    <TableCell align="center">
                      <Select
                        value={item.status}
                        onChange={(e) => handleItemStatusChange(e, item)}
                        disabled={isUpdating}
                        size="small"
                        sx={{ 
                          minWidth: 120,
                          backgroundColor: item.status.trim() === '完成' ? '#e8f5e9' : 'inherit',
                          color: item.status.trim() === '完成' ? '#2e7d32' : 'inherit',
                        }}
                      >
                        <MenuItem value="待處理">
                          {isUpdating ? <CircularProgress size={20} /> : '待處理'}
                        </MenuItem>
                        <MenuItem value="完成">完成</MenuItem>
                      </Select>
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

export default ReturnCard;