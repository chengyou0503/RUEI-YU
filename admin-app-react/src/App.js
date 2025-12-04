import React, { useState, useEffect } from 'react';
import { ThemeProvider, Container, Typography, Box, Tabs, Tab, CircularProgress, Alert, Button, useMediaQuery, CssBaseline, AppBar, Toolbar, IconButton } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import theme from './theme';

import RequestCard from './components/RequestCard';
import ReturnCard from './components/ReturnCard';
import LogCard from './components/LogCard';
import EmptyState from './components/EmptyState';

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxGFUXwHPVxKZ5WM25RVUeofrhPChP4_UI0hqM4uDB6t458wa9oPEozPf-R8Cah5oP2tA/exec';

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
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [requests, setRequests] = useState([]);
  const [returns, setReturns] = useState([]);
  const [logs, setLogs] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchData = async (action, isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setIsRefreshing(true);
    setError(null);
    try {
      const data = await postRequest('getData', { sub_action: action }, true);
      if (data.status === 'error') throw new Error(data.message);
      if (action === 'getRequests') setRequests(data);
      if (action === 'getReturns') setReturns(data);
      if (action === 'getWorkLogs') setLogs(data);
    } catch (e) {
      setError(`載入資料失敗: ${e.message}`);
    } finally {
      if (!isBackground) setLoading(false);
      else setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const actions = ['getRequests', 'getReturns', 'getWorkLogs'];
    const currentAction = actions[tabValue];
    if (currentAction) {
      fetchData(currentAction, false);
      const intervalId = setInterval(() => fetchData(currentAction, true), 15000);
      return () => clearInterval(intervalId);
    }
  }, [tabValue]);

  const handleTabChange = (event, newValue) => setTabValue(newValue);
  const handleRefresh = () => {
    const actions = ['getRequests', 'getReturns', 'getWorkLogs'];
    fetchData(actions[tabValue], false);
  };

  const postRequest = async (action, payload, isGetData = false) => {
    if (!isGetData) setIsRefreshing(true);
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
      return await response.json();
    } catch (e) {
      setError(`請求失敗: ${e.message}`);
      return { status: 'error', message: e.message };
    } finally {
      if (!isGetData) setIsRefreshing(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    setRequests(prev => prev.map(r => r.id === orderId ? { ...r, items: r.items.map(i => ({ ...i, status: newStatus })) } : r));
    try {
      const result = await postRequest('updateStatus', { id: orderId, newStatus });
      if (result.status !== 'success') fetchData('getRequests', true);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateItemStatus = async (payload) => {
    const uniqueId = `${payload.orderId}-${payload.itemName}-${payload.thickness}-${payload.size}`;
    setUpdatingId(uniqueId);
    setRequests(prev => prev.map(r => r.id === payload.orderId ? { ...r, items: r.items.map(i => i.subcategory === payload.itemName && i.thickness === payload.thickness && i.size === payload.size ? { ...i, status: payload.newStatus } : i) } : r));
    try {
      const result = await postRequest('updateItemStatus', payload);
      if (result.status !== 'success') fetchData('getRequests', true);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateReturnStatus = async (returnId, newStatus) => {
    setUpdatingId(`return-${returnId}`);
    setReturns(prev => prev.map(r => r.id === returnId ? { ...r, items: r.items.map(i => ({ ...i, status: newStatus })) } : r));
    try {
      const result = await postRequest('updateReturnStatus', { id: returnId, newStatus });
      if (result.status !== 'success') fetchData('getReturns', true);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateReturnItemStatus = async (payload) => {
    const uniqueId = `return-${payload.returnId}-${payload.itemName}`;
    setUpdatingId(uniqueId);
    setReturns(prev => prev.map(r => r.id === payload.returnId ? { ...r, items: r.items.map(i => i.name === payload.itemName ? { ...i, status: payload.newStatus } : i) } : r));
    try {
      const result = await postRequest('updateReturnItemStatus', payload);
      if (result.status !== 'success') fetchData('getReturns', true);
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingRequests = requests.filter(req => req.items && req.items.some(item => item.status.trim() !== '完成'));
  const pendingReturns = returns.filter(ret => ret.items && ret.items.some(item => item.status.trim() !== '完成'));

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="sticky">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            瑞宇水電 - 管理後台
          </Typography>
          <IconButton color="inherit" onClick={handleRefresh} disabled={loading || isRefreshing}>
            {loading || isRefreshing ? <CircularProgress size={24} color="inherit" /> : <RefreshIcon />}
          </IconButton>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="admin tabs" centered>
            <Tab label={`請購單管理 (${pendingRequests.length})`} />
            <Tab label={`退貨單管理 (${pendingReturns.length})`} />
            <Tab label="工作日誌" />
          </Tabs>
        </Box>

        {error && <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>{error}</Alert>}

        <TabPanel value={tabValue} index={0}>
          {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
            : pendingRequests.length > 0 ? pendingRequests.map(req => (
              <RequestCard key={req.id} request={req} onUpdateStatus={handleUpdateStatus} onUpdateItemStatus={handleUpdateItemStatus} updatingId={updatingId} />
            )) : <EmptyState message="目前沒有待處理的請購單" />}
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
            : pendingReturns.length > 0 ? pendingReturns.map(ret => (
              <ReturnCard key={ret.id} ret={ret} onUpdateStatus={handleUpdateReturnStatus} onUpdateItemStatus={handleUpdateReturnItemStatus} updatingId={updatingId} />
            )) : <EmptyState message="目前沒有待處理的退貨單" />}
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
            : logs.length > 0 ? logs.map(log => <LogCard key={log.id} log={log} />)
              : <EmptyState message="目前沒有工作日誌" />}
        </TabPanel>
      </Container>
    </ThemeProvider>
  );
}

export default App;