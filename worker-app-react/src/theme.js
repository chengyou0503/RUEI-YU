import { createTheme } from '@mui/material/styles';

// 定義一個藍色系的專業主題
const theme = createTheme({
  palette: {
    primary: {
      main: '#0D47A1', // 深藍色
      light: '#5472d3',
      dark: '#002171',
    },
    secondary: {
      main: '#42A5F5', // 亮藍色
      light: '#80d6ff',
      dark: '#0077c2',
    },
    background: {
      default: '#f4f6f8', // 淡灰色背景
      paper: '#ffffff',
    },
    text: {
      primary: '#333333',
      secondary: '#555555',
    }
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none', // 按鈕文字不大寫
          padding: '10px 20px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
          },
        },
      },
    },
    MuiPaper: {
        styleOverrides: {
            root: {
                borderRadius: 12,
            }
        }
    },
    MuiAccordion: {
        styleOverrides: {
            root: {
                boxShadow: 'none',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                '&:before': {
                    display: 'none',
                },
            }
        }
    }
  },
});

export default theme;
