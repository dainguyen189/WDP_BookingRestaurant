const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'DiningSession', required: true },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' }, // optional
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  orderTime: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },

  items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'OrderItem' }],
  status: {
    type: String,
    enum: ['pending', 'preparing', 'served', 'cancelled'],
    default: 'pending'
  },
  totalAmount: { type: Number, default: 0 },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid'],
    default: 'unpaid'
  }
});

module.exports = mongoose.model('Order', OrderSchema);
