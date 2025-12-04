import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Button, Grid, Stack, CircularProgress, Alert } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const WorkLogHistoryPage = ({ user, navigateTo, postRequest, onEdit }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await postRequest('getData', { sub_action: 'getWorkLogs' });
        if (response.status === 'error') throw new Error(response.message);
        // Filter logs by current user
        const userLogs = response.filter(log => log.user === user);
        setLogs(userLogs);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [user, postRequest]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ mt: 4 }}><Alert severity="error">載入失敗: {error}</Alert><Button onClick={() => navigateTo(1)} sx={{ mt: 2 }}>返回主選單</Button></Box>;

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigateTo(1)}>
          主選單
        </Button>
        <Typography variant="h5" component="h2" sx={{ flexGrow: 1, textAlign: 'center', mr: 10 }}>
          我的工作日誌
        </Typography>
      </Stack>

      <Grid container spacing={2}>
        {logs.length === 0 ? (
          <Grid item xs={12}><Typography align="center" color="text.secondary" sx={{ mt: 4 }}>尚無日誌記錄</Typography></Grid>
        ) : (
          logs.map((log) => (
            <Grid item xs={12} key={log.id}>
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{ flexGrow: 1, mr: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold" color="primary">
                        {log.date} | {log.project}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {log.term} {log.engineeringItem} ({log.timeSlot})
                      </Typography>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>
                        {log.content}
                      </Typography>
                      {log.photoUrls && log.photoUrls.length > 0 && (
                         <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                           已上傳 {log.photoUrls.length} 張照片
                         </Typography>
                      )}
                    </Box>
                    <Button 
                      startIcon={<EditIcon />} 
                      variant="outlined" 
                      size="small" 
                      onClick={() => onEdit(log)}
                    >
                      編輯
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
};

export default WorkLogHistoryPage;
