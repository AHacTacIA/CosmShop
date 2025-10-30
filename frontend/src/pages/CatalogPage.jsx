// pages/CatalogPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { productService } from '../api/products';
import { categoryService } from '../api/categories';
import ProductCard from '../components/ProductCard';
import './CatalogPage.css';

const CatalogPage = () => {
  const { categorySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [allProducts, setAllProducts] = useState([]); // Все продукты
  const [category, setCategory] = useState(null);
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Пагинация
  const [pagination, setPagination] = useState({
    currentPage: parseInt(searchParams.get('page')) || 1,
    pageSize: parseInt(searchParams.get('page_size')) || 12
  });

  const [filters, setFilters] = useState({
    brand: searchParams.get('brand') || '',
    minPrice: searchParams.get('min_price') || '',
    maxPrice: searchParams.get('max_price') || '',
    search: searchParams.get('search') || ''
  });

  // Загрузка всех категорий при монтировании
  useEffect(() => {
    const loadAllCategories = async () => {
      try {
        const response = await categoryService.getAllCategories();
        setAllCategories(response.data);
      } catch (err) {
        console.error('Error loading categories:', err);
      }
    };
    loadAllCategories();
  }, []);

  // Рекурсивная функция для получения всех дочерних категорий
  const getAllChildCategories = (categoryId) => {
    const childCategories = [];

    const findChildren = (parentId) => {
      const children = allCategories.filter(cat => cat.parent === parentId);
      children.forEach(child => {
        childCategories.push(child.id);
        findChildren(child.id);
      });
    };

    findChildren(categoryId);
    return childCategories;
  };

  // Функция для получения категории по slug
  const getCategoryBySlug = (slug) => {
    return allCategories.find(cat => cat.slug === slug) || null;
  };

  // Загрузка всех продуктов
  const loadAllProducts = async () => {
    try {
      let productsData = [];

      if (categorySlug) {
        const categoryData = getCategoryBySlug(categorySlug);
        if (categoryData) {
          setCategory(categoryData);
          const allCategoryIds = [categoryData.id, ...getAllChildCategories(categoryData.id)];

          // Загружаем продукты для всех категорий
          for (const categoryId of allCategoryIds) {
            try {
              const productsResponse = await productService.getProducts({
                category: categoryId
              });
              productsData.push(...productsResponse.data);
            } catch (err) {
              console.error(`Error loading products for category ${categoryId}:`, err);
            }
          }
        } else {
          setError(`Категория "${categorySlug}" не найдена`);
          return [];
        }
      } else {
        // Загружаем все товары
        const productsResponse = await productService.getProducts();
        productsData = productsResponse.data;
      }

      // Удаляем дубликаты по ID
      const uniqueProducts = productsData.filter((product, index, self) =>
        index === self.findIndex(p => p.id === product.id)
      );

      return uniqueProducts;
    } catch (err) {
      console.error('Error loading products:', err);
      throw err;
    }
  };

  // Обновление URL с параметрами
  const updateURLParams = (newFilters, newPagination) => {
    const params = new URLSearchParams();

    if (newFilters.search) params.set('search', newFilters.search);
    if (newFilters.brand) params.set('brand', newFilters.brand);
    if (newFilters.minPrice) params.set('min_price', newFilters.minPrice);
    if (newFilters.maxPrice) params.set('max_price', newFilters.maxPrice);

    if (newPagination.currentPage > 1) params.set('page', newPagination.currentPage.toString());
    if (newPagination.pageSize !== 12) params.set('page_size', newPagination.pageSize.toString());

    setSearchParams(params);
  };

  // Загрузка данных при изменении категории
  useEffect(() => {
    const loadCatalogData = async () => {
      if (allCategories.length === 0) return;

      try {
        setLoading(true);
        const productsData = await loadAllProducts();
        setAllProducts(productsData);
        setLoading(false);
      } catch (err) {
        console.error('Error loading catalog:', err);
        setError('Ошибка загрузки каталога');
        setLoading(false);
      }
    };

    loadCatalogData();
  }, [categorySlug, allCategories]);

  // Фильтрация продуктов на клиенте
  const filteredProducts = useMemo(() => {
    let filtered = allProducts;

    // Фильтр по поисковому запросу
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower)
      );
    }

    // Фильтр по бренду
    if (filters.brand) {
      const brandLower = filters.brand.toLowerCase();
      filtered = filtered.filter(product =>
        product.brand?.toLowerCase().includes(brandLower)
      );
    }

    // Фильтр по цене
    if (filters.minPrice) {
      const minPrice = parseFloat(filters.minPrice);
      filtered = filtered.filter(product =>
        product.price >= minPrice
      );
    }

    if (filters.maxPrice) {
      const maxPrice = parseFloat(filters.maxPrice);
      filtered = filtered.filter(product =>
        product.price <= maxPrice
      );
    }

    return filtered;
  }, [allProducts, filters]);

  // Пагинация продуктов
  const paginatedProducts = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, pagination.currentPage, pagination.pageSize]);

  // Общее количество страниц
  const totalPages = useMemo(() => {
    return Math.ceil(filteredProducts.length / pagination.pageSize);
  }, [filteredProducts.length, pagination.pageSize]);

  // Сброс на первую страницу при изменении фильтров
  useEffect(() => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [filters]);

  // Обработчик изменения фильтров
  const handleFilterChange = (filterName, value) => {
    const newFilters = {
      ...filters,
      [filterName]: value
    };
    setFilters(newFilters);
    updateURLParams(newFilters, { ...pagination, currentPage: 1 });
  };

  // Обработчик изменения страницы
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
    updateURLParams(filters, { ...pagination, currentPage: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Обработчик изменения размера страницы
  const handlePageSizeChange = (newSize) => {
    const newPageSize = parseInt(newSize);
    setPagination({
      currentPage: 1,
      pageSize: newPageSize
    });
    updateURLParams(filters, {
      ...pagination,
      pageSize: newPageSize,
      currentPage: 1
    });
  };

  // Сброс фильтров
  const handleResetFilters = () => {
    const newFilters = {
      brand: '',
      minPrice: '',
      maxPrice: '',
      search: ''
    };
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    setSearchParams(new URLSearchParams());
  };

  // Компонент пагинации
  const Pagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Кнопка "Назад"
    if (pagination.currentPage > 1) {
      pages.push(
        <button
          key="prev"
          onClick={() => handlePageChange(pagination.currentPage - 1)}
          className="pagination-btn"
        >
          ← Назад
        </button>
      );
    }

    // Первая страница
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className="pagination-btn"
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(<span key="ellipsis1" className="pagination-ellipsis">...</span>);
      }
    }

    // Страницы
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`pagination-btn ${pagination.currentPage === i ? 'active' : ''}`}
        >
          {i}
        </button>
      );
    }

    // Последняя страница
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<span key="ellipsis2" className="pagination-ellipsis">...</span>);
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className="pagination-btn"
        >
          {totalPages}
        </button>
      );
    }

    // Кнопка "Вперед"
    if (pagination.currentPage < totalPages) {
      pages.push(
        <button
          key="next"
          onClick={() => handlePageChange(pagination.currentPage + 1)}
          className="pagination-btn"
        >
          Вперед →
        </button>
      );
    }

    return <div className="pagination">{pages}</div>;
  };

  // Показываем загрузку если категории еще не загружены
  if (allCategories.length === 0) {
    return (
      <div className="catalog-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Загрузка категорий...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="catalog-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Загрузка товаров...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="catalog-container">
        <div className="error-message">
          <h2>Ошибка</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Попробовать снова</button>
        </div>
      </div>
    );
  }

  return (
    <div className="catalog-container">
      <div className="catalog-header">
        <h1>
          {category ? category.name : 'Каталог товаров'}
        </h1>
        {category?.description && (
          <p className="category-description">{category.description}</p>
        )}
      </div>

      <div className="catalog-content">
        <aside className="filters-sidebar">
          <div className="filters-header">
            <h3>Фильтры</h3>
            <button
              onClick={handleResetFilters}
              className="reset-filters-btn"
            >
              Сбросить
            </button>
          </div>

          <div className="filter-group">
            <label htmlFor="search">Поиск</label>
            <input
              type="text"
              id="search"
              placeholder="Название товара..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Цена</label>
            <div className="price-inputs">
              <input
                type="number"
                placeholder="От"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              />
              <span>-</span>
              <input
                type="number"
                placeholder="До"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <label htmlFor="brand">Бренд</label>
            <input
              type="text"
              id="brand"
              placeholder="Название бренда..."
              value={filters.brand}
              onChange={(e) => handleFilterChange('brand', e.target.value)}
            />
          </div>

          {/* Селектор количества товаров на странице */}
          <div className="filter-group">
            <label htmlFor="pageSize">Товаров на странице</label>
            <select
              id="pageSize"
              value={pagination.pageSize}
              onChange={(e) => handlePageSizeChange(e.target.value)}
              className="page-size-select"
            >
              <option value="12">12</option>
              <option value="24">24</option>
              <option value="36">36</option>
              <option value="48">48</option>
            </select>
          </div>

          {/* Статистика по фильтрам */}
          <div className="filter-stats">
            <p>Найдено товаров: {filteredProducts.length}</p>
            {filters.search || filters.brand || filters.minPrice || filters.maxPrice ? (
              <p className="filtered-info">(применены фильтры)</p>
            ) : null}
          </div>
        </aside>

        <main className="products-main">
          <div className="products-info">
            <p>
              Показано {paginatedProducts.length} из {filteredProducts.length} товаров
              {totalPages > 1 && ` (Страница ${pagination.currentPage} из ${totalPages})`}
            </p>
          </div>

          {paginatedProducts.length === 0 ? (
            <div className="no-products">
              <h3>Товары не найдены</h3>
              <p>Попробуйте изменить параметры фильтрации</p>
              {(filters.search || filters.brand || filters.minPrice || filters.maxPrice) && (
                <button
                  onClick={handleResetFilters}
                  className="reset-filters-inline-btn"
                >
                  Сбросить фильтры
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="products-grid">
                {paginatedProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Пагинация */}
              <Pagination />
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default CatalogPage;