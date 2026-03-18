const express = require('express');
const router = express.Router();
const invoiceController = require('../controller/invoiceController');

router.get('/by-order/:orderId', invoiceController.getInvoiceByOrderId);
router.get('/:id', invoiceController.getInvoiceDetails);
router.get('/:id/print', invoiceController.printInvoice);

module.exports = router;
