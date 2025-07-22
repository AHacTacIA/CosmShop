import apiClient from "./client";

export const productService ={
  // Получение списка продуктов с фильтрацией
    getProducts : (params ={}) =>{
        return apiClient.get('/products/',{
            params : {
                brand: params.brand,
                category: params.category,
                max_price: params.maxPrice,
                min_price: params.minPrice,
                search: params.search,
            }
        });
    },

  // Получение конкретного продукта по ID
    getProduct : (id)=>{
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

  // Получение списка избранных продуктов (через профиль пользователя)
  getFavorites: () => {
    return apiClient.get('/profiles/me/').then(response => {
      // Предполагаем, что в профиле есть информация об избранных продуктах
      return response.data.favorites || [];
    });
  }
};