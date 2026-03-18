const express = require('express');
const router = express.Router();
const diningSessionController = require('../controller/diningSessionController');

// Tạo mới session khi khách đến (bằng QR)
router.post('/', diningSessionController.createDiningSession);

// Lấy session theo bàn
router.get('/table/:tableId', diningSessionController.getActiveSessionByTable);

// Kết thúc session
//router.put('/end/:id', diningSessionController.endDiningSession);
router.put('/:id/complete', diningSessionController.endDiningSession);

router.get('/', diningSessionController.getAllSessions);
// Lấy session theo ID (cho MenuPage)
router.get('/:id', diningSessionController.getSessionById);

router.get('/reservation/:reservationId/user', diningSessionController.getUserFromReservation);
router.put('/:sessionId/change-table', diningSessionController.changeTable);
router.get('/:sessionId/with-user', diningSessionController.getSessionWithUserInfo);


module.exports = router;
