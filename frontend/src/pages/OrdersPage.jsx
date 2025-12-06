// pages/MyOrdersPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../api/order';
import { useAuth } from '../context/AuthContext';
import './OrdersPage.css';

const OrdersPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, processing, shipped, delivered, cancelled

  // Загрузка заказов
  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {};
      if (filter !== 'all') {
        params.status = filter;
      }

      const response = await orderService.getOrders(params);
      setOrders(response.data.results || response.data);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Ошибка загрузки заказов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadOrders();
    }
  }, [isAuthenticated, filter]);

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
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Просмотр деталей заказа
  const handleViewOrder = (orderId) => {
    navigate(`/orders/${orderId}`);
  };

  // Повтор заказа
  const handleReorder = async (orderId) => {
    try {
      const newOrder = await orderService.reorder(orderId);
      navigate(`/orders/${newOrder.id}`);
    } catch (err) {
      console.error('Error reordering:', err);
      alert('Ошибка при повторном заказе');
    }
  };

  // Отмена заказа
  const handleCancelOrder = async (orderId) => {
    if (window.confirm('Вы уверены, что хотите отменить этот заказ?')) {
      try {
        await orderService.cancelOrder(orderId);
        loadOrders(); // Перезагружаем список
      } catch (err) {
        console.error('Error cancelling order:', err);
        alert('Ошибка при отмене заказа');
      }
    }
  };

  // Фильтрация заказов
  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  // Если пользователь не авторизован
  if (!isAuthenticated) {
    return (
      <div className="orders-container">
        <div className="auth-required">
          <h2>Доступ ограничен</h2>
          <p>Для просмотра заказов необходимо войти в систему</p>
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

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h1>Мои заказы</h1>
        <p>История всех ваших заказов</p>
      </div>

      {/* Фильтры */}
      <div className="orders-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Все заказы
        </button>
        <button
          className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Ожидают обработки
        </button>
        <button
          className={`filter-btn ${filter === 'processing' ? 'active' : ''}`}
          onClick={() => setFilter('processing')}
        >
          В обработке
        </button>
        <button
          className={`filter-btn ${filter === 'shipped' ? 'active' : ''}`}
          onClick={() => setFilter('shipped')}
        >
          Отправлены
        </button>
        <button
          className={`filter-btn ${filter === 'delivered' ? 'active' : ''}`}
          onClick={() => setFilter('delivered')}
        >
          Доставлены
        </button>
        <button
          className={`filter-btn ${filter === 'cancelled' ? 'active' : ''}`}
          onClick={() => setFilter('cancelled')}
        >
          Отменены
        </button>
      </div>

      {/* Состояния загрузки и ошибок */}
      {loading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Загрузка заказов...</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={loadOrders} className="btn-primary">
            Попробовать снова
          </button>
        </div>
      )}

      {/* Список заказов */}
      {!loading && !error && (
        <div className="orders-list">
          {filteredOrders.length === 0 ? (
            <div className="empty-orders">
              <div className="empty-icon">📦</div>
              <h3>Заказов не найдено</h3>
              <p>
                {filter === 'all'
                  ? 'У вас еще нет заказов. Сделайте свой первый заказ!'
                  : `Нет заказов со статусом "${getStatusText(filter)}"`
                }
              </p>
              {filter === 'all' && (
                <button
                  onClick={() => navigate('/catalog')}
                  className="btn-primary"
                >
                  Перейти в каталог
                </button>
              )}
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    <h3>Заказ #{order.id}</h3>
                    <span className="order-date">
                      {formatDate(order.created_at)}
                    </span>
                  </div>
                  <div className="order-status">
                    <span className={`status-badge ${getStatusClass(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                </div>

                <div className="order-details">
                  <div className="order-summary">
                    <div className="summary-item">
                      <span className="label">Сумма заказа:</span>
                      <span className="value">{parseFloat(order.total_price).toFixed(2)} BYN</span>
                    </div>
                    <div className="summary-item">
                      <span className="label">Способ оплаты:</span>
                      <span className="value">
                        {order.payment_method === 'card_online' && 'Банковская карта'}
                        {order.payment_method === 'cash_on_delivery' && 'Наличные при получении'}
                        {order.payment_method === 'online_payment' && 'Онлайн-оплата'}
                        {!order.payment_method && 'Не указан'}
                      </span>
                    </div>
                    {order.shipping_address && (
                      <div className="summary-item">
                        <span className="label">Адрес доставки:</span>
                        <span className="value address">{order.shipping_address}</span>
                      </div>
                    )}
                  </div>

                  {/* Товары в заказе (превью) */}
                  {order.items && order.items.length > 0 && (
                    <div className="order-items-preview">
                      <h4>Товары:</h4>
                      <div className="items-list">
                        {order.items.slice(0, 3).map((item, index) => (
                          <div key={index} className="preview-item">
                            <span className="item-name">
                              {item.product?.name || 'Товар'}
                              {item.variant && ` (${item.variant.color || item.variant.size || item.variant.volume})`}
                            </span>
                            <span className="item-quantity">×{item.quantity}</span>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <div className="more-items">
                            и еще {order.items.length - 3} товар(ов)
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="order-actions">
                  <button
                    onClick={() => handleViewOrder(order.id)}
                    className="btn-action primary"
                  >
                    Подробнее
                  </button>

                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      className="btn-action danger"
                    >
                      Отменить заказ
                    </button>
                  )}

                  {/*{order.status === 'delivered' && (*/}
                  {/*  <button*/}
                  {/*    onClick={() => handleReorder(order.id)}*/}
                  {/*    className="btn-action secondary"*/}
                  {/*  >*/}
                  {/*    Повторить заказ*/}
                  {/*  </button>*/}
                  {/*)}*/}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export { OrdersPage };