import React, { useState } from 'react';
import { Box, Typography, Select, MenuItem, Button, FormControl, InputLabel, Card, CardContent } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';

const LoginPage = ({ users, onLogin }) => {
  const [selectedUser, setSelectedUser] = useState('');

  return (
    <Card elevation={4}>
      <CardContent sx={{ textAlign: 'center', p: { xs: 3, sm: 5 } }}>
        <Typography variant="h5" component="h2" gutterBottom>
          身份驗證
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          請選擇您的姓名以開始作業
        </Typography>
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel id="user-select-label">姓名</InputLabel>
          <Select
            labelId="user-select-label"
            value={selectedUser}
            label="姓名"
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            {users.map((user, index) => (
              <MenuItem key={index} value={user}>{user}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          size="large"
          startIcon={<LoginIcon />}
          onClick={() => selectedUser && onLogin(selectedUser)}
          disabled={!selectedUser}
          sx={{ mt: 3, width: '100%', py: 1.5 }}
        >
          登入
        </Button>
      </CardContent>
    </Card>
  );
};

export default LoginPage;
