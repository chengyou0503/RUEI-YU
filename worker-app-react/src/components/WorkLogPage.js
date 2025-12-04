import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Button, FormControl, InputLabel, Select, MenuItem, TextField, Autocomplete, Stack, CircularProgress, Paper, Grid, IconButton, LinearProgress, Alert, Divider, Card, CardContent, CardHeader } from '@mui/material';
import { PhotoCamera, Delete, AddCircle, RemoveCircle } from '@mui/icons-material';

const DEFAULT_CONTENT = "點工：\n怪手、吊車：";

const WorkLogPage = ({ projects, user, onSubmit, isSubmitting, navigateTo, scriptUrl, postRequest, initialData, onCancelEdit }) => {
  // Common data for all sections
  const [commonData, setCommonData] = useState({
    date: new Date().toISOString().split('T')[0],
    project: '',
  });

  // Sections data
  const [sections, setSections] = useState([{
    id: Date.now(),
    startTime: '',
    endTime: '',
    distinction: '',
    floor: '',
    term: '',
    engineeringItem: '',
    isCompleted: '否',
    content: DEFAULT_CONTENT,
    photoUrls: [],
    folderUrl: '',
    selectedFiles: [], // Local state for files to upload
    uploadProgress: 0,
    isUploading: false,
  }]);

  const [errors, setErrors] = useState({});
  const [draftSaved, setDraftSaved] = useState(false);

  // --- Draft Saving Logic ---
  useEffect(() => {
    if (!initialData) {
      const savedDraft = localStorage.getItem(`workLogDraft_v2_${user}`);
      if (savedDraft) {
        try {
          const parsedDraft = JSON.parse(savedDraft);
          if (parsedDraft.commonData && parsedDraft.sections) {
            setCommonData(parsedDraft.commonData);
            // Restore sections but clear file objects as they can't be stored in localStorage
            setSections(parsedDraft.sections.map(s => ({ ...s, selectedFiles: [], isUploading: false, uploadProgress: 0 })));
            setDraftSaved(true);
            setTimeout(() => setDraftSaved(false), 3000);
          }
        } catch (e) {
          console.error("Failed to load draft", e);
        }
      }
    }
  }, [user, initialData]);

  useEffect(() => {
    if (!initialData) {
      const draft = {
        commonData,
        sections: sections.map(({ selectedFiles, isUploading, uploadProgress, ...rest }) => rest)
      };
      localStorage.setItem(`workLogDraft_v2_${user}`, JSON.stringify(draft));
    }
  }, [commonData, sections, user, initialData]);

  // --- Edit Mode Initialization ---
  useEffect(() => {
    if (initialData) {
      setCommonData({
        date: initialData.date,
        project: initialData.project,
      });

      let startTime = '';
      let endTime = '';
      if (initialData.timeSlot) {
        const parts = initialData.timeSlot.split('-');
        if (parts.length === 2) {
          startTime = parts[0];
          endTime = parts[1];
        }
      }

      setSections([{
        id: initialData.id, // Use actual ID for update
        startTime,
        endTime,
        distinction: initialData.distinction,
        floor: initialData.floor,
        term: initialData.term,
        engineeringItem: initialData.engineeringItem,
        isCompleted: initialData.isCompleted,
        content: initialData.content,
        photoUrls: initialData.photoUrls || [],
        folderUrl: initialData.folderUrl,
        selectedFiles: [],
        uploadProgress: 0,
        isUploading: false,
      }]);
    }
  }, [initialData]);

  const projectOptions = useMemo(() => {
    if (!projects) return [];
    return [...new Set(projects.map(p => p.projectName))];
  }, [projects]);

  const termOptions = useMemo(() => {
    if (!commonData.project || !projects) return [];
    const relatedProjects = projects.filter(p => p.projectName === commonData.project && p.term && p.engineeringItem);
    const uniqueOptions = relatedProjects.reduce((acc, p) => {
      const label = `${p.term} - ${p.engineeringItem}`;
      if (!acc.some(item => item.label === label)) {
        acc.push({ label: label, value: p.term });
      }
      return acc;
    }, []);
    return uniqueOptions;
  }, [commonData.project, projects]);

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

  // --- Handlers ---

  const handleCommonChange = (e) => {
    const { name, value } = e.target;
    setCommonData(prev => ({ ...prev, [name]: value }));
  };

  const handleProjectChange = (event, newValue) => {
    setCommonData(prev => ({ ...prev, project: newValue || '' }));
    // Reset term/engineeringItem in all sections as project changed
    setSections(prev => prev.map(s => ({ ...s, term: '', engineeringItem: '' })));
  };

  const handleSectionChange = (id, field, value) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleTermChange = (id, newValue) => {
    if (newValue) {
      const parts = newValue.label.split(' - ');
      const term = newValue.value;
      const engineeringItem = parts[1] || '';
      setSections(prev => prev.map(s => s.id === id ? { ...s, term, engineeringItem } : s));
    } else {
      setSections(prev => prev.map(s => s.id === id ? { ...s, term: '', engineeringItem: '' } : s));
    }
  };

  const addSection = () => {
    setSections(prev => [...prev, {
      id: Date.now(),
      startTime: '',
      endTime: '',
      distinction: '',
      floor: '',
      term: '',
      engineeringItem: '',
      isCompleted: '否',
      content: DEFAULT_CONTENT,
      photoUrls: [],
      folderUrl: '',
      selectedFiles: [],
      uploadProgress: 0,
      isUploading: false,
    }]);
  };

  const removeSection = (id) => {
    if (sections.length > 1) {
      setSections(prev => prev.filter(s => s.id !== id));
    }
  };

  // --- Image Handling ---

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const maxWidth = 1024;
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
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve({ dataUrl, fileName: file.name.replace(/\.[^/.]+$/, ".jpg") });
        };
      };
    });
  };

  const handleFileChange = (id, event) => {
    const files = Array.from(event.target.files);
    const fileObjects = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setSections(prev => prev.map(s => s.id === id ? { ...s, selectedFiles: [...s.selectedFiles, ...fileObjects] } : s));
  };

  const handleRemoveFile = (sectionId, previewUrl) => {
    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, selectedFiles: s.selectedFiles.filter(f => f.preview !== previewUrl) } : s
    ));
  };

  const handleRemoveExistingPhoto = (sectionId, urlToRemove) => {
    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, photoUrls: s.photoUrls.filter(u => u !== urlToRemove) } : s
    ));
  };

  // --- Validation ---
  const validate = () => {
    const newErrors = {};
    if (!commonData.date) newErrors.date = '必須選擇日期';
    if (!commonData.project) newErrors.project = '必須選擇案場';

    sections.forEach(s => {
      if (!s.term) newErrors[`term_${s.id}`] = '必須選擇期數';
      if (!s.startTime) newErrors[`startTime_${s.id}`] = '必須選擇開始時間';
      if (!s.endTime) newErrors[`endTime_${s.id}`] = '必須選擇結束時間';
      if (s.startTime && s.endTime && s.startTime >= s.endTime) {
        newErrors[`endTime_${s.id}`] = '結束時間必須晚於開始時間';
      }
      if (!s.content.trim() || s.content === DEFAULT_CONTENT) newErrors[`content_${s.id}`] = '必須填寫工作內容';
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Submission ---

  const handleSubmit = async () => {
    if (!validate()) return;

    // Prepare payloads
    const payloads = [];

    for (const section of sections) {
      // Upload images for this section if any
      let uploadedUrls = [...section.photoUrls];
      let folderUrl = section.folderUrl;

      if (section.selectedFiles.length > 0) {
        // Set uploading state for this section
        setSections(prev => prev.map(s => s.id === section.id ? { ...s, isUploading: true, uploadProgress: 0 } : s));

        try {
          const compressedFiles = await Promise.all(
            section.selectedFiles.map(async ({ file }) => await compressImage(file))
          );

          const batchPayload = {
            files: compressedFiles.map(({ dataUrl, fileName }) => ({ fileData: dataUrl, fileName })),
            date: commonData.date,
            project: commonData.project,
            term: section.term // Use term for folder organization
          };

          // Fake progress
          const progressInterval = setInterval(() => {
            setSections(prev => prev.map(s => {
              if (s.id === section.id && s.uploadProgress < 90) {
                return { ...s, uploadProgress: s.uploadProgress + 10 };
              }
              return s;
            }));
          }, 300);

          const uploadResult = await postRequest('uploadImages', batchPayload);
          clearInterval(progressInterval);

          if (uploadResult.status === 'success') {
            uploadedUrls.push(...uploadResult.urls);
            folderUrl = uploadResult.folderUrl;
          } else {
            throw new Error(uploadResult.message || '上傳失敗');
          }
        } catch (error) {
          console.error(`Section ${section.id} upload failed:`, error);
          alert(`區段上傳失敗: ${error.message}`);
          setSections(prev => prev.map(s => s.id === section.id ? { ...s, isUploading: false } : s));
          return; // Stop submission on error
        }
      }

      payloads.push({
        id: initialData ? section.id : undefined, // Only include ID if editing
        date: commonData.date,
        user: user,
        project: commonData.project,
        timeSlot: `${section.startTime}-${section.endTime}`,
        distinction: section.distinction,
        floor: section.floor,
        term: section.term,
        engineeringItem: section.engineeringItem,
        isCompleted: section.isCompleted,
        content: section.content,
        photoUrls: uploadedUrls,
        folderUrl: folderUrl
      });
    }

    // Submit all payloads
    if (initialData) {
      // Edit mode: currently only supports editing single entry passed via initialData
      // So payloads[0] is the one to update
      await onSubmit(payloads[0]);
    } else {
      // Batch submit
      await onSubmit(payloads);
      // Clear draft
      localStorage.removeItem(`workLogDraft_v2_${user}`);
    }
  };

  return (
    <Box sx={{ pb: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom align="center" sx={{ mb: 3 }}>
        {initialData ? '編輯工作日誌' : '工作日誌'}
      </Typography>

      {draftSaved && <Alert severity="info" sx={{ mb: 2 }}>已自動載入草稿</Alert>}

      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom color="primary">基本資訊</Typography>
        <Stack spacing={2}>
          <TextField name="date" label="日期" type="date" value={commonData.date} onChange={handleCommonChange} error={!!errors.date} helperText={errors.date} InputLabelProps={{ shrink: true }} fullWidth />
          <TextField label="工作人員" value={user} disabled fullWidth />
          <Autocomplete
            fullWidth
            options={projectOptions}
            value={commonData.project}
            onChange={handleProjectChange}
            isOptionEqualToValue={(option, value) => option === value}
            renderInput={(params) => (<TextField {...params} label="案場" error={!!errors.project} helperText={errors.project} />)}
          />
        </Stack>
      </Paper>

      {sections.map((section, index) => (
        <Card key={section.id} variant="outlined" sx={{ mb: 3, borderRadius: 2, position: 'relative' }}>
          <CardHeader
            title={`工作區段 ${index + 1}`}
            action={
              !initialData && sections.length > 1 && (
                <IconButton onClick={() => removeSection(section.id)} color="error">
                  <RemoveCircle />
                </IconButton>
              )
            }
            sx={{ bgcolor: 'grey.50', py: 1 }}
          />
          <CardContent>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl fullWidth error={!!errors[`startTime_${section.id}`]}>
                  <InputLabel>開始時間</InputLabel>
                  <Select value={section.startTime} label="開始時間" onChange={(e) => handleSectionChange(section.id, 'startTime', e.target.value)}>
                    {timeOptions.map((time, i) => <MenuItem key={i} value={time}>{time}</MenuItem>)}
                  </Select>
                  {errors[`startTime_${section.id}`] && <Typography color="error" variant="caption">{errors[`startTime_${section.id}`]}</Typography>}
                </FormControl>
                <FormControl fullWidth error={!!errors[`endTime_${section.id}`]}>
                  <InputLabel>結束時間</InputLabel>
                  <Select value={section.endTime} label="結束時間" onChange={(e) => handleSectionChange(section.id, 'endTime', e.target.value)}>
                    {timeOptions.map((time, i) => <MenuItem key={i} value={time}>{time}</MenuItem>)}
                  </Select>
                  {errors[`endTime_${section.id}`] && <Typography color="error" variant="caption">{errors[`endTime_${section.id}`]}</Typography>}
                </FormControl>
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField label="區別 (例如: A棟)" fullWidth value={section.distinction} onChange={(e) => handleSectionChange(section.id, 'distinction', e.target.value)} />
                <TextField label="樓層 (例如: 1F)" fullWidth value={section.floor} onChange={(e) => handleSectionChange(section.id, 'floor', e.target.value)} />
              </Stack>

              <Autocomplete
                fullWidth
                options={termOptions}
                getOptionLabel={(option) => option.label || ''}
                value={termOptions.find(option => option.value === section.term) || null}
                onChange={(e, val) => handleTermChange(section.id, val)}
                disabled={!commonData.project}
                renderInput={(params) => <TextField {...params} label="期數與工程項目" error={!!errors[`term_${section.id}`]} helperText={errors[`term_${section.id}`]} />}
              />

              <FormControl fullWidth>
                <InputLabel>當期是否完工</InputLabel>
                <Select value={section.isCompleted} label="當期是否完工" onChange={(e) => handleSectionChange(section.id, 'isCompleted', e.target.value)}>
                  <MenuItem value="是">是</MenuItem>
                  <MenuItem value="否">否</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="工作內容"
                multiline
                rows={4}
                fullWidth
                value={section.content}
                onChange={(e) => handleSectionChange(section.id, 'content', e.target.value)}
                error={!!errors[`content_${section.id}`]}
                helperText={errors[`content_${section.id}`]}
              />

              <Box>
                <Typography variant="subtitle2" gutterBottom>相關照片 (將儲存於期數資料夾)</Typography>

                {/* Existing Photos */}
                {section.photoUrls.length > 0 && (
                  <Grid container spacing={1} sx={{ mb: 1 }}>
                    {section.photoUrls.map((url, idx) => (
                      <Grid item key={idx} xs={4} sm={3}>
                        <Paper sx={{ position: 'relative' }}>
                          <img src={url} alt="existing" style={{ width: '100%', height: 'auto', display: 'block' }} />
                          <IconButton onClick={() => handleRemoveExistingPhoto(section.id, url)} size="small" sx={{ position: 'absolute', top: 0, right: 0, color: 'white', bgcolor: 'rgba(0,0,0,0.5)' }}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                )}

                <Button variant="outlined" component="label" startIcon={<PhotoCamera />} size="small" disabled={section.isUploading}>
                  選擇照片
                  <input type="file" hidden multiple accept="image/*" onChange={(e) => handleFileChange(section.id, e)} />
                </Button>

                {section.isUploading && (
                  <Box sx={{ width: '100%', mt: 1 }}>
                    <LinearProgress variant="determinate" value={section.uploadProgress} />
                  </Box>
                )}

                <Grid container spacing={1} sx={{ mt: 1 }}>
                  {section.selectedFiles.map(({ preview }, idx) => (
                    <Grid item key={idx} xs={4} sm={3}>
                      <Paper sx={{ position: 'relative' }}>
                        <img src={preview} alt="preview" style={{ width: '100%', height: 'auto', display: 'block' }} />
                        <IconButton onClick={() => handleRemoveFile(section.id, preview)} size="small" sx={{ position: 'absolute', top: 0, right: 0, color: 'white', bgcolor: 'rgba(0,0,0,0.5)' }}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      ))}

      {!initialData && (
        <Button variant="dashed" fullWidth startIcon={<AddCircle />} onClick={addSection} sx={{ mb: 4, border: '1px dashed', borderColor: 'primary.main' }}>
          新增工作區段
        </Button>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="outlined" onClick={() => initialData ? onCancelEdit() : navigateTo(1)} disabled={isSubmitting || sections.some(s => s.isUploading)}>
          {initialData ? '取消編輯' : '返回主選單'}
        </Button>
        <Button variant="contained" color="primary" onClick={handleSubmit} disabled={isSubmitting || sections.some(s => s.isUploading)} startIcon={(isSubmitting || sections.some(s => s.isUploading)) ? <CircularProgress size={20} color="inherit" /> : null}>
          {sections.some(s => s.isUploading) ? '照片上傳中...' : (initialData ? '儲存變更' : '提交所有日誌')}
        </Button>
      </Box>
    </Box>
  );
};

export default WorkLogPage;
