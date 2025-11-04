import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

const RegisterForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    profile: {
      phone_number: '',
      address: '',
      birth_date: ''
    }
  });

  const [errors, setErrors] = useState({
    username: [],
    email: [],
    password: [],
    first_name: [],
    last_name: [],
    profile: {
      phone_number: [],
      birth_date: []
    },
    non_field_errors: []
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith('profile.')) {
      const profileField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          [profileField]: value
        }
      }));

      setErrors(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          [profileField]: []
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));

      setErrors(prev => ({
        ...prev,
        [name]: []
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({
      username: [],
      email: [],
      password: [],
      first_name: [],
      last_name: [],
      profile: {
        phone_number: [],
        birth_date: []
      },
      non_field_errors: []
    });

    try {
      const response = await apiClient.auth.register(formData);
      navigate('/login?registration_success=true');
    } catch (error) {
      if (error.response && error.response.data) {
        const apiErrors = error.response.data;

        const newErrors = {
          username: apiErrors.username || [],
          email: apiErrors.email || [],
          password: apiErrors.password || [],
          first_name: apiErrors.first_name || [],
          last_name: apiErrors.last_name || [],
          profile: {
            phone_number: apiErrors.profile?.phone_number || [],
            birth_date: apiErrors.profile?.birth_date || []
          },
          non_field_errors: apiErrors.non_field_errors || []
        };

        if (apiErrors.profile && typeof apiErrors.profile === 'object') {
          if (apiErrors.profile.user) {
            newErrors.non_field_errors.push(...apiErrors.profile.user);
          }

          for (const field in apiErrors.profile) {
            if (field in newErrors.profile) {
              newErrors.profile[field] = Array.isArray(apiErrors.profile[field])
                ? apiErrors.profile[field]
                : [apiErrors.profile[field]];
            }
          }
        }

        setErrors(newErrors);
      } else {
        setErrors(prev => ({
          ...prev,
          non_field_errors: ['Произошла ошибка при регистрации. Пожалуйста, попробуйте позже.']
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
    <div className="register-form">
      <h2>Регистрация</h2>

      {errors.non_field_errors.length > 0 && (
        <div className="error-message">
          {renderErrors(errors.non_field_errors)}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Имя пользователя*</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className={errors.username.length ? 'error' : ''}
            required
          />
          {renderErrors(errors.username)}
        </div>

        <div>
          <label htmlFor="email">Email*</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={errors.email.length ? 'error' : ''}
            required
          />
          {renderErrors(errors.email)}
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
          />
          {renderErrors(errors.password)}
          <div className="form-text">
            Пароль должен содержать минимум 8 символов, включая буквы и цифры
          </div>
        </div>

        <div>
          <label htmlFor="first_name">Имя</label>
          <input
            type="text"
            id="first_name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            className={errors.first_name.length ? 'error' : ''}
          />
          {renderErrors(errors.first_name)}
        </div>

        <div>
          <label htmlFor="last_name">Фамилия</label>
          <input
            type="text"
            id="last_name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            className={errors.last_name.length ? 'error' : ''}
          />
          {renderErrors(errors.last_name)}
        </div>

        <h4>Дополнительная информация</h4>

        <div>
          <label htmlFor="phone_number">Номер телефона</label>
          <input
            type="tel"
            id="phone_number"
            name="profile.phone_number"
            value={formData.profile.phone_number}
            onChange={handleChange}
            className={errors.profile.phone_number.length ? 'error' : ''}
            placeholder="+375"
          />
          {renderErrors(errors.profile.phone_number)}
        </div>

        <div>
          <label htmlFor="birth_date">Дата рождения</label>
          <input
            type="date"
            id="birth_date"
            name="profile.birth_date"
            value={formData.profile.birth_date}
            onChange={handleChange}
            className={errors.profile.birth_date.length ? 'error' : ''}
            max={new Date().toISOString().split('T')[0]}
          />
          {renderErrors(errors.profile.birth_date)}
          <div className="form-text">
            Вы должны быть старше 13 лет
          </div>
        </div>

        <div>
          <label htmlFor="address">Адрес</label>
          <textarea
            id="address"
            name="profile.address"
            value={formData.profile.address}
            onChange={handleChange}
            rows="3"
          />
        </div>

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>
      </form>
    </div>
  );
};

export  {RegisterForm};