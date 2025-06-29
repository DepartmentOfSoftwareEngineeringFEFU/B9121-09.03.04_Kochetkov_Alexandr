const express = require("express");
const router = express.Router();
const Trip = require("../models/Trip");
const auth = require("../middleware/auth");

router.post("/:tripId/join", auth, async (req, res) => {
  try {
    const trip = await Trip.addPassenger(req.params.tripId, req.userId);
    res.json(trip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/:tripId/leave", auth, async (req, res) => {
  try {
    const trip = await Trip.removePassenger(req.params.tripId, req.userId);
    res.json(trip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/:tripId/passengers", auth, async (req, res) => {
  try {
    const passengers = await Trip.getPassengers(req.params.tripId);
    res.json(passengers);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/active", auth, async (req, res) => {
  try {
    const trip = await Trip.getUserActiveTrip(req.userId);
    res.json(trip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
