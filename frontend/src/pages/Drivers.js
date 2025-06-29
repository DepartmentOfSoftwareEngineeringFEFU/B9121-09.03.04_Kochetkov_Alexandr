import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { authService } from '../services/apiService';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

const Drivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [openPhotoDialog, setOpenPhotoDialog] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(null);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const response = await authService.getDrivers();
      setDrivers(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching drivers:', err);
      setError(err.response?.data?.message || 'Ошибка при загрузке списка водителей');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeDriver = async (userId) => {
    try {
      await authService.revokeDriverStatus(userId);
      
      setSnackbar({
        open: true,
        message: 'Статус водителя успешно отозван',
        severity: 'success'
      });
      fetchDrivers();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Ошибка при отзыве статуса водителя',
        severity: 'error'
      });
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

  return (
    <Container maxWidth={false} sx={{ px: 4 }}>
      <Box mt={4}>
        <Typography variant="h4" gutterBottom>
          Список водителей
        </Typography>

        {error && (
          <Typography color="error" variant="body1" gutterBottom>
            {error}
          </Typography>
        )}

        <Paper elevation={2} sx={{ mt: 4 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Пользователь</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Номер ВУ</TableCell>
                  <TableCell>Номер автомобиля</TableCell>
                  <TableCell>Марка</TableCell>
                  <TableCell>Модель</TableCell>
                  <TableCell>Цвет</TableCell>
                  <TableCell align="center">Действия</TableCell>
                  <TableCell align="center">Фото ВУ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {drivers && drivers.length > 0 ? (
                  drivers.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell>
                        {driver.firstName} {driver.lastName}
                      </TableCell>
                      <TableCell>{driver.email}</TableCell>
                      <TableCell>{driver.licenseNumber}</TableCell>
                      <TableCell>{driver.carNumber}</TableCell>
                      <TableCell>{driver.carBrand}</TableCell>
                      <TableCell>{driver.carModel}</TableCell>
                      <TableCell>{driver.carColor}</TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          onClick={() => handleRevokeDriver(driver.id)}
                        >
                          Отозвать статус
                        </Button>
                      </TableCell>
                      <TableCell align="center">
                        {driver.licensePhotoPath ? (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              setPhotoUrl(authService.getLicensePhoto(driver.licensePhotoPath));
                              setOpenPhotoDialog(true);
                            }}
                          >
                            Фото ВУ
                          </Button>
                        ) : (
                          <span style={{ color: '#aaa' }}>—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      Нет водителей в системе
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
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

      <Dialog open={openPhotoDialog} onClose={() => setOpenPhotoDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Фотография водительского удостоверения</DialogTitle>
        <DialogContent>
          {photoUrl ? (
            <img src={photoUrl} alt="Водительское удостоверение" style={{ maxWidth: '100%', maxHeight: 400 }} />
          ) : (
            <Typography>Фотография не найдена</Typography>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default Drivers; 