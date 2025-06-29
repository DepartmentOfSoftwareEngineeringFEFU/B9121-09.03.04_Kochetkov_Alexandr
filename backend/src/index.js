const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const { pool } = require("./config/database");
const User = require("./models/User");
const Trip = require("./models/Trip");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const tripRoutes = require("./routes/trips");
const driverApplicationRoutes = require("./routes/driverApplications");
const adminRoutes = require("./routes/admin");
const tripPassengerRoutes = require("./routes/tripPassengers");
const reviewRoutes = require("./routes/review");

const app = express();
const server = http.createServer(app);

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    exposedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/driver-applications", driverApplicationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/trip-passengers", tripPassengerRoutes);
app.use("/api/reviews", reviewRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Что-то пошло не так!" });
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error("Ошибка подключения к базе данных:", err);
    return;
  }
  connection.release();
});

const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const chatHistory = {}; 
const roomUsers = {}; 

io.on("connection", (socket) => {

  socket.on("joinRoom", async (data) => {
    const { roomId, user } = data;
    socket.join(roomId);
    
    let role = 'guest';
    let firstName = user.firstName;
    let lastName = user.lastName;
    try {
      const trip = await Trip.findById(roomId);
      const passengers = await Trip.getPassengers(roomId);
      if (trip && user.id) {
        if (user.id === trip.driverId) {
          role = 'driver';
        } else if (passengers.some(p => p.id === user.id)) {
          role = 'passenger';
        }
      }
    } catch (e) {
      console.error('Ошибка при определении роли пользователя в поездке:', e);
    }

    if (!roomUsers[roomId]) {
      roomUsers[roomId] = new Map();
    }
    roomUsers[roomId].set(socket.id, {
      id: user.id,
      firstName,
      lastName,
      role
    });
    
    if (chatHistory[roomId]) {
      socket.emit("chatHistory", chatHistory[roomId]);
    }
    
    const usersList = Array.from(roomUsers[roomId].entries()).map(([socketId, userData]) => ({
      socketId,
      ...userData
    }));
    io.to(roomId).emit("roomUsers", usersList);
  });

  socket.on("chatMessage", (data) => {
    if (!chatHistory[data.roomId]) chatHistory[data.roomId] = [];
    chatHistory[data.roomId].push(data);
    io.to(data.roomId).emit("chatMessage", data);
  });

  socket.on("leaveRoom", (roomId) => {
    if (roomUsers[roomId] && roomUsers[roomId].has(socket.id)) {
      roomUsers[roomId].delete(socket.id);
      if (roomUsers[roomId].size === 0) {
        delete roomUsers[roomId];
      }
      const usersList = Array.from(roomUsers[roomId]?.entries() || []).map(([socketId, userData]) => ({
        socketId,
        ...userData
      }));
      io.to(roomId).emit("roomUsers", usersList);
    }
  });

  socket.on("disconnect", () => {
    Object.keys(roomUsers).forEach(roomId => {
      if (roomUsers[roomId].has(socket.id)) {
        roomUsers[roomId].delete(socket.id);
        if (roomUsers[roomId].size === 0) {
          delete roomUsers[roomId];
        }
        const usersList = Array.from(roomUsers[roomId]?.entries() || []).map(([socketId, userData]) => ({
          socketId,
          ...userData
        }));
        io.to(roomId).emit("roomUsers", usersList);
      }
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
