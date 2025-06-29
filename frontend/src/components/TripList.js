import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Tooltip,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { tripService } from "../services/apiService";
import { toast } from "react-toastify";
import Loading from "./Loading";
import { ArrowDownward, ArrowUpward } from "@mui/icons-material";
import { reviewService } from '../services/apiService';
import Rating from '@mui/material/Rating';
import apiService from '../services/apiService';

function cleanAddress(address) {
  if (!address) return '';
  return address
    .replace('Приморский край, Владивосток, ', '')
    .trim();
}

const TripList = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    date: null,
  });
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [showPassengersDialog, setShowPassengersDialog] = useState(false);
  const navigate = useNavigate();
  const [activeTrip, setActiveTrip] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [showAll, setShowAll] = useState(false);
  const debounceRef = useRef();
  const [openReviewsDialog, setOpenReviewsDialog] = useState(false);
  const [driverRatings, setDriverRatings] = useState({});
  const [driverReviewsById, setDriverReviewsById] = useState({});
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedDriverName, setSelectedDriverName] = useState('');

  useEffect(() => {
    const fetchActiveTrip = async () => {
      try {
        const trip = await tripService.getActiveTrip();
        setActiveTrip(trip && trip.id ? trip : null);
      } catch (error) {
        setActiveTrip(null);
      }
    };
    fetchActiveTrip();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadTrips();
    }, 1000);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line
  }, [filters]);

  const loadTrips = async () => {
    try {
      setLoading(true);
      const response = await tripService.getTrips(filters);
      setTrips(response.data);
    } catch (error) {
      console.error("Error loading trips:", error);
    } finally {
      setLoading(false);
    }
  };

  const reloadData = async () => {
    try {
      const trip = await tripService.getActiveTrip();
      setActiveTrip(trip && trip.id ? trip : null);
      await loadTrips();
    } catch (error) {
      setActiveTrip(null);
      await loadTrips();
    }
  };

  useEffect(() => {
    const uniqueDriverIds = Array.from(new Set(trips.map(trip => trip.driverId)));
    uniqueDriverIds.forEach(async (driverId) => {
      if (driverId && driverRatings[driverId] === undefined) {
        try {
          const reviews = await reviewService.getDriverReviews(driverId);
          if (reviews.length > 0) {
            const avg = reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length;
            setDriverRatings(prev => ({ ...prev, [driverId]: avg }));
          } else {
            setDriverRatings(prev => ({ ...prev, [driverId]: null }));
          }
        } catch {
          setDriverRatings(prev => ({ ...prev, [driverId]: null }));
        }
      }
    });
    // eslint-disable-next-line
  }, [trips]);

  const handleJoinTrip = async (tripId) => {
    try {
      await tripService.joinTrip(tripId);
      toast.success("Вы успешно присоединились к поездке!");
      reloadData();
    } catch (error) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Ошибка при присоединении к поездке");
      }
    }
  };

  const handleLeaveTrip = async (tripId) => {
    try {
      await tripService.leaveTrip(tripId);
      toast.success("Вы вышли из поездки");
      reloadData();
    } catch (error) {
      toast.error("Ошибка при выходе из поездки");
    }
  };

  const handleChat = async (tripId) => {
    try {
      const response = await apiService.checkChatAccess(tripId);
      if (response.access) {
        navigate(`/chat/${tripId}`);
      } else {
        toast.error("У вас нет доступа к чату этой поездки");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Нет доступа к чату этой поездки");
    }
  };

  const handleShowPassengers = async (trip) => {
    try {
      setSelectedTrip(trip);
      const passengersList = await tripService.getPassengers(trip.id);
      setPassengers(passengersList);
      setShowPassengersDialog(true);
    } catch (error) {
      console.error("Error loading passengers:", error);
    }
  };

  const handleShowDriverReviews = async (driverId, driverName) => {
    setReviewsLoading(true);
    setOpenReviewsDialog(true);
    setSelectedDriver(driverId);
    setSelectedDriverName(driverName);
    try {
      const reviews = await reviewService.getDriverReviews(driverId);
      setDriverReviewsById(prev => ({ ...prev, [driverId]: reviews }));
    } catch (e) {
      setDriverReviewsById(prev => ({ ...prev, [driverId]: [] }));
    } finally {
      setReviewsLoading(false);
    }
  };

  const sortedTrips = [...trips].sort((a, b) => {
    const dateA = new Date(a.scheduledDate);
    const dateB = new Date(b.scheduledDate);
    return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
  });

  const filteredTrips = showAll
    ? sortedTrips
    : sortedTrips.filter(trip => trip.status === 'created' || trip.status === 'active');

  if (loading) {
    return <Loading />;
  }

  return (
    <Box>
      {activeTrip && (
        <>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Ваша активная поездка
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={8}>
                      <Typography variant="h6" gutterBottom>
                        {cleanAddress(activeTrip.startAddress)} → {cleanAddress(activeTrip.endAddress)}
                      </Typography>
                      <Typography color="textSecondary" gutterBottom>
                        {format(
                          new Date(activeTrip.scheduledDate),
                          "dd MMMM yyyy",
                          { locale: ru }
                        )}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        Водитель: {activeTrip.driverFirstName}{" "}
                        {activeTrip.driverLastName}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        {activeTrip.description}
                      </Typography>
					  <Typography variant="body2" gutterBottom>
					    <>
                          <span style={{ color: '#1976d2', fontWeight: 500 }}>
                            ⏱ Примерное время в пути: {activeTrip.estimatedDuration} мин.
                          </span>
                          <br />
                        </>
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          label={`${activeTrip.price} ₽`}
                          color="primary"
                          sx={{ mr: 1 }}
                        />
                        <Chip
                          label={`${activeTrip.availableSeats} мест`}
                          color="secondary"
                          sx={{ mr: 1 }}
                        />
                        <Chip
                          label={`${activeTrip.status}`}
                          color={
                            activeTrip.status === "created"
                              ? "success"
                              : "warning"
                          }
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                          height: "100%",
                          justifyContent: "center",
                        }}
                      >
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => handleChat(activeTrip.id)}
                        >
                          Чат
                        </Button>
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={() => handleShowPassengers(activeTrip)}
                        >
                          Пассажиры
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => handleLeaveTrip(activeTrip.id)}
                        >
                          Отменить
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
      <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 2, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: "bold", fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
          Доступные поездки
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' }, overflowX: { xs: 'auto', sm: 'visible' } }}>
          <Button
            variant={sortOrder === "asc" ? "contained" : "outlined"}
            color="primary"
            startIcon={<ArrowUpward />}
            onClick={() => setSortOrder("asc")}
            sx={{ minWidth: 0, px: { xs: 1, sm: 2 }, fontSize: { xs: '0.9rem', sm: '1rem' } }}
          >
            По возрастанию
          </Button>
          <Button
            variant={sortOrder === "desc" ? "contained" : "outlined"}
            color="primary"
            startIcon={<ArrowDownward />}
            onClick={() => setSortOrder("desc")}
            sx={{ minWidth: 0, px: { xs: 1, sm: 2 }, fontSize: { xs: '0.9rem', sm: '1rem' } }}
          >
            По убыванию
          </Button>
        </Box>
      </Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.2rem' }, mb: 2 }}>
          Фильтры
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              label="Откуда"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
              sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              label="Куда"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <LocalizationProvider
              dateAdapter={AdapterDateFns}
              adapterLocale={ru}
            >
              <DatePicker
                label="Дата"
                value={filters.date}
                onChange={(date) => setFilters({ ...filters, date })}
                renderInput={(params) => <TextField {...params} fullWidth size="small" sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }} />}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>
      </Box>
      <Box sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={showAll}
              onChange={e => setShowAll(e.target.checked)}
              color="primary"
            />
          }
          label="Показать завершённые и отменённые поездки"
        />
      </Box>
      {trips.length === 0 ? (
        <Typography variant="h6" sx={{ fontSize: '1.2rem', mb: 2 }}>
          Нет доступных поездок
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {filteredTrips.map((trip) => {
            return (
              <Grid item xs={12} key={trip.id}>
                <Card>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={8}>
                        <Typography variant="h6" gutterBottom>
                          {cleanAddress(trip.startAddress)} → {cleanAddress(trip.endAddress)}
                        </Typography>
                        <Typography color="textSecondary" gutterBottom>
                          {format(new Date(trip.scheduledDate), "dd MMMM yyyy", {
                            locale: ru,
                          })}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                          <Typography variant="body2" sx={{ mr: 1, mb: 0 }}>
                            Водитель: {trip.driverFirstName} {trip.driverLastName}
                          </Typography>
                          {typeof driverRatings[trip.driverId] === 'number' && (
                            <>
                              <Rating value={driverRatings[trip.driverId]} precision={0.1} readOnly size="small" sx={{ verticalAlign: 'middle' }} />
                              <span style={{ fontSize: 13, color: '#888', marginLeft: 4 }}>({driverRatings[trip.driverId].toFixed(1)})</span>
                            </>
                          )}
                          <Button
                            size="small"
                            variant="text"
                            sx={{ ml: 1, textTransform: 'none', minWidth: 0, p: 0.5 }}
                            onClick={() => handleShowDriverReviews(trip.driverId, `${trip.driverFirstName} ${trip.driverLastName}`)}
                          >
                            Отзывы
                          </Button>
                        </Box>
                        <Typography variant="body2" gutterBottom>
                          {trip.estimatedDuration && (
                            <>
                              <span style={{ color: '#1976d2', fontWeight: 500 }}>
                                ⏱ Примерное время в пути: {trip.estimatedDuration} мин.
                              </span>
                              <br />
                            </>
                          )}
                          {trip.status === 'completed' && trip.actual_time && (
                            <>
                              <span style={{ color: '#388e3c', fontWeight: 500 }}>
                                ✅ Фактическое время в пути: {trip.actual_time} мин.
                              </span>
                              <br />
                            </>
                          )}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          {trip.description}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <Chip
                            label={`${trip.price} ₽`}
                            color="primary"
                            sx={{ mr: 1 }}
                          />
                          <Chip
                            label={`${trip.availableSeats} мест`}
                            color="secondary"
                            sx={{ mr: 1 }}
                          />
                          <Chip
                            label={`${trip.status}`}
                            color={
                              trip.status === "created" ? "success" : "warning"
                            }
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 1,
                            height: "100%",
                            justifyContent: "center",
                          }}
                        >
                          {activeTrip && activeTrip.id ? (
                            <Tooltip title="Вы уже присоединились к другой поездке. Сначала выйдите из неё.">
                              <span>
                                <Button
                                  variant="contained"
                                  color="secondary"
                                  disabled
                                >
                                  Присоединиться
                                </Button>
                              </span>
                            </Tooltip>
                          ) : (
                            <Button
                              variant="contained"
                              color="secondary"
                              onClick={() => handleJoinTrip(trip.id)}
                              disabled={
                                trip.availableSeats === 0 ||
                                trip.status !== "created"
                              }
                            >
                              Присоединиться
                            </Button>
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Dialog
        open={showPassengersDialog}
        onClose={() => setShowPassengersDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Пассажиры поездки {selectedTrip?.startAddress} →{" "}
          {selectedTrip?.endAddress}
        </DialogTitle>
        <DialogContent>
          <List>
            {passengers.map((passenger) => (
              <ListItem key={passenger.id}>
                <ListItemAvatar>
                  <Avatar>
                    {passenger.firstName[0]}
                    {passenger.lastName[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={`${passenger.firstName} ${passenger.lastName}`}
                  secondary={`Присоединился: ${format(
                    new Date(passenger.joinedAt),
                    "dd.MM.yyyy HH:mm"
                  )}`}
                />
              </ListItem>
            ))}
            {passengers.length === 0 && (
              <ListItem>
                <ListItemText primary="Нет пассажиров" />
              </ListItem>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPassengersDialog(false)}>
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openReviewsDialog} onClose={() => setOpenReviewsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Отзывы о водителе {selectedDriverName}</DialogTitle>
        <DialogContent>
          {reviewsLoading ? (
            <Typography>Загрузка...</Typography>
          ) : (driverReviewsById[selectedDriver]?.length === 0 ? (
            <Typography>Пока нет отзывов</Typography>
          ) : (
            <List>
              {driverReviewsById[selectedDriver]?.map((review) => (
                <ListItem key={review.id} alignItems="flex-start">
                  <ListItemText
                    primary={<>
                      <Rating value={review.rating} readOnly size="small" />
                      <span style={{ marginLeft: 8, fontWeight: 500 }}>{review.firstName} {review.lastName}</span>
                    </>}
                    secondary={<>
                      {review.text && <Typography variant="body2">{review.text}</Typography>}
                      <Typography variant="caption" color="text.secondary">{new Date(review.createdAt).toLocaleDateString()}</Typography>
                    </>}
                  />
                </ListItem>
              ))}
            </List>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReviewsDialog(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TripList;
