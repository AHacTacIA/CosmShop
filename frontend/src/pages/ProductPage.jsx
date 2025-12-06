// pages/ProductPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { productService } from '../api/products';
import { categoryService } from '../api/categories';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import ProductReviews from '../components/ProductReviews';
import './ProductPage.css';
import { useNavigate } from 'react-router-dom';

const ProductPage = () => {
  const { id } = useParams();
  const { addToCart, loading: cartLoading } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [categoryPath, setCategoryPath] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const navigate = useNavigate();

  // Проверка аутентификации
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setIsAuthenticated(!!token);
  }, []);

  // Функция для построения пути категорий
  const buildCategoryPath = useCallback(async (category) => {
    if (!category) return [];

    const path = [category];
    let currentCategory = category;

    // Поднимаемся по родительским категориям
    while (currentCategory.parent) {
      try {
        const parentResponse = await categoryService.getCategory(currentCategory.parent);
        const parentCategory = parentResponse.data;
        path.unshift(parentCategory);
        currentCategory = parentCategory;
      } catch (err) {
        console.error('Error loading parent category:', err);
        break;
      }
    }

    return path;
  }, []);

  // Загрузка данных продукта и построение пути категорий
  useEffect(() => {
    const loadProductAndCategories = async () => {
      try {
        setLoading(true);
        const response = await productService.getProduct(id);
        const productData = response.data;

        setProduct(productData);

        // Устанавливаем первый вариант по умолчанию
        if (productData.variants && productData.variants.length > 0) {
          setSelectedVariant(productData.variants[0]);
          const mainImage = productData.variants[0].images.find(img => img.is_main) ||
                           productData.variants[0].images[0];
          setSelectedImage(mainImage);
        }

        // Строим путь категорий
        if (productData.category) {
          const path = await buildCategoryPath(productData.category);
          setCategoryPath(path);
        }

      } catch (err) {
        console.error('Error loading product:', err);
        setError('Ошибка загрузки товара');
      } finally {
        setLoading(false);
      }
    };

    loadProductAndCategories();
  }, [id, buildCategoryPath]);

  // Проверка избранного после загрузки продукта
  useEffect(() => {
    if (product) {
      setIsFavorite(isInWishlist(product.id));
    }
  }, [product, isInWishlist]);

  // Обработчик изменения варианта
  const handleVariantChange = (variant) => {
    setSelectedVariant(variant);
    const mainImage = variant.images.find(img => img.is_main) || variant.images[0];
    setSelectedImage(mainImage);
  };

  // Обработчик изменения изображения
  const handleImageChange = (image) => {
    setSelectedImage(image);
  };

  // Добавление в корзину
  const handleAddToCart = async () => {
    if (!selectedVariant || isAddingToCart) return;

    setIsAddingToCart(true);
    try {
      const success = await addToCart(product.id, selectedVariant.id, quantity);
      if (success) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Добавление/удаление из избранного
  const handleWishlistToggle = async () => {
    if (isWishlistLoading || !product) return;

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

  // Изменение количества
  const handleQuantityChange = (e) => {
    const newQuantity = parseInt(e.target.value);
    if (newQuantity > 0 && newQuantity <= 99) {
      setQuantity(newQuantity);
    }
  };

  const incrementQuantity = () => {
    if (quantity < 99) setQuantity(quantity + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  // Рендер хлебных крошек
  const renderBreadcrumbs = () => {
    if (!product) return null;

    return (
      <div className="breadcrumbs">
        <a href="/">Главная</a>
        <span className="breadcrumb-separator"> / </span>

        {categoryPath.map((category, index) => (
          <span key={category.id}>
            <a href={`/category/${category.slug}`}>{category.name}</a>
            {index < categoryPath.length - 1 && (
              <span className="breadcrumb-separator"> / </span>
            )}
          </span>
        ))}

        <span className="breadcrumb-separator"> / </span>
        <span className="current">{product.name}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="product-page-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Загрузка товара...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-page-container">
        <div className="error-message">
          <h2>Ошибка</h2>
          <p>{error || 'Товар не найден'}</p>
          <button onClick={() => window.history.back()}>Вернуться назад</button>
        </div>
      </div>
    );
  }

  return (
    <div className="product-page-container">
      {renderBreadcrumbs()}

      <div className="product-main">
        {/* Галерея изображений */}
        <div className="product-gallery">
          <div className="main-image">
            {selectedImage ? (
              <img src={selectedImage.image} alt={product.name} />
            ) : (
              <div className="no-image">Нет изображения</div>
            )}
          </div>

          {selectedVariant && selectedVariant.images.length > 1 && (
            <div className="image-thumbnails">
              {selectedVariant.images.map((image, index) => (
                <button
                  key={index}
                  className={`thumbnail ${selectedImage === image ? 'active' : ''}`}
                  onClick={() => handleImageChange(image)}
                >
                  <img src={image.image} alt={`${product.name} ${index + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Информация о товаре */}
        <div className="product-info">
          <div className="product-header">
            <h1 className="product-title">{product.name}</h1>
            {product.sh_descr && (
              <p className="product-short-description">{product.sh_descr}</p>
            )}
          </div>

          {/* Бренд */}
          {product.brand && (
            <div className="product-brand-info">
              <span className="brand-label"></span>
              <button
                className="brand-link"
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/brand/${product.brand.slug}`);
                }}
              >
                {product.brand.name}
              </button>
              {product.brand.country && (
                <span className="brand-country"> • {product.brand.country}</span>
              )}
            </div>
          )}

          {/* Категория */}
          {product.category && (
            <div className="product-category-info">
              <span className="category-label"></span>
              <a
                href={`/catalog/${product.category.slug}`}
                className="category-link"
              >
                {product.category.name}
              </a>
            </div>
          )}

          {/* Варианты */}
          {product.variants && product.variants.length > 1 && (
            <div className="variants-section">
              <h3>Варианты:</h3>
              <div className="variants-grid">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    className={`variant-btn ${selectedVariant?.id === variant.id ? 'active' : ''}`}
                    onClick={() => handleVariantChange(variant)}
                  >
                    {variant.color && <span className="variant-color">{variant.color}</span>}
                    {variant.volume && (
                      <span className="variant-volume">
                        {variant.volume} {variant.volume_unit || ''}
                      </span>
                    )}
                    {!variant.color && !variant.volume && (
                      <span className="variant-art">{variant.art}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Цена и добавление в корзину */}
          <div className="purchase-section">
            <div className="price">
              {selectedVariant ? (
                <span className="current-price">{parseFloat(selectedVariant.price).toFixed(2)} BYN</span>
              ) : (
                <span className="no-price">Цена не указана</span>
              )}
            </div>

            {selectedVariant && (
              <div className="add-to-cart-section">
                <div className="quantity-selector">
                  <button
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                    className="quantity-btn minus"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={quantity}
                    onChange={handleQuantityChange}
                    className="quantity-input"
                  />
                  <button
                    onClick={incrementQuantity}
                    disabled={quantity >= 99}
                    className="quantity-btn plus"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart || cartLoading}
                  className="add-to-cart-btn primary"
                >
                  {isAddingToCart ? 'Добавляется...' : 'Добавить в корзину'}
                </button>

                <button
                  onClick={handleWishlistToggle}
                  disabled={isWishlistLoading}
                  className={`wishlist-btn ${isFavorite ? 'active' : ''}`}
                  title={isFavorite ? "Удалить из избранного" : "Добавить в избранное"}
                >
                  {isWishlistLoading ? '⋯' : (isFavorite ? '♥' : '♡')}
                </button>
              </div>
            )}

            {showSuccess && (
              <div className="success-message">
                ✓ Товар добавлен в корзину!
              </div>
            )}
          </div>

          {/* Отзывы - превью */}
          {product.reviews && product.reviews.length > 0 && (
            <div className="reviews-preview">
              <div className="reviews-summary">
                <div className="average-rating">
                  <span className="rating-stars">
                    {'★'.repeat(Math.round(product.average_rating))}
                    {'☆'.repeat(5 - Math.round(product.average_rating))}
                  </span>
                  <span className="rating-value">{product.average_rating.toFixed(1)}</span>
                </div>
                <span className="reviews-count">{product.reviews_count} отзывов</span>
              </div>

              {product.reviews.slice(0, 2).map((review) => (
                <div key={review.id} className="review-preview">
                  <div className="reviewer">
                    <span className="reviewer-name">
                      {review.profile_first_name || review.profile_username}
                    </span>
                    <div className="review-rating">
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </div>
                  </div>
                  <p className="review-comment-preview">
                    {review.comment.length > 100
                      ? `${review.comment.substring(0, 100)}...`
                      : review.comment}
                  </p>
                </div>
              ))}

              <button
                className="view-all-reviews"
                onClick={() => document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Все отзывы ↓
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Детальная информация */}
      <div className="product-details">
        {product.descr && (
          <section className="detail-section">
            <h3>Описание</h3>
            <div className="detail-content">
              {product.descr.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </section>
        )}

        {product.usage && (
          <section className="detail-section">
            <h3>Применение</h3>
            <div className="detail-content">
              {product.usage.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </section>
        )}

        {product.composition && (
          <section className="detail-section">
            <h3>Состав</h3>
            <div className="detail-content">
              {product.composition.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </section>
        )}

        {/* Секция отзывов */}
        <section className="detail-section" id="reviews-section">
          <ProductReviews
            productId={product.id}
            isAuthenticated={isAuthenticated}
            productName={product.name}
          />
        </section>
      </div>
    </div>
  );
};

export { ProductPage };