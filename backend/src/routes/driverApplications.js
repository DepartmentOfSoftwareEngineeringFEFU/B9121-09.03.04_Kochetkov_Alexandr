const express = require("express");
const router = express.Router();
const DriverApplication = require("../models/DriverApplication");
const User = require("../models/User");
const Car = require("../models/Car");
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const upload = require('../config/multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

router.post("/", auth, upload.single('licensePhoto'), async (req, res) => {
  try {
    const { licenseNumber, carNumber, carBrand, carModel, carColor } = req.body;

    if (!licenseNumber || !carNumber || !carBrand || !carModel || !carColor) {
      return res
        .status(400)
        .json({ message: "Все поля обязательны для заполнения" });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ message: "Фотография водительского удостоверения обязательна" });
    }

    const existingApplication = await DriverApplication.findByUserId(
      req.userId
    );
    if (existingApplication) {
      return res
        .status(400)
        .json({ message: "У вас уже есть активная заявка" });
    }

    const application = await DriverApplication.create({
      userId: req.userId,
      licenseNumber,
      carNumber,
      carBrand,
      carModel,
      carColor,
      licensePhotoPath: req.file.filename
    });

    res.status(201).json(application);
  } catch (error) {
    console.error("Ошибка при создании заявки:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

router.get("/license-photo/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../../uploads', filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ message: "Файл не найден" });
  }
});

router.get("/my", auth, async (req, res) => {
  try {
    const application = await DriverApplication.findByUserId(req.userId);
    res.json(application || { status: "no_application" });
  } catch (error) {
    console.error("Ошибка при получении заявки:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

router.get("/pending", auth, adminAuth, async (req, res) => {
  try {
    const applications = await DriverApplication.findAllPending();
    res.json(applications);
  } catch (error) {
    console.error("Ошибка при получении заявок:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

router.put("/:id/status", auth, adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const application = await DriverApplication.findById(id);
    if (!application) {
      return res.status(404).json({ message: "Заявка не найдена" });
    }


    const updatedApplication = await DriverApplication.updateStatus(id, status);

    if (status === "approved") {

      try {
        await User.updateProfile(application.userId, {
          is_driver: true,
          licenseNumber: application.licenseNumber,
        });
      } catch (userError) {
        console.error("Ошибка при обновлении пользователя:", userError);
        throw userError;
      }

      try {
        const newCar = await Car.create({
          user_id: application.userId,
          make: application.carBrand,
          model: application.carModel,
          license_plate: application.carNumber,
        });
      } catch (carError) {
        console.error("Ошибка при создании машины:", carError);
        throw carError;
      }

    }

    res.json(updatedApplication);
  } catch (error) {
    console.error("Ошибка при обновлении статуса заявки:", error);
    res
      .status(500)
      .json({
        message: "Ошибка сервера",
        error: error.message,
        stack: error.stack,
      });
  }
});

router.delete("/:id", auth, adminAuth, async (req, res) => {
  try {
    const application = await DriverApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: "Заявка не найдена" });
    }

    await DriverApplication.delete(req.params.id);
    res.json({ message: "Заявка успешно удалена" });
  } catch (error) {
    console.error("Ошибка при удалении заявки:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

module.exports = router;
