const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const pool = require("../config/database");
const DriverInfoChangeRequest = require('../models/DriverInfoChangeRequest');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key-123";

const adminAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Требуется авторизация" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Token verification error:", err);
    return res.status(401).json({ message: "Недействительный токен" });
  }
};

router.post("/login", (req, res) => {
  const { login, password } = req.body;

  if (login === "admin" && password === (process.env.ADMIN_PASSWORD || "123")) {
    const token = jwt.sign({ id: 1 }, JWT_SECRET, { expiresIn: "1w" });

    res.json({ token });
  } else {
    res.status(401).json({ message: "Неверный логин или пароль" });
  }
});

router.get("/applications", adminAuth, async (req, res) => {
  try {

    const [applications] = await pool.query(`
      SELECT a.*, u.email, u.firstName, u.lastName
      FROM driver_application a
      JOIN user u ON a.userId = u.id
    `);

    res.json(applications);
  } catch (err) {
    console.error("Error fetching applications:", err);
    res.status(500).json({ message: "Ошибка при получении заявок" });
  }
});

router.get("/applications/user/:userId", adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    const [applications] = await pool.query(
      `
      SELECT a.*, u.email, u.firstName, u.lastName
      FROM driver_application a
      JOIN user u ON a.userId = u.id
      WHERE a.userId = ?
    `,
      [userId]
    );

    res.json(applications);
  } catch (err) {
    console.error("Error fetching applications by user ID:", err);
    res.status(500).json({ message: "Ошибка при получении заявок" });
  }
});

router.put("/applications/:id/status", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const [applicationData] = await pool.query(
      "SELECT * FROM driver_application WHERE id = ?",
      [id]
    );

    if (!applicationData || applicationData.length === 0) {
      return res.status(404).json({ message: "Заявка не найдена" });
    }

    const application = applicationData[0];

    await pool.query("UPDATE driver_application SET status = ? WHERE id = ?", [
      status,
      id,
    ]);

    if (status === "approved") {
      await pool.query(
        "UPDATE user SET is_driver = TRUE, licenseNumber = ? WHERE id = ?",
        [application.licenseNumber, application.userId]
      );

      await pool.query(
        "INSERT INTO car (user_id, make, model, license_plate, color) VALUES (?, ?, ?, ?, ?)",
        [
          application.userId,
          application.carBrand,
          application.carModel,
          application.carNumber,
          application.carColor,
        ]
      );
    }

    res.json({ message: "Статус заявки обновлен" });
  } catch (err) {
    console.error("Error updating application status:", err);
    res.status(500).json({ message: "Ошибка при обновлении статуса заявки" });
  }
});

router.get("/statistics", adminAuth, async (req, res) => {
  try {

    const [totalUsersResult] = await pool.query(
      "SELECT COUNT(*) as count FROM user"
    );
    const totalUsers = totalUsersResult[0].count;

    const [totalDriversResult] = await pool.query(
      "SELECT COUNT(*) as count FROM user WHERE is_driver = TRUE"
    );
    const totalDrivers = totalDriversResult[0].count;

    const [tripsStatsResult] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(price) as totalRevenue,
        AVG(price) as averagePrice
      FROM trip
    `);
    const tripsStats = tripsStatsResult[0];

    const [applicationsStatsResult] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM driver_application
    `);
    const applicationsStats = applicationsStatsResult[0];

    const statistics = {
      totalUsers,
      totalDrivers,
      totalTrips: tripsStats.total || 0,
      activeTrips: tripsStats.active || 0,
      completedTrips: tripsStats.completed || 0,
      totalRevenue: tripsStats.totalRevenue || 0,
      averageTripPrice: tripsStats.averagePrice || 0,
      totalApplications: applicationsStats.total || 0,
      pendingApplications: applicationsStats.pending || 0,
      approvedApplications: applicationsStats.approved || 0,
      rejectedApplications: applicationsStats.rejected || 0,
    };

    res.json(statistics);
  } catch (err) {
    console.error("Error fetching statistics:", err);
    res.status(500).json({ message: "Ошибка при получении статистики" });
  }
});

router.get("/drivers", adminAuth, async (req, res) => {
  try {

    const [drivers] = await pool.query(`
      SELECT u.id, u.email, u.firstName, u.lastName, 
             a.licenseNumber, a.carNumber, a.carBrand, a.carModel, a.carColor, a.licensePhotoPath
      FROM user u
      LEFT JOIN driver_application a ON u.id = a.userId AND a.status = 'approved'
      WHERE u.is_driver = TRUE
    `);

    res.json(drivers);
  } catch (err) {
    console.error("Error fetching drivers:", err);
    res.status(500).json({ message: "Ошибка при получении списка водителей" });
  }
});

router.post("/drivers/:userId/revoke", adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    await pool.query("UPDATE user SET is_driver = FALSE WHERE id = ?", [
      userId,
    ]);

    const [applications] = await pool.query(
      "SELECT id FROM driver_application WHERE userId = ?",
      [userId]
    );

    if (applications && applications.length > 0) {
      await pool.query(
        'UPDATE driver_application SET status = "rejected" WHERE userId = ?',
        [userId]
      );
    }

    res.json({ message: "Статус водителя отозван" });
  } catch (err) {
    console.error("Error revoking driver status:", err);
    res.status(500).json({ message: "Ошибка при отзыве статуса водителя" });
  }
});

router.get('/driver-info-change-requests', adminAuth, async (req, res) => {
  try {
    const requests = await DriverInfoChangeRequest.findAllPending();
    res.json(requests);
  } catch (error) {
    console.error('Ошибка при получении заявок:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении заявок' });
  }
});

router.put('/driver-info-change-requests/:id/status', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Неверный статус' });
    }

    const request = await DriverInfoChangeRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Заявка не найдена' });
    }

    await DriverInfoChangeRequest.updateStatus(id, status);

    if (status === 'approved') {
      await User.updateProfile(request.userId, {
        licenseNumber: request.licenseNumber,
        carNumber: request.carNumber,
        carBrand: request.carBrand,
        carModel: request.carModel,
        carColor: request.carColor
      });
    }

    res.json({ message: 'Статус заявки успешно обновлен' });
  } catch (error) {
    console.error('Ошибка при обновлении статуса заявки:', error);
    res.status(500).json({ message: 'Ошибка сервера при обновлении статуса заявки' });
  }
});

router.get('/driver-info-change-requests/count', adminAuth, async (req, res) => {
  try {
    const [result] = await pool.query(
      'SELECT COUNT(*) as count FROM driver_info_change_request WHERE status = "pending"'
    );
    res.json({ count: result[0].count });
  } catch (error) {
    console.error('Ошибка при подсчете заявок:', error);
    res.status(500).json({ message: 'Ошибка сервера при подсчете заявок' });
  }
});

router.get('/applications/count', adminAuth, async (req, res) => {
  try {
    const [result] = await pool.query(
      'SELECT COUNT(*) as count FROM driver_application WHERE status = "pending"'
    );
    res.json({ count: result[0].count });
  } catch (error) {
    console.error('Ошибка при подсчете заявок:', error);
    res.status(500).json({ message: 'Ошибка сервера при подсчете заявок' });
  }
});

module.exports = router;
