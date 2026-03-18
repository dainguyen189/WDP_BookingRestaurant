// // src/routes/AdminRoutes.js (ví dụ)
// import React from 'react';

const express = require('express');
const router = express.Router();


const menuItemController = require('../controller/menuItemController');
console.log('menuItemController:', menuItemController);

const menuCategoryController = require('../controller/menuCategoryController');
const userController = require('../controller/userController');

const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// Bảo vệ route: phải login + phải là admin mới được truy cập
router.use(authMiddleware);
router.use(adminMiddleware);

// --- Menu Item Routes ---
router.get('/menu', menuItemController.getMenuItems);
router.post('/menu', menuItemController.createMenuItem);
router.put('/menu/:id', menuItemController.updateMenuItem);
router.delete('/menu/:id', menuItemController.deleteMenuItem);

// --- Menu Category Routes ---
router.post('/categories', menuCategoryController.createCategory);
router.get('/categories', menuCategoryController.getCategories);
router.put('/categories/:id', menuCategoryController.updateCategory);
router.delete('/categories/:id', menuCategoryController.deleteCategory);

// --- User Routes ---
router.get('/users', userController.getUsers);
router.put('/users/:id', userController.updateUserRole);
router.delete('/users/:id', userController.deleteUser);


// --- Table Routes --- (ADD THESE)
router.get('/tables', tableController.getTables);
router.post('/tables', tableController.createTable);
router.put('/tables/:id', tableController.updateTable);
router.delete('/tables/:id', tableController.deleteTable);

// --- Dining Session Routes --- (ADD THESE TOO)
router.get('/dining-sessions/table/:tableId', tableController.getActiveSession);
router.post('/dining-sessions', tableController.createSession);

module.exports = router;
