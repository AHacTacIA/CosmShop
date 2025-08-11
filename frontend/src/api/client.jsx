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
 * Дополнительные методы API
 */
apiClient.auth = {
  login: async (credentials) => {
    const response = await apiClient.post('/api/token/', credentials);
    AuthService.saveAuthData(response.data);
    return response;
  },

  register: async (userData) => {
    const response = await apiClient.post('/api/register/', userData);
    AuthService.saveAuthData(response.data);
    return response;
  },

  logout: () => {
    AuthService.clearAuthData();
  },

  getCurrentUser: AuthService.getCurrentUser,
  isAuthenticated: AuthService.isAuthenticated,
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

export default apiClient;