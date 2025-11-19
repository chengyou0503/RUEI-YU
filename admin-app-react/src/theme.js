import { createTheme } from '@mui/material/styles';

// 引入 Google Fonts 的 Noto Sans TC
const theme = createTheme({
  palette: {
    primary: {
      main: '#2c3e50', // 深藍灰色
    },
    secondary: {
      main: '#f39c12', // 琥珀色
    },
    background: {
      default: '#f4f6f8', // 柔和的淺灰色背景
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: [
      '"Noto Sans TC"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif'
    ].join(','),
    h4: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12, // 更圓滑的邊角
          boxShadow: '0 4px 12px 0 rgba(0,0,0,0.08)', // 更細緻的陰影
          transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 24px 0 rgba(0,0,0,0.12)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none', // 讓按鈕文字不是全大寫
        },
      },
    },
  },
});

export default theme;
