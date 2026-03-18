const express = require('express');
const router = express.Router();
const menuCategoryController = require('../controller/menuCategoryController');

router.get('/', menuCategoryController.getAllCategories);
router.get('/:id', menuCategoryController.getCategoryById);
router.post('/', menuCategoryController.createCategory);
router.put('/:id', menuCategoryController.updateCategory);
router.delete('/:id', menuCategoryController.deleteCategory);

module.exports = router;


// const express = require('express');
// const router = express.Router();
// const menuCategoryController = require('../controller/menuCategoryController');
// const { verifyAdmin } = require('../util/verifyToken');

// // Routes mở cho tất cả (customer, không cần token)
// router.get('/', menuCategoryController.getAllCategories);
// router.get('/:id', menuCategoryController.getCategoryById);

// // Routes chỉ cho admin
// router.post('/', verifyAdmin, menuCategoryController.createCategory);
// router.put('/:id', verifyAdmin, menuCategoryController.updateCategory);
// router.delete('/:id', verifyAdmin, menuCategoryController.deleteCategory);

// module.exports = router;
