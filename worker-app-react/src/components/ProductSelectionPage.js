import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Breadcrumbs, Link, Grid, Card, CardContent, IconButton, TextField, Button, Stack,
  InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import AddIcon from '@mui/icons-material/Add';

const ProductSelectionPage = ({ items, cart, updateCart, navigateTo }) => {
  const [selection, setSelection] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  // **UI Bug 修正：允許數量為空字串**
  const [manualItem, setManualItem] = useState({ name: '', quantity: '', unit: '' });

  // ... (Filtering & Data Logic remains the same) ...
  const getFilteredItems = (level) => {
    let filtered = items;
    if (level >= 1 && selection.category) filtered = filtered.filter(i => i.category === selection.category);
    if (level >= 2 && selection.subcategory) filtered = filtered.filter(i => i.subcategory === selection.subcategory);
    if (level >= 3 && selection.thickness) filtered = filtered.filter(i => i.thickness === selection.thickness);
    return filtered;
  };
  const searchResults = useMemo(() => {
    if (!searchTerm) return [];
    return items.filter(item => Object.values(item).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase())));
  }, [searchTerm, items]);
  const currentLevel = Object.keys(selection).length;
  const isSearching = searchTerm.length > 0;
  const categories = useMemo(() => [...new Set(items.map(i => i.category))], [items]);
  const subcategories = useMemo(() => [...new Set(getFilteredItems(1).map(i => i.subcategory))], [selection.category]);
  const thicknesses = useMemo(() => [...new Set(getFilteredItems(2).map(i => i.thickness))], [selection.subcategory]);
  const finalItems = useMemo(() => getFilteredItems(3), [selection.thickness]);


  const handleSelect = (key, value) => {
    if (key === 'category') setSelection({ category: value });
    else if (key === 'subcategory') setSelection({ ...selection, subcategory: value });
    else if (key === 'thickness') setSelection({ ...selection, thickness: value });
  };

  const handleBreadcrumbClick = (level) => {
    if (level === 0) setSelection({});
    else if (level === 1) setSelection({ category: selection.category });
    else if (level === 2) setSelection({ category: selection.category, subcategory: selection.subcategory });
  };

  const handleUpdateCart = (product, quantity) => {
    const newQuantity = Math.max(0, quantity);
    const existingItem = cart.find(item => item.id === product.id);
    let newCart;
    if (newQuantity === 0) newCart = cart.filter(item => item.id !== product.id);
    else if (existingItem) newCart = cart.map(item => item.id === product.id ? { ...item, quantity: newQuantity } : item);
    else newCart = [...cart, { ...product, quantity: newQuantity }];
    updateCart(newCart);
  };

  const handleBackClick = () => {
    if (currentLevel > 0) {
      handleBreadcrumbClick(currentLevel - 1);
    } else {
      navigateTo(2);
    }
  };

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setManualItem({ name: '', quantity: '', unit: '' });
  };
  const handleAddManualItem = () => {
    const quantity = parseInt(manualItem.quantity, 10);
    if (!manualItem.name || !manualItem.unit || !quantity || quantity <= 0) {
      alert('請填寫完整的品項名稱、單位，以及大於 0 的數量。');
      return;
    }
    const newItem = {
      id: `manual-${Date.now()}`,
      category: '臨時品項',
      subcategory: manualItem.name,
      thickness: '-',
      size: '-',
      unit: manualItem.unit,
      quantity: quantity,
      isManual: true,
    };
    updateCart([...cart, newItem]);
    handleCloseModal();
  };

  // ... (Rendering Logic remains mostly the same) ...
  const renderGrid = (options, key) => (
    <Grid container spacing={2}>
      {options.map(opt => {
        let imageUrl = null;
        if (key === 'subcategory') {
          const item = items.find(i => i.subcategory === opt);
          if (item) imageUrl = item.imageUrl;
        }
        return (
          <Grid item xs={6} sm={4} md={3} key={opt}>
            <Card onClick={() => handleSelect(key, opt)} sx={{ cursor: 'pointer', height: '100%' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', p: 2 }}>
                {imageUrl && <Box component="img" src={imageUrl} alt={opt} sx={{ height: 80, width: '100%', objectFit: 'contain', mb: 1 }} onError={(e) => { e.target.style.display = 'none'; }} />}
                <Typography variant="h6" align="center">{opt}</Typography>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
  const renderFinalItems = (itemsToRender) => (
    <Stack spacing={2}>
      {itemsToRender.map(product => {
        const cartItem = cart.find(item => item.id === product.id);
        const quantity = cartItem ? cartItem.quantity : 0;
        const displayName = isSearching 
          ? `${product.category} > ${product.subcategory} > ${product.thickness} > ${product.size}` 
          : `${product.thickness} > ${product.size}`;
        return (
          <Card variant="outlined" key={product.id}>
            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: '16px !important' }}>
              <Box>
                <Typography variant="body1" fontWeight="500">{displayName}</Typography>
                <Typography color="text.secondary" variant="body2">單位: {product.unit}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton size="small" onClick={() => handleUpdateCart(product, quantity - 1)}><RemoveCircleOutlineIcon /></IconButton>
                <TextField type="number" variant="outlined" size="small" value={quantity} onChange={(e) => handleUpdateCart(product, parseInt(e.target.value, 10) || 0)} sx={{ width: '60px' }} inputProps={{ style: { textAlign: 'center' } }} />
                <IconButton size="small" onClick={() => handleUpdateCart(product, quantity + 1)}><AddCircleOutlineIcon /></IconButton>
              </Box>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
  const renderMainContent = () => {
    if (isSearching) return renderFinalItems(searchResults);
    if (currentLevel === 0) return renderGrid(categories, 'category');
    if (currentLevel === 1) return renderGrid(subcategories, 'subcategory');
    if (currentLevel === 2) return renderGrid(thicknesses, 'thickness');
    if (currentLevel === 3) return renderFinalItems(finalItems);
  };


  return (
    <Box>
      <TextField fullWidth variant="outlined" placeholder="搜尋全部品項..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} sx={{ mb: 3 }} InputProps={{
        startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
        endAdornment: searchTerm && <InputAdornment position="end"><IconButton onClick={() => setSearchTerm('')} edge="end"><ClearIcon /></IconButton></InputAdornment>,
      }} />

      {!isSearching && (
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
          <Link sx={{ cursor: 'pointer' }} underline="hover" color="inherit" onClick={() => handleBreadcrumbClick(0)}>大分類</Link>
          {selection.category && <Link sx={{ cursor: 'pointer' }} underline="hover" color="inherit" onClick={() => handleBreadcrumbClick(1)}>{selection.category}</Link>}
          {selection.subcategory && <Link sx={{ cursor: 'pointer' }} underline="hover" color="inherit" onClick={() => handleBreadcrumbClick(2)}>{selection.subcategory}</Link>}
          {selection.thickness && <Typography color="text.primary">{selection.thickness}</Typography>}
        </Breadcrumbs>
      )}
      
      <Box sx={{ minHeight: '30vh' }}>{renderMainContent()}</Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4 }}>
        <Button variant="outlined" onClick={handleBackClick}>
          {currentLevel > 0 && !isSearching ? '返回上一層' : '返回專案資訊'}
        </Button>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenModal}>
          新增臨時品項
        </Button>
      </Box>

      <Dialog open={isModalOpen} onClose={handleCloseModal}>
        <DialogTitle>新增臨時品項</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <TextField label="品項名稱" fullWidth value={manualItem.name} onChange={(e) => setManualItem(prev => ({ ...prev, name: e.target.value }))} />
            <TextField
              label="數量"
              type="number"
              fullWidth
              value={manualItem.quantity}
              // **UI Bug 修正：允許輸入框為空**
              onChange={(e) => setManualItem(prev => ({ ...prev, quantity: e.target.value }))}
            />
            <TextField label="單位 (例如: 個, 支, 尺)" fullWidth value={manualItem.unit} onChange={(e) => setManualItem(prev => ({ ...prev, unit: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>取消</Button>
          <Button onClick={handleAddManualItem} variant="contained">加入購物車</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductSelectionPage;