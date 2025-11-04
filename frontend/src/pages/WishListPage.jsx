// pages/WishListPage.jsx
import React from 'react';
import { useWishlist } from '../hooks/useWishlist';
import ProductCard from '../components/ProductCard';
import './WishListPage.css';

const WishListPage = () => {
  const { favorites, loading, clearWishlist } = useWishlist();

  const handleClearWishlist = async () => {
    if (window.confirm('Вы уверены, что хотите очистить список избранного?')) {
      await clearWishlist();
    }
  };

  if (loading) {
    return (
      <div className="wishlist-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Загрузка избранного...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-container">
      <div className="wishlist-header">
        <h1>Мои желания</h1>
        <p>Товары, которые вам понравились</p>
        
        {favorites.length > 0 && (
          <div className="wishlist-actions">
            <button 
              onClick={handleClearWishlist}
              className="clear-wishlist-btn"
            >
              Очистить список
            </button>
            <span className="wishlist-count">
              {favorites.length} товар{favorites.length === 1 ? '' : 'а'}
            </span>
          </div>
        )}
      </div>

      {favorites.length === 0 ? (
        <div className="empty-wishlist">
          <div className="empty-icon">❤️</div>
          <h2>Список желаний пуст</h2>
          <p>Добавляйте товары в избранное, чтобы не потерять их</p>
          <button 
            onClick={() => window.location.href = '/catalog'}
            className="browse-products-btn"
          >
            Перейти в каталог
          </button>
        </div>
      ) : (
        <div className="wishlist-products">
          <div className="products-grid">
            {favorites.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export {WishListPage} ;