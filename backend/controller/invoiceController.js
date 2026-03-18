const axios = require('axios').default;
const CryptoJS = require('crypto-js');
const moment = require('moment');
const qs = require('qs'); 
const Order = require('../models/order');
const Invoice = require('../models/invoice');
const OrderItem = require('../models/orderItem');
const DiningSession = require('../models/diningSession');
const Table = require('../models/table');
// Cấu hình ZaloPay, lấy thông tin từ file .env
const config = {
  app_id: process.env.ZALOPAY_APP_ID || "2553",
  key1: process.env.ZALOPAY_KEY1 || "PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL",
  key2: process.env.ZALOPAY_KEY2 || "kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz",
  endpoint_create: 'https://sb-openapi.zalopay.vn/v2/create',
  endpoint_query: 'https://sb-openapi.zalopay.vn/v2/query',
  endpoint_getbanks: 'https://sbgateway.zalopay.vn/api/getlistmerchantbanks',
};

// Validate ZaloPay configuration
const validateZaloPayConfig = () => {
  const requiredFields = ['app_id', 'key1', 'key2'];
  const missingFields = requiredFields.filter(field => !config[field]);
  
  if (missingFields.length > 0) {
    console.warn(`⚠️  ZaloPay configuration missing: ${missingFields.join(', ')}`);
    console.warn('Using default sandbox values. For production, please set proper environment variables.');
  }
  
  return missingFields.length === 0;
};

/**
 * Hàm hỗ trợ tính toán lại hóa đơn.
 */
const calculateBillFromItems = async (orderId) => {
    console.log(`🔍 Looking for order items with orderId: ${orderId}`);
    
    // First check if the order exists
    const order = await Order.findById(orderId);
    if (!order) {
        throw new Error(`Không tìm thấy đơn hàng với ID: ${orderId}`);
    }
    
    const items = await OrderItem.find({ orderId: orderId });
    console.log(`📦 Found ${items.length} items for order ${orderId}`);
    
    if (!items || items.length === 0) {
        // If no items found, try to use the order's totalAmount
        if (order.totalAmount && order.totalAmount > 0) {
            console.log(`💰 Using order totalAmount: ${order.totalAmount}`);
            return order.totalAmount;
        }
        throw new Error('Đơn hàng không có sản phẩm và không có tổng tiền.');
    }
    
    const totalAmount = items.reduce((sum, item) => {
        const itemTotal = (item.price || 0) * (item.quantity || 0);
        console.log(`📊 Item: ${item.menuItemId}, Price: ${item.price}, Qty: ${item.quantity}, Total: ${itemTotal}`);
        return sum + itemTotal;
    }, 0);
    
    console.log(`💰 Calculated total amount: ${totalAmount} VND`);
    return totalAmount;
};


/**
 * @desc Tạo một đơn hàng mới trên ZaloPay.
 * @route POST /api/zalopay/create-order
 */
exports.createZaloPayOrder = async (req, res, next) => {
    try {
        // Validate ZaloPay configuration
        validateZaloPayConfig();
        
        const { orderId, bankCode } = req.body;
        if (!orderId) {
            return res.status(400).json({ success: false, message: 'Thiếu orderId.' });
        }

        console.log(`🔄 Creating ZaloPay order for orderId: ${orderId}`);

        const amount = await calculateBillFromItems(orderId);
        if (amount <= 0) {
            return res.status(400).json({ success: false, message: 'Đơn hàng không có giá trị.' });
        }

        console.log(`💰 Order amount: ${amount} VND`);

        const embed_data = {
            redirecturl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-result`
        };

        const unique_suffix = Date.now().toString().slice(-6);
        const app_trans_id = `${moment().format('YYMMDD')}_${orderId}_${unique_suffix}`;

        // Create item array with proper format
        const items = await OrderItem.find({ orderId: orderId }).populate('menuItemId');
        const itemArray = items.map(item => ({
            itemid: item.menuItemId?._id || 'unknown',
            itemname: item.menuItemId?.name || 'Unknown Item',
            itemprice: item.price,
            itemquantity: item.quantity
        }));

        const order_request = {
            app_id: config.app_id,
            app_trans_id: app_trans_id,
            app_user: 'user123',
            app_time: Date.now(),
            item: JSON.stringify(itemArray), 
            embed_data: JSON.stringify(embed_data),
            amount: amount,
            description: `Thanh toán cho đơn hàng #${orderId}`,
            bank_code: bankCode || '',
            callback_url: `${process.env.APP_URL || 'http://localhost:8080'}/api/zalopay/callback`,
        };

        // Create MAC signature with correct order
        const data = `${config.app_id}|${order_request.app_trans_id}|${order_request.app_user}|${order_request.amount}|${order_request.app_time}|${order_request.embed_data}|${order_request.item}`;
        order_request.mac = CryptoJS.HmacSHA256(data, config.key1).toString();

        console.log(`📤 Sending request to ZaloPay API: ${config.endpoint_create}`);
        console.log(`📋 Order request:`, {
            app_id: order_request.app_id,
            app_trans_id: order_request.app_trans_id,
            amount: order_request.amount,
            description: order_request.description,
            item: order_request.item,
            embed_data: order_request.embed_data
        });
        
        // Debug MAC signature
        console.log(`🔐 MAC data string: ${data}`);
        console.log(`🔑 MAC signature: ${order_request.mac}`);
        console.log(`🔑 Key1 (first 10 chars): ${config.key1.substring(0, 10)}...`);

        // Convert to URL-encoded format as required by ZaloPay
        const formData = new URLSearchParams();
        Object.keys(order_request).forEach(key => {
            formData.append(key, order_request[key]);
        });

        const result = await axios.post(config.endpoint_create, formData, { 
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            timeout: 30000 // 30 second timeout
        });
        
        console.log(`📥 ZaloPay API response:`, result.data);
        
        // Check if ZaloPay returned an error
        if (result.data.return_code !== 1) {
            console.error(`❌ ZaloPay API error:`, result.data);
            return res.status(400).json({
                success: false,
                message: `ZaloPay API Error: ${result.data.return_message || 'Unknown error'}`,
                zaloPayResponse: result.data
            });
        }
        
        res.status(200).json({ 
            success: true, 
            zaloPayResponse: result.data,
            app_trans_id: app_trans_id,
            amount: amount
        });

    } catch (error) {
        console.error("❌ Lỗi khi tạo đơn hàng ZaloPay:", error);
        
        if (error.response) {
            console.error("ZaloPay API Error Response:", error.response.data);
            return res.status(500).json({
                success: false,
                message: `ZaloPay API Error: ${error.response.data?.return_message || error.message}`,
                error: error.response.data
            });
        } else if (error.request) {
            console.error("Network Error:", error.request);
            return res.status(500).json({
                success: false,
                message: 'Không thể kết nối đến ZaloPay API. Vui lòng thử lại sau.',
                error: 'Network timeout or connection error'
            });
        } else {
            return res.status(500).json({
                success: false,
                message: 'Lỗi không xác định khi tạo đơn hàng ZaloPay.',
                error: error.message
            });
        }
    }
};

/**
 * @desc Xử lý callback từ ZaloPay Server.
 * @route POST /api/zalopay/callback
 */
exports.handleZaloPayCallback = async (req, res, next) => {
    const result = {};
    try {
        const { data: dataStr, mac } = req.body;
        const calculatedMac = CryptoJS.HmacSHA256(dataStr, config.key2).toString();
        if (calculatedMac !== mac) {
            result.return_code = -1;
            result.return_message = 'mac not equal';
        } else {
            const dataJson = JSON.parse(dataStr);
            const app_trans_id = dataJson['app_trans_id'];
            const orderId = app_trans_id.split('_')[1];
            const order = await Order.findById(orderId);

            if (order && order.paymentStatus !== 'paid') {
                order.paymentStatus = 'paid';
                order.status = 'served';
                await order.save();
                
                const existingInvoice = await Invoice.findOne({ order_id: orderId });
                if (!existingInvoice) {
                    const items = await OrderItem.find({ orderId: orderId });
                    const originalSubTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                    const finalTotalAmount = order.totalAmount;
                    const discountAmount = originalSubTotal - finalTotalAmount;

                    const newInvoice = new Invoice({
                        order_id: orderId,
                        customer_id: order.customerId || order.userId || null,
                        total_amount: finalTotalAmount, 
                        discount: discountAmount > 0 ? discountAmount : 0, 
                        payment_method: 'zalopay_qr',
                        payment_status: 'paid'
                    });
                    await newInvoice.save();
                }
                if (order.sessionId) {
                    const session = await DiningSession.findByIdAndUpdate(order.sessionId, {
                        status: 'completed',
                        endTime: new Date()
                    });
                    
                    if (session && session.table) {
                        await Table.findByIdAndUpdate(session.table, { status: 'available' });
                    }

                }
            }
            result.return_code = 1;
            result.return_message = 'success';
        }
    } catch (ex) {
        console.error("Lỗi ZaloPay Callback:", ex);
        result.return_code = 0;
        result.return_message = ex.message;
    }
    res.json(result);
};
/**
 * @desc Kiểm tra trạng thái đơn hàng (dành cho frontend polling).
 * @route POST /api/zalopay/status
 */
exports.checkZaloPayOrderStatus = async (req, res, next) => {
    try {
        const { app_trans_id } = req.body;
        if (!app_trans_id) {
            return res.status(400).json({ success: false, message: 'Thiếu app_trans_id.' });
        }

        const postData = {
            app_id: config.app_id,
            app_trans_id,
        };

        const data = `${config.app_id}|${postData.app_trans_id}|${config.key1}`;
        postData.mac = CryptoJS.HmacSHA256(data, config.key1).toString();

        const postConfig = {
            method: 'post',
            url: config.endpoint_query,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            data: qs.stringify(postData),
        };

        const result = await axios(postConfig);

        const orderId = app_trans_id.split('_')[1];
        const ourOrder = await Order.findById(orderId).select('paymentStatus');

        res.status(200).json({
            success: true,
            zaloPayStatus: result.data,
            ourDbStatus: ourOrder ? ourOrder.paymentStatus : 'not_found'
        });
    } catch (error) {
        console.error("Lỗi kiểm tra trạng thái ZaloPay:", error);
        next(error);
    }
};

/**
 * @desc Lấy danh sách ngân hàng được ZaloPay hỗ trợ.
 * @route GET /api/zalopay/banks
 */
exports.getListBanks = async (req, res, next) => {
    try {
        const reqtime = Date.now();
        const params = {
            appid: config.app_id,
            reqtime: reqtime,
            mac: CryptoJS.HmacSHA256(config.app_id + "|" + reqtime, config.key1).toString()
        };
        const result = await axios.get(config.endpoint_getbanks, { params });
        res.status(200).json(result.data);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách ngân hàng:", error);
        next(error);
    }
};

/**
 * @desc Test endpoint để kiểm tra MAC signature generation
 * @route GET /api/zalopay/test-mac
 */
exports.testMacSignature = async (req, res, next) => {
    try {
        console.log("🧪 Testing MAC signature generation...");
        
        const testData = {
            app_id: config.app_id,
            app_trans_id: "241201_TEST_123456",
            app_user: "test_user",
            amount: 1000,
            app_time: Date.now(),
            embed_data: JSON.stringify({ redirecturl: "http://localhost:3000/payment-result" }),
            item: JSON.stringify([{ itemid: "test", itemname: "Test", itemprice: 1000, itemquantity: 1 }])
        };
        
        const dataString = `${testData.app_id}|${testData.app_trans_id}|${testData.app_user}|${testData.amount}|${testData.app_time}|${testData.embed_data}|${testData.item}`;
        const macSignature = CryptoJS.HmacSHA256(dataString, config.key1).toString();
        
        res.status(200).json({
            success: true,
            data: {
                testData,
                dataString,
                macSignature,
                key1Preview: config.key1.substring(0, 10) + "...",
                config: {
                    app_id: config.app_id,
                    endpoint: config.endpoint_create
                }
            }
        });
    } catch (error) {
        console.error("❌ Test MAC signature error:", error);
        res.status(500).json({
            success: false,
            message: "Test failed",
            error: error.message
        });
    }
};

/**
 * @desc Test endpoint để kiểm tra orders và order items
 * @route GET /api/zalopay/test-orders
 */
exports.testOrders = async (req, res, next) => {
    try {
        console.log("🧪 Testing orders and order items...");
        
        // Get all orders
        const orders = await Order.find().limit(5).populate('sessionId');
        console.log(`📋 Found ${orders.length} orders`);
        
        // Get all order items
        const orderItems = await OrderItem.find().limit(10).populate('menuItemId');
        console.log(`📦 Found ${orderItems.length} order items`);
        
        // Test calculation for first order
        let testResult = null;
        if (orders.length > 0) {
            const firstOrder = orders[0];
            try {
                const amount = await calculateBillFromItems(firstOrder._id);
                testResult = {
                    orderId: firstOrder._id,
                    calculatedAmount: amount,
                    orderTotalAmount: firstOrder.totalAmount
                };
            } catch (calcError) {
                testResult = {
                    orderId: firstOrder._id,
                    error: calcError.message
                };
            }
        }
        
        res.status(200).json({
            success: true,
            data: {
                ordersCount: orders.length,
                orderItemsCount: orderItems.length,
                sampleOrders: orders.map(order => ({
                    _id: order._id,
                    totalAmount: order.totalAmount,
                    paymentStatus: order.paymentStatus,
                    status: order.status,
                    sessionId: order.sessionId
                })),
                sampleOrderItems: orderItems.map(item => ({
                    _id: item._id,
                    orderId: item.orderId,
                    menuItemId: item.menuItemId,
                    price: item.price,
                    quantity: item.quantity,
                    total: item.price * item.quantity
                })),
                testCalculation: testResult
            }
        });
    } catch (error) {
        console.error("❌ Test orders error:", error);
        res.status(500).json({
            success: false,
            message: "Test failed",
            error: error.message
        });
    }
};

/**
 * @desc    Find an invoice by its associated Order ID
 * @route   GET /api/invoices/by-order/:orderId
 */
exports.getInvoiceByOrderId = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const invoice = await Invoice.findOne({ order_id: orderId });

        if (!invoice) {
            return res.status(404).json({ success: false, message: `No invoice found for order id ${orderId}` });
        }

        // Re-use the getInvoiceDetails logic
        req.params.id = invoice._id.toString();
        this.getInvoiceDetails(req, res, next);

    } catch (error) {
        console.error("Error fetching invoice by order ID:", error);
        next(error);
    }
};
/**
 * @desc    Get details of a single invoice
 * @route   GET /api/invoices/:id
 * @access  Private (Admin/Cashier)
 */
exports.getInvoiceDetails = async (req, res, next) => {
    try {
        const invoice = await Invoice.findById(req.params.id).populate('order_id');

        if (!invoice) {
            return res.status(404).json({ success: false, message: `Invoice not found with id ${req.params.id}` });
        }

        const orderItems = await OrderItem.find({ orderId: invoice.order_id._id }).populate('menuItemId', 'name price');

        res.status(200).json({
            success: true,
            data: {
                invoice,
                items: orderItems
            }
        });
    } catch (error) {
        console.error("Error fetching invoice details:", error);
        next(error);
    }
};
exports.printInvoice = (req, res, next) => {
    this.getInvoiceDetails(req, res, next);
};
/**
 * @desc    Cancel an invoice (and update the related order)
 * @route   PUT /api/invoices/:id/cancel
 * @access  Private (Admin)
 */
exports.cancelInvoice = async (req, res, next) => {
    try {
        const invoice = await Invoice.findById(req.params.id);

        if (!invoice) {
            return res.status(404).json({ success: false, message: `Invoice not found with id ${req.params.id}` });
        }

        if (invoice.payment_status === 'cancelled') {
            return res.status(400).json({ success: false, message: 'This invoice has already been cancelled.' });
        }

        invoice.payment_status = 'cancelled';
        await invoice.save();

        await Order.findByIdAndUpdate(invoice.order_id, {
            paymentStatus: 'unpaid'
        });

        res.status(200).json({
            success: true,
            message: 'Invoice has been cancelled successfully.',
            data: invoice
        });
    } catch (error) {
        console.error("Error cancelling invoice:", error);
        next(error);
    }
};