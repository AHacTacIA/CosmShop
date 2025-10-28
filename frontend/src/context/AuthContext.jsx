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
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};