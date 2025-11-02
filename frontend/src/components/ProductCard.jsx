// components/ProductCard.jsx
import React, { useState } from 'react';
import { useWishlist } from '../hooks/useWishlist';
import AddToCartButton from './AddToCartButton';

const ProductCard = ({ product }) => {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(isInWishlist(product.id));

  // Обновляем состояние при изменении избранного
  React.useEffect(() => {
    setIsFavorite(isInWishlist(product.id));
  }, [isInWishlist, product.id]);

  const handleWishlistClick = async (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (isWishlistLoading) return;

    setIsWishlistLoading(true);
    try {
      const success = await toggleWishlist(product.id);
      if (success) {
        setIsFavorite(!isFavorite);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    } finally {
      setIsWishlistLoading(false);
    }
  };

  const navigateToProduct = () => {
    window.location.href = `/product/${product.id}`;
  };

  const getMainImage = () => {
    if (product.variants && product.variants.length > 0 && product.variants[0].images) {
      const mainImage = product.variants[0].images.find(img => img.is_main);
      return mainImage ? mainImage.image : product.variants[0].images[0].image;
    }
    return product.image || null;
  };

  const renderBrand = () => {
    if (!product.brand) return null;

    if (typeof product.brand === 'object' && product.brand !== null) {
      return (
        <p className="product-brand">
          {product.brand.name || 'Бренд не указан'}
          {product.brand.country && (
            <span className="brand-country"> • {product.brand.country}</span>
          )}
        </p>
      );
    }

    if (typeof product.brand === 'string') {
      return <p className="product-brand">{product.brand}</p>;
    }

    return null;
  };

  const renderPrice = () => {
    if (product.variants && product.variants.length > 0) {
      const prices = product.variants.map(v => parseFloat(v.price)).filter(p => !isNaN(p));
      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        return minPrice === maxPrice
          ? `${minPrice.toFixed(2)} BYN`
          : `от ${minPrice.toFixed(2)} BYN`;
      }
    }

    return 'Цена не указана';
  };

  const imageUrl = getMainImage();

  return (
    <div className="product-card" onClick={navigateToProduct}>
      <div className="product-image">
        {imageUrl ? (
          <img src={imageUrl} alt={product.name} />
        ) : (
          <div className="no-image">Нет изображения</div>
        )}

        <button
          className={`wishlist-btn ${isFavorite ? 'active' : ''}`}
          onClick={handleWishlistClick}
          disabled={isWishlistLoading}
          title={isFavorite ? "Удалить из избранного" : "Добавить в избранное"}
        >
          {isWishlistLoading ? '⋯' : (isFavorite ? '♥' : '♡')}
        </button>
      </div>

      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>

        {renderBrand()}

        <p className="product-price">
          {renderPrice()}
        </p>

        {product.description && (
          <p className="product-description">
            {product.description.length > 100
              ? `${product.description.substring(0, 100)}...`
              : product.description
            }
          </p>
        )}

        {/* Передаем только product, variant_id будет получен автоматически */}
        <AddToCartButton
          product={product}
          className="add-to-cart-btn"
        />
      </div>
    </div>
  );
};

export default ProductCard;