// components/ProductReviews.jsx
import React, { useState, useEffect } from 'react';
import { productService } from '../api/products';
import { reviewService } from '../api/reviews';
import './ProductReviews.css';

const ProductReviews = ({ productId, isAuthenticated, productName }) => {
  // Основное состояние
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Состояние для формы отзыва
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Состояние для проверки возможности отзыва
  const [reviewEligibility, setReviewEligibility] = useState({
    canReview: false,
    hasPurchased: false,
    hasReviewed: false,
    message: ''
  });

  // Статистика отзывов
  const [stats, setStats] = useState({
    averageRating: 0,
    reviewsCount: 0,
    ratingDistribution: {}
  });

  // Загрузка данных при монтировании
  useEffect(() => {
    if (productId) {
      loadReviewsData();
      if (isAuthenticated) {
        checkReviewEligibility();
      }
    }
  }, [productId, isAuthenticated]);

  // Загрузка отзывов и статистики
  const loadReviewsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Загружаем отзывы
      const reviewsResponse = await productService.getProductReviews(productId);
      const reviewsData = reviewsResponse.data.results || reviewsResponse.data || [];
      setReviews(reviewsData);

      // Загружаем статистику
      const statsData = await productService.getProductReviewsStats(productId);
      setStats(statsData);

    } catch (err) {
      console.error('Ошибка загрузки отзывов:', err);
      setError('Не удалось загрузить отзывы. Пожалуйста, попробуйте позже.');

      // Устанавливаем пустые данные в случае ошибки
      setStats({
        averageRating: 0,
        reviewsCount: 0,
        ratingDistribution: {}
      });
    } finally {
      setLoading(false);
    }
  };

  // Проверка возможности оставить отзыв
  const checkReviewEligibility = async () => {
    if (!isAuthenticated) {
      setReviewEligibility({
        canReview: false,
        hasPurchased: false,
        hasReviewed: false,
        message: 'Войдите в аккаунт, чтобы оставить отзыв'
      });
      return;
    }

    try {
      const response = await productService.checkReviewEligibility(productId);
      const data = response.data;

      setReviewEligibility({
        canReview: data.can_review || false,
        hasPurchased: data.has_purchased || false,
        hasReviewed: data.has_reviewed || false,
        message: data.message || ''
      });

    } catch (err) {
      console.error('Ошибка проверки возможности отзыва:', err);
      setReviewEligibility({
        canReview: false,
        hasPurchased: false,
        hasReviewed: false,
        message: 'Не удалось проверить возможность оставить отзыв'
      });
    }
  };

  // Обработка отправки отзыва
  const handleSubmitReview = async (e) => {
    e.preventDefault();

    // Валидация
    if (!rating || !comment.trim()) {
      alert('Пожалуйста, заполните все поля');
      return;
    }

    if (comment.trim().length < 10) {
      alert('Отзыв должен содержать минимум 10 символов');
      return;
    }

    setSubmitting(true);
    try {
      // Создаем отзыв
      await reviewService.createReview(productId, {
        rating,
        comment: comment.trim()
      });

      // Обновляем данные
      await Promise.all([
        loadReviewsData(),
        checkReviewEligibility()
      ]);

      // Сбрасываем форму
      setRating(5);
      setComment('');
      setShowForm(false);

      // Показываем уведомление
      alert('Спасибо! Ваш отзыв успешно опубликован.');

    } catch (err) {
      console.error('Ошибка при отправке отзыва:', err);

      // Показываем пользователю понятное сообщение об ошибке
      let errorMessage = 'Произошла ошибка при отправке отзыва';

      if (err.response?.status === 400) {
        errorMessage = err.response.data?.detail ||
                      err.response.data?.message ||
                      'Проверьте правильность заполнения формы';
      } else if (err.response?.status === 403) {
        errorMessage = 'Вы не можете оставить отзыв на этот товар';
      } else if (err.response?.status === 409) {
        errorMessage = 'Вы уже оставляли отзыв на этот товар';
      }

      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Удаление отзыва
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот отзыв? Это действие нельзя отменить.')) {
      return;
    }

    try {
      await reviewService.deleteReview(reviewId);

      // Обновляем данные
      await Promise.all([
        loadReviewsData(),
        checkReviewEligibility()
      ]);

      alert('Отзыв успешно удален');

    } catch (err) {
      console.error('Ошибка при удалении отзыва:', err);
      alert('Не удалось удалить отзыв. Пожалуйста, попробуйте позже.');
    }
  };

  // Форматирование даты
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Рендер звезд рейтинга
  const renderStars = (rating, size = 'normal') => {
    const stars = [];
    const filledStars = Math.round(rating);
    const emptyStars = 5 - filledStars;

    for (let i = 0; i < filledStars; i++) {
      stars.push(
        <span key={`filled-${i}`} className={`star-filled ${size}`}>
          ★
        </span>
      );
    }

    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <span key={`empty-${i}`} className={`star-empty ${size}`}>
          ☆
        </span>
      );
    }

    return <div className="rating-stars">{stars}</div>;
  };

  // Проверка, принадлежит ли отзыв текущему пользователю
  const isUserReview = (review) => {
    if (!isAuthenticated) return false;

    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      return review.profile_username === currentUser.username;
    } catch (error) {
      console.error('Ошибка при проверке владельца отзыва:', error);
      return false;
    }
  };

  // Обработчик изменения рейтинга в форме
  const handleRatingChange = (newRating) => {
    setRating(newRating);
  };

  // Показать/скрыть форму отзыва
  const toggleReviewForm = () => {
    if (reviewEligibility.canReview) {
      setShowForm(!showForm);
    }
  };

  // Загрузка
  if (loading) {
    return (
      <div className="reviews-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
        <p>Загрузка отзывов...</p>
      </div>
    );
  }

  return (
    <div className="product-reviews">
      {/* Заголовок и статистика */}
      <div className="reviews-header">
        <h3>Отзывы о товаре "{productName}"</h3>
        <div className="reviews-stats">
          <div className="average-rating-display">
            <span className="rating-value-large">
              {stats.averageRating.toFixed(1)}
            </span>
            {renderStars(stats.averageRating, 'large')}
            <span className="reviews-count-text">
              {stats.reviewsCount} {stats.reviewsCount === 1 ? 'отзыв' :
                                   stats.reviewsCount > 1 && stats.reviewsCount < 5 ? 'отзыва' : 'отзывов'}
            </span>
          </div>
        </div>
      </div>

      {/* Сообщения о статусе */}
      {error && (
        <div className="error-message">
          <span className="error-text">{error}</span>
          <button
            className="retry-btn"
            onClick={loadReviewsData}
            title="Повторить попытку"
          >
            ⟳
          </button>
        </div>
      )}

      {/* Форма для добавления отзыва */}
      {isAuthenticated && reviewEligibility.canReview && (
        <div className="review-form-section">
          <button
            className={`btn-toggle-form ${showForm ? 'active' : ''}`}
            onClick={toggleReviewForm}
            disabled={submitting}
          >
            {showForm ? '✕ Скрыть форму' : '✎ Написать отзыв'}
          </button>

          {showForm && (
            <form className="review-form" onSubmit={handleSubmitReview}>
              <div className="form-group">
                <label className="form-label">Ваша оценка:</label>
                <div className="rating-input">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star-btn ${star <= rating ? 'active' : ''}`}
                      onClick={() => handleRatingChange(star)}
                      disabled={submitting}
                      title={`${star} звезд${star > 1 ? 'ы' : 'а'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <span className="rating-display">{rating} из 5</span>
              </div>

              <div className="form-group">
                <label htmlFor="comment" className="form-label">
                  Ваш отзыв:
                  <span className="char-count">
                    ({comment.length}/1000)
                  </span>
                </label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows="5"
                  maxLength="1000"
                  placeholder="Поделитесь вашим мнением о товаре. Что вам понравилось или не понравилось?"
                  className="review-textarea"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn-submit-review"
                  disabled={submitting || comment.trim().length < 10}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-small"></span>
                      Отправка...
                    </>
                  ) : (
                    'Опубликовать отзыв'
                  )}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowForm(false)}
                  disabled={submitting}
                >
                  Отмена
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Сообщения о невозможности оставить отзыв */}
      {!isAuthenticated && (
        <div className="auth-notice">
          <p>
            <span className="notice-icon">🔒</span>
            Чтобы оставить отзыв, <a href="/login" className="auth-link">войдите в аккаунт</a>
          </p>
        </div>
      )}

      {isAuthenticated && !reviewEligibility.hasPurchased && (
        <div className="purchase-notice">
          <p>
            <span className="notice-icon">🛒</span>
            {reviewEligibility.message || 'Вы можете оставить отзыв только после покупки товара'}
          </p>
        </div>
      )}

      {isAuthenticated && reviewEligibility.hasReviewed && (
        <div className="already-reviewed">
          <p>
            <span className="notice-icon">✓</span>
            {reviewEligibility.message || 'Вы уже оставляли отзыв на этот товар'}
          </p>
        </div>
      )}

      {/* Список отзывов */}
      <div className="reviews-list">
        {reviews.length === 0 ? (
          <div className="no-reviews">
            <p className="no-reviews-icon">💬</p>
            <p className="no-reviews-text">Пока нет отзывов. Будьте первым!</p>
            {!isAuthenticated && (
              <a href="/login" className="login-to-review">
                Войти, чтобы оставить отзыв
              </a>
            )}
          </div>
        ) : (
          <>
            {/* Сортировка и фильтрация (можно добавить позже) */}
            <div className="reviews-controls">
              <span className="reviews-sort-label">Сортировка:</span>
              <select className="reviews-sort-select" defaultValue="newest">
                <option value="newest">Сначала новые</option>
                <option value="oldest">Сначала старые</option>
                <option value="highest">Высокий рейтинг</option>
                <option value="lowest">Низкий рейтинг</option>
              </select>
            </div>

            {/* Отзывы */}
            {reviews.map((review) => (
              <div key={review.id} className="review-card">
                <div className="review-header">
                  <div className="reviewer-info">
                    <div className="reviewer-avatar">
                      {review.profile_username?.[0] || 'П'}
                    </div>
                    <div className="reviewer-details">
                      <div className="reviewer-name-rating">
                        <span className="reviewer-name">
                          {review.profile_username || 'Покупатель'}
                        </span>
                        {renderStars(review.rating)}
                      </div>
                      <span className="review-date">
                        {formatDate(review.created_at)}
                      </span>
                    </div>
                  </div>

                  {isUserReview(review) && (
                    <button
                      className="btn-delete-review"
                      onClick={() => handleDeleteReview(review.id)}
                      title="Удалить отзыв"
                      disabled={submitting}
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="review-comment">
                  <p>{review.comment}</p>
                </div>

                {review.product_name && (
                  <div className="review-product-info">
                    <span className="product-info-label">Товар:</span>
                    <span className="product-name">{review.product_name}</span>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Пагинация (можно добавить позже) */}
      {reviews.length > 0 && (
        <div className="reviews-pagination">
          <button className="pagination-btn prev" disabled>
            ← Назад
          </button>
          <span className="pagination-info">1 из 1</span>
          <button className="pagination-btn next" disabled>
            Далее →
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductReviews;