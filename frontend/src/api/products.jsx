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
  },

    // === МЕТОДЫ ДЛЯ РАБОТЫ С ОТЗЫВАМИ ===

  /**
   * Получить отзывы продукта с пагинацией
   * @param {number} productId - ID продукта
   * @param {object} params - Параметры {page, pageSize, ordering}
   * @returns {Promise} Promise с отзывами
   */
  getProductReviews: (productId, params = {}) => {
    return apiClient.get(`/products/${productId}/reviews/`, {
      params: {
        page: params.page,
        page_size: params.pageSize || 10,
        ordering: params.ordering || '-created_at' // новые первыми по умолчанию
      }
    });
  },

  /**
   * Получить статистику отзывов продукта (средний рейтинг, количество)
   * @param {number} productId - ID продукта
   * @returns {Promise} Promise с данными статистики
   */
  getProductReviewsStats: async (productId) => {
    try {
      const response = await apiClient.get(`/products/${productId}/`);
      const product = response.data;

      return {
        averageRating: product.average_rating || 0,
        reviewsCount: product.reviews_count || 0,
        ratingDistribution: product.rating_distribution || {}
      };
    } catch (error) {
      console.error('Error getting product reviews stats:', error);
      return {
        averageRating: 0,
        reviewsCount: 0,
        ratingDistribution: {}
      };
    }
  },

  // Проверить возможность оставить отзыв
  checkReviewEligibility: (productId) => {
    return apiClient.get(`/products/${productId}/check_review_eligibility/`);
  },

  /**
   * Проверить, покупал ли пользователь продукт
   * @param {number} productId - ID продукта
   * @returns {Promise} Promise с булевым значением
   */
  hasPurchasedProduct: async (productId) => {
    try {
      const response = await apiClient.get(`/products/${productId}/check_purchase/`);
      return response.data.has_purchased || false;
    } catch (error) {
      console.error('Error checking purchase status:', error);
      return false;
    }
  },


  // createReview: (productId, reviewData) => {
  //   return apiClient.post('/reviews/', {
  //     product: productId,
  //     ...reviewData
  //   });
  // },
  //
  // updateReview: (reviewId, reviewData) => {
  //   return apiClient.put(`/reviews/${reviewId}/`, reviewData);
  // },
  //
  // deleteReview: (reviewId) => {
  //   return apiClient.delete(`/reviews/${reviewId}/`);
  // },


};