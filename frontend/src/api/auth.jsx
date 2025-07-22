import apiClient from "./client";

export const authService ={
    login: async (username,password) =>{
        const response = await apiClient.post('/api/token/',{username,password});
        return response.data;
    },

    varifyToken : async (token) =>{
        const response = await apiClient.post('/api/token/verify/',{token});
        return response.data;
    },

    logout : ()=>{
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        delete apiClient.defaults.headers.common['Authorization'];
    },
};