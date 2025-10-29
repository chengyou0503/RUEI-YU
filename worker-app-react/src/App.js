import React, { useState, useEffect } from 'react';
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

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyJgGCkZuDDff4zo5Vo-yAQUpOJipZvv8ich1r2X73EZHfHmwF6bg4UM71p-70ATQITsQ/exec";
const requestSteps = ['身份驗證', '主選單', '專案資訊', '選擇品項', '預覽與確認'];
const returnSteps = ['身份驗證', '主選單', '退貨申請'];

function App() {
  // --- 狀態管理 ---
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // 初始資料
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [items, setItems] = useState([]);

  // 表單資料
  const [formData, setFormData] = useState({
    user: '', project: '', deliveryAddress: '', deliveryDate: '',
    userPhone: '', recipientName: '', recipientPhone: '', 
    cart: [],
    returnCart: [], // **新增：退貨購物車**
  });

  // --- 資料載入 ---
  useEffect(() => {
    const fetchData = async (action) => {
      try {
        const res = await fetch(`${SCRIPT_URL}?action=${action}`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        if (data.status === 'error') throw new Error(data.message);
        return data;
      } catch (e) { console.error(`Could not fetch ${action}:`, e); throw e; }
    };
    setLoading(true);
    Promise.all([fetchData('getUsers'), fetchData('getProjects'), fetchData('getItems')])
      .then(([usersData, projectsData, itemsData]) => {
        const itemsWithId = itemsData.map((item, index) => ({ ...item, id: `item-${index}` }));
        setUsers(usersData);
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
  const updateReturnCart = (returnCart) => updateFormData({ returnCart }); // **新增**

  const handleRequestSubmit = async () => {
    setSubmitting(true);
    setError(null);
    const payload = { ...formData, items: formData.cart.map(item => { if (item.isManual) { return { subcategory: item.subcategory, quantity: item.quantity, unit: item.unit }; } const { id, imageUrl, ...rest } = item; return rest; }) };
    delete payload.cart;
    delete payload.returnCart;
    try {
      await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action: 'submitRequest', payload }), headers: { 'Content-Type': 'text/plain;charset=utf-8' } });
      navigateTo(5);
    } catch (err) { setError('提交失敗，請檢查您的網路連線並稍後再試。'); } finally { setSubmitting(false); }
  };

  const handleReturnSubmit = async () => {
    setSubmitting(true);
    setError(null);
    const payload = { user: formData.user, project: formData.project, returnCart: formData.returnCart };
    try {
      await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action: 'submitReturnRequest', payload }), headers: { 'Content-Type': 'text/plain;charset=utf-8' } });
      navigateTo(11);
    } catch (err) { setError('退貨申請提交失敗，請檢查網路連線。'); } finally { setSubmitting(false); }
  };

  const resetApp = (isReturn = false) => {
    setFormData(prev => ({
      ...prev,
      project: '', deliveryAddress: '', deliveryDate: '', userPhone: '', 
      recipientName: '', recipientPhone: '', cart: [], returnCart: []
    }));
    navigateTo(isReturn ? 10 : 1);
  };

  // --- 渲染邏輯 ---
  const renderCurrentStep = () => {
    const pageProps = { navigateTo, updateFormData, formData };
    switch (currentStep) {
      case 0: return <LoginPage users={users} onLogin={(user) => { updateFormData({ user }); navigateTo(1); }} />;
      case 1: return <MainMenu {...pageProps} />;
      case 2: return <ProjectInfoPage {...pageProps} projects={projects} />;
      case 3: return <ProductSelectionPage {...pageProps} items={items} cart={formData.cart} updateCart={updateCart} />;
      case 4: return <PreviewPage {...pageProps} onSubmit={handleRequestSubmit} isSubmitting={submitting} />;
      case 5: return <SuccessPage onNewRequest={() => resetApp(false)} />;
      case 10: return <ReturnPage {...pageProps} projects={projects} items={items} returnCart={formData.returnCart} updateReturnCart={updateReturnCart} onSubmit={handleReturnSubmit} isSubmitting={submitting} />;
      case 11: return <ReturnSuccessPage onBackToMenu={() => resetApp(true)} />;
      default: return <Typography>未知的步驟</Typography>;
    }
  };

  if (loading) return <Container sx={{ textAlign: 'center', mt: '20vh' }}><CircularProgress size={60} /><Typography sx={{ mt: 2 }}>資料載入中...</Typography></Container>;
  if (error) return <Container sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Container>;

  const activeSteps = currentStep >= 10 ? returnSteps : requestSteps;
  const activeStepIndex = currentStep >= 10 ? 2 : (currentStep > 5 ? -1 : currentStep);

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, sm: 4 } }}>
      <Typography variant="h4" component="h1" align="center" gutterBottom sx={{ mb: 4 }}>
        瑞宇水電 - 請購系統
      </Typography>
      {currentStep < 5 || currentStep === 10 ? (
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
