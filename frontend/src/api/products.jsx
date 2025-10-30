import apiClient from "./client";

export const productService = {
  // Получение списка продуктов с фильтрацией
  getProducts: (params = {}) => {
    return apiClient.get('/products/', {
      params: {
        brand: params.brand,
        category: params.category,
        max_price: params.maxPrice,
        min_price: params.minPrice,
        search: params.search,
      }
    });
  },

  // Получение конкретного продукта по ID
  getProduct: (id) => {
    return apiClient.get(`/products/${id}/`);
  },

  // Поиск продуктов
  searchProducts: (query) => {
    return apiClient.get('/products/search/', {
      params: { search: query }
    });
  },

  // Работа с изображениями продукта
  getProductImages: (productId) => {
    return apiClient.get(`/products/${productId}/images/`);
  },

  // Работа с вариантами продукта
  getProductVariants: (productId) => {
    return apiClient.get(`/products/${productId}/variants/`);
  },

  // Получение конкретного варианта
  getVariant: (variantId) => {
    return apiClient.get(`/product-variants/${variantId}/`);
  },

  // Работа с отзывами
  getProductReviews: (productId) => {
    return apiClient.get(`/products/${productId}/reviews/`);
  },

  // Создание отзыва
  createReview: (productId, reviewData) => {
    return apiClient.post('/reviews/', {
      product: productId,
      ...reviewData
    });
  },

  // Обновление отзыва
  updateReview: (reviewId, reviewData) => {
    return apiClient.put(`/reviews/${reviewId}/`, reviewData);
  },

  // Удаление отзыва
  deleteReview: (reviewId) => {
    return apiClient.delete(`/reviews/${reviewId}/`);
  },

  // Добавление в избранное
  addToFavorites: (productId) => {
    return apiClient.post(`/products/${productId}/favorite/`);
  },

  // Удаление из избранного
  removeFromFavorites: (productId) => {
    return apiClient.delete(`/products/${productId}/unfavorite/`);
  },

  // Получение списка избранных продуктов
  getFavorites: () => {
    return apiClient.get('/profiles/me/favorites/').then(response => {
      return response.data.results || [];
    });
  },

  // Альтернативный вариант с пагинацией
  getFavoritesPaginated: (page = 1, pageSize = 20) => {
    return apiClient.get('/profiles/me/favorites/', {
      params: { page, page_size: pageSize }
    });
  },

  // Проверка, находится ли продукт в избранном
  checkIsFavorite: async (productId) => {
    try {
      const response = await apiClient.get('/profiles/me/');
      const favorites = response.data.favorites || [];
      return favorites.some(fav => fav.id === productId);
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }
  },

  // Получение списка ID избранных продуктов
  getFavoriteIds: async () => {
    try {
      const response = await apiClient.get('/profiles/me/');
      const favorites = response.data.favorites || [];
      return favorites.map(fav => fav.id);
    } catch (error) {
      console.error('Error getting favorite IDs:', error);
      return [];
    }
  }
};