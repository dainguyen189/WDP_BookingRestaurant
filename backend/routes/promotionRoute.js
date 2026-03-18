const express = require('express');
const { getAllPromotions, createPromotion, updatePromotion, deletePromotion, convertPointsToPromotion, addPointsAfterPayment,getActivePromotions } = require('../controller/promotionController');
const { verifyAdmin } = require('../util/verifyToken');
const router = express.Router();

router.get('/', getAllPromotions);

router.post('/create', verifyAdmin, createPromotion);
router.put('/update/:id', verifyAdmin, updatePromotion);
router.delete('/delete/:id', verifyAdmin, deletePromotion);
router.get('/active', getActivePromotions);
router.post('/convertPointToPromotion', convertPointsToPromotion);
router.post('/addpointsAfterPayment', addPointsAfterPayment)
module.exports = router;