// pages/CartPage.jsx
import React from 'react';
import { useCart } from '../hooks/useCart';
import './CartPage.css';

const CartPage = () => {
  const { 
    cart,
    cartItems,
    loading,
    error,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalPrice,
    getTotalItems
  } = useCart();

  const handleQuantityChange = async (itemId, newQuantity) => {
    await updateQuantity(itemId, newQuantity);
  };

  const handleRemoveItem = async (itemId) => {
    if (window.confirm('Вы уверены, что хотите удалить товар из корзины?')) {
      await removeFromCart(itemId);
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Вы уверены, что хотите очистить корзину?')) {
      await clearCart();
    }
  };

  const handleCheckout = () => {
    // Редирект на страницу оформления заказа
    window.location.href = '/checkout';
  };

  // Получение изображения товара
  const getProductImage = (item) => {
    if (item.variant && item.variant.images && item.variant.images.length > 0) {
      const mainImage = item.variant.images.find(img => img.is_main);
      return mainImage ? mainImage.image : item.variant.images[0].image;
    }
    return null;
  };

  // Получение названия варианта
  const getVariantName = (item) => {
    if (item.variant) {
      if (item.variant.color) {
        return item.variant.color;
      }
      if (item.variant.volume) {
        return `${item.variant.volume} ${item.variant.volume_unit || ''}`.trim();
      }
    }
    return null;
  };

  // Получение цены товара
  const getItemPrice = (item) => {
    return parseFloat(item.variant.price);
  };

  // Получение общей стоимости позиции
  const getItemTotal = (item) => {
    return getItemPrice(item) * item.quantity;
  };

  if (loading) {
    return (
      <div className="cart-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Загрузка корзины...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cart-container">
        <div className="error-message">
          <h2>Ошибка</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Попробовать снова</button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h1>Корзина</h1>
        {cartItems.length > 0 && (
          <button
            onClick={handleClearCart}
            className="clear-cart-btn"
          >
            Очистить корзину
          </button>
        )}
      </div>

      {cartItems.length === 0 ? (
        <div className="empty-cart">
          <div className="empty-cart-icon">🛒</div>
          <h2>Ваша корзина пуста</h2>
          <p>Добавьте товары из каталога</p>
          <button
            onClick={() => window.location.href = '/catalog'}
            className="continue-shopping-btn"
          >
            Перейти в каталог
          </button>
        </div>
      ) : (
        <div className="cart-content">
          <div className="cart-items">
            {cartItems.map((item) => {
              const productImage = getProductImage(item);
              const variantName = getVariantName(item);
              const itemPrice = getItemPrice(item);
              const itemTotal = getItemTotal(item);

              return (
                <div key={item.id} className="cart-item">
                  <div className="item-image">
                    {productImage ? (
                      <img src={productImage} alt={item.product.name} />
                    ) : (
                      <div className="no-image">Нет изображения</div>
                    )}
                  </div>

                  <div className="item-details">
                    <h3 className="item-name">{item.product.name}</h3>
                    <p className="item-brand">{item.product.brand.name}</p>
                    {variantName && (
                      <p className="item-variant">Вариант: {variantName}</p>
                    )}
                    <p className="item-price">{itemPrice.toFixed(2)} BYN</p>
                  </div>

                  <div className="item-controls">
                    <div className="quantity-controls">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="quantity-btn"
                      >
                        -
                      </button>
                      <span className="quantity">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        className="quantity-btn"
                      >
                        +
                      </button>
                    </div>

                    <div className="item-total">
                      {itemTotal.toFixed(2)} BYN
                    </div>

                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="remove-item-btn"
                      title="Удалить из корзины"
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="cart-summary">
            <div className="summary-card">
              <h3>Итого</h3>

              <div className="summary-row">
                <span>Товары ({getTotalItems()} шт.)</span>
                <span>{getTotalPrice().toFixed(2)} BYN</span>
              </div>

              <div className="summary-row">
                <span>Доставка</span>
                <span>Бесплатно</span>
              </div>

              <div className="summary-row total">
                <span>Общая сумма</span>
                <span>{getTotalPrice().toFixed(2)} BYN</span>
              </div>

              <button
                onClick={handleCheckout}
                className="checkout-btn"
              >
                Оформить заказ
              </button>

              <button
                onClick={() => window.location.href = '/catalog'}
                className="continue-shopping-link"
              >
                Продолжить покупки
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export {CartPage};