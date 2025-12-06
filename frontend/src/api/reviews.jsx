// api/reviews.jsx
import apiClient from "./client";

export const reviewService = {
  // Создать отзыв (product должен быть указан в теле запроса)
  createReview: (productId, reviewData) => {
    return apiClient.post('/reviews/', {
      product: productId,
      ...reviewData
    });
  },
  
  // Получить все отзывы
  getAllReviews(params) {
    return apiClient.get('/reviews/', { params });
  },
  
  // Получить отзывы пользователя
  getMyReviews() {
    return apiClient.get('/reviews/my_reviews/');
  },

  // Получить конкретный отзыв по ID
  getReview: (reviewId) => {
    return apiClient.get(`/reviews/${reviewId}/`);
  },
  
  // Обновить отзыв
  updateReview(reviewId, data) {
    return apiClient.put(`/reviews/${reviewId}/`, data);
  },
  
  // Удалить отзыв
  deleteReview(reviewId) {
    return apiClient.delete(`/reviews/${reviewId}/`);
  },
  

  // Проверить возможность оставить отзыв (альтернативный endpoint)
  checkReviewEligibility: (productId) => {
    return apiClient.get('/reviews/check/', {
      params: { product: productId }
    });
  },

};