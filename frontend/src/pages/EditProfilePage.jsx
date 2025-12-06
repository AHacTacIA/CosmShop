// pages/EditProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import './EditProfilePage.css';

const EditProfilePage = () => {
  const navigate = useNavigate();
  const { currentUser, refreshUserData } = useAuth();

  // const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  console.log(error,setError)
  // Данные формы
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    address: '',
    birth_date: '',
  });

  // Загрузка текущих данных пользователя
  useEffect(() => {
    if (currentUser) {
      setFormData({
        first_name: currentUser.first_name || '',
        last_name: currentUser.last_name || '',
        email: currentUser.email || '',
        phone_number: currentUser.phone_number || '',
        address: currentUser.address || '',
        birth_date: currentUser.birth_date || '',
      });
    }
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Очищаем сообщения при изменении данных
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Подготавливаем данные для отправки
      const submitData = { ...formData };

      // Очищаем пустые поля
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '') {
          submitData[key] = null;
        }
      });

      console.log('Updating profile with data:', submitData);

      // Отправляем запрос на обновление профиля
      const response = await apiClient.profiles.updateProfile(submitData);
      console.log('Profile updated successfully:', response.data);

      // Обновляем данные в контексте аутентификации
      await refreshUserData();

      setSuccess('Профиль успешно обновлен!');

      // Автоматический переход назад через 2 секунды
      setTimeout(() => {
        navigate('/profile');
      }, 2000);

    } catch (err) {
      console.error('Error updating profile:', err);

      const errorMessage = err.response?.data
        ? Object.values(err.response.data).flat().join(', ')
        : 'Ошибка при обновлении профиля';

      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/profile');
  };

  // Если пользователь не авторизован
  if (!currentUser) {
    return (
      <div className="edit-profile-container">
        <div className="auth-required">
          <h2>Доступ ограничен</h2>
          <p>Для редактирования профиля необходимо войти в систему</p>
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
    <div className="edit-profile-container">
      <div className="edit-profile-header">
        <button
          onClick={handleCancel}
          className="back-button"
        >
          ← Назад
        </button>
        <h1>Редактирование профиля</h1>
        <div className="header-actions">
          <button
            onClick={handleCancel}
            className="btn-cancel"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="btn-save"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>

      <div className="edit-profile-content">
        <form onSubmit={handleSubmit} className="profile-form">
          {/* Основная информация */}
          <div className="form-section">
            <h3>Основная информация</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="first_name">Имя</label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  placeholder="Введите ваше имя"
                />
              </div>

              <div className="form-group">
                <label htmlFor="last_name">Фамилия</label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  placeholder="Введите вашу фамилию"
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="email">Email адрес *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="example@email.com"
                />
              </div>
            </div>
          </div>

          {/* Контактная информация */}
          <div className="form-section">
            <h3>Контактная информация</h3>
            <div className="form-grid">
              <div className="form-group full-width">
                <label htmlFor="phone_number">Номер телефона</label>
                <input
                  type="tel"
                  id="phone_number"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  placeholder="+375 (XX) XXX-XX-XX"
                />
                <small>Формат: +375 (XX) XXX-XX-XX</small>
              </div>

              <div className="form-group full-width">
                <label htmlFor="address">Адрес доставки</label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Город, улица, дом, квартира"
                />
              </div>

              <div className="form-group">
                <label htmlFor="birth_date">Дата рождения</label>
                <input
                  type="date"
                  id="birth_date"
                  name="birth_date"
                  value={formData.birth_date}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {/* Сообщения об ошибках и успехе */}
          {error && (
            <div className="message error">
              <strong>Ошибка:</strong> {error}
            </div>
          )}

          {success && (
            <div className="message success">
              <strong>Успех!</strong> {success}
            </div>
          )}

          {/* Кнопки действий */}
          <div className="form-actions">
            <button
              type="button"
              onClick={handleCancel}
              className="btn-cancel"
              disabled={saving}
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-save"
            >
              {saving ? (
                <>
                  <div className="button-spinner"></div>
                  Сохранение...
                </>
              ) : (
                'Сохранить изменения'
              )}
            </button>
          </div>
        </form>

        {/* Боковая панель с информацией */}
        {/*<div className="form-sidebar">*/}
        {/*  <div className="sidebar-card">*/}
        {/*    <h4>💡 Подсказки</h4>*/}
        {/*    <ul>*/}
        {/*      <li>Заполните все поля для полной информации</li>*/}
        {/*      <li>Email используется для входа в систему</li>*/}
        {/*      <li>Укажите актуальный номер телефона для связи</li>*/}
        {/*      <li>Адрес доставки будет использоваться при заказах</li>*/}
        {/*    </ul>*/}
        {/*  </div>*/}

        {/*  /!*<div className="sidebar-card">*!/*/}
        {/*  /!*  <h4>🔒 Безопасность</h4>*!/*/}
        {/*  /!*  <p>Ваши данные защищены и не передаются третьим лицам</p>*!/*/}
        {/*  /!*</div>*!/*/}

        {/*  /!*<div className="sidebar-card danger-zone">*!/*/}
        {/*  /!*  <h4>⚡ Быстрые действия</h4>*!/*/}
        {/*  /!*  <button*!/*/}
        {/*  /!*    onClick={() => navigate('/change-password')}*!/*/}
        {/*  /!*    className="btn-action outline"*!/*/}
        {/*  /!*  >*!/*/}
        {/*  /!*    Сменить пароль*!/*/}
        {/*  /!*  </button>*!/*/}
        {/*  /!*</div>*!/*/}
        {/*</div>*/}
      </div>
    </div>
  );
};

export { EditProfilePage };