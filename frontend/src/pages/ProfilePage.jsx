import React from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

const ProfilePage = () => {
  const navigate = useNavigate();
  const currentUser = apiClient.auth.getCurrentUser();

  const handleLogout = () => {
    apiClient.auth.logout();
    navigate('/');
    window.location.reload(); // Обновляем страницу для обновления header
  };

  if (!currentUser) {
    return (
      <div className="container">
        <h2>Профиль</h2>
        <p>Пожалуйста, войдите в систему</p>
        <button onClick={() => navigate('/login')}>Войти</button>
      </div>
    );
  }

  return (
    <div className="container">
      <h2>Профиль пользователя</h2>

      <div className="profile-info">
        <div className="profile-field">
          <label>Имя пользователя:</label>
          <span>{currentUser.username}</span>
        </div>

        <div className="profile-field">
          <label>Email:</label>
          <span>{currentUser.email}</span>
        </div>

        {currentUser.first_name && (
          <div className="profile-field">
            <label>Имя:</label>
            <span>{currentUser.first_name}</span>
          </div>
        )}

        {currentUser.last_name && (
          <div className="profile-field">
            <label>Фамилия:</label>
            <span>{currentUser.last_name}</span>
          </div>
        )}
      </div>

      <div className="profile-actions">
        <button
          onClick={() => navigate('/profile/edit')}
          className="btn-primary"
        >
          Редактировать профиль
        </button>

        <button
          onClick={handleLogout}
          className="btn-secondary"
        >
          Выйти
        </button>
      </div>
    </div>
  );
};


export {ProfilePage}