import React from 'react';
import { Card, CardContent, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, CircularProgress } from '@mui/material';

function ReturnCard({ ret, onUpdateStatus, onUpdateItemStatus, updatingId }) {
  const isAllCompleted = ret.items.every(item => item.status.trim() === '完成');

  const handleAllComplete = () => {
    onUpdateStatus(ret.id, '完成');
  };

  const handleItemComplete = (item) => {
    onUpdateItemStatus({
      returnId: ret.id,
      itemName: item.name,
      newStatus: '完成'
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
                <TableCell>品項</TableCell>
                <TableCell align="right">數量</TableCell>
                <TableCell>退貨原因</TableCell>
                <TableCell>狀態</TableCell>
                <TableCell>動作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ret.items.map((item, index) => {
                const uniqueItemId = `return-${ret.id}-${item.name}`;
                const isUpdating = updatingId === uniqueItemId;
                return (
                  <TableRow key={index}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell align="right">{item.quantity}</TableCell>
                    <TableCell>{item.reason}</TableCell>
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

export default ReturnCard;