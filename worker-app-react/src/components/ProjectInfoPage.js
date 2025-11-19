import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Button, FormControl, InputLabel, TextField, Grid, Stack, Autocomplete } from '@mui/material';

const ProjectInfoPage = ({ projects, formData, updateFormData, navigateTo, allUsers }) => {
  const [data, setData] = useState({
    project: formData.project || null, // 改為 null 以配合 Autocomplete
    term: formData.term || '',
    engineeringItem: formData.engineeringItem || '',
    deliveryAddress: formData.deliveryAddress || '',
    deliveryDate: formData.deliveryDate || '',
    recipientName: formData.recipientName || '',
    recipientPhone: formData.recipientPhone || '',
  });
  const [errors, setErrors] = useState({});

  // 當收件人姓名變更時，自動帶入電話
  useEffect(() => {
    if (data.recipientName) {
      const foundUser = allUsers.find(u => u.recipient === data.recipientName);
      setData(prev => ({ ...prev, recipientPhone: foundUser ? foundUser.recipientPhone : '' }));
    }
  }, [data.recipientName, allUsers]);

  // 當專案變更時，自動帶入地址
  useEffect(() => {
    if (data.project && data.project.address) {
      setData(prev => ({ ...prev, deliveryAddress: data.project.address }));
    } else {
      setData(prev => ({ ...prev, deliveryAddress: '' }));
    }
  }, [data.project]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const handleProjectChange = (event, newValue) => {
    setData(prev => ({
      ...prev,
      project: newValue,
      term: '', // 清空期數相關欄位
      engineeringItem: '',
    }));
  };

  const handleTermChange = (event, newValue) => {
    if (newValue) {
      const parts = newValue.label.split(' - ');
      setData(prev => ({ ...prev, term: newValue.value, engineeringItem: parts[1] || '' }));
    } else {
      setData(prev => ({ ...prev, term: '', engineeringItem: '' }));
    }
  };

  const handleRecipientChange = (event, newValue) => {
    setData(prev => ({ ...prev, recipientName: newValue || '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!data.project) newErrors.project = '必須選擇專案';
    if (!data.term) newErrors.term = '必須選擇期數';
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
      // 提交時，確保傳遞 project 名稱和 engineeringItem
      updateFormData({ 
        ...data, 
        project: data.project.projectName, 
        engineeringItem: data.engineeringItem, // 明確傳遞
        userPhone: formData.userPhone 
      });
      navigateTo(3);
    }
  };

  const projectOptions = useMemo(() => {
    const projectNames = [...new Set(projects.map(p => p.projectName))];
    return projectNames.map(name => projects.find(p => p.projectName === name));
  }, [projects]);

  const termOptions = useMemo(() => {
    if (!data.project || !projects) return [];
    const relatedProjects = projects.filter(p => p.projectName === data.project.projectName && p.term && p.engineeringItem);
    const uniqueOptions = relatedProjects.reduce((acc, p) => {
      const label = `${p.term} - ${p.engineeringItem}`;
      if (!acc.some(item => item.label === label)) {
        acc.push({ label: label, value: p.term });
      }
      return acc;
    }, []);
    return uniqueOptions;
  }, [data.project, projects]);
  
  const addressOptions = useMemo(() => {
    const options = ['公司'];
    if (data.project && data.project.address) {
      options.push(data.project.address);
    }
    return options;
  }, [data.project]);

  const recipientOptions = useMemo(() => {
    if (!allUsers) return [];
    return [...new Set(allUsers.map(u => u.recipient).filter(Boolean))];
  }, [allUsers]);

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom align="center">
        專案與運送資訊
      </Typography>
      <Stack spacing={3} sx={{ mt: 4 }}>
        <Autocomplete
          options={projectOptions}
          getOptionLabel={(option) => option.projectName || ''}
          value={data.project}
          onChange={handleProjectChange}
          isOptionEqualToValue={(option, value) => option.projectName === value.projectName}
          renderInput={(params) => <TextField {...params} label="專案名稱" error={!!errors.project} helperText={errors.project} />}
        />

        <Autocomplete
          options={termOptions}
          getOptionLabel={(option) => option.label || ''}
          value={termOptions.find(option => option.value === data.term) || null}
          onChange={handleTermChange}
          disabled={!data.project}
          renderInput={(params) => <TextField {...params} label="期數與工程項目" error={!!errors.term} helperText={errors.term} />}
        />

        <Autocomplete
          freeSolo
          options={addressOptions}
          value={data.deliveryAddress}
          onInputChange={(event, newInputValue) => {
            setData(prev => ({ ...prev, deliveryAddress: newInputValue }));
          }}
          renderInput={(params) => <TextField {...params} label="送貨地點" error={!!errors.deliveryAddress} helperText={errors.deliveryAddress} />}
        />
        
        <TextField name="deliveryDate" label="送貨日期" type="date" fullWidth value={data.deliveryDate} onChange={handleChange} error={!!errors.deliveryDate} helperText={errors.deliveryDate} InputLabelProps={{ shrink: true }} />

        <Grid container spacing={2}>
          <Grid item xs={12} sm={12}>
            <TextField label="申請人電話" type="tel" value={formData.userPhone} disabled error={!!errors.userPhone} helperText={errors.userPhone} sx={{ width: 200 }} />
          </Grid>
          <Grid item xs={12} sm={12}>
            <Autocomplete
              options={recipientOptions}
              value={data.recipientName}
              onChange={handleRecipientChange}
              onInputChange={handleRecipientChange}
              sx={{ width: 200 }}
              renderInput={(params) => <TextField {...params} label="收件人姓名" error={!!errors.recipientName} helperText={errors.recipientName} />}
            />
          </Grid>
          <Grid item xs={12} sm={12}>
            <TextField name="recipientPhone" label="收件人電話" type="tel" value={data.recipientPhone} onChange={handleChange} error={!!errors.recipientPhone} helperText={errors.recipientPhone} sx={{ width: 200 }} />
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