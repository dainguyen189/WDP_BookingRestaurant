const express = require('express');
const router = express.Router();
const chefOrderController = require('../controller/chefOrderController');

// Routes cho Chef
router.get('/orders', chefOrderController.getOrdersForChef);
router.put('/orders/:id/status', chefOrderController.updateOrderStatusByChef);
router.put('/order-items/:itemId/status', chefOrderController.updateOrderItemStatusByChef);
router.get('/dashboard/stats', chefOrderController.getChefDashboardStats);

module.exports = router;
