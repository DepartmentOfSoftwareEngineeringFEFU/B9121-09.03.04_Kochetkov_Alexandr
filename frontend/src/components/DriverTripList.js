import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { tripService, tripsService } from "../services/apiService";

function cleanAddress(address) {
  if (!address) return "";
  return address.replace("Приморский край, Владивосток, ", "").trim();
}

const DriverTripList = ({ trips, onStatusChange }) => {
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [showPassengersDialog, setShowPassengersDialog] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();

  const statusLabels = {
    created: "Создана",
    active: "В пути",
    completed: "Завершена",
    cancelled: "Отменена",
  };

  const handleShowPassengers = async (trip) => {
    setSelectedTrip(trip);
    try {
      const passengersList = await tripService.getPassengers(trip.id);
      setPassengers(passengersList);
      setShowPassengersDialog(true);
    } catch (error) {
      setPassengers([]);
      setShowPassengersDialog(true);
    }
  };

  const handleStatusChange = async (tripId, status) => {
    setLoadingStatus(true);
    try {
      await tripsService.updateTripStatus(tripId, status);
      if (onStatusChange) onStatusChange();
    } catch (error) {
      console.error("Ошибка при изменении статуса поездки:", error);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleChat = async (tripId) => {
    try {
      navigate(`/chat/${tripId}`);
    } catch (error) {
      alert(error.response?.data?.message || "Нет доступа к чату этой поездки");
    }
  };

  const filteredTrips = showAll
    ? trips
    : trips.filter(
        (trip) => trip.status === "created" || trip.status === "active"
      );

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
              color="primary"
            />
          }
          label="Показать завершённые и отменённые поездки"
        />
      </Box>
      <Grid container spacing={3}>
        {filteredTrips.map((trip) => (
          <Grid item xs={12} key={trip.id}>
            <Card>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={8}>
                    <Typography variant="h6" gutterBottom>
                      {cleanAddress(trip.startAddress)} →{" "}
                      {cleanAddress(trip.endAddress)}
                    </Typography>
                    <Typography color="textSecondary" gutterBottom>
                      {format(
                        new Date(trip.scheduledDate),
                        "dd MMMM yyyy, HH:mm",
                        { locale: ru }
                      )}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      {trip.estimatedDuration && (
                        <>
                          <span style={{ color: "#1976d2", fontWeight: 500 }}>
                            ⏱ Примерное время в пути: {trip.estimatedDuration}{" "}
                            мин.
                          </span>
                          <br />
                        </>
                      )}
                      {trip.status === "completed" && trip.actual_time && (
                        <>
                          <span style={{ color: "#388e3c", fontWeight: 500 }}>
                            ✅ Фактическое время в пути: {trip.actual_time} мин.
                          </span>
                          <br />
                        </>
                      )}
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
                        label={statusLabels[trip.status] || trip.status}
                        color={
                          trip.status === "created"
                            ? "success"
                            : trip.status === "active"
                            ? "warning"
                            : trip.status === "completed"
                            ? "default"
                            : "error"
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
                        onClick={() => handleChat(trip.id)}
                      >
                        Чат
                      </Button>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => handleShowPassengers(trip)}
                      >
                        Пассажиры
                      </Button>
                      {trip.status === "created" && (
                        <Button
                          variant="contained"
                          color="success"
                          onClick={() => handleStatusChange(trip.id, "active")}
                          disabled={loadingStatus}
                        >
                          Начать поездку
                        </Button>
                      )}
                      {trip.status === "active" && (
                        <Button
                          variant="contained"
                          color="secondary"
                          onClick={() =>
                            handleStatusChange(trip.id, "completed")
                          }
                          disabled={loadingStatus}
                        >
                          Завершить поездку
                        </Button>
                      )}
                      {trip.status === "created" && (
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() =>
                            handleStatusChange(trip.id, "cancelled")
                          }
                          disabled={loadingStatus}
                        >
                          Отменить поездку
                        </Button>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}

        <Dialog
          open={showPassengersDialog}
          onClose={() => setShowPassengersDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Пассажиры поездки {cleanAddress(selectedTrip?.startAddress)} →{" "}
            {cleanAddress(selectedTrip?.endAddress)}
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
      </Grid>
    </>
  );
};

export default DriverTripList;
