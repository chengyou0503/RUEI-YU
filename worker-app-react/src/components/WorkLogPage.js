import React, { useState, useMemo } from 'react';
import { Box, Typography, Button, FormControl, InputLabel, Select, MenuItem, TextField, Autocomplete, Stack, CircularProgress, Paper } from '@mui/material';

const WorkLogPage = ({ projects, user, onSubmit, isSubmitting, navigateTo }) => {
  const [logData, setLogData] = useState({
    date: new Date().toISOString().split('T')[0], // Default to today
    project: '',
    timeSlot: '',
    distinction: '',
    floor: '',
    term: '',
    isCompleted: '否',
    content: ''
  });
  const [errors, setErrors] = useState({});

  const projectOptions = useMemo(() => {
    if (!projects) return [];
    return [...new Set(projects.map(p => p.projectName))];
  }, [projects]);

  const termOptions = useMemo(() => {
    if (!projects || !logData.project) return [];
    const terms = projects
      .filter(p => p.projectName === logData.project && p.term)
      .map(p => p.term);
    return [...new Set(terms)];
  }, [projects, logData.project]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLogData(prev => ({ ...prev, [name]: value }));
    if (name === 'project') {
      setLogData(prev => ({ ...prev, term: '' })); // Reset term when project changes
    }
  };
  
  const handleTermChange = (event, newValue) => {
    setLogData(prev => ({ ...prev, term: newValue || '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!logData.date) newErrors.date = '必須選擇日期';
    if (!logData.project) newErrors.project = '必須選擇案場';
    if (!logData.content.trim()) newErrors.content = '必須填寫工作內容';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit({ ...logData, user });
    }
  };

  return (
    <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
      <Typography variant="h5" component="h2" gutterBottom align="center">
        工作日誌
      </Typography>
      <Stack spacing={3} sx={{ mt: 4 }}>
        <TextField
          name="date"
          label="日期"
          type="date"
          value={logData.date}
          onChange={handleChange}
          error={!!errors.date}
          helperText={errors.date}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="工作人員"
          value={user}
          disabled
          fullWidth
        />
        <FormControl fullWidth error={!!errors.project}>
          <InputLabel>案場</InputLabel>
          <Select name="project" value={logData.project} label="案場" onChange={handleChange}>
            {projectOptions.map((p, i) => <MenuItem key={i} value={p}>{p}</MenuItem>)}
          </Select>
        </FormControl>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <FormControl fullWidth>
            <InputLabel>時段</InputLabel>
            <Select name="timeSlot" value={logData.timeSlot} label="時段" onChange={handleChange}>
              <MenuItem value="08:00-12:00 (上午)">08:00-12:00 (上午)</MenuItem>
              <MenuItem value="13:00-17:00 (下午)">13:00-17:00 (下午)</MenuItem>
              <MenuItem value="08:00-17:00 (全日)">08:00-17:00 (全日)</MenuItem>
            </Select>
          </FormControl>
          <TextField name="distinction" label="區別 (例如: A棟)" fullWidth value={logData.distinction} onChange={handleChange} />
          <TextField name="floor" label="樓層 (例如: 1F)" fullWidth value={logData.floor} onChange={handleChange} />
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
           <Autocomplete
              freeSolo
              fullWidth
              options={termOptions}
              value={logData.term}
              onChange={handleTermChange}
              onInputChange={handleTermChange} // Allows typing new values
              renderInput={(params) => <TextField {...params} label="期數" />}
            />
          <FormControl fullWidth>
            <InputLabel>當期是否完工</InputLabel>
            <Select name="isCompleted" value={logData.isCompleted} label="當期是否完工" onChange={handleChange}>
              <MenuItem value="是">是</MenuItem>
              <MenuItem value="否">否</MenuItem>
            </Select>
          </FormControl>
        </Stack>
        <TextField
          name="content"
          label="工作內容"
          multiline
          rows={4}
          fullWidth
          value={logData.content}
          onChange={handleChange}
          error={!!errors.content}
          helperText={errors.content}
        />
      </Stack>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 5 }}>
        <Button variant="outlined" onClick={() => navigateTo(1)} disabled={isSubmitting}>
          返回主選單
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isSubmitting ? '傳送中...' : '提交日誌'}
        </Button>
      </Box>
    </Paper>
  );
};

export default WorkLogPage;
