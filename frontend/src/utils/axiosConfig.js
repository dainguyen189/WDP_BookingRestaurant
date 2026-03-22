import axios from 'axios';
import { API_URL } from '../config/api';

// Cấu hình axios
const axiosInstance = axios.create({
    baseURL: API_URL,
    withCredentials: true // Quan trọng để gửi cookies
});

// Thêm interceptor cho mỗi request
axiosInstance.interceptors.request.use(
    (config) => {
        // Lấy token từ localStorage
        const token = localStorage.getItem('token');

        // Nếu có token, thêm vào header
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default axiosInstance;
