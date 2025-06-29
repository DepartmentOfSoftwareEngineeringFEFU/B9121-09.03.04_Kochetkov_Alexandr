import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Grid, 
  Link,
  Alert,
  Snackbar 
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Введите корректный email')
    .required('Email обязателен'),
  password: Yup.string()
    .required('Пароль обязателен')
});

const Login = () => {
  const navigate = useNavigate();
  const { login, error, user, clearError } = useAuth();
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
    
    if (error) {
      setSnackbarOpen(true);
    }
  }, [user, navigate, error]);

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
    clearError();
  };

  const formik = useFormik({
    initialValues: {
      email: '',
      password: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      const success = await login(values.email, values.password);
      if (success) {
        navigate('/');
      } else {
        setSnackbarOpen(true);
      }
    }
  });

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Вход в систему
        </Typography>
        <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            fullWidth
            id="email"
            label="Email"
            name="email"
            autoComplete="email"
            autoFocus
            value={formik.values.email}
            onChange={formik.handleChange}
            error={formik.touched.email && Boolean(formik.errors.email)}
            helperText={formik.touched.email && formik.errors.email}
          />
          <TextField
            margin="normal"
            fullWidth
            name="password"
            label="Пароль"
            type="password"
            id="password"
            autoComplete="current-password"
            value={formik.values.password}
            onChange={formik.handleChange}
            error={formik.touched.password && Boolean(formik.errors.password)}
            helperText={formik.touched.password && formik.errors.password}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={formik.isSubmitting}
          >
            Войти
          </Button>
          <Grid container>
            <Grid item>
              <Link href="/register" variant="body2">
                {"Нет аккаунта? Зарегистрироваться"}
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Box>
      
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity="error" 
          sx={{ width: '100%' }}
        >
          {error || 'Ошибка входа в систему'}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Login; 