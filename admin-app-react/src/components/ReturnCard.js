import React from 'react';
import { Card, CardContent, Typography, Box, Table, TableBody, TableCell, TableHead, TableRow, Select, MenuItem } from '@mui/material';

const ReturnCard = ({ ret }) => {
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="div">
            <Box component="span" sx={{ fontWeight: 'bold', color: 'primary.main' }}>#{ret.id}</Box> - {ret.project}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          申請人: {ret.user} | 時間: {ret.timestamp}
        </Typography>

        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>品項狀態管理</Typography>
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
                    size="small"
                    sx={{ 
                      backgroundColor: item.status === '完成' ? '#e8f5e9' : 'inherit',
                      color: item.status === '完成' ? '#2e7d32' : 'inherit'
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
      </CardContent>
    </Card>
  );
};

export default ReturnCard;
