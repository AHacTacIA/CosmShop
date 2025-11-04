// pages/BrandPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { productService } from '../api/products';
import { brandService } from '../api/brands';
import ProductCard from '../components/ProductCard';
import './BrandPage.css';

const BrandPage = () => {
  const { brandSlug } = useParams();
  const [brand, setBrand] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    minPrice: '',
    maxPrice: ''
  });

  // Загрузка данных бренда и товаров
  useEffect(() => {
    const loadBrandData = async () => {
      try {
        setLoading(true);
        console.log('Loading brand with slug:', brandSlug);

        // Сначала получаем все бренды чтобы найти по slug
        const brandsResponse = await brandService.getAllBrands();
        console.log('All brands:', brandsResponse.data);

        const brandData = brandsResponse.data.find(b => b.slug === brandSlug);
        console.log('Found brand:', brandData);

        if (!brandData) {
          throw new Error('Бренд не найден');
        }

        setBrand(brandData);

        // Загружаем товары бренда по имени бренда
        console.log('Loading products for brand:', brandData.name);
        const productsResponse = await productService.getProducts({
          brand: brandData.name
        });
        console.log('Products response:', productsResponse.data);
        setProducts(productsResponse.data);

      } catch (err) {
        console.error('Error loading brand data:', err);
        setError('Бренд не найден');
      } finally {
        setLoading(false);
      }
    };

    loadBrandData();
  }, [brandSlug]);

  // Фильтрация товаров
  const filteredProducts = products.filter(product => {
    // Фильтр по поиску
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        product.name.toLowerCase().includes(searchLower) ||
        product.sh_descr?.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Фильтр по минимальной цене
    if (filters.minPrice) {
      const minPrice = parseFloat(filters.minPrice);
      const productPrice = product.variants?.[0]?.price;
      if (productPrice && parseFloat(productPrice) < minPrice) return false;
    }

    // Фильтр по максимальной цене
    if (filters.maxPrice) {
      const maxPrice = parseFloat(filters.maxPrice);
      const productPrice = product.variants?.[0]?.price;
      if (productPrice && parseFloat(productPrice) > maxPrice) return false;
    }

    return true;
  });

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      minPrice: '',
      maxPrice: ''
    });
  };

  if (loading) {
    return (
      <div className="brand-page-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="brand-page-container">
        <div className="error-message">
          <h2>Ошибка</h2>
          <p>{error || 'Бренд не найден'}</p>
          <button onClick={() => window.history.back()}>Вернуться назад</button>
        </div>
      </div>
    );
  }

  return (
    <div className="brand-page-container">
      <div className="breadcrumbs">
        <a href="/">Главная</a>
        <span className="breadcrumb-separator"> / </span>
        <span className="current">Бренд: {brand.name}</span>
      </div>

      <div className="brand-header">
        <div className="brand-info">
          <h1 className="brand-title">{brand.name}</h1>
          {brand.country && (
            <p className="brand-country">Страна: {brand.country}</p>
          )}
          <p className="products-count">
            {filteredProducts.length} товар{filteredProducts.length === 1 ? '' : filteredProducts.length >= 2 && filteredProducts.length <= 4 ? 'а' : 'ов'}
          </p>
        </div>
      </div>

      <div className="brand-content">
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
            <label>Цена, BYN</label>
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

          <div className="filter-stats">
            <p>Найдено товаров: {filteredProducts.length}</p>
            {(filters.search || filters.minPrice || filters.maxPrice) && (
              <p className="filtered-info">(применены фильтры)</p>
            )}
          </div>
        </aside>

        <main className="products-main">
          {filteredProducts.length === 0 ? (
            <div className="no-products">
              <h3>Товары не найдены</h3>
              <p>Попробуйте изменить параметры фильтрации</p>
              {(filters.search || filters.minPrice || filters.maxPrice) && (
                <button
                  onClick={handleResetFilters}
                  className="reset-filters-inline-btn"
                >
                  Сбросить фильтры
                </button>
              )}
            </div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export {BrandPage};