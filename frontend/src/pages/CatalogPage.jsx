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
  const [allProducts, setAllProducts] = useState([]); // Все продукты после серверной фильтрации
  const [category, setCategory] = useState(null);
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Пагинация (только на фронтенде)
  const [pagination, setPagination] = useState({
    currentPage: parseInt(searchParams.get('page')) || 1,
    pageSize: parseInt(searchParams.get('page_size')) || 12
  });

  // Активные фильтры (те, что применены и отображаются в результатах)
  const [activeFilters, setActiveFilters] = useState({
    brand: searchParams.get('brand') || '',
    minPrice: searchParams.get('min_price') || '',
    maxPrice: searchParams.get('max_price') || '',
    search: searchParams.get('search') || ''
  });

  // Временные фильтры (те, что вводятся в поля, но еще не применены)
  const [tempFilters, setTempFilters] = useState({
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

  // Функция для получения категории по slug
  const getCategoryBySlug = (slug) => {
    return allCategories.find(cat => cat.slug === slug) || null;
  };

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

  // Получение всех ID категорий для запроса (включая дочерние)
  const getAllCategoryIdsForRequest = (currentCategorySlug) => {
    if (!currentCategorySlug) return null;

    const categoryData = getCategoryBySlug(currentCategorySlug);
    if (!categoryData) return null;

    return [categoryData.id, ...getAllChildCategories(categoryData.id)];
  };

  // Загрузка продуктов для одной категории
  const loadProductsForCategory = async (categoryId, filters) => {
    try {
      const apiFilters = {
        ...filters,
        category: categoryId
      };

      // Очищаем пустые параметры
      Object.keys(apiFilters).forEach(key => {
        if (!apiFilters[key]) {
          delete apiFilters[key];
        }
      });

      const response = await productService.getFilteredProducts(apiFilters);
      return response.data;
    } catch (err) {
      console.error(`Error loading products for category ${categoryId}:`, err);
      return [];
    }
  };

  // Загрузка продуктов с серверной фильтрацией для всех категорий
  const loadFilteredProducts = async (currentFilters, currentCategorySlug) => {
    try {
      setLoading(true);

      let productsData = [];

      if (currentCategorySlug) {
        const categoryData = getCategoryBySlug(currentCategorySlug);
        if (categoryData) {
          setCategory(categoryData);
          const allCategoryIds = getAllCategoryIdsForRequest(currentCategorySlug);

          if (allCategoryIds && allCategoryIds.length > 0) {
            // Загружаем продукты для каждой категории отдельно
            const productPromises = allCategoryIds.map(categoryId =>
              loadProductsForCategory(categoryId, currentFilters)
            );

            const productsArrays = await Promise.all(productPromises);

            // Объединяем все продукты
            productsData = productsArrays.flat();
          }
        } else {
          setError(`Категория "${currentCategorySlug}" не найдена`);
          return [];
        }
      } else {
        // Загружаем все товары без фильтра по категории
        const apiFilters = { ...currentFilters };

        // Очищаем пустые параметры
        Object.keys(apiFilters).forEach(key => {
          if (!apiFilters[key]) {
            delete apiFilters[key];
          }
        });

        const response = await productService.getFilteredProducts(apiFilters);
        productsData = response.data;
      }

      // Удаляем дубликаты по ID
      const uniqueProducts = productsData.filter((product, index, self) =>
        index === self.findIndex(p => p.id === product.id)
      );

      return uniqueProducts;

    } catch (err) {
      console.error('Error loading filtered products:', err);
      throw err;
    } finally {
      setLoading(false);
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

  // Очистка фильтров при смене категории
  const resetFiltersForNewCategory = () => {
    const resetFilters = {
      brand: '',
      minPrice: '',
      maxPrice: '',
      search: ''
    };

    setTempFilters(resetFilters);
    setActiveFilters(resetFilters);
    setPagination(prev => ({ ...prev, currentPage: 1 }));

    // Очищаем URL от параметров фильтрации, но сохраняем пагинацию если нужно
    const params = new URLSearchParams();
    if (pagination.pageSize !== 12) {
      params.set('page_size', pagination.pageSize.toString());
    }
    setSearchParams(params);
  };

  // Загрузка данных при изменении категории или активных фильтров
  useEffect(() => {
    const loadCatalogData = async () => {
      if (allCategories.length === 0) return;

      try {
        const productsData = await loadFilteredProducts(activeFilters, categorySlug);
        setAllProducts(productsData);
      } catch (err) {
        console.error('Error loading catalog:', err);
        setError('Ошибка загрузки каталога');
      }
    };

    loadCatalogData();
  }, [categorySlug, allCategories, activeFilters]); // Добавляем activeFilters в зависимости

  // Очистка фильтров при смене категории
  useEffect(() => {
    if (allCategories.length > 0 && categorySlug) {
      // Проверяем, действительно ли сменилась категория
      const currentCategory = getCategoryBySlug(categorySlug);
      if (currentCategory && (!category || currentCategory.id !== category.id)) {
        resetFiltersForNewCategory();
      }
    }
  }, [categorySlug, allCategories]); // Срабатывает при изменении categorySlug

  // Инициализация временных фильтров из URL при первой загрузке
  useEffect(() => {
    const initialFilters = {
      brand: searchParams.get('brand') || '',
      minPrice: searchParams.get('min_price') || '',
      maxPrice: searchParams.get('max_price') || '',
      search: searchParams.get('search') || ''
    };

    setTempFilters(initialFilters);
    setActiveFilters(initialFilters);
  }, []);

  // Пагинация продуктов на фронтенде
  const paginatedProducts = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return allProducts.slice(startIndex, endIndex);
  }, [allProducts, pagination.currentPage, pagination.pageSize]);

  // Общее количество страниц
  const totalPages = useMemo(() => {
    return Math.ceil(allProducts.length / pagination.pageSize);
  }, [allProducts.length, pagination.pageSize]);

  // Сброс на первую страницу при изменении активных фильтров
  useEffect(() => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [activeFilters]);

  // Обработчик изменения временных фильтров
  const handleTempFilterChange = (filterName, value) => {
    setTempFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  // Применение фильтров (нажатие кнопки "Показать")
  const handleApplyFilters = () => {
    setActiveFilters(tempFilters);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    updateURLParams(tempFilters, { ...pagination, currentPage: 1 });
  };

  // Обработчик изменения страницы
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
    updateURLParams(activeFilters, { ...pagination, currentPage: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Обработчик изменения размера страницы
  const handlePageSizeChange = (newSize) => {
    const newPageSize = parseInt(newSize);
    setPagination({
      currentPage: 1,
      pageSize: newPageSize
    });
    updateURLParams(activeFilters, {
      ...pagination,
      pageSize: newPageSize,
      currentPage: 1
    });
  };

  // Сброс фильтров
  const handleResetFilters = () => {
    const resetFilters = {
      brand: '',
      minPrice: '',
      maxPrice: '',
      search: ''
    };
    setTempFilters(resetFilters);
    setActiveFilters(resetFilters);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    setSearchParams(new URLSearchParams());
  };

  // Проверка, есть ли изменения в фильтрах
  const hasFilterChanges = useMemo(() => {
    return (
      tempFilters.brand !== activeFilters.brand ||
      tempFilters.minPrice !== activeFilters.minPrice ||
      tempFilters.maxPrice !== activeFilters.maxPrice ||
      tempFilters.search !== activeFilters.search
    );
  }, [tempFilters, activeFilters]);

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
              value={tempFilters.search}
              onChange={(e) => handleTempFilterChange('search', e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleApplyFilters();
                }
              }}
            />
          </div>

          <div className="filter-group">
            <label>Цена, BYN</label>
            <div className="price-inputs">
              <input
                type="number"
                placeholder="От"
                value={tempFilters.minPrice}
                onChange={(e) => handleTempFilterChange('minPrice', e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleApplyFilters();
                  }
                }}
              />
              <span>-</span>
              <input
                type="number"
                placeholder="До"
                value={tempFilters.maxPrice}
                onChange={(e) => handleTempFilterChange('maxPrice', e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleApplyFilters();
                  }
                }}
              />
            </div>
          </div>

          <div className="filter-group">
            <label htmlFor="brand">Бренд</label>
            <input
              type="text"
              id="brand"
              placeholder="Название бренда..."
              value={tempFilters.brand}
              onChange={(e) => handleTempFilterChange('brand', e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleApplyFilters();
                }
              }}
            />
          </div>

          {/* Кнопка применения фильтров */}
          <div className="filter-actions">
            <button
              onClick={handleApplyFilters}
              className={`apply-filters-btn ${hasFilterChanges ? 'has-changes' : ''}`}
              disabled={!hasFilterChanges}
            >
              Показать
            </button>
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
            <p>Найдено товаров: {allProducts.length}</p>
          </div>
        </aside>

        <main className="products-main">
          <div className="products-info">
            <p>
              Показано {paginatedProducts.length} из {allProducts.length} товаров
              {totalPages > 1 && ` (Страница ${pagination.currentPage} из ${totalPages})`}
            </p>
          </div>

          {paginatedProducts.length === 0 ? (
            <div className="no-products">
              <h3>Товары не найдены</h3>
              <p>Попробуйте изменить параметры фильтрации</p>
              {(activeFilters.search || activeFilters.brand || activeFilters.minPrice || activeFilters.maxPrice) && (
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