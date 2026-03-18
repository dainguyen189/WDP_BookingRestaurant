const Order = require('../models/order');
const OrderItem = require('../models/orderItem');

exports.getOrdersForChef = async (req, res) => {
  try {
    const { status, limit = 100, page = 1, date } = req.query;

    let dateFilter = {};
    if (date) {
      const selectedDate = new Date(date);
      const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));

      dateFilter = {
        orderTime: { $gte: startOfDay, $lte: endOfDay }
      };
    }

    // Chef chỉ cần xem đơn hàng pending và preparing
    const validStatuses = ['pending', 'preparing'];
    let statusFilter = validStatuses;

    if (status && validStatuses.includes(status)) {
      statusFilter = [status];
    }

    const skip = (page - 1) * limit;

    // Lấy orders với populate session info VÀ table info
    const orders = await Order.find({
      status: { $in: statusFilter },
      paymentStatus: 'unpaid',
      ...dateFilter
    })
      .populate({
        path: 'sessionId',
        populate: {
          path: 'table',
          model: 'Table'
        }
      })
      .sort({ orderTime: 1 }) // Chef thường xem đơn cũ trước
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    // Lấy tất cả order items cho các orders này
    const orderIds = orders.map(order => order._id);
    const orderItems = await OrderItem.find({
      orderId: { $in: orderIds },
    })
      .populate({
        path: 'menuItemId',
        select: 'name category cookingTime image',
        populate: {
          path: 'category',
          select: 'name'
        }
      })
      .lean();

    // Group items theo orderId
    const itemMap = {};
    orderItems.forEach(item => {
      const key = item.orderId.toString();
      if (!itemMap[key]) itemMap[key] = [];
      itemMap[key].push(item);
    });

    // Combine orders với items và apply smart merge
    const ordersWithItems = orders.map(order => {
      const items = itemMap[order._id.toString()] || [];
      const mergedItems = items; // 🔧 Use raw, unmerged items
      const waitingTime = Math.floor((new Date() - new Date(order.orderTime)) / (1000 * 60));

      return {
        ...order,
        items: mergedItems,
        originalItems: items,
        waitingTime,
        itemCount: mergedItems.length,
        originalItemCount: items.length,
        estimatedCookingTime: Math.max(...items.map(item => item.menuItemId?.cookingTime || 0))
      };
    });

    // Đếm tổng số orders
    const totalCount = await Order.countDocuments({
      status: { $in: statusFilter }
    });

    res.json({
      orders: ordersWithItems,
      totalCount,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / limit),
      statusFilter
    });

  } catch (err) {
    console.error('❌ Lỗi lấy danh sách đơn hàng cho Chef:', err);
    res.status(500).json({
      error: 'Không thể lấy danh sách đơn hàng',
      details: err.message
    });
  }
};
// Cập nhật trạng thái đơn hàng (Chef)
exports.updateOrderStatusByChef = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, estimatedTime } = req.body;

    // Validate status
    const validStatuses = ['pending', 'preparing', 'cooking', 'served'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Trạng thái không hợp lệ',
        validStatuses
      });
    }

    const updateData = { status };

    // Nếu chuyển sang preparing, cập nhật thời gian bắt đầu nấu
    if (status === 'preparing') {
      updateData.preparingStartTime = new Date();
      if (estimatedTime) {
        updateData.estimatedCompleteTime = new Date(Date.now() + estimatedTime * 60000);
      }
    }

    // Nếu chuyển sang served, cập nhật thời gian hoàn thành
    if (status === 'served') {
      updateData.completedTime = new Date();
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate({
      path: 'sessionId',
      populate: {
        path: 'table',
        model: 'Table'
      }
    });

    if (!updatedOrder) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    }

    // Cập nhật tất cả order items nếu đơn hàng served
    if (status === 'served') {
      await OrderItem.updateMany(
        { orderId: id },
        { status: 'done' }
      );
    }

    res.json({
      message: `Đã cập nhật trạng thái đơn hàng thành ${status}`,
      order: updatedOrder
    });

  } catch (err) {
    console.error('❌ Lỗi cập nhật trạng thái đơn hàng:', err);
    res.status(500).json({
      error: 'Không thể cập nhật trạng thái đơn hàng',
      details: err.message
    });
  }
};

exports.updateOrderItemStatusByChef = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { status, itemIds } = req.body; // Thêm itemIds cho merged items

    const validStatuses = ['ordered', 'cooking', 'preparing', 'done'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Trạng thái món ăn không hợp lệ',
        validStatuses
      });
    }

    // Nếu có itemIds (merged items), update multiple
    const idsToUpdate = itemIds && itemIds.length > 0 ? itemIds : [itemId];

    // Update tất cả items
    const updatePromises = idsToUpdate.map(id =>
      OrderItem.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      ).populate('menuItemId', 'name category')
    );

    const updatedItems = await Promise.all(updatePromises);

    if (updatedItems.some(item => !item)) {
      return res.status(404).json({ error: 'Không tìm thấy món ăn' });
    }

    // Lấy orderId từ item đầu tiên
    const orderId = updatedItems[0].orderId;

    // Kiểm tra xem tất cả items của order đã done chưa
    const allItems = await OrderItem.find({ orderId });
    const allDone = allItems.every(item => item.status === 'done');
    const hasPreparingItems = allItems.some(item => item.status === 'preparing');
    const allOrdered = allItems.every(item => item.status === 'ordered');

    let newOrderStatus = null;
    let updateOrderData = {};

    if (allDone) {
      newOrderStatus = 'served';
      updateOrderData = {
        status: 'served',
        completedTime: new Date()
      };
    } else if (hasPreparingItems && !allOrdered) {
      newOrderStatus = 'preparing';
      updateOrderData = {
        status: 'preparing',
        preparingStartTime: new Date()
      };
    } else if (allOrdered) {
      newOrderStatus = 'pending';
      updateOrderData = { status: 'pending' };
    }

    // Cập nhật trạng thái Order nếu cần
    if (newOrderStatus) {
      await Order.findByIdAndUpdate(orderId, updateOrderData);
    }

    res.json({
      message: `Đã cập nhật ${idsToUpdate.length} món ăn thành ${status}`,
      items: updatedItems,
      orderStatus: newOrderStatus,
      orderCompleted: allDone
    });

  } catch (err) {
    console.error('❌ Lỗi cập nhật trạng thái món ăn:', err);
    res.status(500).json({
      error: 'Không thể cập nhật trạng thái món ăn',
      details: err.message
    });
  }
};

// Bắt đầu nấu tất cả món trong đơn hàng - 
exports.startCookingOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { estimatedTime } = req.body;

    // Lấy tất cả items của order
    const orderItems = await OrderItem.find({ orderId: id });
    const itemsToStart = orderItems.filter(item => item.status === 'ordered');

    if (itemsToStart.length === 0) {
      return res.status(400).json({
        error: 'Không có món nào cần bắt đầu nấu'
      });
    }

    // Cập nhật tất cả items thành preparing
    await OrderItem.updateMany(
      { orderId: id, status: 'ordered' },
      { status: 'preparing' }
    );

    // Cập nhật trạng thái order
    const updateData = {
      status: 'preparing',
      preparingStartTime: new Date()
    };

    if (estimatedTime) {
      updateData.estimatedCompleteTime = new Date(Date.now() + estimatedTime * 60000);
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate({
      path: 'sessionId',
      populate: {
        path: 'table',
        model: 'Table'
      }
    });

    res.json({
      message: `Đã bắt đầu nấu ${itemsToStart.length} món`,
      order: updatedOrder,
      itemsStarted: itemsToStart.length
    });

  } catch (err) {
    console.error('❌ Lỗi bắt đầu nấu đơn hàng:', err);
    res.status(500).json({
      error: 'Không thể bắt đầu nấu đơn hàng',
      details: err.message
    });
  }
};

// Lấy thống kê cho Chef dashboard
exports.getChefDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await Promise.all([

      Order.countDocuments({
        status: 'pending'
      }),


      Order.countDocuments({
        status: 'preparing'
      }),

      // Đơn hàng hoàn thành hôm nay
      Order.countDocuments({
        status: 'served',
        completedTime: { $gte: today }
      }),

      // Tổng doanh thu hôm nay 
      Order.aggregate([
        {
          $match: {
            status: 'served',
            paymentStatus: 'paid',
            completedTime: { $gte: today }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' }
          }
        }
      ])
    ]);

    res.json({
      pendingOrders: stats[0],
      preparingOrders: stats[1],
      completedToday: stats[2],
      revenueToday: stats[3][0]?.total || 0,
      timestamp: new Date()
    });

  } catch (err) {
    console.error('❌ Lỗi lấy thống kê Chef:', err);
    res.status(500).json({
      error: 'Không thể lấy thống kê',
      details: err.message
    });
  }
};

const smartMergeItems = (items) => {
  const grouped = {};

  items.forEach(item => {
    // Key = menuItemId + notes (normalize notes)
    const normalizedNotes = (item.notes || '').trim().toLowerCase();
    const key = `${item.menuItemId._id}__${normalizedNotes}`;

    if (grouped[key]) {
      // Merge cùng món + cùng notes
      grouped[key].quantity += item.quantity;
      grouped[key].totalPrice += item.price;
      grouped[key].itemIds.push(item._id);

      // Ưu tiên status cao nhất: done > preparing > ordered
      const statusPriority = { 'ordered': 1, 'preparing': 2, 'done': 3 };
      if (statusPriority[item.status] > statusPriority[grouped[key].status]) {
        grouped[key].status = item.status;
      }
    } else {
      // Tạo group mới
      grouped[key] = {
        ...item,
        quantity: item.quantity,
        totalPrice: item.price,
        itemIds: [item._id],
        displayKey: key
      };
    }
  });

  return Object.values(grouped);
};
