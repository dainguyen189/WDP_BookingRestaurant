// routes/payosRoutes.js
const express = require('express');
const { PayOS } = require('@payos/node');

const router = express.Router();

// Lazy initialization of PayOS client - only create if environment variables are present
let payos = null;

function getPayOSClient() {
    if (payos) {
        return payos;
    }

    // Check if PayOS environment variables are configured
    if (!process.env.PAYOS_CLIENT_ID || !process.env.PAYOS_API_KEY || !process.env.PAYOS_CHECKSUM_KEY) {
        return null;
    }

    try {
        payos = new PayOS({
            clientId: process.env.PAYOS_CLIENT_ID,
            apiKey: process.env.PAYOS_API_KEY,
            checksumKey: process.env.PAYOS_CHECKSUM_KEY,
            // sandbox: true, nếu muốn thử nghiệm
        });
        return payos;
    } catch (error) {
        console.error('Failed to initialize PayOS client:', error);
        return null;
    }
}

// Tạo đơn thanh toán
router.post('/create-order', async (req, res) => {
    try {
        // Check if PayOS is configured
        const payosClient = getPayOSClient();
        if (!payosClient) {
            return res.status(503).json({ 
                error: 'PayOS chưa được cấu hình. Vui lòng cấu hình PAYOS_CLIENT_ID, PAYOS_API_KEY, và PAYOS_CHECKSUM_KEY trong file .env' 
            });
        }

        const { orderId, amount } = req.body;

        if (!orderId || amount == null) {
            return res.status(400).json({ error: 'Missing order id or amount' });
        }

        const amountNumber = Number(amount);
        if (Number.isNaN(amountNumber) || amountNumber <= 0) {
            return res.status(400).json({ error: 'Amount không hợp lệ' });
        }

        const orderCode = Date.now();

        const paymentLink = await payosClient.paymentRequests.create({
            orderCode,
            amount: amountNumber,
            description: `#${orderId}`,
            returnUrl: 'http://localhost:5173/success',
            cancelUrl: 'http://localhost:5173/failed',
        });

        if (!paymentLink?.checkoutUrl) {
            return res.status(500).json({ error: 'Không lấy được checkoutUrl từ PayOS' });
        }

        res.json({ checkoutUrl: paymentLink.checkoutUrl });
    } catch (err) {
        console.error('❌ Create order error:', err);
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
});

module.exports = router;
