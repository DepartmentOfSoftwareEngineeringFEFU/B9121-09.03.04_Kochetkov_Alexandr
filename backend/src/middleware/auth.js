const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    req.userId = decoded.userId;
    
    next();
  } catch (error) {
    console.error('Ошибка аутентификации:', error);
    return res.status(401).json({ message: 'Не авторизован' });
  }
}; 