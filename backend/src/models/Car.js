const pool = require('../config/database');

class Car {
  static async create(data) {
    const { user_id, make, model, license_plate, color } = data;
    
    const [result] = await pool.execute(
      'INSERT INTO car (user_id, make, model, license_plate, color) VALUES (?, ?, ?, ?, ?)',
      [user_id, make, model, license_plate, color]
    );
    
    return this.findById(result.insertId);
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM car WHERE car_id = ?',
      [id]
    );
    return rows[0];
  }

  static async findByUserId(userId) {
    const [rows] = await pool.execute(
      'SELECT * FROM car WHERE user_id = ?',
      [userId]
    );
    return rows;
  }

  static async update(id, data) {
    const { make, model, license_plate, color } = data;
    
    const fields = [];
    const values = [];

    if (make) {
      fields.push('make = ?');
      values.push(make);
    }
    
    if (model) {
      fields.push('model = ?');
      values.push(model);
    }
    
    if (license_plate) {
      fields.push('license_plate = ?');
      values.push(license_plate);
    }
    
    if (color) {
      fields.push('color = ?');
      values.push(color);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    
    await pool.execute(
      `UPDATE car SET ${fields.join(', ')} WHERE car_id = ?`,
      values
    );

    return this.findById(id);
  }

  static async delete(id) {
    await pool.execute(
      'DELETE FROM car WHERE car_id = ?',
      [id]
    );
  }
}

module.exports = Car; 