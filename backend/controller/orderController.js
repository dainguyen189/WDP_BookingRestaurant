const Order = require('../models/order');
const Invoice = require('../models/invoice');
const OrderItem = require('../models/orderItem');
const Promotion = require('../models/promotion');
const createError = require('../util/errorHandle');
const mongoose = require('mongoose');
// Tạo đơn hàng mới hoặc thêm vào đơn pending
exports.createOrUpdateOrder = async (req, res) => {
  try {
    const { sessionId, items } = req.body;

    if (!sessionId || !items || items.length === 0) {
      return res.status(400).json({ error: 'Thiếu sessionId hoặc danh sách items' });
    }

    const newAmount = items.reduce((total, item) => total + item.price * item.quantity, 0);
    let order = await Order.findOne({ sessionId, status: 'pending' });

    if (order) {
      order.totalAmount += newAmount;
      order.updatedAt = Date.now();
      await order.save();

      const newItems = await Promise.all(
        items.map(item => {
          const newItem = new OrderItem({
            orderId: order._id,
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: item.price,
            notes: item.notes,
          });
          return newItem.save();
        })
      );

      return res.json({ message: 'Đã thêm món vào hóa đơn hiện tại', order, items: newItems });
    } else {
      const newOrder = new Order({
        sessionId,
        status: 'pending',
        totalAmount: newAmount,
        paymentStatus: 'unpaid',
        orderTime: new Date(),
      });

      const savedOrder = await newOrder.save();

      const newItems = await Promise.all(
        items.map(item => {
          const newItem = new OrderItem({
            orderId: savedOrder._id,
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: item.price,
          });
          return newItem.save();
        })
      );

      return res.status(201).json({ message: 'Đã tạo hóa đơn mới', order: savedOrder, items: newItems });
    }
  } catch (err) {
    console.error("❌ Lỗi tạo/append đơn hàng:", err);
    res.status(500).json({ error: 'Không thể xử lý đơn hàng', details: err.message });
  }
};

// Lấy đơn hàng theo sessionId và các orderItems
exports.getOrdersBySession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const orders = await Order.find({ sessionId })
      .populate({ path: 'sessionId' })
      .lean();

    if (!orders.length) {
      return res.status(404).json({ message: 'Không có đơn hàng nào trong phiên này.' });
    }

    const orderIds = orders.map(order => order._id);
    const orderItems = await OrderItem.find({ orderId: { $in: orderIds } })
      .populate('menuItemId')
      .lean();

    const itemMap = {};
    orderItems.forEach(item => {
      const key = item.orderId.toString();
      if (!itemMap[key]) itemMap[key] = [];
      itemMap[key].push(item);
    });

    const ordersWithItems = orders.map(order => ({
      ...order,
      items: itemMap[order._id.toString()] || []
    }));

    res.json(ordersWithItems);
  } catch (err) {
    console.error('❌ Lỗi lấy order theo session:', err);
    res.status(500).json({ error: 'Không thể lấy đơn hàng theo session', details: err.message });
  }
};

// Cập nhật trạng thái đơn hàng
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedOrder = await Order.findByIdAndUpdate(id, { status }, { new: true });
    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: 'Không thể cập nhật trạng thái đơn hàng', details: err.message });
  }
};

// Lấy tất cả đơn hàng
// exports.getAllOrders = async (req, res) => {
//   try {
//     const { date } = req.query; // frontend should send e.g. ?date=2025-07-22

//     let dateFilter = {};
//     if (date) {
//       const selectedDate = new Date(date);
//       const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
//       const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));

//       dateFilter = {
//         orderTime: { $gte: startOfDay, $lte: endOfDay }
//       };
//     }

//     const orders = await Order.find(dateFilter)
//       .populate({
//         path: 'sessionId',
//         populate: {
//           path: 'table',
//           model: 'Table'
//         }
//       })
    
//       .sort({ orderTime: -1 })
//       .lean();

//     res.json(orders);
//   } catch (err) {
//     res.status(500).json({ error: 'Không thể lấy danh sách đơn hàng', details: err.message });
//   }
// };


exports.getAllOrders = async (req, res) => {
  try {
    const { date, status, tableId } = req.query;
    console.log('🔍 Query params:', { date, status, tableId });

    // Build date filter
    let dateFilter = {};
    if (date) {
      const selectedDate = new Date(date);
      const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));

      dateFilter = {
        orderTime: { $gte: startOfDay, $lte: endOfDay }
      };
      console.log('📅 Date filter:', dateFilter);
    }

    // Build additional filters
    let additionalFilters = {};
    if (status) {
      additionalFilters.status = status;
    }

    // Combine all filters
    const filters = { ...dateFilter, ...additionalFilters };
    console.log('🔧 Final filters:', filters);

    // Lấy orders đơn giản trước
    const orders = await Order.find(filters)
      .populate({
        path: 'sessionId',
        populate: [
          {
            path: 'table',
            model: 'Table'
          },
          {
            path: 'user', // ✅ Sửa từ userId thành user
            model: 'User',
            select: 'username email phone points'
          }
        ]
      })
      .populate('userId', 'username email phone points')
      .sort({ orderTime: -1 })
      .lean();

    console.log('📊 Found orders count:', orders.length);
    
    // Debug: In ra 1 order đầu tiên để xem cấu trúc
    if (orders.length > 0) {
      console.log('🔍 First order structure:', JSON.stringify(orders[0], null, 2));
    }

    // Nếu không có orders, trả về ngay
    if (orders.length === 0) {
      return res.json({
        orders: [],
        summary: {
          totalOrders: 0,
          totalRevenue: 0,
          ordersByStatus: {},
          paymentStatusBreakdown: {},
          uniqueCustomers: 0,
          registeredUsers: 0,
          guestUsers: 0,
          tablesUsed: 0
        },
        customerList: [],
        filters: {
          date: date || null,
          status: status || null,
          tableId: tableId || null
        }
      });
    }

    // ✅ THÊM: Lấy OrderItems cho mỗi order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        try {
          const orderItems = await OrderItem.find({ orderId: order._id })
            .populate('menuItemId', 'name price image category')
            .lean();
          
          // Tạo customerInfo cho order này
          let customerInfo = {
            customerName: null,
            customerPhone: null,
            table: { number: 'N/A' },
            guestCount: 1,
            registeredUser: null
          };

          if (order.sessionId) {
            customerInfo.customerName = order.sessionId.customerName || null;
            customerInfo.customerPhone = order.sessionId.customerPhone || null;
            customerInfo.guestCount = order.sessionId.guestCount || 1;
            customerInfo.table.number = order.sessionId.table?.number || 'N/A';
            
            // ✅ Sửa từ userId thành user
            customerInfo.registeredUser = order.sessionId.user || null;
            
            // Debug log
            console.log(`📋 Order ${order._id} - Session data:`, {
              customerName: order.sessionId.customerName,
              customerPhone: order.sessionId.customerPhone,
              tableNumber: order.sessionId.table?.number,
              guestCount: order.sessionId.guestCount
            });
          }

          if (order.userId && !customerInfo.registeredUser) {
            customerInfo.registeredUser = order.userId;
            customerInfo.customerName = customerInfo.customerName || order.userId.username;
            customerInfo.customerPhone = customerInfo.customerPhone || order.userId.phone;
          }
          
          return {
            ...order,
            items: orderItems || [],
            customerInfo: customerInfo
          };
        } catch (err) {
          console.log('⚠️ Error fetching items for order:', order._id, err.message);
          return {
            ...order,
            items: [],
            customerInfo: {
              customerName: null,
              customerPhone: null,
              table: { number: 'N/A' },
              guestCount: 1,
              registeredUser: null
            }
          };
        }
      })
    );

    console.log('🍽️ Orders with items count:', ordersWithItems.length);

    // Tính toán customer summary - đơn giản hóa
    const customerSummary = ordersWithItems.map(order => {
      let customerInfo = {
        orderId: order._id,
        customerName: null,
        customerPhone: null,
        tableNumber: null,
        guestCount: 1,
        isRegisteredUser: false
      };

      try {
        if (order.sessionId) {
          customerInfo.customerName = order.sessionId.customerName || null;
          customerInfo.customerPhone = order.sessionId.customerPhone || null;
          customerInfo.guestCount = order.sessionId.guestCount || 1;
          customerInfo.tableNumber = order.sessionId.table?.number || 'N/A';
          customerInfo.isRegisteredUser = !!order.sessionId.user; // ✅ Sửa userId thành user
        }

        if (order.userId && !customerInfo.isRegisteredUser) {
          customerInfo.isRegisteredUser = true;
          customerInfo.customerName = customerInfo.customerName || order.userId.username;
          customerInfo.customerPhone = customerInfo.customerPhone || order.userId.phone;
        }
      } catch (err) {
        console.log('⚠️ Error processing customer info for order:', order._id, err.message);
      }

      return customerInfo;
    });

    console.log('👥 Customer summary count:', customerSummary.length);

    // Tính toán summary
    const summary = {
      totalOrders: ordersWithItems.length,
      totalRevenue: ordersWithItems.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
      ordersByStatus: ordersWithItems.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {}),
      paymentStatusBreakdown: ordersWithItems.reduce((acc, order) => {
        acc[order.paymentStatus] = (acc[order.paymentStatus] || 0) + 1;
        return acc;
      }, {}),
      uniqueCustomers: new Set(
        customerSummary
          .filter(c => c.customerPhone || c.customerName)
          .map(c => c.customerPhone || c.customerName)
      ).size,
      registeredUsers: customerSummary.filter(c => c.isRegisteredUser).length,
      guestUsers: customerSummary.filter(c => !c.isRegisteredUser).length,
      tablesUsed: new Set(
        customerSummary.map(c => c.tableNumber).filter(t => t !== 'N/A')
      ).size
    };

    console.log('📈 Summary calculated:', summary);

    // Response
    const response = {
      orders: ordersWithItems, // ✅ Trả về orders đã có items
      summary: summary,
      customerList: customerSummary,
      filters: {
        date: date || null,
        status: status || null,
        tableId: tableId || null
      }
    };

    console.log('✅ Sending response with orders count:', response.orders.length);
    res.json(response);

  } catch (err) {
    console.error('❌ Lỗi lấy danh sách đơn hàng:', err);
    res.status(500).json({ 
      error: 'Không thể lấy danh sách đơn hàng', 
      details: err.message 
    });
  }
};
// Thêm một món ăn vào đơn hàng theo sessionId
exports.addItemToOrder = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { menuItemId, quantity, price } = req.body;

    if (!sessionId || !menuItemId || !quantity || !price) {
      return res.status(400).json({ error: 'Thiếu thông tin món ăn hoặc sessionId' });
    }

    let order = await Order.findOne({ sessionId, status: 'pending' });

    if (!order) {
      order = new Order({
        sessionId,
        status: 'pending',
        totalAmount: 0,
        paymentStatus: 'unpaid',
        orderTime: new Date()
      });
    }

    order.totalAmount += price * quantity;
    await order.save();

    const newItem = new OrderItem({
      orderId: order._id,
      menuItemId,
      quantity,
      price
    });
    await newItem.save();

    res.status(201).json({ message: 'Đã thêm món vào đơn hàng', order, item: newItem });
  } catch (err) {
    console.error("Lỗi khi thêm món lẻ:", err);
    res.status(500).json({ error: 'Không thể thêm món vào đơn hàng', details: err.message });
  }
};

// Lấy thống kê doanh thu tổng
exports.getRevenueStatistics = async (req, res, next) => {
  try {
    const { period, startDate, endDate } = req.query;

    let dateFilter = {};
    const now = new Date();

    if (period) {
      switch (period) {
        case 'today':
          dateFilter = { orderTime: { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) } };
          break;
        case 'week':
          dateFilter = { orderTime: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
          break;
        case 'month':
          dateFilter = { orderTime: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } };
          break;
        case 'year':
          dateFilter = { orderTime: { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) } };
          break;
        default:
          dateFilter = {};
      }
    }

    if (startDate && endDate) {
      dateFilter = {
        orderTime: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    const pipeline = [
      ...(Object.keys(dateFilter).length > 0 ? [{ $match: dateFilter }] : []),
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: '$totalAmount' },
          maxOrderValue: { $max: '$totalAmount' },
          minOrderValue: { $min: '$totalAmount' }
        }
      }
    ];

    const result = await Order.aggregate(pipeline);

    if (!result || result.length === 0) {
      return res.json({
        success: true,
        data: {
          totalRevenue: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          maxOrderValue: 0,
          minOrderValue: 0
        },
        period: period || 'all',
        dateFilter
      });
    }

    const stats = result[0];

    res.json({
      success: true,
      data: {
        totalRevenue: stats.totalRevenue || 0,
        totalOrders: stats.totalOrders || 0,
        averageOrderValue: Math.round(stats.averageOrderValue || 0),
        maxOrderValue: stats.maxOrderValue || 0,
        minOrderValue: stats.minOrderValue || 0
      },
      period: period || 'all',
      dateFilter
    });

  } catch (err) {
    next(createError(500, 'Không thể lấy thống kê doanh thu', { cause: err }));
  }
};

// Lấy doanh thu từng ngày trong tháng
exports.getDailyRevenueInMonth = async (req, res) => {
  try {
    const { month, year } = req.query;

    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) - 1 : currentDate.getMonth();
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();

    const startOfMonth = new Date(targetYear, targetMonth, 1);
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0);

    const pipeline = [
      {
        $match: {
          orderTime: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: {
            day: { $dayOfMonth: '$orderTime' },
            month: { $month: '$orderTime' },
            year: { $year: '$orderTime' }
          },
          dailyRevenue: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.day': 1 } },
      {
        $project: {
          _id: 0,
          day: '$_id.day',
          month: '$_id.month',
          year: '$_id.year',
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day'
            }
          },
          dailyRevenue: 1,
          orderCount: 1
        }
      }
    ];

    const dailyStats = await Order.aggregate(pipeline);

    const totalMonthlyRevenue = dailyStats.reduce((sum, day) => sum + day.dailyRevenue, 0);
    const totalOrders = dailyStats.reduce((sum, day) => sum + day.orderCount, 0);

    res.json({
      success: true,
      data: {
        month: targetMonth + 1,
        year: targetYear,
        totalMonthlyRevenue,
        totalOrders,
        dailyBreakdown: dailyStats
      }
    });

  } catch (err) {
    console.error('Error in getDailyRevenueInMonth:', err);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy doanh thu theo ngày',
      error: err.message
    });
  }
};

exports.markAsPaidByCash = async (req, res, next) => {
  try {
      const { orderId } = req.params;
      const order = await Order.findById(orderId);

      if (!order) {
          return res.status(404).json({ success: false, message: 'Order not found.' });
      }
      if (order.paymentStatus === 'paid') {
          return res.status(400).json({ success: false, message: 'This order has already been paid.' });
      }

      order.paymentStatus = 'paid';
      order.status = 'served';
      const updatedOrder = await order.save();

      const existingInvoice = await Invoice.findOne({ order_id: orderId });
      if (!existingInvoice) {
          const items = await OrderItem.find({ orderId: orderId });
          const subTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          
          const discountAmount = subTotal - updatedOrder.totalAmount;

          const newInvoice = new Invoice({
              order_id: orderId,
              customer_id: updatedOrder.customerId || updatedOrder.userId || null,
              total_amount: updatedOrder.totalAmount,
              discount: discountAmount > 0 ? discountAmount : 0, 
              payment_method: 'cash',
              payment_status: 'paid'
          });
          await newInvoice.save();
      }

      res.status(200).json({
          success: true,
          message: 'Successfully updated payment status.',
          data: updatedOrder
      });

  } catch (error) {
      console.error("Error during cash payment:", error);
      next(error);
  }
};
exports.applyVoucher = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { voucherCode } = req.body;

    if (!voucherCode) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập mã voucher.' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng.' });
    }
    if (order.promotion_id) {
      return res.status(400).json({ success: false, message: 'Đơn hàng này đã được áp dụng khuyến mãi.' });
    }

    const promotion = await Promotion.findOne({
      code: voucherCode.toUpperCase(),
      is_active: true,
      start_date: { $lte: new Date() },
      end_date: { $gte: new Date() }
    });

    if (!promotion) {
      return res.status(404).json({ success: false, message: 'Mã voucher không hợp lệ hoặc đã hết hạn.' });
    }

    const usageLimit = Number(promotion.usage_limit) || 0;
    const usedCount = Number(promotion.used_count) || 0;
    if (usageLimit > 0 && usedCount >= usageLimit) {
      return res.status(400).json({ success: false, message: 'Mã khuyến mãi đã hết lượt sử dụng.' });
    }

    const items = await OrderItem.find({ orderId: orderId });
    const subTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const minRequired = Math.max(
      Number(promotion.min_order_value) || 0,
      Number(promotion.min_order_amount) || 0
    );
    if (subTotal < minRequired) {
      return res.status(400).json({
        success: false,
        message: `Đơn hàng phải có giá trị tối thiểu ${minRequired.toLocaleString('vi-VN')}₫ để áp dụng mã này.`,
      });
    }

    let discountAmount = 0;
    if (promotion.discount_type === 'percentage') {
      discountAmount = subTotal * (promotion.discount_value / 100);
    } else {
      discountAmount = promotion.discount_value;
    }

    order.totalAmount = subTotal - discountAmount;
    order.promotion_id = promotion._id;

    await order.save();

    await Promotion.findByIdAndUpdate(promotion._id, { $inc: { used_count: 1 } });

    res.status(200).json({
      success: true,
      message: 'Áp dụng voucher thành công!',
      data: {
        orderId: order._id,
        subTotal: subTotal,
        discount: discountAmount,
        newTotalAmount: order.totalAmount
      }
    });

  } catch (error) {
    next(error);
  }
};
exports.linkUserToOrder = async (req, res, next) => {
  const { orderId } = req.params;
  const { userId } = req.body;

  // Kiểm tra định dạng ID
  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(orderId)) {
    return next(createError(400, "Invalid ID format."));
  }

  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { userId: userId },
      { new: true }
    )
      .populate('userId', 'username points')
      .populate({
        path: 'items.menuItemId',
        select: 'name'
      });

    if (!updatedOrder) {
      return next(createError(404, "Order not found."));
    }

    res.status(200).json({
      success: true,
      message: "User linked to order successfully.",
      order: updatedOrder
    });

  } catch (error) {
    console.error("ERROR LINKING USER TO ORDER:", error);
    next(createError(500, "Failed to link user to order."));
  }
};

exports.updateManyItems = async (req, res) => {
  try {
    const updates = req.body.items;
    console.log(updates)
    const result = await updateMultipleOrderItems(updates);
    res.json({ message: 'Order items updated successfully', result });
  } catch (err) {
    console.error('Bulk update error:', err);
    res.status(500).json({ error: err.message });
  }
}

const updateMultipleOrderItems = async (updates) => {
  if (!Array.isArray(updates) || updates.length === 0) {
    throw new Error('updates must be a non-empty array');
  }

  const bulkOperations = updates.map(item => {
    const { id, ...fieldsToUpdate } = item;

    if (!id) {
      throw new Error('Each item must include an _id');
    }

    return {
      updateOne: {
        filter: { _id: id },
        update: { $set: fieldsToUpdate }
      }
    };
  });

  return await OrderItem.bulkWrite(bulkOperations);
}