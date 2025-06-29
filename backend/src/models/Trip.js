const pool = require("../config/database");

class Trip {
  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT 
        t.*,
        d.id as driverId, 
        d.email as driverEmail, 
        d.firstName as driverFirstName, 
        d.lastName as driverLastName,
        c.id as carId, 
        c.make as carMake, 
        c.model as carModel, 
        c.license_plate as carLicensePlate,
        tp.predicted_time, 
        tp.actual_time,
        t.startAddress,
        t.endAddress,
        t.startLat,
        t.startLng,
        t.endLat,
        t.endLng,
        t.estimatedDuration,
        t.availableSeats,
        t.price,
        t.description,
        t.status,
        t.scheduledDate,
        t.actualArrivalTime,
        t.createdAt,
        t.updatedAt
       FROM trip t
       LEFT JOIN user d ON t.driverId = d.id
       LEFT JOIN car c ON t.carId = c.id
       LEFT JOIN trip_prediction tp ON t.id = tp.tripId
       WHERE t.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async findByUserId(userId) {
    if (!userId) {
      return [];
    }

    const [rows] = await pool.execute(
      `SELECT 
        t.*,
        d.id as driverId, 
        d.email as driverEmail, 
        d.firstName as driverFirstName, 
        d.lastName as driverLastName,
        c.id as carId, 
        c.make as carMake, 
        c.model as carModel, 
        c.license_plate as carLicensePlate,
        tp.predicted_time, 
        tp.actual_time,
        t.startAddress,
        t.endAddress,
        t.startLat,
        t.startLng,
        t.endLat,
        t.endLng,
        t.estimatedDuration,
        t.availableSeats,
        t.price,
        t.description,
        t.status,
        t.scheduledDate,
        t.actualArrivalTime,
        t.createdAt,
        t.updatedAt
       FROM trip t
       LEFT JOIN user d ON t.driverId = d.id
       LEFT JOIN car c ON t.carId = c.id
       LEFT JOIN trip_prediction tp ON t.id = tp.tripId
       WHERE t.driverId = ?
       ORDER BY t.scheduledDate DESC`,
      [userId]
    );
    return rows;
  }

  static async create(data) {
    const {
      driverId,
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
      estimatedDuration,
    } = data;

    try {
      const formattedDate = new Date(scheduledDate)
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");

      const [result] = await pool.execute(
        `INSERT INTO trip (
          driverId, startAddress, endAddress, scheduledDate, price,
          availableSeats, description, carId, startLat, startLng,
          endLat, endLng, estimatedDuration, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'created')`,
        [
          driverId,
          startAddress,
          endAddress,
          formattedDate,
          price,
          availableSeats,
          description,
          carId,
          startLat,
          startLng,
          endLat,
          endLng,
          estimatedDuration,
        ]
      );

      if (estimatedDuration) {
        try {
          await pool.execute(
            "INSERT INTO trip_prediction (tripId, predicted_time) VALUES (?, ?)",
            [result.insertId, estimatedDuration]
          );
        } catch (predictionError) {
          console.error("Error creating trip prediction:", predictionError);
        }
      }

      return this.findById(result.insertId);
    } catch (error) {
      console.error("Error in Trip.create:", error);
      throw new Error(`Failed to create trip: ${error.message}`);
    }
  }

  static async updateStatus(id, status) {
    const trip = await this.findById(id);
    if (!trip) {
      return null;
    }

    let actualStartTime = null;
    let actualArrivalTime = null;

    if (status === "active") {
      actualStartTime = new Date();
      await pool.execute(
        "UPDATE trip SET status = ?, actualStartTime = ? WHERE id = ?",
        [status, actualStartTime, id]
      );
    } else if (status === "completed") {
      actualArrivalTime = new Date();
      await pool.execute(
        "UPDATE trip SET status = ?, actualArrivalTime = ? WHERE id = ?",
        [status, actualArrivalTime, id]
      );
      const [rows] = await pool.execute(
        "SELECT actualStartTime, actualArrivalTime FROM trip WHERE id = ?",
        [id]
      );
      const dbActualStartTime = rows[0].actualStartTime;
      const dbActualArrivalTime = rows[0].actualArrivalTime;
      if (dbActualStartTime && dbActualArrivalTime) {
        const start = new Date(dbActualStartTime);
        const end = new Date(dbActualArrivalTime);
        const diffMin = Math.round((end - start) / 60000);
        await pool.execute(
          "UPDATE trip_prediction SET actual_time = ? WHERE tripId = ?",
          [diffMin, id]
        );
      }
    } else {
      await pool.execute(
        "UPDATE trip SET status = ? WHERE id = ?",
        [status, id]
      );
    }
    return this.findById(id);
  }

  static async findAll() {
    const [rows] = await pool.execute(
      `SELECT 
        t.*,
        d.id as driverId, 
        d.email as driverEmail, 
        d.firstName as driverFirstName, 
        d.lastName as driverLastName,
        c.id as carId, 
        c.make as carMake, 
        c.model as carModel, 
        c.license_plate as carLicensePlate,
        tp.predicted_time, 
        tp.actual_time,
        t.startAddress,
        t.endAddress,
        t.startLat,
        t.startLng,
        t.endLat,
        t.endLng,
        t.estimatedDuration,
        t.availableSeats,
        t.price,
        t.description,
        t.status,
        t.scheduledDate,
        t.actualArrivalTime,
        t.createdAt,
        t.updatedAt
       FROM trip t
       LEFT JOIN user d ON t.driverId = d.id
       LEFT JOIN car c ON t.carId = c.id
       LEFT JOIN trip_prediction tp ON t.id = tp.tripId
       ORDER BY t.scheduledDate DESC`
    );
    return rows;
  }

  static async delete(id) {
    await pool.execute("DELETE FROM trip WHERE id = ?", [id]);
  }

  static async findByStatus(status, limit = null) {
    let query = `SELECT 
      t.*,
      d.id as driverId, 
      d.email as driverEmail, 
      d.firstName as driverFirstName, 
      d.lastName as driverLastName,
      c.id as carId, 
      c.make as carMake, 
      c.model as carModel, 
      c.license_plate as carLicensePlate,
      tp.predicted_time, 
      tp.actual_time,
      t.startAddress,
      t.endAddress,
      t.startLat,
      t.startLng,
      t.endLat,
      t.endLng,
      t.estimatedDuration,
      t.availableSeats,
      t.price,
      t.description,
      t.status,
      t.scheduledDate,
      t.actualArrivalTime,
      t.createdAt,
      t.updatedAt
     FROM trip t
     LEFT JOIN user d ON t.driverId = d.id
     LEFT JOIN car c ON t.carId = c.id
     LEFT JOIN trip_prediction tp ON t.id = tp.tripId
     WHERE t.status = ?
     ORDER BY t.scheduledDate DESC`;

    if (limit) {
      query += ` LIMIT ${parseInt(limit)}`;
    }

    const [rows] = await pool.execute(query, [status]);
    return rows;
  }

  static async findByDriverId(driverId, limit = null) {
    let query = `SELECT 
      t.*,
      d.id as driverId, 
      d.email as driverEmail, 
      d.firstName as driverFirstName, 
      d.lastName as driverLastName,
      c.id as carId, 
      c.make as carMake, 
      c.model as carModel, 
      c.license_plate as carLicensePlate,
      tp.predicted_time, 
      tp.actual_time,
      t.startAddress,
      t.endAddress,
      t.startLat,
      t.startLng,
      t.endLat,
      t.endLng,
      t.estimatedDuration,
      t.availableSeats,
      t.price,
      t.description,
      t.status,
      t.scheduledDate,
      t.actualArrivalTime,
      t.createdAt,
      t.updatedAt
     FROM trip t
     LEFT JOIN user d ON t.driverId = d.id
     LEFT JOIN car c ON t.carId = c.id
     LEFT JOIN trip_prediction tp ON t.id = tp.tripId
     WHERE t.driverId = ?
     ORDER BY t.scheduledDate DESC`;

    if (limit) {
      query += ` LIMIT ${parseInt(limit)}`;
    }

    const [rows] = await pool.execute(query, [driverId]);
    return rows;
  }

  static async findRecent(limit = 5) {
    const [rows] = await pool.execute(
      `SELECT 
        t.*,
        d.id as driverId, 
        d.email as driverEmail, 
        d.firstName as driverFirstName, 
        d.lastName as driverLastName,
        c.id as carId, 
        c.make as carMake, 
        c.model as carModel, 
        c.license_plate as carLicensePlate,
        tp.predicted_time, 
        tp.actual_time,
        t.startAddress,
        t.endAddress,
        t.startLat,
        t.startLng,
        t.endLat,
        t.endLng,
        t.estimatedDuration,
        t.availableSeats,
        t.price,
        t.description,
        t.status,
        t.scheduledDate,
        t.actualArrivalTime,
        t.createdAt,
        t.updatedAt
       FROM trip t
       LEFT JOIN user d ON t.driverId = d.id
       LEFT JOIN car c ON t.carId = c.id
       LEFT JOIN trip_prediction tp ON t.id = tp.tripId
       ORDER BY t.scheduledDate DESC
       LIMIT ${parseInt(limit)}`
    );
    return rows;
  }

  static async addPassenger(tripId, userId) {
    try {
      const trip = await this.findById(tripId);
      if (trip.driverId === userId) {
        throw new Error('Водитель не может быть пассажиром своей поездки');
      }

      const [existingPassenger] = await pool.execute(
        'SELECT * FROM trip_passengers WHERE tripId = ? AND userId = ? AND status = "active"',
        [tripId, userId]
      );
      if (existingPassenger.length > 0) {
        throw new Error('Пользователь уже является пассажиром этой поездки');
      }

      const [activeTrips] = await pool.execute(
        `SELECT t.* FROM trip t
         JOIN trip_passengers tp ON t.id = tp.tripId
         WHERE tp.userId = ? AND tp.status = "active"
         AND t.status IN ('created', 'active')`,
        [userId]
      );
      if (activeTrips.length > 0) {
        throw new Error('Пользователь уже является пассажиром другой активной поездки');
      }

      const [cancelledPassenger] = await pool.execute(
        'SELECT * FROM trip_passengers WHERE tripId = ? AND userId = ? AND status = "cancelled"',
        [tripId, userId]
      );
      if (cancelledPassenger.length > 0) {
        await pool.execute(
          'UPDATE trip_passengers SET status = "active", joinedAt = CURRENT_TIMESTAMP WHERE tripId = ? AND userId = ?',
          [tripId, userId]
        );
        return this.findById(tripId);
      }

      const [passengersCount] = await pool.execute(
        'SELECT COUNT(*) as count FROM trip_passengers WHERE tripId = ? AND status = "active"',
        [tripId]
      );
      if (passengersCount[0].count >= trip.availableSeats) {
        throw new Error('В поездке нет свободных мест');
      }

      await pool.execute(
        'INSERT INTO trip_passengers (tripId, userId) VALUES (?, ?)',
        [tripId, userId]
      );
      return this.findById(tripId);
    } catch (error) {
      throw new Error(`Failed to add passenger: ${error.message}`);
    }
  }

  static async removePassenger(tripId, userId) {
    try {
      const [result] = await pool.execute(
        'UPDATE trip_passengers SET status = "cancelled" WHERE tripId = ? AND userId = ? AND status = "active"',
        [tripId, userId]
      );

      if (result.affectedRows === 0) {
        throw new Error("Пассажир не найден или уже отменил поездку");
      }

      return this.findById(tripId);
    } catch (error) {
      throw new Error(`Failed to remove passenger: ${error.message}`);
    }
  }

  static async getPassengers(tripId) {
    const [passengers] = await pool.execute(
      `SELECT u.id, u.email, u.firstName, u.lastName, tp.joinedAt
       FROM trip_passengers tp
       JOIN user u ON tp.userId = u.id
       WHERE tp.tripId = ? AND tp.status = "active"`,
      [tripId]
    );
    return passengers;
  }

  static async getUserActiveTrip(userId) {
    const [trips] = await pool.execute(
      `SELECT t.*, d.firstName as driverFirstName, d.lastName as driverLastName
       FROM trip t
       JOIN trip_passengers tp ON t.id = tp.tripId
       JOIN user d ON t.driverId = d.id
       WHERE tp.userId = ? AND tp.status = "active"
       AND t.status IN ('created', 'active')
       LIMIT 1`,
      [userId]
    );
    return trips[0] || null;
  }

  static async findAvailableForUser(userId, filters = {}) {
    let query = `SELECT t.*, d.firstName as driverFirstName, d.lastName as driverLastName
      FROM trip t
      JOIN user d ON t.driverId = d.id
      WHERE t.status = 'created'
        AND t.driverId != ?
        AND t.id NOT IN (
          SELECT tp.tripId FROM trip_passengers tp WHERE tp.userId = ? AND tp.status = 'active'
        )`;
    const params = [userId, userId];

    if (filters.from) {
      query += " AND t.startAddress LIKE ?";
      params.push(`%${filters.from}%`);
    }
    if (filters.to) {
      query += " AND t.endAddress LIKE ?";
      params.push(`%${filters.to}%`);
    }
    if (filters.date) {
      query += " AND DATE(t.scheduledDate) = ?";
      params.push(filters.date);
    }
    query += " ORDER BY t.scheduledDate ASC";
    const [rows] = await pool.execute(query, params);
    return rows;
  }
}

module.exports = Trip;
