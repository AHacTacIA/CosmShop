import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = () => {
    const authStatus = apiClient.auth.isAuthenticated();
    const userData = apiClient.auth.getCurrentUser();
    setIsAuthenticated(authStatus);
    setCurrentUser(userData);
    setLoading(false);
  };

  // Добавляем функцию refreshUserData
  const refreshUserData = async () => {
    try {
      console.log('Refreshing user data in AuthContext...');
      const userData = await apiClient.auth.refreshUserData();

      if (userData) {
        setCurrentUser(userData);
        setIsAuthenticated(true);
        console.log('User data refreshed in context:', userData);
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }

      return userData;
    } catch (error) {
      console.error('Error refreshing user data in context:', error);
      setCurrentUser(null);
      setIsAuthenticated(false);
      return null;
    }
  };

  const login = async (credentials) => {
    try {
      const response = await apiClient.auth.login(credentials);
      checkAuth();
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    apiClient.auth.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value = {
    isAuthenticated,
    currentUser,
    loading,
    login,
    logout,
    checkAuth,
    refreshUserData // Добавляем функцию в контекст
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};