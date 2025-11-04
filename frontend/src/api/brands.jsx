// api/brands.jsx
import apiClient from "./client";

export const brandService = {
    // Получение списка брендов с фильтрацией
    getAllBrands:(params={})=>{
        return apiClient.get('/brands/',{
            params:{
                country: params.country,
                name: params.name,
                search: params.search,
            }
        });
    },

   // Получение конкретного бренда по ID
    getBrandById: (id) => {
    return apiClient.get(`/brands/${id}/`);
  },

    // Поиск брендов
  searchBrands: (query) => {
    return apiClient.get('/brands/search/', {
      params: { search: query }
    });
  },

    // Получение продуктов бренда
    getBrandProducts: (brandId, params = {}) => {
    return apiClient.get('/products/', {
      params: {
        brand: brandId,
        ...params
      }
    });
  },
}