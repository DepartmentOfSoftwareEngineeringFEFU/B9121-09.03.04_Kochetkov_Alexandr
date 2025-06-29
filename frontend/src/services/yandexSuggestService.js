import axios from 'axios';

const YANDEX_SUGGEST_API = 'https://suggest-maps.yandex.ru/v1/suggest';
const API_KEY = '9246958b-7b34-43c4-93e9-cd7e767e56be';

// Координаты ограничивающего прямоугольника для Владивостока (bbox: lon1,lat1~lon2,lat2)
const VLADIVOSTOK_BBOX = '131.8,42.9~132.1,43.3';

export const getAddressSuggestions = async (text, sessiontoken) => {
  if (!text) return [];
  const params = {
    apikey: API_KEY,
    text,
    results: 5,
    lang: 'ru_RU',
    print_address: 1,
    sessiontoken,
    types: 'geo,street,house',
    bbox: VLADIVOSTOK_BBOX,
    strict_bounds: 1,
  };
  try {
    const response = await axios.get(YANDEX_SUGGEST_API, { params });
    return response.data.results || [];
  } catch (error) {
    console.error('Ошибка при получении подсказок Яндекс.Карт:', error);
    return [];
  }
}; 