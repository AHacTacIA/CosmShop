// pages/CheckoutPage.jsx
import React, { useState, useEffect } from 'react';
import { useCart } from '../hooks/useCart';
import { orderService } from '../api/order';
import { useAuth } from '../context/AuthContext'; // Добавляем useAuth
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

  const { currentUser } = useAuth(); // Получаем данные пользователя

  const [loading, setLoading] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [success, setSuccess] = useState(false);
  const [order, setOrder] = useState(null);

  // Данные формы - инициализируем из профиля
  const [formData, setFormData] = useState({
    shipping_address: '',
    payment_method: 'card_online', // Обновляем значения согласно модели
    // Эти поля только для отображения, не для редактирования
    email: '',
    phone: '',
    first_name: '',
    last_name: ''
  });

  // Заполняем данные из профиля при загрузке
  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        email: currentUser.email || '',
        phone: currentUser.phone_number || '',
        first_name: currentUser.first_name || '',
        last_name: currentUser.last_name || '',
        shipping_address: currentUser.address || '' // Адрес по умолчанию из профиля
      }));
    }
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Разрешаем изменять только shipping_address, payment_method
    const editableFields = ['shipping_address', 'payment_method'];
    if (editableFields.includes(name)) {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
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

    // Проверяем, что адрес доставки заполнен
    if (!formData.shipping_address.trim()) {
      setOrderError('Пожалуйста, укажите адрес доставки.');
      setLoading(false);
      return;
    }

    try {
      const totalPrice = getTotalPrice();

      // Создаем объект заказа только с необходимыми полями
      const orderPayload = {
        shipping_address: formData.shipping_address,
        payment_method: formData.payment_method,
        total_price: totalPrice.toFixed(2)
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

  // Получение текста способа оплаты
  const getPaymentMethodText = (method) => {
    const paymentMethods = {
      'card_online': 'Банковской картой онлайн',
      'cash_on_delivery': 'Наличными при получении',
      'online_payment': 'Онлайн-оплата через систему электронных платежей'
    };
    return paymentMethods[method] || method;
  };

  // Остальные функции остаются без изменений
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

  const getItemPrice = (item) => {
    if (item.variant && item.variant.price) {
      return parseFloat(item.variant.price);
    }
    if (item.product && item.product.price) {
      return parseFloat(item.product.price);
    }
    return 0;
  };

  const getItemTotal = (item) => {
    return getItemPrice(item) * item.quantity;
  };

  // Состояния загрузки и отображения остаются без изменений
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
            <p><strong>Адрес:</strong> {order.shipping_address}</p>
            <p><strong>Способ оплаты:</strong> {getPaymentMethodText(order.payment_method)}</p>
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
            {/* Контактная информация - только для чтения */}
            <div className="form-section">
              <h3>Контактная информация</h3>
              <div className="readonly-info">
                <div className="info-row">
                  <span className="info-label">Имя:</span>
                  <span className="info-value">
                    {formData.first_name || 'Не указано'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Фамилия:</span>
                  <span className="info-value">
                    {formData.last_name || 'Не указано'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{formData.email}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Телефон:</span>
                  <span className="info-value">
                    {formData.phone || 'Не указан'}
                  </span>
                </div>
              </div>
              <p className="info-note">
                💡 Чтобы изменить контактные данные, перейдите в{' '}
                <a href="/profile/edit" className="profile-link">настройки профиля</a>
              </p>
            </div>

            {/* Адрес доставки - редактируемый */}
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
                <small>
                  {formData.shipping_address === currentUser?.address
                    ? '📋 Используется адрес из вашего профиля'
                    : '✏️ Вы изменили адрес доставки'
                  }
                </small>
              </div>
            </div>

            {/* Способ оплаты */}
            <div className="form-section">
              <h3>Способ оплаты</h3>
              <div className="payment-methods">
                <label className="payment-method">
                  <input
                    type="radio"
                    name="payment_method"
                    value="card_online"
                    checked={formData.payment_method === 'card_online'}
                    onChange={handleInputChange}
                  />
                  <span className="checkmark"></span>
                  <div className="payment-info">
                    <span className="payment-title">Банковской картой онлайн</span>
                    <span className="payment-desc">Оплата картой онлайн</span>
                  </div>
                </label>
                <label className="payment-method">
                  <input
                    type="radio"
                    name="payment_method"
                    value="cash_on_delivery"
                    checked={formData.payment_method === 'cash_on_delivery'}
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
                    value="online_payment"
                    checked={formData.payment_method === 'online_payment'}
                    onChange={handleInputChange}
                  />
                  <span className="checkmark"></span>
                  <div className="payment-info">
                    <span className="payment-title">Онлайн-оплата через систему электронных платежей</span>
                    <span className="payment-desc">Через систему электронных платежей</span>
                  </div>
                </label>
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

        {/* Правая колонка с товарами остается без изменений */}
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