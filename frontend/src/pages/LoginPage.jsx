import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';

const Loginpage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const [errors, setErrors] = useState({
    username: [],
    password: [],
    non_field_errors: []
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Очищаем ошибки при изменении поля
    setErrors(prev => ({
      ...prev,
      [name]: [],
      non_field_errors: []
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({
      username: [],
      password: [],
      non_field_errors: []
    });

    try {
      const response = await apiClient.auth.login(formData);

      // Сохраняем данные пользователя
      const userData = apiClient.auth.getCurrentUser();
      console.log('User logged in:', userData);

      // Перенаправляем на главную или предыдущую страницу
      navigate('/');

    } catch (error) {
      if (error.response && error.response.data) {
        const apiErrors = error.response.data;

        const newErrors = {
          username: apiErrors.username || [],
          password: apiErrors.password || [],
          non_field_errors: apiErrors.non_field_errors || []
        };

        // Обработка ошибок аутентификации
        if (apiErrors.detail) {
          newErrors.non_field_errors = [apiErrors.detail];
        }

        setErrors(newErrors);
      } else {
        setErrors(prev => ({
          ...prev,
          non_field_errors: ['Произошла ошибка при входе. Пожалуйста, попробуйте позже.']
        }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderErrors = (errorArray) => {
    return errorArray.map((error, index) => (
      <div key={index} className="error-message">
        {error}
      </div>
    ));
  };

  return (
    <div className="auth-form">
      <h2>Вход в систему</h2>

      {errors.non_field_errors.length > 0 && (
        <div className="error-message">
          {renderErrors(errors.non_field_errors)}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Имя пользователя или Email*</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className={errors.username.length ? 'error' : ''}
            required
            autoComplete="username"
          />
          {renderErrors(errors.username)}
        </div>

        <div>
          <label htmlFor="password">Пароль*</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={errors.password.length ? 'error' : ''}
            required
            autoComplete="current-password"
          />
          {renderErrors(errors.password)}
        </div>

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Вход...' : 'Войти'}
        </button>

        <div className="auth-links">
          <p>
            Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
          </p>
          {/*<p>*/}
          {/*  <Link to="/forgot-password">Забыли пароль?</Link>*/}
          {/*</p>*/}
        </div>
      </form>

      <style jsx>{`
        .auth-form {
          max-width: 400px;
          margin: 50px auto;
          padding: 30px;
          background: #f9f9f9;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .auth-form h2 {
          text-align: center;
          margin-bottom: 25px;
          color: #333;
        }

        .auth-form div {
          margin-bottom: 20px;
        }

        .auth-form label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #333;
        }

        .auth-form input {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          box-sizing: border-box;
        }

        .auth-form input.error {
          border-color: #dc3545;
        }

        .auth-form input:focus {
          outline: none;
          border-color: #ff00aa;
          box-shadow: 0 0 0 2px rgba(255, 0, 170, 0.2);
        }

        .auth-form button {
          width: 100%;
          padding: 12px;
          background: #ff00aa;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          margin-bottom: 20px;
        }

        .auth-form button:hover:not(:disabled) {
          background: #cc0088;
        }

        .auth-form button:disabled {
          background: #cccccc;
          cursor: not-allowed;
        }

        .error-message {
          color: #dc3545;
          font-size: 14px;
          margin-top: 5px;
        }

        .auth-links {
          text-align: center;
        }

        .auth-links a {
          color: #ff00aa;
          text-decoration: none;
        }

        .auth-links a:hover {
          text-decoration: underline;
        }

        .auth-links p {
          margin: 10px 0;
        }
      `}</style>
    </div>
  );
};


export {Loginpage}