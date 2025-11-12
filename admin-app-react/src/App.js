import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Tabs, Tab, CircularProgress, Alert, Button, useMediaQuery, useTheme } from '@mui/material';

import RequestCard from './components/RequestCard';
import ReturnCard from '././components/ReturnCard';
import LogCard from './components/LogCard';

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxa8j7ReaTTpHxaVU1ze2Fuz1-8ylDVeasWDaY4rXF06FTpoWRHhpE5OzqTjwQbUexNsA/exec';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function App() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [requests, setRequests] = useState([]);
  const [returns, setReturns] = useState([]);
  const [logs, setLogs] = useState([]);

  const fetchData = async (action) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${APPS_SCRIPT_URL}?action=${action}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.status === 'error') throw new Error(data.message);
      
      switch(action) {
        case 'getRequests':
          setRequests(data);
          break;
        case 'getReturns':
          setReturns(data);
          break;
        case 'getWorkLogs':
          setLogs(data);
          break;
        default:
          break;
      }
    } catch (e) {
      setError(`載入資料失敗: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tabValue === 0) fetchData('getRequests');
    if (tabValue === 1) fetchData('getReturns');
    if (tabValue === 2) fetchData('getWorkLogs');
  }, [tabValue]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleRefresh = () => {
    if (tabValue === 0) fetchData('getRequests');
    if (tabValue === 1) fetchData('getReturns');
    if (tabValue === 2) fetchData('getWorkLogs');
  }

  const postRequest = async (action, payload) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new URLSearchParams();
      formData.append('action', action);
      formData.append('payload', JSON.stringify(payload));

      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      return { status: 'success' };
    } catch (e) {
      setError(`更新失敗: ${e.message}`);
      return { status: 'error' };
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    const result = await postRequest('updateStatus', { id: orderId, newStatus });
    if (result.status === 'success') {
      handleRefresh();
    }
  };

  const handleUpdateItemStatus = async (payload) => {
    const result = await postRequest('updateItemStatus', payload);
    if (result.status === 'success') {
      handleRefresh();
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 2, md: 4 } }}>
        <Typography variant={isSmallScreen ? 'h5' : 'h4'} component="h1">
          管理後台
        </Typography>
        <Button variant="contained" onClick={handleRefresh} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : '刷新'}
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="admin tabs">
          <Tab label="請購單管理" />
          <Tab label="退貨單管理" />
          <Tab label="工作日誌" />
        </Tabs>
      </Box>

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

      <TabPanel value={tabValue} index={0}>
        {loading ? (
          <CircularProgress />
        ) : requests.length > 0 ? (
          requests.map(req => (
            <RequestCard 
              key={req.id} 
              request={req} 
              onUpdateStatus={handleUpdateStatus}
              onUpdateItemStatus={handleUpdateItemStatus}
            />
          ))
        ) : (
          <Typography>目前沒有待處理的請購單。</Typography>
        )}
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        {loading ? (
          <CircularProgress />
        ) : returns.length > 0 ? (
          returns.map(ret => <ReturnCard key={ret.id} ret={ret} />)
        ) : (
          <Typography>目前沒有待處理的退貨單。</Typography>
        )}
      </TabPanel>
      <TabPanel value={tabValue} index={2}>
        {loading ? (
          <CircularProgress />
        ) : logs.length > 0 ? (
          logs.map(log => <LogCard key={log.id} log={log} />)
        ) : (
          <Typography>目前沒有工作日誌。</Typography>
        )}
      </TabPanel>
    </Container>
  );
}

export default App;