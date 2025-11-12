import React from 'react';
import { Card, CardContent, Typography, Box, Link } from '@mui/material';

const LogCard = ({ log }) => {
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="div">
            <Box component="span" sx={{ fontWeight: 'bold', color: 'primary.main' }}>#{log.id}</Box> - {log.project}
          </Typography>
          {log.folderUrl && (
            <Link href={log.folderUrl} target="_blank" rel="noopener noreferrer">
              查看照片資料夾
            </Link>
          )}
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          記錄人: {log.user} | 日期: {log.date}
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">時段</Typography>
            <Typography>{log.timeSlot || '未填寫'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">區別</Typography>
            <Typography>{log.distinction || '未填寫'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">樓層</Typography>
            <Typography>{log.floor || '未填寫'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">期數</Typography>
            <Typography>{log.term || '未填寫'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">工程項目</Typography>
            <Typography>{log.engineeringItem || '未填寫'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">當期完工</Typography>
            <Typography>{log.isCompleted}</Typography>
          </Box>
        </Box>

        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 2 }}>工作內容</Typography>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {log.content}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default LogCard;
