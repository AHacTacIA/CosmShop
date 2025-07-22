import apiClient from "./client";

export const categoryService ={
    //Получение списка категорий
    getAllCategories:(params = {}) =>{
        return apiClient.get('/categories/', {params});
    },

    // Получение конкретной категории по ID
  getCategory: (id) => {
    return apiClient.get(`/categories/${id}/`);
  },

  // Получение дочерних категорий
  getChildCategories: (parentId) => {
    return apiClient.get(`/categories/${parentId}/children/`);
  },

    // Поиск категорий
  searchCategories: (query) => {
    return apiClient.get('/categories/search/', {
      params: { search: query }
    });
  },

  // Получение продуктов в категории (через products endpoint с фильтром)
  getProductsInCategory: (categoryId, params = {}) => {
    return apiClient.get('/products/', {
      params: {
        category: categoryId,
        ...params
      }
    });
  },

}