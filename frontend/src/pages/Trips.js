import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  CircularProgress,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  TextField,
  Snackbar,
  Alert
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { tripsService, reviewService } from '../services/apiService';
import { useNavigate } from 'react-router-dom';
import TripList from '../components/TripList';
import DriverTripList from '../components/DriverTripList';

function cleanAddress(address) {
  if (!address) return '';
  return address
    .replace('Приморский край, Владивосток, ', '')
    .trim();
}

const statusLabels = {
  created: 'Создана',
  active: 'В пути',
  completed: 'Завершена',
  cancelled: 'Отменена',
};

const TripStatusChip = ({ status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'created':
        return 'success';
      case 'active':
        return 'warning';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = () => {
    return statusLabels[status] || status;
  };

  return (
    <Chip
      label={getStatusText()}
      color={getStatusColor()}
      size="small"
    />
  );
};

const EmptyListMessage = ({ title }) => {
  let message = 'Поездок пока нет';
  
  if (title.includes('ожидающие')) {
    message = 'В данный момент нет доступных поездок';
  } else if (title.includes('завершенные')) {
    message = 'У вас пока нет завершенных поездок';
  } else if (title.includes('Мои последние')) {
    message = 'У вас пока нет поездок';
  }

  return (
    <Box p={3} textAlign="center">
      <Typography variant="body1" color="textSecondary">
        {message}
      </Typography>
    </Box>
  );
};

const TripsList = ({ trips, title, userId }) => {
  const [openReviewDialog, setOpenReviewDialog] = React.useState(false);
  const [reviewTripId, setReviewTripId] = React.useState(null);
  const [reviewText, setReviewText] = React.useState('');
  const [reviewRating, setReviewRating] = React.useState(5);
  const [reviewedTrips, setReviewedTrips] = React.useState([]);
  const [activePassengerTripIds, setActivePassengerTripIds] = React.useState([]);
  const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'success' });

  React.useEffect(() => {
    if (!trips || !userId) return;
    const checkReviews = async () => {
      const reviewed = [];
      for (const trip of trips) {
        try {
          const reviews = await reviewService.getTripReviews(trip.id);
          if (reviews.some(r => r.passengerId === userId)) {
            reviewed.push(trip.id);
          }
        } catch {}
      }
      setReviewedTrips(reviewed);
    };
    checkReviews();
  }, [trips, userId]);

  React.useEffect(() => {
    const fetchActivePassengerTrips = async () => {
      try {
        const joinedTrips = await tripsService.getJoinedTrips();
        setActivePassengerTripIds(joinedTrips.map(t => t.id));
      } catch (e) {
        setActivePassengerTripIds([]);
      }
    };
    fetchActivePassengerTrips();
  }, [userId]);

  const handleOpenReview = async (tripId) => {
    setReviewTripId(tripId);
    setReviewText('');
    setReviewRating(5);
    setOpenReviewDialog(true);
  };

  const handleCloseReview = () => {
    setOpenReviewDialog(false);
    setReviewTripId(null);
  };

  const handleSubmitReview = async () => {
    try {
      await reviewService.addReview({ tripId: reviewTripId, text: reviewText, rating: reviewRating });
      setReviewedTrips([...reviewedTrips, reviewTripId]);
      setSnackbar({ open: true, message: 'Отзыв успешно отправлен!', severity: 'success' });
      handleCloseReview();
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Ошибка при отправке отзыва', severity: 'error' });
    }
  };

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  if (!trips || trips.length === 0) {
    return (
      <Box mb={4}>
        <Typography variant="h5" gutterBottom>
          {title}
        </Typography>
        <Paper elevation={2}>
          <EmptyListMessage title={title} />
        </Paper>
      </Box>
    );
  }

  return (
    <Box mb={4}>
      <Typography variant="h5" gutterBottom>
        {title}
      </Typography>
      <Paper elevation={2}>
        <List>
          {trips.map((trip, index) => (
            <React.Fragment key={trip.id}>
              <ListItem alignItems="flex-start">
                <ListItemText
                  primary={
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6">
                        {cleanAddress(trip.startAddress)} → {cleanAddress(trip.endAddress)}
                      </Typography>
                      <TripStatusChip status={trip.status} />
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography component="span" variant="body2" color="textPrimary">
                        {format(new Date(trip.scheduledDate), 'PPPp', { locale: ru })}
                      </Typography>
                      <br />
                      <Typography component="span" variant="body2" color="textSecondary">
                        Цена: {trip.price} ₽
                        {trip.estimatedDuration && (
                          <>
                            <br />
                            Примерное время в пути: {trip.estimatedDuration} мин.
                          </>
                        )}
                        {trip.status === 'completed' && trip.actual_time && (
                          <>
                            <br />
                            Фактическое время в пути: {trip.actual_time} мин.
                          </>
                        )}
                      </Typography>
                       {trip.status === 'completed' && activePassengerTripIds.includes(trip.id) && reviewedTrips && !reviewedTrips.includes(trip.id) && (
                        <Box mt={1}>
                          <Button variant="outlined" color="primary" size="small" onClick={() => handleOpenReview(trip.id)}>
                            Оставить отзыв
                          </Button>
                        </Box>
                      )}
                    </>
                  }
                />
              </ListItem>
              {index < trips.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Paper>
      <Dialog open={openReviewDialog} onClose={handleCloseReview}>
        <DialogTitle>Оставить отзыв о поездке</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Rating
              value={reviewRating}
              onChange={(_, value) => setReviewRating(value)}
              max={5}
            />
          </Box>
          <TextField
            label="Комментарий"
            multiline
            minRows={3}
            fullWidth
            value={reviewText}
            onChange={e => setReviewText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReview}>Отмена</Button>
          <Button onClick={handleSubmitReview} variant="contained" color="primary">Отправить</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

const Trips = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [completedTrips, setCompletedTrips] = useState([]);
  const [driverTrips, setDriverTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeDriverTrip, setActiveDriverTrip] = useState(null);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        if (user.is_driver) {
          const [driverTripsData] = await Promise.all([
            tripsService.getDriverRecentTrips(3)
          ]);
          setDriverTrips(driverTripsData);
          const active = driverTripsData.find(trip => trip.status === 'created' || trip.status === 'active');
          setActiveDriverTrip(active || null);
        } else {
          const [completedTripsData] = await Promise.all([
            tripsService.getRecentCompletedTrips(5)
          ]);
          setCompletedTrips(completedTripsData);
        }
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Ошибка при загрузке поездок');
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, [user.is_driver]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography color="error" variant="h6" gutterBottom>
          {error}
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box mt={4}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h4">
                {user.is_driver ? 'Мои поездки' : 'Доступные поездки'}
              </Typography>
              {user.is_driver ? (
                activeDriverTrip ? (
                  <Box>
                    <Button variant="contained" color="primary" disabled>
                      Создать поездку
                    </Button>
                    <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                      У вас уже есть активная поездка. Завершите или отмените её, чтобы создать новую.
                    </Typography>
                  </Box>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/create-trip')}
                  >
                    Создать поездку
                  </Button>
                )
              ) : null}
            </Box>
          </Grid>

          {user.is_driver ? (
            <>
              <Grid item xs={12}>
                <DriverTripList
                  trips={driverTrips}
                  onStatusChange={() => window.location.reload()}
                />
              </Grid>
              <Grid item xs={12}>
                <TripList />
              </Grid>
            </>
          ) : (
            <>
              <Grid item xs={12}>
                <TripList />
              </Grid>
              <Grid item xs={12}>
                <TripsList
                  trips={completedTrips}
                  title="Последние завершенные поездки"
                  userId={user.id}
                />
              </Grid>
            </>
          )}
        </Grid>
      </Box>
    </Container>
  );
};

export default Trips; 