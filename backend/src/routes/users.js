const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('../config/database');
const DriverInfoChangeRequest = require('../models/DriverInfoChangeRequest');
const upload = require('../config/multer');

const isAuthenticated = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Не авторизован' });
  }
};

const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

router.get('/me', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      is_driver: user.is_driver,
      licenseNumber: user.licenseNumber
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении данных пользователя', error: error.message });
  }
});

router.put('/me', isAuthenticated, async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findByEmail(email);
      
      if (existingUser) {
        return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
      }
      user.email = email;
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    await User.updateProfile(req.userId, { firstName, lastName, email });
    
    res.json({
      message: 'Данные пользователя успешно обновлены',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при обновлении данных пользователя', error: error.message });
  }
});

router.put('/me/password', isAuthenticated, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.userId);
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Неверный текущий пароль' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.execute(
      'UPDATE user SET password = ? WHERE id = ?',
      [hashedPassword, req.userId]
    );

    res.json({ message: 'Пароль успешно изменен' });
  } catch (error) {
    console.error('Ошибка при смене пароля:', error);
    res.status(500).json({ message: 'Ошибка сервера при смене пароля' });
  }
});

router.get('/', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    })));
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении списка пользователей', error: error.message });
  }
});

router.get('/me/cars', isAuthenticated, async (req, res) => {
  try {
    const Car = require('../models/Car');
    const cars = await Car.findByUserId(req.userId);
    res.json(cars);
  } catch (error) {
    console.error('Ошибка при получении автомобилей:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.post('/me/driver-info-change', isAuthenticated, upload.single('licensePhoto'), async (req, res) => {
  try {
    const { licenseNumber, carNumber, carBrand, carModel, carColor } = req.body;
    const licensePhotoPath = req.file ? req.file.filename : null;

    const activeRequests = await DriverInfoChangeRequest.findByUserId(req.userId);
    const hasPendingRequest = activeRequests.some(request => request.status === 'pending');

    if (hasPendingRequest) {
      return res.status(400).json({ message: 'У вас уже есть активная заявка на изменение данных' });
    }

    const request = await DriverInfoChangeRequest.create({
      userId: req.userId,
      licenseNumber,
      carNumber,
      carBrand,
      carModel,
      carColor,
      licensePhotoPath
    });

    res.status(201).json(request);
  } catch (error) {
    console.error('Ошибка при создании заявки:', error);
    res.status(500).json({ message: 'Ошибка сервера при создании заявки' });
  }
});

router.get('/me/driver-info-change', isAuthenticated, async (req, res) => {
  try {
    const requests = await DriverInfoChangeRequest.findByUserId(req.userId);
    res.json(requests);
  } catch (error) {
    console.error('Ошибка при получении заявок:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении заявок' });
  }
});

module.exports = router; 