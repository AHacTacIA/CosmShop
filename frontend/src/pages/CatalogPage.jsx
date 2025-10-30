// pages/CatalogPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { productService } from '../api/products';
import { categoryService } from '../api/categories';
import ProductCard from '../components/ProductCard'; // Импортируем внешний компонент
import './CatalogPage.css';

const CatalogPage = () => {
  const { categorySlug } = useParams();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    brand: searchParams.get('brand') || '',
    minPrice: searchParams.get('min_price') || '',
    maxPrice: searchParams.get('max_price') || '',
    search: searchParams.get('search') || ''
  });

  // Функция для получения категории по slug
  const getCategoryBySlug = async (slug) => {
    try {
      const response = await categoryService.getAllCategories();
      const categories = response.data;
      return categories.find(cat => cat.slug === slug) || null;
    } catch (err) {
      console.error('Error fetching categories:', err);
      return null;
    }
  };

  // Загрузка данных при изменении категории или фильтров
  useEffect(() => {
    const loadCatalogData = async () => {
      try {
        setLoading(true);

        let categoryData = null;
        let productsData = [];

        if (categorySlug) {
          categoryData = await getCategoryBySlug(categorySlug);

          if (categoryData) {
            setCategory(categoryData);

            const productsResponse = await productService.getProducts({
              category: categoryData.id,
              brand: filters.brand,
              min_price: filters.minPrice,
              max_price: filters.maxPrice,
              search: filters.search
            });
            productsData = productsResponse.data;
          } else {
            setError(`Категория "${categorySlug}" не найдена`);
            setLoading(false);
            return;
          }
        } else {
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
  }, [categorySlug, filters]);

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