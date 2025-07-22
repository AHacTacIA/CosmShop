import apiClient from "./client";

export const cartService = {

    // Получение текущей корзины пользователя
    getCart: () => {
    return apiClient.get('/carts/my_cart/');
  },

    // Получение элементов корзины
    getCartItems: () => {
    return apiClient.get('/cart-items/');
  },

  /**
   * Добавление товара в корзину
   * @param {Object} itemData - Данные товара
   * @param {number} itemData.product - ID продукта
   * @param {number} itemData.variant - ID варианта продукта
   * @param {number} itemData.quantity - Количество
   * @returns {Promise} - Ответ API
   */
  addItem: (itemData) => {
    return apiClient.post('/cart-items/', itemData);
  },

  /**
   * Обновление элемента корзины
   * @param {string} itemId - ID элемента корзины
   * @param {Object} itemData - Новые данные элемента
   * @returns {Promise} - Ответ API
   */
  updateItem: (itemId, itemData) => {
    return apiClient.put(`/cart-items/${itemId}/`, itemData);
  },

  /**
   * Частичное обновление элемента корзины
   * @param {string} itemId - ID элемента корзины
   * @param {Object} partialData - Частичные данные для обновления
   * @returns {Promise} - Ответ API
   */
  patchItem: (itemId, partialData) => {
    return apiClient.patch(`/cart-items/${itemId}/`, partialData);
  },

  /**
   * Удаление элемента из корзины
   * @param {string} itemId - ID элемента корзины
   * @returns {Promise} - Ответ API
   */
  removeItem: (itemId) => {
    return apiClient.delete(`/cart-items/${itemId}/`);
  },

  /**
   * Очистка корзины (удаление всех элементов)
   * @returns {Promise} - Ответ API
   */
  clearCart: () => {
    return apiClient.delete('/carts/my_cart/items/');
  },

  /**
   * Обновление количества товара в корзине
   * @param {string} itemId - ID элемента корзины
   * @param {number} newQuantity - Новое количество
   * @returns {Promise} - Ответ API
   */
  updateQuantity: (itemId, newQuantity) => {
    return apiClient.patch(`/cart-items/${itemId}/`, { quantity: newQuantity });
  },

  /**
   * Получение количества товаров в корзине
   * @returns {Promise<number>} - Общее количество товаров
   */
  getItemsCount: async () => {
    try {
      const response = await apiClient.get('/carts/my_cart/');
      return response.data.items.reduce((total, item) => total + item.quantity, 0);
    } catch (error) {
      console.error('Error getting cart items count:', error);
      return 0;
    }
  },

  /**
   * Получение общей суммы корзины
   * @returns {Promise<number>} - Общая сумма
   */
  getTotalPrice: async () => {
    try {
      const response = await apiClient.get('/carts/my_cart/');
      return response.data.total_price || 0;
    } catch (error) {
      console.error('Error getting cart total:', error);
      return 0;
    }
  },

  /**
   * Перенос корзины в заказ
   * @returns {Promise} - Ответ API с созданным заказом
   */
  checkout: () => {
    return apiClient.post('/orders/', {});
  },

}