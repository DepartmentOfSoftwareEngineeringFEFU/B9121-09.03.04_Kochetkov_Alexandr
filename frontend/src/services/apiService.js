import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const apiService = axios.create({
  baseURL: API_URL
});

apiService.interceptors.request.use((config) => {
  const isAdminEndpoint = config.url.startsWith('/admin');
  const token = isAdminEndpoint 
    ? localStorage.getItem('adminToken')
    : localStorage.getItem('token');
    
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiService.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.log('Error response:', error.response.status, error.response.data);
      
      if (error.response.status === 401 && !error.config.url.startsWith('/admin')) {
        localStorage.removeItem('token');
      }
    } else {
      console.log('Network error or request cancelled:', error.message);
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email, password) => {
    try {
      const response = await apiService.post('/auth/login', { email, password });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response;
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Ошибка входа в систему';
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Неверный логин или пароль';
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        errorMessage = 'Сервер не отвечает. Проверьте соединение с интернетом.';
      }
      
      throw new Error(errorMessage);
    }
  },

  register: async (userData) => {
    try {
      const response = await apiService.post('/auth/register', userData);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  // Метод для получения профиля пользователя
  getProfile: async () => {
    try {
      const response = await apiService.get('/users/me');
      return response;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },

  // Метод для обновления профиля пользователя
  updateProfile: async (userData) => {
    try {
      const response = await apiService.put('/users/me', userData);
      return response;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  // Метод для изменения пароля
  changePassword: async (oldPassword, newPassword) => {
    try {
      const response = await apiService.put('/users/me/password', {
        oldPassword,
        newPassword
      });
      return response;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  },

  // Метод для проверки авторизации
  checkAuth: async () => {
    try {
      const response = await apiService.get('/auth/check');
      return response;
    } catch (error) {
      console.error('Auth check error:', error);
      throw error;
    }
  },

  // Метод для подачи заявки на водителя
  submitDriverApplication: async (applicationData) => {
    try {
      const response = await apiService.post('/driver-applications', applicationData);
      return response;
    } catch (error) {
      console.error('Submit application error:', error);
      throw error;
    }
  },

  // Метод для получения статуса заявки на водителя
  getDriverApplicationStatus: async () => {
    try {
      const response = await apiService.get('/driver-applications/my');
      return response;
    } catch (error) {
      console.error('Get application status error:', error);
      throw error;
    }
  },
  
  // Метод для авторизации администратора
  adminLogin: async (login, password) => {
    try {
      const response = await apiService.post('/admin/login', { login, password });
      if (response.data.token) {
        localStorage.setItem('adminToken', response.data.token);
      }
      return response.data;
    } catch (error) {
      console.error('Admin login error:', error);
      throw error;
    }
  },

  // Метод для выхода администратора
  adminLogout: () => {
    localStorage.removeItem('adminToken');
  },

  // Метод для получения статистики
  getStatistics: async () => {
    try {
      const response = await apiService.get('/admin/statistics');
      return response.data;
    } catch (error) {
      console.error('Statistics error:', error);
      return {
        totalUsers: 0,
        totalDrivers: 0,
        totalTrips: 0,
        activeTrips: 0,
        completedTrips: 0,
        totalRevenue: 0,
        averageTripPrice: 0,
        totalApplications: 0,
        pendingApplications: 0,
        approvedApplications: 0,
        rejectedApplications: 0
      };
    }
  },

  // Методы для работы с водителями
  getDrivers: async () => {
    try {
      const response = await apiService.get('/admin/drivers');
      return { data: response.data || [] };
    } catch (error) {
      console.error('Get drivers error:', error);
      return { data: [] };
    }
  },

  revokeDriverStatus: async (userId) => {
    try {
      const response = await apiService.post(`/admin/drivers/${userId}/revoke`);
      return response.data;
    } catch (error) {
      console.error('Revoke driver error:', error);
      throw error;
    }
  },

  // Методы для работы с заявками
  getDriverApplications: async () => {
    try {
      const response = await apiService.get('/admin/applications');
      return { data: response.data || [] };
    } catch (error) {
      console.error('Get applications error:', error);
      return { data: [] };
    }
  },

  getDriverApplicationsByUserId: async (userId) => {
    try {
      const response = await apiService.get(`/admin/applications/user/${userId}`);
      return response.data || [];
    } catch (error) {
      console.error('Get applications by user ID error:', error);
      return [];
    }
  },

  updateDriverApplicationStatus: async (applicationId, data) => {
    try {
      const response = await apiService.put(`/admin/applications/${applicationId}/status`, data);
      return response.data;
    } catch (error) {
      console.error('Update application status error:', error);
      throw error;
    }
  },

  // Методы для работы с поездками
  getTrips: async () => {
    try {
      const response = await apiService.get('/admin/trips');
      return response.data;
    } catch (error) {
      console.error('Get trips error:', error);
      return [];
    }
  },

  getTripById: async (tripId) => {
    try {
      const response = await apiService.get(`/admin/trips/${tripId}`);
      return response.data;
    } catch (error) {
      console.error('Get trip by id error:', error);
      throw error;
    }
  },

  updateTripStatus: async (tripId, status) => {
    try {
      const response = await apiService.put(`/admin/trips/${tripId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Update trip status error:', error);
      throw error;
    }
  },

  // Методы для работы с пользователями
  getUsers: async () => {
    try {
      const response = await apiService.get('/admin/users');
      return response.data;
    } catch (error) {
      console.error('Get users error:', error);
      return [];
    }
  },

  getUserById: async (userId) => {
    try {
      const response = await apiService.get(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Get user by id error:', error);
      throw error;
    }
  },

  updateUserStatus: async (userId, data) => {
    try {
      const response = await apiService.put(`/admin/users/${userId}/status`, data);
      return response.data;
    } catch (error) {
      console.error('Update user status error:', error);
      throw error;
    }
  },

  // Метод для получения автомобилей пользователя
  getUserCars: async () => {
    try {
      const response = await apiService.get('/users/me/cars');
      
      // Если данные приходят в обертке response.data.data, извлекаем их
      const cars = response.data?.data || response.data || [];
      
      return { data: cars };
    } catch (error) {
      console.error('Get user cars error:', error);
      return { data: [] };
    }
  },

  // Создание заявки на изменение данных водителя
  submitDriverInfoChange: async (data) => {
    try {
      let config = {};
      // Если data — это FormData, не выставляем Content-Type вручную
      if (data instanceof FormData) {
        config = { headers: { } };
      }
      const response = await apiService.post('/users/me/driver-info-change', data, config);
      return response.data;
    } catch (error) {
      console.error('Ошибка при создании заявки:', error);
      throw error;
    }
  },

  // Получение заявок пользователя
  getDriverInfoChangeRequests: async () => {
    try {
      const response = await apiService.get('/users/me/driver-info-change');
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении заявок:', error);
      throw error;
    }
  },

  getLicensePhoto: (filename) => {
    return `${API_URL}/driver-applications/license-photo/${filename}`;
  },

  checkChatAccess: async (tripId) => {
    const response = await apiService.get(`/trips/${tripId}/chat-access`);
    return response.data;
  }
};

export const tripsService = {
  getMyTrips: async () => {
    try {
      const response = await apiService.get('/trips/my');
      return response.data;
    } catch (error) {
      console.error('Get my trips error:', error);
      return [];
    }
  },

  createNewTrip: async (tripData) => {
    try {
      console.log('Sending trip data:', tripData);
      const response = await apiService.post('/trips', {
        startAddress: tripData.startAddress,
        endAddress: tripData.endAddress,
        scheduledDate: tripData.scheduledDate,
        price: tripData.price,
        availableSeats: tripData.availableSeats,
        description: tripData.description,
        carId: tripData.carId,
        startLat: tripData.startLat,
        startLng: tripData.startLng,
        endLat: tripData.endLat,
        endLng: tripData.endLng,
        estimatedDuration: tripData.estimatedDuration
      });
      return response;
    } catch (error) {
      console.error('Create trip error:', error);
      throw error;
    }
  },

  updateTripStatus: async (tripId, status) => {
    try {
      const response = await apiService.put(`/trips/${tripId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Update trip status error:', error);
      throw error;
    }
  },

  getTrips: async (filters) => {
    try {
      const response = await apiService.get('/trips', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Get trips error:', error);
      return [];
    }
  },

  getTrip: async (id) => {
    try {
      const response = await apiService.get(`/trips/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get trip error:', error);
      throw error;
    }
  },

  updateTrip: async (id, tripData) => {
    try {
      const response = await apiService.put(`/trips/${id}`, tripData);
      return response.data;
    } catch (error) {
      console.error('Update trip error:', error);
      throw error;
    }
  },

  deleteTrip: async (id) => {
    try {
      const response = await apiService.delete(`/trips/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete trip error:', error);
      throw error;
    }
  },

  joinTrip: async (id) => {
    try {
      const response = await apiService.post(`/trips/${id}/join`);
      return response.data;
    } catch (error) {
      console.error('Join trip error:', error);
      throw error;
    }
  },

  leaveTrip: async (id) => {
    try {
      const response = await apiService.post(`/trips/${id}/leave`);
      return response.data;
    } catch (error) {
      console.error('Leave trip error:', error);
      throw error;
    }
  },

  getJoinedTrips: async () => {
    try {
      const response = await apiService.get('/trips/joined');
      return response.data;
    } catch (error) {
      console.error('Get joined trips error:', error);
      return [];
    }
  },

  // Получение ожидающих поездок
  getPendingTrips: async () => {
    try {
      const response = await apiService.get('/trips/pending');
      return response.data;
    } catch (error) {
      console.error('Get pending trips error:', error);
      throw error;
    }
  },

  // Получение последних завершенных поездок
  getRecentCompletedTrips: async (limit = 5) => {
    try {
      const response = await apiService.get(`/trips/completed?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Get completed trips error:', error);
      throw error;
    }
  },

  // Получение последних поездок водителя
  getDriverRecentTrips: async (limit = 3) => {
    try {
      const response = await apiService.get(`/trips/driver/recent?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Get driver recent trips error:', error);
      throw error;
    }
  },

  // Получение последних поездок (любых)
  getRecentTrips: async (limit = 5) => {
    try {
      const response = await apiService.get(`/trips/recent?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Get recent trips error:', error);
      throw error;
    }
  }
};

export const adminService = {
  // Получение всех заявок на изменение данных водителя
  getDriverInfoChangeRequests: async () => {
    try {
      const response = await apiService.get('/admin/driver-info-change-requests');
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении заявок:', error);
      throw error;
    }
  },

  // Обновление статуса заявки
  updateDriverInfoChangeRequestStatus: async (id, status) => {
    try {
      const response = await apiService.put(`/admin/driver-info-change-requests/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Ошибка при обновлении статуса заявки:', error);
      throw error;
    }
  },

  // Получение количества необработанных заявок на водителя
  getPendingApplicationsCount: async () => {
    try {
      const response = await apiService.get('/admin/applications/count');
      return response.data.count;
    } catch (error) {
      console.error('Ошибка при получении количества заявок:', error);
      return 0;
    }
  },

  // Получение количества необработанных заявок на изменение данных
  getPendingInfoChangeRequestsCount: async () => {
    try {
      const response = await apiService.get('/admin/driver-info-change-requests/count');
      return response.data.count;
    } catch (error) {
      console.error('Ошибка при получении количества заявок на изменение:', error);
      return 0;
    }
  }
};

// Методы для работы с заявками на изменение данных водителей
export const driverInfoChangeService = {
  // Получение всех заявок на изменение данных водителей
  getDriverInfoChangeRequests: async () => {
    try {
      const response = await apiService.get('/admin/driver-info-change-requests');
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении заявок:', error);
      throw error;
    }
  },

  // Одобрение заявки
  approveRequest: async (requestId) => {
    try {
      const response = await apiService.put(`/admin/driver-info-change-requests/${requestId}/status`, {
        status: 'approved'
      });
      return response.data;
    } catch (error) {
      console.error('Ошибка при одобрении заявки:', error);
      throw error;
    }
  },

  // Отклонение заявки
  rejectRequest: async (requestId) => {
    try {
      const response = await apiService.put(`/admin/driver-info-change-requests/${requestId}/status`, {
        status: 'rejected'
      });
      return response.data;
    } catch (error) {
      console.error('Ошибка при отклонении заявки:', error);
      throw error;
    }
  },

  getLicensePhoto: (filename) => {
    return `${API_URL}/driver-applications/license-photo/${filename}`;
  }
};

export const tripService = {
  async joinTrip(tripId) {
    const response = await apiService.post(`/trip-passengers/${tripId}/join`);
    return response.data;
  },

  async leaveTrip(tripId) {
    const response = await apiService.post(`/trip-passengers/${tripId}/leave`);
    return response.data;
  },

  async getPassengers(tripId) {
    const response = await apiService.get(`/trip-passengers/${tripId}/passengers`);
    return response.data;
  },

  async getActiveTrip() {
    const response = await apiService.get('/trip-passengers/active');
    return response.data;
  },

  async getTrips(filters = {}) {
    try {
      const response = await apiService.get('/trips', { params: filters });
      return response;
    } catch (error) {
      console.error('Get trips error:', error);
      throw error;
    }
  }
};

export const reviewService = {
  // Оставить отзыв
  addReview: async ({ tripId, text, rating }) => {
    const response = await apiService.post('/reviews', { tripId, text, rating });
    return response.data;
  },
  // Получить отзывы по водителю
  getDriverReviews: async (driverId) => {
    const response = await apiService.get(`/reviews/driver/${driverId}`);
    return response.data;
  },
  // Получить отзывы по поездке
  getTripReviews: async (tripId) => {
    const response = await apiService.get(`/reviews/trip/${tripId}`);
    return response.data;
  },
};

export default authService; 