import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Button, FormControl, InputLabel, Select, MenuItem, TextField, Autocomplete, Stack, CircularProgress, Paper, Grid, IconButton, LinearProgress, Alert } from '@mui/material';
import { PhotoCamera, Delete, Save } from '@mui/icons-material';

const WorkLogPage = ({ projects, user, onSubmit, isSubmitting, navigateTo, scriptUrl, postRequest, initialData, onCancelEdit }) => {
  const [logData, setLogData] = useState({
    date: new Date().toISOString().split('T')[0],
    project: '',
    startTime: '',
    endTime: '',
    distinction: '',
    floor: '',
    term: '',
    engineeringItem: '',
    isCompleted: '否',
    content: '',
    photoUrls: [],
    folderUrl: '',
    id: null, // For edit mode
  });
  const [errors, setErrors] = useState({});

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [draftSaved, setDraftSaved] = useState(false);

  // --- Draft Saving Logic ---
  useEffect(() => {
    // Only load draft if NOT in edit mode
    if (!initialData) {
      const savedDraft = localStorage.getItem(`workLogDraft_${user}`);
      if (savedDraft) {
        try {
          const parsedDraft = JSON.parse(savedDraft);
          setLogData(prev => ({ ...prev, ...parsedDraft }));
          setDraftSaved(true);
          // Clear draft saved message after 3 seconds
          setTimeout(() => setDraftSaved(false), 3000);
        } catch (e) {
          console.error("Failed to load draft", e);
        }
      }
    }
  }, [user, initialData]);

  useEffect(() => {
    // Save draft to localStorage whenever logData changes, ONLY if not in edit mode
    if (!initialData) {
      localStorage.setItem(`workLogDraft_${user}`, JSON.stringify(logData));
    }
  }, [logData, user, initialData]);

  // --- Edit Mode Initialization ---
  useEffect(() => {
    if (initialData) {
      // Parse timeSlot back to startTime and endTime
      let startTime = '';
      let endTime = '';
      if (initialData.timeSlot) {
        const parts = initialData.timeSlot.split('-');
        if (parts.length === 2) {
          startTime = parts[0];
          endTime = parts[1];
        }
      }

      setLogData({
        ...initialData,
        startTime,
        endTime,
        // Ensure arrays are initialized
        photoUrls: initialData.photoUrls || [],
      });

      // Load existing photos into selectedFiles for preview (optional, but tricky since we only have URLs)
      // For simplicity, we just show existing URLs as "Existing Photos" or similar, 
      // but the current UI maps selectedFiles. 
      // Let's handle existing photos separately or convert them to a previewable format.
      // Here we will just keep them in logData.photoUrls and display them.
    }
  }, [initialData]);


  const projectOptions = useMemo(() => {
    if (!projects) return [];
    return [...new Set(projects.map(p => p.projectName))];
  }, [projects]);

  const termOptions = useMemo(() => {
    if (!logData.project || !projects) return [];
    const relatedProjects = projects.filter(p => p.projectName === logData.project && p.term && p.engineeringItem);
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
    for (let h = 6; h <= 23; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hour = String(h).padStart(2, '0');
        const minute = String(m).padStart(2, '0');
        times.push(`${hour}:${minute}`);
      }
    }
    times.push('00:00');
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

  // --- Image Compression Helper ---
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const maxWidth = 1024; // Max width for compression
      const maxHeight = 1024;
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with 0.7 quality
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve({ dataUrl, fileName: file.name.replace(/\.[^/.]+$/, ".jpg") });
        };
      };
    });
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
    if (!validate()) return;

    // If no new files and no existing files removed (logic simplified here), just submit
    if (selectedFiles.length === 0) {
      const timeSlot = `${logData.startTime}-${logData.endTime}`;
      // If in edit mode, we might have existing photoUrls, they are already in logData
      await submitData({ ...logData, user, timeSlot });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    let folderUrl = logData.folderUrl || '';
    const uploadedUrls = [...logData.photoUrls]; // Start with existing URLs

    try {
      // 1. Compress all images in parallel
      const compressedFiles = await Promise.all(
        selectedFiles.map(async ({ file }) => {
          return await compressImage(file);
        })
      );

      // 2. Construct batch payload
      const batchPayload = {
        files: compressedFiles.map(({ dataUrl, fileName }) => ({
          fileData: dataUrl,
          fileName: fileName
        })),
        date: logData.date,
        project: logData.project
      };

      // 3. Send single batch request
      // Fake progress for better UX since we can't track real upload progress of a single fetch easily without XHR
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 500);

      const uploadResult = await postRequest('uploadImages', batchPayload);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (uploadResult.status === 'success') {
        uploadedUrls.push(...uploadResult.urls);
        folderUrl = uploadResult.folderUrl;
      } else {
        throw new Error(uploadResult.message || '批次上傳失敗');
      }

      const finalLogData = {
        ...logData,
        photoUrls: uploadedUrls,
        folderUrl: folderUrl
      };
      const timeSlot = `${finalLogData.startTime}-${finalLogData.endTime}`;
      await submitData({ ...finalLogData, user, timeSlot });

      setSelectedFiles([]);

    } catch (error) {
      console.error("上傳或提交過程中發生錯誤:", error);
      alert(`處理失敗: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const submitData = async (data) => {
    await onSubmit(data);
    // Clear draft only on successful submit
    if (!initialData) {
      localStorage.removeItem(`workLogDraft_${user}`);
    }
  };

  const handleRemoveFile = (previewUrl) => {
    setSelectedFiles(prev => prev.filter(f => f.preview !== previewUrl));
  };

  const handleRemoveExistingPhoto = (urlToRemove) => {
    setLogData(prev => ({
      ...prev,
      photoUrls: prev.photoUrls.filter(url => url !== urlToRemove)
    }));
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

  return (
    <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
      <Typography variant="h5" component="h2" gutterBottom align="center">
        {initialData ? '編輯工作日誌' : '工作日誌'}
      </Typography>

      {draftSaved && <Alert severity="info" sx={{ mb: 2 }}>已自動載入草稿</Alert>}

      <Stack spacing={3} sx={{ mt: 4 }}>
        <TextField name="date" label="日期" type="date" value={logData.date} onChange={handleChange} error={!!errors.date} helperText={errors.date} InputLabelProps={{ shrink: true }} />
        <TextField label="工作人員" value={user} disabled fullWidth />
        <Autocomplete
          fullWidth
          options={projectOptions}
          value={logData.project}
          onChange={handleProjectChange}
          isOptionEqualToValue={(option, value) => option === value}
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

          {/* Existing Photos (Edit Mode) */}
          {logData.photoUrls.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>已上傳的照片:</Typography>
              <Grid container spacing={2}>
                {logData.photoUrls.map((url, index) => (
                  <Grid item key={index} xs={6} sm={4} md={3}>
                    <Paper sx={{ position: 'relative' }}>
                      <img src={url} alt="existing" style={{ width: '100%', height: 'auto' }} />
                      <IconButton onClick={() => handleRemoveExistingPhoto(url)} size="small" sx={{ position: 'absolute', top: 0, right: 0, color: 'white', backgroundColor: 'rgba(0,0,0,0.5)' }} disabled={isUploading}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          <Button variant="outlined" component="label" startIcon={<PhotoCamera />} disabled={isUploading}>
            選擇新照片
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
        <Button variant="outlined" onClick={() => initialData ? onCancelEdit() : navigateTo(1)} disabled={isSubmitting || isUploading}>
          {initialData ? '取消編輯' : '返回主選單'}
        </Button>
        <Button variant="contained" color="primary" onClick={handleUpload} disabled={isSubmitting || isUploading} startIcon={isSubmitting || isUploading ? <CircularProgress size={20} color="inherit" /> : null}>
          {isUploading ? '上傳中...' : (initialData ? '儲存變更' : '提交日誌')}
        </Button>
      </Box>
    </Paper>
  );
};

export default WorkLogPage;
