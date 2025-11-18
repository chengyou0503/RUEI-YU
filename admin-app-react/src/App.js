import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Tabs, Tab, CircularProgress, Alert, Button, useMediaQuery, useTheme } from '@mui/material';

import RequestCard from './components/RequestCard';
import ReturnCard from '././components/ReturnCard';
import LogCard from './components/LogCard';

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby5M6AjMBJJ2A0BRnp4CwFUKly55KaNBDnNE_LFjSQey79TsG0Bd8i_U7swrNEHsiNbgQ/exec';

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
  const [isRefreshing, setIsRefreshing] = useState(false); // 新增：背景刷新狀態
  const [error, setError] = useState(null);
  const [requests, setRequests] = useState([]);
  const [returns, setReturns] = useState([]);
  const [logs, setLogs] = useState([]);

  // 新增：禁用右鍵選單的副作用
  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextMenu);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  const fetchData = async (action, isBackground = false) => {
    if (!isBackground) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);
    try {
      // **重構：使用 postRequest 來獲取資料**
      const data = await postRequest('getData', { sub_action: action }, true); // 新增一個參數來抑制 loading 狀態

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
      fetchData(currentAction, false); // 立即獲取一次資料 (非背景)
      const intervalId = setInterval(() => {
        fetchData(currentAction, true); // 每 15 秒輪詢一次 (背景)
      }, 15000); 

      return () => clearInterval(intervalId); // 清除計時器
    }
  }, [tabValue]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleRefresh = () => {
    const actions = ['getRequests', 'getReturns', 'getWorkLogs'];
    fetchData(actions[tabValue], false); // 手動刷新視為非背景
  }

  const postRequest = async (action, payload, isGetData = false) => {
    if (!isGetData) { // 如果不是獲取資料的請求，才設定 refreshing 狀態
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
      
      // **修改：讓 postRequest 能夠回傳 JSON 資料**
      const result = await response.json();
      return result;

    } catch (e) {
      setError(`請求失敗: ${e.message}`);
      return { status: 'error', message: e.message };
    } finally {
      if (!isGetData) {
        setIsRefreshing(false);
      }
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    const result = await postRequest('updateStatus', { id: orderId, newStatus });
    if (result.status === 'success') {
      // 直接更新 state，避免重新載入
      setRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === orderId 
            ? { ...req, items: req.items.map(item => ({ ...item, status: newStatus })) }
            : req
        )
      );
    }
  };

  const handleUpdateItemStatus = async (payload) => {
    const result = await postRequest('updateItemStatus', payload);
    if (result.status === 'success') {
      // 直接更新 state
      setRequests(prevRequests =>
        prevRequests.map(req =>
          req.id === payload.orderId
            ? {
                ...req,
                items: req.items.map(item =>
                  item.subcategory === payload.itemName &&
                  item.thickness === payload.thickness &&
                  item.size === payload.size
                    ? { ...item, status: payload.newStatus }
                    : item
                ),
              }
            : req
        )
      );
    }
  };

  const handleUpdateReturnStatus = async (returnId, newStatus) => {
    const result = await postRequest('updateReturnStatus', { id: returnId, newStatus });
    if (result.status === 'success') {
      setReturns(prev => 
        prev.map(r => 
          r.id === returnId 
            ? { ...r, items: r.items.map(item => ({ ...item, status: newStatus })) }
            : r
        )
      );
    }
  };

  const handleUpdateReturnItemStatus = async (payload) => {
    const result = await postRequest('updateReturnItemStatus', payload);
    if (result.status === 'success') {
      setReturns(prev =>
        prev.map(r =>
          r.id === payload.returnId
            ? {
                ...r,
                items: r.items.map(item =>
                  item.name === payload.itemName
                    ? { ...item, status: payload.newStatus }
                    : item
                ),
              }
            : r
        )
      );
    }
  };

  const pendingRequests = requests.filter(req => req.items && req.items.some(item => item.status !== '完成'));
  const pendingReturns = returns.filter(ret => ret.items && ret.items.some(item => item.status !== '完成'));

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