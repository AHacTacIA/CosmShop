// pages/CheckoutPage.jsx
import React, { useState } from 'react';
import { useCart } from '../hooks/useCart';
import { orderService } from '../api/order';
import './CheckoutPage.css';

const CheckoutPage = () => {
  const {
    cartItems,
    getTotalPrice,
    getTotalItems,
    clearCart,
    loading: cartLoading,
    error: cartError
  } = useCart();

  const [loading, setLoading] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [success, setSuccess] = useState(false);
  const [order, setOrder] = useState(null);

  // Данные формы
  const [formData, setFormData] = useState({
    shipping_address: '',
    payment_method: 'card',
    notes: '',
    email: '',
    phone: '',
    first_name: '',
    last_name: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setOrderError('');

  if (cartItems.length === 0) {
    setOrderError('Корзина пуста. Добавьте товары перед оформлением заказа.');
    setLoading(false);
    return;
  }

  try {
    const totalPrice = getTotalPrice();

    // Создаем объект заказа с total_price
    const orderPayload = {
      shipping_address: formData.shipping_address,
      payment_method: formData.payment_method,
      notes: formData.notes,
      total_price: totalPrice.toFixed(2)  // <-- Передаем сумму из корзины
    };

    console.log('Creating order with payload:', orderPayload);

    const response = await orderService.createOrder(orderPayload);
    console.log('Order created successfully:', response.data);

    setOrder(response.data);
    setSuccess(true);

    await clearCart();

  } catch (err) {
    console.error('Order creation error:', err);
    const errorData = err.response?.data;

    let errorMessage = 'Произошла ошибка при оформлении заказа. Попробуйте еще раз.';

    if (errorData) {
      if (errorData.detail) {
        errorMessage = errorData.detail;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (typeof errorData === 'object') {
        const errors = Object.values(errorData).flat();
        errorMessage = errors.join(', ');
      }
    }

    setOrderError(errorMessage);
  } finally {
    setLoading(false);
  }
};

  // Получение изображения товара
  const getProductImage = (item) => {
    if (item.variant && item.variant.images && item.variant.images.length > 0) {
      const mainImage = item.variant.images.find(img => img.is_main);
      return mainImage ? mainImage.image : item.variant.images[0].image;
    }
    if (item.product && item.product.images && item.product.images.length > 0) {
      const mainImage = item.product.images.find(img => img.is_main);
      return mainImage ? mainImage.image : item.product.images[0].image;
    }
    return null;
  };

  // Получение названия варианта
  const getVariantName = (item) => {
    if (item.variant) {
      if (item.variant.color) {
        return `Цвет: ${item.variant.color}`;
      }
      if (item.variant.volume) {
        return `Объем: ${item.variant.volume} ${item.variant.volume_unit || 'мл'}`;
      }
      if (item.variant.size) {
        return `Размер: ${item.variant.size}`;
      }
    }
    return null;
  };

  // Получение цены товара
  const getItemPrice = (item) => {
    if (item.variant && item.variant.price) {
      return parseFloat(item.variant.price);
    }
    if (item.product && item.product.price) {
      return parseFloat(item.product.price);
    }
    return 0;
  };

  // Получение общей стоимости позиции
  const getItemTotal = (item) => {
    return getItemPrice(item) * item.quantity;
  };

  if (cartLoading) {
    return (
      <div className="checkout-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Загрузка корзины...</p>
        </div>
      </div>
    );
  }

  if (cartError) {
    return (
      <div className="checkout-container">
        <div className="error-message">
          <h2>Ошибка загрузки корзины</h2>
          <p>{cartError}</p>
          <button onClick={() => window.location.href = '/cart'} className="continue-shopping-btn">
            Вернуться в корзину
          </button>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0 && !success) {
    return (
      <div className="checkout-container">
        <div className="empty-cart">
          <div className="empty-cart-icon">🛒</div>
          <h2>Корзина пуста</h2>
          <p>Добавьте товары в корзину для оформления заказа</p>
          <button
            onClick={() => window.location.href = '/catalog'}
            className="continue-shopping-btn"
          >
            Перейти в каталог
          </button>
        </div>
      </div>
    );
  }

  if (success && order) {
    return (
      <div className="checkout-container">
        <div className="success-message">
          <div className="success-icon">✅</div>
          <h2>Заказ успешно оформлен!</h2>
          <div className="order-details">
            <p className="order-number">Номер заказа: <strong>#{order.id}</strong></p>
            <p className="order-total">Сумма заказа: <strong>{order.total_price || getTotalPrice().toFixed(2)} BYN</strong></p>
            <p>Статус заказа: <span className={`status-badge status-${order.status}`}>
              {order.status === 'pending' && 'Ожидает обработки'}
              {order.status === 'processing' && 'В обработке'}
              {order.status === 'shipped' && 'Отправлен'}
              {order.status === 'delivered' && 'Доставлен'}
              {order.status === 'cancelled' && 'Отменен'}
            </span></p>
          </div>

          <div className="delivery-info">
            <h4>Информация о доставке:</h4>
            <p><strong>Адрес:</strong> {order.shipping_address || formData.shipping_address}</p>
            <p><strong>Способ оплаты:</strong>
              {order.payment_method === 'card' && ' Банковская карта'}
              {order.payment_method === 'cash' && ' Наличные при получении'}
              {order.payment_method === 'online' && ' Онлайн-оплата'}
            </p>
          </div>

          <div className="success-actions">
            <button
              onClick={() => window.location.href = `/orders/${order.id}`}
              className="view-order-btn"
            >
              Посмотреть заказ
            </button>
            <button
              onClick={() => window.location.href = '/orders'}
              className="my-orders-btn"
            >
              Мои заказы
            </button>
            <button
              onClick={() => window.location.href = '/catalog'}
              className="continue-shopping-btn"
            >
              Продолжить покупки
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <h1>Оформление заказа</h1>
        <div className="checkout-steps">
          <div className="step completed">Корзина</div>
          <div className="step active">Оформление</div>
          <div className="step">Подтверждение</div>
        </div>
      </div>

      <div className="checkout-content">
        <div className="checkout-form-section">
          <form onSubmit={handleSubmit} className="checkout-form">
            <div className="form-section">
              <h3>Контактная информация</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="first_name">Имя *</label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="last_name">Фамилия *</label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Телефон *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+375 (XX) XXX-XX-XX"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Адрес доставки</h3>
              <div className="form-group">
                <label htmlFor="shipping_address">Полный адрес доставки *</label>
                <textarea
                  id="shipping_address"
                  name="shipping_address"
                  value={formData.shipping_address}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Город, улица, дом, квартира, почтовый индекс"
                  required
                />
                <small>Пример: г. Минск, ул. Примерная, д. 10, кв. 25, 220000</small>
              </div>
            </div>

            <div className="form-section">
              <h3>Способ оплаты</h3>
              <div className="payment-methods">
                <label className="payment-method">
                  <input
                    type="radio"
                    name="payment_method"
                    value="card"
                    checked={formData.payment_method === 'card'}
                    onChange={handleInputChange}
                  />
                  <span className="checkmark"></span>
                  <div className="payment-info">
                    <span className="payment-title">Банковская карта</span>
                    <span className="payment-desc">Оплата картой онлайн</span>
                  </div>
                </label>
                <label className="payment-method">
                  <input
                    type="radio"
                    name="payment_method"
                    value="cash"
                    checked={formData.payment_method === 'cash'}
                    onChange={handleInputChange}
                  />
                  <span className="checkmark"></span>
                  <div className="payment-info">
                    <span className="payment-title">Наличными при получении</span>
                    <span className="payment-desc">Оплата курьеру при доставке</span>
                  </div>
                </label>
                <label className="payment-method">
                  <input
                    type="radio"
                    name="payment_method"
                    value="online"
                    checked={formData.payment_method === 'online'}
                    onChange={handleInputChange}
                  />
                  <span className="checkmark"></span>
                  <div className="payment-info">
                    <span className="payment-title">Онлайн-оплата</span>
                    <span className="payment-desc">Через систему электронных платежей</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="form-section">
              <h3>Дополнительная информация</h3>
              <div className="form-group">
                <label htmlFor="notes">Примечания к заказу</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Комментарии к доставке, пожелания, особые указания и т.д."
                />
              </div>
            </div>

            {orderError && (
              <div className="error-message">
                <strong>Ошибка:</strong> {orderError}
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="back-btn"
              >
                ← Вернуться в корзину
              </button>
              <button
                type="submit"
                disabled={loading || cartItems.length === 0}
                className="submit-order-btn"
              >
                {loading ? (
                  <>
                    <div className="button-spinner"></div>
                    Оформление заказа...
                  </>
                ) : (
                  `Подтвердить заказ · ${getTotalPrice().toFixed(2)} BYN`
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="order-summary-section">
          <div className="order-summary">
            <h3>Ваш заказ</h3>

            <div className="order-items">
              {cartItems.map((item) => {
                const productImage = getProductImage(item);
                const variantName = getVariantName(item);
                const itemPrice = getItemPrice(item);
                const itemTotal = getItemTotal(item);

                return (
                  <div key={item.id} className="order-item">
                    <div className="item-image">
                      {productImage ? (
                        <img src={productImage} alt={item.product?.name || 'Товар'} />
                      ) : (
                        <div className="no-image">Нет изображения</div>
                      )}
                    </div>

                    <div className="item-info">
                      <h4>{item.product?.name || 'Товар'}</h4>
                      {item.product?.brand?.name && (
                        <p className="brand">{item.product.brand.name}</p>
                      )}
                      {variantName && (
                        <p className="variant">{variantName}</p>
                      )}
                      <p className="quantity">Количество: {item.quantity}</p>
                    </div>

                    <div className="item-price">
                      {itemTotal.toFixed(2)} BYN
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="order-totals">
              <div className="total-row">
                <span>Товары ({getTotalItems()} шт.)</span>
                <span>{getTotalPrice().toFixed(2)} BYN</span>
              </div>
              <div className="total-row">
                <span>Доставка</span>
                <span className="free-shipping">Бесплатно</span>
              </div>
              <div className="total-row final">
                <span>Итого к оплате</span>
                <span className="final-price">{getTotalPrice().toFixed(2)} BYN</span>
              </div>
            </div>
          </div>

          <div className="security-notice">
            <div className="security-icon">🔒</div>
            <p>Ваши данные защищены. Мы не передаем информацию третьим лицам.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export {CheckoutPage};