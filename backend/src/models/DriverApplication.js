const pool = require('../config/database');

class DriverApplication {
  static async create(data) {
    const { userId, licenseNumber, carNumber, carBrand, carModel, carColor, licensePhotoPath } = data;
    
    const applicationData = {
      userId,
      licenseNumber: licenseNumber || '',
      carNumber: carNumber || '',
      carBrand: carBrand || '',
      carModel: carModel || '',
      carColor: carColor || '',
      licensePhotoPath: licensePhotoPath || null
    };

    const [result] = await pool.execute(
      'INSERT INTO driver_application (userId, licenseNumber, carNumber, carBrand, carModel, carColor, licensePhotoPath) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        applicationData.userId,
        applicationData.licenseNumber,
        applicationData.carNumber,
        applicationData.carBrand,
        applicationData.carModel,
        applicationData.carColor,
        applicationData.licensePhotoPath
      ]
    );
    return this.findById(result.insertId);
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM driver_application WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async findByUserId(userId) {
    if (!userId) {
      return null;
    }
    
    const [rows] = await pool.execute(
      'SELECT * FROM driver_application WHERE userId = ?',
      [userId]
    );
    return rows[0];
  }

  static async findAllPending() {
    const [rows] = await pool.execute(
      `SELECT da.*, 
              u.email, u.firstName, u.lastName
       FROM driver_application da
       JOIN user u ON da.userId = u.id
       WHERE da.status = 'pending'`
    );
    return rows;
  }

  static async updateStatus(id, status) {
    await pool.execute(
      'UPDATE driver_application SET status = ? WHERE id = ?',
      [status, id]
    );
    return this.findById(id);
  }

  static async delete(id) {
    await pool.execute(
      'DELETE FROM driver_application WHERE id = ?',
      [id]
    );
  }
}

module.exports = DriverApplication; 