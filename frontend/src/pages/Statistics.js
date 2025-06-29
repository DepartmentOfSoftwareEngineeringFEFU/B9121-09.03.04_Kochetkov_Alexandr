import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { authService } from '../services/apiService';

const Statistics = () => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await authService.getStatistics();
      setStatistics(response);
      setError(null);
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError(err.response?.data?.message || 'Ошибка при загрузке статистики');
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Ошибка при загрузке статистики',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  const statsData = statistics || {
    totalUsers: 0,
    totalDrivers: 0,
    totalTrips: 0,
    activeTrips: 0,
    completedTrips: 0,
    totalRevenue: 0,
    averageTripPrice: 0,
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0
  };

  return (
    <Container maxWidth={false} sx={{ px: 4 }}>
      <Box mt={4}>
        <Typography variant="h4" gutterBottom>
          Статистика
        </Typography>

        {error && (
          <Typography color="error" variant="body1" gutterBottom>
            {error}
          </Typography>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Пользователи
              </Typography>
              <Typography variant="body1">
                Всего пользователей: {statsData.totalUsers}
              </Typography>
              <Typography variant="body1">
                Водителей: {statsData.totalDrivers}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Поездки
              </Typography>
              <Typography variant="body1">
                Всего поездок: {statsData.totalTrips}
              </Typography>
              <Typography variant="body1">
                Активных поездок: {statsData.activeTrips}
              </Typography>
              <Typography variant="body1">
                Завершенных поездок: {statsData.completedTrips}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Заявки
              </Typography>
              <Typography variant="body1">
                Всего заявок: {statsData.totalApplications}
              </Typography>
              <Typography variant="body1">
                На рассмотрении: {statsData.pendingApplications}
              </Typography>
              <Typography variant="body1">
                Одобренных: {statsData.approvedApplications}
              </Typography>
              <Typography variant="body1">
                Отклоненных: {statsData.rejectedApplications}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Финансы
              </Typography>
              <Typography variant="body1">
                Общая выручка: {statsData.totalRevenue} ₽
              </Typography>
              <Typography variant="body1">
                Средняя стоимость поездки: {Math.round(statsData.averageTripPrice)} ₽
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Statistics; 