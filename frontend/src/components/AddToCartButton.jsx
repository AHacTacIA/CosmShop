// components/AddToCartButton.jsx
import React, { useState } from 'react';
import { useCart } from '../hooks/useCart';

const AddToCartButton = ({ product, className = '' }) => {
  const { addToCart, loading } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (isAdding || loading) {
      console.log('Cannot add to cart:', { isAdding, loading });
      return;
    }

    setIsAdding(true);
    setError(null);

    try {
      console.log('Adding to cart with product ID:', product.id);

      // Передаем только product_id, variant_id будет получен автоматически
      const success = await addToCart(product.id, null, quantity);

      if (success) {
        console.log('Successfully added to cart');
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
      } else {
        setError('Не удалось добавить товар в корзину');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      setError('Ошибка при добавлении в корзину: ' + (error.message || ''));
    } finally {
      setIsAdding(false);
    }
  };

  const handleQuantityChange = (e) => {
    const newQuantity = parseInt(e.target.value);
    if (newQuantity > 0 && newQuantity <= 99) {
      setQuantity(newQuantity);
    }
  };

  const incrementQuantity = () => {
    if (quantity < 99) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  return (
    <div className="add-to-cart-container">
      {showSuccess && (
        <div className="success-message">
          ✓ Товар добавлен в корзину!
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

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
          onClick={(e) => e.stopPropagation()}
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
        className={`add-to-cart-btn ${className} ${isAdding ? 'loading' : ''}`}
        onClick={handleAddToCart}
        disabled={isAdding || loading}
      >
        {isAdding ? 'Добавляется...' : 'В корзину'}
      </button>
    </div>
  );
};

export default AddToCartButton;