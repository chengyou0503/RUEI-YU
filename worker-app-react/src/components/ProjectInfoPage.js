import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Select, MenuItem, Button, FormControl, InputLabel, TextField, Grid, Stack, Autocomplete } from '@mui/material';

const ProjectInfoPage = ({ projects, formData, updateFormData, navigateTo, allUsers }) => {
  const [data, setData] = useState({
    project: formData.project || '',
    deliveryAddress: formData.deliveryAddress || '',
    deliveryDate: formData.deliveryDate || '',
    recipientName: formData.recipientName || '',
    recipientPhone: formData.recipientPhone || '',
  });
  const [errors, setErrors] = useState({});

  // **優化：當收件人姓名變更時，自動帶入電話；若無則清空**
  useEffect(() => {
    if (data.recipientName) {
      const foundUser = allUsers.find(u => u.recipient === data.recipientName);
      if (foundUser && foundUser.recipientPhone) {
        setData(prev => ({ ...prev, recipientPhone: foundUser.recipientPhone }));
      } else {
        setData(prev => ({ ...prev, recipientPhone: '' })); // **優化：查無使用者時清空電話**
      }
    }
  }, [data.recipientName, allUsers]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleRecipientChange = (event, newValue) => {
    setData(prev => ({ ...prev, recipientName: newValue || '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!data.project) newErrors.project = '必須選擇專案';
    if (!data.deliveryAddress) newErrors.deliveryAddress = '必須填寫送貨地點';
    if (!data.deliveryDate) newErrors.deliveryDate = '必須選擇送貨日期';
    if (!formData.userPhone) newErrors.userPhone = '必須填寫申請人電話';
    if (!data.recipientName) newErrors.recipientName = '必須填寫收件人姓名';
    if (!data.recipientPhone) newErrors.recipientPhone = '必須填寫收件人電話';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      // 將頁面上的 data 和 formData 中已有的 userPhone 一起更新回去
      updateFormData({ ...data, userPhone: formData.userPhone });
      navigateTo(3);
    }
  };
  
  const recipientOptions = useMemo(() => {
    if (!allUsers) return [];
    const names = allUsers.map(u => u.recipient).filter(Boolean);
    return [...new Set(names)];
  }, [allUsers]);

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom align="center">
        專案與運送資訊
      </Typography>
      <Stack spacing={3} sx={{ mt: 4 }}>
        <FormControl fullWidth error={!!errors.project}>
          <InputLabel>專案名稱</InputLabel>
          <Select name="project" value={data.project} label="專案名稱" onChange={handleChange}>
            {projects.map((p, i) => <MenuItem key={i} value={p}>{p}</MenuItem>)}
          </Select>
        </FormControl>
        
        <TextField name="deliveryAddress" label="送貨地點" fullWidth value={data.deliveryAddress} onChange={handleChange} error={!!errors.deliveryAddress} helperText={errors.deliveryAddress} />
        
        <TextField name="deliveryDate" label="送貨日期" type="date" fullWidth value={data.deliveryDate} onChange={handleChange} error={!!errors.deliveryDate} helperText={errors.deliveryDate} InputLabelProps={{ shrink: true }} />

        <Grid container spacing={2}>
            <Grid item xs={12} sm={12}>
                <TextField label="申請人電話" type="tel" fullWidth value={formData.userPhone} disabled error={!!errors.userPhone} helperText={errors.userPhone} />
            </Grid>
             <Grid item xs={12} sm={10}>
                <Autocomplete
                  freeSolo
                  options={recipientOptions}
                  value={data.recipientName}
                  onChange={handleRecipientChange}
                  onInputChange={handleRecipientChange}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      label="收件人姓名" 
                      error={!!errors.recipientName} 
                      helperText={errors.recipientName} 
                    />
                  )}
                />
            </Grid>
            <Grid item xs={12} sm={2}>
                <TextField name="recipientPhone" label="收件人電話" type="tel" fullWidth value={data.recipientPhone} onChange={handleChange} error={!!errors.recipientPhone} helperText={errors.recipientPhone} />
            </Grid>
        </Grid>
      </Stack>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 5 }}>
        <Button variant="outlined" onClick={() => navigateTo(1)}>返回主選單</Button>
        <Button variant="contained" onClick={handleNext}>下一步：選擇品項</Button>
      </Box>
    </Box>
  );
};

export default ProjectInfoPage;