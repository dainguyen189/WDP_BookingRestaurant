const express = require('express');
const router = express.Router();
const zaloPayController = require('../controller/invoiceController');

router.get('/banks', zaloPayController.getListBanks);
// Tạo đơn hàng mới trên ZaloPay
router.post('/create-order', zaloPayController.createZaloPayOrder);

// ZaloPay Server gọi về khi thanh toán thành công
router.post('/callback', zaloPayController.handleZaloPayCallback);

// Frontend gọi để kiểm tra trạng thái
router.post('/status', zaloPayController.checkZaloPayOrderStatus);

// Test endpoint để kiểm tra orders
router.get('/test-orders', zaloPayController.testOrders);

// Test endpoint để kiểm tra MAC signature
router.get('/test-mac', zaloPayController.testMacSignature);

module.exports = router;