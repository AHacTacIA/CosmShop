// hooks/useCart.js
import { useState, useEffect, useContext, createContext } from 'react';
import { cartService } from '../api/cart';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Загрузка полной корзины
  const loadCart = async () => {
    try {
      setLoading(true);
      const fullCart = await cartService.getFullCart();
      setCart(fullCart);
      setCartItems(fullCart.items || []);
      setError(null);
    } catch (err) {
      console.error('Error loading cart:', err);
      setError('Ошибка загрузки корзины');
    } finally {
      setLoading(false);
    }
  };

  // Добавление товара в корзину
  const addToCart = async (productId, variantId, quantity = 1) => {
  try {
    setLoading(true);
    console.log('useCart: Adding to cart', { productId, variantId, quantity });

    const success = await cartService.addItem({
      product: productId,
      variant: variantId,
      quantity: quantity
    });

    console.log('useCart: Add to cart result', success);

    if (success) {
      await loadCart(); // Перезагружаем корзину после добавления
      setError(null);
      return true;
    }
    return false;
  } catch (err) {
    console.error('useCart: Error adding to cart:', err);
    setError('Ошибка добавления товара в корзину: ' + (err.response?.data?.detail || err.message));
    return false;
  } finally {
    setLoading(false);
  }
};

  // Обновление количества товара
  const updateQuantity = async (itemId, newQuantity) => {
    try {
      if (newQuantity < 1) {
        await removeFromCart(itemId);
        return;
      }

      await cartService.updateQuantity(itemId, newQuantity);
      await loadCart();
      setError(null);
      return true;
    } catch (err) {
      console.error('Error updating quantity:', err);
      setError('Ошибка обновления количества');
      return false;
    }
  };

  // Удаление товара из корзины
  const removeFromCart = async (itemId) => {
    try {
      await cartService.removeItem(itemId);
      await loadCart();
      setError(null);
      return true;
    } catch (err) {
      console.error('Error removing from cart:', err);
      setError('Ошибка удаления товара');
      return false;
    }
  };

  // Очистка корзины
  const clearCart = async () => {
    try {
      await cartService.clearCart();
      await loadCart();
      setError(null);
      return true;
    } catch (err) {
      console.error('Error clearing cart:', err);
      setError('Ошибка очистки корзины');
      return false;
    }
  };

  // Получение общего количества товаров
  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  // Получение общей суммы
  const getTotalPrice = () => {
    return cart?.total_price || 0;
  };

  // Получение ID корзины
  const getCartId = () => {
    return cart?.id;
  };

  // Загрузка корзины при монтировании
  useEffect(() => {
    loadCart();
  }, []);

  const value = {
    cart,
    cartItems,
    loading,
    error,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    loadCart,
    getTotalItems,
    getTotalPrice,
    getCartId
  };



  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};