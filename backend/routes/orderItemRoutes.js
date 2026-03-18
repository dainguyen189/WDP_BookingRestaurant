const express = require('express');
const router = express.Router();
const orderItemController = require('../controller/orderItemController');
const orderController = require('../controller/orderController');


router.post('/', orderItemController.createOrderItem);
router.get('/order/:orderId', orderItemController.getItemsByOrder);
router.get('/chef', orderItemController.getSortedItems);
router.put('/:id/status', orderItemController.updateOrderItemStatus);
router.post('/:sessionId/items', orderController.addItemToOrder);
router.put('/', orderController.updateManyItems);
router.delete('/:id', orderItemController.deleteById);


router.get('/bestsellers', orderItemController.getBestSellerItems);
module.exports = router;
