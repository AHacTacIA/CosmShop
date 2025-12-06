// pages/HomePage.jsx
import React from 'react';
import './HomePage.css';

export const HomePage = () => {
  return (
    <div className="homepage">
      {/* Главная герой-секция */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Добро пожаловать в Gloss</h1>
          <p className="hero-subtitle">
            Откройте для себя мир beauty-продуктов от лучших брендов
          </p>

          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">900+</span>
              <span className="stat-label">Товаров</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">300+</span>
              <span className="stat-label">Брендов</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">100%</span>
              <span className="stat-label">Оригинал</span>
            </div>
          </div>

          {/* Призывы к действию */}
          <div className="hero-actions">
            <a href="/products" className="hero-btn primary">
              Смотреть каталог
            </a>
            {/*<a href="/about" className="hero-btn secondary">*/}
            {/*  О нас*/}
            {/*</a>*/}
          </div>
        </div>

        <div className="hero-image">
          <div className="hero-gradient"></div>
        </div>
      </section>
    </div>
  );
};