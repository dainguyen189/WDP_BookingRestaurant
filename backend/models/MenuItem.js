const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },          
  image: { type: String },                  
  price: Number,
  isAvailable: { type: Boolean, default: true },
  needPreOrder: { type: Boolean, default: false },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuCategory' }
});

module.exports = mongoose.model("MenuItem", MenuItemSchema);
