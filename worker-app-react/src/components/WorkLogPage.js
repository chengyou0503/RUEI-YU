import React, { useState, useMemo } from 'react';
import { Box, Typography, Button, FormControl, InputLabel, Select, MenuItem, TextField, Autocomplete, Stack, CircularProgress, Paper, Grid, IconButton, LinearProgress } from '@mui/material';
import { PhotoCamera, Delete } from '@mui/icons-material';

const WorkLogPage = ({ projects, user, onSubmit, isSubmitting, navigateTo }) => {
  console.log("WorkLogPage 接收到的 projects 數據:", projects);
  const [logData, setLogData] = useState({
    date: new Date().toISOString().split('T')[0],
    project: '',
    startTime: '',
    endTime: '',
    distinction: '',
    floor: '',
    term: '',
    isCompleted: '否',
    content: '',
    photoUrls: [],
  });
  const [errors, setErrors] = useState({});

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const projectOptions = useMemo(() => {
    if (!projects) return [];
    return [...new Set(projects.map(p => p.projectName))];
  }, [projects]);

  const termOptions = useMemo(() => {
    if (!logData.project || !projects) return [];
    const relatedProjects = projects.filter(p => p.projectName === logData.project && p.term && p.engineeringItem);
    // 使用 reduce 確保選項唯一性
    const uniqueOptions = relatedProjects.reduce((acc, p) => {
      const label = `${p.term} - ${p.engineeringItem}`;
      if (!acc.some(item => item.label === label)) {
        acc.push({ label: label, value: p.term });
      }
      return acc;
    }, []);
    return uniqueOptions;
  }, [logData.project, projects]);

  const generateTimeOptions = () => {
    const times = [];
    for (let h = 8; h <= 18; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hour = String(h).padStart(2, '0');
        const minute = String(m).padStart(2, '0');
        times.push(`${hour}:${minute}`);
      }
    }
    return times;
  };
  const timeOptions = useMemo(() => generateTimeOptions(), []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLogData(prev => ({ ...prev, [name]: value }));
  };

    const handleProjectChange = (event, newValue) => {
      console.log("案場選擇變更，收到的新值:", newValue);
      setLogData(prev => ({ ...prev, project: newValue || '', term: '' }));
    };
  
    const handleTermChange = (event, newValue) => {
      // newValue 現在會是 { label: '...', value: '...' } 或 null
      setLogData(prev => ({ ...prev, term: newValue ? newValue.value : '' }));
    };
  
    const handleFileChange = (event) => {
      const files = Array.from(event.target.files);
      const fileObjects = files.map(file => ({
        file,
        preview: URL.createObjectURL(file),
      }));
      setSelectedFiles(prev => [...prev, ...fileObjects]);
    };
  
    const handleUpload = async () => {
      if (selectedFiles.length === 0) return;
      setIsUploading(true);
      setUploadProgress(0);
  
      const uploadedUrls = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        const { file } = selectedFiles[i];
        const reader = new FileReader();
        reader.readAsDataURL(file);
        await new Promise((resolve, reject) => {
          reader.onload = async () => {
            try {
              const payload = {
                fileData: reader.result,
                fileName: file.name,
                date: logData.date,
              };
              const response = await fetch("https://script.google.com/macros/s/AKfycbzvbtdyosoUvb3UWGydYUa6FDzFvOKx7p-xAOsu2ZwJhftq5QWFjzzj_5VwAw9G2F_bJA/exec", {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify({ action: 'uploadImage', payload }),
              });
              setUploadProgress(((i + 1) / selectedFiles.length) * 100);
              resolve();
            } catch (error) {
              reject(error);
            }
          };
          reader.onerror = reject;
        });
      }
      
      setIsUploading(false);
      alert('所有照片已上傳完畢，請點擊「提交日誌」以儲存。');
    };
    
    const handleRemoveFile = (previewUrl) => {
      setSelectedFiles(prev => prev.filter(f => f.preview !== previewUrl));
    };
  
    const validate = () => {
      const newErrors = {};
      if (!logData.date) newErrors.date = '必須選擇日期';
      if (!logData.project) newErrors.project = '必須選擇案場';
      if (!logData.term) newErrors.term = '必須選擇期數';
      if (!logData.startTime) newErrors.startTime = '必須選擇開始時間';
      if (!logData.endTime) newErrors.endTime = '必須選擇結束時間';
      if (logData.startTime && logData.endTime && logData.startTime >= logData.endTime) {
        newErrors.endTime = '結束時間必須晚於開始時間';
      }
      if (!logData.content.trim()) newErrors.content = '必須填寫工作內容';
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };
  
    const handleSubmit = () => {
      if (validate()) {
        const timeSlot = `${logData.startTime}-${logData.endTime}`;
        onSubmit({ ...logData, user, timeSlot });
      }
    };
  
    console.log("畫面重新渲染，目前的 logData.project 是:", logData.project);
  
    return (
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
        <Typography variant="h5" component="h2" gutterBottom align="center">
          工作日誌
        </Typography>
        <Stack spacing={3} sx={{ mt: 4 }}>
          <TextField name="date" label="日期" type="date" value={logData.date} onChange={handleChange} error={!!errors.date} helperText={errors.date} InputLabelProps={{ shrink: true }} />
          <TextField label="工作人員" value={user} disabled fullWidth />
          <Autocomplete
            fullWidth
            options={projectOptions}
            value={logData.project || null} // 確保 value 不是 undefined
            onChange={handleProjectChange}
            isOptionEqualToValue={(option, value) => option === value}
            renderInput={(params) => (<TextField {...params} label="案場" error={!!errors.project} helperText={errors.project} />)}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl fullWidth error={!!errors.startTime}>
              <InputLabel>開始時間</InputLabel>
              <Select name="startTime" value={logData.startTime} label="開始時間" onChange={handleChange}>
                {timeOptions.map((time, i) => <MenuItem key={i} value={time}>{time}</MenuItem>)}
              </Select>
              {errors.startTime && <Typography color="error" variant="caption">{errors.startTime}</Typography>}
            </FormControl>
            <FormControl fullWidth error={!!errors.endTime}>
              <InputLabel>結束時間</InputLabel>
              <Select name="endTime" value={logData.endTime} label="結束時間" onChange={handleChange}>
                {timeOptions.map((time, i) => <MenuItem key={i} value={time}>{time}</MenuItem>)}
              </Select>
              {errors.endTime && <Typography color="error" variant="caption">{errors.endTime}</Typography>}
            </FormControl>
          </Stack>        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField name="distinction" label="區別 (例如: A棟)" fullWidth value={logData.distinction} onChange={handleChange} />
          <TextField name="floor" label="樓層 (例如: 1F)" fullWidth value={logData.floor} onChange={handleChange} />
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
           <Autocomplete 
             fullWidth 
             options={termOptions} 
             getOptionLabel={(option) => option.label || ''}
             value={termOptions.find(option => option.value === logData.term) || null}
             onChange={handleTermChange} 
             disabled={!logData.project} 
             renderInput={(params) => <TextField {...params} label="期數與工程項目" error={!!errors.term} helperText={errors.term} />} 
           />
        </Stack>
        <FormControl fullWidth>
          <InputLabel>當期是否完工</InputLabel>
          <Select name="isCompleted" value={logData.isCompleted} label="當期是否完工" onChange={handleChange}>
            <MenuItem value="是">是</MenuItem>
            <MenuItem value="否">否</MenuItem>
          </Select>
        </FormControl>
        <TextField name="content" label="工作內容" multiline rows={4} fullWidth value={logData.content} onChange={handleChange} error={!!errors.content} helperText={errors.content} />
        
        <Box>
          <Typography variant="h6" gutterBottom>相關照片</Typography>
          <Button variant="outlined" component="label" startIcon={<PhotoCamera />} disabled={isUploading}>
            選擇照片
            <input type="file" hidden multiple accept="image/*" onChange={handleFileChange} />
          </Button>
          {selectedFiles.length > 0 && (
            <Button onClick={handleUpload} disabled={isUploading} sx={{ ml: 2 }}>
              {isUploading ? '上傳中...' : `上傳 ${selectedFiles.length} 張照片`}
            </Button>
          )}
          {isUploading && (
            <Box sx={{ width: '100%', mt: 2 }}>
              <LinearProgress variant="determinate" value={uploadProgress} />
              <Typography variant="body2" color="text.secondary">{`${Math.round(uploadProgress)}%`}</Typography>
            </Box>
          )}
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {selectedFiles.map(({ preview }, index) => (
              <Grid item key={index} xs={6} sm={4} md={3}>
                <Paper sx={{ position: 'relative' }}>
                  <img src={preview} alt="preview" style={{ width: '100%', height: 'auto' }} />
                  <IconButton onClick={() => handleRemoveFile(preview)} size="small" sx={{ position: 'absolute', top: 0, right: 0, color: 'white', backgroundColor: 'rgba(0,0,0,0.5)' }} disabled={isUploading}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

      </Stack>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 5 }}>
        <Button variant="outlined" onClick={() => navigateTo(1)} disabled={isSubmitting || isUploading}>
          返回主選單
        </Button>
        <Button variant="contained" color="primary" onClick={handleSubmit} disabled={isSubmitting || isUploading} startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}>
          {isSubmitting ? '傳送中...' : '提交日誌'}
        </Button>
      </Box>
    </Paper>
  );
};

export default WorkLogPage;
