const pool = require('../config/database');

class TripPrediction {
  static async create(data) {
    const { tripId, predicted_time } = data;
    const [result] = await pool.execute(
      'INSERT INTO trip_prediction (tripId, predicted_time) VALUES (?, ?)',
      [tripId, predicted_time]
    );
    return this.findById(result.insertId);
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM trip_prediction WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async findByTripId(tripId) {
    const [rows] = await pool.execute(
      'SELECT * FROM trip_prediction WHERE tripId = ?',
      [tripId]
    );
    return rows[0];
  }

  static async updateActualTime(id, actual_time) {
    await pool.execute(
      'UPDATE trip_prediction SET actual_time = ? WHERE id = ?',
      [actual_time, id]
    );
    return this.findById(id);
  }
}

module.exports = TripPrediction; 