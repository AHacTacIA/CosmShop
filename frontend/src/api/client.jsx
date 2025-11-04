// client.jsx
import axios from 'axios';

/**
 * Конфигурация базового API клиента
 */
const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

/**
 * Сервис для работы с аутентификацией и токенами
 */
const AuthService = {
  /**
   * Сохраняет данные аутентификации в localStorage
   */
  saveAuthData: (data) => {
    if (data.access) {
      localStorage.setItem('access_token', data.access);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.access}`;
    }
    if (data.refresh) {
      localStorage.setItem('refresh_token', data.refresh);
    }
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
  },

  /**
   * Очищает данные аутентификации
   */
  clearAuthData: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    delete apiClient.defaults.headers.common['Authorization'];
  },

  /**
   * Получает текущего авторизованного пользователя
   */
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  /**
   * Проверяет, авторизован ли пользователь
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },
};

/**
 * Перехватчик запросов для добавления JWT-токена
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Перехватчик ответов для обработки ошибок и обновления токена
 */
apiClient.interceptors.response.use(
  (response) => {
    // Автоматически сохраняем данные аутентификации, если они есть в ответе
    if (response.data?.access) {
      AuthService.saveAuthData(response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const isUnauthorized = error.response?.status === 401;
    const isNotRefreshRequest = !originalRequest.url.includes('/token/refresh');
    const shouldRefresh = isUnauthorized && isNotRefreshRequest && !originalRequest._retry;

    if (shouldRefresh) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token available');

        const response = await apiClient.post('/api/token/refresh/', {
          refresh: refreshToken,
        });

        AuthService.saveAuthData(response.data);
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;

        return apiClient(originalRequest);
      } catch (refreshError) {
        AuthService.clearAuthData();

        // Перенаправляем на страницу входа только если мы не на странице аутентификации
        if (!['/login', '/register'].includes(window.location.pathname)) {
          window.location.href = '/login?session_expired=true';
        }

        return Promise.reject(refreshError);
      }
    }

    // Обработка других ошибок
    if (error.response) {
      switch (error.response.status) {
        case 403:
          error.message = 'Доступ запрещен';
          break;
        case 404:
          error.message = 'Ресурс не найден';
          break;
        case 500:
          error.message = 'Ошибка сервера';
          break;
        default:
          error.message = error.response.data?.detail || 'Произошла ошибка';
      }
    } else if (error.request) {
      error.message = 'Нет ответа от сервера';
    }

    return Promise.reject(error);
  }
);



/**
 * Получает полные данные пользователя через profiles/me endpoint
 */
const fetchUserProfile = async () => {
  try {
    const response = await apiClient.get('/profiles/me/');
    let userData = response.data;

    console.log('Raw profile response:', userData);

    // Обрабатываем разные структуры ответа
    if (userData.user) {
      // Если данные вложенные (user: {...})
      userData = {
        ...userData.user,  // данные из модели User
        ...userData        // данные из модели Profile
      };
      // Удаляем вложенный объект user чтобы избежать дублирования
      delete userData.user;
    }

    // Убедимся что есть обязательные поля
    if (!userData.username) {
      console.warn('User profile missing username');
    }

    return userData;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

/**
 * Дополнительные методы API
 */
apiClient.auth = {
  login: async (credentials) => {
    try {
      console.log('Starting login process...');

      // Шаг 1: Получаем JWT токены
      const tokenResponse = await apiClient.post('/api/token/', credentials);
      console.log('Token received:', tokenResponse.data);

      // Временно сохраняем токен для следующего запроса
      const tempToken = tokenResponse.data.access;
      localStorage.setItem('access_token', tempToken);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${tempToken}`;

      // Шаг 2: Получаем полные данные пользователя
      let userData = {};
      try {
        userData = await fetchUserProfile();
        console.log('User profile fetched:', userData);
      } catch (profileError) {
        console.warn('Could not fetch user profile, using fallback data');
        // Fallback: создаем базовые данные из credentials
        userData = {
          username: credentials.username,
        };
      }

      // Шаг 3: Сохраняем полные данные аутентификации
      const authData = {
        access: tokenResponse.data.access,
        refresh: tokenResponse.data.refresh,
        user: userData
      };

      AuthService.saveAuthData(authData);
      console.log('Auth data saved successfully');

      return { data: authData };

    } catch (error) {
      console.error('Login failed:', error);
      // Очищаем на случай частичного успеха
      AuthService.clearAuthData();
      throw error;
    }
  },

  register: async (userData) => {
    try {
      const response = await apiClient.post('/api/register/', userData);

      // После регистрации автоматически логинимся
      if (response.data.access) {
        AuthService.saveAuthData(response.data);
        console.log('Registration successful, user data saved');
      }

      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  },

  logout: () => {
    console.log('Logging out...');
    AuthService.clearAuthData();
  },

  getCurrentUser: AuthService.getCurrentUser,

  isAuthenticated: AuthService.isAuthenticated,

  /**
   * Принудительно обновляет данные пользователя
   */
  refreshUserData: async () => {
    try {
      console.log('Refreshing user data...');
      const userData = await fetchUserProfile();

      // Обновляем данные в localStorage
      const currentAuthData = {
        access: localStorage.getItem('access_token'),
        refresh: localStorage.getItem('refresh_token'),
        user: userData
      };

      AuthService.saveAuthData(currentAuthData);
      console.log('User data refreshed:', userData);

      return userData;
    } catch (error) {
      console.error('Error refreshing user data:', error);

      // Если не удалось обновить, но пользователь авторизован - не очищаем данные
      if (AuthService.isAuthenticated()) {
        console.warn('Keeping existing user data due to refresh failure');
        return AuthService.getCurrentUser();
      }

      return null;
    }
  },

  /**
   * Проверяет валидность токена и обновляет данные пользователя
   */
  checkAuth: async () => {
    if (!AuthService.isAuthenticated()) {
      return { isAuthenticated: false, user: null };
    }

    try {
      const userData = await apiClient.auth.refreshUserData();
      return { isAuthenticated: true, user: userData };
    } catch (error) {
      console.error('Auth check failed:', error);
      return { isAuthenticated: false, user: null };
    }
  }
};

/**
 * Вспомогательные методы для работы с API
 */
apiClient.getResource = async (url, params = {}) => {
  return apiClient.get(url, { params });
};

apiClient.createResource = async (url, data) => {
  return apiClient.post(url, data);
};

apiClient.updateResource = async (url, data) => {
  return apiClient.put(url, data);
};

apiClient.patchResource = async (url, data) => {
  return apiClient.patch(url, data);
};

apiClient.deleteResource = async (url) => {
  return apiClient.delete(url);
};

// Методы для работы с профилями
apiClient.profiles = {
  getMyProfile: () => apiClient.get('/profiles/me/'),
  updateProfile: (data) => apiClient.patch('/profiles/me/', data),
};



// Методы для работы с пользователями
apiClient.users = {
  getCurrentUser: () => apiClient.get('/profiles/me/'),
};

export default apiClient;