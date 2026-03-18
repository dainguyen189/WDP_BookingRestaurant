const express = require('express');
const { register, login, sendEmailVerification, verifyEmail, sendPhoneOtp, verifyPhone } = require('../controller/auth');
const router = express.Router();

router.post('/register',register);
router.post('/login',login)

// Verification
router.post('/verify/email/send', sendEmailVerification);
router.get('/verify/email/callback', verifyEmail);
router.post('/verify/phone/send-otp', sendPhoneOtp);
router.post('/verify/phone/confirm', verifyPhone);

module.exports = router;