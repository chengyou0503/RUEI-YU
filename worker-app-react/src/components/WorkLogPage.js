import React, { useState, useMemo } from 'react';
import { Box, Typography, Button, FormControl, InputLabel, Select, MenuItem, TextField, Autocomplete, Stack, CircularProgress, Paper, Grid, IconButton, LinearProgress } from '@mui/material';
import { PhotoCamera, Delete } from '@mui/icons-material';

const WorkLogPage = ({ projects, user, onSubmit, isSubmitting, navigateTo, scriptUrl, postRequest }) => {
  const [logData, setLogData] = useState({
    date: new Date().toISOString().split('T')[0],
    project: '',
    startTime: '',
    endTime: '',
    distinction: '',
    floor: '',
    term: '',
    engineeringItem: '', // 新增
    isCompleted: '否',
    content: '',
    photoUrls: [],
    folderUrl: '', // 新增
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
    for (let h = 6; h <= 23; h++) { // 從早上 6 點到晚上 11 點
      for (let m = 0; m < 60; m += 30) {
        const hour = String(h).padStart(2, '0');
        const minute = String(m).padStart(2, '0');
        times.push(`${hour}:${minute}`);
      }
    }
    times.push('00:00'); // 加上午夜 12 點
    return times;
  };
  const timeOptions = useMemo(() => generateTimeOptions(), []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLogData(prev => ({ ...prev, [name]: value }));
  };

    const handleProjectChange = (event, newValue) => {
      setLogData(prev => ({ ...prev, project: newValue || '', term: '', engineeringItem: '' }));
    };
  
    const handleTermChange = (event, newValue) => {
      if (newValue) {
        const parts = newValue.label.split(' - ');
        const term = newValue.value;
        const engineeringItem = parts[1] || '';
        setLogData(prev => ({ ...prev, term, engineeringItem }));
      } else {
        setLogData(prev => ({ ...prev, term: '', engineeringItem: '' }));
      }
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
      if (selectedFiles.length === 0) {
        // 如果沒有選擇檔案，但使用者可能想提交沒有照片的日誌
        handleSubmit(logData);
        return;
      }
      
      if (!validate()) return; // 在上傳前也進行一次驗證

      setIsUploading(true);
      setUploadProgress(0);
  
      let folderUrl = '';
      const uploadedUrls = [...logData.photoUrls]; // 從現有的 URLs 開始

      try {
        for (let i = 0; i < selectedFiles.length; i++) {
          const { file } = selectedFiles[i];
          const reader = new FileReader();
          reader.readAsDataURL(file);
          const result = await new Promise((resolve, reject) => {
            reader.onload = async () => {
              try {
                const payload = {
                  fileData: reader.result,
                  fileName: file.name,
                  date: logData.date,
                  project: logData.project, // 新增案場名稱
                };
                const uploadResult = await postRequest('uploadImage', payload);
                if (uploadResult.status === 'success') {
                  resolve(uploadResult);
                } else {
                  reject(new Error(uploadResult.message || '上傳失敗'));
                }
              } catch (error) {
                reject(error);
              }
            };
            reader.onerror = reject;
          });

          uploadedUrls.push(result.url);
          folderUrl = result.folderUrl; // 每次都更新 folderUrl
          setUploadProgress(((i + 1) / selectedFiles.length) * 100);
        }
        
        // 上傳成功後，用最新的資料準備提交
        const finalLogData = { 
          ...logData, 
          photoUrls: uploadedUrls, 
          folderUrl: folderUrl || logData.folderUrl // 如果 folderUrl 是空的，保留舊的
        };

        // 直接觸發提交
        handleSubmit(finalLogData);
        setSelectedFiles([]); // 清空已選擇的檔案

      } catch (error) {
        console.error("上傳或提交過程中發生錯誤:", error);
        alert(`處理失敗: ${error.message}`);
      } finally {
        setIsUploading(false);
      }
    };
    
    const handleRemoveFile = (previewUrl) => {
      setSelectedFiles(prev => prev.filter(f => f.preview !== previewUrl));
    };
  
    const validate = (data = logData) => {
      const newErrors = {};
      if (!data.date) newErrors.date = '必須選擇日期';
      if (!data.project) newErrors.project = '必須選擇案場';
      if (!data.term) newErrors.term = '必須選擇期數';
      if (!data.startTime) newErrors.startTime = '必須選擇開始時間';
      if (!data.endTime) newErrors.endTime = '必須選擇結束時間';
      if (data.startTime && data.endTime && data.startTime >= data.endTime) {
        newErrors.endTime = '結束時間必須晚於開始時間';
      }
      if (!data.content.trim()) newErrors.content = '必須填寫工作內容';
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };
  
    const handleSubmit = (dataToSubmit) => {
      const finalData = dataToSubmit || logData;
      if (validate(finalData)) { // 使用傳入的資料進行驗證
        const timeSlot = `${finalData.startTime}-${finalData.endTime}`;
        onSubmit({ ...finalData, user, timeSlot });
      }
    };
  
      return (
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>        <Typography variant="h5" component="h2" gutterBottom align="center">
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
                      sx={{ width: 200 }} // 設定固定寬度
                      renderInput={(params) => (<TextField {...params} label="案場" error={!!errors.project} helperText={errors.project} />)} 
                    />          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
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
        <Button variant="contained" color="primary" onClick={handleUpload} disabled={isSubmitting || isUploading} startIcon={isSubmitting || isUploading ? <CircularProgress size={20} color="inherit" /> : null}>
          {isUploading ? '上傳中...' : (selectedFiles.length > 0 ? '上傳並提交' : '提交日誌')}
        </Button>
      </Box>
    </Paper>
  );
};

export default WorkLogPage;
