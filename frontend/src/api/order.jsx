// order.jsx
import apiClient from "./client";


export const orderService = {
    /**
   * Получение списка заказов пользователя
   * @param {Object} params - Параметры фильтрации
   * @param {string} params.status - Фильтр по статусу
   * @param {string} params.ordering - Сортировка (-created_at для новых первых)
   * @returns {Promise} - Ответ API
   */
  getOrders: (params = {}) => {
    return apiClient.get('/orders/', {
      params: {
        status: params.status,
        ordering: params.ordering || '-created_at'
      }
    });
  },

  /**
   * Получение конкретного заказа по ID
   * @param {string} orderId - ID заказа
   * @returns {Promise} - Ответ API
   */
  getOrder: (orderId) => {
    return apiClient.get(`/orders/${orderId}/`);
  },

  /**
   * Получение элементов конкретного заказа
   * @param {string} orderId - ID заказа
   * @returns {Promise} - Ответ API
   */
  getOrderItems: (orderId) => {
    return apiClient.get(`/orders/${orderId}/items/`);
  },

  /**
   * Создание заказа из текущей корзины
   * @param {Object} orderData - Дополнительные данные заказа
   * @param {string} orderData.shipping_address - Адрес доставки
   * @param {string} orderData.payment_method - Способ оплаты
   * @returns {Promise} - Ответ API
   */

  createOrder: (orderData = {}) => {
    return apiClient.post('/orders/', orderData);
  },

  /**
   * Обновление заказа (для админов)
   * @param {string} orderId - ID заказа
   * @param {Object} orderData - Данные для обновления
   * @returns {Promise} - Ответ API
   */
  updateOrder: (orderId, orderData) => {
    return apiClient.put(`/orders/${orderId}/`, orderData);
  },

  // Добавьте метод для получения деталей заказа
  getOrderDetails: (orderId) => {
    return apiClient.get(`/orders/${orderId}/`);
  },

  /**
   * Частичное обновление заказа
   * @param {string} orderId - ID заказа
   * @param {Object} partialData - Частичные данные для обновления
   * @returns {Promise} - Ответ API
   */
  patchOrder: (orderId, partialData) => {
    return apiClient.patch(`/orders/${orderId}/`, partialData);
  },

  /**
   * Отмена заказа
   * @param {string} orderId - ID заказа
   * @returns {Promise} - Ответ API
   */
  cancelOrder: (orderId) => {
    return apiClient.patch(`/orders/${orderId}/`, { status: 'cancelled' });
  },

  /**
   * Повтор заказа (создание нового на основе существующего)
   * @param {string} orderId - ID заказа для повторения
   * @returns {Promise} - Ответ API
   */
  reorder: async (orderId) => {
    try {
      // Получаем элементы старого заказа
      const { data: items } = await orderService.getOrderItems(orderId);

      // Создаем новый заказ
      const { data: newOrder } = await orderService.createOrder();

      // Добавляем товары в новый заказ (если API поддерживает)
      for (const item of items) {
        await apiClient.post('/order-items/', {
          order: newOrder.id,
          product: item.product.id,
          variant: item.variant.id,
          quantity: item.quantity
        });
      }

      return newOrder;
    } catch (error) {
      throw error;
    }
  },
  /**
   * Получение количества заказов по статусам
   * @returns {Promise<Object>} - Объект с количеством заказов по статусам
   */
  getOrdersCount: async () => {
    try {
      const response = await apiClient.get('/orders/');
      const orders = response.data;

      return orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {});
    } catch (error) {
      throw error;
    }
  }
};