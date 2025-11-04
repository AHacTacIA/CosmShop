// ProfilePage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ProfilePage.css';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, logout, loading } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleEditProfile = () => {
    navigate('/profile/edit');
  };

  const handleOrders = () => {
    navigate('/orders');
  };

  const handleWishlist = () => {
    navigate('/wishlist');
  };

  // Форматирование даты для отображения
  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    try {
      return new Date(dateString).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Форматирование номера телефона
  const formatPhoneNumber = (phone) => {
    if (!phone) return 'Не указано';
    // Простое форматирование для белорусских номеров
    if (phone.startsWith('+375')) {
      return phone.replace(/(\+375)(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 ($2) $3-$4-$5');
    }
    return phone;
  };

  // Показываем загрузку
  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  // Если пользователь не авторизован
  if (!isAuthenticated || !currentUser) {
    return (
      <div className="profile-container">
        <div className="auth-required">
          <h2>Доступ ограничен</h2>
          <p>Для просмотра профиля необходимо войти в систему</p>
          <div className="auth-actions">
            <button
              onClick={() => navigate('/login')}
              className="btn-primary"
            >
              Войти
            </button>
            <button
              onClick={() => navigate('/register')}
              className="btn-secondary"
            >
              Зарегистрироваться
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Профиль пользователя</h1>
        <div className="user-avatar">
          {currentUser.first_name ? (
            <span className="avatar-text">
              {currentUser.first_name[0]}{currentUser.last_name?.[0] || ''}
            </span>
          ) : (
            <span className="avatar-text">
              {currentUser.username[0].toUpperCase()}
            </span>
          )}
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-section">
          <h3>Основная информация</h3>
          <div className="profile-info">
            <div className="info-row">
              <span className="info-label">Имя пользователя:</span>
              <span className="info-value">{currentUser.username}</span>
            </div>

            <div className="info-row">
              <span className="info-label">Email:</span>
              <span className="info-value">{currentUser.email}</span>
            </div>

            {currentUser.first_name && (
              <div className="info-row">
                <span className="info-label">Имя:</span>
                <span className="info-value">{currentUser.first_name}</span>
              </div>
            )}

            {currentUser.last_name && (
              <div className="info-row">
                <span className="info-label">Фамилия:</span>
                <span className="info-value">{currentUser.last_name}</span>
              </div>
            )}
          </div>
        </div>

        <div className="profile-section">
          <h3>Контактная информация</h3>
          <div className="profile-info">
            <div className="info-row">
              <span className="info-label">Номер телефона:</span>
              <span className="info-value">
                {formatPhoneNumber(currentUser.phone_number)}
              </span>
            </div>

            <div className="info-row">
              <span className="info-label">Адрес:</span>
              <span className="info-value">
                {currentUser.address || 'Не указан'}
              </span>
            </div>

            <div className="info-row">
              <span className="info-label">Дата рождения:</span>
              <span className="info-value">
                {formatDate(currentUser.birth_date)}
              </span>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h3>Действия</h3>
          <div className="profile-actions">
            <button
              onClick={handleEditProfile}
              className="btn-action primary"
            >
              ✏️ Редактировать профиль
            </button>

            <button
              onClick={handleOrders}
              className="btn-action secondary"
            >
              📦 Мои заказы
            </button>

            <button
              onClick={handleWishlist}
              className="btn-action secondary"
            >
              ❤️ Список желаний
            </button>
          </div>
        </div>

        <div className="profile-section">
          <h3>Безопасность</h3>
          <div className="security-actions">
            <button
              onClick={handleLogout}
              className="btn-action danger"
            >
              🚪 Выйти из аккаунта
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { ProfilePage };