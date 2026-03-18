    const jwt = require('jsonwebtoken');
    const User = require('../models/user'); // Sử dụng User model hiện tại

    // Middleware xác thực token
    const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Không có token, truy cập bị từ chối'
        });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ'
        });
    }
    };

    // Middleware kiểm tra role staff
    const staffMiddleware = async (req, res, next) => {
    try {
        if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Người dùng chưa được xác thực'
        });
        }

        // Kiểm tra role phải là staff
        if (req.user.role !== 'staff') {
        return res.status(403).json({
            success: false,
            message: 'Chỉ nhân viên mới có quyền truy cập'
        });
        }

        // Kiểm tra user có tồn tại không
        const user = await User.findById(req.user.id);
        if (!user) {
        return res.status(403).json({
            success: false,
            message: 'Tài khoản không tồn tại'
        });
        }

        // Kiểm tra role trong database
        if (user.role !== 'staff') {
        return res.status(403).json({
            success: false,
            message: 'Tài khoản không phải là staff'
        });
        }

        req.staff = user;
        next();
    } catch (error) {
        console.error('Staff middleware error:', error);
        return res.status(500).json({
        success: false,
        message: 'Lỗi server nội bộ'
        });
    }
    };

    // Middleware kiểm tra quyền admin (cho các chức năng quản lý)
    const adminMiddleware = async (req, res, next) => {
    try {
        if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Người dùng chưa được xác thực'
        });
        }

        // Kiểm tra role phải là admin
        if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Chỉ admin mới có quyền truy cập'
        });
        }

        next();
    } catch (error) {
        console.error('Admin middleware error:', error);
        return res.status(500).json({
        success: false,
        message: 'Lỗi server nội bộ'
        });
    }
    };

    // Middleware kiểm tra multiple roles
    const roleMiddleware = (allowedRoles = []) => {
    return async (req, res, next) => {
        try {
        if (!req.user) {
            return res.status(401).json({
            success: false,
            message: 'Người dùng chưa được xác thực'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
            success: false,
            message: 'Không có quyền truy cập'
            });
        }

        next();
        } catch (error) {
        console.error('Role middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server nội bộ'
        });
        }
    };
    };

    module.exports = {
    authMiddleware,
    staffMiddleware,
    adminMiddleware,
    roleMiddleware
    };