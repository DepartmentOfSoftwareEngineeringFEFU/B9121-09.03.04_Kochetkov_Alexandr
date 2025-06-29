import React from 'react';
import { AppBar, Toolbar, Typography, Button, Container, Box } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const headerButtonStyle = {
    fontSize: '1rem',
    padding: '8px 16px',
    mx: 0.5,
    fontWeight: 500
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar sx={{ minHeight: '64px', py: 0.5 }}>
          <Typography 
            variant="h6" 
            component={RouterLink} 
            to="/" 
            sx={{ 
              flexGrow: 1, 
              textDecoration: 'none', 
              color: 'inherit',
              fontSize: '1.3rem',
              fontWeight: 600 
            }}
          >
            FEFU Drive
          </Typography>
          {user ? (
            <>
              <Button 
                color="inherit" 
                component={RouterLink} 
                to="/trips"
                sx={headerButtonStyle}
              >
                Поездки
              </Button>
              <Button 
                color="inherit" 
                component={RouterLink} 
                to="/profile"
                sx={headerButtonStyle}
              >
                Профиль
              </Button>
              <Button 
                color="inherit" 
                onClick={handleLogout}
                sx={headerButtonStyle}
              >
                Выйти
              </Button>
            </>
          ) : (
            <>
              <Button 
                color="inherit" 
                component={RouterLink} 
                to="/login"
                sx={headerButtonStyle}
              >
                Войти
              </Button>
              <Button 
                color="inherit" 
                component={RouterLink} 
                to="/register"
                sx={headerButtonStyle}
              >
                Регистрация
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Container component="main" sx={{ mt: 4, mb: 4, flex: 1 }}>
        {children}
      </Container>
      <Box component="footer" sx={{ py: 3, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} FEFU Drive. Все права защищены.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout; 