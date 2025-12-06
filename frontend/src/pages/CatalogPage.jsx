// pages/CatalogPage.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useLocation } from 'react-router-dom';
import { productService } from '../api/products';
import { categoryService } from '../api/categories';
import ProductCard from '../components/ProductCard';
import './CatalogPage.css';

const CatalogPage = () => {
  const { categorySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  // Используем ref для отслеживания первого рендера
  const isInitialMount = useRef(true);

  const [allProducts, setAllProducts] = useState([]);
  const [category, setCategory] = useState(null);
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // Пагинация
  const [pagination, setPagination] = useState({
    currentPage: parseInt(searchParams.get('page')) || 1,
    pageSize: parseInt(searchParams.get('page_size')) || 12
  });

  // Активные фильтры
  const [activeFilters, setActiveFilters] = useState({
    brand: searchParams.get('brand') || '',
    minPrice: searchParams.get('min_price') || '',
    maxPrice: searchParams.get('max_price') || '',
    search: searchParams.get('search') || ''
  });

  // Временные фильтры
  const [tempFilters, setTempFilters] = useState({
    brand: searchParams.get('brand') || '',
    minPrice: searchParams.get('min_price') || '',
    maxPrice: searchParams.get('max_price') || '',
    search: searchParams.get('search') || ''
  });

  // Определяем, находимся ли мы на странице /products
  const isProductsPage = location.pathname === '/products';

  // 1. Загрузка всех категорий (один раз при монтировании)
  useEffect(() => {
    const loadAllCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const response = await categoryService.getAllCategories();
        setAllCategories(response.data);
      } catch (err) {
        console.error('Error loading categories:', err);
        setError('Ошибка загрузки категорий');
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadAllCategories();
  }, []); // Пустой массив зависимостей - выполняется один раз

  // 2. Получение категории по slug
  const getCategoryBySlug = useCallback((slug) => {
    return allCategories.find(cat => cat.slug === slug) || null;
  }, [allCategories]);

  // 3. Рекурсивная функция для получения всех дочерних категорий
  const getAllChildCategories = useCallback((categoryId) => {
    if (!allCategories.length) return [];

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
  }, [allCategories]);

  // 4. Получение всех ID категорий для запроса
  const getAllCategoryIdsForRequest = useCallback((currentCategorySlug) => {
    if (!currentCategorySlug || !allCategories.length) return null;

    const categoryData = getCategoryBySlug(currentCategorySlug);
    if (!categoryData) return null;

    return [categoryData.id, ...getAllChildCategories(categoryData.id)];
  }, [allCategories, getCategoryBySlug, getAllChildCategories]);

  // 5. Загрузка продуктов для категории
  const loadProductsForCategory = useCallback(async (categoryId, filters) => {
    try {
      const apiFilters = { ...filters, category: categoryId };

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
  }, []);

  // 6. Основная функция загрузки продуктов
  const loadProducts = useCallback(async () => {
    // Если категории еще загружаются, ждем
    if (isLoadingCategories) return;

    try {
      setLoading(true);
      setError(null);

      let productsData = [];

      if (isProductsPage) {
        // Страница /products - загружаем все товары
        const apiFilters = { ...activeFilters };
        Object.keys(apiFilters).forEach(key => {
          if (!apiFilters[key]) {
            delete apiFilters[key];
          }
        });

        const response = await productService.getFilteredProducts(apiFilters);
        productsData = response.data;

      } else if (categorySlug) {
        // Страница категории
        const categoryData = getCategoryBySlug(categorySlug);
        if (categoryData) {
          setCategory(categoryData);
          const allCategoryIds = getAllCategoryIdsForRequest(categorySlug);

          if (allCategoryIds && allCategoryIds.length > 0) {
            // Загружаем продукты для каждой категории параллельно
            const productPromises = allCategoryIds.map(categoryId =>
              loadProductsForCategory(categoryId, activeFilters)
            );

            const productsArrays = await Promise.all(productPromises);
            productsData = productsArrays.flat();
          } else {
            // Если нет ID категорий
            setAllProducts([]);
            setLoading(false);
            return;
          }
        } else {
          // Категория не найдена
          setError(`Категория "${categorySlug}" не найдена`);
          setAllProducts([]);
          setLoading(false);
          return;
        }
      } else {
        // Не должно случиться
        setAllProducts([]);
        setLoading(false);
        return;
      }

      // Удаляем дубликаты по ID
      const uniqueProducts = productsData.filter((product, index, self) =>
        index === self.findIndex(p => p.id === product.id)
      );

      setAllProducts(uniqueProducts);

    } catch (err) {
      console.error('Error loading products:', err);
      setError(err.message || 'Ошибка загрузки каталога');
      setAllProducts([]);
    } finally {
      setLoading(false);
    }
  }, [
    isLoadingCategories,
    isProductsPage,
    categorySlug,
    activeFilters,
    allCategories,
    getCategoryBySlug,
    getAllCategoryIdsForRequest,
    loadProductsForCategory
  ]);

  // 7. Эффект для загрузки продуктов при изменении зависимостей
  useEffect(() => {
    // Пропускаем первый рендер в StrictMode
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    loadProducts();
  }, [
    loadProducts,
    // Убираем все остальные зависимости, так как они уже есть в loadProducts
  ]);

  // 8. Инициализация при первом рендере
  useEffect(() => {
    if (isInitialMount.current) {
      loadProducts();
    }
  }, []); // Пустой массив - только при монтировании

  // 9. Очистка фильтров при смене категории
  useEffect(() => {
    if (categorySlug && allCategories.length > 0 && !isProductsPage) {
      const currentCategory = getCategoryBySlug(categorySlug);
      if (currentCategory && (!category || currentCategory.id !== category.id)) {
        // Сбрасываем фильтры только для новой категории
        const resetFilters = {
          brand: '',
          minPrice: '',
          maxPrice: '',
          search: ''
        };

        setTempFilters(resetFilters);
        setActiveFilters(resetFilters);
        setPagination(prev => ({ ...prev, currentPage: 1 }));

        // Очищаем URL от параметров фильтрации
        const params = new URLSearchParams();
        setSearchParams(params);
      }
    }
  }, [categorySlug, allCategories, isProductsPage]);

  // 10. Инициализация фильтров из URL
  useEffect(() => {
    const initialFilters = {
      brand: searchParams.get('brand') || '',
      minPrice: searchParams.get('min_price') || '',
      maxPrice: searchParams.get('max_price') || '',
      search: searchParams.get('search') || ''
    };

    setTempFilters(initialFilters);
    setActiveFilters(initialFilters);
  }, []); // Только при монтировании

  // 11. Пагинация
  const paginatedProducts = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return allProducts.slice(startIndex, endIndex);
  }, [allProducts, pagination.currentPage, pagination.pageSize]);

  const totalPages = useMemo(() => {
    return Math.ceil(allProducts.length / pagination.pageSize);
  }, [allProducts.length, pagination.pageSize]);

  // 12. Сброс на первую страницу при изменении активных фильтров
  useEffect(() => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [activeFilters]);

  // 13. Обработчики
  const handleTempFilterChange = (filterName, value) => {
    setTempFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleApplyFilters = () => {
    setActiveFilters(tempFilters);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    updateURLParams(tempFilters, { ...pagination, currentPage: 1 });
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
    updateURLParams(activeFilters, { ...pagination, currentPage: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  // 14. Обновление URL
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

  // 15. Проверка изменений фильтров
  const hasFilterChanges = useMemo(() => {
    return (
      tempFilters.brand !== activeFilters.brand ||
      tempFilters.minPrice !== activeFilters.minPrice ||
      tempFilters.maxPrice !== activeFilters.maxPrice ||
      tempFilters.search !== activeFilters.search
    );
  }, [tempFilters, activeFilters]);

  // 16. Заголовок страницы
  const getPageTitle = () => {
    if (isProductsPage) {
      return 'Все товары';
    }
    return category ? category.name : 'Каталог товаров';
  };

  const getPageDescription = () => {
    if (isProductsPage) {
      return 'Полный каталог косметики и уходовых средств от лучших брендов';
    }
    return category?.description || '';
  };

  // 17. Компонент пагинации
  const Pagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

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

  // 18. Рендеринг
  if (isLoadingCategories) {
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
          <button onClick={() => loadProducts()}>Попробовать снова</button>
        </div>
      </div>
    );
  }

  return (
    <div className="catalog-container">
      <div className="catalog-breadcrumbs">
        <a href="/">Главная</a>
        <span> / </span>
        {isProductsPage ? (
          <span>Все товары</span>
        ) : (
          <>
            <a href="/products">Все товары</a>
            <span> / </span>
            <span>{category?.name}</span>
          </>
        )}
      </div>

      <div className="catalog-header">
        <h1>{getPageTitle()}</h1>
        {getPageDescription() && (
          <p className="category-description">{getPageDescription()}</p>
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

          <div className="filter-actions">
            <button
              onClick={handleApplyFilters}
              className={`apply-filters-btn ${hasFilterChanges ? 'has-changes' : ''}`}
              disabled={!hasFilterChanges}
            >
              Показать
            </button>
          </div>

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

              <Pagination />
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default CatalogPage;