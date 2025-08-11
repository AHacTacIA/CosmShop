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
  const [errors, setErrors] = useState({});
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
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const response = await apiClient.auth.register(formData);

      // После успешной регистрации можно перенаправить пользователя
      navigate('/'); // или '/profile' или куда вам нужно

    } catch (error) {
      if (error.response && error.response.data) {
        setErrors(error.response.data);
      } else {
        setErrors({ non_field_errors: ['Произошла ошибка при регистрации'] });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-form">
      <h2>Регистрация</h2>
      {errors.non_field_errors && (
        <div className="alert alert-danger">
          {errors.non_field_errors.map((err, idx) => (
            <p key={idx}>{err}</p>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Имя пользователя</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className={`form-control ${errors.username ? 'is-invalid' : ''}`}
            required
          />
          {errors.username && (
            <div className="invalid-feedback">{errors.username}</div>
          )}
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`form-control ${errors.email ? 'is-invalid' : ''}`}
            required
          />
          {errors.email && (
            <div className="invalid-feedback">{errors.email}</div>
          )}
        </div>

        <div className="form-group">
          <label>Пароль</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`form-control ${errors.password ? 'is-invalid' : ''}`}
            required
          />
          {errors.password && (
            <div className="invalid-feedback">{errors.password}</div>
          )}
        </div>

        <div className="form-group">
          <label>Имя</label>
          <input
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label>Фамилия</label>
          <input
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            className="form-control"
          />
        </div>

        <h4>Дополнительная информация</h4>

        <div className="form-group">
          <label>Телефон</label>
          <input
            type="text"
            name="profile.phone_number"
            value={formData.profile.phone_number}
            onChange={handleChange}
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label>Адрес</label>
          <textarea
            name="profile.address"
            value={formData.profile.address}
            onChange={handleChange}
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label>Дата рождения</label>
          <input
            type="date"
            name="profile.birth_date"
            value={formData.profile.birth_date}
            onChange={handleChange}
            className="form-control"
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading}
        >
          {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>
      </form>
    </div>
  );
};

export {RegisterForm};