const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Trip = require('../models/Trip');
const isAuthenticated = require('../middleware/auth');

router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { tripId, text, rating } = req.body;
    const passengerId = req.userId;
    if (!tripId || !rating) {
      return res.status(400).json({ message: 'Не указаны обязательные поля' });
    }
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Поездка не найдена' });
    }
    if (trip.status !== 'completed') {
      return res.status(400).json({ message: 'Оставлять отзыв можно только после завершения поездки' });
    }
    const [passenger] = await Trip.getPassengers(tripId);
    const isPassenger = passenger && passenger.id === passengerId;
    if (!isPassenger) {
      return res.status(403).json({ message: 'Вы не были пассажиром этой поездки' });
    }
    const existing = await Review.findByPassengerAndTrip(passengerId, tripId);
    if (existing) {
      return res.status(400).json({ message: 'Вы уже оставили отзыв на эту поездку' });
    }
    const review = await Review.create({ passengerId, tripId, text, rating });
    res.status(201).json(review);
  } catch (error) {
    console.error('Ошибка при добавлении отзыва:', error);
    res.status(500).json({ message: 'Ошибка при добавлении отзыва' });
  }
});

router.get('/driver/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params;
    const reviews = await Review.findByDriverId(driverId);
    res.json(reviews);
  } catch (error) {
    console.error('Ошибка при получении отзывов по водителю:', error);
    res.status(500).json({ message: 'Ошибка при получении отзывов' });
  }
});

router.get('/trip/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    const reviews = await Review.findByTripId(tripId);
    res.json(reviews);
  } catch (error) {
    console.error('Ошибка при получении отзывов по поездке:', error);
    res.status(500).json({ message: 'Ошибка при получении отзывов' });
  }
});

module.exports = router; 