import apiClient from "./client";

export const cartService = {
  // Получение текущей корзины пользователя (только ID корзины)
  getCart: () => {
    return apiClient.get('/carts/my_cart/');
  },

  // Получение элементов корзины по ID корзины
  getCartItems: async () => {
    try {
      // Сначала получаем корзину чтобы узнать её ID
      const cartResponse = await apiClient.get('/carts/my_cart/');
      const cartId = cartResponse.data.id;

      // Затем получаем товары этой корзины
      const itemsResponse = await apiClient.get(`/carts/${cartId}/items/`);
      return itemsResponse;
    } catch (error) {
      console.error('Error getting cart items:', error);
      throw error;
    }
  },

  // Получение информации о товаре по ID
  getProduct: (productId) => {
    return apiClient.get(`/products/${productId}/`);
  },

  /**
   * Добавление товара в корзину
   * @param {Object} itemData - Данные товара
   * @param {number} itemData.product - ID продукта
   * @param {number} itemData.variant - ID варианта продукта (опционально)
   * @param {number} itemData.quantity - Количество
   * @returns {Promise} - Ответ API
   */
  addItem: async (itemData) => {
    try {
      let variantId = itemData.variant;

      // Если variant_id не передан, загружаем информацию о товаре и берем первый вариант
      if (!variantId) {
        console.log('Variant ID not provided, loading product info...');
        const productResponse = await apiClient.get(`/products/${itemData.product}/`);
        const product = productResponse.data;

        if (!product.variants || product.variants.length === 0) {
          throw new Error('Product has no variants');
        }

        variantId = product.variants[0].id;
        console.log('Using first variant ID:', variantId);
      }

      const requestData = {
        product_id: itemData.product,
        variant_id: variantId,
        quantity: itemData.quantity || 1
      };

      console.log('Sending to cart API:', requestData);

      const response = await apiClient.post('/cart-items/', requestData);
      console.log('Cart API response:', response.data);

      return response.data;
    } catch (error) {
      console.error('Error adding item to cart:', error);
      throw error;
    }
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
  clearCart: async () => {
    try {
      // Сначала получаем корзину чтобы узнать её ID
      const cartResponse = await apiClient.get('/carts/my_cart/');
      const cartId = cartResponse.data.id;

      // Очищаем корзину
      return await apiClient.delete(`/carts/${cartId}/items/`);
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
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
      const itemsResponse = await cartService.getCartItems();
      return itemsResponse.data.reduce((total, item) => total + item.quantity, 0);
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
      const itemsResponse = await cartService.getCartItems();
      let total = 0;

      // Вычисляем общую сумму на клиенте
      for (const item of itemsResponse.data) {
        // Используем цену из варианта товара
        const price = parseFloat(item.variant.price);
        total += price * item.quantity;
      }

      return total;
    } catch (error) {
      console.error('Error getting cart total:', error);
      return 0;
    }
  },



  /**
   * Получение полной информации о корзине (ID + товары)
   * @returns {Promise<Object>} - Полная информация о корзине
   */
  getFullCart: async () => {
    try {
      // Получаем основную информацию о корзине
      const cartResponse = await apiClient.get('/carts/my_cart/');
      const cartId = cartResponse.data.id;

      // Получаем товары корзины
      const itemsResponse = await apiClient.get(`/carts/${cartId}/items/`);

      // Вычисляем общую сумму и количество товаров
      let totalPrice = 0;
      let totalItems = 0;

      for (const item of itemsResponse.data) {
        const price = parseFloat(item.variant.price);
        totalPrice += price * item.quantity;
        totalItems += item.quantity;
      }

      return {
        ...cartResponse.data,
        items: itemsResponse.data,
        total_price: totalPrice,
        total_items: totalItems
      };
    } catch (error) {
      console.error('Error getting full cart:', error);
      throw error;
    }
  }
};