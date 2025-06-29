import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/apiService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const response = await authService.getProfile();
      const userData = response.data;
      const user = {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        is_driver: userData.is_driver,
        role: userData.role
      };
      setUser(user);
      setError(null);
    } catch (error) {
      console.error('Error loading user:', error);
      localStorage.removeItem('token');
      setError(error.response?.data?.message || 'Ошибка загрузки профиля');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setError(null);
    try {
      const response = await authService.login(email, password);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
      setError(null);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Неверный логин или пароль');
      return false;
    }
  };

  const register = async (email, password, firstName, lastName) => {
    setError(null);
    try {
      const userData = { email, password, firstName, lastName };
      const response = await authService.register(userData);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
      setError(null);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.response?.data?.message) {
        if (error.response.data.message.includes('already exists')) {
          setError('Пользователь с таким email уже существует');
        } else {
          setError(error.response.data.message);
        }
      } else {
        setError('Ошибка при регистрации');
      }
      
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setError(null);
  };

  const updateProfile = async (userData) => {
    setError(null);
    try {
      const response = await authService.updateProfile(userData);
      setUser(response.data);
      setError(null);
      return true;
    } catch (error) {
      console.error('Profile update error:', error);
      setError(error.response?.data?.message || 'Ошибка обновления профиля');
      return false;
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    clearError: () => setError(null)
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 