// pages/CatalogPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { productService } from '../api/products';
import { categoryService } from '../api/categories';
import ProductCard from '../components/ProductCard';
import './CatalogPage.css';

const CatalogPage = () => {
  const { categorySlug } = useParams();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState(null);
  const [allCategories, setAllCategories] = useState([]); // Все категории для поиска
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
        findChildren(child.id); // Рекурсивно ищем детей детей
      });
    };

    findChildren(categoryId);
    return childCategories;
  };

  // Функция для получения категории по slug
  const getCategoryBySlug = (slug) => {
    return allCategories.find(cat => cat.slug === slug) || null;
  };

  // Загрузка продуктов для списка категорий
  const loadProductsForCategories = async (categoryIds) => {
    const allProducts = [];

    // Делаем запросы для каждой категории отдельно
    for (const categoryId of categoryIds) {
      try {
        const productsResponse = await productService.getProducts({
          category: categoryId,
          brand: filters.brand,
          min_price: filters.minPrice,
          max_price: filters.maxPrice,
          search: filters.search
        });
        allProducts.push(...productsResponse.data);
      } catch (err) {
        console.error(`Error loading products for category ${categoryId}:`, err);
      }
    }

    // Удаляем дубликаты по ID
    const uniqueProducts = allProducts.filter((product, index, self) =>
      index === self.findIndex(p => p.id === product.id)
    );

    return uniqueProducts;
  };

  // Загрузка данных при изменении категории или фильтров
  useEffect(() => {
    const loadCatalogData = async () => {
      if (allCategories.length === 0) return; // Ждем загрузки категорий

      try {
        setLoading(true);

        let categoryData = null;
        let productsData = [];

        if (categorySlug) {
          categoryData = getCategoryBySlug(categorySlug);

          if (categoryData) {
            setCategory(categoryData);

            // Получаем все подкатегории (включая текущую)
            const allCategoryIds = [categoryData.id, ...getAllChildCategories(categoryData.id)];
            console.log('Loading products for categories:', allCategoryIds);

            productsData = await loadProductsForCategories(allCategoryIds);
          } else {
            setError(`Категория "${categorySlug}" не найдена`);
            setLoading(false);
            return;
          }
        } else {
          // Загружаем все товары (если нет конкретной категории)
          const productsResponse = await productService.getProducts({
            brand: filters.brand,
            min_price: filters.minPrice,
            max_price: filters.maxPrice,
            search: filters.search
          });
          productsData = productsResponse.data;
        }

        setProducts(productsData);
        setLoading(false);

      } catch (err) {
        console.error('Error loading catalog:', err);
        setError('Ошибка загрузки каталога');
        setLoading(false);
      }
    };

    loadCatalogData();
  }, [categorySlug, filters, allCategories]); // Добавили allCategories в зависимости

  // Обработчик изменения фильтров
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  // Сброс фильтров
  const handleResetFilters = () => {
    setFilters({
      brand: '',
      minPrice: '',
      maxPrice: '',
      search: ''
    });
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
        {category && (
          <p className="category-info">
          </p>
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
        </aside>

        <main className="products-main">
          <div className="products-info">
            <p>Найдено товаров: {products.length}</p>
          </div>

          {products.length === 0 ? (
            <div className="no-products">
              <h3>Товары не найдены</h3>
              <p>Попробуйте изменить параметры фильтрации</p>
            </div>
          ) : (
            <div className="products-grid">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CatalogPage;