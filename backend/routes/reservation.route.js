const express = require('express')
const router = express.Router();
const reservationController = require('../controller/reservationController');
const { body, param, validationResult } = require('express-validator');
const { normalizeVietnamPhone } = require('../util/phoneNormalize');

const validationHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const first = errors.array()[0];
    return res.status(400).json({
      message: first.msg || 'Dữ liệu không hợp lệ',
      errors: errors.array(),
    });
  }
  next();
}

router.post('/otp/email', [
  body('email').isEmail().notEmpty().withMessage("Email is required"),
  body('name').optional().isString().withMessage("Name must be a string"),
], validationHandler, reservationController.bookingOtpEmail)

router.post('/otp/phone', [
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Số điện thoại là bắt buộc.')
    .custom((value) => {
      if (!normalizeVietnamPhone(value)) {
        throw new Error('Số điện thoại không hợp lệ (ví dụ: 09xxxxxxxx, +849xxxxxxxx).');
      }
      return true;
    }),
], validationHandler, reservationController.bookingOtpPhone)

router.post('/', [
  body('phone').matches(/^\+?[0-9]{7,14}$/).optional({ checkFalsy: true }),
  body('email').isEmail().optional({ checkFalsy: true }).withMessage('Invalid email'),
  body('otpTarget').isString().optional().withMessage('Invalid otp target'),
  body('name').isString().notEmpty(),
  body('specialRequest').isString().optional(),
  body('reservationDate').isDate(),
  body('reservationTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
  body('guestCount').isInt({ min: 1 }),
  //body('selector').isString(),
  body('otp').isInt(),
  body('accountId').optional({ checkFalsy: true }).isMongoId(),
],
  reservationController.createReservation);

router.put('/:id', [
  param('id').isMongoId().optional().withMessage('Invalid reservation ID'),
  body('phone').matches(/^\+?[1-9][0-9]{7,14}$/).optional().withMessage('Invalid phone number'),
  body('email').isEmail().optional().withMessage('Invalid email'),
  body('name').isString().notEmpty().optional().withMessage('Name is required'),
  body('reservationDate').isDate().optional().withMessage('Invalid reservation date'),
  body('reservationTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().withMessage('Invalid time format'),
  body('guestCount').isInt({ min: 1 }).optional().withMessage('Guest count must be at least 1'),
],
  validationHandler,
  reservationController.updateReservation);

router.get('/', reservationController.getReservations);

router.delete('/:id', [
  param('id').isMongoId()
], reservationController.deleteReservation);

module.exports = router;
