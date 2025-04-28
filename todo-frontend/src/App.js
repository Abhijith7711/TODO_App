import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import Auth from './components/Auth';
import TaskList from './components/TaskList';
import TaskDetail from './components/TaskDetail';
import authService from './services/authService';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };

  if (loading) {
    return null;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="App">
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
          <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            {user ? (
              <Box>
                <Box sx={{ 
                  p: 2, 
                  display: 'flex', 
                  justifyContent: 'flex-end',
                  bgcolor: 'primary.main',
                  color: 'white'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <span>Welcome, {user.user?.username}</span>
                    <button 
                      onClick={handleLogout}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: 'white',
                        color: '#1976d2',
                        cursor: 'pointer'
                      }}
                    >
                      Logout
                    </button>
                  </Box>
                </Box>
                <Routes>
                  <Route path="/tasks" element={<TaskList />} />
                  <Route path="/tasks/:id" element={<TaskDetail />} />
                  <Route path="/" element={<Navigate to="/tasks" replace />} />
                </Routes>
              </Box>
            ) : (
              <Auth onLoginSuccess={handleLoginSuccess} />
            )}
          </Box>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
