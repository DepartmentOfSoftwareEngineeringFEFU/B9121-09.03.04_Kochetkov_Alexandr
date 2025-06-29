import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { motion } from 'framer-motion';
import { driverInfoChangeService } from '../services/apiService';

const MotionPaper = motion(Paper);
const MotionTableRow = motion(TableRow);


export const DriverInfoChangeRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const translateStatus = {
	pending: 'Ожидает',
	approved: 'Одобрено',
	rejected: 'Отклонено',
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const data = await driverInfoChangeService.getDriverInfoChangeRequests();
      setRequests(data);
    } catch (error) {
      console.error('Ошибка при загрузке заявок:', error);
      setSnackbar({
        open: true,
        message: 'Ошибка при загрузке заявок. Проверьте подключение к серверу.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (request) => {
    if (!request) {
      console.error('Попытка открыть диалог с пустым запросом');
      return;
    }
    setSelectedRequest(request);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRequest(null);
  };

  const handleApprove = async () => {
    try {
      await driverInfoChangeService.approveRequest(selectedRequest.id);
      setSnackbar({
        open: true,
        message: 'Заявка успешно одобрена',
        severity: 'success'
      });
      fetchRequests();
      handleCloseDialog();
    } catch (error) {
      console.error('Ошибка:', error);
      setSnackbar({
        open: true,
        message: 'Ошибка при одобрении заявки',
        severity: 'error'
      });
    }
  };

  const handleReject = async () => {
    try {
      await driverInfoChangeService.rejectRequest(selectedRequest.id);
      setSnackbar({
        open: true,
        message: 'Заявка отклонена',
        severity: 'success'
      });
      fetchRequests();
      handleCloseDialog();
    } catch (error) {
      console.error('Ошибка:', error);
      setSnackbar({
        open: true,
        message: 'Ошибка при отклонении заявки',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Заявки на изменение информации
        </Typography>
        
        <TableContainer component={MotionPaper} sx={{ mt: 3 }}>
          <Table>
            <TableHead>
              <MotionTableRow>
                <TableCell>ID</TableCell>
                <TableCell>Водитель</TableCell>
                <TableCell>Тип изменения</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell>Дата</TableCell>
                <TableCell>Действия</TableCell>
              </MotionTableRow>
            </TableHead>
            <TableBody>
              {requests.map((request) => (
                <MotionTableRow key={request.id}>
                  <TableCell>{request.id}</TableCell>
                  <TableCell>{`${request.firstName} ${request.lastName}`}</TableCell>
                  <TableCell>
                    {request.licenseNumber !== request.currentLicenseNumber && 'Номер водительского удостоверения, '}
                    {request.carNumber !== request.currentCarNumber && 'Номер автомобиля, '}
                    {request.carBrand !== request.currentCarBrand && 'Марка автомобиля, '}
                    {request.carModel !== request.currentCarModel && 'Модель автомобиля, '}
                    {request.carColor !== request.currentCarColor && 'Цвет автомобиля'}
                    {request.licensePhotoPath !== request.currentLicensePhotoPath && 'Фото водительского удостоверения'}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={translateStatus[request.status]} 
                      color={request.status === 'pending' ? 'warning' : request.status === 'approved' ? 'success' : 'error'}
                    />
                  </TableCell>
                  <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleOpenDialog(request)}
                    >
                      Просмотр
                    </Button>
                  </TableCell>
                </MotionTableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>Детали заявки на изменение данных</DialogTitle>
          <DialogContent>
            {selectedRequest && (
              <>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>Информация о водителе</Typography>
                  <Typography><strong>ID:</strong> {selectedRequest.userId}</Typography>
                  <Typography><strong>Имя:</strong> {selectedRequest.firstName} {selectedRequest.lastName}</Typography>
                  <Typography><strong>Email:</strong> {selectedRequest.email}</Typography>
                </Box>

                <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="h6" gutterBottom>Текущие данные</Typography>
                  <Typography><strong>Номер водительского удостоверения:</strong> {selectedRequest.currentLicenseNumber || 'Не указан'}</Typography>
                  <Typography><strong>Номер автомобиля:</strong> {selectedRequest.currentCarNumber || 'Не указан'}</Typography>
                  <Typography><strong>Марка автомобиля:</strong> {selectedRequest.currentCarBrand || 'Не указана'}</Typography>
                  <Typography><strong>Модель автомобиля:</strong> {selectedRequest.currentCarModel || 'Не указана'}</Typography>
                  <Typography><strong>Цвет автомобиля:</strong> {selectedRequest.currentCarColor || 'Не указан'}</Typography>
                </Box>

                <Box sx={{ mb: 3, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                  <Typography variant="h6" gutterBottom>Новые данные</Typography>
                  <Typography><strong>Номер водительского удостоверения:</strong> {selectedRequest.licenseNumber}</Typography>
                  <Typography><strong>Номер автомобиля:</strong> {selectedRequest.carNumber}</Typography>
                  <Typography><strong>Марка автомобиля:</strong> {selectedRequest.carBrand}</Typography>
                  <Typography><strong>Модель автомобиля:</strong> {selectedRequest.carModel}</Typography>
                  <Typography><strong>Цвет автомобиля:</strong> {selectedRequest.carColor}</Typography>
                </Box>

                {selectedRequest && selectedRequest.licensePhotoPath && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" gutterBottom>Фото водительского удостоверения:</Typography>
                    <img
                      src={driverInfoChangeService.getLicensePhoto(selectedRequest.licensePhotoPath)}
                      alt="ВУ"
                      style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 4, border: '1px solid #ccc' }}
                    />
                  </Box>
                )}

                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>Дополнительная информация</Typography>
                  <Typography><strong>Статус:</strong> {translateStatus[selectedRequest.status]}</Typography>
                  <Typography><strong>Дата создания:</strong> {new Date(selectedRequest.createdAt).toLocaleString()}</Typography>
                  <Typography><strong>Дата обновления:</strong> {new Date(selectedRequest.updatedAt).toLocaleString()}</Typography>
                </Box>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Закрыть</Button>
            {selectedRequest?.status === 'pending' && (
              <>
                <Button 
                  onClick={handleReject} 
                  color="error"
                  variant="outlined"
                >
                  Отклонить
                </Button>
                <Button 
                  onClick={handleApprove} 
                  color="success"
                  variant="contained"
                >
                  Одобрить
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </motion.div>
  );
};