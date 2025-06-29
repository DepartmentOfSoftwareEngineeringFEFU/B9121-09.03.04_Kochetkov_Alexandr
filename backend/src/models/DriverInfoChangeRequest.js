const pool = require('../config/database');

class DriverInfoChangeRequest {
  static async create(data) {
    const { userId, licenseNumber, carNumber, carBrand, carModel, carColor, licensePhotoPath } = data;
    
    const [result] = await pool.execute(
      'INSERT INTO driver_info_change_request (userId, licenseNumber, carNumber, carBrand, carModel, carColor, licensePhotoPath) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, licenseNumber, carNumber, carBrand, carModel, carColor, licensePhotoPath || null]
    );
    return this.findById(result.insertId);
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM driver_info_change_request WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async findByUserId(userId) {
    const [rows] = await pool.execute(
      'SELECT * FROM driver_info_change_request WHERE userId = ? ORDER BY createdAt DESC',
      [userId]
    );
    return rows;
  }

  static async findAllPending() {
    const [rows] = await pool.execute(
      `SELECT r.*, 
              u.email, u.firstName, u.lastName,
              u.licenseNumber as currentLicenseNumber,
              c.license_plate as currentCarNumber,
              c.make as currentCarBrand,
              c.model as currentCarModel,
              c.color as currentCarColor
       FROM driver_info_change_request r
       JOIN user u ON r.userId = u.id
       LEFT JOIN car c ON u.id = c.user_id
       WHERE r.status = 'pending'`
    );
    return rows;
  }

  static async updateStatus(id, status) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [request] = await connection.execute(
        'SELECT * FROM driver_info_change_request WHERE id = ?',
        [id]
      );

      if (!request[0]) {
        throw new Error('Заявка не найдена');
      }

      await connection.execute(
        'UPDATE driver_info_change_request SET status = ? WHERE id = ?',
        [status, id]
      );

      if (status === 'approved') {
        await connection.execute(
          `UPDATE driver_application 
           SET licenseNumber = ?,
               carNumber = ?,
               carBrand = ?,
               carModel = ?,
               carColor = ?,
               licensePhotoPath = ?
           WHERE userId = ?`,
          [
            request[0].licenseNumber,
            request[0].carNumber,
            request[0].carBrand,
            request[0].carModel,
            request[0].carColor,
            request[0].licensePhotoPath,
            request[0].userId
          ]
        );

        await connection.execute(
          `UPDATE car 
           SET make = ?, 
               model = ?, 
               color = ?, 
               license_plate = ?
           WHERE user_id = ?`,
          [
            request[0].carBrand,
            request[0].carModel,
            request[0].carColor,
            request[0].carNumber,
            request[0].userId
          ]
        );

        await connection.execute(
          'UPDATE user SET licenseNumber = ? WHERE id = ?',
          [request[0].licenseNumber, request[0].userId]
        );
      }

      await connection.commit();
      return this.findById(id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async delete(id) {
    await pool.execute(
      'DELETE FROM driver_info_change_request WHERE id = ?',
      [id]
    );
  }
}

module.exports = DriverInfoChangeRequest; 