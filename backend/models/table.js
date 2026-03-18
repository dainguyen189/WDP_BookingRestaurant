// models/table.js
const mongoose = require('mongoose');

const TableSchema = new mongoose.Schema({
  tableNumber: {
    type: String,
    required: [true, 'Vui lòng nhập số bàn'],
    unique: true,
    trim: true,
  },
  capacity: {
    type: Number,
    required: [true, 'Vui lòng nhập số ghế'],
    min: [1, 'Số ghế phải lớn hơn 0'],
  },
  status: {
    type: String,
    enum: ['available', 'occupied'],
    default: 'available',
  },
}, {
  timestamps: true, // lưu createdAt, updatedAt tự động
});

module.exports = mongoose.model('Table', TableSchema);
