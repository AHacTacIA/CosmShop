// pages/OrderDetailsPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { orderService } from '../api/order';
import { useAuth } from '../context/AuthContext';
import './OrderDetailsPage.css';

const OrderDetailsPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [order, setOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Загрузка данных заказа
  const loadOrderData = async () => {
    try {
      setLoading(true);
      setError('');

      // Загружаем основную информацию о заказе
      const orderResponse = await orderService.getOrder(orderId);
      setOrder(orderResponse.data);

      // Загружаем элементы заказа
      const itemsResponse = await orderService.getOrderItems(orderId);
      setOrderItems(itemsResponse.data.results || itemsResponse.data);

    } catch (err) {
      console.error('Error loading order details:', err);
      if (err.response?.status === 404) {
        setError('Заказ не найден');
      } else if (err.response?.status === 403) {
        setError('У вас нет доступа к этому заказу');
      } else {
        setError('Ошибка загрузки данных заказа');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && orderId) {
      loadOrderData();
    }
  }, [isAuthenticated, orderId]);

  // Отмена заказа
  const handleCancelOrder = async () => {
    if (!window.confirm('Вы уверены, что хотите отменить этот заказ? Это действие нельзя отменить.')) {
      return;
    }

    try {
      setCancelling(true);
      await orderService.cancelOrder(orderId);
      // Обновляем данные заказа
      await loadOrderData();
    } catch (err) {
      console.error('Error cancelling order:', err);
      alert('Ошибка при отмене заказа');
    } finally {
      setCancelling(false);
    }
  };

  // Повтор заказа
  const handleReorder = async () => {
    try {
      const newOrder = await orderService.reorder(orderId);
      navigate(`/orders/${newOrder.id}`);
    } catch (err) {
      console.error('Error reordering:', err);
      alert('Ошибка при повторном заказе');
    }
  };

  // Печать заказа
  const handlePrint = () => {
    window.print();
  };

  // Получение текста статуса
  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Ожидает обработки',
      'processing': 'В обработке',
      'shipped': 'Отправлен',
      'delivered': 'Доставлен',
      'cancelled': 'Отменен'
    };
    return statusMap[status] || status;
  };

  // Получение класса для статуса
  const getStatusClass = (status) => {
    return `status-${status}`;
  };

  // Форматирование даты
  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  // Расчет общей суммы товаров
  const calculateItemsTotal = () => {
    return orderItems.reduce((total, item) => {
      return total + (parseFloat(item.price) * item.quantity);
    }, 0);
  };

  // Если пользователь не авторизован
  if (!isAuthenticated) {
    return (
      <div className="order-details-container">
        <div className="auth-required">
          <h2>Доступ ограничен</h2>
          <p>Для просмотра заказа необходимо войти в систему</p>
          <div className="auth-actions">
            <button
              onClick={() => navigate('/login')}
              className="btn-primary"
            >
              Войти
            </button>
            <button
              onClick={() => navigate('/register')}
              className="btn-secondary"
            >
              Зарегистрироваться
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Состояния загрузки
  if (loading) {
    return (
      <div className="order-details-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Загрузка данных заказа...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-details-container">
        <div className="error-message">
          <h2>Ошибка</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={loadOrderData} className="btn-primary">
              Попробовать снова
            </button>
            <button onClick={() => navigate('/orders')} className="btn-secondary">
              К списку заказов
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-details-container">
        <div className="error-message">
          <h2>Заказ не найден</h2>
          <p>Заказ с ID {orderId} не существует</p>
          <button onClick={() => navigate('/orders')} className="btn-primary">
            К списку заказов
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-details-container">
      {/* Хлебные крошки */}
      <nav className="breadcrumbs">
        <Link to="/">Главная</Link>
        <span> / </span>
        <Link to="/orders">Мои заказы</Link>
        <span> / </span>
        <span>Заказ #{order.id}</span>
      </nav>

      {/* Шапка заказа */}
      <div className="order-header">
        <div className="header-left">
          <h1>Заказ #{order.id}</h1>
          <p className="order-date">Создан: {formatDate(order.created_at)}</p>
          {order.updated_at !== order.created_at && (
            <p className="order-updated">
              Обновлен: {formatDate(order.updated_at)}
            </p>
          )}
        </div>
        <div className="header-right">
          <span className={`status-badge large ${getStatusClass(order.status)}`}>
            {getStatusText(order.status)}
          </span>
        </div>
      </div>

      <div className="order-content">
        {/* Левая колонка - товары */}
        <div className="order-items-section">
          <h2>Состав заказа</h2>
          <div className="order-items-list">
            {orderItems.map((item, index) => {
              const productImage = getProductImage(item);
              const variantName = getVariantName(item);
              const itemTotal = parseFloat(item.price) * item.quantity;

              return (
                <div key={item.id || index} className="order-item">
                  <div className="item-image">
                    {productImage ? (
                      <img src={productImage} alt={item.product?.name || 'Товар'} />
                    ) : (
                      <div className="no-image">Нет изображения</div>
                    )}
                  </div>

                  <div className="item-details">
                    <h3 className="item-name">
                      {item.product?.name || 'Товар'}
                    </h3>
                    {item.product?.brand?.name && (
                      <p className="item-brand">Бренд: {item.product.brand.name}</p>
                    )}
                    {variantName && (
                      <p className="item-variant">{variantName}</p>
                    )}
                    <p className="item-price">Цена: {parseFloat(item.price).toFixed(2)} BYN</p>
                  </div>

                  <div className="item-quantity">
                    <span className="quantity-label">Количество:</span>
                    <span className="quantity-value">{item.quantity} шт.</span>
                  </div>

                  <div className="item-total">
                    {itemTotal.toFixed(2)} BYN
                  </div>
                </div>
              );
            })}
          </div>

          {/* Итоговая сумма */}
          <div className="order-total-summary">
            <div className="total-row">
              <span>Сумма товаров:</span>
              <span>{calculateItemsTotal().toFixed(2)} BYN</span>
            </div>
            <div className="total-row">
              <span>Доставка:</span>
              <span className="free-shipping">Бесплатно</span>
            </div>
            <div className="total-row final">
              <span>Итого к оплате:</span>
              <span className="final-price">{parseFloat(order.total_price).toFixed(2)} BYN</span>
            </div>
          </div>
        </div>

        {/* Правая колонка - информация о заказе */}
        <div className="order-info-section">
          {/* Информация о доставке */}
          <div className="info-card">
            <h3>📦 Информация о доставке</h3>
            <div className="info-content">
              <div className="info-row">
                <span className="info-label">Адрес доставки:</span>
                <span className="info-value">
                  {order.shipping_address || 'Не указан'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Статус доставки:</span>
                <span className={`info-value ${getStatusClass(order.status)}`}>
                  {getStatusText(order.status)}
                </span>
              </div>
            </div>
          </div>

          {/* Информация об оплате */}
          <div className="info-card">
            <h3>💳 Информация об оплате</h3>
            <div className="info-content">
              <div className="info-row">
                <span className="info-label">Способ оплаты:</span>
                <span className="info-value">
                  {order.payment_method === 'card_online' && 'Банковская карта'}
                  {order.payment_method === 'cash_on_delivery' && 'Наличные при получении'}
                  {order.payment_method === 'online_payment' && 'Онлайн-оплата'}
                  {!order.payment_method && 'Не указан'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Статус оплаты:</span>
                <span className="info-value">
                  {order.status === 'cancelled' ? 'Возврат' : 'Оплачено'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Сумма заказа:</span>
                <span className="info-value price">
                  {parseFloat(order.total_price).toFixed(2)} BYN
                </span>
              </div>
            </div>
          </div>

          {/* Дополнительная информация */}
          {order.notes && (
            <div className="info-card">
              <h3>📝 Примечания к заказу</h3>
              <div className="info-content">
                <p className="order-notes">{order.notes}</p>
              </div>
            </div>
          )}

          {/* Действия с заказом */}
          <div className="info-card actions-card">
            <h3>⚡ Действия</h3>
            <div className="order-actions">
              <button
                onClick={handlePrint}
                className="btn-action secondary"
              >
                🖨️ Печать заказа
              </button>

              {order.status === 'pending' && (
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="btn-action danger"
                >
                  {cancelling ? 'Отмена...' : '❌ Отменить заказ'}
                </button>
              )}

              {order.status === 'delivered' && (
                <button
                  onClick={handleReorder}
                  className="btn-action primary"
                >
                  🔄 Повторить заказ
                </button>
              )}

              <button
                onClick={() => navigate('/orders')}
                className="btn-action outline"
              >
                ← К списку заказов
              </button>
            </div>
          </div>

          {/* Контактная информация */}
          <div className="info-card">
            <h3>📞 Контактная информация</h3>
            <div className="info-content">
              <div className="info-row">
                <span className="info-label">Номер заказа:</span>
                <span className="info-value">#{order.id}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Дата создания:</span>
                <span className="info-value">{formatDate(order.created_at)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Последнее обновление:</span>
                <span className="info-value">{formatDate(order.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Стили для печати */}
      <style>{`
        @media print {
          .order-actions,
          .breadcrumbs,
          .btn-action {
            display: none !important;
          }
          
          .order-details-container {
            max-width: none !important;
            padding: 0 !important;
          }
          
          .order-content {
            display: block !important;
          }
          
          .info-card {
            break-inside: avoid;
            margin-bottom: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export { OrderDetailsPage };