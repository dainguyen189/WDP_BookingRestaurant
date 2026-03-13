import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

import './AdminLayout.css';
import AdminHeader from '../Header/AdminHeader';

const AdminLayout = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Kiểm tra người dùng đã đăng nhập với quyền admin chưa
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const token = localStorage.getItem('token');

        if (!token || user.role !== 'admin') {
            // Nếu không có token hoặc không phải admin, chuyển hướng đến trang login
            navigate('/login');
        }
    }, [navigate]);

    return (
        <div className="admin-layout">
            <AdminHeader />
            <div className="admin-content">
                <Outlet />
            </div>
        </div>
    );
};

export default AdminLayout;