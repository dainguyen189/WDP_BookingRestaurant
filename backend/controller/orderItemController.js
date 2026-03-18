const MenuItem = require('../models/MenuItem');
const OrderItem = require('../models/orderItem');
const Order = require('../models/order');
const createError = require('../util/errorHandle');

exports.createOrderItem = async (req, res) => {
  try {
    const item = new OrderItem(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSortedItems = async (req, res) => {
  try {
    const { date, status, tableNumber } = req.query;
    console.log(req.query)

    const query = {};
    if (status) query.status = status;

    // Filter by date (if provided)
    if (date) {
      const selectedDate = new Date(date);
      const start = new Date(selectedDate.setHours(0, 0, 0, 0));
      const end = new Date(selectedDate.setHours(23, 59, 59, 999));
      query.createdAt = { $gte: start, $lte: end };
      console.log("Date filter:", start, end); // ✅ Now start and end are in scope
    }

    // Fetch items with nested population
    const items = await OrderItem.find(query)
      .sort({ createdAt: -1, orderId: 1 })
      .populate([
        {
          path: 'orderId',
          populate: {
            path: 'sessionId',
            populate: {
              path: 'table'
            }
          }
        },
        {
          path: 'menuItemId'
        }
      ]);

    // Optional filtering by tableNumber (after population)
    const filteredItems = tableNumber
      ? items.filter(item => {
        const table = item?.orderId?.sessionId?.table;
        return table && table.tableNumber === tableNumber;
      })
      : items;

    const responseData = filteredItems.map(item => {
      const order = item?.orderId;
      const session = order?.sessionId;
      const table = session?.table;

      return {
        _id: item._id,
        status: item.status,
        quantity: item.quantity,
        notes: item.notes,
        name: item?.menuItemId?.name || null,
        orderId: order?._id || null,
        orderStatus: order?.status || null,
        orderTime: order?.orderTime || null,
        customerName: session?.customerName || null,
        customerPhone: session?.customerPhone || null,
        table: table?.tableNumber || null
      };
    });

    res.json({ items: responseData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.getItemsByOrder = async (req, res) => {
  try {
    const items = await OrderItem.find({ order: req.params.orderId }).populate('menuItem');
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteById = async (req, res) => {
  try {
    const { id } = req.params
    const items = await OrderItem.findOneAndDelete({ _id: id });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateOrderItemStatus = async (req, res) => {
  console.log('test: ', req.body)
  try {

    const updated =
      await OrderItem.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status }, { new: true });
    res.json(updated);

  } catch (err) {
    console.log(err)
    res.status(500).json({ message: err.message });
  }
};
exports.getBestSellerItems = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const topItems = await OrderItem.aggregate([
      {
        $group: {
          _id: '$menuItemId',
          totalQuantity: { $sum: '$quantity' },
          totalRevenue: { $sum: { $multiply: ['$price', '$quantity'] } }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: limit }
    ]);

    const enrichedItems = await Promise.all(
      topItems.map(async (item) => {
        try {
          const menuItem = await MenuItem.findById(item._id).lean(); // dùng lean() để trả về plain JS object

          return {
            id: item._id,
            name: menuItem?.name || 'Unknown Item',
            image: menuItem?.image || '',
            price: menuItem?.price || 0,
            description: menuItem?.description || '',
            category: menuItem?.category || 'Uncategorized',
            totalQuantity: item.totalQuantity,
            totalRevenue: item.totalRevenue
          };
        } catch (error) {
          console.error(`❌ Error retrieving menu item ${item._id}:`, error);
          return {
            id: item._id,
            name: 'Error retrieving item',
            totalQuantity: item.totalQuantity,
            totalRevenue: item.totalRevenue
          };
        }
      })
    );

    return res.status(200).json({
      success: true,
      count: enrichedItems.length,
      data: enrichedItems
    });
  } catch (err) {
    console.error('🔥 Lỗi lấy danh sách món ăn bán chạy:', err);
    return next(createError(500, 'Không thể lấy danh sách món ăn bán chạy', { cause: err }));
  }
};
