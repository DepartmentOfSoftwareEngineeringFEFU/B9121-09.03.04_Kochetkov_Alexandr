const express = require("express");
const router = express.Router();
const Trip = require("../models/Trip");
const TripPrediction = require("../models/TripPrediction");
const isAuthenticated = require("../middleware/auth");
const { predictTripTime } = require('../services/mlPredictor');

router.get("/my", isAuthenticated, async (req, res) => {
  try {
    const userId = req.userId;
    const trips = await Trip.findByUserId(userId);
    res.json(trips);
  } catch (error) {
    console.error("Ошибка при получении поездок:", error);
    res.status(500).json({ message: "Ошибка при получении списка поездок" });
  }
});

router.post("/", isAuthenticated, async (req, res) => {
  try {
    const {
      startAddress,
      endAddress,
      scheduledDate,
      price,
      availableSeats,
      description,
      carId,
      startLat,
      startLng,
      endLat,
      endLng,
    } = req.body;

    if (!startAddress || !endAddress || !scheduledDate || !carId) {
      return res.status(400).json({
        message: "Не заполнены обязательные поля",
        details: {
          startAddress: !startAddress
            ? "Требуется указать адрес отправления"
            : null,
          endAddress: !endAddress ? "Требуется указать адрес прибытия" : null,
          scheduledDate: !scheduledDate
            ? "Требуется указать дату и время"
            : null,
          carId: !carId ? "Требуется выбрать автомобиль" : null,
        },
      });
    }

    if (!startLat || !startLng || !endLat || !endLng) {
      return res.status(400).json({
        message: "Не указаны координаты маршрута",
        details: {
          coordinates: "Пожалуйста, постройте маршрут на карте",
        },
      });
    }

    const tripDate = new Date(scheduledDate);
    if (isNaN(tripDate.getTime())) {
      return res.status(400).json({
        message: "Некорректный формат даты",
        details: { scheduledDate: "Дата должна быть в формате ISO" },
      });
    }

    if (tripDate <= new Date()) {
      return res.status(400).json({
        message: "Нельзя создать поездку в прошлом",
        details: { scheduledDate: "Дата и время должны быть в будущем" },
      });
    }

    if (typeof price !== "number" || price <= 0) {
      return res.status(400).json({
        message: "Некорректная цена",
        details: { price: "Цена должна быть положительным числом" },
      });
    }

    if (typeof availableSeats !== "number" || availableSeats < 1) {
      return res.status(400).json({
        message: "Некорректное количество мест",
        details: {
          availableSeats: "Количество мест должно быть положительным числом",
        },
      });
    }

    function getDistanceKm(lat1, lng1, lat2, lng2) {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    }

    const distance_km = getDistanceKm(startLat, startLng, endLat, endLng);
    const dateObj = new Date(scheduledDate);
    const weekday = dateObj.getDay();
    const hour = dateObj.getHours();

    const predicted_time_min = await predictTripTime({ distance_km, weekday, hour });

    const tripData = {
      driverId: req.userId,
      startAddress,
      endAddress,
      scheduledDate: dateObj,
      price: parseFloat(price),
      availableSeats: parseInt(availableSeats),
      description: description || null,
      carId: parseInt(carId),
      startLat: startLat ? parseFloat(startLat) : null,
      startLng: startLng ? parseFloat(startLng) : null,
      endLat: endLat ? parseFloat(endLat) : null,
      endLng: endLng ? parseFloat(endLng) : null,
      estimatedDuration: predicted_time_min ? Math.round(predicted_time_min) : null
    };

    const trip = await Trip.create(tripData);
    res.status(201).json(trip);
  } catch (error) {
    console.error("Ошибка при создании поездки:", error);
    res.status(500).json({
      message: "Ошибка при создании поездки",
      details: error.message,
    });
  }
});

router.put("/:id/status", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.userId;

    const trip = await Trip.findById(id);
    if (!trip) {
      return res.status(404).json({ message: "Поездка не найдена" });
    }

    if (trip.driverId !== userId && trip.passengerId !== userId) {
      return res.status(403).json({ message: "Нет доступа к этой поездке!" });
    }

    const updatedTrip = await Trip.updateStatus(id, status);
    res.json(updatedTrip);
  } catch (error) {
    console.error("Ошибка при обновлении статуса поездки:", error);
    res.status(500).json({ message: "Ошибка при обновлении статуса поездки" });
  }
});

router.post("/:id/join", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const trip = await Trip.findById(id);
    if (!trip) {
      return res.status(404).json({ message: "Поездка не найдена" });
    }

    if (trip.driverId === userId) {
      return res
        .status(400)
        .json({ message: "Вы не можете присоединиться к своей поездке" });
    }

    if (trip.passengerId) {
      return res.status(400).json({ message: "В поездке уже есть пассажир" });
    }

    const updatedTrip = await Trip.updatePassenger(id, userId);
    res.json(updatedTrip);
  } catch (error) {
    console.error("Ошибка при присоединении к поездке:", error);
    res.status(500).json({ message: "Ошибка при присоединении к поездке" });
  }
});

router.post("/:id/leave", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const trip = await Trip.findById(id);
    if (!trip) {
      return res.status(404).json({ message: "Поездка не найдена" });
    }

    if (trip.passengerId !== userId) {
      return res
        .status(400)
        .json({ message: "Вы не являетесь пассажиром этой поездки" });
    }

    const updatedTrip = await Trip.updatePassenger(id, null);
    res.json(updatedTrip);
  } catch (error) {
    console.error("Ошибка при выходе из поездки:", error);
    res.status(500).json({ message: "Ошибка при выходе из поездки" });
  }
});

router.get("/pending", isAuthenticated, async (req, res) => {
  try {
    const trips = await Trip.findByStatus("scheduled");
    res.json(trips);
  } catch (error) {
    console.error("Ошибка при получении ожидающих поездок:", error);
    res.status(500).json({ message: "Ошибка при получении ожидающих поездок" });
  }
});

router.get("/completed", isAuthenticated, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const trips = await Trip.findByStatus("completed", limit);
    res.json(trips);
  } catch (error) {
    console.error("Ошибка при получении завершенных поездок:", error);
    res
      .status(500)
      .json({ message: "Ошибка при получении завершенных поездок" });
  }
});

router.get("/driver/recent", isAuthenticated, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 3;
    const userId = req.userId;
    const trips = await Trip.findByDriverId(userId, limit);
    res.json(trips);
  } catch (error) {
    console.error("Ошибка при получении последних поездок водителя:", error);
    res
      .status(500)
      .json({ message: "Ошибка при получении последних поездок водителя" });
  }
});

router.get("/recent", isAuthenticated, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const trips = await Trip.findRecent(limit);
    res.json(trips);
  } catch (error) {
    console.error("Ошибка при получении последних поездок:", error);
    res.status(500).json({ message: "Ошибка при получении последних поездок" });
  }
});

router.get("/:id/prediction", isAuthenticated, async (req, res) => {
  try {
    const prediction = await TripPrediction.findByTripId(req.params.id);
    if (!prediction) {
      return res
        .status(404)
        .json({ message: "Предсказание времени не найдено" });
    }
    res.json(prediction);
  } catch (error) {
    console.error("Ошибка при получении предсказания времени:", error);
    res
      .status(500)
      .json({ message: "Ошибка при получении предсказания времени" });
  }
});

router.patch("/:id/actual-time", isAuthenticated, async (req, res) => {
  try {
    const { actual_time } = req.body;
    const userId = req.userId;

    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: "Поездка не найдена" });
    }

    if (trip.driverId !== userId) {
      return res.status(403).json({
        message: "Только водитель может обновить фактическое время поездки",
      });
    }

    const prediction = await TripPrediction.findByTripId(req.params.id);
    if (!prediction) {
      return res
        .status(404)
        .json({ message: "Предсказание времени не найдено" });
    }

    const updatedPrediction = await TripPrediction.updateActualTime(
      prediction.id,
      actual_time
    );
    res.json(updatedPrediction);
  } catch (error) {
    console.error("Ошибка при обновлении фактического времени:", error);
    res
      .status(500)
      .json({ message: "Ошибка при обновлении фактического времени" });
  }
});

router.get("/", isAuthenticated, async (req, res) => {
  try {
    const userId = req.userId;
    const trips = await Trip.findAvailableForUser(userId, req.query);
    res.json(trips);
  } catch (error) {
    console.error("Ошибка при получении доступных поездок:", error);
    res.status(500).json({ message: "Ошибка при получении доступных поездок" });
  }
});

router.get('/:id/chat-access', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
	
    const trip = await Trip.findById(id);
    if (!trip) {
      return res.status(404).json({ message: 'Поездка не найдена' });
    }
    return res.json({ access: true });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка проверки доступа к чату' });
  }
});

router.get("/joined", isAuthenticated, async (req, res) => {
  try {
    const userId = req.userId;
    const [rows] = await require("../config/database").execute(
      `SELECT t.*, 
              d.id as driverId, d.email as driverEmail, d.firstName as driverFirstName, d.lastName as driverLastName,
              c.id as carId, c.make as carMake, c.model as carModel, c.license_plate as carLicensePlate,
              tp.predicted_time, tp.actual_time
       FROM trip t
       JOIN trip_passengers tpax ON t.id = tpax.tripId
       LEFT JOIN user d ON t.driverId = d.id
       LEFT JOIN car c ON t.carId = c.id
       LEFT JOIN trip_prediction tp ON t.id = tp.tripId
       WHERE tpax.userId = ? AND tpax.status = 'active' AND t.status = 'completed'
       ORDER BY t.scheduledDate DESC`,
      [userId]
    );
    res.json(rows);
  } catch (error) {
    console.error("Ошибка при получении завершённых поездок пассажира:", error);
    res.status(500).json({ message: "Ошибка при получении завершённых поездок пассажира" });
  }
});

module.exports = router;
