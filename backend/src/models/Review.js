const pool = require('../config/database');

class Review {
  static async create({ passengerId, tripId, text, rating }) {
    const [result] = await pool.execute(
      'INSERT INTO review (passengerId, tripId, text, rating) VALUES (?, ?, ?, ?)',
      [passengerId, tripId, text, rating]
    );
    return this.findById(result.insertId);
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM review WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async findByTripId(tripId) {
    const [rows] = await pool.execute(
      'SELECT r.*, u.firstName, u.lastName FROM review r JOIN user u ON r.passengerId = u.id WHERE r.tripId = ?',
      [tripId]
    );
    return rows;
  }

  static async findByDriverId(driverId) {
    const [rows] = await pool.execute(
      `SELECT r.*, u.firstName, u.lastName, t.driverId FROM review r
       JOIN trip t ON r.tripId = t.id
       JOIN user u ON r.passengerId = u.id
       WHERE t.driverId = ?`,
      [driverId]
    );
    return rows;
  }

  static async findByPassengerAndTrip(passengerId, tripId) {
    const [rows] = await pool.execute(
      'SELECT * FROM review WHERE passengerId = ? AND tripId = ?',
      [passengerId, tripId]
    );
    return rows[0];
  }
}

module.exports = Review; 