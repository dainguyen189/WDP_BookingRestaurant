// utils/menuCache.js
const MenuItem = require('../models/MenuItem'); 

let cachedMenu = null;

async function getMenuContext() {
  if (cachedMenu) return cachedMenu;

  const dishes = await MenuItem.find({ isAvailable: true })
    .populate('category', 'name') 
    .select('name price description needPreOrder category')
    .lean();

  cachedMenu = dishes.map(d => {
    const categoryName = d.category?.name || 'Chưa phân loại';
    const preOrder = d.needPreOrder ? ' (Cần đặt trước)' : '';
    return `- ${d.name} [${categoryName}]${preOrder}: ${d.price?.toLocaleString('vi-VN')}đ — ${d.description || 'Không có mô tả'}`;
  }).join('\n');

  return cachedMenu;
}

function clearMenuCache() {
  cachedMenu = null;
}

module.exports = { getMenuContext, clearMenuCache };