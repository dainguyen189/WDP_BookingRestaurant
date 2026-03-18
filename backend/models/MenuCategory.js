const mongoose = require('mongoose');

const MenuCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String
});

module.exports = mongoose.model("MenuCategory", MenuCategorySchema);
  