// pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { productService } from '../api/products';
import ProductCard from '../components/ProductCard';
import './HomePage.css';

export const HomePage = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [featuredProducts, setFeaturedProducts] = useState([]);

  // Пагинация
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(12);

  // Загрузка всех товаров
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const response = await productService.getProducts();
        const allProducts = response.data;

        setAllProducts(allProducts);

        // Выбираем featured товары (первые 8 для примера)
        setFeaturedProducts(allProducts.slice(0, 8));

      } catch (err) {
        console.error('Error loading products:', err);
        setError('Ошибка загрузки товаров');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Пагинация товаров
  useEffect(() => {
    if (allProducts.length > 0) {
      const indexOfLastProduct = currentPage * productsPerPage;
      const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
      const currentProducts = allProducts.slice(indexOfFirstProduct, indexOfLastProduct);
      setDisplayedProducts(currentProducts);
    }
  }, [allProducts, currentPage, productsPerPage]);

  // Обработчики пагинации
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProductsPerPageChange = (newSize) => {
    setProductsPerPage(parseInt(newSize));
    setCurrentPage(1); // Сбрасываем на первую страницу при изменении размера
  };

  // Вычисление общего количества страниц
  const totalPages = Math.ceil(allProducts.length / productsPerPage);

  // Генерация номеров страниц для отображения
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  };

  if (loading) {
    return (
      <div className="homepage">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Загрузка товаров...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="homepage">
        <div className="error-message">
          <h2>Ошибка</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Попробовать снова</button>
        </div>
      </div>
    );
  }

  return (
    <div className="homepage">
      {/* Герой секция */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Добро пожаловать в Gloss</h1>
          <p className="hero-subtitle">
            Откройте для себя мир beauty-продуктов от лучших брендов
          </p>
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">{allProducts.length}+</span>
              <span className="stat-label">Товаров</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">
                {new Set(allProducts.map(p => p.brand?.name)).size}+
              </span>
              <span className="stat-label">Брендов</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">100%</span>
              <span className="stat-label">Оригинал</span>
            </div>
          </div>
        </div>
        <div className="hero-image">
          <div className="hero-gradient"></div>
        </div>
      </section>

      {/* Популярные товары */}
      <section className="featured-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Популярные товары</h2>
            <p className="section-subtitle">Самые востребованные beauty-продукты</p>
          </div>

          <div className="products-grid">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {allProducts.length > 8 && (
            <div className="view-all-container">
              <a href="#all-products" className="view-all-btn">
                Смотреть все товары ({allProducts.length})
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Все товары с пагинацией */}
      <section id="all-products" className="all-products-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Все товары</h2>
            <p className="section-subtitle">Полный каталог нашей продукции</p>
          </div>

          {/* Контролы пагинации - верх */}
          <div className="pagination-controls top">
            <div className="pagination-info">
              Показано {displayedProducts.length} из {allProducts.length} товаров
            </div>
            <div className="pagination-settings">
              <label htmlFor="productsPerPage">Товаров на странице:</label>
              <select
                id="productsPerPage"
                value={productsPerPage}
                onChange={(e) => handleProductsPerPageChange(e.target.value)}
                className="page-size-select"
              >
                <option value="12">12</option>
                <option value="24">24</option>
                <option value="36">36</option>
                <option value="48">48</option>
              </select>
            </div>
          </div>

          {/* Сетка товаров */}
          <div className="products-grid large">
            {displayedProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Пагинация */}
          {totalPages > 1 && (
            <div className="pagination">
              {/* Кнопка "Назад" */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-btn prev"
              >
                ← Назад
              </button>

              {/* Первая страница */}
              {currentPage > 3 && (
                <>
                  <button
                    onClick={() => handlePageChange(1)}
                    className="pagination-btn"
                  >
                    1
                  </button>
                  {currentPage > 4 && <span className="pagination-ellipsis">...</span>}
                </>
              )}

              {/* Номера страниц */}
              {getPageNumbers().map(pageNumber => (
                <button
                  key={pageNumber}
                  onClick={() => handlePageChange(pageNumber)}
                  className={`pagination-btn ${currentPage === pageNumber ? 'active' : ''}`}
                >
                  {pageNumber}
                </button>
              ))}

              {/* Последняя страница */}
              {currentPage < totalPages - 2 && (
                <>
                  {currentPage < totalPages - 3 && <span className="pagination-ellipsis">...</span>}
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    className="pagination-btn"
                  >
                    {totalPages}
                  </button>
                </>
              )}

              {/* Кнопка "Вперед" */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-btn next"
              >
                Вперед →
              </button>
            </div>
          )}

          {/* Информация о пагинации */}
          <div className="pagination-info-bottom">
            Страница {currentPage} из {totalPages}
          </div>

          {/* Статистика внизу */}
          <div className="products-stats">
            <div className="stat-card">
              <h3>Всего товаров</h3>
              <span className="stat-number-large">{allProducts.length}</span>
            </div>
            <div className="stat-card">
              <h3>Брендов</h3>
              <span className="stat-number-large">
                {new Set(allProducts.map(p => p.brand?.name)).size}
              </span>
            </div>
            <div className="stat-card">
              <h3>Категорий</h3>
              <span className="stat-number-large">
                {new Set(allProducts.map(p => p.category?.name)).size}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};