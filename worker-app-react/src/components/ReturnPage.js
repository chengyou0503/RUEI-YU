import React, { useState, useMemo } from 'react';
import { Box, Typography, Button, FormControl, InputLabel, Select, MenuItem, TextField, Autocomplete, Stack, CircularProgress, List, ListItem, ListItemText, IconButton, Divider } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

const ReturnPage = ({ projects, items, returnCart, updateReturnCart, navigateTo, formData, updateFormData, onSubmit, isSubmitting }) => {
  const [currentItem, setCurrentItem] = useState(null);
  // **UI Bug 修正：預設為 '1'**
  const [currentQuantity, setCurrentQuantity] = useState('1');
  const [currentReason, setCurrentReason] = useState('');
  const [errors, setErrors] = useState({});

  const uniqueItems = useMemo(() => {
    const seen = new Set();
    return items.map(item => {
      const identifier = `${item.subcategory} (${item.thickness}/${item.size})`;
      if (!seen.has(identifier)) {
        seen.add(identifier);
        return { label: identifier };
      }
      return null;
    }).filter(Boolean);
  }, [items]);

  const handleAddItem = () => {
    const quantity = parseInt(currentQuantity, 10);
    if (!currentItem || !quantity || quantity <= 0) {
      alert('請選擇一個品項並輸入大於 0 的數量。');
      return;
    }
    const newItem = {
      id: `return-${Date.now()}`,
      name: typeof currentItem === 'string' ? currentItem : currentItem.label,
      quantity: quantity,
      reason: currentReason,
    };
    updateReturnCart([...returnCart, newItem]);
    
    // **UX 優化：自動清空**
    setCurrentItem('');
    setCurrentQuantity('1');
    setCurrentReason('');
  };

  const handleRemoveItem = (id) => {
    updateReturnCart(returnCart.filter(item => item.id !== id));
  };

  const validateAndSubmit = () => {
    const newErrors = {};
    if (!formData.project) newErrors.project = '必須選擇專案';
    if (returnCart.length === 0) newErrors.cart = '退貨清單不能是空的';
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSubmit();
    }
  };

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom align="center">
        退貨申請
      </Typography>
      
      <Stack spacing={3} sx={{ mt: 4 }}>
        <FormControl fullWidth error={!!errors.project}>
          <InputLabel>專案名稱</InputLabel>
          <Select name="project" value={formData.project} label="專案名稱" onChange={(e) => updateFormData({ project: e.target.value })}>
            {projects.map((p, i) => <MenuItem key={i} value={p}>{p}</MenuItem>)}
          </Select>
        </FormControl>

        <Typography variant="h6" sx={{ mt: 2, mb: -1 }}>新增退貨品項</Typography>
        <Autocomplete
          freeSolo
          options={uniqueItems}
          getOptionLabel={(option) => (typeof option === 'string' ? option : option.label) || ''}
          value={currentItem}
          onChange={(event, newValue) => setCurrentItem(newValue)}
          renderInput={(params) => <TextField {...params} label="搜尋或手動輸入退貨品項" />}
        />
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <TextField
            label="數量"
            type="number"
            value={currentQuantity}
            // **UI Bug 修正：允許清空**
            onChange={(e) => setCurrentQuantity(e.target.value)}
            sx={{ width: '100px' }}
          />
          <TextField label="退貨原因 (選填)" fullWidth value={currentReason} onChange={(e) => setCurrentReason(e.target.value)} />
        </Stack>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddItem} sx={{ alignSelf: 'flex-end' }}>
          加入退貨清單
        </Button>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6">待退貨清單</Typography>
        {returnCart.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>清單是空的</Typography>
        ) : (
          <List>
            {returnCart.map(item => (
              <ListItem key={item.id} secondaryAction={<IconButton edge="end" aria-label="delete" onClick={() => handleRemoveItem(item.id)}><DeleteIcon /></IconButton>}>
                <ListItemText primary={item.name} secondary={`數量: ${item.quantity}${item.reason ? ', 原因: ' + item.reason : ''}`} />
              </ListItem>
            ))}
          </List>
        )}
        {errors.cart && <Typography color="error" variant="caption">{errors.cart}</Typography>}
      </Stack>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 5 }}>
        <Button variant="outlined" onClick={() => navigateTo(1)} disabled={isSubmitting}>
          返回主選單
        </Button>
        <Button variant="contained" color="primary" onClick={validateAndSubmit} disabled={isSubmitting || returnCart.length === 0} startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}>
          {isSubmitting ? '傳送中...' : '送出退貨申請'}
        </Button>
      </Box>
    </Box>
  );
};

export default ReturnPage;
