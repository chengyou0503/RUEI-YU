import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Tabs, Tab, CircularProgress, Alert, Button, useMediaQuery, useTheme } from '@mui/material';

import RequestCard from './components/RequestCard';
import ReturnCard from '././components/ReturnCard';
import LogCard from './components/LogCard';

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw1XrVzPbvsm4beL_rGG3hk3QGjN-8lYDzfXBu1NRwnsPXb2UyrtRtsknEN3roIuqFiAA/exec';

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [requests, setRequests] = useState([]);
  const [returns, setReturns] = useState([]);
  const [logs, setLogs] = useState([]);
  const [updatingId, setUpdatingId] = useState(null); // 新增：追蹤正在更新的項目 ID

  const fetchData = async (action, isBackground = false) => {
    if (!isBackground) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);
    try {
      const data = await postRequest('getData', { sub_action: action }, true);
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
      if (!isBackground) {
        setLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    const actions = ['getRequests', 'getReturns', 'getWorkLogs'];
    const currentAction = actions[tabValue];

    if (currentAction) {
      fetchData(currentAction, false);
      const intervalId = setInterval(() => {
        fetchData(currentAction, true);
      }, 15000); 

      return () => clearInterval(intervalId);
    }
  }, [tabValue]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleRefresh = () => {
    const actions = ['getRequests', 'getReturns', 'getWorkLogs'];
    fetchData(actions[tabValue], false);
  }

  const postRequest = async (action, payload, isGetData = false) => {
    if (!isGetData) {
      setIsRefreshing(true);
    }
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
      
      const result = await response.json();
      return result;

    } catch (e) {
      // console.error(`[postRequest Error] Action: ${action}, Payload:`, payload, "Error:", e);
      setError(`請求失敗: ${e.message}`);
      return { status: 'error', message: e.message };
    } finally {
      if (!isGetData) {
        setIsRefreshing(false);
      }
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    
    // Optimistic Update
    setRequests(prevRequests => prevRequests.map(req => 
      req.id === orderId 
        ? { ...req, items: req.items.map(item => ({ ...item, status: newStatus })) } 
        : req
    ));

    try {
      const result = await postRequest('updateStatus', { id: orderId, newStatus });
      if (result.status !== 'success') {
        fetchData('getRequests', true); // 如果失敗，則重新同步
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateItemStatus = async (payload) => {
    const uniqueId = `${payload.orderId}-${payload.itemName}-${payload.thickness}-${payload.size}`;
    setUpdatingId(uniqueId);

    // Optimistic Update
    setRequests(prevRequests => prevRequests.map(req => 
      req.id === payload.orderId 
        ? { ...req, items: req.items.map(item => 
            item.subcategory === payload.itemName && item.thickness === payload.thickness && item.size === payload.size
              ? { ...item, status: payload.newStatus } 
              : item
          )} 
        : req
    ));

    try {
      const result = await postRequest('updateItemStatus', payload);
      if (result.status !== 'success') {
        fetchData('getRequests', true); // 如果失敗，則重新同步
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateReturnStatus = async (returnId, newStatus) => {
    setUpdatingId(`return-${returnId}`);

    // Optimistic Update
    setReturns(prevReturns => prevReturns.map(ret => 
      ret.id === returnId 
        ? { ...ret, items: ret.items.map(item => ({ ...item, status: newStatus })) } 
        : ret
    ));

    try {
      const result = await postRequest('updateReturnStatus', { id: returnId, newStatus });
      if (result.status !== 'success') {
        fetchData('getReturns', true);
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateReturnItemStatus = async (payload) => {
    const uniqueId = `return-${payload.returnId}-${payload.itemName}`;
    setUpdatingId(uniqueId);

    // Optimistic Update
    setReturns(prevReturns => prevReturns.map(ret => 
      ret.id === payload.returnId 
        ? { ...ret, items: ret.items.map(item => 
            item.name === payload.itemName
              ? { ...item, status: payload.newStatus } 
              : item
          )} 
        : ret
    ));

    try {
      const result = await postRequest('updateReturnItemStatus', payload);
      if (result.status !== 'success') {
        fetchData('getReturns', true);
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingRequests = requests.filter(req => req.items && req.items.some(item => item.status.trim() !== '完成'));
  const pendingReturns = returns.filter(ret => ret.items && ret.items.some(item => item.status.trim() !== '完成'));

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 2, md: 4 } }}>
        <Typography variant={isSmallScreen ? 'h5' : 'h4'} component="h1">
          管理後台
        </Typography>
        <Button variant="contained" onClick={handleRefresh} disabled={loading || isRefreshing}>
          {(loading || isRefreshing) ? <CircularProgress size={24} /> : '刷新'}
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
        ) : pendingRequests.length > 0 ? (
          pendingRequests.map(req => (
            <RequestCard 
              key={req.id} 
              request={req} 
              onUpdateStatus={handleUpdateStatus}
              onUpdateItemStatus={handleUpdateItemStatus}
              updatingId={updatingId} // 傳遞 updatingId
            />
          ))
        ) : (
          <Typography>目前沒有待處理的請購單。</Typography>
        )}
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        {loading ? (
          <CircularProgress />
        ) : pendingReturns.length > 0 ? (
          pendingReturns.map(ret => 
            <ReturnCard 
              key={ret.id} 
              ret={ret} 
              onUpdateStatus={handleUpdateReturnStatus}
              onUpdateItemStatus={handleUpdateReturnItemStatus}
              updatingId={updatingId} // 傳遞 updatingId
            />
          )
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
