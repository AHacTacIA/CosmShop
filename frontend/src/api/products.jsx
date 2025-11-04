import apiClient from "./client";

export const productService = {
  // Получение списка продуктов с фильтрацией (серверная фильтрация)
  getProducts: (params = {}) => {
    return apiClient.get('/products/', {
      params: {
        brand: params.brand,
        category: params.category,
        max_price: params.maxPrice,
        min_price: params.minPrice,
        search: params.search,
        // Убираем пагинационные параметры из запроса фильтрации
      }
    });
  },

  // Получение отфильтрованных продуктов с сервера
  getFilteredProducts: (filters = {}) => {
    return apiClient.get('/products/', {
      params: {
        brand: filters.brand,
        category: filters.category,
        max_price: filters.maxPrice,
        min_price: filters.minPrice,
        search: filters.search,
      }
    });
  },

  // Остальные методы остаются без изменений
  getProduct: (id) => {
    return apiClient.get(`/products/${id}/`);
  },

  searchProducts: (query) => {
    return apiClient.get('/products/search/', {
      params: { search: query }
    });
  },

  getProductImages: (productId) => {
    return apiClient.get(`/products/${productId}/images/`);
  },

  getProductVariants: (productId) => {
    return apiClient.get(`/products/${productId}/variants/`);
  },

  getVariant: (variantId) => {
    return apiClient.get(`/product-variants/${variantId}/`);
  },

  getProductReviews: (productId) => {
    return apiClient.get(`/products/${productId}/reviews/`);
  },

  createReview: (productId, reviewData) => {
    return apiClient.post('/reviews/', {
      product: productId,
      ...reviewData
    });
  },

  updateReview: (reviewId, reviewData) => {
    return apiClient.put(`/reviews/${reviewId}/`, reviewData);
  },

  deleteReview: (reviewId) => {
    return apiClient.delete(`/reviews/${reviewId}/`);
  },

  addToFavorites: (productId) => {
    return apiClient.post(`/products/${productId}/favorite/`);
  },

  removeFromFavorites: (productId) => {
    return apiClient.delete(`/products/${productId}/unfavorite/`);
  },

  getFavorites: () => {
    return apiClient.get('/profiles/me/favorites/').then(response => {
      return response.data.results || [];
    });
  },

  getFavoritesPaginated: (page = 1, pageSize = 20) => {
    return apiClient.get('/profiles/me/favorites/', {
      params: { page, page_size: pageSize }
    });
  },

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