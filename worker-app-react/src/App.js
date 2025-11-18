import React, { useState, useEffect, useMemo } from 'react';
import { Container, CircularProgress, Typography, Alert, Paper, Box, Stepper, Step, StepLabel, Fade } from '@mui/material';

// 導入所有頁面元件
import LoginPage from './components/LoginPage';
import MainMenu from './components/MainMenu';
import ProjectInfoPage from './components/ProjectInfoPage';
import ProductSelectionPage from './components/ProductSelectionPage';
import PreviewPage from './components/PreviewPage';
import SuccessPage from './components/SuccessPage';
import ReturnPage from './components/ReturnPage';
import ReturnSuccessPage from './components/ReturnSuccessPage';
import ShoppingCart from './components/ShoppingCart';
import WorkLogPage from './components/WorkLogPage'; // **新增**

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwjd3hFIXq9isS89duKNQszSJP0qDqXDsRnrUeaTF1GkknBjF-foAyW1Iu0k1X4kkQ7Dg/exec";
const requestSteps = ['身份驗證', '主選單', '專案資訊', '選擇品項', '預覽與確認'];
const returnSteps = ['身份驗證', '主選單', '退貨申請'];
const logSteps = ['身份驗證', '主選單', '填寫日誌']; // **新增**

function App() {
  // --- 狀態管理 ---
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // 初始資料
  const [allUsersData, setAllUsersData] = useState([]); // **新增：儲存完整使用者資料**
  const [projects, setProjects] = useState([]);
  const [items, setItems] = useState([]);

  // 表單資料
  const [formData, setFormData] = useState({
    user: '', project: '', deliveryAddress: '', deliveryDate: '',
    userPhone: '', recipientName: '', recipientPhone: '', 
    cart: [],
    returnCart: [],
  });

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
  
  // **優化：從完整資料派生出不重複的申請人列表**
  const users = useMemo(() => {
    if (!allUsersData) return [];
    const applicantNames = allUsersData.map(u => u.applicant).filter(Boolean);
    return [...new Set(applicantNames)];
  }, [allUsersData]);


  // --- 資料載入 ---
  useEffect(() => {
    setLoading(true);
    Promise.all([
      postRequest('getData', { sub_action: 'getUsers' }), 
      postRequest('getData', { sub_action: 'getProjects' }), 
      postRequest('getData', { sub_action: 'getItems' })
    ]).then(([usersData, projectsData, itemsData]) => {
        if (usersData.status === 'error' || projectsData.status === 'error' || itemsData.status === 'error') {
          throw new Error('載入部分初始資料失敗');
        }
        const itemsWithId = itemsData.map((item, index) => ({ ...item, id: `item-${index}` }));
        setAllUsersData(usersData); // **儲存完整資料**
        setProjects(projectsData);
        setItems(itemsWithId);
      }).catch(err => {
        setError('無法載入初始資料，請檢查 Google Apps Script 部署網址或網路連線。');
      }).finally(() => setLoading(false));
  }, []);

  // --- 核心函式 ---
  const navigateTo = (step) => setCurrentStep(step);
  const updateFormData = (data) => setFormData(prev => ({ ...prev, ...data }));
  const updateCart = (cart) => updateFormData({ cart });
  const updateReturnCart = (returnCart) => updateFormData({ returnCart });

  const postRequest = async (action, payload) => {
    const formData = new URLSearchParams();
    formData.append('action', action);
    formData.append('payload', JSON.stringify(payload));

    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      return result;
    } catch (e) {
      console.error(`Could not post ${action}:`, e);
      return { status: 'error', message: e.message };
    }
  };

  const handleRequestSubmit = async () => {
    setSubmitting(true);
    setError(null);
    const payload = { ...formData, items: formData.cart.map(item => { if (item.isManual) { return { subcategory: item.subcategory, quantity: item.quantity, unit: item.unit }; } const { id, imageUrl, ...rest } = item; return rest; }) };
    delete payload.cart;
    delete payload.returnCart;
    try {
      await postRequest('submitRequest', payload);
      navigateTo(5);
    } catch (err) { setError('提交失敗，請檢查您的網路連線並稍後再試。'); } finally { setSubmitting(false); }
  };

  const handleReturnSubmit = async () => {
    setSubmitting(true);
    setError(null);
    const payload = { user: formData.user, project: formData.project, returnCart: formData.returnCart };
    try {
      await postRequest('submitReturnRequest', payload);
      navigateTo(11);
    } catch (err) { setError('退貨申請提交失敗，請檢查網路連線。'); } finally { setSubmitting(false); }
  };
  
  const handleWorkLogSubmit = async (logPayload) => {
    setSubmitting(true);
    setError(null);
    try {
      await postRequest('submitWorkLog', logPayload);
      navigateTo(21); // 導向日誌成功頁面
    } catch (err) {
      setError('日誌提交失敗，請檢查您的網路連線並稍後再試。');
    } finally {
      setSubmitting(false);
    }
  };

  const resetApp = (isReturn = false, isLog = false) => {
    const { user, userPhone } = formData; // 保留 user 和 userPhone
    setFormData({
      user, 
      userPhone,
      project: '', deliveryAddress: '', deliveryDate: '', 
      recipientName: '', recipientPhone: '', cart: [], returnCart: []
    });
    navigateTo(1); // 全部返回主選單
  };

  // --- 渲染邏輯 ---
  const renderCurrentStep = () => {
    const pageProps = { navigateTo, updateFormData, formData };
    switch (currentStep) {
      case 0: return <LoginPage 
          users={users} 
          onLogin={(user) => { 
              const userData = allUsersData.find(u => u.applicant === user);
              updateFormData({ 
                  user, 
                  userPhone: userData ? userData.applicantPhone : '',
                  recipientName: '', // **優化：預設為空白**
                  recipientPhone: '' // **優化：預設為空白**
              }); 
              navigateTo(1); 
          }} 
      />;
      case 1: return <MainMenu {...pageProps} />;
      case 2: return <ProjectInfoPage {...pageProps} projects={[...new Set(projects.map(p => p.projectName))]} allUsers={allUsersData} />;
      case 3: return <ProductSelectionPage {...pageProps} items={items} cart={formData.cart} updateCart={updateCart} />;
      case 4: return <PreviewPage {...pageProps} onSubmit={handleRequestSubmit} isSubmitting={submitting} />;
      case 5: return <SuccessPage title="請購單已成功送出！" onNewRequest={() => resetApp(false)} buttonText="建立新的請購單" />;
      case 10: return <ReturnPage {...pageProps} projects={[...new Set(projects.map(p => p.projectName))]} items={items} returnCart={formData.returnCart} updateReturnCart={updateReturnCart} onSubmit={handleReturnSubmit} isSubmitting={submitting} />;
      case 11: return <ReturnSuccessPage onBackToMenu={() => resetApp(true)} />;
      // **新增：工作日誌流程**
      case 20: return <WorkLogPage {...pageProps} user={formData.user} projects={projects} onSubmit={handleWorkLogSubmit} isSubmitting={submitting} scriptUrl={SCRIPT_URL} postRequest={postRequest} />;
      case 21: return <SuccessPage title="工作日誌已成功提交！" onNewRequest={() => resetApp(false, true)} buttonText="返回主選單" />;
      default: return <Typography>未知的步驟</Typography>;
    }
  };

  if (loading) return <Container sx={{ textAlign: 'center', mt: '20vh' }}><CircularProgress size={60} /><Typography sx={{ mt: 2 }}>資料載入中...</Typography></Container>;
  if (error) return <Container sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Container>;

  const getActiveSteps = () => {
    if (currentStep >= 20) return logSteps;
    if (currentStep >= 10) return returnSteps;
    return requestSteps;
  };
  
  const getActiveStepIndex = () => {
    if (currentStep >= 20) return currentStep - 20 + 2; // 0, 1, 2 -> 2, 3, 4...
    if (currentStep >= 10) return 2;
    if (currentStep > 5) return -1;
    return currentStep;
  };

  const activeSteps = getActiveSteps();
  const activeStepIndex = getActiveStepIndex();

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
      <Typography variant="h4" component="h1" align="center" gutterBottom sx={{ mb: 4 }}>
        瑞宇水電 - 工作系統
      </Typography>
      {currentStep < 5 || currentStep === 10 || currentStep === 20 ? (
        <Stepper activeStep={activeStepIndex} alternativeLabel sx={{ mb: 4 }}>
          {activeSteps.map((label) => (<Step key={label}><StepLabel>{label}</StepLabel></Step>))}
        </Stepper>
      ) : null}
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 4, overflow: 'hidden' }}>
        <Fade in={true} timeout={500} key={currentStep}><div>{renderCurrentStep()}</div></Fade>
      </Paper>
      {currentStep === 3 && <ShoppingCart cart={formData.cart} onUpdateCart={updateCart} onNext={() => navigateTo(4)} />}
      <Box component="footer" sx={{ textAlign: 'center', py: 2, mt: 4, color: 'text.secondary', fontSize: '0.875rem' }}>
        © 2025 Lawrence. All Rights Reserved.
      </Box>
    </Container>
  );
}

export default App;
// Trigger new deployment
