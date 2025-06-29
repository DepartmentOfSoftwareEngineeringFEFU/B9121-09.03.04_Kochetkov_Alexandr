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
  Alert,
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material';
import { authService } from '../services/apiService';
import { motion } from 'framer-motion';

const MotionPaper = motion(Paper);
const MotionTableRow = motion(TableRow);

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [openPhoto, setOpenPhoto] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await authService.getDriverApplications();
      const pendingApplications = response.data.filter(app => app.status === 'pending');
      setApplications(pendingApplications);
      setError(null);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError(err.response?.data?.message || 'Ошибка при загрузке заявок');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await authService.updateDriverApplicationStatus(id, { status });
      setSnackbar({
        open: true,
        message: 'Статус заявки успешно обновлен',
        severity: 'success'
      });
      fetchApplications();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Ошибка при обновлении статуса',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenPhoto = (filename) => {
    setPhotoUrl(authService.getLicensePhoto(filename));
    setOpenPhoto(true);
  };

  const handleClosePhoto = () => {
    setOpenPhoto(false);
    setPhotoUrl('');
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
          Заявки на водителя (на рассмотрении)
        </Typography>

        {error && (
          <Typography color="error" variant="body1" gutterBottom>
            {error}
          </Typography>
        )}

        <MotionPaper elevation={2} sx={{ mt: 4 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <MotionTableRow>
                  <TableCell>Пользователь</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Номер ВУ</TableCell>
                  <TableCell>Номер автомобиля</TableCell>
                  <TableCell>Марка</TableCell>
                  <TableCell>Модель</TableCell>
                  <TableCell>Цвет</TableCell>
                  <TableCell>Фото ВУ</TableCell>
                  <TableCell align="center">Действия</TableCell>
                </MotionTableRow>
              </TableHead>
              <TableBody>
                {applications && applications.length > 0 ? (
                  applications.map((application) => (
                    <MotionTableRow key={application.id}>
                      <TableCell>
                        {application.firstName} {application.lastName}
                      </TableCell>
                      <TableCell>{application.email}</TableCell>
                      <TableCell>{application.licenseNumber}</TableCell>
                      <TableCell>{application.carNumber}</TableCell>
                      <TableCell>{application.carBrand}</TableCell>
                      <TableCell>{application.carModel}</TableCell>
                      <TableCell>{application.carColor}</TableCell>
                      <TableCell>
                        {application.licensePhotoPath ? (
                          <img
                            src={authService.getLicensePhoto(application.licensePhotoPath)}
                            alt="ВУ"
                            style={{ width: 48, height: 32, objectFit: 'cover', cursor: 'pointer', borderRadius: 4, border: '1px solid #ccc' }}
                            onClick={() => handleOpenPhoto(application.licensePhotoPath)}
                          />
                        ) : (
                          <span style={{ color: '#aaa' }}>Нет</span>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          color="success"
                          variant="contained"
                          onClick={() => handleStatusChange(application.id, 'approved')}
                          sx={{ mr: 1 }}
                        >
                          Одобрить
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          variant="contained"
                          onClick={() => handleStatusChange(application.id, 'rejected')}
                        >
                          Отклонить
                        </Button>
                      </TableCell>
                    </MotionTableRow>
                  ))
                ) : (
                  <MotionTableRow>
                    <TableCell colSpan={9} align="center">
                      Нет заявок на рассмотрении
                    </TableCell>
                  </MotionTableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </MotionPaper>
      </Box>

      <Dialog open={openPhoto} onClose={handleClosePhoto} maxWidth="md">
        <DialogTitle>Фотография водительского удостоверения</DialogTitle>
        <DialogContent>
          <img src={photoUrl} alt="ВУ" style={{ maxWidth: '100%', maxHeight: 600 }} />
        </DialogContent>
      </Dialog>

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

export default Applications; 