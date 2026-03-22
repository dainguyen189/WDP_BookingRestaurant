const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user');
const createError = require('../util/errorHandle');
const cache = require('../util/cache');
const emailService = require('../services/email.service');
const sms = require('../services/sms.service');

const register = async (req, res, next) => {

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const existingUser = await User.find({ $or: [{ username: req.body.username }, { email: req.body.email }] });
    if (existingUser.length > 0) {
      next(createError(400, "Username or email already exists!"));
      return;
    }

    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword,
      phone: req.body.phone || null,

    })

    await newUser.save();

    const formatedUser = res.status(201).json(newUser);
  } catch (err) {
    next(err);
  }



}

const login = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return next(createError(404, "User with this email not found!"));
    }
    const password = await bcrypt.compare(req.body.password, user.password);
    if (!password) {
      return next(createError(400, "Wrong password !"));
    }

    // Tạo token với id và role
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Loại bỏ password từ user object trước khi trả về client
    const userWithoutPassword = { ...user._doc };
    delete userWithoutPassword.password;

    // Đặt cookie và trả về response
    res.cookie("access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // true trong production
      sameSite: 'lax', // hoặc 'none' nếu API và client ở domain khác nhau
      maxAge: 24 * 60 * 60 * 1000 // 24 giờ
    }).status(200).json({
      ...userWithoutPassword,
      token // Gửi thêm token trong response body để frontend có thể lưu
    });
  } catch (err) {
    next(createError(500, "Login failed!"));
  }
}

// Email verification: send link
const sendEmailVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return next(createError(404, 'User not found'));

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return next(createError(500, 'Email server not configured'));
    }

    const token = crypto.randomBytes(24).toString('hex');
    const key = `verify_email_${user._id}`;
    cache.set(key, token, 60 * 60); // 1 hour

    const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${token}&uid=${user._id}`;
    await emailService.sendBookingConfirm({
      email: user.email,
      name: user.username,
      otp: `Nhấp để xác nhận: ${verifyUrl}`,
    });

    return res.status(200).json({ success: true, message: 'Email xác thực đã được gửi.' });
  } catch (err) {
    next(err);
  }
}

// Email verification: verify link
const verifyEmail = async (req, res, next) => {
  try {
    const { token, uid } = req.query;
    const key = `verify_email_${uid}`;
    const saved = cache.get(key);
    if (!saved || saved !== token) return next(createError(400, 'Liên kết xác thực không hợp lệ/đã hết hạn'));
    cache.del(key);
    await User.findByIdAndUpdate(uid, { is_verified_email: true });
    return res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

// Phone verification: send OTP
const sendPhoneOtp = async (req, res, next) => {
  try {
    const { phone, userId } = req.body;
    if (!phone) return next(createError(400, 'Phone is required'));
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    if (!/^[0-9]{9,15}$/.test(cleanPhone)) return next(createError(400, 'Invalid phone'));

    if (!process.env.ESMS_API_KEY || !process.env.ESMS_SECRET_KEY) {
      return next(createError(500, 'SMS server not configured'));
    }

    const user = userId ? await User.findById(userId) : await User.findOne({ phone: cleanPhone });
    if (!user) return next(createError(404, 'User not found'));

    const otp = ('' + Math.floor(100000 + Math.random() * 900000));
    const key = `verify_phone_${user._id}`;
    cache.set(key, otp, 300);

    await sms.sendEsms({ phone: cleanPhone, code: otp, requestId: crypto.randomBytes(4).toString('hex') });
    return res.status(200).json({ success: true, message: 'OTP đã được gửi.' });
  } catch (err) {
    next(err);
  }
}

// Phone verification: verify OTP
const verifyPhone = async (req, res, next) => {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) return next(createError(400, 'Thiếu thông tin'));
    const key = `verify_phone_${userId}`;
    const saved = cache.get(key);
    if (!saved || saved !== otp) return next(createError(400, 'OTP không hợp lệ/đã hết hạn'));
    cache.del(key);
    await User.findByIdAndUpdate(userId, { is_verified_phone: true });
    return res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register, login,
  sendEmailVerification,
  verifyEmail,
  sendPhoneOtp,
  verifyPhone
}
