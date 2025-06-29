const bcrypt = require('bcryptjs');
const pool = require('../config/database');

class User {
  static async findByEmail(email) {
    const [rows] = await pool.execute(
      'SELECT * FROM user WHERE email = ?',
      [email]
    );
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM user WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async create({ email, password, firstName, lastName }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO user (email, password, firstName, lastName) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, firstName, lastName]
    );
    return this.findById(result.insertId);
  }

  static async updateProfile(id, { firstName, lastName, is_driver, licenseNumber }) {
    const fields = [];
    const values = [];

    if (firstName) {
      fields.push('firstName = ?');
      values.push(firstName);
    }
    if (lastName) {
      fields.push('lastName = ?');
      values.push(lastName);
    }
    if (typeof is_driver === 'boolean') {
      fields.push('is_driver = ?');
      values.push(is_driver);
    }
    if (licenseNumber) {
      fields.push('licenseNumber = ?');
      values.push(licenseNumber);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    await pool.execute(
      `UPDATE user SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  static async comparePassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }
}

module.exports = User; 