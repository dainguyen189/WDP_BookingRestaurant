const mongoose = require('mongoose');

const DiningSessionSchema = new mongoose.Schema({
  table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active'
  },
  
  customerName: {
    type: String,
    default: 'Walk-in Customer'
  },
  customerPhone: {
    type: String,
    default: ''
  },
  guestCount: {
    type: Number,
    default: 1,
    min: 1
  },
  reservationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation',
    default: null  // null nếu là khách vãng lai
  },
  specialRequest: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true  
});

DiningSessionSchema.index({ table: 1, status: 1 });
DiningSessionSchema.index({ customerPhone: 1 });
DiningSessionSchema.index({ reservationId: 1 });

module.exports = mongoose.model('DiningSession', DiningSessionSchema);
