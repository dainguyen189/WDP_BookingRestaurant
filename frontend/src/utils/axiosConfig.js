import axios from 'axios';

// Cấu hình axios
const axiosInstance = axios.create({
    baseURL: 'http://localhost:8080/api',
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
