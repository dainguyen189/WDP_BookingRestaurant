const express = require('express');
const router = express.Router();
const menuItemController = require('../controller/menuItemController');
const upload = require('../middlewares/mutler.middleware');

router.get('/', menuItemController.getAllMenuItems);
router.get('/:id', menuItemController.getMenuItemById);
//router.post('/', menuItemController.createMenuItem);

router.post('/', upload.single('image'), menuItemController.createMenuItem);

router.put('/:id', upload.single('image'), menuItemController.updateMenuItem);
router.delete('/:id', menuItemController.deleteMenuItem);

module.exports = router;
