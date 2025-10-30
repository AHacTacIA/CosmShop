// hooks/useWishlist.js
import { useState, useEffect } from 'react';
import { productService } from '../api/products';

export const useWishlist = () => {
  const [favorites, setFavorites] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  // Загрузка избранного при инициализации
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const favoriteProducts = await productService.getFavorites();
      const ids = new Set(favoriteProducts.map(product => product.id));

      setFavorites(favoriteProducts);
      setFavoriteIds(ids);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (productId) => {
    try {
      await productService.addToFavorites(productId);
      setFavoriteIds(prev => new Set([...prev, productId]));
      await loadFavorites(); // Перезагружаем для обновления данных
      return true;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      return false;
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      await productService.removeFromFavorites(productId);
      setFavoriteIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
      await loadFavorites(); // Перезагружаем для обновления данных
      return true;
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      return false;
    }
  };

  const toggleWishlist = async (productId) => {
    const isCurrentlyFavorite = favoriteIds.has(productId);

    if (isCurrentlyFavorite) {
      return await removeFromWishlist(productId);
    } else {
      return await addToWishlist(productId);
    }
  };

  const isInWishlist = (productId) => {
    return favoriteIds.has(productId);
  };

  const clearWishlist = async () => {
    try {
      setLoading(true);
      // Удаляем все продукты из избранного
      const removePromises = Array.from(favoriteIds).map(id =>
        productService.removeFromFavorites(id)
      );
      await Promise.all(removePromises);

      setFavorites([]);
      setFavoriteIds(new Set());
    } catch (error) {
      console.error('Error clearing wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    favorites,
    favoriteIds,
    loading,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    clearWishlist,
    refreshWishlist: loadFavorites
  };
};