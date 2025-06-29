const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "qwerty123",
  database: process.env.DB_NAME || "fefu_drive",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("Подключение к базе успешно!");
    connection.release();
    return true;
  } catch (err) {
    console.error("Ошибка при подключении к MySQL:", err);
    return false;
  }
}

testConnection();

module.exports = pool;
