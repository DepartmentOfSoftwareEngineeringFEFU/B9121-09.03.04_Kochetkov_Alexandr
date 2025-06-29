const axios = require('axios');

async function predictTripTime({ distance_km, weekday, hour }) {
  try {
    const response = await axios.post('http://127.0.0.1:8000/predict', {
      distance_km,
      weekday,
      hour
    });
    return response.data.predicted_time_min;
  } catch (error) {
    console.error('Ошибка при обращении к ML-сервису:', error.message);
    return null;
  }
}

module.exports = { predictTripTime }; 